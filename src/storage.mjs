const dbPromise = () => new Promise((resolve,reject) => {
  const request = indexedDB.open('pageone-studio-v2',1);
  request.onupgradeneeded = () => request.result.createObjectStore('books',{keyPath:'id'});
  request.onsuccess = () => resolve(request.result); request.onerror=()=>reject(request.error);
});
export async function saveLocal(book) {
  const db=await dbPromise();
  try {
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('books','readwrite');
      tx.oncomplete=()=>resolve();
      tx.onabort=()=>reject(tx.error||new Error('자동 저장이 중단되었습니다.'));
      tx.onerror=()=>reject(tx.error||new Error('저장소에 기록하지 못했습니다.'));
      tx.objectStore('books').put(book);
    });
  }finally{db.close();}
}
export async function listLocal() {
  const db=await dbPromise();
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('books');const request=tx.objectStore('books').getAll();
      tx.onabort=()=>reject(tx.error||new Error('책장을 불러오지 못했습니다.'));
      request.onsuccess=()=>resolve(request.result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
      request.onerror=()=>reject(request.error);
    });
  }finally{db.close();}
}
export async function saveBytes(bytes,name,kind) {
  if(window.pageone) return window.pageone.saveFile({bytes:Array.from(bytes),name,kind});
  const url=URL.createObjectURL(new Blob([bytes])); const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return {saved:true};
}
