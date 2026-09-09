/** Ensures generated articles include emoji cues and at least a couple of images. */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "article";
}

function countImgs(html: string): number {
  return (html.match(/<img\b/gi) || []).length;
}

function hasEmoji(html: string): boolean {
  return /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html);
}

function buildFigure(seed: string, caption: string): string {
  const src = `https://picsum.photos/seed/${encodeURIComponent(seed)}/960/540`;
  return [
    `<figure class="article-figure">`,
    `<img src="${src}" alt="${caption}" width="960" height="540" loading="lazy" />`,
    `<figcaption>${caption}</figcaption>`,
    `</figure>`,
  ].join("");
}

/** Inject thematic stock images when the model omitted them. */
export function ensureArticleMedia(html: string, title: string): string {
  let out = html.trim();
  const seedBase = slugify(title);

  if (!hasEmoji(out)) {
    out = out.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/i, (_m, attrs, inner) => {
      const clean = String(inner).trim();
      if (/[\u{1F300}-\u{1FAFF}]/u.test(clean)) return `<h1${attrs}>${clean}</h1>`;
      return `<h1${attrs}>✨ ${clean}</h1>`;
    });
  }

  if (countImgs(out) === 0) {
    const hero = buildFigure(`${seedBase}-hero`, `Иллюстрация: ${title}`);
    if (/<\/h1>/i.test(out)) {
      out = out.replace(/<\/h1>/i, `</h1>\n${hero}`);
    } else {
      out = `${hero}\n${out}`;
    }
  }

  if (countImgs(out) < 2) {
    const mid = buildFigure(`${seedBase}-mid`, "Визуальный акцент раздела");
    const h2Matches = [...out.matchAll(/<\/h2>/gi)];
    if (h2Matches.length >= 3) {
      const third = h2Matches[2];
      const idx = (third.index || 0) + third[0].length;
      out = `${out.slice(0, idx)}\n${mid}${out.slice(idx)}`;
    } else if (/<\/p>/i.test(out)) {
      out = out.replace(/<\/p>/i, `</p>\n${mid}`);
    } else {
      out = `${out}\n${mid}`;
    }
  }

  return out;
}

export function insertImageHtml(src: string, alt = "Иллюстрация"): string {
  const safeSrc = src.trim();
  const safeAlt = alt.replace(/"/g, "&quot;").trim() || "Иллюстрация";
  return [
    `<figure class="article-figure">`,
    `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy" />`,
    `<figcaption>${safeAlt}</figcaption>`,
    `</figure>`,
  ].join("");
}

export function insertMediaIntoArticle(
  html: string,
  options: { emoji?: string; imageUrl?: string; alt?: string },
): string {
  let out = html;
  if (options.emoji?.trim()) {
    const emoji = options.emoji.trim();
    if (/<\/h1>/i.test(out)) {
      out = out.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/i, (_m, attrs, inner) => {
        const text = String(inner).trim();
        if (text.includes(emoji)) return `<h1${attrs}>${text}</h1>`;
        return `<h1${attrs}>${emoji} ${text}</h1>`;
      });
    } else {
      out = `${emoji} ${out}`;
    }
  }
  if (options.imageUrl?.trim()) {
    const figure = insertImageHtml(options.imageUrl, options.alt);
    if (/<\/h1>/i.test(out)) {
      out = out.replace(/<\/h1>/i, `</h1>\n${figure}`);
    } else {
      out = `${figure}\n${out}`;
    }
  }
  return out;
}
