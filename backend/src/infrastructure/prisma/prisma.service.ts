import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_RULES,
  DEFAULT_SKILLS,
  DEFAULT_TELEGRAM_SOURCES,
} from "../../domain/settings/defaults";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    const count = await this.marvinSettings.count();
    if (count === 0) {
      await this.marvinSettings.create({
        data: {
          skills: JSON.stringify(DEFAULT_SKILLS),
          rules: JSON.stringify(DEFAULT_RULES),
          telegramSources: JSON.stringify(DEFAULT_TELEGRAM_SOURCES),
        },
      });
      return;
    }

    // Keep existing settings in sync with media-capable defaults when keys are missing.
    const current = await this.marvinSettings.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!current) return;
    let skills = current.skills;
    let rules = current.rules;
    let changed = false;
    try {
      const parsed = JSON.parse(skills) as Record<string, unknown>;
      if (!parsed.media) {
        parsed.media = DEFAULT_SKILLS.media;
        if (Array.isArray(parsed.writing)) {
          const writing = parsed.writing as string[];
          for (const tip of DEFAULT_SKILLS.writing.slice(-2)) {
            if (!writing.includes(tip)) writing.push(tip);
          }
        }
        skills = JSON.stringify(parsed);
        changed = true;
      }
    } catch {
      /* keep as-is */
    }
    try {
      const parsed = JSON.parse(rules) as Record<string, unknown>;
      if (!parsed.media) {
        parsed.media = DEFAULT_RULES.media;
        parsed.format = DEFAULT_RULES.format;
        if (Array.isArray(parsed.quality)) {
          const quality = parsed.quality as string[];
          for (const tip of DEFAULT_RULES.quality) {
            if (!quality.includes(tip)) quality.push(tip);
          }
        }
        rules = JSON.stringify(parsed);
        changed = true;
      }
    } catch {
      /* keep as-is */
    }
    if (changed) {
      await this.marvinSettings.update({
        where: { id: current.id },
        data: { skills, rules },
      });
    }
  }
}
