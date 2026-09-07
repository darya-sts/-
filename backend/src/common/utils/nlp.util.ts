import { createHash } from 'crypto';
import {
  AD_KEYWORDS,
  CATEGORIES,
  CATEGORY_KEYWORDS,
  Category,
  EXPERT_TECH_KEYWORDS,
} from '../constants/marvinbot.constants';

/** Нормализация текста перед NLP */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Удаление стоп-слов (лёгкая очистка для экономии токенов) */
export function stripStopWords(text: string): string {
  const stop = new Set([
    'это',
    'как',
    'для',
    'или',
    'при',
    'что',
    'все',
    'так',
    'уже',
    'еще',
    'ещё',
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
  ]);
  return text
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w.toLowerCase()))
    .join(' ');
}

export function contentHash(text: string): string {
  return createHash('sha256').update(normalizeText(text).toLowerCase()).digest('hex');
}

/** Простая оценка рекламы */
export function isAdvertisement(text: string): boolean {
  const lower = text.toLowerCase();
  return AD_KEYWORDS.some((k) => lower.includes(k));
}

export function isValidPostLength(text: string, min = 30, max = 5000): boolean {
  const len = normalizeText(text).length;
  return len >= min && len <= max;
}

/** Классификация категории по ключевым словам */
export function classifyCategory(text: string, fallback: Category = 'Прочее'): Category {
  const lower = text.toLowerCase();
  let best: Category = fallback;
  let bestScore = 0;

  for (const category of CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category];
    const score = keywords.reduce(
      (acc, kw) => acc + (lower.includes(kw.toLowerCase()) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return bestScore > 0 ? best : fallback;
}

/** Грубая оценка «уверенного» тона (суррогат sentiment > 0.7) */
export function confidentToneScore(text: string): number {
  const lower = text.toLowerCase();
  const positiveSignals = [
    /\d+%/,
    /\d+\.\d+/,
    /исследован/,
    /benchmark/,
    /результат/,
    /доказа/,
    /согласно/,
    /данные/,
    /метрика/,
    /arxiv/,
    /paper/,
  ];
  const hedgeSignals = [/возможно/, /кажется/, /может быть/, /наверное/, /вероятно/];

  let score = 0.5;
  for (const re of positiveSignals) {
    if (re.test(lower)) score += 0.08;
  }
  for (const re of hedgeSignals) {
    if (re.test(lower)) score -= 0.1;
  }
  return Math.max(0, Math.min(1, score));
}

export function hasTechnicalDetails(text: string): boolean {
  const lower = text.toLowerCase();
  if (/```|https?:\/\/|arxiv\.org|github\.com/.test(lower)) return true;
  return EXPERT_TECH_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

export function mentionsExpert(text: string, experts: string[]): boolean {
  const lower = text.toLowerCase();
  return experts.some((name) => lower.includes(name.toLowerCase()));
}

export function isExpertPost(
  text: string,
  author: string | null | undefined,
  experts: string[],
): boolean {
  if (author && mentionsExpert(author, experts)) return true;
  if (mentionsExpert(text, experts)) return true;
  if (hasTechnicalDetails(text) && confidentToneScore(text) > 0.7) return true;
  return false;
}

/** Cosine similarity для bag-of-words векторов */
export function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function bagOfWords(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tokens) map.set(t, (map.get(t) || 0) + 1);
  return map;
}

export function cosineSimilarity(a: string, b: string): number {
  const va = bagOfWords(tokenize(a));
  const vb = bagOfWords(tokenize(b));
  const keys = new Set([...va.keys(), ...vb.keys()]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const x = va.get(k) || 0;
    const y = vb.get(k) || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Удаление дублей по cosine similarity */
export function deduplicateBySimilarity<T extends { text: string }>(
  posts: T[],
  threshold = 0.85,
): T[] {
  const result: T[] = [];
  for (const post of posts) {
    const dup = result.some((r) => cosineSimilarity(r.text, post.text) >= threshold);
    if (!dup) result.push(post);
  }
  return result;
}

export interface ScoreInput {
  text: string;
  publishedAt: Date;
  now?: Date;
  keywords: string[];
  channelWeight: number; // 1–5
  views?: number | null;
  forwards?: number | null;
  reactions?: number | null;
}

/**
 * Score релевантности 0–100:
 * 40% keywords, 30% freshness, 20% channel weight, 10% engagement
 */
export function computeRelevanceScore(input: ScoreInput): number {
  const now = input.now || new Date();
  const lower = input.text.toLowerCase();

  // Keywords 40%
  let keywordHits = 0;
  for (const kw of input.keywords) {
    if (kw && lower.includes(kw.toLowerCase())) keywordHits += 1;
  }
  const keywordScore =
    input.keywords.length === 0
      ? 50
      : Math.min(100, (keywordHits / Math.max(1, Math.min(input.keywords.length, 5))) * 100);

  // Freshness 30%
  const ageHours = (now.getTime() - input.publishedAt.getTime()) / (1000 * 60 * 60);
  const freshnessScore = ageHours < 6 ? 100 : ageHours < 12 ? 70 : ageHours < 24 ? 40 : 10;

  // Channel weight 20%
  const weightScore = (Math.max(1, Math.min(5, input.channelWeight)) / 5) * 100;

  // Engagement 10%
  const views = input.views || 0;
  const forwards = input.forwards || 0;
  const reactions = input.reactions || 0;
  const rawEngagement = Math.log10(1 + views) * 20 + forwards * 2 + reactions;
  const engagementScore = Math.min(100, rawEngagement);

  const score =
    keywordScore * 0.4 + freshnessScore * 0.3 + weightScore * 0.2 + engagementScore * 0.1;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/** Локальное сжатие поста до 1–2 предложений без LLM */
export function compressLocally(text: string, maxSentences = 2): string {
  const cleaned = normalizeText(text);
  const sentences = cleaned
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (sentences.length === 0) {
    return cleaned.slice(0, 220) + (cleaned.length > 220 ? '…' : '');
  }
  return sentences.slice(0, maxSentences).join(' ');
}

/** Оценка токенов (приблизительно: 1 токен ≈ 4 символа для смешанного текста) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Обрезка статьи до maxChars с сохранением структуры */
export function clampArticle(content: string, maxChars = 2500): string {
  if (content.length <= maxChars) return content;
  const cut = content.slice(0, maxChars);
  const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. '));
  return (lastBreak > maxChars * 0.7 ? cut.slice(0, lastBreak + 1) : cut).trim() + '\n\n…';
}

/** Формат даты Новосибирск DD.MM.YYYY HH:mm */
export function formatNovosibirsk(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Novosibirsk',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', '');
}

export function extractTitle(text: string): string {
  const firstLine = normalizeText(text).split('\n')[0] || text;
  const cleaned = firstLine.replace(/^[#*\-\s]+/, '').trim();
  return cleaned.length > 80 ? cleaned.slice(0, 77) + '…' : cleaned || 'Без заголовка';
}

export function detectTopic(categories: string[]): string {
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c, (counts.get(c) || 0) + 1);
  let best = 'тренды ИИ';
  let n = 0;
  for (const [k, v] of counts) {
    if (v > n) {
      n = v;
      best = k;
    }
  }
  return best;
}