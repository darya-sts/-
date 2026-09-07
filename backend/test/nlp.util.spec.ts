import {
  classifyCategory,
  computeRelevanceScore,
  cosineSimilarity,
  deduplicateBySimilarity,
  isAdvertisement,
  isExpertPost,
  isValidPostLength,
  clampArticle,
  estimateTokens,
  compressLocally,
  formatNovosibirsk,
} from '../src/common/utils/nlp.util';

describe('nlp.util — фильтрация', () => {
  it('отсекает короткие посты', () => {
    expect(isValidPostLength('короткий')).toBe(false);
    expect(isValidPostLength('Это достаточно длинный пост для прохождения фильтра длины.')).toBe(
      true,
    );
  });

  it('детектит рекламу', () => {
    expect(isAdvertisement('Купить курс со скидка прямо сейчас')).toBe(true);
    expect(isAdvertisement('Новый релиз LLM с tool calling')).toBe(false);
  });
});

describe('nlp.util — классификация и score', () => {
  it('классифицирует агентные темы', () => {
    const cat = classifyCategory('Новый multi-agent фреймворк и prompt правила для агентов');
    expect(cat).toBe('Скилы и правила для Агентов');
  });

  it('считает релевантность с весами', () => {
    const score = computeRelevanceScore({
      text: 'Новый агент LLM фреймворк для монетизации',
      publishedAt: new Date(),
      keywords: ['агент', 'LLM', 'монетизация'],
      channelWeight: 5,
      views: 5000,
      forwards: 20,
      reactions: 50,
    });
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('свежесть влияет на score', () => {
    const fresh = computeRelevanceScore({
      text: 'агент LLM',
      publishedAt: new Date(),
      keywords: ['агент'],
      channelWeight: 3,
    });
    const old = computeRelevanceScore({
      text: 'агент LLM',
      publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      keywords: ['агент'],
      channelWeight: 3,
    });
    expect(fresh).toBeGreaterThan(old);
  });
});

describe('nlp.util — expert и дедуп', () => {
  it('ставит #expert для известных авторов и tech-постов', () => {
    expect(
      isExpertPost(
        'Andrej Karpathy описал архитектуру агента',
        null,
        ['Andrej Karpathy'],
      ),
    ).toBe(true);

    expect(
      isExpertPost(
        'Новый benchmark и paper на arxiv.org с метриками 92.5% и архитектура transformer',
        null,
        [],
      ),
    ).toBe(true);
  });

  it('удаляет дубли по cosine similarity', () => {
    const posts = [
      { text: 'OpenAI выпустила обновление GPT API с tool calling' },
      { text: 'OpenAI выпустила обновление GPT API с поддержкой tool calling' },
      { text: 'Совершенно другая новость про Midjourney' },
    ];
    const unique = deduplicateBySimilarity(posts, 0.85);
    expect(unique.length).toBe(2);
    expect(cosineSimilarity(posts[0].text, posts[1].text)).toBeGreaterThan(0.7);
  });
});

describe('nlp.util — статья и токены', () => {
  it('сжимает и ограничивает длину статьи', () => {
    const summary = compressLocally('Первое предложение важное. Второе тоже. Третье лишнее.');
    expect(summary.split('.').filter(Boolean).length).toBeLessThanOrEqual(3);
    const long = 'x'.repeat(4000);
    expect(clampArticle(long, 2500).length).toBeLessThanOrEqual(2510);
    expect(estimateTokens('abcd'.repeat(100))).toBe(100);
  });

  it('форматирует новосибирское время', () => {
    const formatted = formatNovosibirsk(new Date('2026-03-07T01:00:00Z'));
    expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});