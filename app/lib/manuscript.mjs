function nextManuscriptId(chapters) {
  const ids = chapters.flatMap((chapter) => [chapter.id, ...chapter.pages.map((page) => page.id)]);
  return Math.max(0, ...ids.map(Number)) + 1;
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
