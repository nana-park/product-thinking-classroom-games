// Fixed classroom examples, never real responses. Loaded only into the isolated demo view.
globalThis.TransferDemoRuns = (() => {
  const specs = [
    ['A',18,0,0,true],['A',22,1,1,true],['A',25,0,0,true],['A',27,2,1,true],
    ['A',31,1,0,true],['A',36,1,1,true],['A',12,2,1,false],['A',20,1,0,false],
    ['B',14,0,0,true],['B',17,0,0,true],['B',19,1,1,true],['B',21,0,0,true],
    ['B',24,1,0,true],['B',28,0,0,true],['B',16,2,1,false]
  ];
  return specs.map(([variant,seconds,errors,backtracks,done],i)=>{
    const first=variant==='A'?'bank':'account',previous=variant==='A'?'account':'suggestions';
    const events=[];const add=(type,step,code)=>events.push({type,step,...(code?{code}:{})});
    add('exposure',first,'synthetic_demo');add('step_view',first);
    if(variant==='A'){add('bank_selected','bank','target');add('step_view','account');}
    add('account_valid','account');
    if(variant==='B'){add('step_view','suggestions');add('bank_selected','suggestions','target');}
    add('step_view','amount');for(let e=0;e<errors;e++)add('error','amount',e===0?'empty_amount':'incorrect_amount');
    for(let b=0;b<backtracks;b++){add('backtrack','amount');add('step_view',previous);add(variant==='A'?'account_valid':'bank_selected',previous,variant==='B'?'target':undefined);add('step_view','amount');}
    if(done){add('amount_valid','amount');add('step_view','confirm');add('completion','confirm');}else add('abandonment','amount');
    events.forEach((e,j)=>e.elapsedMs=Math.round(j*seconds*1000/(events.length-1)));
    return {synthetic:true,layoutVersion:'mobile-v2-amount',schemaVersion:1,experimentId:'transfer-flow-v2',id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,assignmentSource:'synthetic_demo',variant,mode:'first_run',status:done?'completed':'abandoned',elapsedMs:seconds*1000,errors,backtracks,events};
  });
})();
