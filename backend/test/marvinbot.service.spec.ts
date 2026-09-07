import { MarvinbotService } from '../src/modules/marvinbot/marvinbot.service';

describe('MarvinbotService local article', () => {
  const service = new MarvinbotService(
    { get: (k: string) => (k === 'MAX_ARTICLE_CHARS' ? '2500' : undefined) } as any,
    { tokenUsage: { create: async () => ({}) } } as any,
    { get: async () => null, set: async () => undefined } as any,
    { warn: () => undefined, info: () => undefined } as any,
  );

  it('генерирует структурированную статью ≤ 2500 символов', () => {
    const content = service.buildLocalArticle('Инструменты ИИ', [
      {
        text: 'OpenAI выпустила API update. Benchmark показал рост. https://openai.com/blog',
        summary: 'OpenAI обновила API и улучшила benchmark.',
        category: 'Инструменты ИИ',
        isExpert: true,
        sourceUsername: 'openai',
      },
      {
        text: 'LangChain добавил skills для агентов и multi-agent orchestration.',
        summary: 'LangChain усилил skills и multi-agent.',
        category: 'Скилы и правила для Агентов',
        isExpert: false,
        sourceUsername: 'ai_tools_daily',
      },
      {
        text: 'Кейс монетизации AI-агента: $12k MRR за квартал.',
        summary: 'Кейс монетизации AI-агента с $12k MRR.',
        category: 'Монетизация с помощью ИИ',
        isExpert: false,
        sourceUsername: 'ai_business',
      },
    ]);

    expect(content).toContain('## Введение');
    expect(content).toContain('## Ключевые тренды');
    expect(content).toContain('## Практические рекомендации');
    expect(content).toContain('## Инструменты и ресурсы');
    expect(content).toContain('## Заключение');
    expect(content).toContain('## Источники');
    expect(content).toContain('🟣 #expert');
    expect(content.length).toBeGreaterThan(800);
    expect(content.length).toBeLessThanOrEqual(2500);
  });
});