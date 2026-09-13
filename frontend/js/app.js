const COLORS={
  ink:'#F5F7FA',muted:'#B6BEC7',subtle:'#8C939E',line:'#46505C',
  forest:'#2F8F67',forest2:'#49B47F',teal:'#3BA6AC',orange:'#FF7A00',amber:'#F4B41A',
  red:'#FF6B5F',blue:'#69B4E5',paleGreen:'#24392E',paleOrange:'#3B2A1E',paleAmber:'#3B3320',paleTeal:'#23383A'
};
const mines=[
{name:'Chikla',state:'Maharashtra',lat:21.54333,lon:79.75389,score:82,confidence:88,access:'Good',zone:'A',signal:'Stable',annual:40200,grade:29.8,depth:420},
{name:'Dongri Buzurg',state:'Maharashtra',lat:21.54866,lon:79.68289,score:79,confidence:86,access:'Good',zone:'B',signal:'Watch',annual:39100,grade:28.9,depth:360},
{name:'Beldongri',state:'Maharashtra',lat:21.34028,lon:79.29222,score:76,confidence:84,access:'Moderate',zone:'B',signal:'Stable',annual:32700,grade:27.4,depth:310},
{name:'Kandri',state:'Maharashtra',lat:21.41169,lon:79.26632,score:80,confidence:87,access:'Good',zone:'A',signal:'Watch',annual:35600,grade:29.2,depth:385},
{name:'Munsar',state:'Maharashtra',lat:21.40151,lon:79.28103,score:84,confidence:88,access:'Good',zone:'A',signal:'Stable',annual:41800,grade:31.1,depth:395},
{name:'Gumgaon',state:'Maharashtra',lat:21.402,lon:78.983,score:74,confidence:82,access:'Moderate',zone:'C',signal:'Stable',annual:30100,grade:26.8,depth:275},
{name:'Balaghat',state:'Madhya Pradesh',lat:21.84995,lon:80.22672,score:85,confidence:89,access:'Good',zone:'A',signal:'High attention',annual:44900,grade:30.6,depth:455},
{name:'Ukwa',state:'Madhya Pradesh',lat:21.97425,lon:80.46661,score:78,confidence:85,access:'Moderate',zone:'B',signal:'Stable',annual:33800,grade:27.9,depth:290},
{name:'Tirodi',state:'Madhya Pradesh',lat:21.68351,lon:79.72464,score:87,confidence:91,access:'Good',zone:'A',signal:'High attention',annual:41058,grade:31.4,depth:410},
{name:'Sitapatore',state:'Madhya Pradesh',lat:21.66667,lon:79.66667,score:75,confidence:83,access:'Moderate',zone:'C',signal:'Stable',annual:29400,grade:26.5,depth:255}
];
const assets=[
{name:'EX-04',type:'Excavator',util:72,down:14,breakdowns:3,risk:'HIGH',maintenance:'Due now'},
{name:'DT-03',type:'Dumper',util:78,down:8,breakdowns:1,risk:'MEDIUM',maintenance:'Due in 7d'},
{name:'CR-01',type:'Crusher',util:85,down:3,breakdowns:0,risk:'LOW',maintenance:'On schedule'},
{name:'DR-02',type:'Drill Rig',util:70,down:11,breakdowns:2,risk:'MEDIUM',maintenance:'Due in 5d'}
];
const production={labels:['Apr','May','Jun','Jul','Aug','Sep'],target:[10000,10000,10000,10000,10000,10000],actual:[9100,8600,8200,7900,7600,7800],forecast:[9000,8400,8000,7700,7600,8200],util:[84,81,79,76,74,78],down:[5,7,8,10,12,9],rain:[42,65,58,79,84,72],pros:[79,81,83,84,86,87]};
const history=[['Apr',9100,84,5,42,79,9],['May',8600,81,7,65,81,14],['Jun',8200,79,8,58,83,18],['Jul',7900,76,10,79,84,21],['Aug',7600,74,12,84,86,24],['Sep',8200,78,9,72,87,18]];
let selectedMine=null;
let maps={main:null,mini:null};
let layers={heat:null,miniHeat:null,contours:null,mines:null,occ:null,stateRegions:null};
let charts={};
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('en-IN');
const scoreClass=s=>s>=80?'high':s>=65?'medium':'low';
const colorForScore=s=>s>=85?COLORS.orange:s>=80?COLORS.amber:s>=65?COLORS.forest2:'#1f6178';
const totalAnnual=mines.reduce((a,m)=>a+m.annual,0);
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)}
function popup(m){return `<div class="popup-title">${esc(m.name)}</div><div class="popup-score">${m.score}%</div><div class="popup-small">Modelled prospectivity · ${m.confidence}% confidence<br>${esc(m.state)} · Zone ${m.zone}</div>`}
function initMineSelect(){
 const sel=$('#mineSelect');if(!sel)return;
 sel.innerHTML='<option value="ALL">All 10 locations</option>'+mines.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('');
 sel.value='ALL';sel.addEventListener('change',()=>setSelectedMine(sel.value==='ALL'?null:sel.value));
}
function setSelectedMine(name){
 selectedMine=name?mines.find(m=>m.name===name)||null:null;
 const sel=$('#mineSelect');if(sel)sel.value=selectedMine?selectedMine.name:'ALL';
 renderGlobalContext(); renderOverviewContext(); renderExploreContext(); renderMineTable(); renderExploreTable();
 if(maps.main){ if(selectedMine){maps.main.setView([selectedMine.lat,selectedMine.lon],11,{animate:true});} else {fitAll(maps.main)} drawMineFocus(maps.main); }
 if(maps.mini){ if(selectedMine){maps.mini.setView([selectedMine.lat,selectedMine.lon],10,{animate:true});} else {fitAll(maps.mini)} drawMineFocus(maps.mini); }
 if(charts.overviewAnnualChart) charts.overviewAnnualChart.resize();
 updateOverviewHeader();
}
function renderGlobalContext(){
 const mine=selectedMine;
 if($('#heroMine'))$('#heroMine').textContent=mine?mine.name:'MOIL Network';
 if($('#heroState'))$('#heroState').textContent=mine?mine.state:'Maharashtra + Madhya Pradesh';
 if($('#heroScore'))$('#heroScore').textContent=mine?mine.score:'10';
 if($('#heroScoreSuffix'))$('#heroScoreSuffix').textContent=mine?'%':'locations';
 if($('#heroScoreLabel'))$('#heroScoreLabel').textContent=mine?'prospectivity':'mine network';
 const highest=[...mines].sort((a,b)=>b.score-a.score)[0];
 if($('#kPros'))$('#kPros').textContent=(mine?mine.score:highest.score)+'%';
}
function updateOverviewHeader(){
 const el=$('#overviewChartTitle');const period=$('#overviewChartPeriod');
 if(!el||!period)return;
 if(selectedMine){el.textContent='Selected mine intelligence';period.textContent='MINE VIEW';}
 else {el.textContent='Annual production across 10 mine locations';period.textContent='ALL LOCATIONS';}
}
function renderOverviewContext(){
 const annual=$('#overviewAnnualWrap'), detail=$('#overviewMineWrap'), foot=$('#overviewAnnualFoot');
 if(!annual||!detail)return;
 if(!selectedMine){annual.hidden=false;detail.hidden=true; if(foot)foot.hidden=false; return;}
 annual.hidden=true;detail.hidden=false;if(foot)foot.hidden=true;
 $('#overviewMineName').textContent=selectedMine.name; $('#overviewMineState').textContent=selectedMine.state+' · Project-scope location';
 $('#overviewMinePriority').textContent=selectedMine.score>=80?'HIGH':'MEDIUM'; $('#overviewMinePriority').className='badge '+scoreClass(selectedMine.score);
 $('#overviewGrade').textContent=selectedMine.grade.toFixed(1)+'%'; $('#overviewDepth').textContent=fmt(selectedMine.depth)+' m'; $('#overviewMineAnnualValue').textContent=fmt(selectedMine.annual);
 makeOverviewMineAnnualChart();
}
function renderExploreContext(){
 const m=selectedMine||[...mines].sort((a,b)=>b.score-a.score)[0];
 if($('#zoneMine'))$('#zoneMine').textContent=selectedMine?m.name:'Select a mine';
 if($('#zoneState'))$('#zoneState').textContent=selectedMine?`${m.state} · Project-scope location`:'Click any mine marker or choose one above';
 if($('#zoneScore'))$('#zoneScore').textContent=selectedMine?m.score+'%':'—';
 const confidence=$('#zoneConfidence'); if(confidence) confidence.textContent=selectedMine?m.confidence+'%':'—';
 const track=$('.confidence-track i');if(track)track.style.width=selectedMine?m.confidence+'%':'0%';
 if($('#whyZone'))$('#whyZone').disabled=!selectedMine;
 if(selectedMine){
   const vals=[['PRIORITY ZONE',m.zone],['GEOLOGY SIGNAL','34%'],['SPECTRAL SIGNAL','27%'],['TERRAIN SIGNAL','19%']];
   $$('#zoneGridDynamic b').forEach(()=>{});
 }
}
function renderMineTable(){
 const body=$('#mineTable');if(!body)return;
 body.innerHTML=[...mines].sort((a,b)=>b.score-a.score).map((m,i)=>`<tr class="${selectedMine&&selectedMine.name===m.name?'selected-row':''}"><td class="table-rank">${String(i+1).padStart(2,'0')}</td><td><b>${esc(m.name)}</b></td><td>${esc(m.state)}</td><td class="prob">${m.score}%</td><td class="conf">${m.confidence}%</td><td><span class="badge ${scoreClass(m.score)}">${m.score>=80?'HIGH':'MEDIUM'}</span></td><td>${esc(m.signal)}</td></tr>`).join('');
 $$('#mineTable tr').forEach((tr,i)=>tr.addEventListener('click',()=>setSelectedMine([...mines].sort((a,b)=>b.score-a.score)[i].name)));
}
function renderExploreTable(){
 const body=$('#exploreTable');if(!body)return;
 body.innerHTML=[...mines].sort((a,b)=>b.score-a.score).map((m,i)=>`<tr class="${selectedMine&&selectedMine.name===m.name?'selected-row':''}"><td class="table-rank">${String(i+1).padStart(2,'0')}</td><td><b>${esc(m.name)}</b></td><td class="prob">${m.score}%</td><td>${m.confidence}%</td><td>Zone ${m.zone}</td><td>${esc(m.access)}</td><td>${m.score>=80?'Prioritize investigation':'Monitor / validate'}</td></tr>`).join('');
 $$('#exploreTable tr').forEach(tr=>tr.addEventListener('click',()=>setSelectedMine(tr.children[1].textContent)));
}
function mapBase(el){return L.map(el,{zoomControl:true,preferCanvas:true,scrollWheelZoom:true}).setView([22.0,79.6],7)}
function addBaseTile(map){return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map)}
function heatPoints(){
 const pts=[];const offsets=[[-.09,0,.48],[.06,.03,.62],[-.04,.07,.72],[.02,-.065,.82],[.075,-.05,.58],[-.075,.055,.66],[0,0,1]];
 mines.forEach(m=>offsets.forEach(([a,b,w])=>pts.push([m.lat+a,m.lon+b,Math.min(1,(m.score/100)*w)])));
 return pts.concat([[21.60,79.70,.68],[21.73,79.78,.73],[21.82,80.08,.71],[21.89,80.25,.76],[21.48,79.45,.64],[21.38,79.18,.59],[21.52,79.95,.66],[21.76,79.98,.70]]);
}
function addHeat(map){
 if(typeof L.heatLayer==='function')return L.heatLayer(heatPoints(),{radius:44,blur:30,maxZoom:12,max:1,gradient:{0.15:'#1f6178',0.35:'#257b7f',0.58:'#3a8a62',0.78:'#c28f24',1:'#d2672e'}}).addTo(map);
 const group=L.layerGroup(); heatPoints().forEach(([lat,lon,w])=>{L.circle([lat,lon],{radius:5200,stroke:false,fillColor:colorForScore(w*100),fillOpacity:.09+w*.20,interactive:false}).addTo(group);L.circle([lat,lon],{radius:2500,stroke:false,fillColor:colorForScore(w*100),fillOpacity:.06+w*.14,interactive:false}).addTo(group)});return group.addTo(map);
}
function addContours(map){
 const g=L.layerGroup();[...mines].filter(m=>m.score>=80).forEach(m=>[{r:15000,o:.04,c:COLORS.forest2},{r:10000,o:.06,c:COLORS.amber},{r:6500,o:.08,c:COLORS.orange}].forEach(b=>L.circle([m.lat,m.lon],{radius:b.r,fill:false,color:b.c,weight:1,dashArray:'5 7',opacity:.7,interactive:false}).addTo(g)));return g.addTo(map);
}
function addStateRegions(map){
 const g=L.layerGroup();
 // Deliberately soft regional focus overlays rather than claimed official boundaries.
 const maha=[[21.25,78.8],[21.25,79.85],[21.78,79.98],[22.0,79.35],[21.75,78.75]];
 const mp=[[21.55,79.55],[21.55,80.65],[22.20,80.65],[22.20,79.65],[21.95,79.35]];
 L.polygon(maha,{color:COLORS.teal,weight:1.3,fillColor:COLORS.teal,fillOpacity:.055,dashArray:'6 6',interactive:false}).bindTooltip('Maharashtra · MOIL mine region').addTo(g);
 L.polygon(mp,{color:COLORS.forest,weight:1.3,fillColor:COLORS.forest,fillOpacity:.05,dashArray:'6 6',interactive:false}).bindTooltip('Madhya Pradesh · MOIL mine region').addTo(g);
 return g.addTo(map);
}
function markerFor(map,m,group){
 const marker=L.circleMarker([m.lat,m.lon],{radius:selectedMine&&selectedMine.name===m.name?10:7,weight:selectedMine&&selectedMine.name===m.name?3:2,color:'#fffdf8',fillColor:colorForScore(m.score),fillOpacity:.97});
 marker.bindTooltip(m.name,{direction:'top',offset:[0,-7]}); marker.bindPopup(popup(m)); marker.on('click',()=>setSelectedMine(m.name)); marker.addTo(group); return marker;
}
function addMines(map){const g=L.layerGroup();mines.forEach(m=>markerFor(map,m,g));return g.addTo(map)}
function filterMineLayer(state){
 if(!layers.mines)return; layers.mines.clearLayers();mines.filter(m=>state==='All states'||m.state===state).forEach(m=>markerFor(maps.main,m,layers.mines));
}
function addOccurrences(map){const g=L.layerGroup();[[21.61,79.74],[21.79,80.12],[21.44,79.34],[21.90,80.30],[21.57,79.50]].forEach((p,i)=>L.circleMarker(p,{radius:3,weight:1,color:COLORS.blue,fillColor:COLORS.blue,fillOpacity:.8}).bindTooltip('Occurrence reference '+(i+1)).addTo(g));return g}
function drawMineFocus(map){if(map.__focus)map.removeLayer(map.__focus);if(selectedMine)map.__focus=L.circle([selectedMine.lat,selectedMine.lon],{radius:1800,color:COLORS.orange,weight:1.5,dashArray:'5 5',fillColor:COLORS.orange,fillOpacity:.08}).addTo(map)}
function fitAll(map){map.fitBounds(L.latLngBounds(mines.map(m=>[m.lat,m.lon])),{padding:[30,30]})}
function initMaps(){
 if(!window.L){toast('Map tools are unavailable.');return}
 maps.main=mapBase($('#mainMap')); maps.mini=mapBase($('#miniMap')); addBaseTile(maps.main);addBaseTile(maps.mini);
 layers.stateRegions=addStateRegions(maps.main); layers.heat=addHeat(maps.main); layers.miniHeat=addHeat(maps.mini); layers.contours=addContours(maps.main); layers.mines=addMines(maps.main); layers.occ=addOccurrences(maps.main);
 fitAll(maps.main);fitAll(maps.mini);
 maps.main.on('mousemove',e=>{const x=$('#mapCrosshair');if(x)x.textContent=`LAT ${e.latlng.lat.toFixed(4)} · LON ${e.latlng.lng.toFixed(4)}`});
 $('#fitMap')?.addEventListener('click',()=>fitAll(maps.main)); $('#locateMine')?.addEventListener('click',()=>selectedMine?maps.main.setView([selectedMine.lat,selectedMine.lon],11):fitAll(maps.main));
 [['prosLayer','heat'],['contourLayer','contours'],['mineLayer','mines'],['occLayer','occ']].forEach(([id,key])=>{$('#'+id)?.addEventListener('change',e=>{const layer=layers[key];if(!layer)return;e.target.checked?layer.addTo(maps.main):maps.main.removeLayer(layer)})});
 $('#stateFilter')?.addEventListener('change',e=>filterMineLayer(e.target.value));
}
function chartDefaults(){return {responsive:true,maintainAspectRatio:false,animation:{duration:720,easing:'easeOutQuart'},plugins:{legend:{labels:{color:COLORS.muted,font:{size:9},boxWidth:16,padding:12}},tooltip:{backgroundColor:'#1E2229',titleColor:'#F5F7FA',bodyColor:'#D9E0E7',borderColor:'#5A6673',borderWidth:1,padding:10}},scales:{x:{grid:{display:false},ticks:{color:COLORS.muted,font:{size:9}}},y:{grid:{color:'rgba(35,101,72,.08)'},ticks:{color:COLORS.muted,font:{size:9}}}}}}
function makeChart(id,type,data,options={}){const el=$('#'+id);if(!el||!window.Chart)return null;if(charts[id])charts[id].destroy();charts[id]=new Chart(el,{type,data,options:{...chartDefaults(),...options}});return charts[id]}
function initCharts(){
 if(!window.Chart)return;
 charts.overviewAnnualChart=makeChart('overviewAnnualChart','bar',{labels:[...mines].sort((a,b)=>b.annual-a.annual).map(m=>m.name),datasets:[{label:'Annual production',data:[...mines].sort((a,b)=>b.annual-a.annual).map(m=>m.annual),backgroundColor:'#3a8a62',borderRadius:7,maxBarThickness:28}]},{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{callback:v=>fmt(v)+' t'}}},onClick:(evt,els)=>{if(els.length){const ranked=[...mines].sort((a,b)=>b.annual-a.annual);setSelectedMine(ranked[els[0].index].name)}}});
 makeChart('weatherSpark','line',{labels:production.labels,datasets:[{data:production.rain,borderColor:COLORS.teal,backgroundColor:'rgba(37,123,127,.09)',fill:true,tension:.4,pointRadius:0}]},{plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}});
 makeChart('bandChart','doughnut',{labels:['High','Medium','Lower'],datasets:[{data:[5,3,2],backgroundColor:[COLORS.orange,COLORS.forest2,COLORS.blue],borderWidth:0}]},{cutout:'68%',plugins:{legend:{position:'bottom'}}});
 const ranked=[...mines].sort((a,b)=>b.score-a.score); makeChart('prospectivityRankChart','bar',{labels:ranked.map(m=>m.name),datasets:[{label:'Prospectivity',data:ranked.map(m=>m.score),backgroundColor:ranked.map(m=>colorForScore(m.score)),borderRadius:6}]},{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%'}}}});
 makeChart('productionChart','line',{labels:production.labels,datasets:[{label:'Target',data:production.target,borderColor:COLORS.blue,borderDash:[7,5],pointRadius:0},{label:'Actual',data:production.actual,borderColor:'#62aedd',backgroundColor:'rgba(105,180,229,.12)',fill:true,tension:.35,pointRadius:3},{label:'Forecast',data:production.forecast,borderColor:COLORS.orange,backgroundColor:'rgba(255,122,0,.10)',fill:true,tension:.35,pointRadius:3}]},{scales:{y:{ticks:{callback:v=>fmt(v)+' t'}}}});
 makeChart('driverChart','bar',{labels:['Downtime','Mining hours','Rainfall','Utilization'],datasets:[{label:'Contribution',data:[34,28,22,16],backgroundColor:[COLORS.red,COLORS.orange,COLORS.amber,COLORS.forest2],borderRadius:6}]},{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{max:40,ticks:{callback:v=>v+'%'}}}});
 makeChart('weatherChart','line',{labels:production.labels,datasets:[{label:'Rain probability',data:production.rain,borderColor:COLORS.teal,backgroundColor:'rgba(59,166,172,.12)',fill:true,tension:.35,pointRadius:2},{label:'Mining risk',data:[46,57,53,68,74,61],borderColor:COLORS.amber,tension:.35,pointRadius:2}]},{scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'}}}});
 makeChart('equipmentScatter','scatter',{datasets:[{label:'Equipment',data:assets.map(a=>({x:a.util,y:a.down})),backgroundColor:assets.map(a=>a.risk==='HIGH'?COLORS.red:a.risk==='MEDIUM'?COLORS.amber:COLORS.forest2),pointRadius:8}]},{scales:{x:{title:{display:true,text:'Utilization %',color:COLORS.muted,font:{size:9}},min:60,max:90},y:{title:{display:true,text:'Predicted downtime %',color:COLORS.muted,font:{size:9}},min:0,max:18}},plugins:{legend:{display:false}}});
 makeChart('equipmentChart','bar',{labels:assets.map(a=>a.name),datasets:[{label:'Downtime',data:assets.map(a=>a.down),backgroundColor:assets.map(a=>a.risk==='HIGH'?COLORS.red:a.risk==='MEDIUM'?COLORS.amber:COLORS.forest2),borderRadius:6}]},{plugins:{legend:{display:false}},scales:{y:{max:18,ticks:{callback:v=>v+'%'}}}});
 makeChart('historyProduction','line',{labels:history.map(x=>x[0]),datasets:[{label:'Production',data:history.map(x=>x[1]),borderColor:'#62aedd',backgroundColor:'rgba(105,180,229,.12)',fill:true,tension:.35},{label:'Target',data:production.target,borderColor:COLORS.blue,borderDash:[7,5],pointRadius:0}]},{scales:{y:{ticks:{callback:v=>fmt(v)+' t'}}}});
 makeChart('historyProspectivity','line',{labels:history.map(x=>x[0]),datasets:[{label:'Prospectivity',data:history.map(x=>x[5]),borderColor:COLORS.forest2,backgroundColor:'rgba(73,180,127,.10)',fill:true,tension:.35,pointRadius:3}]},{scales:{y:{min:60,max:100,ticks:{callback:v=>v+'%'}}},plugins:{legend:{display:false}}});
 makeChart('utilizationChart','line',{labels:history.map(x=>x[0]),datasets:[{label:'Utilization',data:history.map(x=>x[2]),borderColor:COLORS.amber,tension:.35,pointRadius:3},{label:'Downtime',data:history.map(x=>x[3]),borderColor:COLORS.red,tension:.35,pointRadius:3}]},{scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'}}}});
 makeChart('rainProductionChart','scatter',{datasets:[{label:'Period',data:history.map(x=>({x:x[4],y:x[1]})),backgroundColor:COLORS.orange,pointRadius:6}]},{scales:{x:{title:{display:true,text:'Rainfall / exposure %',color:COLORS.muted,font:{size:9}},min:30,max:90},y:{title:{display:true,text:'Production (t)',color:COLORS.muted,font:{size:9}},min:7000,max:9500}},plugins:{legend:{display:false}}});
 makeChart('modelFeatureChart','bar',{labels:['Geology','SWIR','Elevation','Spectral indices','Slope'],datasets:[{label:'Contribution',data:[34,27,19,12,8],backgroundColor:[COLORS.orange,COLORS.amber,COLORS.forest2,COLORS.teal,COLORS.blue],borderRadius:6}]},{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{max:40,ticks:{callback:v=>v+'%'}}}});
 makeChart('modelMetricChart','bar',{labels:['ROC-AUC','PR-AUC','Precision','Recall','F1'],datasets:[{label:'Evaluation',data:[.91,.86,.84,.82,.83],backgroundColor:COLORS.forest2,borderRadius:6}]},{plugins:{legend:{display:false}},scales:{y:{min:0,max:1,ticks:{callback:v=>Math.round(v*100)+'%'}}}});
 makeOverviewMineAnnualChart();
}
function makeOverviewMineAnnualChart(){
 if(!window.Chart||!selectedMine)return;
 const canvas=$('#overviewMineAnnualChart');if(!canvas)return;
 if(charts.overviewMineAnnualChart)charts.overviewMineAnnualChart.destroy();
 const rest=Math.max(totalAnnual-selectedMine.annual,selectedMine.annual*.15);
 charts.overviewMineAnnualChart=new Chart(canvas,{type:'doughnut',data:{labels:[selectedMine.name,'Other mine locations'],datasets:[{data:[selectedMine.annual,rest],backgroundColor:[COLORS.forest2,'#e8eee9'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'70%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${fmt(c.raw)} t`}}}}});
}
function renderProductionTable(){const b=$('#productionTable');if(!b)return;b.innerHTML=history.map((x,i)=>`<tr><td>${x[0]}</td><td>${fmt(10000)}</td><td>${fmt(x[1])}</td><td>${fmt(production.forecast[i])}</td><td>${x[2]}%</td><td>${x[3]}%</td><td>${x[4]}%</td><td><span class="badge ${x[6]>=15?'high':'medium'}">${x[6]>=15?'SHORTFALL':'WATCH'}</span></td></tr>`).join('')}
function renderHistoryTable(){const b=$('#historyTable');if(!b)return;b.innerHTML=history.map(x=>`<tr><td>${x[0]}</td><td>${fmt(x[1])} t</td><td>${x[2]}%</td><td>${x[3]}%</td><td>${x[4]}%</td><td>${x[5]}%</td><td>${x[6]}%</td><td><span class="badge ${x[6]>=15?'high':'medium'}">${x[6]>=15?'HIGH':'MODERATE'}</span></td></tr>`).join('')}
function renderEquipment(){const b=$('#equipmentTable');if(!b)return;b.innerHTML=assets.map(a=>`<tr><td><b>${a.name}</b></td><td>${a.type}</td><td>${a.util}%</td><td>${a.down}%</td><td>${a.breakdowns}</td><td><span class="badge ${a.risk==='HIGH'?'high':a.risk==='MEDIUM'?'medium':'low'}">${a.risk}</span></td><td>${a.maintenance}</td><td><button class="text-btn asset-open" data-asset="${a.name}">Inspect →</button></td></tr>`).join('');$$('.asset-open').forEach(bn=>bn.addEventListener('click',()=>showAsset(bn.dataset.asset)));showAsset('EX-04')}
function showAsset(name){const a=assets.find(x=>x.name===name);if(!a||!$('#assetDetail'))return;$('#assetDetail').innerHTML=`<div class="asset-detail-content"><div><span class="eyebrow">SELECTED ASSET</span><h3>${a.name} · ${a.type}</h3><p>Reliability context for the current production plan.</p></div><span class="badge ${a.risk==='HIGH'?'high':a.risk==='MEDIUM'?'medium':'low'}">${a.risk} RISK</span></div><div class="asset-detail-grid"><div class="asset-metric"><span>UTILIZATION</span><strong>${a.util}%</strong></div><div class="asset-metric"><span>DOWNTIME</span><strong>${a.down}%</strong></div><div class="asset-metric"><span>BREAKDOWNS</span><strong>${a.breakdowns}</strong></div><div class="asset-metric"><span>MAINTENANCE</span><strong>${a.maintenance}</strong></div></div>`}
const answers={
'Why is Zone A highly prospective?':'Zone A has the strongest current prospectivity signal in the selected context. The main contributing signals are geological formation, SWIR spectral features, elevation, spectral indices and slope. This is an exploration-priority result, not proof of an underground reserve.',
'What is causing the production shortfall?':'The current forecast is 8,200 t against a 10,000 t target, creating an 1,800 t gap. Equipment downtime, mining hours, rainfall and utilization variance are the leading operational signals.',
'Which equipment needs attention?':'EX-04 is the highest-risk asset, with 72% utilization, 14% predicted downtime and 3 breakdown events. The decision engine therefore prioritizes maintenance.',
'What should we do next?':'Protect productive hours around rainfall, prioritize EX-04 maintenance, review equipment allocation and investigate accessible high-prospectivity areas. The rule engine creates the action; the AI layer explains it.'};
function addMsg(text,type='ai'){const c=$('#chat');if(!c)return;const d=document.createElement('div');d.className='msg '+type;d.textContent=text;c.appendChild(d);c.scrollTop=c.scrollHeight}
function ask(q){addMsg(q,'user');setTimeout(()=>addMsg(answers[q]||'I can explain the current exploration, production, equipment and decision results. Connect the FastAPI /ai/explain service for live responses.'),180)}
function initCopilot(){addMsg('I can explain the current exploration, production, equipment and action results.');$$('.quick-prompts button').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.q)));$('#chatSend')?.addEventListener('click',()=>{const i=$('#chatInput'),q=i.value.trim();if(q){ask(q);i.value=''}});$('#chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('#chatSend').click()})}
function setupNav(){$$('.nav').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));$$('[data-page-link]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.pageLink)))}
function go(page){$$('.page').forEach(p=>p.classList.remove('active'));$('#page-'+page)?.classList.add('active');$$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>{if(page==='exploration'&&maps.main)maps.main.invalidateSize();if(page==='overview'&&maps.mini)maps.mini.invalidateSize();window.dispatchEvent(new Event('resize'))},100)}
function searchAll(q){q=q.toLowerCase().trim();if(!q)return;const m=mines.find(x=>x.name.toLowerCase().includes(q));if(m){setSelectedMine(m.name);go('exploration');toast(`Focused on ${m.name}`);return}const pages=[['production','production'],['equipment','equipment'],['decision','decisions'],['model','models'],['history','analytics'],['analytics','analytics'],['copilot','copilot'],['ai','copilot'],['exploration','exploration']];const match=pages.find(x=>q.includes(x[0]));if(match){go(match[1]);toast(`Opened ${match[1]}`)}}
function bindUtilityUI(){$('#globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')searchAll(e.target.value)});$('#mobileMenu')?.addEventListener('click',()=>document.body.classList.toggle('menu-open'));$('#whyZone')?.addEventListener('click',()=>{if(selectedMine)go('copilot');else toast('Select a mine first')});$$('.chart-tabs button').forEach(b=>b.addEventListener('click',()=>{const group=b.parentElement;group.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');toast(`${b.textContent} view selected`)}));}
function start(){initMineSelect();renderGlobalContext();renderOverviewContext();renderExploreContext();setupNav();bindUtilityUI();renderMineTable();renderExploreTable();renderProductionTable();renderHistoryTable();renderEquipment();initCopilot();initMaps();initCharts();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
