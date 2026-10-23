export const STAGES=[{label:'연습 · 글자 나누기',mode:1,practice:true},{label:'연습 · 이름 나누기',mode:2,practice:true},{label:'1라운드 · 글자 나누기',mode:1},{label:'2라운드 · 이름 나누기',mode:2}];
// 가상 예제 이름: 실제 참가자와 무관한 합성 문자열입니다.
const NAMES=['가나다','라마바','사아자','차카타','파하가','나다라'];
const PRACTICE=['가가가','나나나'];
export const empty=()=>({next:1,rooms:[]});
const error=(s,status=409)=>Object.assign(new Error(s),{status});
const online=(p,t)=>p&&t-p.seen<5000&&!p.left;
export function target(r,p){
 if(r.phase!=='playing'||r.paused||r.restart.some(Boolean))return null;
 const g=r.game,mode=STAGES[r.stage].mode;
 const pos=mode===1?(!g.done[0]||!g.done[1]?(g.done[p]?null:p):(g.index%2===p?2:null)):(g.index%2===p?g.done.findIndex(x=>!x):null);
 return pos===null||pos<0?null:{pos,char:g.names[g.index][pos],ticket:`${r.run}:${r.stage}:${g.index}:${pos}`};
}
function tick(r,t){
 if(r.phase==='playing'){
  const g=r.game,deadline=Math.min(...r.players.map(p=>p.seen+5000));
  const activeEnd=r.paused?g.last:Math.max(g.last,Math.min(t,deadline));
  const dt=activeEnd-g.last;
  g.activeMs+=dt;g.pauseMs+=t-g.last-dt;
  for(let p=0;p<2;p++)g[target(r,p)?'available':'waiting'][p]+=dt;
  g.last=t;
 }
 r.paused=r.players.length<2||!r.players.every(p=>online(p,t))||r.restart.some(Boolean);
}
function start(r,t){r.phase='playing';r.paused=false;r.ready=[false,false];r.game={names:STAGES[r.stage].practice?PRACTICE:NAMES,index:0,done:[false,false,false],last:t,started:t,activeMs:0,pauseMs:0,available:[0,0],waiting:[0,0],typed:[0,0],completed:[]};}
function view(r,p,t){
 let game=null;
 if(r.phase==='playing'){
  const g=r.game,reveal=STAGES[r.stage].mode===2||g.done[0]&&g.done[1];
  game={index:g.index,count:g.names.length,letters:[g.names[g.index][0],g.names[g.index][1],reveal?g.names[g.index][2]:null],done:g.done,thirdOwner:reveal?g.index%2:null,turn:g.index%2,target:target(r,p),activeMs:g.activeMs,pauseMs:g.pauseMs};
 }
 return {room:r.number,you:p,phase:r.phase,stage:r.stage,stageInfo:STAGES[r.stage],barrier:`${r.run}:${r.stage}`,ready:r.ready,restart:r.restart,players:r.players.map((x,i)=>({role:i,name:i?'다온별':'누리봄',online:online(x,t)})),paused:r.paused,game,results:r.results,network:r.players.map(x=>({samples:x.net.n,average:x.net.n?x.net.total/x.net.n:0,max:x.net.max})),serverTime:t};
}
export function process(state,b,t=Date.now()){
 t=Math.max(t,state.time||0);state.time=t;
 if(!b||typeof b!=='object'||!['join','poll','ready','input','restart','leave'].includes(b.type))throw error('올바르지 않은 요청입니다.',400);
 if(!/^[a-f0-9]{48}$/.test(b.token||'')||!/^[a-zA-Z0-9-]{16,80}$/.test(b.tab||'')||!/^[a-zA-Z0-9-]{16,80}$/.test(b.id||''))throw error('참가 정보가 올바르지 않습니다.',400);
 state.rooms=state.rooms.filter(r=>t-r.touched<30*60*1000);
 let r=state.rooms.find(r=>r.players.some(p=>p.token===b.token)),p=r?r.players.findIndex(p=>p.token===b.token):-1;
 if(b.type==='join'&&(!r||r.players[p].left)){
  r=state.rooms.find(r=>r.phase==='ready'&&r.stage===0&&r.players.length===1&&online(r.players[0],t)&&!r.players[0].left);
  if(!r){if(state.rooms.length>=40)throw error('지금 방이 가득 찼어요. 잠시 후 다시 참가해 주세요.',429);r={number:state.next++,players:[],phase:'ready',stage:0,run:0,ready:[false,false],restart:[false,false],game:null,results:[],paused:true,touched:t};state.rooms.push(r);}
  r.players.push({token:b.token,tab:b.tab,seen:t,left:false,net:{n:0,total:0,max:0},recent:[],requests:[]});p=r.players.length-1;
 }
 if(!r)throw error('방이 만료되었습니다. 다시 참가해 주세요.',404);
 const player=r.players[p];
 if(player.tab!==b.tab&&online(player,t))throw error('이미 다른 탭에서 참가 중입니다. 원래 탭을 사용해 주세요.',423);
 tick(r,t);
 if(player.recent.includes(b.id))return view(r,p,t);
 player.requests=player.requests.filter(x=>t-x<1000);
 if(player.requests.length>=12)throw error('요청이 너무 빨라요. 잠시 기다려 주세요.',429);
 player.requests.push(t);player.tab=b.tab;player.seen=t;r.touched=t;
 if(Number.isFinite(b.rtt)&&b.rtt>=0&&b.rtt<60000){player.net.n++;player.net.total+=b.rtt;player.net.max=Math.max(player.net.max,b.rtt);}
 tick(r,t);
 if(b.type==='leave'){r.phase='aborted';player.left=true;}
 else if(b.type==='join'||b.type==='poll'){}
 else if(r.phase==='aborted')throw error('짝이 나가서 이 방은 종료되었습니다. 새 짝 찾기를 눌러 주세요.');
 else if(b.type==='restart'){
  if(r.players.length!==2||!r.players.every(x=>online(x,t)))throw error('두 사람 모두 연결되어야 합니다.');
  if(b.barrier!==`${r.run}:${r.stage}`)throw error('이전 화면의 요청입니다.');
  r.restart[p]=true;r.paused=true;
  if(r.restart.every(Boolean)){r.run++;r.stage=0;r.phase='ready';r.ready=[false,false];r.restart=[false,false];r.game=null;r.results=[];r.players.forEach(x=>x.net={n:0,total:0,max:0});r.paused=false;}
 }else if(b.type==='ready'){
  if(r.phase!=='ready'||b.barrier!==`${r.run}:${r.stage}`)throw error('이미 시작되었거나 이전 단계의 요청입니다.');
  if(r.paused)throw error('두 사람의 연결을 기다려 주세요.');
  r.ready[p]=true;if(r.ready.every(Boolean))start(r,t);
 }else if(b.type==='input'){
  const x=target(r,p);
  if(!x||b.ticket!==x.ticket)throw error('현재 내 차례와 글자를 확인해 주세요.');
  const text=typeof b.text==='string'?b.text.normalize('NFC'):'';
  if(!/^[가-힣]$/.test(text))throw error('완성된 한글 한 글자를 입력해 주세요.',400);
  if(text!==x.char)throw error('화면의 글자와 달라요. 다시 입력해 주세요.',400);
  const g=r.game;g.done[x.pos]=true;g.typed[p]++;
  if(g.done.every(Boolean)){
   g.completed.push({name:g.names[g.index],activeMs:g.activeMs,wallMs:t-g.started});g.index++;g.done=[false,false,false];
   if(g.index===g.names.length){r.results.push({stage:r.stage,...STAGES[r.stage],activeMs:g.activeMs,pauseMs:g.pauseMs,wallMs:t-g.started,available:g.available,waiting:g.waiting,typed:g.typed,completed:g.completed});r.stage++;r.phase=r.stage===4?'results':'ready';r.ready=[false,false];r.game=null;}
  }
 }
 player.recent.push(b.id);if(player.recent.length>100)player.recent.shift();
 return view(r,p,t);
}
