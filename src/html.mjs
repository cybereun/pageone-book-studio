import sanitize from 'sanitize-html';
export function cleanHtml(html) {
  return sanitize(String(html), {
    allowedTags: ['p','h1','h2','h3','h4','h5','h6','strong','em','b','i','u','s','br','hr','blockquote','ul','ol','li','a','img','table','thead','tbody','tr','th','td','sup','sub','span'],
    allowedAttributes: { a: ['href','id'], '*': ['id'], img: ['src','alt','width','height'], td: ['colspan','rowspan'], th: ['colspan','rowspan'] },
    allowedSchemes: ['https','http','mailto'], allowedSchemesByTag: { img: ['data'] }, allowProtocolRelative: false,
    transformTags: { div: 'p', img: (tag, attrs) => ({ tagName: tag, attribs: { src: /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(attrs.src || '') ? attrs.src : '', alt: attrs.alt || '원고 이미지' } }) },
    exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.src,
  });
}
export function xhtml(html) {
  return cleanHtml(html).replace(/<(br|hr|img)(\s[^>]*?)?\s*\/?\s*>/gi, '<$1$2 />').replace(/&nbsp;/g, '&#160;');
}
