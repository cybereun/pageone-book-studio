function nextManuscriptId(chapters) {
  const ids = chapters.flatMap((chapter) => [chapter.id, ...chapter.pages.map((page) => page.id)]);
  return Math.max(0, ...ids.map(Number)) + 1;
}

function escapeEditorText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function sanitizeEditorHtml(value) {
  const withoutUnsafeBlocks = String(value || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(div)(?:\s[^>]*)?>/gi, "<p>")
    .replace(/<\/(div)>/gi, "</p>")
    .replace(/<(b)(?:\s[^>]*)?>/gi, "<strong>")
    .replace(/<\/(b)>/gi, "</strong>")
    .replace(/<(i)(?:\s[^>]*)?>/gi, "<em>")
    .replace(/<\/(i)>/gi, "</em>");
  const allowed = new Set(["p", "h2", "blockquote", "strong", "em", "u", "br"]);
  const fontSizes = { 1: 10, 2: 12, 3: 14, 4: 18, 5: 24, 6: 32, 7: 48 };
  return withoutUnsafeBlocks.replace(/<\/?([a-z0-9]+)(?:\s[^>]*)?>/gi, (tag, name) => {
    const normalized = String(name).toLowerCase();
    const closing = tag.startsWith("</");
    if (normalized === "span") {
      if (closing) return "</span>";
      const style = tag.match(/\sstyle\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
      const safeStyles = [];
      for (const declaration of style.split(";")) {
        const [rawProperty, ...rawValue] = declaration.split(":");
        const property = rawProperty?.trim().toLowerCase();
        const value = rawValue.join(":").trim();
        if (property === "font-family" && /^[\p{L}\p{N}\s,.'"()-]{1,80}$/u.test(value)) safeStyles.push(`font-family: ${value.replaceAll('"', "")}`);
        if (property === "font-size" && /^\d{1,2}px$/.test(value) && Number.parseInt(value, 10) >= 8 && Number.parseInt(value, 10) <= 72) safeStyles.push(`font-size: ${value}`);
      }
      return safeStyles.length ? `<span style="${safeStyles.join("; ")}">` : "<span>";
    }
    if (normalized === "font") {
      if (closing) return "</span>";
      const face = tag.match(/\sface\s*=\s*["']([^"']*)["']/i)?.[1]?.trim() ?? "";
      const size = tag.match(/\ssize\s*=\s*["']?([1-7])["']?/i)?.[1] ?? "";
      const safeStyles = [];
      if (/^[\p{L}\p{N}\s,.'"()-]{1,80}$/u.test(face)) safeStyles.push(`font-family: ${face.replaceAll('"', "")}`);
      if (size) safeStyles.push(`font-size: ${fontSizes[size]}px`);
      return safeStyles.length ? `<span style="${safeStyles.join("; ")}">` : "<span>";
    }
    if (!allowed.has(normalized)) return "";
    if (normalized === "br") return "<br>";
    return closing ? `</${normalized}>` : `<${normalized}>`;
  });
}

export function toEditorHtml(value) {
  const source = String(value || "");
  if (/<\/?(?:p|h2|blockquote|strong|em|u|br|span|font)\b/i.test(source)) return sanitizeEditorHtml(source);
  if (!source) return "<p><br></p>";
  return source.split(/\n{2,}/).map((paragraph) => `<p>${escapeEditorText(paragraph).replaceAll("\n", "<br>")}</p>`).join("");
}

export function plainTextFromEditorHtml(value) {
  return sanitizeEditorHtml(value)
    .replace(/<br>/gi, "\n")
    .replace(/<\/(?:p|h2|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function addManuscriptChapter(chapters) {
  const chapterId = nextManuscriptId(chapters);
  return [...chapters, {
    id: chapterId,
    kicker: `${chapters.length + 1}장`,
    title: "새 장 제목",
    pages: [{ id: chapterId + 1, content: "" }],
  }];
}

export function addManuscriptPage(chapters, chapterId, afterPageId) {
  const pageId = nextManuscriptId(chapters);
  return chapters.map((chapter) => {
    if (chapter.id !== chapterId) return chapter;
    const index = chapter.pages.findIndex((page) => page.id === afterPageId);
    const pages = [...chapter.pages];
    pages.splice(index < 0 ? pages.length : index + 1, 0, { id: pageId, content: "" });
    return { ...chapter, pages };
  });
}

export function updateManuscriptPage(chapters, chapterId, pageId, content) {
  return chapters.map((chapter) => chapter.id === chapterId
    ? { ...chapter, pages: chapter.pages.map((page) => page.id === pageId ? { ...page, content } : page) }
    : chapter);
}

export function removeManuscriptPage(chapters, chapterId, pageId) {
  return chapters.map((chapter) => {
    if (chapter.id !== chapterId) return chapter;
    if (chapter.pages.length === 1) return { ...chapter, pages: [{ ...chapter.pages[0], content: "" }] };
    return { ...chapter, pages: chapter.pages.filter((page) => page.id !== pageId) };
  });
}

export function removeManuscriptChapter(chapters, chapterId) {
  if (chapters.length === 1) return chapters;
  return chapters.filter((chapter) => chapter.id !== chapterId);
}

export function moveManuscriptChapter(chapters, chapterId, direction) {
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  const target = Math.min(chapters.length - 1, Math.max(0, index + Number(direction)));
  if (index < 0 || target === index) return chapters;
  const next = [...chapters];
  const [chapter] = next.splice(index, 1);
  next.splice(target, 0, chapter);
  return next;
}

export function buildTableOfContents(chapters, firstPage = 3) {
  let page = Number(firstPage) || 1;
  return chapters.map((chapter) => {
    const entry = {
      chapterId: chapter.id,
      kicker: chapter.kicker,
      title: chapter.title,
      startPage: page,
      pageCount: Math.max(1, chapter.pages.length),
    };
    page += entry.pageCount;
    return entry;
  });
}
