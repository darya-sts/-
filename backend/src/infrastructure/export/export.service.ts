import PDFDocument from "pdfkit";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string };

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).trim();
}

function parseBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const re =
    /<(h1|h2|h3|p|li|figcaption)(\s[^>]*)?>([\s\S]*?)<\/\1>|<img\b([^>]*)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase().startsWith("<img")) {
      const attrs = m[4] || "";
      const src = (attrs.match(/\bsrc=["']([^"']+)["']/i) || [])[1] || "";
      const alt = (attrs.match(/\balt=["']([^"']*)["']/i) || [])[1] || "Изображение";
      if (src) blocks.push({ type: "image", src, alt: decodeEntities(alt) });
      continue;
    }
    const tag = (m[1] || "").toLowerCase();
    const text = stripTags(m[3] || "");
    if (!text) continue;
    if (tag === "h1") blocks.push({ type: "heading", level: 1, text });
    else if (tag === "h2") blocks.push({ type: "heading", level: 2, text });
    else if (tag === "h3") blocks.push({ type: "heading", level: 3, text });
    else blocks.push({ type: "paragraph", text });
  }
  if (blocks.length === 0) {
    const fallback = stripTags(
      html
        .replace(/<\/(p|h1|h2|h3|li|div)>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, ""),
    );
    for (const line of fallback.split(/\n+/)) {
      if (line.trim()) blocks.push({ type: "paragraph", text: line.trim() });
    }
  }
  return blocks;
}

async function fetchImage(src: string): Promise<Buffer | null> {
  try {
    if (src.startsWith("/")) return null;
    const res = await fetch(src, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") || "";
    if (!ctype.startsWith("image/")) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function exportPdf(title: string, html: string): Promise<Buffer> {
  const blocks = parseBlocks(html);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    void (async () => {
      try {
        doc.fontSize(18).text(title, { underline: true });
        doc.moveDown();
        for (const block of blocks) {
          if (block.type === "heading") {
            const size = block.level === 1 ? 16 : block.level === 2 ? 13 : 12;
            doc.moveDown(0.4);
            doc.fontSize(size).text(block.text, { align: "left" });
            doc.moveDown(0.2);
          } else if (block.type === "paragraph") {
            doc.fontSize(11).text(block.text, { align: "left" });
            doc.moveDown(0.3);
          } else {
            const img = await fetchImage(block.src);
            if (img) {
              try {
                doc.moveDown(0.3);
                doc.image(img, { fit: [480, 270], align: "center" });
                doc.moveDown(0.2);
                doc.fontSize(9).fillColor("#555555").text(block.alt, { align: "center" });
                doc.fillColor("#000000");
                doc.moveDown(0.4);
              } catch {
                doc.fontSize(10).text(`[Изображение: ${block.alt}] ${block.src}`);
              }
            } else {
              doc.fontSize(10).text(`[Изображение: ${block.alt}] ${block.src}`);
              doc.moveDown(0.3);
            }
          }
        }
        doc.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

export async function exportDocx(title: string, html: string): Promise<Buffer> {
  const blocks = parseBlocks(html);
  const children: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
    }),
  ];

  for (const block of blocks) {
    if (block.type === "heading") {
      children.push(
        new Paragraph({
          text: block.text,
          heading:
            block.level === 1
              ? HeadingLevel.HEADING_1
              : block.level === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3,
        }),
      );
    } else if (block.type === "paragraph") {
      children.push(
        new Paragraph({
          children: [new TextRun(block.text)],
          spacing: { after: 200 },
        }),
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun(`[Изображение: ${block.alt}] ${block.src}`)],
          spacing: { after: 200 },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}
