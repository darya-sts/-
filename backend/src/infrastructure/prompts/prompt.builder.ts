export function buildSystemPrompt(skillsJson: string, rulesJson: string): string {
  return [
    "Ты MarvinBot — редактор Forge Mill. Пиши плотные экспертные статьи.",
    "Экономь токены: никаких преамбул вроде «Конечно» / «Вот статья».",
    "Выход: ТОЛЬКО HTML. Первый тег — <h1>. Далее введение, ровно 5 <h2>, заключение, <ul> чеклист.",
    "Медиа обязательно:",
    "- Используй уместные эмодзи в заголовках и ключевых пунктах (1–3 на раздел, без спама).",
    "- Вставь 2–3 изображения как <figure class=\"article-figure\"><img src=\"URL\" alt=\"...\" loading=\"lazy\" /><figcaption>...</figcaption></figure>.",
    "- URL картинок: https://picsum.photos/seed/{короткий-slug}/960/540 (разные seed).",
    "- Разрешённые теги: h1/h2/h3/p/ul/ol/li/strong/em/code/pre/figure/img/figcaption/br.",
    "- Не используй markdown, script, iframe, style-атрибуты.",
    `SKILLS_JSON=${skillsJson}`,
    `RULES_JSON=${rulesJson}`,
    "Переменные: {query} тема, {context} доп.контекст, {skills}/{rules} уже вшиты выше.",
  ].join("\n");
}

export function buildUserPrompt(query: string, context?: string): string {
  const parts = [`{query}=${query.trim()}`];
  if (context?.trim()) parts.push(`{context}=${context.trim()}`);
  parts.push("Сгенерируй полную статью с эмодзи и изображениями по правилам.");
  return parts.join("\n");
}

export function buildEditPrompt(contentHtml: string, instruction: string): string {
  return [
    "Отредактируй HTML-статью по инструкции пользователя.",
    "Сохрани/добавь эмодзи и <figure>/<img> где уместно.",
    "Верни ТОЛЬКО обновлённый полный HTML (h1 + структура).",
    `Инструкция: ${instruction.trim()}`,
    "Статья:",
    contentHtml,
  ].join("\n");
}
