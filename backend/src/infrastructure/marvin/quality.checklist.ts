export function runQualityChecklist(html: string): { passed: boolean; notes: string[] } {
  const notes: string[] = [];
  const hasH1 = /<h1[\s>]/i.test(html);
  const h2 = html.match(/<h2[\s>]/gi) || [];
  const hasList = /<(ul|ol)[\s>]/i.test(html);
  const hasClose =
    /заключен/i.test(html) || /вывод/i.test(html) || /итог/i.test(html) || h2.length >= 5;
  const lengthOk = html.replace(/<[^>]+>/g, "").trim().length >= 800;

  if (!hasH1) notes.push("Нет заголовка h1");
  if (h2.length < 5) notes.push(`Ожидалось 5 глав h2, сейчас ${h2.length}`);
  if (!hasList) notes.push("Нет практического чеклиста (ul/ol)");
  if (!hasClose) notes.push("Слабое/отсутствует заключение");
  if (!lengthOk) notes.push("Статья слишком короткая");

  return { passed: notes.length === 0, notes };
}
