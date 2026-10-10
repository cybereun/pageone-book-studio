const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('pageone',{
  confirmClose:saved=>ipcRenderer.invoke('confirm-close',saved),
  onBeforeClose:callback=>{const listener=()=>callback();ipcRenderer.on('before-close',listener);return()=>ipcRenderer.removeListener('before-close',listener);},
  saveFile:data=>ipcRenderer.invoke('save-file',data),
  exportPdf:data=>ipcRenderer.invoke('export-pdf',data),
  onRender:callback=>{const listener=(_event,data)=>callback(data);ipcRenderer.on('render-book',listener);return()=>ipcRenderer.removeListener('render-book',listener);},
});
