import React,{useEffect,useRef,useState} from 'react';
import ePub from 'epubjs';
import {buildEpub} from './export.mjs';
export default function EpubReader({book,chapterId}){
  const host=useRef(null),[status,setStatus]=useState('전자책을 준비하고 있습니다…');
  useEffect(()=>{
    let cancelled=false,publication,rendition;
    const timer=setTimeout(async()=>{
      try{
        setStatus('EPUB을 조판하고 있습니다…');
        const bytes=await buildEpub(book);if(cancelled)return;
        publication=ePub(bytes.buffer,{replacements:'blobUrl'});
        await publication.ready;if(cancelled)return;
        rendition=publication.renderTo(host.current,{width:'100%',height:600,flow:'scrolled-doc',spread:'none',allowScriptedContent:false});
        rendition.themes.default({body:{'font-family':'BookSerif, serif','line-height':'1.85','color':book.ebook.dark?'#e3e6dd':'#26392d','background':book.ebook.dark?'#262c27':'#ffffff','padding':'20px!important'},'h1,h2,h3,th':{'font-family':'BookSans, sans-serif'},img:{'max-width':'100%','height':'auto'}});
        rendition.themes.fontSize(`${book.ebook.fontSize}px`);
        await rendition.display(`chapter-${Math.max(0,book.chapters.findIndex(c=>c.id===chapterId))+1}.xhtml`);
        if(!cancelled)setStatus('실제 EPUB 파일로 미리보는 중');
      }catch(error){if(!cancelled)setStatus(`전자책 미리보기 오류: ${error.message}`);}
    },400);
    return()=>{cancelled=true;clearTimeout(timer);try{rendition?.destroy();publication?.destroy();}catch{};};
  },[book,chapterId]);
  return <div className="epub-reader-wrap" style={{maxWidth:book.ebook.width}}><div ref={host} className="epub-reader"/><p className="ebook-note">{status}</p></div>;
}
