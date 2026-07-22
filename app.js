/* ============================================================================
   JLS 통합 관리 시스템 — app.js (v1)
   · 데이터 레이어/인원계산은 기존 학사관리(app.js)에서 그대로 포팅 → 숫자 동일
   · 안전을 위해 v1은 "읽기 전용" (saveDB 없음 — 원본 데이터 절대 안 건드림)
   ============================================================================ */
const SUPABASE_URL = 'https://hplndiuoohantbalixwu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xO8KB46SzMx8KeuEE-OVSw_su22mv9X';
let sb = null;
const $ = (id)=>document.getElementById(id);
const esc = (s)=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n)=> (n==null?'·':n.toLocaleString());

/* ---------- 학기 계산 (기존 포팅) ---------- */
const SEASONS = [
  { key:'winter', label:'겨울', months:[12,1,2] },
  { key:'spring', label:'봄',   months:[3,4,5] },
  { key:'summer', label:'여름', months:[6,7,8] },
  { key:'fall',   label:'가을', months:[9,10,11] },
];
function seasonOfMonth(m){ return SEASONS.find(s=> s.months.includes(m)); }
function winterAwareName(year, season){
  if(season.key==='winter'){ const yy=String(year).slice(2), ny=String(year+1).slice(2); return `${yy}-${ny} ${season.label}학기`; }
  return `${year}년 ${season.label}학기`;
}
function semesterOfDate(d){
  let year=d.getFullYear(); const month=d.getMonth()+1; const season=seasonOfMonth(month);
  if(season.key==='winter' && (month===1||month===2)) year-=1;
  return { id:`sem_${year}_${season.key}`, name:winterAwareName(year,season), year, key:season.key };
}
function currentSemester(){ return semesterOfDate(new Date()); }
function semRank(id){ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return 0; const o={spring:0,summer:1,fall:2,winter:3}; return parseInt(m[1],10)*10+(o[m[2]]||0); }
function semNameFromId(id){ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return id; const year=+m[1]; const season=SEASONS.find(s=>s.key===m[2]); if(!season) return id; return winterAwareName(year,season); }
/* 드롭다운용 학기 목록 — 학기테이블 + 데이터(레코드)에 등장한 학기 + 현재학기 전부 합침 */
function allSemesters(){
  const map=new Map();
  (db.semesters||[]).forEach(s=>map.set(s.id, s.name));
  (db.semesterRecords||[]).forEach(r=>{ if(r.semesterId && !map.has(r.semesterId)) map.set(r.semesterId, semNameFromId(r.semesterId)); });
  const cur=currentSemester(); if(!map.has(cur.id)) map.set(cur.id, cur.name);
  return [...map.entries()].map(([id,name])=>({id,name})).sort((a,b)=>semRank(b.id)-semRank(a.id));
}
function semName(id){ const s=(db.semesters||[]).find(x=>x.id===id); return s?s.name:semNameFromId(id); }

/* ---------- 데이터 레이어 (기존 포팅, 읽기 전용) ---------- */
const TABLES = [
  { key:'branches', table:'branches', fromRow:r=>({id:r.id,name:r.name}) },
  { key:'users', table:'users', fromRow:r=>({id:r.id,username:r.username,password:r.password,role:r.role,branchId:r.branch_id,teacherName:r.teacher_name}) },
  { key:'semesters', table:'semesters', fromRow:r=>({id:r.id,name:r.name}) },
  { key:'students', table:'students', fromRow:r=>({id:r.id,code:r.code,name:r.name,school:r.school,grade:r.grade}) },
  { key:'semesterRecords', table:'semester_records', fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,className:r.class_name,classLabel:r.class_label,teacher:r.teacher,status:r.status,origin:r.origin,enrollDate:r.enroll_date,withdrawDate:r.withdraw_date,transfer:!!r.transfer,transferIn:!!r.transfer_in,transferTo:r.transfer_to,kind:r.kind||'regular'}) },
  { key:'studentMovements', table:'student_movements', fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,type:r.type,date:r.date,memo:r.memo}) },
];
let db = null;
function initSupabase(){ if(sb) return sb; sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); return sb; }
async function loadDB(){
  initSupabase(); db = { branches:[],users:[],semesters:[],students:[],semesterRecords:[],studentMovements:[] };
  const PAGE=1000;
  for(const t of TABLES){
    let all=[], from=0;
    while(true){
      const { data, error } = await sb.from(t.table).select('*').range(from, from+PAGE-1);
      if(error){ console.error('load fail', t.table, error); throw error; }
      const chunk=data||[]; all=all.concat(chunk);
      if(chunk.length<PAGE) break; from+=PAGE;
    }
    db[t.key]=all.map(t.fromRow);
  }
}

