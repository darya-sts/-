import { Injectable, Logger } from "@nestjs/common";
import { GenerateResult } from "../../domain/article/article.types";
import { buildEditPrompt, buildSystemPrompt, buildUserPrompt } from "../prompts/prompt.builder";
import { ensureArticleMedia } from "./media.enricher";
import { runQualityChecklist } from "./quality.checklist";

@Injectable()
export class MarvinBotClient {
  private readonly logger = new Logger(MarvinBotClient.name);
  private readonly baseUrl = process.env.MARVINBOT_API_BASE || "https://api.deepseek.com";
  private readonly model = process.env.MARVINBOT_MODEL || "deepseek-chat";

  private get apiKey(): string {
    const key = process.env.MARVINBOT_API_KEY || process.env.DEEPSEEK_API_KEY || "";
    if (!key) throw new Error("MARVINBOT_API_KEY / DEEPSEEK_API_KEY is not set");
    return key;
  }

  async generateArticle(input: {
    query: string;
    context?: string;
    skills: string;
    rules: string;
  }): Promise<GenerateResult> {
    const system = buildSystemPrompt(input.skills, input.rules);
    const user = buildUserPrompt(input.query, input.context);
    const { text, tokens } = await this.chat(system, user);
    return this.toResult(text, tokens);
  }

  async editArticle(input: {
    contentHtml: string;
    instruction: string;
    skills: string;
    rules: string;
  }): Promise<GenerateResult> {
    const system = buildSystemPrompt(input.skills, input.rules);
    const user = buildEditPrompt(input.contentHtml, input.instruction);
    const { text, tokens } = await this.chat(system, user);
    return this.toResult(text, tokens);
  }

  async *streamGenerate(input: {
    query: string;
    context?: string;
    skills: string;
    rules: string;
  }): AsyncGenerator<{ type: "token" | "done"; data: string | GenerateResult }> {
    const system = buildSystemPrompt(input.skills, input.rules);
    const user = buildUserPrompt(input.query, input.context);
    let full = "";
    let tokens = 0;
    for await (const chunk of this.streamChat(system, user)) {
      if (chunk.type === "token") {
        full += chunk.data;
        yield chunk;
      } else {
        tokens = chunk.tokens;
      }
    }
    yield { type: "done", data: this.toResult(full, tokens) };
  }

  private toResult(text: string, tokens: number): GenerateResult {
    const rawHtml = this.extractHtml(text);
    const title = this.extractTitle(rawHtml) || "Без названия";
    const html = ensureArticleMedia(rawHtml, title);
    const quality = runQualityChecklist(html);
    return {
      title: this.extractTitle(html) || title,
      contentHtml: html,
      tags: this.extractTags(html, title),
      tokenUsed: tokens,
      qualityPassed: quality.passed,
      qualityNotes: quality.notes,
    };
  }

  private extractHtml(raw: string): string {
    const trimmed = raw.trim();
    const fence = trimmed.match(/```html([\s\S]*?)```/i);
    if (fence) return fence[1].trim();
    const start = trimmed.indexOf("<h1");
    return start >= 0 ? trimmed.slice(start).trim() : trimmed;
  }

  private extractTitle(html: string): string {
    const m = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
  }

  private extractTags(html: string, title: string): string[] {
    const words = `${title} ${html}`
      .replace(/<[^>]+>/g, " ")
      .toLowerCase()
      .split(/[^a-zа-яё0-9+#-]+/i)
      .filter((w) => w.length > 4);
    return Array.from(new Set(words)).slice(0, 6);
  }

  private async chat(system: string, user: string): Promise<{ text: string; tokens: number }> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        max_tokens: 2200,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`MarvinBot API error ${res.status}: ${body.slice(0, 400)}`);
      throw new Error(`MarvinBot generate failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    return {
      text: data.choices?.[0]?.message?.content || "",
      tokens: data.usage?.total_tokens || 0,
    };
  }

  private async *streamChat(
    system: string,
    user: string,
  ): AsyncGenerator<{ type: "token"; data: string } | { type: "usage"; tokens: number }> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        max_tokens: 2200,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`MarvinBot stream failed: ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let tokens = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
            usage?: { total_tokens?: number };
          };
          const token = json.choices?.[0]?.delta?.content;
          if (token) yield { type: "token", data: token };
          if (json.usage?.total_tokens) tokens = json.usage.total_tokens;
        } catch {
          // ignore partial json
        }
      }
    }
    yield { type: "usage", tokens };
  }
}
