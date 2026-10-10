import {bookFonts} from './fonts.mjs';
import JSZip from 'jszip';
import { validateBook, escapeHtml as e, tocTitle } from './book.mjs';
import { cleanHtml, xhtml } from './html.mjs';
import { readArchive } from './archive.mjs';
const xhtmlDocument = (title, body) => `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ko" xml:lang="ko"><head><title>${e(title)}</title><link rel="stylesheet" type="text/css" href="book.css"/></head><body>${body}</body></html>`;
export async function packProject(book) {
  validateBook(book);
  const zip = new JSZip();
  zip.file('book.json', JSON.stringify(book));
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
export async function unpackProject(bytes) {
  const zip = await readArchive(bytes);
  if (!zip.file('book.json')) throw new Error('PAGEONE 프로젝트가 아닙니다.');
  const book = validateBook(JSON.parse(await zip.file('book.json').async('string')));
  book.chapters = book.chapters.map(ch => ({...ch, html:cleanHtml(ch.html)}));
  return book;
}
export async function buildEpub(book, { fontLoader } = {}) {
  validateBook(book);
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  zip.file('EPUB/book.css', 'body{font-family:serif;line-height:1.8;margin:5%;}p{text-indent:1em;margin:.5em 0;}h1,h2{line-height:1.4;page-break-after:avoid;}img{max-width:100%;height:auto;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #888;padding:.3em;}blockquote{margin:1em 2em;}');
  const manifest = ['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>','<item id="css" href="book.css" media-type="text/css"/>'];
  let fontCss='';
  const loader=fontLoader || (typeof window!=='undefined' ? async name=>{const response=await fetch(new URL(`./fonts/${name}`,document.baseURI));if(!response.ok)throw new Error('EPUB 글꼴을 읽지 못했습니다.');return new Uint8Array(await response.arrayBuffer());}:null);
  if(loader){
    const embeddedFonts = new Set();
    for(const [i,[name,family,weight]] of bookFonts(book).entries()){
      if(!embeddedFonts.has(name)){
        zip.file(`EPUB/fonts/${name}`,await loader(name));
        manifest.push(`<item id="font-${i}" href="fonts/${name}" media-type="font/ttf"/>`);
        embeddedFonts.add(name);
      }
      fontCss+=`@font-face{font-family:${family};font-weight:${weight};src:url('fonts/${name}');}`;
    }
  }
  const baseCss=await zip.file('EPUB/book.css').async('string');
  zip.file('EPUB/book.css',fontCss+baseCss+'body,p,td,figcaption{font-family:BookSerif,serif;}h1,h2,h3,h4,h5,h6,th{font-family:BookSans,sans-serif;}');
  const spine = [];
  const nav = [];
  const anchorFiles = new Map();
  for(const [i,ch] of book.chapters.entries())for(const match of cleanHtml(ch.html).matchAll(/\bid="([^"]+)"/g))if(!anchorFiles.has(match[1]))anchorFiles.set(match[1],`chapter-${i+1}.xhtml`);
  let imageIndex = 0;
  const addImages = html => html.replace(/src="data:image\/(png|jpeg|webp|gif);base64,([a-z0-9+/=\s]+)"/gi, (_,type,data) => {
    const id = `image-${++imageIndex}`; const path = `images/${id}.${type === 'jpeg' ? 'jpg' : type}`;
    zip.file(`EPUB/${path}`, data.replace(/\s/g,''), { base64: true });
    manifest.push(`<item id="${id}" href="${path}" media-type="image/${type}"/>`);
    return `src="${path}"`;
  });
  const coverArt = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1135" viewBox="0 0 800 1135"><rect width="800" height="1135" fill="${book.cover.color}"/><text x="400" y="410" fill="${book.cover.ink}" font-size="48" text-anchor="middle">${e(book.metadata.title)}</text><text x="400" y="920" fill="${book.cover.ink}" font-size="24" text-anchor="middle">${e(book.metadata.author)}</text></svg>`;
  if (book.cover.image) {
    const [,type,data] = book.cover.image.match(/^data:image\/(png|jpeg|webp);base64,(.*)$/);
    zip.file(`EPUB/cover.${type}`, data, {base64:true});
    manifest.push(`<item id="cover-image" href="cover.${type}" media-type="image/${type}" properties="cover-image"/>`);
    zip.file('EPUB/cover.xhtml', xhtmlDocument(book.metadata.title, `<h1>${e(book.metadata.title)}</h1><img src="cover.${type}" alt="${e(book.metadata.title)} 표지"/><p>${e(book.metadata.author)}</p>`));
  } else {
    zip.file('EPUB/cover.svg', coverArt);
    manifest.push('<item id="cover-image" href="cover.svg" media-type="image/svg+xml" properties="cover-image"/>');
    zip.file('EPUB/cover.xhtml', xhtmlDocument(book.metadata.title, `<img src="cover.svg" alt="${e(book.metadata.title)} 표지"/>`));
  }
  manifest.push('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>');
  spine.push('<itemref idref="cover"/>');
  // Imported note references remain chapter-local; prefix IDs to avoid collisions in combined previews.
  for (const [i,ch] of book.chapters.entries()) {
    const id = `chapter-${i+1}`; const path = `${id}.xhtml`;
    const localIds=new Set([...cleanHtml(ch.html).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
    const content=xhtml(ch.html).replace(/href="#([^"]+)"/g,(original,anchor)=>localIds.has(anchor)?original:anchorFiles.has(anchor)?`href="${anchorFiles.get(anchor)}#${anchor}"`:original);
    zip.file(`EPUB/${path}`, xhtmlDocument(ch.title, `<section><h1>${e(ch.title)}</h1>${addImages(content)}</section>`));
    manifest.push(`<item id="${id}" href="${path}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"/>`);
    if(!ch.tocHidden)nav.push(`<li><a href="${path}">${e(ch.title)}</a></li>`);
  }
  zip.file('EPUB/nav.xhtml', xhtmlDocument(tocTitle(book), `<nav epub:type="toc" id="toc"><h1>${e(tocTitle(book))}</h1><ol>${nav.length?nav.join(''):'<li><a href="cover.xhtml">표지</a></li>'}</ol></nav>`));
  zip.file('EPUB/package.opf', `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:uuid:${e(book.id)}</dc:identifier><dc:title>${e(book.metadata.title)}</dc:title><dc:language>${e(book.metadata.language || 'ko')}</dc:language><dc:creator>${e(book.metadata.author || '저자 미입력')}</dc:creator>${book.metadata.description.trim()?`<dc:description>${e(book.metadata.description)}</dc:description>`:''}${book.metadata.publisher.trim()?`<dc:publisher>${e(book.metadata.publisher)}</dc:publisher>`:''}<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</meta></metadata><manifest>${manifest.join('')}</manifest><spine>${spine.join('')}</spine></package>`);
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
