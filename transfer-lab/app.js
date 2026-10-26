(() => {
'use strict';
const $ = s => document.querySelector(s);
const EXP = TransferCore.experiment.key, KEY = 'transfer-lab-v2';
const banks = ['새봄은행','온유은행','나무은행','바다은행','다온은행','별빛은행','하늘은행','구름은행','한결은행','이음은행','누리은행','달빛은행'];
const colors = ['#357456','#9458aa','#ca8932','#297cb1','#7262b3','#4a6c9d'];
let state = {runs:[],current:null}, imported = new Map();
const nav = performance.getEntriesByType('navigation')[0];
try { if(nav?.type === 'reload') state = JSON.parse(sessionStorage.getItem(KEY)) || state; } catch { $('#storage-status').textContent='저장 공간을 사용할 수 없어 새로고침하면 기록이 사라집니다. 결과를 내려받으세요.'; }
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{$('#storage-status').textContent='기록은 현재 화면에서만 유지됩니다. 나가기 전에 내려받으세요.';}}
function current(){return state.runs.find(r=>r.id===state.current);}
function elapsed(r){return Math.max(0,(r.endedAt || Date.now())-r.startedAt);}
function event(type,code){const r=current();r.events.push({type,step:r.step,elapsedMs:elapsed(r),...(code?{code}:{})});save();}
function start(forced){if(current()?.status==='running')return;
const id=crypto.randomUUID();let exposure=null;const variant=forced||TransferCore.assign(id,e=>{exposure=e;});
const r={schemaVersion:1,experimentId:EXP,id,assignmentSource:forced?'teacher':'growthbook-1.8.0',variant,mode:forced?'teacher_preview':state.runs.length?'repeat':'first_run',status:'running',startedAt:Date.now(),endedAt:null,step:variant==='A'?'bank':'account',bank:null,accountValid:false,events:[]};
state.runs.push(r);state.current=id;event('exposure',forced?'teacher_override':'growthbook_'+exposure.variationId);event('step_view');render();$('#screen').scrollIntoView({block:'start'});}

function go(step){current().step=step;event('step_view');render();$('#screen h2')?.focus();}
function fail(code,message){event('error',code);$('#error').textContent=message;$('#account')?.setAttribute('aria-invalid','true');}
function finish(status){const r=current();r.status=status;r.endedAt=Date.now();event(status==='completed'?'completion':'abandonment');render();}
function bankButtons(list){return list.map((name)=>`<button class="bank" data-bank="${name}"><span class="bank-icon" style="--bank-color:${colors[banks.indexOf(name)%colors.length]}" aria-hidden="true">${name[0]}</span>${name}</button>`).join('');}
function render(){const r=current(),running=r?.status==='running';$('#start').hidden=!!r;$('#reset').hidden=!running;$('#download').hidden=!r;document.querySelectorAll('[data-preview]').forEach(b=>b.disabled=running);$('#teacher').open=running?false:$('#teacher').open;
if(!r){$('#screen').innerHTML='<div class="appnav">송금</div><div class="welcome"><div class="wallet" aria-hidden="true">↗</div><h2>마음을 보내는 일,<br>간편하게</h2><p>왼쪽의 할 일을 읽고<br>실험을 시작해 주세요.</p></div>';return;}
$('#run-status').textContent=(r.mode==='first_run'?'첫 참여':r.mode==='repeat'?'반복 실행':'진행자 미리보기')+' · '+(running?'진행 중':r.status==='completed'?'완료':'중도 종료')+' · 결과는 직접 내려받아 공유할 수 있습니다.';
if(!running) $('#run-status').textContent+=` 흐름 ${r.variant} · ${(elapsed(r)/1000).toFixed(1)}초 · 오류 ${r.events.filter(e=>e.type==='error').length}회 · 뒤로 ${r.events.filter(e=>e.type==='backtrack').length}회`;
const first=r.variant==='A'?'bank':'account';let html=`<div class="appnav">${running&&r.step!==first?'<button class="back" id="back" aria-label="이전 단계">‹</button>':'<span>송금</span>'}<span>내 계좌에서</span></div>`;
if(r.status==='completed'){html+='<div class="welcome"><div class="wallet success" aria-hidden="true">✓</div><h2 tabindex="-1">송금을 완료했어요</h2><p>김하늘님에게</p><div class="amount">30,000원</div><p>하늘은행 · 000-1234-5678</p></div>';}
else if(r.status==='abandoned'){html+='<div class="welcome"><h2 tabindex="-1">송금을 종료했어요</h2><p>진행하던 송금이 취소되었어요.</p></div>';}
else if(r.step==='bank'){html+=`<h2 class="app-title" tabindex="-1">어느 은행으로<br>보낼까요?</h2><p class="sub">받는 분의 은행을 선택해 주세요</p><div class="bankgrid">${bankButtons(banks)}</div>`;}
else if(r.step==='account'){html+=`<h2 class="app-title" tabindex="-1">계좌번호를<br>알려주세요</h2><p class="sub">${r.variant==='A'?r.bank:'받는 분의 계좌번호를 입력해 주세요'}</p><form id="account-form" style="display:flex;flex:1;flex-direction:column" novalidate><div class="field"><label for="account">계좌번호</label><input id="account" inputmode="numeric" autocomplete="off" maxlength="24" placeholder="숫자만 입력" aria-describedby="error" value="${r.accountValid?'00012345678':''}"></div><p id="error" class="error" role="alert"></p><button class="primary bottom" type="submit">다음</button></form>`;}
else if(r.step==='suggestions'){html+=`<h2 class="app-title" tabindex="-1">이 중에<br>받는 은행이 있나요?</h2><p class="sub">000-1234-5678</p><div class="suggestions">${bankButtons(['하늘은행','구름은행','별빛은행'])}</div><p class="small">계좌번호를 바탕으로 찾았어요</p>`;}
else if(r.step==='confirm'){html+='<h2 class="app-title" tabindex="-1">김하늘님에게<br>보낼까요?</h2><div class="amount">30,000원</div><div class="confirm"><dl><div><dt>받는 은행</dt><dd>하늘은행</dd></div><div><dt>계좌번호</dt><dd>000-1234-5678</dd></div><div><dt>출금 계좌</dt><dd>내 생활비 통장</dd></div><div><dt>수수료</dt><dd>무료</dd></div></dl></div><button class="primary bottom" id="send">보내기</button>';}
$('#screen').innerHTML=html;
if(!running){$('#start').hidden=false;$('#start').textContent='연습으로 다시 하기';}
$('#back')?.addEventListener('click',()=>{event('backtrack');go(r.step==='confirm'?(r.variant==='A'?'account':'suggestions'):r.step==='suggestions'?'account':'bank');});
document.querySelectorAll('[data-bank]').forEach(b=>b.addEventListener('click',()=>{r.bank=b.dataset.bank;event('bank_selected',r.bank==='하늘은행'?'target':'other');if(r.variant==='A'){go('account');}else if(r.bank!=='하늘은행'){event('error','wrong_bank');let e=$('#error');if(!e){e=document.createElement('p');e.id='error';e.className='error';e.setAttribute('role','alert');$('#screen').append(e);}e.textContent='받는 분의 은행을 다시 확인해 주세요.';}else go('confirm');}));
$('#account-form')?.addEventListener('submit',e=>{e.preventDefault();const raw=$('#account').value.trim();if(!raw)return fail('empty_account','계좌번호를 입력해 주세요.');if(!/^[0-9\s-]+$/.test(raw)||raw.replace(/[\s-]/g,'')!=='00012345678')return fail('incorrect_account','계좌번호를 다시 확인해 주세요.');r.accountValid=true;event('account_valid');if(r.variant==='A'&&r.bank!=='하늘은행')return fail('wrong_bank','받는 분의 은행을 다시 확인해 주세요.');go(r.variant==='A'?'confirm':'suggestions');});
$('#send')?.addEventListener('click',()=>finish('completed'));}
function result(r){return {schemaVersion:1,experimentId:EXP,id:r.id,assignmentSource:r.assignmentSource,variant:r.variant,mode:r.mode,status:r.status,elapsedMs:elapsed(r),errors:r.events.filter(e=>e.type==='error').length,backtracks:r.events.filter(e=>e.type==='backtrack').length,events:r.events};}
$('#start').onclick=()=>start();$('#reset').onclick=()=>finish('abandoned');document.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>start(b.dataset.preview));
function download(r){const blob=new Blob([JSON.stringify(result(r),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`transfer-${r.mode}-${r.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download').onclick=()=>download(current());
const firstDownload=document.createElement('button');firstDownload.textContent='보관된 첫 참여 결과 내려받기';firstDownload.onclick=()=>{const r=state.runs.find(x=>x.mode==='first_run');if(r)download(r);else $('#run-status').textContent='이 탭에는 아직 첫 참여 기록이 없습니다.';};$('.teacher').append(firstDownload);
function aggregate(){const all=[...imported.values()],first=all.filter(r=>r.mode==='first_run');$('#results').innerHTML=`<p>첫 참여 ${first.length}건 · 제외된 연습/미리보기 ${all.length-first.length}건</p><table><thead><tr><th>흐름</th><th>참여</th><th>완료율</th><th>완료 시간 중앙값</th><th>완료 시간 범위</th><th>오류 / 뒤로</th></tr></thead><tbody>${['A','B'].map(v=>{const rows=first.filter(r=>r.variant===v),done=rows.filter(r=>r.status==='completed'),times=done.map(r=>r.elapsedMs/1000).sort((a,b)=>a-b),n=times.length,median=n?(times[Math.floor((n-1)/2)]+times[Math.floor(n/2)])/2:0;return `<tr><th>${v}</th><td>${rows.length}</td><td>${rows.length?`${done.length}/${rows.length} (${Math.round(done.length/rows.length*100)}%)`:'—'}</td><td>${n?median.toFixed(1)+'초':'—'}</td><td>${n?times[0].toFixed(1)+'–'+times[n-1].toFixed(1)+'초':'—'}</td><td>${rows.reduce((s,r)=>s+r.errors,0)} / ${rows.reduce((s,r)=>s+r.backtracks,0)}</td></tr>`;}).join('')}</tbody></table><p class="small">시간은 완료한 실행만 요약합니다. 진행 중·중도 종료도 완료율의 분모에 포함됩니다. 선택적으로 공유한 결과이므로 제출하지 않은 참여자는 포함되지 않습니다. 파일은 신원을 검증하지 않으며 조작 여부를 판정하지 않습니다.</p>`;}
function importTexts(texts){const counts={accepted:0,rejected:0,duplicates:0};for(const text of texts){try{counts[TransferCore.ingest(imported,text)]++;}catch{counts.rejected++;}}$('#import-status').textContent=`추가 ${counts.accepted}건 · 중복 제외 ${counts.duplicates}건 · 형식 오류 ${counts.rejected}건`;aggregate();}
$('#import').onchange=async e=>{const texts=[];for(const file of e.target.files){texts.push(file.size>1000000?'':await file.text());}importTexts(texts);e.target.value='';};
$('#paste-import').onclick=()=>{importTexts([$('#paste-json').value]);$('#paste-json').value='';};
$('#clear').onclick=()=>{imported.clear();aggregate();$('#import-status').textContent='가져온 결과를 비웠습니다.';};
document.addEventListener('visibilitychange',()=>{if(current()?.status==='running')event(document.hidden?'page_hidden':'page_visible');});
save();render();aggregate();
})();
