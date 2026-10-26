// Charts use the same isolated fixture summary as the table.
globalThis.renderTransferDemoCharts = function(summary) {
  const metrics = [
    {title:'완료율',note:'전체 참여 기준',max:100,ticks:['0%','50%','100%'],value:r=>100*r.completed/r.count,label:r=>(100*r.completed/r.count).toFixed(1).replace(/\.0$/,'')+'%',detail:r=>`${r.completed}/${r.count}명 완료`},
    {title:'완료 시간 중앙값',note:'완료자만 · 초',max:40,ticks:['0','20','40초'],value:r=>r.median,label:r=>r.median+'초',detail:r=>`완료 ${r.completed}명 기준`},
    {title:'1인당 오류',note:'전체 참여 기준 · 회/명',max:1,ticks:['0','0.50','1.00'],value:r=>r.errors/r.count,label:r=>(r.errors/r.count).toFixed(2)+'회/명',detail:r=>`총 ${r.errors}회 ÷ ${r.count}명`},
    {title:'1인당 뒤로가기',note:'전체 참여 기준 · 회/명',max:0.5,ticks:['0','0.25','0.50'],value:r=>r.backtracks/r.count,label:r=>(r.backtracks/r.count).toFixed(2)+'회/명',detail:r=>`총 ${r.backtracks}회 ÷ ${r.count}명`}
  ];
  return metrics.map(m=>`<section class="chart-card" aria-label="${m.title}"><h2>${m.title}</h2><p class="chart-note">${m.note}</p><div class="chart-bars">${summary.groups.map(r=>`<div class="bar-row variant-${r.variant}"><span class="variant-label">${r.variant}</span><div class="bar-content"><div class="bar-caption"><strong>${m.label(r)}</strong><span>${m.detail(r)}</span></div><div class="bar-track" role="img" aria-label="${r.variant}: ${m.label(r)}, ${m.detail(r)}"><div class="chart-bar" style="width:${100*m.value(r)/m.max}%"></div></div></div></div>`).join('')}</div><div class="chart-axis" aria-hidden="true">${m.ticks.map(t=>`<span>${t}</span>`).join('')}</div></section>`).join('');
};
