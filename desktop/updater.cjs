const fs=require('node:fs');
const path=require('node:path');
function createUpdates({updater,app,getWindow,prepareInstall}){
  let state={stage:'idle',currentVersion:app.getVersion()},installRequested=false,checking=false,downloading=false;
  const log=(...args)=>{try{fs.appendFileSync(path.join(app.getPath('userData'),'update.log'),`${new Date().toISOString()} ${args.map(String).join(' ')}\n`);}catch{}};
  updater.logger={info:log,warn:log,error:log,debug:()=>{}};
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;updater.allowPrerelease=false;
  const publish=value=>{state={...state,...value};const win=getWindow();if(win&&!win.isDestroyed())win.webContents.send('update-state',state);};
  const failed=error=>{log(error?.stack||error);checking=false;downloading=false;installRequested=false;publish({stage:'error',message:'업데이트를 확인하거나 내려받지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'});};
  updater.on('checking-for-update',()=>publish({stage:'checking',message:''}));
  updater.on('update-available',info=>{checking=false;publish({stage:'available',version:info.version,message:''});});
  updater.on('update-not-available',()=>{checking=false;publish({stage:'current',message:''});});
  updater.on('download-progress',progress=>publish({stage:'downloading',percent:Math.max(0,Math.min(100,progress.percent))}));
  updater.on('update-downloaded',info=>{downloading=false;publish({stage:'downloaded',version:info.version,percent:100});if(installRequested)prepareInstall();});
  updater.on('error',failed);
  return {
    getState:()=>state,
    async check(){if(checking||downloading)return state;if(!app.isPackaged){publish({stage:'error',message:'업데이트 확인은 Windows 설치본에서 사용할 수 있습니다.'});return state;}checking=true;try{await updater.checkForUpdates();}catch(error){failed(error);}return state;},
    async download(){if(downloading)return state;if(state.stage!=='available'&&state.stage!=='error')throw new Error('설치할 새 버전을 먼저 확인해 주세요.');if(!state.version)throw new Error('업데이트 정보가 없습니다.');installRequested=true;downloading=true;publish({stage:'downloading',percent:0,message:''});try{await updater.downloadUpdate();}catch(error){failed(error);}return state;},
    install(){if(state.stage!=='downloaded')throw new Error('업데이트 다운로드가 완료되지 않았습니다.');installRequested=true;prepareInstall();},
    installAfterSave(saved){if(!saved){installRequested=false;publish({stage:'downloaded',message:'원고를 저장하지 못했습니다. 프로젝트 저장 후 다시 설치해 주세요.'});return false;}publish({stage:'installing',message:''});updater.quitAndInstall(true,true);return true;}
  };
}
module.exports={createUpdates};
