const {app,BrowserWindow,protocol,ipcMain,dialog,session,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {PDFDocument}=require('pdf-lib');
const {atomicSave}=require('./storage.cjs');
const {createUpdates}=require('./updater.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'pageone',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
if(process.env.PAGEONE_TEST_DATA)app.setPath('userData',process.env.PAGEONE_TEST_DATA);
const ownsStorage=app.requestSingleInstanceLock();
if(!ownsStorage)app.quit();
let main, updates, pendingUpdate=false, allowClose=false;
app.on('second-instance',()=>{if(main){if(main.isMinimized())main.restore();main.show();main.focus();}});
const dist=path.resolve(__dirname,'../dist');
const safeName=name=>String(name||'PAGEONE').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,120);
function options(){return {backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true,preload:path.join(__dirname,'preload.cjs')};}
function guard(event){if(!main||event.sender!==main.webContents||event.senderFrame!==main.webContents.mainFrame)throw new Error('허용하지 않는 요청입니다.');}
async function selectDestination(name,extension){return dialog.showSaveDialog(main,{defaultPath:safeName(name),filters:[{name:'PAGEONE 출판 파일',extensions:[extension]}]});}
async function renderPdf({book,kind,revision}){
  if(!['print-body','print-cover','ebook'].includes(kind)||!book||book.version!==1)throw new Error('출력 요청이 올바르지 않습니다.');
  const hidden=new BrowserWindow({show:false,width:1100,height:900,webPreferences:options()});
  hidden.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  try{
    await hidden.loadURL('pageone://studio/preview.html');
    const render=async(mode,pageCount)=>{
      await hidden.webContents.executeJavaScript('window.__pageoneResult = null');
      hidden.webContents.send('render-book',{type:'pageone-render',book,kind,revision,mode,pageCount});
      const start=Date.now();
      while(Date.now()-start<120000){const result=await hidden.webContents.executeJavaScript('window.__pageoneResult');if(result){if(result.error)throw new Error(result.error);return result;}await new Promise(resolve=>setTimeout(resolve,150));}
      throw new Error('조판 시간이 초과되었습니다. 원고를 확인해 주세요.');
    };
    let result=await render('body');
    if(result.issues.length)throw new Error(result.issues.join('\n'));
    if(kind==='print-cover'){
      const actualPages=result.pageCount;
      await hidden.loadURL('pageone://studio/preview.html');
      result=await render('cover',actualPages);
      if(result.issues.length)throw new Error(result.issues.join('\n'));
    }
    const bytes=await hidden.webContents.printToPDF({printBackground:true,preferCSSPageSize:true,generateDocumentOutline:kind==='ebook',generateTaggedPDF:true,margins:{top:0,bottom:0,left:0,right:0}});
    const pdf=await PDFDocument.load(bytes);
    pdf.setTitle(book.metadata.title);pdf.setAuthor(book.metadata.author);pdf.setCreator('PAGEONE');
    if(pdf.getPageCount()!==result.pageCount)throw new Error(`미리보기 ${result.pageCount}쪽과 PDF ${pdf.getPageCount()}쪽이 다릅니다.`);
    for(const page of pdf.getPages()){
      if(Math.abs(page.getWidth()-result.width*72/25.4)>2||Math.abs(page.getHeight()-result.height*72/25.4)>2)throw new Error('PDF 판형이 미리보기와 다릅니다.');
      const bleed=kind==='print-cover'?book.print.bleed*72/25.4:0;
      page.setTrimBox(bleed,bleed,page.getWidth()-2*bleed,page.getHeight()-2*bleed);
      page.setBleedBox(0,0,page.getWidth(),page.getHeight());
    }
    return {bytes:await pdf.save(),pages:pdf.getPageCount()};
  }finally{hidden.destroy();}
}
if(ownsStorage)app.whenReady().then(async()=>{
  protocol.handle('pageone',async request=>{
    const url=new URL(request.url);const file=path.resolve(dist,'.'+decodeURIComponent(url.pathname));
    if(url.host!=='studio'||!file.startsWith(dist+path.sep))return new Response('Forbidden',{status:403});
    try{const data=await fs.readFile(file);const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]||'application/octet-stream';return new Response(data,{headers:{'Content-Type':type,'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob:; font-src 'self' data: blob:; connect-src 'self' blob:; frame-src 'self' blob:; object-src 'none'"}});}catch{return new Response('Not found',{status:404});}
  });
  session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!/^pageone:\/\/studio\/|^data:|^blob:/.test(details.url)}));
  ipcMain.handle('confirm-close',(event,saved)=>{guard(event);if(pendingUpdate){pendingUpdate=false;if(saved===true)allowClose=true;updates.installAfterSave(saved===true);}else if(saved===true){allowClose=true;main.close();}return true;});
  const {autoUpdater}=require('electron-updater');
  updates=createUpdates({updater:autoUpdater,app,getWindow:()=>main,prepareInstall:()=>{pendingUpdate=true;main.webContents.send('before-close');}});
  ipcMain.handle('update-state',event=>{guard(event);return updates.getState();});
  ipcMain.handle('update-check',event=>{guard(event);return updates.check();});
  ipcMain.handle('update-download',event=>{guard(event);return updates.download();});
  ipcMain.handle('update-install',event=>{guard(event);updates.install();return true;});
  ipcMain.handle('save-file',async(event,data)=>{
    guard(event);if(!Array.isArray(data?.bytes)||data.bytes.length>120*1024*1024||!data.bytes.every(b=>Number.isInteger(b)&&b>=0&&b<=255))throw new Error('저장 데이터가 올바르지 않습니다.');
    if(!['project','epub'].includes(data.kind))throw new Error('지원하지 않는 형식입니다.');
    const chosen=await selectDestination(data.name,data.kind==='epub'?'epub':'pageone');if(chosen.canceled)return {saved:false};await atomicSave(chosen.filePath,Buffer.from(data.bytes));return {saved:true,path:chosen.filePath};
  });
  ipcMain.handle('export-pdf',async(event,data)=>{guard(event);if(JSON.stringify(data).length>100*1024*1024)throw new Error('출력 원고가 너무 큽니다.');const chosen=await selectDestination(`${data.book?.metadata?.title||'책'}-${data.kind}.pdf`,'pdf');if(chosen.canceled)return {saved:false};const result=await renderPdf(data);await atomicSave(chosen.filePath,result.bytes);return {saved:true,pages:result.pages,path:chosen.filePath};});
  main=new BrowserWindow({width:1560,height:1020,minWidth:1000,minHeight:720,backgroundColor:'#f8f7f3',icon:path.join(dist,'pageone-icon.png'),title:'PAGEONE · 개인 출판 작업실',webPreferences:options()});
  main.on('close',event=>{if(!allowClose){event.preventDefault();main.webContents.send('before-close');}});
  Menu.setApplicationMenu(null);
  main.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  main.webContents.on('will-navigate',(event,url)=>{if(url!=='pageone://studio/index.html')event.preventDefault();});
  await main.loadURL('pageone://studio/index.html');
  if(app.isPackaged&&!process.env.PAGEONE_DISABLE_UPDATES){setTimeout(()=>updates.check(),5000).unref();setInterval(()=>updates.check(),4*60*60*1000).unref();}
});
app.on('window-all-closed',()=>app.quit());
module.exports={renderPdf};
