import {fonts} from './fonts.mjs';
export const uid = () => globalThis.crypto.randomUUID();
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const textHtml = (text) => String(text).split(/\r?\n\s*\r?\n/).map(p => `<p>${escapeHtml(p).replace(/\r?\n/g, '<br>')}</p>`).join('');
export const plainText = (html) => String(html).replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(?:p|h[1-6]|li|tr)>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
export const tocEntries = book => book.chapters.map((chapter,index)=>({chapter,index})).filter(({chapter})=>!chapter.tocHidden);
export const tocTitle = book => book.print.tocTitle?.trim() || '목차';
export function createBook() {
  return { version: 1, id: uid(), updatedAt: new Date().toISOString(), metadata: { title: '제목 없는 책', subtitle: '', author: '', language: 'ko', publisher: '', description: '' }, chapters: [{ id: uid(), title: '첫 번째 이야기', html: '<p>여기에 첫 문장을 적어 보세요.</p>' }], print: { width: 148, height: 210, bleed: 3, marginInner: 22, marginOuter: 18, marginTop: 22, marginBottom: 22, fontSize: 11, lineHeight: 1.8, font: 'serif', indent: 1, paragraphGap: 0.5, rightStart: true, toc: true, paperThickness: 0.1, binding: 0.8, spineOverride: null }, cover: { color: '#244c43', ink: '#fff9e9', image: '', template: 'classic', flap: 0, backText: '', titleSize: 32 }, ebook: { fontSize: 18, width: 390, dark: false }, importReports: [] };
}
export function validateBook(book) {
  if (!book || book.version !== 1 || typeof book.id !== 'string') throw new Error('지원하지 않는 프로젝트 형식입니다.');
  if (!book.metadata || !['title','author','subtitle','language','publisher','description'].every(k => typeof book.metadata[k] === 'string')) throw new Error('책 정보가 올바르지 않습니다.');
  if (!Array.isArray(book.chapters) || !book.chapters.length || book.chapters.length > 1000) throw new Error('장 구성을 확인해 주세요.');
  const ids = new Set();
  for (const ch of book.chapters) {
    if (typeof ch.id !== 'string' || ids.has(ch.id) || typeof ch.title !== 'string' || typeof ch.html !== 'string') throw new Error('중복되거나 손상된 장입니다.');
    ids.add(ch.id);
    if(ch.tocHidden!==undefined&&typeof ch.tocHidden!=='boolean')throw new Error('목차 포함 설정이 올바르지 않습니다.');
    if (/<\s*(script|iframe|object|embed|style|link|base|form)\b|\son\w+\s*=|javascript\s*:|<img[^>]+src\s*=\s*['"]?https?:/i.test(ch.html)) throw new Error('원고에 허용하지 않는 외부 또는 실행 콘텐츠가 있습니다.');
  }
  const ranges = { width: [80, 420], height: [100, 594], bleed: [0, 10], marginInner: [5, 60], marginOuter: [5, 60], marginTop: [5, 60], marginBottom: [5, 60], fontSize: [7, 30], lineHeight: [1, 3], indent: [0, 4], paragraphGap: [0, 3], paperThickness: [0.03, 0.3], binding: [0, 5] };
  if(book.print?.tocTitle!==undefined&&(typeof book.print.tocTitle!=='string'||book.print.tocTitle.length>200))throw new Error('목차 제목을 확인해 주세요.');
  for (const [k, [min,max]] of Object.entries(ranges)) if (!Number.isFinite(book.print?.[k]) || book.print[k] < min || book.print[k] > max) throw new Error(`책 설정을 확인해 주세요: ${k}`);
  if (book.print.width - book.print.marginInner - book.print.marginOuter < 30 || book.print.height - book.print.marginTop - book.print.marginBottom < 40) throw new Error('본문을 넣을 공간이 부족합니다.');
  if (!fonts[book.print.font] || (book.print.headingFont !== undefined && !fonts[book.print.headingFont])) throw new Error('글꼴 설정이 올바르지 않습니다.');
  if (!book.cover || !/^#[0-9a-f]{6}$/i.test(book.cover.color) || !/^#[0-9a-f]{6}$/i.test(book.cover.ink)) throw new Error('표지 색상이 올바르지 않습니다.');
  if(!['classic','editorial','minimal'].includes(book.cover.template)||!Number.isFinite(book.cover.titleSize)||book.cover.titleSize<16||book.cover.titleSize>64||typeof book.cover.backText!=='string')throw new Error('표지 설정이 올바르지 않습니다.');
  if(book.print.spineOverride!==null&&(!Number.isFinite(book.print.spineOverride)||book.print.spineOverride<0||book.print.spineOverride>100))throw new Error('책등 값을 확인해 주세요.');
  if(!book.ebook||!Number.isFinite(book.ebook.fontSize)||book.ebook.fontSize<14||book.ebook.fontSize>28||![390,700].includes(book.ebook.width)||typeof book.ebook.dark!=='boolean')throw new Error('전자책 설정을 확인해 주세요.');
  if(!Array.isArray(book.importReports)||typeof book.updatedAt!=='string')throw new Error('프로젝트 기록이 올바르지 않습니다.');
  if (book.cover.image && !/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(book.cover.image)) throw new Error('표지 이미지가 올바르지 않습니다.');
  if (!Number.isFinite(book.cover.flap) || book.cover.flap < 0 || book.cover.flap > 120) throw new Error('날개 폭을 확인해 주세요.');
  return book;
}
export function migrateLegacy(draft) {
  const book = createBook();
  book.metadata.title = String(draft.title || book.metadata.title);
  book.metadata.author = String(draft.author || '');
  book.metadata.subtitle = String(draft.subtitle || '');
  if (Array.isArray(draft.manuscript) && draft.manuscript.length) book.chapters = draft.manuscript.map(c => ({ id: uid(), title: String(c.title || '새 장'), html: (c.pages || []).map(p => /<\/?(?:p|h[1-6]|span|strong)\b/i.test(p.content || '') ? String(p.content) : textHtml(p.content || '')).join('') }));
  book.importReports.push({ name: '기존 PAGEONE 초안', warnings: ['수동 페이지를 장으로 합쳤습니다. 원본 초안은 변경하지 않았습니다. 표지는 별도로 확인해 주세요.'] });
  return book;
}
export function coverGeometry(book, pageCount) {
  const p = book.print;
  const spine = p.spineOverride ?? Math.ceil(pageCount / 2) * p.paperThickness + p.binding;
  return { spine, width: p.width * 2 + spine + book.cover.flap * 2 + p.bleed * 2, height: p.height + p.bleed * 2 };
}
