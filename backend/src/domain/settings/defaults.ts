export const DEFAULT_SKILLS = {
  writing: [
    "Структура: введение, 5 глав, заключение",
    "Практические примеры и чеклисты",
    "Короткий HTML без лишней разметки",
  ],
  research: ["Опирайся на общеизвестные best practices", "Не выдумывай несуществующие стандарты"],
};

export const DEFAULT_RULES = {
  tokenBudget: "Минимум токенов: без воды, без повторов, без маркетинг-фраз",
  format: "Ответ только валидный HTML-фрагмент статьи (h1/h2/p/ul/li/code/pre)",
  language: "Русский язык, деловой тон",
  quality: [
    "Есть введение",
    "Ровно 5 разделов h2",
    "Есть заключение",
    "Есть практический чеклист",
  ],
};

export const DEFAULT_TELEGRAM_SOURCES = {
  channels: [] as string[],
};
