import React,{useEffect,useState} from 'react';
export default function UpdateDialog(){
  const [state,setState]=useState({stage:'idle'}),[visible,setVisible]=useState(false);
  useEffect(()=>{if(!window.pageone?.onUpdate)return;window.pageone.getUpdateState().then(setState);return window.pageone.onUpdate(next=>{setState(next);if(['available','downloading','downloaded','installing'].includes(next.stage))setVisible(true);});},[]);
  const check=async()=>{setVisible(true);try{setState(await window.pageone.checkUpdate());}catch{setState({stage:'error',message:'업데이트 확인을 다시 시도해 주세요.'});}};
  const action=async fn=>{try{await fn();}catch(error){setState({...state,stage:'error',message:error.message});}};
  const active=['downloading','installing'].includes(state.stage);
  return <><button className="update-check" onClick={check} disabled={!window.pageone?.checkUpdate}>업데이트 확인</button>{visible&&<div className="modal-backdrop update-backdrop"><section className="modal update-modal" role="dialog" aria-modal="true" aria-label="앱 업데이트"><div className="modal-title"><h2>{state.stage==='available'?'새 버전이 준비되었습니다':state.stage==='current'?'최신 버전입니다':'PAGEONE 업데이트'}</h2>{!active&&<button aria-label="업데이트 창 닫기" onClick={()=>setVisible(false)}>×</button>}</div>
    <p>현재 버전 {state.currentVersion||'확인 중'}{state.version&&` · 새 버전 ${state.version}`}</p>
    {['idle','checking'].includes(state.stage)&&<p>새 버전을 확인하고 있습니다…</p>}
    {state.stage==='available'&&<p>설치를 선택하면 새 버전을 내려받고, 현재 원고를 저장한 뒤 앱을 재실행합니다.</p>}
    {state.stage==='downloading'&&<><p>업데이트 다운로드 중 · {Math.round(state.percent||0)}%</p><progress max="100" value={state.percent||0}/><p>다운로드가 끝나면 원고를 저장하고 자동으로 재실행합니다.</p></>}
    {state.stage==='installing'&&<p>원고를 저장했습니다. 업데이트를 설치하고 재실행하고 있습니다…</p>}
    {state.message&&<p className="warning">{state.message}</p>}
    <div className="modal-actions">{!active&&<button onClick={()=>setVisible(false)}>{state.stage==='available'?'나중에':'닫기'}</button>}{state.stage==='available'&&<button className="primary" onClick={()=>action(()=>window.pageone.downloadUpdate())}>업데이트 설치</button>}{state.stage==='downloaded'&&<button className="primary" onClick={()=>action(()=>window.pageone.installUpdate())}>저장하고 재시작</button>}{state.stage==='error'&&<button className="primary" onClick={check}>다시 확인</button>}</div>
  </section></div>}</>;
}