/* ---------- 인원 계산 (기존 monthlyClosing 포팅) ---------- */
const monthOfDate=(s)=>{const m=String(s||'').match(/\d{4}-(\d{1,2})-\d{1,2}/)||String(s||'').match(/\d{4}\.(\d{1,2})/);return m?parseInt(m[1],10):null;};
const dayOfDate=(s)=>{const m=String(s||'').match(/\d{4}-\d{1,2}-(\d{1,2})/);return m?parseInt(m[1],10):null;};
function enrollMonth(rec){ if(!rec.enrollDate) return null; return monthOfDate(rec.enrollDate); }
function withdrawMonth(rec){
  let d=rec.withdrawDate;
  if(!d){ const mv=db.studentMovements.find(m=>m.studentId===rec.studentId&&m.branchId===rec.branchId&&m.semesterId===rec.semesterId&&m.type==='withdraw'); d=mv&&mv.date; }
  return d?monthOfDate(d):null;
}
function semesterMonths(semId){
  const name=semName(semId)||'';
  if(name.includes('겨울')) return [12,1,2];
  if(name.includes('봄')) return [3,4,5];
  if(name.includes('여름')) return [6,7,8];
  if(name.includes('가을')) return [9,10,11];
  return [1,2,3];
}
function recordsOf(branchId, semId){ return db.semesterRecords.filter(r=>r.branchId===branchId&&r.semesterId===semId&&(r.kind||'regular')!=='exam'); }
function activeRecordsOf(branchId, semId){ return recordsOf(branchId,semId).filter(r=>r.status==='active'); }
/* 월별 마감 계산 — 신입/전입/퇴원/전출/월말/퇴원율 (분원 단위) */
function monthlyClosing(recs, months){
  const startOfSem = recs.filter(r=> enrollMonth(r)==null).length;
  let carry=0; const cells=[]; const rates=[];
  months.forEach((m, idx)=>{
    let monthStart = idx===0 ? startOfSem : carry;
    const newThis = recs.filter(r=> enrollMonth(r)===m && !r.transferIn).length;
    const tiThis  = recs.filter(r=> enrollMonth(r)===m && r.transferIn).length;
    const wdThis  = recs.filter(r=> withdrawMonth(r)===m && !r.transfer).length;
    const trThis  = recs.filter(r=> withdrawMonth(r)===m && r.transfer).length;
    const baseNew = monthStart + newThis + tiThis;
    const rate = baseNew>0 ? (wdThis/baseNew*100) : 0;
    const monthEnd = baseNew - wdThis - trThis;
    cells.push({ month:m, monthStart, newThis, transferIn:tiThis, withdraw:wdThis, transfer:trThis, monthEnd, rate });
    if(baseNew>0) rates.push(rate);
    carry = monthEnd;
  });
  const sum=(k)=>cells.reduce((a,c)=>a+c[k],0);
  const avgRate = rates.length ? rates.reduce((a,c)=>a+c,0)/rates.length : 0;
  return { cells, totNew:sum('newThis'), totTransferIn:sum('transferIn'), totWithdraw:sum('withdraw'), totTransfer:sum('transfer'), avgRate };
}

/* ---------- 세션 ---------- */
const SKEY='jls_int_session';
let session=null;
function loadSession(){ try{session=JSON.parse(sessionStorage.getItem(SKEY));}catch(e){session=null;} }
function setSession(s){ session=s; sessionStorage.setItem(SKEY,JSON.stringify(s)); }
function clearSession(){ session=null; sessionStorage.removeItem(SKEY); }

