(function(){
const KoreanCalendar = globalThis.KoreanCalendar;
const STEMS='甲乙丙丁戊己庚辛壬癸';
const BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const READ='갑을병정무기경신임계자축인묘진사오미신유술해';
const reading=s=>[...s].map(c=>{let i=(STEMS+BRANCHES).indexOf(c);return i<0?c:READ[i];}).join('');
const ELEMENTS=['목','화','토','금','수'];
const element=c=>{let i=STEMS.indexOf(c);if(i>=0)return ELEMENTS[Math.floor(i/2)];return ['수','토','목','목','토','화','화','토','금','금','토','수'][BRANCHES.indexOf(c)];};
function tenGod(day,other){
 const d=STEMS.indexOf(day),o=STEMS.indexOf(other),diff=(Math.floor(o/2)-Math.floor(d/2)+5)%5,same=d%2===o%2;
 return [['비견','겁재'],['식신','상관'],['편재','정재'],['편관','정관'],['편인','정인']][diff][same?0:1];
}
const mod=(x,n)=>(x%n+n)%n;
const yearPillar=year=>STEMS[mod(year-4,10)]+BRANCHES[mod(year-4,12)];
function calculate(input,lib=globalThis){
 const {Solar,LunarUtil}=lib;
 const [y,m,d]=input.date.split('-').map(Number);
 if(!Number.isInteger(y)||y<1900||y>2050)throw Error('생년월일은 1900~2050년 범위에서 입력해 주세요.');
 const cal=new KoreanCalendar();
 const ok=input.calendar==='lunar'?cal.setLunarDate(y,m,d,!!input.leap):cal.setSolarDate(y,m,d);
 if(!ok)throw Error('유효하지 않은 날짜입니다. 음력의 윤달 여부도 확인해 주세요.');
 const sd=cal.getSolarCalendar(),ld=cal.getLunarCalendar();
 const [h,mi]=(input.time||'12:00').split(':').map(Number);
 if(!Number.isInteger(h)||h<0||h>23||!Number.isInteger(mi)||mi<0||mi>59)throw Error('출생 시간을 확인해 주세요.');
 // Calendar day/hour remain Korean civil time; astronomical boundaries use UTC+8.
 const solar=Solar.fromYmdHms(sd.year,sd.month,sd.day,input.unknown?12:h,input.unknown?0:mi,0);
 const local=solar.getLunar().getEightChar();local.setSect(Number(input.sect||2));
 const astro=solar.nextHour(-1).getLunar().getEightChar();
 const day=local.getDay(),hourIndex=Math.floor((h+1)/2)%12;
 const time=STEMS[(STEMS.indexOf(day[0])%5*2+hourIndex)%10]+BRANCHES[hourIndex];
 const pairs=[astro.getYear(),astro.getMonth(),day,input.unknown?null:time];
 const pillars=pairs.map((pair,i)=>{
  if(!pair)return {label:'시주',unknown:true};
  const hidden=LunarUtil.ZHI_HIDE_GAN[pair[1]];
  return {label:['년주','월주','일주','시주'][i],pair,stem:pair[0],branch:pair[1],god:i===2?'일원':tenGod(day[0],pair[0]),hidden:hidden.map(s=>({stem:s,god:tenGod(day[0],s)})),nayin:LunarUtil.NAYIN[pair],xun:LunarUtil.getXunKong(pair)};
 });
 const counts=Object.fromEntries(ELEMENTS.map(e=>[e,0]));
 pairs.filter(Boolean).join('').split('').forEach(c=>counts[element(c)]++);
 const yTarget=Number(input.targetYear||new Date().getFullYear());
 if(!Number.isInteger(yTarget)||yTarget<1900||yTarget>2100)throw Error('분석 연도는 1900~2100년으로 입력해 주세요.');
 let daeyun={cycles:[],forward:null,startNumber:null,currentIndex:-1},cycles=[];
 if(!input.unknown){
  if(!globalThis.MingliDaeyun)throw Error('대운 계산 파일 daeyun.js를 읽지 못했습니다.');
  const fmtDate=`${sd.year}-${String(sd.month).padStart(2,'0')}-${String(sd.day).padStart(2,'0')}`;
  daeyun=globalThis.MingliDaeyun.calculate({input,solarDate:fmtDate,pillars,targetYear:yTarget});
  cycles=daeyun.cycles;
 }
 const annual=Array.from({length:11},(_,i)=>{const year=yTarget-5+i,pair=yearPillar(year);return {year,pair,god:tenGod(day[0],pair[0])};});
 const months=Array.from({length:12},(_,i)=>{
  const gy=STEMS.indexOf(yearPillar(yTarget)[0]);
  const pair=STEMS[((gy%5)*2+2+i)%10]+BRANCHES[(2+i)%12];
  return {month:i+1,pair,god:tenGod(day[0],pair[0]),term:['입춘','경칩','청명','입하','망종','소서','입추','백로','한로','입동','대설','소한'][i]};
 });
 const fmt=a=>`${a.year}-${String(a.month).padStart(2,'0')}-${String(a.day).padStart(2,'0')}`;
 return {input:{...input},solarDate:fmt(sd),lunarDate:fmt(ld),leap:ld.intercalation,pillars,counts,dayStem:day[0],cycles,annual,months,targetYear:yTarget,forward:daeyun.forward,startDate:null,startAge:daeyun.startNumber===null?null:`${daeyun.startNumber}세`,daeyun};
}


globalThis.MingliEngine = {calculate, element, reading, ELEMENTS, tenGod, BRANCHES, STEMS, yearPillar};
})();
