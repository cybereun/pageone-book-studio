import CFB from 'cfb';
import {Inflate} from 'pako';
import {uid,textHtml} from './book.mjs';
function inflateLimited(bytes){
  const decoder=new Inflate({raw:true,chunkSize:65536});const chunks=[];let size=0;
  decoder.onData=chunk=>{size+=chunk.length;if(size>100*1024*1024)throw new Error('HWP 압축 해제 한도를 초과했습니다.');chunks.push(chunk);};
  decoder.push(bytes,true);if(decoder.err)throw new Error('HWP 압축 데이터를 읽지 못했습니다.');
  const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}return data;
}
export function importHwp(bytes,name){
  let cfb;try{cfb=CFB.read(bytes,{type:'array'});}catch{throw new Error('HWP 5 원고를 읽지 못했습니다. HWPX로 저장해 가져와 주세요.');}
  // The browser build of CFB may return plain arrays instead of Node Buffers.
  const headerContent=CFB.find(cfb,'FileHeader')?.content;
  const header=headerContent ? Uint8Array.from(headerContent) : null;
  if(!header||header.length<40||new TextDecoder().decode(header.slice(0,17))!=='HWP Document File')throw new Error('HWP 5 형식이 아닙니다. HWPX로 저장해 가져와 주세요.');
  const flags=new DataView(header.buffer,header.byteOffset,header.byteLength).getUint32(36,true);
  if(flags&2)throw new Error('암호가 설정된 HWP입니다. 암호를 해제한 사본을 가져와 주세요.');
  if(flags&4)throw new Error('배포용 HWP입니다. 일반 HWPX 사본을 가져와 주세요.');
  const sections=cfb.FullPaths.map((path,i)=>({path,entry:cfb.FileIndex[i]})).filter(({path})=>/\/BodyText\/Section\d+$/.test(path)).sort((a,b)=>a.path.localeCompare(b.path,undefined,{numeric:true}));
  const chapters=[];
  for(const {entry} of sections){
    const content=Uint8Array.from(entry.content||[]);
    const data=flags&1?inflateLimited(content):content;
    const view=new DataView(data.buffer,data.byteOffset,data.byteLength);let offset=0;const paragraphs=[];
    while(offset+4<=data.length){
      const record=view.getUint32(offset,true);offset+=4;const tag=record&1023;let size=record>>>20;
      if(size===4095){if(offset+4>data.length)throw new Error('손상된 HWP 레코드입니다.');size=view.getUint32(offset,true);offset+=4;}
      if(offset+size>data.length)throw new Error('HWP 본문이 손상되었습니다.');
      if(tag===67){
        let text='';
        for(let i=offset;i+1<offset+size;){const code=view.getUint16(i,true);if(code>=32){text+=String.fromCharCode(code);i+=2;}else if([1,2,3,4,5,6,7,8,9,11,12,14,15,16,17,18,19,20,21,22,23].includes(code)){if(code===9)text+='\t';i+=16;}else{if(code===10||code===13)text+='\n';i+=2;}}
        if(text.trim())paragraphs.push(text.trim());
      }
      offset+=size;
    }
    if(paragraphs.length)chapters.push({id:uid(),title:`${name.replace(/\.hwp$/i,'')}${sections.length>1?` ${chapters.length+1}`:''}`,html:textHtml(paragraphs.join('\n\n'))});
  }
  if(!chapters.length)throw new Error('HWP에서 본문을 찾지 못했습니다. HWPX로 저장해 가져와 주세요.');
  return {name,chapters,warnings:['HWP 5의 본문 텍스트를 가져왔습니다. 표 안의 글은 문단으로 펼칩니다. 이미지·서식·각주 배치를 보존하려면 HWPX로 저장해 가져와 주세요.']};
}