/* ---------- 권한 모델 ---------- */
const MODULES=[
  {key:'dashboard', ic:'📊', name:'대시보드', sub:'인원현황·마감', items:[['인원 마감',''],['분원 현황','']]},
  {key:'wonmu', ic:'🎓', name:'원무', sub:'원생·상담·레벨테스트', items:[['신규예약',''],['레벨테스트',''],['상담관리',''],['원생현황',''],['등록/퇴원율',''],['대시보드','']]},
  {key:'chongmu', ic:'📦', name:'총무', sub:'교재·청소·소모품·A/S', items:[['교재재고',''],['청소업체',''],['소모품',''],['A/S 관리','']]},
  {key:'insa', ic:'🗂️', name:'인사·서류', sub:'입퇴사·교육청·서류', items:[['입·퇴사',''],['교육청 신고',''],['서류보관',''],['자격/안전교육','']]},
  {key:'unyoung', ic:'💰', name:'운영비', sub:'수입·지출·예산·결산', items:[['수입/지출',''],['예산관리',''],['결산',''],['정산','']]},
];
// 역할별 기본 프리셋 (모듈 단위 레벨 0안보임/1보기/2수정/3삭제)
const ROLE_PRESET={
  admin:   {dashboard:3,wonmu:3,chongmu:3,insa:3,unyoung:3,perm:3},
  branch:  {dashboard:3,wonmu:3,chongmu:3,insa:3,unyoung:2,perm:0},
  teacher: {dashboard:1,wonmu:3,chongmu:0,insa:0,unyoung:0,perm:0},
  assistant:{dashboard:1,wonmu:2,chongmu:0,insa:0,unyoung:0,perm:0},
};
const PKEY='jls_int_perms';
function loadPerms(){ try{return JSON.parse(localStorage.getItem(PKEY))||{};}catch(e){return {};} }
function savePerms(p){ localStorage.setItem(PKEY,JSON.stringify(p)); }
// 특정 역할의 모듈 레벨 (개별 저장 없으면 프리셋)
function permOf(role){ const saved=loadPerms(); return saved[role] || ROLE_PRESET[role] || ROLE_PRESET.teacher; }
function canModule(moduleKey){ const p=permOf(session.role); const lv=(moduleKey==='perm')?(p.perm||0):(p[moduleKey]||0); return lv>0; }

/* ---------- UI: 로그인 ---------- */
function showLogin(){ $('appView').classList.add('hide'); $('loginView').classList.remove('hide'); }
function doLogin(){
  const u=$('loginId').value.trim(), p=$('loginPw').value;
  const user=db.users.find(x=>x.username===u&&x.password===p);
  if(!user){ $('loginErr').textContent='아이디 또는 비밀번호가 올바르지 않습니다.'; return; }
  setSession({userId:user.id,username:user.username,role:user.role,branchId:user.branchId,teacherName:user.teacherName||null});
  $('loginErr').textContent=''; $('loginPw').value='';
  enterApp();
}
function logout(){ clearSession(); location.hash=''; showLogin(); }

/* ---------- UI: 앱 진입 ---------- */
let state={ semId:null, view:'dashboard', dashMonthIdx:null };
function enterApp(){
  $('loginView').classList.add('hide'); $('appView').classList.remove('hide');
  // 학기 셀렉트
  const cur=currentSemester();
  const sems=allSemesters();
  state.semId = sems.some(s=>s.id===cur.id)?cur.id:(sems[0]?sems[0].id:null);
  $('semSelect').innerHTML=sems.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  $('semSelect').value=state.semId;
  $('semSelect').onchange=()=>{ state.semId=$('semSelect').value; state.dashMonthIdx=null; render(); };
  // 유저 표시
  const roleLabel={admin:'본사 · 관리자',branch:'분원 · 관리자',teacher:'선생님',assistant:'보조'}[session.role]||session.role;
  $('sbAvatar').textContent=(session.teacherName||session.username||'U').slice(0,1);
  $('sbUserName').textContent=session.teacherName||session.username;
  $('sbUserRole').textContent=roleLabel;
  const br=db.branches.find(b=>b.id===session.branchId);
  $('sbScope').textContent = session.role==='admin' ? '통합관리 · 전체' : ('통합관리 · '+(br?br.name:'분원'));
  buildSidebar();
  state.view = canModule('dashboard') ? 'dashboard' : 'wonmu';
  render();
}
function buildSidebar(){
  let h='<div class="sb-sect">메뉴</div>';
  MODULES.forEach(m=>{
    if(!canModule(m.key)) return;
    h+=`<div class="sb-item ${state.view===m.key?'active':''}" onclick="nav('${m.key}')"><span class="ic">${m.ic}</span>${m.name}</div>`;
  });
  if(canModule('perm')){
    h+='<div class="sb-sect">설정</div>';
    h+=`<div class="sb-item ${state.view==='perm'?'active':''}" onclick="nav('perm')"><span class="ic">🔐</span>권한 설정<span class="me">나만</span></div>`;
  }
  $('sbNav').innerHTML=h;
}
function nav(v){ state.view=v; buildSidebar(); render(); window.scrollTo(0,0); }

