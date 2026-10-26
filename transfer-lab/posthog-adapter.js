(function(root){
'use strict';
const types=new Set(['exposure','step_view','amount_valid','completion','abandonment','error','backtrack']);
const steps=new Set(['bank','account','suggestions','amount','confirm']);
const codes=new Set(['teacher_override','growthbook_0','growthbook_1','empty_account','incorrect_account','wrong_bank','empty_amount','incorrect_amount']);
function payload(run,event,index,context){
 if(!types.has(event.type)||!steps.has(event.step)||!['A','B'].includes(run.variant)||!['first_run','repeat','teacher_preview'].includes(run.mode))return null;
 if(!/^[a-f0-9-]{36}$/.test(run.id)||!Number.isFinite(event.elapsedMs)||event.elapsedMs<0||event.elapsedMs>604800000)return null;
 return {experiment_id:'transfer-flow-v2',layout_version:'mobile-v2-amount',collection_version:'posthog-direct-v1',classroom_id:context.classroom,session_id:context.session,run_id:run.id,variant:run.variant,mode:run.mode,synthetic:context.synthetic,step:event.step,elapsed_ms:Math.round(event.elapsedMs),sequence:index,status:run.status,errors:run.events.filter(e=>e.type==='error').length,backtracks:run.events.filter(e=>e.type==='backtrack').length,...(codes.has(event.code)?{code:event.code}:{}),consent_version:'posthog-us-1year-v1'};
}
function context(search){const q=new URLSearchParams(search),safe=k=>/^[a-zA-Z0-9_-]{1,64}$/.test(q.get(k)||'')?q.get(k):'day7';return {classroom:safe('classroom'),session:safe('session'),synthetic:q.get('synthetic')==='1'};}
function create(config,ctx,{load=()=>import('./vendor/posthog-1.438.23.js'),onFailure=()=>{}}={}){
 let enabled=false,sdk=null,ready=null;const queue=[];
 const allowed=()=>config.enabled===true&&config.ipDiscardVerified===true&&/^phc_[A-Za-z0-9_-]+$/.test(config.token||'');
 function sanitize(event){
  if(!event||!/^transfer_(exposure|step_view|amount_valid|completion|abandonment|error|backtrack)$/.test(event.event))return null;
  const p=event.properties,keys=['experiment_id','layout_version','collection_version','classroom_id','session_id','run_id','variant','mode','synthetic','step','elapsed_ms','sequence','status','errors','backtracks','code','consent_version'];
  const clean={};for(const k of keys)if(p[k]!==undefined)clean[k]=p[k];
  if(!clean.run_id)return null;
  event.properties={...clean,token:config.token,distinct_id:clean.run_id,$insert_id:clean.run_id+':'+clean.sequence,$process_person_profile:false,$geoip_disable:true};
  delete event.$set;delete event.$set_once;return event;
 }
 function send(item){try{sdk.capture(item.name,item.properties);}catch{onFailure();}}
 function enable(){
  if(!allowed())return Promise.resolve(false);enabled=true;
  if(!ready)ready=load().then(m=>{sdk=m.default;sdk.init(config.token,{api_host:'https://us.i.posthog.com',autocapture:false,capture_pageview:false,capture_pageleave:false,disable_session_recording:true,person_profiles:'never',persistence:'memory',disable_persistence:true,disable_surveys:true,disable_external_dependency_loading:true,advanced_disable_flags:true,advanced_disable_feature_flags:true,capture_performance:false,capture_exceptions:false,rageclick:false,ip:false,save_referrer:false,save_campaign_params:false,before_send:sanitize});while(queue.length)send(queue.shift());return true;}).catch(()=>{onFailure();return false;});
  return ready;
 }
 return {available:allowed,enable,sanitize,record(run,event,index){if(!enabled)return;const p=payload(run,event,index,ctx);if(!p)return;const item={name:'transfer_'+event.type,properties:p};if(sdk)send(item);else if(queue.length<500)queue.push(item);else onFailure();}};
}
root.TransferPostHog={payload,context,create};
})(globalThis);
