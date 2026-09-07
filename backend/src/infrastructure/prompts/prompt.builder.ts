export function buildSystemPrompt(skillsJson: string, rulesJson: string): string {
  return [
    "Ты MarvinBot — редактор Forge Mill. Пиши плотные экспертные статьи.",
    "Экономь токены: никаких преамбул вроде «Конечно» / «Вот статья».",
    "Выход: ТОЛЬКО HTML. Первый тег — <h1>. Далее введение, ровно 5 <h2>, заключение, <ul> чеклист.",
    `SKILLS_JSON=${skillsJson}`,
    `RULES_JSON=${rulesJson}`,
    "Переменные: {query} тема, {context} доп.контекст, {skills}/{rules} уже вшиты выше.",
  ].join("\n");
}

export function buildUserPrompt(query: string, context?: string): string {
  const parts = [`{query}=${query.trim()}`];
  if (context?.trim()) parts.push(`{context}=${context.trim()}`);
  parts.push("Сгенерируй полную статью по правилам.");
  return parts.join("\n");
}

export function buildEditPrompt(contentHtml: string, instruction: string): string {
  return [
    "Отредактируй HTML-статью по инструкции пользователя.",
    "Верни ТОЛЬКО обновлённый полный HTML (h1 + структура).",
    `Инструкция: ${instruction.trim()}`,
    "Статья:",
    contentHtml,
  ].join("\n");
}
