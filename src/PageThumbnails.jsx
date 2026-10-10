import React,{useEffect,useRef,useState} from 'react';
export default function PageThumbnails({snapshot,current,onSelect,pending}) {
  const list=useRef(null);const [start,setStart]=useState(0);const row=218;
  const pages=snapshot?.pages||[];
  useEffect(()=>{const node=list.current;if(!node)return;const top=(current-1)*row;if(top<node.scrollTop||top+row>node.scrollTop+node.clientHeight)node.scrollTop=top;setStart(Math.max(0,Math.floor(node.scrollTop/row)-1));},[current,snapshot]);
  if(!pages.length)return <div className="thumbnail-empty">실제 책을 조판하면 페이지가 여기에 표시됩니다.</div>;
  const visible=pages.slice(start,start+7);
  return <><p className="thumbnail-status">{pending?'최신 원고 조판 중…':`${current} / ${pages.length}쪽 · 클릭해서 이동`}</p><div className="page-thumbnail-list" ref={list} onScroll={e=>setStart(Math.max(0,Math.floor(e.currentTarget.scrollTop/row)-1))}>
    <div style={{height:start*row}}/>{visible.map((page,offset)=>{
      const number=start+offset+1;const scale=Math.min(154/page.width,177/page.height);
      const src=`<!doctype html><html><head><base href="${snapshot.base}"><style>${snapshot.css}</style><style>html,body{margin:0!important;padding:0!important;background:white!important;overflow:hidden!important} .pagedjs_page{transform:scale(${scale});transform-origin:top left;margin:0!important;box-shadow:none!important}</style></head><body>${page.html}</body></html>`;
      return <button key={`${snapshot.revision}-${number}`} className={`page-thumbnail ${number===current?'selected':''}`} aria-label={`${number}쪽 미리보기로 이동`} aria-current={number===current?'page':undefined} onClick={()=>onSelect(number)} style={{height:row}}>
        <div className="thumbnail-paper" style={{width:page.width*scale,height:page.height*scale}}><iframe title={`${number}쪽 썸네일`} srcDoc={src} sandbox="allow-same-origin" scrolling="no" tabIndex={-1}/></div><span>{number}쪽</span>
      </button>;
    })}<div style={{height:Math.max(0,pages.length-start-visible.length)*row}}/>
  </div></>;
}
