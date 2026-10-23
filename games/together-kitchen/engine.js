export const W=11,H=9,DURATION=60;
export const recipes=[{id:0,name:'당근 감자 수프',ingredients:['carrot','potato']},{id:1,name:'토마토 감자 수프',ingredients:['tomato','potato']}];
const names={carrot:'당근',potato:'감자',tomato:'토마토'};
const baseStations=[{x:2,y:0,type:'ingredient',ingredient:'carrot',label:'당근',icon:'🥕'},{x:3,y:0,type:'ingredient',ingredient:'potato',label:'감자',icon:'🥔'},{x:4,y:0,type:'ingredient',ingredient:'tomato',label:'토마토',icon:'🍅'},{x:0,y:2,type:'pot',index:0,label:'화구 1',icon:'🍲'},{x:0,y:4,type:'pot',index:1,label:'화구 2',icon:'🍲'},{x:10,y:4,type:'serve',index:0,label:'테이블 1',icon:'🧑‍🤝‍🧑'},{x:10,y:6,type:'serve',index:1,label:'테이블 2',icon:'🧑‍🤝‍🧑'}];
const mirror=(x,y,id)=>[id&1?W-1-x:x,id&2?H-1-y:y];
export const layouts=['왼쪽 위 주방','오른쪽 위 주방','왼쪽 아래 주방','오른쪽 아래 주방'].map((name,id)=>({id,name,stations:baseStations.map(s=>{const [x,y]=mirror(s.x,s.y,id);return {...s,x,y};})}));
export const stations=layouts[0].stations;
export function walkable(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&x<=9&&y>=1&&y<=7;}
export function stationSpot(s){return [Math.max(1,Math.min(W-2,s.x)),Math.max(1,Math.min(H-2,s.y))];}
const emptyPot=()=>({state:'empty',ingredients:[],time:0,recipeId:null});
const recipeFor=i=>({...recipes[i%recipes.length],ingredients:[...recipes[i%recipes.length].ingredients]});
export function createGame(mode='ai',practice=false,layoutId=0){
 const id=Number.isInteger(layoutId)?((layoutId%4)+4)%4:0,layout=layouts[id];
 return {mode,practice,layout,stations:layout.stations,status:'playing',time:DURATION,elapsed:0,score:0,cleaned:0,servedFlash:0,collisions:0,switches:0,selected:0,pots:[emptyPot(),emptyPot()],tables:[0,1].map(i=>({state:'waiting',time:0,orderIndex:i,recipe:recipeFor(i),servedFlash:0})),players:[[3,4],[6,4]].slice(0,mode==='solo'?1:2).map(([a,b])=>{const [x,y]=mirror(a,b,id);return {x,y,item:null,soupFor:null,dishRecipeId:null,targetPot:null,targetRecipe:null,cooldown:0,blockedAt:-10};}),events:[],aiTask:'주방 살펴보기',aiClock:0};
}
export function move(g,id,dx,dy){if(g.status!=='playing'||Math.abs(dx)+Math.abs(dy)!==1)return false;const p=g.players[id];if(!p||p.cooldown>0)return false;const x=p.x+dx,y=p.y+dy;p.cooldown=.15;if(!walkable(x,y))return false;if(g.players.some((q,i)=>i!==id&&q.x===x&&q.y===y)){if(g.elapsed-p.blockedAt>.6){g.collisions++;p.blockedAt=g.elapsed;}return false;}p.x=x;p.y=y;return true;}
const matchingRecipes=ingredients=>recipes.filter(r=>ingredients.every(i=>r.ingredients.includes(i)));
export function interact(g,id){
 if(g.status!=='playing')return '';
 const p=g.players[id];if(!p)return '';
 const s=g.stations.find(s=>Math.abs(p.x-s.x)+Math.abs(p.y-s.y)===1);
 if(!s)return '시설 바로 옆 칸에서 행동하세요';
 if(s.type==='ingredient'){
  if(!p.item){p.item=s.ingredient;return `${names[p.item]}를 집었어요`;}
  if(p.item===s.ingredient){p.item=null;p.targetPot=null;return `${s.label}를 돌려놓았어요`;}
  return p.item==='soup'?'완성한 수프를 해당 테이블에 서빙하세요':'들고 있는 재료를 원래 칸에 돌려놓으세요';
 }
 const index=s.index,pot=g.pots[index],table=g.tables[index];
 if(s.type==='pot'){
  if(pot.state==='ready'){
   if(p.item)return '빈손으로 수프를 꺼내세요';
   p.item='soup';p.dishRecipeId=pot.recipeId;p.soupFor=null;p.targetPot=null;g.pots[index]=emptyPot();return `${recipes[p.dishRecipeId].name}를 들었어요`;
  }
  if(pot.state==='cooking')return '조리 중이에요';
  if(!p.item)return '해당 테이블 주문의 재료 두 가지를 넣어 주세요';
  if(!matchingRecipes([...pot.ingredients,p.item]).length)return '이 재료 조합으로 만들 수 있는 수프가 없어요';
  if(pot.ingredients.includes(p.item))return '이미 넣은 재료예요';
  const added=p.item;pot.ingredients.push(added);const matches=matchingRecipes(pot.ingredients);pot.recipeId=matches.length===1?matches[0].id:null;p.item=null;p.targetPot=null;p.targetRecipe=null;
  if(pot.ingredients.length===2){pot.state='cooking';pot.time=1.5;return `${index+1}번 수프 조리 시작!`;}
  pot.state='filling';return `${names[added]}를 넣었어요. 재료 하나 더!`;
 }
 if(s.type==='serve'){
  if(table.state==='eating')return '손님이 식사 중이에요';
  if(table.state==='dirty'){
   if(p.item)return '빈손으로 테이블을 치워 주세요';
   g.cleaned++;table.orderIndex++;table.recipe=recipeFor(table.orderIndex);table.state='waiting';table.time=0;return `${index+1}번 테이블 정리 완료! 새 주문이 왔어요`;
  }
  if(p.item==='soup'){
   if(p.dishRecipeId!==table.recipe.id)return '이 테이블의 주문과 다른 수프예요';
   p.item=null;p.soupFor=null;p.dishRecipeId=null;g.score++;g.servedFlash=1.8;table.servedFlash=1.8;table.state='eating';table.time=1.5;g.events.push({time:g.elapsed,player:id,table:index});return '주문 완료! +1';
  }
  return '이 테이블의 완성한 수프를 가져오세요';
 }
}
export function path(g,id,tx,ty,avoid=true){const p=g.players[id];if(!p)return null;const queue=[[p.x,p.y,[]]],seen=new Set([`${p.x},${p.y}`]);for(let i=0;i<queue.length;i++){const [x,y,steps]=queue[i];if(x===tx&&y===ty)return steps;for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const a=x+dx,b=y+dy,key=`${a},${b}`;if(!walkable(a,b)||seen.has(key)||(avoid&&g.players.some((q,j)=>j!==id&&a===q.x&&b===q.y)))continue;seen.add(key);queue.push([a,b,[...steps,[dx,dy]]]);}}return null;}
export function aiStep(g){
 if(g.status!=='playing'||g.players.length<2)return;
 const p=g.players[1],human=g.players[0],jobs=[];
 const station=(type,index)=>g.stations.find(s=>s.type===type&&s.index===index);
 const source=ingredient=>g.stations.find(s=>s.ingredient===ingredient);
 const add=(s,task,priority=0,targetPot=null,targetRecipe=null)=>{const target=stationSpot(s),steps=path(g,1,...target);if(steps)jobs.push({target,steps,task,priority,targetPot,targetRecipe});};
 // Match demand by recipe, independently of which stove or table has that index.
 const demand=recipes.map(r=>g.tables.filter(t=>t.state==='waiting'&&t.recipe.id===r.id).length);
 for(const pot of g.pots)if(['cooking','ready'].includes(pot.state))demand[pot.recipeId]--;
 for(const player of g.players)if(player.item==='soup')demand[player.dishRecipeId]--;
 const plans=[];
 const order=[0,1].sort((a,b)=>g.pots[b].ingredients.length-g.pots[a].ingredients.length);
 for(const i of order){const pot=g.pots[i];if(!['empty','filling'].includes(pot.state))continue;
  const recipe=matchingRecipes(pot.ingredients).filter(r=>demand[r.id]>0).sort((a,b)=>Number(b.id===p.targetRecipe)-Number(a.id===p.targetRecipe))[0];
  if(recipe){plans.push({i,recipe});demand[recipe.id]--;}
 }
 if(p.item==='soup'){
  for(let i=0;i<2;i++)if(g.tables[i].state==='waiting'&&g.tables[i].recipe.id===p.dishRecipeId)add(station('serve',i),`${i+1}번 테이블 서빙`,100);
 }else if(p.item){
  for(const {i,recipe} of plans)if(recipe.ingredients.includes(p.item)&&!g.pots[i].ingredients.includes(p.item))add(station('pot',i),`${i+1}번 화구에 ${names[p.item]} 넣기`,i===p.targetPot?30:20,i,recipe.id);
  if(!jobs.length)add(source(p.item),`${names[p.item]} 돌려놓기`,0);
 }else {
  for(let i=0;i<2;i++){
   if(g.tables[i].state==='dirty')add(station('serve',i),`${i+1}번 테이블 치우기`,60);
   if(g.pots[i].state==='ready'&&g.tables.some(t=>t.state==='waiting'&&t.recipe.id===g.pots[i].recipeId))add(station('pot',i),`${i+1}번 화구 수프 꺼내기`,50);
  }
  for(const {i,recipe} of plans)for(const ingredient of recipe.ingredients){
   if(!g.pots[i].ingredients.includes(ingredient)&&human.item!==ingredient)add(source(ingredient),`${recipe.name} 재료 가져오기`,g.pots[i].state==='filling'?20:10,i,recipe.id);
  }
 }
 jobs.sort((a,b)=>(b.priority-b.steps.length)-(a.priority-a.steps.length));
 const job=jobs[0];
 if(job){g.aiTask=job.task;if(!job.steps.length){if(job.targetPot!==null){p.targetPot=job.targetPot;p.targetRecipe=job.targetRecipe;}interact(g,1);}else move(g,1,...job.steps[0]);return;}
 g.aiTask='조리와 동료의 작업 기다리기';
 const waiting=path(g,1,5,4);if(waiting?.length)move(g,1,...waiting[0]);
}
export function tick(g,dt){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 const step=g.practice?dt:Math.min(dt,Math.max(0,DURATION-g.elapsed));
 g.elapsed+=step;g.time=Math.max(0,DURATION-g.elapsed);g.servedFlash=Math.max(0,g.servedFlash-step);
 g.players.forEach(p=>p.cooldown=Math.max(0,p.cooldown-step));
 for(const pot of g.pots)if(pot.state==='cooking'){pot.time=Math.max(0,pot.time-step);if(pot.time<=1e-9){pot.state='ready';pot.time=0;}}
 for(const table of g.tables){table.servedFlash=Math.max(0,table.servedFlash-step);if(table.state==='eating'){table.time=Math.max(0,table.time-step);if(table.time<=1e-9){table.state='dirty';table.time=0;}}}
 if(!g.practice&&g.time<=1e-9){g.time=0;g.status='finished';return;}
 if(g.mode==='ai'){g.aiClock+=step;if(g.aiClock>=.15){g.aiClock=0;aiStep(g);}}
}
export function discard(g,id){
 if(g.status!=='playing'||!g.players[id])return '';
 const p=g.players[id];if(!p.item)return '손이 이미 비어 있어요';
 const name=p.item==='soup'?(recipes[p.dishRecipeId]?.name||'수프'):names[p.item];
 p.item=null;p.dishRecipeId=null;p.soupFor=null;p.targetPot=null;p.targetRecipe=null;
 return `${name}를 비웠어요. 다시 요리할 수 있어요`;
}
