import { Previewer } from 'pagedjs';
import { bodyHtml, layoutCss, coverHtml, coverCss } from './layout.mjs';
import { validateBook, coverGeometry } from './book.mjs';
const fontBase = new URL('./fonts/', document.baseURI).href;
let queued = null, running = false;
window.__pageoneResult = null;
const report = data => { window.__pageoneResult = data; window.parent.postMessage({type:'pageone-layout',...data}, '*'); };
const displayStyle = document.createElement('style');
displayStyle.textContent = `html,body{margin:0;padding:0;background:#e9e7e2}#pages{padding:24px}.pagedjs_pages{display:flex;flex-wrap:wrap;justify-content:center;gap:20px}.pagedjs_page{background:white;box-shadow:0 2px 12px #28352e15;flex-shrink:0}.cover-sheet{margin:auto;box-shadow:0 3px 18px #0002}@media print{html,body{background:white!important}#pages{padding:0!important}.pagedjs_pages{display:block!important}.pagedjs_page{margin:0!important;box-shadow:none!important;break-after:page;}.cover-sheet{margin:0;box-shadow:none}}`;
document.head.appendChild(displayStyle);
async function render() {
  if (running || !queued) return;
  running = true;
  const job = queued; queued = null;
  const { book, revision, mode = 'body', pageCount = 2 } = job;
  const target = document.getElementById('pages');
  // Paginate at physical scale; CSS zoom changes DOM measurements in Paged.js.
  target.style.zoom = '1';
  try {
    validateBook(book);
    document.querySelectorAll('[data-pageone-generated]').forEach(n => n.remove());
    target.innerHTML = '';
    const fontStyle = document.createElement('style'); fontStyle.dataset.pageoneGenerated='1';
    fontStyle.textContent = layoutCss(book,fontBase) + coverCss;
    document.head.appendChild(fontStyle);
    await Promise.all([document.fonts.load('11pt BookSerif'), document.fonts.load('700 24pt BookSerif'), document.fonts.load('11pt BookSans'), document.fonts.load('700 24pt BookSans')]);
    if (mode === 'cover') {
      const g = coverGeometry(book,pageCount);
      fontStyle.textContent += `@page{size:${g.width}mm ${g.height}mm;margin:0;@top-center{content:none}@bottom-center{content:none}}`;
      target.innerHTML = coverHtml(book,pageCount);
      await Promise.all([...target.querySelectorAll('img')].map(i => i.decode().catch(()=>{})));
      if (book.cover.image) { const image = new Image(); image.src=book.cover.image; await image.decode(); }
      const issues=[];
      target.querySelectorAll('.cover-front,.cover-back,.cover-front h1,.cover-spine span').forEach(node=>{if(node.scrollHeight>node.clientHeight+4||node.scrollWidth>node.clientWidth+4)issues.push('표지 글자가 영역을 벗어났습니다. 제목 크기나 소개글 분량을 줄여 주세요.');});
      target.style.zoom = String(job.zoom || 1);
      report({revision,pageCount:1,issues,width:g.width,height:g.height});
    } else {
      // A new iframe per revision prevents Paged.js styles and counters leaking between documents.
      fontStyle.remove();
      const previewer = new Previewer();
      previewer.chunker.q.tick = callback => setTimeout(callback, 0);
      // This isolated frame is dedicated to typesetting. Background idle callbacks
      // otherwise add roughly a second per page to an invisible PDF window.
      let scheduledPages = 0;
      previewer.chunker.renderOnIdle = async renderer => {
        if (++scheduledPages % 8 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        return previewer.chunker.renderAsync(renderer);
      };
      const flow = await previewer.preview(bodyHtml(book), [{ [new URL('./book.css',document.baseURI).href]: layoutCss(book,fontBase) }], target);
      await document.fonts.ready;
      const issues=[];
      target.querySelectorAll('.pagedjs_page_content').forEach((node,i)=> { if(node.scrollWidth>node.clientWidth+4) issues.push(`${i+1}쪽 가로 넘침을 확인해 주세요.`); });
      target.style.zoom = String(job.zoom || 1);
      report({revision,pageCount:flow.total,issues,width:book.print.width,height:book.print.height});
    }
  } catch(error) { report({revision,error:error.message,pageCount:0,issues:[]}); }
  running = false;
  if(queued) render();
}
window.addEventListener('message', event => {
  if(event.source !== window.parent && event.source !== window) return;
  if(event.data?.type !== 'pageone-render') return;
  queued=event.data; render();
});
window.parent.postMessage({type:'pageone-preview-ready'}, '*');
if(window.pageone?.onRender) window.pageone.onRender(data => { queued=data; render(); });
