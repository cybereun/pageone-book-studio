import React from 'react';
import {uid} from './book.mjs';
export default function TocEditor({book,onChange,onSelect}) {
  const patchChapter=(id,value)=>onChange({...book,chapters:book.chapters.map(ch=>ch.id===id?{...ch,...value}:ch)});
  const move=(index,offset)=>{const chapters=[...book.chapters];[chapters[index],chapters[index+offset]]=[chapters[index+offset],chapters[index]];onChange({...book,chapters});};
  return <section className="toc-editor" aria-label="목차 편집">
    <h2>목차 구성</h2><p>항목마다 본문 장이 연결됩니다. 제목과 순서를 바꾸면 본문과 목차가 함께 바뀝니다. 쪽수는 조판 후 자동으로 계산합니다.</p>
    <label className="check"><input type="checkbox" checked={book.print.toc} onChange={e=>onChange({...book,print:{...book.print,toc:e.target.checked}})}/>책 앞에 목차 넣기 (PDF)</label>
    <label className="field"><span>목차 페이지 제목</span><input aria-label="목차 페이지 제목" maxLength={200} value={book.print.tocTitle??'목차'} onChange={e=>onChange({...book,print:{...book.print,tocTitle:e.target.value}})}/></label>
    {!book.print.toc&&<p className="toc-notice">PDF 목차 페이지는 꺼져 있습니다. 위의 ‘책 앞에 목차 넣기’를 선택하면 바로 추가됩니다. EPUB 탐색 목차는 항상 제공됩니다.</p>}
    <div className="toc-entries">{book.chapters.map((ch,i)=><div className="toc-entry" key={ch.id}>
      <div className="toc-entry-title"><label className="check"><input type="checkbox" aria-label={`목차 ${i+1} 포함`} checked={!ch.tocHidden} onChange={e=>patchChapter(ch.id,{tocHidden:!e.target.checked})}/>{i+1}</label><input aria-label={`목차 ${i+1} 제목`} value={ch.title} onChange={e=>patchChapter(ch.id,{title:e.target.value})}/></div>
      <div className="toc-entry-actions"><button aria-label={`목차 ${i+1} 위로`} disabled={i===0} onClick={()=>move(i,-1)}>↑ 위로</button><button aria-label={`목차 ${i+1} 아래로`} disabled={i===book.chapters.length-1} onClick={()=>move(i,1)}>↓ 아래로</button><button onClick={()=>onSelect(ch.id)}>본문 편집</button></div>
      {ch.tocHidden&&<small>목차에서만 제외됩니다. 본문은 그대로 남습니다.</small>}
    </div>)}</div>
    <button className="primary toc-add" onClick={()=>onChange({...book,print:{...book.print,toc:true},chapters:[...book.chapters,{id:uid(),title:'새 목차 항목',html:'<p></p>'}]})} disabled={book.chapters.length>=1000}>＋ 목차 항목과 새 장 추가</button>
    <p className="toc-notice">포함한 항목은 PDF·EPUB 목차에 반영됩니다. 삭제는 왼쪽 ‘책의 구성’에서 할 수 있습니다.</p>
  </section>;
}
