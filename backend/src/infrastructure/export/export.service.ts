import PDFDocument from "pdfkit";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|h1|h2|h3|li|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function exportPdf(title: string, html: string): Promise<Buffer> {
  const text = stripHtml(html);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(11).text(text, { align: "left" });
    doc.end();
  });
}

export async function exportDocx(title: string, html: string): Promise<Buffer> {
  const text = stripHtml(html);
  const paragraphs = text.split(/\n+/).map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 200 },
      }),
  );
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          }),
          ...paragraphs,
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
