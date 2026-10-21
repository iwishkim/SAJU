/* Original term tables and declarative conditions recovered by static analysis.
 * This code does not load/execute the original PE. It evaluates ordinary JS rules.
 */
(function(){
'use strict';
const {STEMS,BRANCHES}=globalThis.MingliEngine;
function nativeFields(chart,calendar=globalThis.GuikokCalendar,native=globalThis.GuikokNativeRules){
 if(!native?.tables||!calendar?.rows)throw Error('원본 귀곡 계산 자료가 없습니다. data 폴더를 함께 복사해 주세요.');
 const fields=Object.create(null),stems=chart.pillars.slice(0,3).map(p=>STEMS.indexOf(p.stem)+1),branches=chart.pillars.slice(0,3).map(p=>BRANCHES.indexOf(p.branch)+1);
 for(let i=0;i<4;i++){fields[i*4]=STEMS.indexOf(chart.pillars[i].stem)+1;fields[16+i*4]=BRANCHES.indexOf(chart.pillars[i].branch)+1;}
 fields[32]=chart.input.gender==='female'?0:1;
 const [year,month,day]=chart.solarDate.split('-').map(Number),ym=year*100+month;
 const byMonth=new Map();for(const row of calendar.rows)if(!byMonth.has(row.YEAR_MONTH))byMonth.set(row.YEAR_MONTH,row);
 const current=byMonth.get(ym);
 if(!current)throw Error('원본 귀곡 절입표는 1901~2050년을 지원합니다. 해당 범위의 생년월일을 입력해 주세요.');
 let termYear=year,termMonth=month,termDay=current['1ST_J_DAY'],elapsed;
 if(day>termDay)elapsed=day-termDay+1;
 else{
  termMonth--;if(termMonth===0){termYear--;termMonth=12;}
  const previous=byMonth.get(termYear*100+termMonth);
  if(!previous)throw Error('이 날짜 이전의 원본 절입 자료가 없습니다. 1901년 1월 7일 이후 날짜를 입력해 주세요.');
  termDay=previous['1ST_J_DAY'];elapsed=Math.round((Date.UTC(year,month-1,day)-Date.UTC(termYear,termMonth-1,termDay))/86400000)+1;
 }
 const tables=native.tables;
 const hidden=branches.map(branch=>{
  const threshold=tables.thresholds[branch],first=Number(threshold.slice(0,2)),second=Number(threshold.slice(2,4)||0);
  const phase=first>=elapsed?0:first+second>elapsed?1:2;
  return tables.hiddenRows[branch][phase];
 });
 fields[36]=hidden[1];fields[40]=hidden[0];fields[44]=hidden[2];
 const god=other=>tables.tenGodRows[stems[2]].indexOf(other);
 fields[48]=god(stems[1]);fields[52]=god(stems[0]);fields[56]=god(hidden[1]);fields[60]=god(hidden[0]);fields[64]=god(hidden[2]);
 const stage=branch=>tables.stageRows.findIndex((row,i)=>i>0&&row[stems[2]]===branch);
 for(let i=0;i<=12;i++)fields[80+i*4]=0;
 for(let i=0;i<3;i++){fields[68+i*4]=stage(branches[i]);fields[80+fields[68+i*4]*4]++;}
 for(let i=0;i<=10;i++)fields[132+i*4]=0;
 for(const offset of [48,52,56,60,64])fields[132+fields[offset]*4]++;
 return {fields,elapsed,termDate:`${termYear}-${String(termMonth).padStart(2,'0')}-${String(termDay).padStart(2,'0')}`,hidden:hidden.map(n=>STEMS[n-1])};
}
function selectNative(chart){
 const native=globalThis.GuikokNativeRules,state=nativeFields(chart);
 const numeric=x=>{
  if(typeof x==='number')return x;
  if(!Array.isArray(x))throw Error('귀곡 규칙 식이 유효하지 않습니다.');
  const [op,a,b]=x;
  if(op==='field'){if(!(a in state.fields))throw Error('귀곡 계산 항목이 없습니다: '+a);return state.fields[a];}
  if(op==='add')return numeric(a)+numeric(b);
  if(op==='andBits')return numeric(a)&numeric(b);
  if(op==='orBits')return numeric(a)|numeric(b);
  throw Error('지원되지 않는 귀곡 수식: '+op);
 };
 const truth=[];
 for(const [op,a,b]of native.nodes){
  let result;
  switch(op){
   case 'false':result=false;break;case 'true':result=true;break;
   case 'not':result=!truth[a];break;case 'and':result=truth[a]&&truth[b];break;case 'or':result=truth[a]||truth[b];break;
   case 'eq':result=numeric(a)===numeric(b);break;case 'ne':result=numeric(a)!==numeric(b);break;
   case 'lt':result=numeric(a)<numeric(b);break;case 'le':result=numeric(a)<=numeric(b);break;
   case 'gt':result=numeric(a)>numeric(b);break;case 'ge':result=numeric(a)>=numeric(b);break;
   default:throw Error('지원되지 않는 귀곡 조건: '+op);
  }
  truth.push(!!result);
 }
 return {...state,selected:native.rules.filter(rule=>truth[rule.condition]),version:native.version};
}
globalThis.MingliGuikokNative={nativeFields,selectNative};
})();
