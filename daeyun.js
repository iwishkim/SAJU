/* Static reconstruction of original Get_daeun (0x42cd58),
 * Get_daeunstring (0x42d3cc), current-cycle calculation (0x42d354).
 */
(function(){
'use strict';
const {STEMS,BRANCHES}=globalThis.MingliEngine;
const dateString=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
function calculate(chart,calendar=globalThis.GuikokCalendar){
 if(chart.input.unknown)return {cycles:[],forward:null,startNumber:null,currentIndex:-1};
 if(!calendar?.rows)throw Error('원본 대운 절입표가 없습니다. data 폴더를 확인해 주세요.');
 const [year,month,day]=chart.solarDate.split('-').map(Number),birthDay=Date.UTC(year,month-1,day);
 const stem=STEMS.indexOf(chart.pillars[0].stem),male=chart.input.gender!=='female';
 const forward=(stem%2===0)===male;
 const terms=new Map();for(const row of calendar.rows)if(!terms.has(row.YEAR_MONTH))terms.set(row.YEAR_MONTH,row);
 const current=terms.get(year*100+month);
 if(!current)throw Error('원본 대운 절입표는 1901~2050년을 지원합니다.');
 let termYear=year,termMonth=month,row=current;
 const sameDay=day===current['1ST_J_DAY'];
 if(!sameDay&&((forward&&day>current['1ST_J_DAY'])||(!forward&&day<current['1ST_J_DAY']))){
  termMonth+=forward?1:-1;if(termMonth===13){termYear++;termMonth=1;}if(termMonth===0){termYear--;termMonth=12;}
  row=terms.get(termYear*100+termMonth);
  if(!row)throw Error('대운 계산에 필요한 인접 연월의 원본 절입 자료가 없습니다.');
 }
 const termDay=Date.UTC(termYear,termMonth-1,row['1ST_J_DAY']);
 const distanceDays=Math.abs(Math.round((termDay-birthDay)/86400000));
 // Original default: on the exact term calendar date, return 10 regardless of time.
 // Optional global flag in the old program is not assumed to have been enabled.
 const startNumber=sameDay?10:distanceDays<3?1:Math.floor(distanceDays/3)+(distanceDays%3===2?1:0);
 const targetYear=chart.targetYear,ageAtTarget=targetYear-year+1;
 const currentIndex=ageAtTarget<startNumber?-1:Math.floor((ageAtTarget-startNumber)/10);
 const monthStem=STEMS.indexOf(chart.pillars[1].stem),monthBranch=BRANCHES.indexOf(chart.pillars[1].branch);
 const mod=(x,n)=>(x%n+n)%n;
 const cycles=Array.from({length:9},(_,i)=>{
  const age=startNumber+i*10,start=year+age-1;
  const pair=STEMS[mod(monthStem+(forward?1:-1)*(i+1),10)]+BRANCHES[mod(monthBranch+(forward?1:-1)*(i+1),12)];
  return {pair,age,start,end:start+9,active:i===currentIndex};
 });
 return {cycles,forward,startNumber,currentIndex,ageAtTarget,startYear:cycles[0].start,
  distanceDays,termDate:dateString(termYear,termMonth,row['1ST_J_DAY']),sameDay,
  ageBasis:'세는나이 = 분석 연도 − 출생 연도 + 1',
  note:sameDay?'절입일 당일은 원본 기본 분기의 대운수 10을 사용했습니다. 원본의 별도 절입일 옵션을 켠 경우와는 다를 수 있습니다.':null};
}
globalThis.MingliDaeyun={calculate};
})();
