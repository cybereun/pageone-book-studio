import mammoth from 'mammoth';
import { XMLParser } from 'fast-xml-parser';
import { uid, escapeHtml, textHtml } from './book.mjs';
import { cleanHtml } from './html.mjs';
import { readArchive } from './archive.mjs';
import { importHwp } from './hwp.mjs';
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', removeNSPrefix: true, preserveOrder: true, processEntities: false, trimValues: false });
function parseXml(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('외부 XML 선언은 허용되지 않습니다.');
  return parser.parse(xml);
}
function elements(nodes, name) {
  const found = [];
  for (const node of nodes || []) for (const [key, value] of Object.entries(node)) {
    if (key === name) found.push({ children: value, attrs: node[':@'] || {} });
    else if (Array.isArray(value)) found.push(...elements(value, name));
  }
  return found;
}
function nodeText(nodes) {
  return (nodes || []).map(node => Object.entries(node).map(([key, value]) => key === '#text' ? String(value) : key === ':@' ? '' : key === 'lineBreak' || key === 'Br' ? '\n' : Array.isArray(value) ? nodeText(value) : '').join('')).join('');
}
export async function importManuscript(input, name) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength > 100 * 1024 * 1024) throw new Error('100MB 이하의 원고를 선택해 주세요.');
  const ext = name.split('.').pop().toLowerCase();
  const title = name.replace(/\.[^.]+$/, '');
  const warnings = [];
  let chapters = [];
  if (ext === 'hwp') return importHwp(bytes,name);
  if (ext === 'indd') throw new Error('인디자인에서 파일 → 다른 이름으로 저장 → IDML로 저장한 후 가져와 주세요.');
  if (ext === 'txt') chapters = [{ id: uid(), title, html: textHtml(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) }];
  else if (ext === 'docx') {
    await readArchive(bytes);
    const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
    warnings.push(...result.messages.map(m => m.message));
    warnings.push('워드의 페이지 배치 대신 제목·문단 구조를 가져왔습니다. 표·각주·이미지를 확인해 주세요.');
    const segments = result.value.split(/(?=<h1(?:\s|>))/i).filter(Boolean);
    chapters = segments.map((html, i) => {
      const heading = html.match(/^<h1[^>]*>([\s\S]*?)<\/h1>/i);
      return { id: uid(), title: heading ? heading[1].replace(/<[^>]+>/g,'') : i ? `${title} ${i+1}` : title, html: cleanHtml(heading ? html.slice(heading[0].length) : html) };
    });
  } else if (ext === 'hwpx' || ext === 'idml') {
    const zip = await readArchive(bytes);
    if (ext === 'hwpx') {
      const sections = Object.keys(zip.files).filter(n => /^Contents\/section\d+\.xml$/i.test(n)).sort((a,b) => a.localeCompare(b,undefined,{numeric:true}));
      if (!sections.length) throw new Error('HWPX 본문을 찾지 못했습니다.');
      const header = zip.file('Contents/header.xml') ? parseXml(await zip.file('Contents/header.xml').async('string')) : [];
      const charStyles = new Map(elements(header,'charPr').map(n=>[String(n.attrs['@id']),n.children]));
      const paraStyles = new Map(elements(header,'style').map(n=>[String(n.attrs['@id']),String(n.attrs['@name']||'')]));
      const manifest = zip.file('Contents/content.hpf') ? parseXml(await zip.file('Contents/content.hpf').async('string')) : [];
      const images = new Map();
      for(const item of elements(manifest,'item')){
        const href=item.attrs['@href']||'', mime=item.attrs['@media-type']||'';
        const entry=zip.file(href)||zip.file('Contents/'+href)||zip.file(href.replace(/^\.\.\//,''));
        if(entry && /^image\/(png|jpeg|gif|webp)$/.test(mime))images.set(String(item.attrs['@id']),`data:${mime};base64,${await entry.async('base64')}`);
      }
      let noteIndex=0; const notes=[];
      const render=nodes=>(nodes||[]).map(node=>Object.entries(node).map(([key,value])=>{
        const attrs=node[':@']||{};
        if(key===':@')return '';
        if(key==='#text')return escapeHtml(value);
        if(key==='t')return render(value);
        if(key==='lineBreak')return '<br>';
        if(key==='tab')return '　';
        if(key==='p'){
          const content=render(value);const name=paraStyles.get(String(attrs['@styleIDRef']))||'';
          const tag=/heading|제목/i.test(name)?'h2':'p';
          // Block controls are nested in runs in HWPX; keep them outside paragraphs.
          return /<(table|figure|p|h2)\b/.test(content)?content:`<${tag}>${content}</${tag}>`;
        }
        if(key==='run'){
          let content=render(value);const style=charStyles.get(String(attrs['@charPrIDRef']))||[];
          if(elements(style,'bold').length)content=`<strong>${content}</strong>`;
          if(elements(style,'italic').length)content=`<em>${content}</em>`;
          return content;
        }
        if(key==='tbl')return `<table><tbody>${render(value)}</tbody></table>`;
        if(key==='tr')return `<tr>${render(value)}</tr>`;
        if(key==='tc'){
          const span=elements(value,'cellSpan')[0]?.attrs||{};
          const cols=Math.max(1,Math.min(100,Number(span['@colSpan'])||1)),rows=Math.max(1,Math.min(100,Number(span['@rowSpan'])||1));
          return `<td colspan="${cols}" rowspan="${rows}">${render(value)}</td>`;
        }
        if(key==='pic'){
          const id=String(elements(value,'img')[0]?.attrs['@binaryItemIDRef']||'');const src=images.get(id);
          if(!src){warnings.push(`이미지를 찾지 못했습니다: ${id||'알 수 없음'}`);return '';}
          return `<img src="${src}" alt="원고 이미지 ${escapeHtml(id)}">`;
        }
        if(key==='footNote'||key==='endNote'){
          const index=++noteIndex;notes.push(`<li id="note-${index}">${render(value)} <a href="#note-ref-${index}">↩</a></li>`);
          return `<sup><a id="note-ref-${index}" href="#note-${index}">${index}</a></sup>`;
        }
        if(key==='equation'||key==='rect'||key==='ellipse'||key==='drawingObject'){warnings.push('수식 또는 도형은 변환되지 않았습니다. 원본과 대조해 주세요.');return '';}
        return Array.isArray(value)?render(value):'';
      }).join('')).join('');
      for (const section of sections) {
        const tree = parseXml(await zip.file(section).async('string'));
        notes.length=0;
        const html=render(tree)+(notes.length?`<h2>주석</h2><ol>${notes.join('')}</ol>`:'');
        chapters.push({ id: uid(), title: chapters.length ? `${title} ${chapters.length+1}` : title, html:cleanHtml(html) });
      }
      warnings.push('HWPX 문단·강조·표·내장 이미지를 가져왔습니다. 주석은 장 끝으로 모읍니다. 복잡한 도형·수식·원본 페이지 배치는 원본과 대조해 주세요.');
    } else {
      if (!zip.file('designmap.xml')) throw new Error('IDML designmap을 찾지 못했습니다.');
      const tree = parseXml(await zip.file('designmap.xml').async('string'));
      let paths = elements(tree, 'Story').map(n => n.attrs['@src']).filter(Boolean);
      if (!paths.length) paths = Object.keys(zip.files).filter(n => /^Stories\/.*\.xml$/i.test(n));
      for (const path of paths) {
        if (!zip.file(path)) { warnings.push(`누락된 Story: ${path}`); continue; }
        const story = parseXml(await zip.file(path).async('string'));
        const html = elements(story, 'ParagraphStyleRange').map(p => {
          const tag=/heading|제목/i.test(p.attrs['@AppliedParagraphStyle']||'')?'h2':'p';
          const content=elements(p.children,'CharacterStyleRange').map(run=>{
            let text=escapeHtml(elements(run.children,'Content').map(t=>nodeText(t.children)).join(''));
            if(/bold/i.test(run.attrs['@FontStyle']||''))text=`<strong>${text}</strong>`;
            if(/italic/i.test(run.attrs['@FontStyle']||''))text=`<em>${text}</em>`;
            return text;
          }).join('');
          return `<${tag}>${content||escapeHtml(elements(p.children,'Content').map(t=>nodeText(t.children)).join(''))}</${tag}>`;
        }).join('');
        if (html) chapters.push({ id: uid(), title: `${title} · 이야기 ${chapters.length+1}`, html });
      }
      warnings.push('IDML의 Story·제목·직접 지정한 굵게/기울임을 가져왔습니다. 목차에서 읽기 순서를 확인해 주세요. 연결 이미지·프레임 배치·상속 스타일·효과는 원본과 대조해 주세요.');
    }
  } else throw new Error('DOCX, HWPX, IDML, TXT 파일을 선택해 주세요.');
  if (!chapters.length || !chapters.some(ch => ch.html.replace(/<[^>]*>/g,'').trim())) throw new Error('읽을 수 있는 원고가 없습니다. 원본 파일을 확인해 주세요.');
  return { name, chapters: scopeImportedAnchors(chapters), warnings };
}

export function scopeImportedAnchors(chapters,prefix=uid()) {
 const ids=new Set(chapters.flatMap(ch=>[...ch.html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])));
 return chapters.map(ch=>({...ch,html:ch.html.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`).replace(/href="#([^"]+)"/g,(original,id)=>ids.has(id)?`href="#${prefix}-${id}"`:original)}));
}
