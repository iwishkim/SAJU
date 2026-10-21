(function(){
'use strict';
const functions={character:'0x43a6e4',parents:'0x43b2e8',siblings:'0x43c428',spouse:'0x43d21c',children:'0x43e378',early:'0x43f41c',middle:'0x43f750',late:'0x43f8c0',business:'0x43faf8'};
function makeReport(chart,data=globalThis.GuikokData){
 if(!data?.rows?.length)throw Error('귀곡 해설 자료를 읽지 못했습니다. data 폴더를 함께 복사해 주세요.');
 const native=globalThis.MingliGuikokNative.selectNative(chart),index=new Map(data.rows.map(row=>[row.key,row])),missing=[];
 function entries(category,subtitle){
  const selected=native.selected.filter(r=>r.function===functions[category]);
  const out=selected.map((r,i)=>{
   const row=index.get(r.key);
   if(!row){missing.push(r.key);return null;}
   return {key:r.key,text:row.text.replace(/\0/g,'').trim(),basis:`원본 조건 분기 ${r.address} · 절입 경과 ${native.elapsed}일`,subtitle:i===0?subtitle:undefined};
  }).filter(Boolean);
  if(!out.length)out.push({text:'이 조건에 해당하는 해설 문장이 원본 자료에 없습니다.',subtitle,missing:true});
  return out;
 }
 const sections=[
  {id:'character',title:'근본성격',entries:entries('character')},
  {id:'family',title:'부모형제운',entries:[...entries('parents','부모운'),...entries('siblings','형제운')]},
  {id:'spouse',title:'배우자운',entries:entries('spouse')},
  {id:'children',title:'자녀운',entries:entries('children')},
  {id:'business',title:'사업운',entries:entries('business')},
  {id:'early',title:'초년운',entries:entries('early')},
  {id:'middle',title:'중년운',entries:entries('middle')},
  {id:'late',title:'말년운',entries:entries('late')}
 ];
 const firstSentence=text=>text.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0].trim()||text;
 sections.push({id:'overall',title:'종합해설',generated:true,entries:sections.map(s=>({subtitle:s.title,text:s.entries.filter(e=>!e.missing).map(e=>firstSentence(e.text)).join(' ')||'원본 해설 자료 없음'}))});
 return {sections,rulesVersion:native.version,source:data.table,records:data.records,
  explanation:'원본 실행 파일의 해설 선택 함수 9개를 정적으로 분석하여 634개 문장 선택 분기를 옮겼습니다. 원본 절입표와 경과일별 지장간 선택, 십신·십이운성 대응표 및 성별·구성별 보충문장 조건을 사용합니다. 기존 프로그램은 실행하지 않았으며, 제공된 비교 화면으로 근본성격의 첫 문장 일치를 확인했습니다. 전체 사주의 실화면 대조는 아직 수행하지 않았습니다.',
  native,missingKeys:missing,
  selectedKeys:sections.filter(s=>!s.generated).flatMap(s=>s.entries.filter(e=>e.key).map(e=>e.key)),
  timingNote:chart.input.unknown?'출생 시각 미상: 정오 기준으로 년·월·일주를 계산했습니다. 절입일·일주 경계에서는 실제 시각에 따라 해설이 달라질 수 있습니다.':null};
}
function plainText(chart,report){
 const meta=[`${chart.input.name||'나의 명식'} · 귀곡산명술 해설`,`양력 ${chart.solarDate} / 음력 ${chart.lunarDate}${chart.leap?' (윤달)':''}`,`사주: ${chart.pillars.map(p=>p.pair||'생시 미상').join(' ')}`,'선택 기준: 원본 정적 분석에서 복원한 조건',report.explanation,`절입 기준일 ${report.native.termDate} · 경과 ${report.native.elapsed}일`,report.timingNote||''];
 return [...meta,...report.sections.flatMap(s=>['',`[${s.title}]`,...(s.generated?['※ 선택된 해설의 첫 문장을 모은 웹앱 요약입니다.']:[]),...s.entries.map(e=>`${e.subtitle?e.subtitle+'\n':''}${e.text}${e.key?'\n출처: '+report.source+' / '+e.key+' · '+e.basis:''}`)]),...(report.missingKeys.length?['원본에 없는 문장 번호: '+report.missingKeys.join(', ')]:[]),'','전통 운세 원문으로, 실제 가족관계·건강·수명·사업 성과를 확정하는 진단은 아닙니다.'].join('\n\n');
}
globalThis.MingliGuikok={makeReport,plainText};
})();
