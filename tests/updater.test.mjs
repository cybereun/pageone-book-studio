import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createUpdates} from '../desktop/updater.cjs';
function fixture(){const updater=new EventEmitter();let prepared=0,installed=0;const sent=[];const app={isPackaged:true,getVersion:()=> '2.0.3',getPath:()=> '/no-such-directory'};updater.checkForUpdates=async()=>updater.emit('update-available',{version:'2.0.4'});updater.downloadUpdate=async()=>{updater.emit('download-progress',{percent:50});updater.emit('update-downloaded',{version:'2.0.4'});};updater.quitAndInstall=(silent,restart)=>{assert.equal(silent,true);assert.equal(restart,true);installed++;};const updates=createUpdates({updater,app,getWindow:()=>({isDestroyed:()=>false,webContents:{send:(_channel,data)=>sent.push(data)}}),prepareInstall:()=>prepared++});return {updater,updates,sent,counts:()=>({prepared,installed})};}
test('update requires successful manuscript save before installer and restart',async()=>{
 const f=fixture();await f.updates.check();assert.equal(f.updates.getState().stage,'available');await f.updates.download();assert.deepEqual(f.counts(),{prepared:1,installed:0});assert.equal(f.updates.installAfterSave(false),false);assert.deepEqual(f.counts(),{prepared:1,installed:0});f.updates.install();assert.equal(f.updates.installAfterSave(true),true);assert.deepEqual(f.counts(),{prepared:2,installed:1});assert.ok(f.sent.some(s=>s.stage==='downloading'&&s.percent===50));
});
test('download failure does not start installation',async()=>{const f=fixture();await f.updates.check();f.updater.downloadUpdate=async()=>{throw new Error('offline');};await f.updates.download();assert.equal(f.updates.getState().stage,'error');assert.deepEqual(f.counts(),{prepared:0,installed:0});});