/* ---------- 렌더 라우터 ---------- */
function render(){
  const c=$('content'); const v=state.view;
  $('semPick').style.display = (v==='dashboard'||v==='wonmu')?'flex':'none';
  if(v==='dashboard'){ $('crumbs').innerHTML='<b>대시보드</b>'; renderDashboard(c); }
  else if(v==='perm'){ $('crumbs').innerHTML='<span class="mut">설정 › </span><b>권한 설정</b>'; renderPerm(c); }
  else { const m=MODULES.find(x=>x.key===v); $('crumbs').innerHTML=`<b>${m.name}</b>`; renderStub(c,m); }
}

/* ---------- 대시보드: 인원 현황 (진짜 데이터 + CHESS/ACE) ---------- */
function branchList(){ return session.role==='admin' ? db.branches : db.branches.filter(b=>b.id===session.branchId); }
function rateCls(r){ return r<3?'lo':r<5?'mid':'hi'; }
/* CHESS/ACE 분류 (기존 로직 포팅) — 반이름 앞 레벨코드로 판정 */
const CHESS_LEVELS=['IS','DSA','DSB','DSC','DSD','LSA','LSB','LSC','LSD','MSA','MSB'];
function levelAlphaOf(cn){ const m=String(cn||'').match(/^\s*\[([A-Za-z]+)/); return m?m[1].toUpperCase():''; }
function isChess(cn){ const a=levelAlphaOf(cn); return a?CHESS_LEVELS.includes(a):false; }
function countCA(recs){ let c=0,a=0; recs.forEach(r=>{ isChess(r.className)?c++:a++; }); return {chess:c,ace:a,total:c+a}; }
function getStudent(id){ return (db.students||[]).find(s=>s.id===id); }
function bName(x){ const b=(db.branches||[]).find(v=>v.id===x||v.name===x); return b?b.name:(x||''); }
function sName(r){ const s=getStudent(r.studentId); return s?s.name:'?'; }

function renderDashboard(c){
  const semNm=semName(state.semId);
  const months=semesterMonths(state.semId);
  const brs=branchList();
  if(state.dashMonthIdx==null) state.dashMonthIdx=-1;
  const mi=state.dashMonthIdx, whole=mi<0;
  const scope = whole ? (m=>months.includes(m)) : (m=>m===months[mi]);
  const data=brs.map(b=>{
    const recs=recordsOf(b.id,state.semId);
    const mc=monthlyClosing(recs,months);
    const startRecs = whole ? recs.filter(r=>enrollMonth(r)==null) : [];
    const nwRecs = recs.filter(r=>scope(enrollMonth(r))&&!r.transferIn);
    const tiRecs = recs.filter(r=>scope(enrollMonth(r))&&r.transferIn);
    const wdRecs = recs.filter(r=>scope(withdrawMonth(r))&&!r.transfer);
    const trRecs = recs.filter(r=>scope(withdrawMonth(r))&&r.transfer);
    const actRecs = recs.filter(r=>r.status==='active');
    const baseNum = whole ? startRecs.length : (mc.cells[mi]?mc.cells[mi].monthStart:0);
    return {b, mc, startRecs, nwRecs, tiRecs, wdRecs, trRecs, actRecs, baseNum};
  });
  const flat=(g)=>{ const a=[]; data.forEach(d=>a.push(...g(d))); return a; };
  const caStart = whole ? countCA(flat(d=>d.startRecs)) : {total:data.reduce((a,d)=>a+d.baseNum,0),chess:null,ace:null};
  const caNew=countCA(flat(d=>d.nwRecs)), caTi=countCA(flat(d=>d.tiRecs)), caWd=countCA(flat(d=>d.wdRecs)), caTr=countCA(flat(d=>d.trRecs)), caAct=countCA(flat(d=>d.actRecs));
  const baseTot=caStart.total;
  const sumRate=(baseTot+caNew.total+caTi.total)>0 ? caWd.total/(baseTot+caNew.total+caTi.total)*100 : 0;
  const net=caNew.total+caTi.total-caWd.total-caTr.total;
  const best = data.length? Math.min(...data.map(d=>{ const b2=d.baseNum, nw=d.nwRecs.length, ti=d.tiRecs.length, wd=d.wdRecs.length; return (b2+nw+ti)>0?wd/(b2+nw+ti)*100:0; })) : 0;
  const baseLabel = whole ? '학기초' : '전월마감';

  const title = session.role==='admin' ? '전 분원 인원 현황' : `${(db.branches.find(b=>b.id===session.branchId)||{}).name||'분원'} 인원 현황`;
  const periodTxt = whole ? '학기 전체' : `${months[mi]}월`;
  let h=`<div class="page-h"><div><h2>📋 <span class="em">${title}</span></h2><p>${esc(semNm)} · ${periodTxt} 기준</p></div>
    <div class="pick"><span>📅 기간</span><select onchange="state.dashMonthIdx=+this.value;render()">
      <option value="-1" ${whole?'selected':''}>학기 전체</option>
      ${months.map((m,i)=>`<option value="${i}" ${i===mi?'selected':''}>${m}월</option>`).join('')}
    </select></div></div>`;

  // KPI 카드 (CHESS/ACE 포함)
  const caCard=(label,dot,ca)=>`<div class="kpi"><div class="l"><span class="kdot" style="background:${dot}"></span>${label}</div>
    <div class="v num">${fmt(ca.total)}<span class="unit">명</span></div>
    ${ca.chess!=null?`<div class="ca"><span class="ca-chess">CHESS ${ca.chess}</span><span class="ca-ace">ACE ${ca.ace}</span></div>`:'<div class="ca"></div>'}</div>`;
  h+=`<div class="kpis">
    ${caCard(whole?'전체 학기초':'전월마감','var(--brand)',caStart)}
    ${caCard('전체 신규','var(--pos)',caNew)}
    ${caCard('전체 전입','var(--blue)',caTi)}
    ${caCard('전체 퇴원','var(--neg)',caWd)}
    ${caCard('전체 전출','var(--peach)',caTr)}
    <div class="kpi"><div class="l"><span class="kdot" style="background:var(--warn)"></span>전체 퇴원율</div><div class="v num ${sumRate<3?'pos':sumRate<5?'wn':'neg'}">${sumRate.toFixed(1)}<span class="unit">%</span></div><div class="d mut">순증감 ${net>=0?'+':''}${net}</div></div>
    ${caCard('현 재원생','var(--brand)',caAct)}
  </div>`;

  // 표
  h+=`<div class="twrap"><div class="tw-h"><div class="t">🏫 분원별 인원 현황 (${periodTxt})</div>
    <div class="leg"><span><span class="dot" style="background:var(--pos)"></span>신입·전입</span><span><span class="dot" style="background:var(--neg)"></span>퇴원·전출</span><span><span class="dot" style="background:#0c447c"></span>CHESS</span><span><span class="dot" style="background:#085041"></span>ACE</span></div></div>
    <div class="scroll"><table class="grid"><thead>
    <tr class="sub"><th class="col-b">분원</th><th>${baseLabel}</th><th class="sep-l">신입</th><th>전입</th><th>퇴원</th><th>전출</th><th>현재 재원</th><th class="col-rate">퇴원율</th><th class="col-note">비고</th></tr>
    </thead><tbody>`;
  data.forEach(d=>{
    const b2=d.baseNum, nw=d.nwRecs.length, ti=d.tiRecs.length, wd=d.wdRecs.length, tr=d.trRecs.length;
    const rate=(b2+nw+ti)>0?wd/(b2+nw+ti)*100:0; const isBest=rate===best&&data.length>1;
    const ca=countCA(d.actRecs);
    const notes=[];
    d.tiRecs.forEach(r=>notes.push(`<span class="n-in">↘ 전입 ${esc(sName(r))}</span>`));
    d.trRecs.forEach(r=>notes.push(`<span class="n-out">↗ 전출 ${esc(sName(r))}${r.transferTo?'→'+esc(bName(r.transferTo)):''}</span>`));
    h+=`<tr><td class="col-b">${esc(d.b.name)}</td><td class="num">${b2}</td>
      <td class="num in sep-l">${nw?'+'+nw:'·'}</td><td class="num jin">${ti?'+'+ti:'·'}</td>
      <td class="num out">${wd?'-'+wd:'·'}</td><td class="num out">${tr?'-'+tr:'·'}</td>
      <td class="num end">${ca.total}<div class="ca-cell"><span class="ca-chess">CHESS ${ca.chess}</span><span class="ca-ace">ACE ${ca.ace}</span></div></td>
      <td class="col-rate"><span class="rate ${rateCls(rate)} ${isBest?'best':''}">${rate.toFixed(1)}%</span></td>
      <td class="col-note">${notes.length?notes.join(''):'<span class="mut">·</span>'}</td></tr>`;
  });
  h+=`<tr class="sum"><td class="col-b">합계</td><td class="num">${fmt(baseTot)}</td>
    <td class="num sep-l">+${caNew.total}</td><td class="num">${caTi.total?'+'+caTi.total:'·'}</td><td class="num">-${caWd.total}</td><td class="num">${caTr.total?'-'+caTr.total:'·'}</td>
    <td class="num">${fmt(caAct.total)}<div class="ca-cell"><span class="ca-chess">CHESS ${caAct.chess}</span><span class="ca-ace">ACE ${caAct.ace}</span></div></td>
    <td class="col-rate"><span class="rate ${rateCls(sumRate)}">${sumRate.toFixed(1)}%</span></td><td class="col-note"></td></tr>`;
  h+='</tbody></table></div></div>';

  // 월별 추이 차트 (선택 분원 or 전체 합)
  const trend=months.map((m,i)=>{ let ins=0,outs=0; data.forEach(d=>{const cc=d.mc.cells[i];ins+=cc.newThis+cc.transferIn;outs+=cc.withdraw+cc.transfer;}); return {m,ins,outs}; });
  const mx=Math.max(1,...trend.map(t=>Math.max(t.ins,t.outs)));
  h+=`<div class="grid2"><div class="panel"><div class="panel-h"><div class="t">📈 학기 월별 추이</div><div class="leg"><span><span class="kdot" style="background:var(--pos)"></span>유입</span> <span><span class="kdot" style="background:var(--neg)"></span>유출</span></div></div><div class="chart">`;
  trend.forEach(t=>{ h+=`<div class="mbar"><div class="bars"><div class="bar bin" style="height:${t.ins/mx*100}%"></div><div class="bar bout" style="height:${t.outs/mx*100}%"></div></div><div class="mlab">${t.m}월</div></div>`; });
  h+=`</div></div><div class="panel"><div class="panel-h"><div class="t">🗓️ 월별 상세</div></div><table class="grid" style="min-width:auto"><thead><tr class="sub"><th class="col-b">월</th><th>유입</th><th>유출</th><th>순증감</th></tr></thead><tbody>`;
  trend.forEach(t=>{ const nn=t.ins-t.outs; h+=`<tr><td class="col-b">${t.m}월</td><td class="num in">+${t.ins}</td><td class="num out">-${t.outs}</td><td><span class="rate ${nn>=0?'lo':'hi'}">${nn>=0?'+':''}${nn}</span></td></tr>`; });
  h+='</tbody></table></div></div>';
  c.innerHTML=h;
}

/* ---------- 업무 모듈 stub ---------- */
function renderStub(c,m){
  c.innerHTML=`<div class="page-h"><div><h2>${m.ic} <span class="em">${m.name}</span></h2><p>${m.sub}</p></div></div>
  <div class="stub"><div class="big">${m.ic}</div><h3>${m.name} 모듈</h3>
  <p>이 영역은 곧 실제 기능으로 채워집니다.<br>아래 세부 메뉴들이 여기에 들어올 예정이에요.</p>
  <div class="chips">${m.items.map(i=>`<span class="chip">${i[0]}</span>`).join('')}</div></div>`;
}

/* ---------- 권한 설정 ---------- */
const LEVELS=['안보임','보기','수정','삭제'];
let permEditRole='branch', permOpened={wonmu:true};
function renderPerm(c){
  const roles=[['admin','관리자 (본사)'],['branch','분원 관리자'],['teacher','선생님'],['assistant','보조']];
  const saved=loadPerms(); const cur=saved[permEditRole]||ROLE_PRESET[permEditRole];
  let h=`<div class="page-h"><div><h2>🔐 권한 설정</h2><p>역할을 고르고 메뉴별 권한을 지정하세요. (v1은 모듈 단위로 적용 — 세부 항목은 기능 완성 시 연결)</p></div></div>`;
  h+=`<div class="bar-ctl"><span class="lbl">설정 역할</span>
    <select onchange="permEditRole=this.value;renderPerm(document.getElementById('content'))">${roles.map(r=>`<option value="${r[0]}" ${r[0]===permEditRole?'selected':''}>${r[1]}</option>`).join('')}</select>
    <div class="presets"><span class="pl">프리셋:</span>
      <button class="preset-btn" onclick="applyPreset('admin')">본사</button>
      <button class="preset-btn" onclick="applyPreset('branch')">분원관리자</button>
      <button class="preset-btn" onclick="applyPreset('teacher')">선생님</button>
      <button class="save-btn" onclick="doSavePerm()">저장</button></div></div>`;
  h+=`<div class="legend2"><span><span class="kdot" style="background:var(--neg)"></span>안보임</span><span><span class="kdot" style="background:var(--warn)"></span>보기</span><span><span class="kdot" style="background:var(--brand)"></span>수정</span><span><span class="kdot" style="background:#6d4fd0"></span>삭제</span></div>`;
  h+='<div class="tree">';
  const allMods=MODULES.concat([{key:'perm',ic:'🔐',name:'권한 설정',sub:'이 화면 접근 권한 (메타)',items:[]}]);
  allMods.forEach(m=>{
    const lv=(cur[m.key]!=null)?cur[m.key]:0;
    h+=`<div class="cat"><div class="cat-head">
      <div class="cat-ic">${m.ic}</div><div><div class="cat-nm">${m.name}</div><div class="cat-sub">${m.sub}</div></div>
      <div class="cat-right"><div class="seg">${LEVELS.map((L,l)=>`<button data-l="${l}" class="${lv===l?'on':''}" onclick="setPermLv('${m.key}',${l})">${L}</button>`).join('')}</div></div>
    </div></div>`;
  });
  h+='</div>';
  c.innerHTML=h;
}
function curPermObj(){ const saved=loadPerms(); if(!saved[permEditRole]) saved[permEditRole]=Object.assign({},ROLE_PRESET[permEditRole]); return saved; }
function setPermLv(mod,l){ const s=curPermObj(); s[permEditRole][mod]=l; savePerms(s); renderPerm($('content')); }
function applyPreset(p){ const s=loadPerms(); s[permEditRole]=Object.assign({},ROLE_PRESET[p]); savePerms(s); renderPerm($('content')); toast('"'+p+'" 프리셋 적용됨'); }
function doSavePerm(){ toast('저장됐어요 ✓'); if(session.role) buildSidebar(); }

/* ---------- 토스트 ---------- */
let tt; function toast(m,kind){ const t=$('toast'); t.textContent=m; t.className=(kind==='err'?'err ':'')+'show'; clearTimeout(tt); tt=setTimeout(()=>t.className='',1800); }

/* ---------- 부팅 ---------- */
async function boot(){
  try{
    await loadDB();
  }catch(e){
    $('loading').innerHTML='<div class="lt" style="color:var(--neg)">데이터를 불러오지 못했습니다.<br>인터넷 연결 또는 Supabase 상태를 확인하세요.</div>';
    console.error(e); return;
  }
  $('loading').classList.add('hide');
  loadSession();
  if(session && db.users.some(u=>u.id===session.userId)) enterApp();
  else showLogin();
}
window.nav=nav; window.setPermLv=setPermLv; window.applyPreset=applyPreset; window.doSavePerm=doSavePerm; window.state=state; window.render=render;
$('loginBtn').addEventListener('click', doLogin);
$('loginPw').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
$('logoutBtn').addEventListener('click', logout);
boot();
