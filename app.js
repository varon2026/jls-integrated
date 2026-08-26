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
/* 다음 학기 id 계산 (spring→summer→fall→winter→다음해 spring) */
function nextSemId(fromId){
  const m=String(fromId||currentSemester().id).match(/sem_(\d+)_(\w+)/); if(!m) return currentSemester().id;
  let year=+m[1]; const order=['spring','summer','fall','winter']; let idx=order.indexOf(m[2]);
  idx++; if(idx>3){ idx=0; year++; }
  return `sem_${year}_${order[idx]}`;
}
/* 다음학기 대기용 학기 선택지 — 현재 다음 학기부터 4개 */
function waitSemList(){
  const out=[]; let id=currentSemester().id;
  for(let i=0;i<4;i++){ id=nextSemId(id); out.push({id, name:semNameFromId(id)}); }
  return out;
}

/* ---------- 데이터 레이어 (기존 포팅, 읽기 전용) ---------- */
const TABLES = [
  { key:'branches', table:'branches', fromRow:r=>({id:r.id,name:r.name}) },
  { key:'users', table:'users', fromRow:r=>({id:r.id,username:r.username,password:r.password,role:r.role,branchId:r.branch_id,teacherName:r.teacher_name,isManager:!!r.is_manager,menus:r.menus,title:r.title||null,active:r.active!==false,canManage:!!r.can_manage,canEdit:!!r.can_edit}) },
  { key:'semesters', table:'semesters', fromRow:r=>({id:r.id,name:r.name}) },
  { key:'students', table:'students', fromRow:r=>({id:r.id,code:r.code,name:r.name,school:r.school,grade:r.grade}) },
  { key:'semesterRecords', table:'semester_records', fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,className:r.class_name,classLabel:r.class_label,teacher:r.teacher,targetType:r.target_type,status:r.status,origin:r.origin,enrollDate:r.enroll_date,withdrawDate:r.withdraw_date,transfer:!!r.transfer,transferIn:!!r.transfer_in,transferTo:r.transfer_to,kind:r.kind||'regular',grade:r.grade||''}) },
  { key:'studentMovements', table:'student_movements', fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,type:r.type,date:r.date,memo:r.memo}) },
  { key:'counselingHistories', table:'counseling_histories', fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,date:r.date,type:r.type,content:r.content,counselor:r.counselor,batchId:r.batch_id,mistag:!!r.mistag}) },
  { key:'mcExemptions', table:'mc_exemptions', fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,stage:r.stage}) },
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
/* ---------- 라인 아이콘 (차분한 SVG) ---------- */
const _sv=(p,s)=>`<svg viewBox="0 0 24 24" width="${s||19}" height="${s||19}" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC={
  dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  wonmu:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  chongmu:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  insa:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
  unyoung:'<path d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v3"/><path d="M3 5v14a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M18 12a2 2 0 0 0 0 4h3v-4Z"/>',
  perm:'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  clip:'<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
};
const icon=(k,s)=>_sv(IC[k]||'', s);
const MODULES=[
  {key:'dashboard', ic:'dashboard', name:'대시보드', sub:'인원현황·마감', items:[['인원 마감',''],['분원 현황','']]},
  {key:'wonmu', ic:'wonmu', name:'원무', sub:'원생·상담·레벨테스트', items:[['신규예약',''],['레벨테스트',''],['상담관리',''],['원생현황',''],['등록/퇴원율',''],['대시보드','']]},
  {key:'chongmu', ic:'chongmu', name:'총무', sub:'교재·청소·소모품·A/S', items:[['교재재고',''],['청소업체',''],['소모품',''],['A/S 관리','']]},
  {key:'insa', ic:'insa', name:'인사·서류', sub:'입퇴사·교육청·서류', items:[['입·퇴사',''],['교육청 신고',''],['서류보관',''],['자격/안전교육','']]},
  {key:'unyoung', ic:'unyoung', name:'운영비', sub:'수입·지출·예산·결산', items:[['수입/지출',''],['예산관리',''],['결산',''],['정산','']]},
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
/* ===== 계정별 메뉴 권한 (users.is_manager / users.menus) ===== */
const ALL_MENUS=['dashboard','leveltest','inwon','grading','chongmu','insa','unyoung'];
const MENU_LABEL={dashboard:'대시보드',leveltest:'레벨테스트',inwon:'인원현황','inwon.roster':'신규·퇴원명단','inwon.closing':'인원마감표','inwon.students':'학생관리','inwon.segments':'세그먼트공지','inwon.accounts':'계정관리','inwon.data':'데이터관리',grading:'시험채점',chongmu:'교재관리',insa:'인사',unyoung:'운영비'};
/* ===== 직급(title) & 권한 프리셋 (계정 시스템 v2) ===== */
// 메뉴 트리(계층): 대시보드 / 원무[레벨테스트·인원현황(6세부)·시험채점] / 총무[교재관리·운영비] / 인사
// 원무·총무는 k 없는 '묶음'(권한 아님, 접기/펴기만). 실제 권한은 그 밑 항목들.
const MENU_TREE=[
  {k:'dashboard',label:'대시보드'},
  {label:'원무',sub:[
    {k:'leveltest',label:'레벨테스트'},
    {k:'inwon',label:'인원현황',sub:[
      {k:'inwon.roster',  label:'신규·퇴원명단'},
      {k:'inwon.closing', label:'인원마감표'},
      {k:'inwon.students',label:'학생관리'},
      {k:'inwon.segments',label:'세그먼트공지'},
      {k:'inwon.data',    label:'데이터관리'},
    ]},
    {k:'grading',label:'시험채점'},
  ]},
  {label:'총무',sub:[
    {k:'chongmu',label:'교재관리'},
    {k:'unyoung',label:'운영비'},
  ]},
  {k:'insa',label:'인사'},
];
const INWON_SUBS=['inwon.roster','inwon.closing','inwon.students','inwon.segments','inwon.data'];
const VIEW_ALL=['dashboard','leveltest','inwon',...INWON_SUBS,'grading','chongmu','insa','unyoung'];
// 직급 목록 (tier: hq본사/branch분원/teacher담임)
const TITLES=[
  {k:'branch_acct', label:'분원관리자',      tier:'branch',  edit:true,  manage:true},
  {k:'admin',       label:'본사관리자',      tier:'hq',      edit:false, manage:true},   // 데이터는 뷰어 + 계정관리 가능
  {k:'hq_staff',    label:'본사직원',        tier:'hq',      edit:false, manage:false},
  {k:'admin_staff', label:'행정직원',        tier:'branch',  edit:true,  manage:true},
  {k:'counsel_head',label:'상담실장',        tier:'branch',  edit:true,  manage:true},
  {k:'bm',          label:'원장/부원장(BM)', tier:'branch',  edit:false, manage:false, editToggle:true},
  {k:'daeri',       label:'대리',            tier:'branch',  edit:true,  manage:false},
  {k:'team',        label:'팀장',            tier:'branch',  edit:false, manage:false},
  {k:'junior',      label:'주임',            tier:'branch',  edit:false, manage:false},
  {k:'gwajang',     label:'과장',            tier:'branch',  edit:false, manage:false},
  {k:'teacher',     label:'담임',            tier:'teacher', edit:false, manage:false, teacherView:true},
];
// 계정관리 컨텍스트별 만들 수 있는 직급
const HQ_TITLES=['branch_acct','admin','hq_staff','admin_staff','counsel_head']; // 본사(admin)가 만드는 것
const BR_TITLES=['teacher','daeri','team','junior','gwajang','bm','counsel_head'];// 분원(행정직원)이 만드는 것
const TITLE_MAP={}; TITLES.forEach(t=>TITLE_MAP[t.k]=t);
// 직급 → 기본 메뉴 프리셋 (담임=자기반 인원+시험채점 / 그 외=전체 뷰, 행정직원이 세부 조정)
function titlePresetMenus(tk){ return tk==='teacher' ? ['inwon','grading'] : VIEW_ALL.slice(); }
// 현재 로그인 계정의 능력치 (하위호환: 기존 isManager도 인정)
function curCanManage(){ const u=curUser(); return !!(u.canManage||u.isManager); }
function curCanEdit(){ const u=curUser(); return !!(u.canEdit||u.isManager); }
function curIsActive(){ const u=curUser(); return u.active!==false; }
function uid(p){ return (p||'id')+'_'+Math.random().toString(36).slice(2,9); }
function curUser(){ return ((db&&db.users)||[]).find(u=>u.id===session.userId) || {}; }
function isManagerUser(){ return !!curUser().isManager; }
function userMenus(){
  const u=curUser();
  if(u.isManager) return ALL_MENUS.slice();
  if(u.menus){ try{ const a=JSON.parse(u.menus); if(Array.isArray(a)) return a; }catch(e){} }
  // 명시 menus 없으면 기존 역할 프리셋에서 유도(하위호환)
  const p=ROLE_PRESET[session.role]||ROLE_PRESET.teacher; const out=[];
  if((p.dashboard||0)>0) out.push('dashboard');
  if((p.wonmu||0)>0) out.push('leveltest','inwon','grading');
  if((p.chongmu||0)>0) out.push('chongmu');
  if((p.insa||0)>0) out.push('insa');
  if((p.unyoung||0)>0) out.push('unyoung');
  return out;
}
function hasMenu(k){ return userMenus().includes(k); }
function canModule(moduleKey){
  if(moduleKey==='perm'||moduleKey==='accounts') return curCanManage();
  if(moduleKey==='wonmu') return hasMenu('leveltest')||hasMenu('inwon')||hasMenu('grading');
  if(moduleKey==='chongmu') return hasMenu('chongmu')||hasMenu('unyoung');  // 운영비가 총무 안으로 흡수됨
  return hasMenu(moduleKey);
}
function firstView(){
  if(hasMenu('dashboard')) return 'dashboard';
  if(canModule('wonmu')) return 'wonmu';
  for(const m of MODULES){ if(m.key!=='dashboard'&&m.key!=='wonmu'&&canModule(m.key)) return m.key; }
  return curCanManage()?'accounts':'dashboard';
}

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
let state={ semId:null, view:'dashboard', dashMonthIdx:null, ltY:null, ltM:null };
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
  // 담임: 통합 셸 없이 인원현황(담임 화면)으로 바로 — 학원 전체 인원 같은 건 안 보여줌
  if(session.role==='teacher'){ state.view='wonmu'; wonmuState.view='inwon'; render(); return; }
  state.view = firstView();
  wonmuState.view = 'hub';   // 원무 내부 상태도 초기화 (다음에 원무 들어가면 첫 화면부터)
  buildSidebar();
  render();
}
function buildSidebar(){
  let h='<div class="sb-sect">메뉴</div>';
  MODULES.forEach(m=>{
    if(m.key==='unyoung') return;   // 운영비는 총무 안으로 흡수 — 사이드바 별도 표시 안 함
    if(!canModule(m.key)) return;
    h+=`<div class="sb-item ${state.view===m.key?'active':''}" onclick="nav('${m.key}')"><span class="ic">${icon(m.ic)}</span>${m.name}</div>`;
  });
  h+='<div class="sb-sect">설정</div>';
  if(curCanManage()) h+=`<div class="sb-item ${state.view==='accounts'?'active':''}" onclick="nav('accounts')"><span class="ic">${icon('perm')}</span>계정 관리</div>`;
  h+=`<div class="sb-item" onclick="changeMyPw()"><span class="ic">${icon('perm')}</span>비밀번호 변경</div>`;
  $('sbNav').innerHTML=h;
}
function nav(v){ if(v==='wonmu') wonmuState.view='hub'; if(v==='chongmu' && typeof chongmuView!=='undefined') chongmuView='hub'; state.view=v; buildSidebar(); render(); window.scrollTo(0,0); closeSidebar(); }
/* ---- 모바일 사이드바 토글 (햄버거) ---- */
function toggleSidebar(){ const sb=$('sidebar'), bd=$('sbBackdrop'); if(!sb) return; const open=!sb.classList.contains('open'); sb.classList.toggle('open',open); if(bd) bd.classList.toggle('show',open); }
function closeSidebar(){ const sb=$('sidebar'), bd=$('sbBackdrop'); if(sb) sb.classList.remove('open'); if(bd) bd.classList.remove('show'); }
window.toggleSidebar=toggleSidebar; window.closeSidebar=closeSidebar;

/* ---------- 렌더 라우터 ---------- */
function render(){
  const c=$('content'); const v=state.view;
  $('semPick').style.display = (v==='dashboard')?'flex':'none';
  if(v==='dashboard'){ renderDashHome(c); }
  else if(v==='accounts'){ $('crumbs').innerHTML='<span class="mut">설정 › </span><b>계정 관리</b>'; renderAccounts(c); }
  else if(v==='wonmu'){ $('crumbs').innerHTML='<b>원무</b>'; renderWonmu(c); }
  else if(v==='chongmu'){ $('crumbs').innerHTML = (chongmuView==='books') ? '<b>총무</b><span class="mut"> › 교재 재고관리</span>' : (chongmuView==='expense') ? '<b>총무</b><span class="mut"> › 운영비 관리</span>' : '<b>총무</b>'; renderChongmu(c); }
  else { const m=MODULES.find(x=>x.key===v); $('crumbs').innerHTML=`<b>${m.name}</b>`; renderStub(c,m); }
}

/* ============================================================================
   대시보드 홈: 인원 현황 / 경영 분석 토글 (기존 인원 계산은 그대로 재사용·읽기전용)
   ============================================================================ */
function setDashView(v){ state.dashView=v; render(); }
function renderDashHome(c){
  if(!state.dashView) state.dashView='inwon';
  $('crumbs').innerHTML='<b>대시보드</b>';
  const btn=(on)=>'border:1px solid '+(on?'transparent':'#e2dcf2')+';background:'+(on?'linear-gradient(135deg,#8b6ee8,#6f9ad6)':'#fff')+';color:'+(on?'#fff':'#7b7488')+';font:inherit;font-weight:800;font-size:13.5px;padding:9px 20px;border-radius:20px;cursor:pointer';
  c.innerHTML='<div style="display:flex;gap:8px;margin-bottom:18px">'
    +'<button onclick="setDashView(\'inwon\')" style="'+btn(state.dashView==='inwon')+'">인원 현황</button>'
    +'<button onclick="setDashView(\'mgmt\')" style="'+btn(state.dashView==='mgmt')+'">경영 분석</button>'
    +'<button onclick="setDashView(\'jh\')" style="'+btn(state.dashView==='jh')+'">전형 현황</button>'
    +'<button onclick="setDashView(\'ban\')" style="'+btn(state.dashView==='ban')+'">반배정표</button>'
    +'</div><div id="dashBody"></div>';
  $('semPick').style.display=(state.dashView==='inwon'||state.dashView==='ban')?'flex':'none';
  const body=$('dashBody');
  if(state.dashView==='mgmt') renderMgmtDash(body);
  else if(state.dashView==='jh') renderJeonhyeongDash(body);
  else if(state.dashView==='ban') renderBanDash(body);
  else renderDashboard(body);
}
/* ============================================================================
   반배정표 — 현재 재원명단을 부(시간대)/반별로 배치. 신규·복귀는 연두.
   반이름 예: [IS2]SU1/MWF/IS2/J → 레벨 IS2 · 부(SU1+MWF) · 교실 J
   ============================================================================ */
/* 반이름 대괄호[레벨] 뒤를 '/'로 쪼갬: [IS2]SU1/MWF/IS2/J → ['SU1','MWF','IS2','J'] */
function banParts(cn){ return String(cn||'').replace(/^\s*\[[^\]]*\]/,'').split('/').map(x=>x.trim()).filter(Boolean); }
function banBu(className){
  const parts=banParts(className);
  const code=parts[0]||'';           // 시간대 코드(SU1/SM3 등) — 대괄호 뒤 첫 조각
  const dayseg=(parts[1]||'').toUpperCase();
  const day = /TT/.test(dayseg) ? 'TT' : (/MWF/.test(dayseg)?'MWF':'');
  const mm = code.match(/(\d)/); const num = mm?parseInt(mm[1],10):0;
  if(!day||!num) return null;
  if(day==='MWF'){ const t={1:'2:30~4:10',2:'4:10~5:50',3:'5:50~7:50',4:'7:50~9:50'}[num]||''; return {order:num, label:num+'부 · 월수금 · '+t}; }
  const t={1:'3:30~6:30',2:'6:30~9:30'}[num]||''; return {order:10+num, label:'화목 · '+t};
}
function banLevel(cn){ const m=String(cn||'').match(/\[([^\]]+)\]/); return m?m[1].trim():String(cn||''); }
function banRoom(cn){ const body=String(cn||'').replace(/^\s*\[[^\]]*\]/,''); const segs=body.split('/'); const last=(segs.length?segs[segs.length-1]:'').trim(); return (/^[A-Za-z]{1,2}$/.test(last) && !/^(mw|wf|tt)$/i.test(last)) ? last : ''; }  // 강의실=알파벳 1~2글자만. 요일·숫자·이상한 값은 빈칸
/* 표시용 레벨명 — CHESS는 레벨만(DSA2(1)), ACE는 레벨_학년(PA1(4-6)_E6) */
function banLevelLabel(cn){
  const lv=banLevel(cn);
  if(banIsChess(lv)) return lv;                       // CHESS: 레벨만
  const p=banParts(cn); const seg=p.length>=2?p[p.length-2]:'';   // ACE: 레벨_학년
  if(seg && seg.toUpperCase().startsWith(lv.toUpperCase())) return seg;   // 이미 '레벨_학년'이면 그대로 (A2_M1)
  if(seg && /^[A-Za-z]?\d/.test(seg)) return lv+'_'+seg;
  return lv;
}
function banTeacher(t){ const m=String(t||'').match(/^([A-Za-z]+)/); return m?m[1]:String(t||''); }
function banSchoolGrade(st){
  let s=String((st&&st.school)||'').replace('초등학교','초').replace('중학교','중').replace('고등학교','고');
  if(s.startsWith('수원')&&s.length>3) s=s.slice(2);
  const g=String((st&&st.grade)||''); const gm=g.match(/(\d+)/); return s+(gm?gm[1]:'');
}
function banLvRank(lv){ const order=['IS','DS','LS','MS','PA','A','MA','HA','HM','HB','B']; const m=String(lv||'').toUpperCase().match(/^([A-Za-z]+)(\d*)/); const pre=m?m[1]:lv; const oi=order.indexOf(pre); return (oi<0?99:oi)*100+(m&&m[2]?parseInt(m[2],10):0); }
function banScope(){ if(session.role!=='admin') return session.branchId; return (state.banBranch && state.banBranch!=='all') ? state.banBranch : (state.banBranch||(db.branches[0]&&db.branches[0].id)); }
function banSetBranch(v){ state.banBranch=v; render(); }
function renderBanDash(c){
  const semId=state.semId;
  const brId=banScope();
  const brName=(db.branches.find(b=>b.id===brId)||{}).name||'분원';
  // 부 → 반(className) → 학생들
  const recs=db.semesterRecords.filter(r=>r.branchId===brId && r.semesterId===semId && r.status==='active' && (r.kind||'regular')!=='exam');
  const buMap=new Map();   // buLabel → {order, classes:Map(className→{level,teacher,room,students[]})}
  recs.forEach(r=>{
    const bu=banBu(r.className); if(!bu) return;
    if(!buMap.has(bu.label)) buMap.set(bu.label,{order:bu.order, classes:new Map()});
    const grp=buMap.get(bu.label);
    if(!grp.classes.has(r.className)) grp.classes.set(r.className,{level:banLevel(r.className),label:banLevelLabel(r.className),chess:banIsChess(banLevel(r.className)),teacher:banTeacher(r.teacher),room:banRoom(r.className),students:[]});
    const st=getStudent(r.studentId)||{};
    grp.classes.get(r.className).students.push({name:st.name||'?', sg:banSchoolGrade({...st, grade:(r.grade||st.grade)}), isNew:(r.origin==='new'||r.origin==='return')});
  });
  const bus=[...buMap.entries()].sort((a,b)=>a[1].order-b[1].order);
  const brSel = session.role==='admin' ? '<span style="font-size:12.5px;font-weight:800;color:#a9a2b6;margin-right:6px">분원</span><select onchange="banSetBranch(this.value)" style="font:inherit;font-weight:700;font-size:13px;border:1px solid #ece8f5;border-radius:9px;padding:6px 10px;background:#fff;color:#2f3138;cursor:pointer">'+db.branches.map(b=>'<option value="'+b.id+'" '+(b.id===brId?'selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>' : '';
  let gChess=0,gAce=0,gTot=0;
  let h='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">'
    +'<div style="font-size:16px;font-weight:800;color:#2f3138">'+esc(brName)+' 반배정표</div>'
    +'<div style="flex:1"></div>'+brSel
    +'<button class="btn" onclick="downloadBanXlsx()" style="border:1px solid #8b6ee8;color:#8b6ee8;background:#fff;border-radius:9px;padding:7px 14px;font-weight:800;font-size:13px;cursor:pointer">⬇ 엑셀</button>'
    +'</div><div id="banArea">';
  if(!bus.length){ h+='<div style="padding:40px;text-align:center;color:#a9a2b6">이 분원·학기에 배정된 반이 없어요. (반이름에 시간대/요일 정보가 있어야 부가 잡혀요)</div>'; }
  bus.forEach(([label,grp])=>{
    const classes=[...grp.classes.entries()].sort((a,b)=>banLvRank(a[1].level)-banLvRank(b[1].level));
    let bChess=0,bAce=0,bTot=0;
    const ROWS=Math.max(15, ...classes.map(c=>c[1].students.length));
    h+='<div style="margin-bottom:22px"><div style="font-weight:800;font-size:13.5px;color:#2a2440;background:#e7ecf3;padding:6px 12px;border-radius:6px;margin-bottom:6px">'+esc(label)+'</div>';
    h+='<div style="overflow:auto"><table style="border-collapse:collapse;font-size:11.5px;table-layout:fixed"><colgroup><col style="width:30px">'+classes.map(()=>'<col style="width:66px"><col style="width:46px">').join('')+'</colgroup><tbody>';
    // 레벨/담임/교실 — CHESS=파랑, ACE=보라 계열로 구분
    const lvBg=c2=>c2.chess?'#cfe0f5':'#e6d3f5', tcBg=c2=>c2.chess?'#e5eefb':'#f0e6fb';
    h+='<tr><th style="border:1px solid #cfc9de;background:#f6f3fc;padding:3px 6px;font-size:11px;color:#8b6ee8">레벨</th>'+classes.map(c=>'<th colspan="2" style="border:1px solid #cfc9de;background:'+lvBg(c[1])+';padding:3px 4px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:'+(c[1].chess?'#1c4f8a':'#5a2a8a')+'">'+esc(c[1].label)+'</th>').join('')+'</tr>';
    h+='<tr><th style="border:1px solid #cfc9de;background:#f6f3fc;padding:3px 6px;font-size:11px;color:#8b6ee8">담임</th>'+classes.map(c=>'<td colspan="2" style="border:1px solid #cfc9de;background:'+tcBg(c[1])+';text-align:center;font-weight:700;padding:3px 8px">'+esc(c[1].teacher)+'</td>').join('')+'</tr>';
    h+='<tr><th style="border:1px solid #cfc9de;background:#f6f3fc;padding:3px 6px;font-size:11px;color:#8b6ee8">교실</th>'+classes.map(c=>'<td colspan="2" style="border:1px solid #cfc9de;background:#eef;text-align:center;font-weight:700;padding:3px 8px">'+esc(c[1].room)+'</td>').join('')+'</tr>';
    for(let i=0;i<ROWS;i++){
      h+='<tr><td style="border:1px solid #cfc9de;background:#eee;text-align:center;font-weight:700;color:#999">'+(i+1)+'</td>';
      classes.forEach(c=>{ const s=c[1].students[i];
        if(s){ const bg=s.isNew?'background:#c9f0c0;':''; h+='<td style="border:1px solid #cfc9de;padding:2px 5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+bg+'">'+esc(s.name)+'</td><td style="border:1px solid #cfc9de;padding:2px 4px;color:#666;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+bg+'">'+esc(s.sg)+'</td>'; }
        else h+='<td style="border:1px solid #cfc9de"></td><td style="border:1px solid #cfc9de"></td>';
      });
      h+='</tr>';
    }
    // 인원수
    h+='<tr><td style="border:1px solid #cfc9de;background:#ddd;text-align:center;font-weight:800">계</td>'+classes.map(c=>{const n=c[1].students.length;bTot+=n;if(banIsChess(c[1].level))bChess+=n;else bAce+=n;return '<td colspan="2" style="border:1px solid #cfc9de;background:#ddd;text-align:center;font-weight:800">'+n+'명</td>';}).join('')+'</tr>';
    h+='</tbody></table></div>';
    h+='<div style="margin-top:5px;font-size:12px;font-weight:800;color:#2a2440">CHESS <span style="color:#c24a4a">'+bChess+'</span> · ACE <span style="color:#356fb2">'+bAce+'</span> · 총 '+bTot+'명</div>';
    h+='</div>';
    gChess+=bChess; gAce+=bAce; gTot+=bTot;
  });
  h+='</div>';
  if(bus.length) h+='<div style="margin-top:8px;padding:12px 16px;background:#faf8ff;border:1px solid #ece8f5;border-radius:12px;font-weight:800;font-size:14px;color:#2f3138">전체 · CHESS <span style="color:#c24a4a">'+gChess+'</span>명 · ACE <span style="color:#356fb2">'+gAce+'</span>명 · <span style="color:#8b6ee8">총 '+gTot+'명</span></div>';
  c.innerHTML=h;
}
function banIsChess(lv){ return /^(IS|DS|LS|MS)/.test(String(lv||'').toUpperCase()); }
function downloadBanXlsx(){
  try{
    const tables=document.querySelectorAll('#banArea table');
    if(!tables.length){ toast&&toast('내보낼 표가 없어요','err'); return; }
    const wb=XLSX.utils.book_new();
    tables.forEach((t,i)=>{ const ws=XLSX.utils.table_to_sheet(t); XLSX.utils.book_append_sheet(wb, ws, (i+1)+'부'); });
    const brName=(db.branches.find(b=>b.id===banScope())||{}).name||'분원';
    XLSX.writeFile(wb, brName+'_반배정표_'+(semName(state.semId)||'')+'.xlsx');
  }catch(e){ console.error(e); toast&&toast('엑셀 생성 실패','err'); }
}
/* ---- 경영 분석: 학기→달력월 매핑 + 기간 필터 (기존 monthlyClosing 재사용) ---- */
function mgScope(){ if(session.role!=='admin') return session.branchId; return (state.mgBranch && state.mgBranch!=='all') ? state.mgBranch : null; }
function mgBranchList(){ const sc=mgScope(); if(sc) return db.branches.filter(b=>b.id===sc); return session.role==='admin' ? db.branches : db.branches.filter(b=>b.id===session.branchId); }
function mgSetBranch(v){ state.mgBranch=v; render(); }
/* 축 눈금 정리 — 500 등 깔끔한 단위로 (1·2·2.5·5 ×10ⁿ) */
function mgNice(maxVal, targetTicks, unit){ targetTicks=targetTicks||5;
  if(unit){ if(!(maxVal>0)) return {max:unit,step:unit}; let step=unit, max=Math.ceil(maxVal/step)*step; while(max/step>7){ step+=unit; max=Math.ceil(maxVal/step)*step; } return {max,step}; }
  if(!(maxVal>0)) return {max:1,step:1};
  const raw=maxVal/targetTicks; const mag=Math.pow(10,Math.floor(Math.log10(raw))); const norm=raw/mag;
  const nn = norm<=1?1 : norm<=2?2 : norm<=2.5?2.5 : norm<=5?5 : 10;
  const step=nn*mag; return { max:Math.ceil(maxVal/step)*step, step };
}
/* fromK~toK 사이 달력 월 목록 (yyyymm) */
function mgEnumMonths(fromK,toK){ const out=[]; let y=Math.floor(fromK/100), m=fromK%100; while(y*100+m<=toK){ out.push(y*100+m); m++; if(m>12){m=1;y++;} } return out; }
function semCalMonths(semId){
  const mm=String(semId).match(/sem_(\d+)_(\w+)/); if(!mm) return [];
  const y=+mm[1], s=mm[2];
  if(s==='winter') return [{y,m:12},{y:y+1,m:1},{y:y+1,m:2}];
  if(s==='spring') return [{y,m:3},{y,m:4},{y,m:5}];
  if(s==='summer') return [{y,m:6},{y,m:7},{y,m:8}];
  if(s==='fall')   return [{y,m:9},{y,m:10},{y,m:11}];
  return [];
}
/* 학기 목록 + 실제 학생 기록에 있는 학기 id 전부 (진행중 학기·목록 누락 학기도 포함) */
function mgSemIds(){ const ids={}; (db.semesters||[]).forEach(s=>{ if(s&&s.id) ids[s.id]=1; }); (db.semesterRecords||[]).forEach(r=>{ if(r&&r.semesterId) ids[r.semesterId]=1; }); return Object.keys(ids); }
function mgAllMonths(){ const set={}; mgSemIds().forEach(id=>semCalMonths(id).forEach(c=>set[c.y*100+c.m]={y:c.y,m:c.m})); return Object.values(set).sort((a,b)=>(a.y*100+a.m)-(b.y*100+b.m)); }
function mgKey(o){ return o.y*100+o.m; }
function mgLabel(o){ return String(o.y).slice(2)+'.'+String(o.m).padStart(2,'0'); }
function ymKey(s){ const m=String(s||'').match(/(\d{4})-(\d{1,2})/); return m?parseInt(m[1],10)*100+parseInt(m[2],10):null; }
/* 퇴원 연월키 — 기록의 withdrawDate 우선, 없으면 이동이력(studentMovements) 날짜 (withdrawMonth와 동일한 폴백) */
function mgWKey(r){ if(r.withdrawDate) return ymKey(r.withdrawDate);
  const mv=(db.studentMovements||[]).find(m=>m.studentId===r.studentId && m.branchId===r.branchId && m.semesterId===r.semesterId && m.type==='withdraw');
  return (mv&&mv.date)?ymKey(mv.date):null; }
/* 실제 날짜 기준 월별 재원/퇴원율 — 학기초(enroll_date null) 관습에 안 의존 (여름처럼 전원 enroll_date 있어도 정상) */
function mgMonthStats(recs, calMonths){
  const firstK=calMonths[0].y*100+calMonths[0].m, lastK=calMonths[calMonths.length-1].y*100+calMonths[calMonths.length-1].m;
  return calMonths.map(cm=>{ const K=cm.y*100+cm.m; let reg=0, base=0, wd=0;
    recs.forEach(r=>{ const eK=r.enrollDate?ymKey(r.enrollDate):0; if(eK===null||eK>K) return;  // 이 달 이후 입학 = 아직 없음
      let wK=mgWKey(r);
      if(wK!==null){ if(wK<firstK) wK=firstK; else if(wK>lastK) wK=lastK; }  // 학기 범위 밖 퇴원일(정리날짜 등)은 학기 경계 달로 귀속
      if(wK===null||wK>K) reg++;          // 월말 재원: 이 달 말까지 안 나감
      if(wK===null||wK>=K) base++;        // 월초+신규(그 달 재적): 분모
      if(wK===K && !r.transfer) wd++;     // 이 달 순수 퇴원
    });
    return { y:cm.y, m:cm.m, k:K, reg, rate: base>0 ? wd/base*100 : 0 };
  });
}
function mgTrend(fromK,toK){ const scope=mgScope(); const seen={};
  mgSemIds().forEach(semId=>{ const cal=semCalMonths(semId); if(!cal.length) return;
    const recs=db.semesterRecords.filter(r=>r.semesterId===semId && (r.kind||'regular')!=='exam' && (!scope||r.branchId===scope));
    mgMonthStats(recs, cal).forEach(s=>{ if(s.k<fromK||s.k>toK) return; seen[s.k]={k:s.k,y:s.y,m:s.m,reg:s.reg,rate:s.rate}; });
  });
  return Object.keys(seen).map(Number).sort((a,b)=>a-b).map(k=>seen[k]);
}
function mgLt(fromK,toK){ const scope=mgScope(); const by={};
  reservations.forEach(r=>{ if(scope&&r.branch_id!==scope) return; const ym=String(r.reserved_date||'').slice(0,7); if(!/^\d{4}-\d{2}$/.test(ym)) return;
    const k=parseInt(ym.slice(0,4),10)*100+parseInt(ym.slice(5,7),10); if(k<fromK||k>toK) return; (by[k]=by[k]||[]).push(r); });
  return Object.keys(by).map(Number).sort((a,b)=>a-b).map(k=>Object.assign({k,y:Math.floor(k/100),m:k%100}, ltMetrics(by[k])));
}
function mgSvgLine(pts, valOf, opt){ opt=opt||{};
  if(!pts.length) return '<div style="color:#a9a2b6;font-size:13px;padding:34px 0;text-align:center">이 기간엔 데이터가 없어요</div>';
  const W=520,H=210,L=46,R=14,T=16,B=28, iw=W-L-R, ih=H-T-B;
  const vals=pts.map(valOf); const col=opt.color||'#2a78d6'; const n=pts.length;
  const nz=mgNice(Math.max(opt.floor||0, ...vals), 5, opt.unit); const max=nz.max, step=nz.step;
  const x=i=> n===1?L+iw/2 : L+iw*(i/(n-1)); const y=v=> T+ih*(1-v/max);
  let g=''; for(let val=0; val<=max+1e-9; val+=step){ const yy=y(val); g+='<line x1="'+L+'" y1="'+yy+'" x2="'+(W-R)+'" y2="'+yy+'" stroke="#e1e0d9"/><text x="'+(L-8)+'" y="'+(yy+3)+'" font-size="10" fill="#898781" text-anchor="end">'+(opt.fmt?opt.fmt(val):Math.round(val))+'</text>'; }
  let d=''; vals.forEach((v,i)=>d+=(i?'L':'M')+x(i)+' '+y(v)+' ');
  let dots=''; pts.forEach((p,i)=>{ const v=vals[i]; dots+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3.4" fill="#fff" stroke="'+col+'" stroke-width="2"/>'
    +'<text x="'+x(i)+'" y="'+(y(v)-9)+'" font-size="9.5" font-weight="800" fill="'+col+'" text-anchor="middle">'+(opt.fmt?opt.fmt(v):v)+'</text>'
    +'<text x="'+x(i)+'" y="'+(H-9)+'" font-size="9.5" fill="#898781" text-anchor="middle">'+mgLabel(p)+'</text>'; });
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+g+'<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'+dots+'</svg>';
}
function mgSvgLt(rows){
  if(!rows.length) return '<div style="color:#a9a2b6;font-size:13px;padding:34px 0;text-align:center">이 기간엔 레벨테스트 데이터가 없어요</div>';
  const W=1040,H=240,L=34,R=118,T=14,B=30, iw=W-L-R, ih=H-T-B;
  const max=Math.max(1,Math.ceil(Math.max(...rows.map(r=>r.booked))*1.18));
  const gw=iw/rows.length, bw=Math.min(24,gw/4.6), gap=4; const y=v=>T+ih*(1-v/max);
  let g=''; for(let i=0;i<=4;i++){ const val=max*i/4, yy=y(val); g+='<line x1="'+L+'" y1="'+yy+'" x2="'+(W-R)+'" y2="'+yy+'" stroke="#e1e0d9"/><text x="'+(L-6)+'" y="'+(yy+3)+'" font-size="10" fill="#898781" text-anchor="end">'+Math.round(val)+'</text>'; }
  const cols=['#b7d3f6','#5598e7','#184f95']; let bars='';
  rows.forEach((r,i)=>{ const cx=L+gw*i+gw/2, vals=[r.booked,r.attended,r.enrolled], sx=cx-(bw*3+gap*2)/2;
    vals.forEach((v,k)=>{ const bx=sx+k*(bw+gap), by=y(v), bh=T+ih-by; bars+='<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+Math.max(bh,1)+'" rx="3.5" fill="'+cols[k]+'"/><text x="'+(bx+bw/2)+'" y="'+(by-3)+'" font-size="9" font-weight="800" fill="#52514e" text-anchor="middle">'+v+'</text>'; });
    bars+='<text x="'+cx+'" y="'+(H-11)+'" font-size="10" fill="#898781" text-anchor="middle">'+mgLabel(r)+'</text>'; });
  const tb=rows.reduce((a,r)=>a+r.booked,0), ta=rows.reduce((a,r)=>a+r.attended,0), te=rows.reduce((a,r)=>a+r.enrolled,0); const rx=W-R+14;
  const sm='<text x="'+rx+'" y="'+(T+24)+'" font-size="10" fill="#898781">기간 합계</text>'
    +'<text x="'+rx+'" y="'+(T+48)+'" font-size="10" fill="#898781">참석률</text><text x="'+rx+'" y="'+(T+70)+'" font-size="20" font-weight="800" fill="#5598e7">'+(tb?Math.round(ta/tb*100):0)+'%</text>'
    +'<text x="'+rx+'" y="'+(T+104)+'" font-size="10" fill="#898781">등록률</text><text x="'+rx+'" y="'+(T+126)+'" font-size="20" font-weight="800" fill="#184f95">'+(tb?Math.round(te/tb*100):0)+'%</text>';
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+g+bars+sm+'</svg>';
}
function mgSetRange(which,val){ val=+val;
  if(which==='fromY') state.mgFrom.y=val; else if(which==='fromM') state.mgFrom.m=val;
  else if(which==='toY') state.mgTo.y=val; else if(which==='toM') state.mgTo.m=val;
  render();
}
/* nextSemId는 파일 상단(43줄)에 정의됨 — 인자 없이 부르면 현재학기 기준 다음학기 반환.
   (예전엔 여기 중복 정의가 있어 인자 없는 호출이 undefined를 반환 → wait_semester가 비어 저장되는 버그였음) */
/* 레벨테스트 데이터가 있는 달 목록(yyyymm) */
function mgLtMonths(){ const set={}; reservations.forEach(r=>{ const ym=String(r.reserved_date||'').slice(0,7); if(/^\d{4}-\d{2}$/.test(ym)) set[parseInt(ym.slice(0,4),10)*100+parseInt(ym.slice(5,7),10)]=1; }); return Object.keys(set).map(Number).sort((a,b)=>a-b); }
function mgSetLtRange(which,val){ val=+val; if(which==='fromY') state.ltFrom.y=val; else if(which==='fromM') state.ltFrom.m=val; else if(which==='toY') state.ltTo.y=val; else if(which==='toM') state.ltTo.m=val; render(); }
function renderMgmtDash(c){
  if(!bookState.loaded){ c.innerHTML='<div style="padding:44px 0;text-align:center;color:#a9a2b6;font-size:13px">레벨테스트·대기 정보 불러오는 중…</div>'; ensureReservations().then(()=>{ if(state.view==='dashboard'&&state.dashView==='mgmt'){ const b=document.getElementById('dashBody'); if(b) renderMgmtDash(b); } }); return; }
  const allM=mgAllMonths();
  const _now=new Date(); const nowY=_now.getFullYear(), nowM=_now.getMonth()+1;
  if(!state.mgFrom||!state.mgTo){ const cur=semCalMonths(state.semId);
    state.mgFrom = cur.length ? {y:cur[0].y,m:cur[0].m} : {y:nowY,m:nowM};   // 시작: 현재 학기 시작 달
    state.mgTo   = {y:nowY, m:nowM};                                          // 끝: 현재 월
  }
  let fromK=mgKey(state.mgFrom), toK=mgKey(state.mgTo); if(fromK>toK){ const t=fromK; fromK=toK; toK=t; }
  const monthsList=mgEnumMonths(fromK,toK); const capped=monthsList.length>12; if(capped) fromK=monthsList[monthsList.length-12];  // 최대 12개월
  const trend=mgTrend(fromK,toK);
  // 레벨테스트 전용 기간 (6월부터 · 최대 6개월)
  const ltAll=mgLtMonths(); const ltFloorK=ltAll.length?ltAll[0]:202506; const ltLatestK=ltAll.length?ltAll[ltAll.length-1]:toK;
  if(!state.ltFrom||!state.ltTo){ state.ltFrom={y:nowY,m:6}; state.ltTo={y:nowY,m:Math.max(6,nowM)}; }  // 기본: 6월 ~ 현재 월
  let ltFromK=mgKey(state.ltFrom), ltToK=mgKey(state.ltTo); if(ltFromK>ltToK){ const t=ltFromK; ltFromK=ltToK; ltToK=t; }
  if(ltFromK<ltFloorK) ltFromK=ltFloorK;
  const ltList=mgEnumMonths(ltFromK,ltToK); const ltCapped=ltList.length>6; if(ltCapped) ltFromK=ltList[ltList.length-6];
  const lt=mgLt(ltFromK,ltToK);
  const ltYears=[...new Set(ltAll.map(k=>Math.floor(k/100)))]; if(!ltYears.length) ltYears.push(new Date().getFullYear());
  const ltYOpt=(selY)=>ltYears.map(y=>'<option value="'+y+'" '+(y===selY?'selected':'')+'>'+y+'</option>').join('');
  const ltMOpt=(selM)=>Array.from({length:12},(_,i)=>i+1).map(m=>'<option value="'+m+'" '+(m===selM?'selected':'')+'>'+m+'월</option>').join('');
  const years=[...new Set(allM.map(o=>o.y))]; if(!years.length) years.push(new Date().getFullYear());
  const yOpt=(selY)=>years.map(y=>'<option value="'+y+'" '+(y===selY?'selected':'')+'>'+y+'</option>').join('');
  const mOpt=(selM)=>Array.from({length:12},(_,i)=>i+1).map(m=>'<option value="'+m+'" '+(m===selM?'selected':'')+'>'+m+'월</option>').join('');
  const card='background:#fff;border:1px solid #ece8f5;border-radius:16px;padding:18px 20px;box-shadow:0 3px 14px rgba(80,70,120,.05);margin-bottom:16px';
  const h3s='margin:0 0 2px;font-size:15px;font-weight:800;color:#3a3742';
  const css='font-size:12px;color:#a9a2b6;font-weight:600;margin-bottom:12px';
  const sels='background:#f6f3fc;border:1px solid #e2dcf2;border-radius:8px;padding:5px 8px;font:inherit;font-weight:700;color:#8b6ee8;cursor:pointer';
  let html='';
  html+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;font-size:13px;font-weight:700;color:#7b7488">'
    +'<span>기간</span>'
    +'<select onchange="mgSetRange(\'fromY\',this.value)" style="'+sels+'">'+yOpt(state.mgFrom.y)+'</select>'
    +'<select onchange="mgSetRange(\'fromM\',this.value)" style="'+sels+'">'+mOpt(state.mgFrom.m)+'</select>'
    +'<span>~</span>'
    +'<select onchange="mgSetRange(\'toY\',this.value)" style="'+sels+'">'+yOpt(state.mgTo.y)+'</select>'
    +'<select onchange="mgSetRange(\'toM\',this.value)" style="'+sels+'">'+mOpt(state.mgTo.m)+'</select>'
    +(session.role==='admin' ? '<span style="margin-left:8px">분원</span><select onchange="mgSetBranch(this.value)" style="'+sels+'"><option value="all" '+((!state.mgBranch||state.mgBranch==='all')?'selected':'')+'>전체</option>'+(db.branches||[]).map(b=>'<option value="'+b.id+'" '+(state.mgBranch===b.id?'selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>' : '')
    +(capped ? '<span style="color:#a9a2b6;font-weight:600;margin-left:6px">· 최대 12개월까지 표시</span>' : '')
    +'</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
    +'<div style="'+card+'"><h3 style="'+h3s+'">재원 추이</h3><div style="'+css+'">월별 재원 수</div>'+mgSvgLine(trend,p=>p.reg,{color:'#2a78d6',unit:(mgScope()?100:500)})+'</div>'
    +'<div style="'+card+'"><h3 style="'+h3s+'">퇴원율 추이</h3><div style="'+css+'">월별 퇴원율(%) · 낮을수록 좋음</div>'+mgSvgLine(trend,p=>Math.round(p.rate*10)/10,{color:'#d03b3b',floor:6,fmt:v=>v.toFixed(1)+'%'})+'</div>'
    +'</div>';
  html+='<div style="'+card+'">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap"><div><h3 style="'+h3s+'">레벨테스트 — 달별 예약 · 참석 · 등록</h3><div style="'+css+'">월별 전환 현황 · 레벨테스트 전용 기간</div></div>'
    +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;font-weight:700;color:#7b7488">'
    +'<select onchange="mgSetLtRange(\'fromY\',this.value)" style="'+sels+'">'+ltYOpt(state.ltFrom.y)+'</select>'
    +'<select onchange="mgSetLtRange(\'fromM\',this.value)" style="'+sels+'">'+ltMOpt(state.ltFrom.m)+'</select>'
    +'<span>~</span>'
    +'<select onchange="mgSetLtRange(\'toY\',this.value)" style="'+sels+'">'+ltYOpt(state.ltTo.y)+'</select>'
    +'<select onchange="mgSetLtRange(\'toM\',this.value)" style="'+sels+'">'+ltMOpt(state.ltTo.m)+'</select>'
    +'<span style="color:#a9a2b6;font-weight:600">· 최대 6개월</span></div></div>'
    +'<div style="display:flex;gap:14px;margin:8px 0;font-size:11.5px;font-weight:700;color:#7b7488">'
    +'<span><i style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#b7d3f6;margin-right:4px;vertical-align:middle"></i>예약</span>'
    +'<span><i style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#5598e7;margin-right:4px;vertical-align:middle"></i>참석</span>'
    +'<span><i style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#184f95;margin-right:4px;vertical-align:middle"></i>등록</span></div>'
    +mgSvgLt(lt)+'</div>';
  c.innerHTML=html;
}

/* ============================================================================
   전형 현황 — '다음 학기 입학을 목표로 본 레벨테스트'의 결과만 모아 본다.
   예약 → 참석 → 합격 → 대기 → 등록까지. 학기 중간에 보고 바로 등록한 건은 안 들어온다.

   어느 전형인지는 학생이 아니라 '날짜'로 정해진다(lt_exam_days).
   분원이 캘린더에서 그 날짜의 스위치를 켜두면 그날 예약자가 통째로 그 전형이 된다.

   숫자는 전부 예약 데이터에서 세어 나온다 — 참석·노쇼·취소·미통과·등록은
   이미 예약마다 기록돼 있으므로 따로 입력받지 않는다.

   과거 데이터: 예전 코드가 등록 처리 때 wait_semester를 지워버려 '어느 학기 대기였는지'가
   사라진 건이 있다. studentMovements의 memo='레벨테스트 대기→등록'으로 알아내서
   그 학생의 '예약'을 전형으로 잡는다 — 새 행을 만들지 않아야 캘린더 건수와 맞는다.
   ============================================================================ */
function jhRank(id){ const m=String(id||'').match(/sem_(\d+)_(\w+)/); if(!m) return 0; return (+m[1])*10+({spring:1,summer:2,fall:3,winter:4}[m[2]]||0); }
function jhSemId(){ return state.jhSem || nextSemId(state.semId); }
function jhSetSem(v){ state.jhSem=v; render(); }
function jhSemOptions(){
  const ids={};
  (db.semesters||[]).forEach(s=>{ if(s&&s.id) ids[s.id]=1; });
  reservations.forEach(r=>{ if(r.wait_semester) ids[r.wait_semester]=1; });
  (db.studentMovements||[]).forEach(m=>{ if(m.memo==='레벨테스트 대기→등록' && m.semesterId) ids[m.semesterId]=1; });
  examDays.forEach(x=>{ if(x.target_semester) ids[x.target_semester]=1; });
  ids[nextSemId(state.semId)]=1;
  return Object.keys(ids).sort((a,b)=>jhRank(b)-jhRank(a));
}
/* 대상 학기의 직전 학기 = 전형을 치르는 기간.
   2026 가을 입학이면 2026 여름학기(6·7·8월)에 본 시험이 그 전형이다. */
function jhPrevSem(semId){
  const m=String(semId||'').match(/sem_(\d+)_(\w+)/); if(!m) return null;
  let y=+m[1]; const order=['spring','summer','fall','winter']; let i=order.indexOf(m[2]);
  i--; if(i<0){ i=3; y--; }
  return 'sem_'+y+'_'+order[i];
}
/* 전형 기간의 달 목록 ('2026-08' 형태) */
function jhWindow(semId){ const p=jhPrevSem(semId); return p ? semesterYM(p).map(o=>o.ym) : []; }
function jhInWindow(semId, ds){ return jhWindow(semId).indexOf(String(ds||'').slice(0,7))>=0; }
/* 등록한 학생이 반배정까지 끝났는가 —
   등록 처리 때 반을 안 고르면 '미배정'으로 저장된다. 그게 곧 '아직 확정 아님'이다. */
function jhRecOf(r, semId){
  const code=(r.code||'').trim();
  let stu = code ? (db.students||[]).find(x=>x.code===code) : null;
  if(!stu && !code){
    const cand=(db.students||[]).filter(x=>x.name===(r.name||'').trim());
    if(cand.length===1) stu=cand[0];
  }
  if(!stu) return null;
  return (db.semesterRecords||[]).find(x=> x.studentId===stu.id && x.semesterId===semId
    && (x.kind||'regular')!=='exam' && x.status==='active') || null;
}
function jhAssigned(r, semId){ const rec=jhRecOf(r, semId); return !!(rec && rec.className && rec.className!=='미배정'); }
/* 한 명의 최종 상태 */
function jhOutcome(r, semId){
  if(r.status==='canceled')    return 'cancel';
  if(r.status==='noshow')      return 'noshow';
  if(r.status==='parent_only') return 'parent';
  if(r.enrolled==='failed')        return 'fail';
  if(r.enrolled==='waiting_next')  return 'wait';
  if(r.enrolled==='not_enrolled')  return 'notenr';
  if(r.enrolled==='enrolled')      return 'enrolled';
  return 'none';
}
function jhDays(semId){ return examDays.filter(x=> x.is_admission && x.target_semester===semId); }
/* 날짜 → 전형 구분. 설명회로 켠 날만 설명회, 나머지는 전부 개별.
   개별은 따로 켤 게 없다 — 다음학기 대기를 누른 순간 이미 다음 학기 대상이기 때문. */
function jhTrack(branchId, ds, semId){
  const e=examDays.find(x=> x.branch_id===branchId && edDs(x.exam_date)===edDs(ds)
    && x.is_briefing && (!x.target_semester || x.target_semester===semId));
  if(e) return { key:'b'+(e.briefing_no||1), brief:true, label:'설명회 '+(e.briefing_no||1)+'차', date:edDs(e.exam_date) };
  return { key:'ind', brief:false, label:'개별', date:'수시' };
}
/* 설명회를 켠 날은 그날 예약이 통째로 그 학기 전형이다.
   설명회 자체가 '다음 학기 모집' 행사라서 학생별로 다시 켤 이유가 없다.
   그날 온 학생을 '등록 완료'로 처리하면 다음 학기 신규생으로 자동 등록된다. */
function edBriefOn(branchId, ds, semId){
  const e=edGet(branchId, ds);
  return !!(e && e.is_briefing && (!e.target_semester || e.target_semester===semId));
}
/* 전형 대상자 = 전형 기간(직전 학기)의 예약 전부
   + 기간 밖이라도 전형 날짜로 지정됐거나 이 학기 대기로 잡힌 예약
   + 예약이 사라진 과거 등록자(이동 기록으로 복원) */
function jhRows(semId){
  const out=[], seen={};
  const key=(br,code,nm)=> String(br)+'|'+(code?('#'+code):('@'+(nm||'')));
  const mk=(r,via)=>({ branchId:r.branch_id, code:r.student_code||'', name:r.student_name||'',
    school:r.school||'', grade:r.grade||'', date:edDs(r.reserved_date),
    status:r.status||'', enrolled:r.enrolled||'', waitSem:r.wait_semester||'', reason:r.not_enrolled_reason||'',
    via:via });
  const push=o=>{ const k=key(o.branchId,o.code,o.name); if(seen[k]) return; seen[k]=1; out.push(o); };
  // 전형 대상 = 예약에 '다음 학기 입학용'으로 표시했거나, 다음학기 대기를 누른 학생.
  // 같은 날에도 그 학기에 바로 등록하는 학생이 섞이므로 날짜로는 가르지 않는다.
  reservations.forEach(r=>{
    if(edBriefOn(r.branch_id, r.reserved_date, semId)) push(mk(r,'brief'));
    else if(r.admission_semester===semId)              push(mk(r,'btn'));
    else if(r.wait_semester===semId)                   push(mk(r,'wait'));
  });
  // 예전 버전이 등록 처리하면서 대기 기록을 지운 학생 — 이동 기록으로 알아낸다.
  // 새 행을 만들지 않고 '그 학생의 예약'을 전형으로 잡는다. 예약이 아예 없으면 건너뛴다.
  (db.studentMovements||[]).forEach(m=>{
    if(m.memo!=='레벨테스트 대기→등록' || m.semesterId!==semId) return;
    const stu=getStudent(m.studentId)||{};
    if(seen[key(m.branchId, stu.code, stu.name)]) return;
    const cands=reservations.filter(x=> x.branch_id===m.branchId &&
      ((stu.code && x.student_code===stu.code) || (!stu.code && x.student_name===stu.name)));
    if(!cands.length) return;
    const mv=edDs(m.date);
    const before=cands.filter(x=> edDs(x.reserved_date)<=mv).sort((a,b)=> edDs(a.reserved_date)<edDs(b.reserved_date)?1:-1);
    const res=before[0] || cands.sort((a,b)=> edDs(a.reserved_date)<edDs(b.reserved_date)?1:-1)[0];
    push(mk(res,'mv'));
  });
  return out;
}
/* 행 묶음 → 숫자. 전부 예약 기록에서 세어 나온다. */
function jhCount(rs, semId){
  const s={ book:rs.length, att:0, noshow:0, cancel:0, parent:0, fail:0, wait:0, enr:0, notenr:0, enrFix:0, enrOpen:0, enrMiss:0 };
  rs.forEach(r=>{
    if(isAttended(r)) s.att++;
    const o=jhOutcome(r, semId);
    if(o==='noshow') s.noshow++; else if(o==='cancel') s.cancel++; else if(o==='parent') s.parent++;
    else if(o==='fail') s.fail++; else if(o==='wait') s.wait++;
    else if(o==='enrolled'){ s.enr++;
      const rec=jhRecOf(r, semId);
      if(!rec) s.enrMiss++;                                                    // 학기 명단에 아예 없음
      else if(rec.className && rec.className!=='미배정') s.enrFix++;            // 반배정까지 끝남
      else s.enrOpen++;                                                        // 등록은 됐는데 반 미정
    }
    else if(o==='notenr') s.notenr++;
  });
  s.decided = s.wait + s.enr + s.notenr;      // 결과 확정 = 등록·대기·미등록이 정해진 인원
  s.absent  = Math.max(0, s.book - s.att);    // 취소·노쇼·연락 없이 안 온 인원
  s.open    = Math.max(0, s.att - s.fail - s.decided);        // 분원이 결과를 아직 안 넣은 건
  s.rate = s.decided ? Math.round(s.enr/s.decided*100) : null;
  return s;
}
/* 회차 딱지 — 설명회 / 개별 / 날짜 미지정 */
function jhTrackChip(t){
  if(t.kind==='none' || t.key===null) return '<span class="jh-tk none" title="이 학생이 시험 본 날짜가 아직 전형으로 표시되지 않았습니다. 캘린더에서 그 날짜의 스위치를 켜주세요.">날짜 미지정</span>';
  if(t.kind==='ind' || t.key==='ind') return '<span class="jh-tk ind">개별</span>';
  return '<span class="jh-tk brief">'+esc(t.label)+'</span>';
}
/* 전형 현황 표 — 줄 강조·마우스오버는 클래스로 (인라인 배경이 hover를 이기지 않게) */
const JH_CSS='<style>'
+'.jh-card{background:#fff;border:1px solid #ece8f5;border-radius:16px;box-shadow:0 3px 14px rgba(80,70,120,.05);margin-bottom:16px;overflow:hidden}'
+'.jh-hd{padding:16px 20px 13px;border-bottom:1px solid #f3f0fa;display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}'
+'.jh-hd h3{margin:0;font-size:15px;font-weight:800;color:#3a3742}'
+'.jh-hd .why{font-size:12px;color:#a9a2b6;font-weight:600}'
+'.jh-flow{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px;padding:16px 20px 18px}'
+'.jh-step{border-radius:15px;padding:14px 16px 15px;border:1px solid transparent;min-width:0}'
+'.jh-step .k{font-size:12.5px;font-weight:800}'
+'.jh-step .v{font-size:32px;font-weight:800;letter-spacing:-.035em;line-height:1.15;margin-top:1px}'
+'.jh-step .v small{font-size:12.5px;font-weight:800;margin-left:3px;letter-spacing:0;opacity:.62}'
+'.jh-step .sub{margin-top:9px;display:flex;flex-direction:column;gap:2px;font-size:11.5px;font-weight:700}'
+'.jh-step .sub b{font-weight:800}'
+'.jh-step.s1{background:linear-gradient(135deg,#9174ea,#b48bf2);border-color:transparent;color:#fff}'
+'.jh-step.s1 .k{color:rgba(255,255,255,.9)}.jh-step.s1 .v{color:#fff}'
+'.jh-step.s1 .sub{color:rgba(255,255,255,.86)}.jh-step.s1 .sub b{color:#fff}'
+'.jh-step.s2{background:#e9f1fd;border-color:#d7e5fa}'
+'.jh-step.s2 .k{color:#35597f}.jh-step.s2 .v{color:#3f74c4}'
+'.jh-step.s3{background:#f0eafe;border-color:#e2d8fb}'
+'.jh-step.s3 .k{color:#5b41b5}.jh-step.s3 .v{color:#6b4bd6}'
+'.jh-step.s4{background:#fdeaf3;border-color:#f8d8e7}'
+'.jh-step.s4 .k{color:#9c3a63}.jh-step.s4 .v{color:#c9457f}'
+'.jh-step.s5{background:#fff1e6;border-color:#fadfc9}'
+'.jh-step.s5 .k{color:#9a5520}.jh-step.s5 .v{color:#a85f22}'
+'.jh-step .sub{color:#6b6385}.jh-step .sub b{color:#3a3742}'
+'.jh-step.s1 .sub{color:rgba(255,255,255,.86)}'
+'.jh-step .out,.jh-step .out b{color:#96324e}'
+'.jh-step.s1 .out,.jh-step.s1 .out b{color:#ffe3ec}'
+'.jh-conv{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:13px 20px;background:#f4f1fb;border-top:1px solid #ece8f5}'
+'.jh-conv .t{font-size:12.5px;font-weight:800;color:#5b41b5}'
+'.jh-conv .d{font-size:12.5px;color:#7b7488}.jh-conv .d b{font-weight:800;color:#3a3742}'
+'.jh-conv{background:linear-gradient(90deg,#f5f0ff,#fdf1f7)}'
+'.jh-conv .big{margin-left:auto;font-size:22px;font-weight:800;color:#c9457f;letter-spacing:-.02em}'
+'.jh-t{border-collapse:collapse;width:100%;min-width:840px;font-size:13px}'
+'.jh-t .grp th{font-size:10px;font-weight:800;letter-spacing:.12em;color:#c2bcd0;padding:12px 12px 3px;text-align:center;border:0}'
+'.jh-t .grp th.gl{text-align:left}'
+'.jh-t thead tr:last-child th{font-size:11px;font-weight:800;color:#a9a2b6;text-align:right;padding:3px 12px 11px;border-bottom:1.5px solid #e8e3f3;white-space:nowrap}'
+'.jh-t thead tr:last-child th.l{text-align:left}'
+'.jh-t th.sep,.jh-t td.sep{border-left:1px solid #e8e3f3}'
+'.jh-t td{padding:0 12px;height:42px;border-bottom:1px solid #f2eff9;text-align:right;white-space:nowrap;color:#7b7488;font-weight:700}'
+'.jh-t td.l{text-align:left}'
+'.jh-t tbody tr:hover td{background:#faf8fe}'
+'.jh-t tr.sec td{height:32px;background:#f0ebfe;border-bottom:1px solid #e8e3f3;font-size:10.5px;font-weight:800;letter-spacing:.12em;color:#5b41b5;text-align:left}'
+'.jh-t tr.sec:hover td{background:#f0ebfe}'
+'.jh-t tr.br td{font-size:13.5px}'
+'.jh-t tr.br td.l{font-weight:800;color:#3a3742;font-size:14px}'
+'.jh-t tr.br td.k{font-size:15px;font-weight:800;color:#3a3742}'
+'.jh-t tr.br td.k.w{color:#6b4bd6}.jh-t tr.br td.k.e{color:#c9457f}'
+'.jh-t tr.sub td{height:38px;font-size:12px;font-weight:400;color:#a9a2b6}'
+'.jh-t tr.sub td.l{padding-left:36px;position:relative}'
+'.jh-t tr.sub td.l::before{content:"";position:absolute;left:22px;top:-19px;height:38px;width:1px;background:#e8e3f3}'
+'.jh-t tr.sub td.l::after{content:"";position:absolute;left:22px;top:19px;width:7px;height:1px;background:#e8e3f3}'
+'.jh-t tr.sub.last td.l::before{height:19px}'
+'.jh-t tr.sub td.l em{font-style:normal;font-weight:700;color:#7b7488}'
+'.jh-t tr.sub td.l span{color:#c2bcd0;margin-left:7px;font-size:11px}'
+'.jh-t tr.end td{border-bottom:1px solid #e8e3f3}'
+'.jh-t tr.tot td{height:48px;background:#f4f1fb;border-bottom:0;color:#3a3742;font-weight:800;font-size:14px}'
+'.jh-t tr.tot td.k{font-size:16px}.jh-t tr.tot td.k.w{color:#6b4bd6}.jh-t tr.tot td.k.e{color:#c9457f}'
+'.jh-t tr.tot:hover td{background:#f4f1fb}'
+'.jh-t .z{color:#c2bcd0;font-weight:400}'
+'.jh-t .flag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:2px 7px;background:#fdf3e6;color:#c9791f}'
+'.jh-t .miss{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:2px 7px;background:#fdecf1;color:#b03a58}'
+'.jh-tk{display:inline-block;font-size:10.5px;font-weight:800;border-radius:6px;padding:2px 7px;white-space:nowrap}'
+'.jh-tk.brief{background:#f0ebfe;color:#5b41b5}.jh-tk.ind{background:#eaf2fc;color:#2f6cb5}.jh-tk.none{background:#fdf3e6;color:#e2953f}'
+'.jh-none{background:#f3f0fa;color:#a9a2b6;font-size:10.5px;font-weight:800;border-radius:6px;padding:2px 7px}'
+'.jh-l{border-collapse:collapse;width:100%;min-width:780px;font-size:12.5px}'
+'.jh-l th{text-align:left;font-size:11px;font-weight:800;color:#a9a2b6;padding:9px 10px;background:#faf8fe;border-bottom:1px solid #ece8f5;white-space:nowrap}'
+'.jh-l td{padding:9px 10px;border-bottom:1px solid #f3f0fa;white-space:nowrap;color:#7b7488}'
+'.jh-l td.nm{font-weight:800;color:#3a3742}.jh-l td.cd{font-family:monospace;font-size:11px;color:#a9a2b6}'
+'.jh-l td.rs{white-space:normal;color:#a9a2b6}'
+'.jh-l tbody tr:hover td{background:#faf8fe}'
+'.jh-via{display:inline-block;font-size:10.5px;font-weight:800;border-radius:6px;padding:2px 7px;white-space:nowrap;background:#f3f0fa;color:#a9a2b6}'
+'.jh-via.brief{background:#f0ebfe;color:#5b41b5}.jh-via.btn{background:#eaf2fc;color:#2f6cb5}.jh-via.wait{background:#e4f4f5;color:#1f8a95}.jh-via.mv{background:#fdf3e6;color:#e2953f}'
+'</style>';
function jhChip(bg,fg,txt,title){ return '<span'+(title?' title="'+esc(title)+'"':'')+' style="background:'+bg+';color:'+fg+';font-size:11px;font-weight:800;border-radius:6px;padding:2px 8px;white-space:nowrap">'+txt+'</span>'; }
/* 이 학생이 왜 전형 명단에 들어왔는지 — 숫자가 안 맞을 때 바로 짚어낼 수 있게 */
function jhViaChip(v){
  if(v==='brief') return '<span class="jh-via brief" title="이 날은 설명회로 표시돼 있어서 그날 예약이 통째로 전형에 잡힙니다.">설명회 날</span>';
  if(v==='btn')  return '<span class="jh-via btn" title="레벨테스트 캘린더에서 이 예약의 전형 버튼을 켰습니다.">전형 버튼</span>';
  if(v==='wait') return '<span class="jh-via wait" title="이 학생은 다음학기 대기를 눌러 자동으로 전형에 잡혔습니다. 버튼을 따로 켜지 않아도 됩니다.">다음학기 대기</span>';
  if(v==='mv')   return '<span class="jh-via mv" title="예전 버전이 대기 기록을 지운 학생입니다. 학기 이동 기록(대기→등록)으로 찾아 넣었습니다.">이동 기록</span>';
  return '<span class="jh-via">—</span>';
}
function jhStateChip(r, semId){
  const o=jhOutcome(r, semId);
  if(o==='cancel')   return jhChip('#f3f0fa','#a9a2b6','취소');
  if(o==='noshow')   return jhChip('#fdecf1','#e2557a','노쇼');
  if(o==='parent')   return jhChip('#f3f0fa','#7b7488','학부모만');
  if(o==='fail')     return jhChip('#fdecf1','#e2557a','미통과');
  if(o==='enrolled'){
    const rec=jhRecOf(r, semId);
    if(!rec) return jhChip('#fdecf1','#b03a58','명단 누락','레벨테스트에서 바로 등록을 눌러 이 학기 명단에 학생이 없습니다. 예약을 다음학기 대기로 되돌린 뒤, 원무 대기명단에서 다시 등록해 주세요.');
    if(!(rec.className && rec.className!=='미배정')) return jhChip('#fff1e6','#a85f22','반 미정');
    return jhChip('#e6f7f0','#2fa878','등록 확정');
  }
  if(o==='notenr')   return jhChip('#fdf3e6','#e2953f','미등록');
  if(o==='wait')     return jhChip('#e4f4f5','#1f8a95','대기중');
  return jhChip('#f6f3fc','#8b6ee8','결과 미정');
}
function renderJeonhyeongDash(c){
  if(!bookState.loaded){
    c.innerHTML='<div style="padding:44px 0;text-align:center;color:#a9a2b6;font-size:13px">레벨테스트·대기 정보 불러오는 중…</div>';
    ensureReservations().then(()=>{ if(state.view==='dashboard'&&state.dashView==='jh'){ const b=document.getElementById('dashBody'); if(b) renderJeonhyeongDash(b); } });
    return;
  }
  const semId=jhSemId(), semNm=semNameFromId(semId);
  const brs=mgBranchList(), inScope={}; brs.forEach(b=>inScope[b.id]=1);
  const rows=jhRows(semId).filter(r=>inScope[r.branchId]);
  const days=jhDays(semId).filter(x=>inScope[x.branch_id]);
  const briefs=days.filter(x=>x.is_briefing).sort((a,b)=> edDs(a.exam_date)<edDs(b.exam_date)?-1:1);
  const S=jhCount(rows, semId);
  const isBrief=r=> jhTrack(r.branchId,r.date,semId).brief;
  const SB=jhCount(rows.filter(isBrief), semId), SI=jhCount(rows.filter(r=>!isBrief(r)), semId);

  const card='background:#fff;border:1px solid #ece8f5;border-radius:16px;padding:18px 20px;box-shadow:0 3px 14px rgba(80,70,120,.05);margin-bottom:16px';
  const h3s='margin:0 0 2px;font-size:15px;font-weight:800;color:#3a3742';
  const css='font-size:12px;color:#a9a2b6;font-weight:600;margin-bottom:12px';
  const sels='background:#f6f3fc;border:1px solid #e2dcf2;border-radius:8px;padding:5px 8px;font:inherit;font-weight:700;color:#8b6ee8;cursor:pointer';

  let html=JH_CSS;
  html+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;font-size:13px;font-weight:700;color:#7b7488">'
    +'<span>입학 대상 학기</span>'
    +'<select onchange="jhSetSem(this.value)" style="'+sels+'">'
    + jhSemOptions().map(id=>'<option value="'+id+'" '+(id===semId?'selected':'')+'>'+esc(semNameFromId(id))+'</option>').join('')
    +'</select>'
    +(session.role==='admin' ? '<span style="margin-left:8px">분원</span><select onchange="mgSetBranch(this.value)" style="'+sels+'"><option value="all" '+((!state.mgBranch||state.mgBranch==='all')?'selected':'')+'>전체</option>'+(db.branches||[]).map(b=>'<option value="'+b.id+'" '+(state.mgBranch===b.id?'selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>' : '')
    +'</div>';

  /* ---- 위: 예약 → 응시 → 다음학기 대상 → 등록 4단계 ---- */
  const stepH=(cls,k,v,sub)=>'<div class="jh-step '+cls+'"><div class="k">'+k+'</div>'
    +'<div class="v">'+v+'<small>명</small></div>'
    +'<div class="sub">'+sub+'</div></div>';
  const li=(t,n,out)=> n? '<span'+(out?' class="out"':'')+'>'+t+' <b>'+n+'</b></span>' : '';
  html+='<div class="jh-card">'
    +'<div class="jh-hd"><h3>'+esc(semNm)+' 전형</h3>'
    +'<span class="why">이번 학기에 시험 보고 '+esc(semNm)+'에 등록하는 학생만'+(briefs.length?' · 설명회 '+briefs.length+'회':'')+'</span></div>'
    +'<div class="jh-flow">'
    + stepH('s1','예약', S.book, li('설명회',SB.book)+li('개별',SI.book))
    + stepH('s2','응시', S.att,
        '<span class="out">'+[['취소',S.cancel],['노쇼',S.noshow],['학부모만',S.parent],
          ['불참',Math.max(0,S.absent-S.cancel-S.noshow-S.parent)]]
          .filter(x=>x[1]).map(x=>x[0]+' <b>'+x[1]+'</b>').join(' · ')+'</span>'
        +li('미등록',S.notenr,1)
        +(S.book?'<span>응시율 <b>'+Math.round(S.att/S.book*100)+'%</b></span>':''))
    + stepH('s3','결과 확정', S.decided, li('미통과',S.fail,1)+li('결과 미입력',S.open,1))
    + stepH('s4','등록 확정', S.enrFix, (S.enrOpen?'<span>반 미정 <b>'+S.enrOpen+'</b></span>':'')
        +li('명단 누락',S.enrMiss,1)+'<span>등록 처리 '+S.enr+'명</span>')
    + stepH('s5','대기 중', S.wait, '<span>결제·연락 필요</span>'+li('미등록',S.notenr,1))
    +'</div>'
    +'<div class="jh-conv"><span class="t">등록 전환</span>'
      +'<span class="d">결과 확정 <b>'+S.decided+'명</b> 중 <b>'+S.enr+'명</b> 등록'
      +(S.enrOpen?' (반배정 완료 '+S.enrFix+' · 반 미정 '+S.enrOpen+')':'')
      +(S.wait?' · <b>'+S.wait+'명</b> 아직 연락 대상':'')+'</span>'
      +'<span class="big">'+(S.rate==null?'—':S.rate+'%')+'</span></div></div>';

  /* ---- 분원별 ----
     설명회를 한 분원을 먼저 묶고, 개별전형만 한 분원은 아래로 내린다.
     설명회 분원은 회차 줄 + 개별 줄을 항상 그려서 줄 수가 들쭉날쭉하지 않게 한다. */
  const byBr={}; brs.forEach(b=>byBr[b.id]=[]);
  briefs.forEach(x=>{ if(byBr[x.branch_id]) byBr[x.branch_id].push(x); });
  const z=n=>n?n:'<span class="z">·</span>';
  const cells=(s2,big)=>
     '<td class="sep'+(big?' k':'')+'">'+z(s2.book)+'</td><td>'+z(s2.att)+'</td>'
    +'<td>'+z(s2.absent)+'</td><td>'+z(s2.fail)+'</td>'
    +'<td class="sep'+(big?' k w':'')+'">'+z(s2.decided)+'</td>'
    +'<td'+(big?' class="k e"':'')+'>'+z(s2.enrFix)+'</td><td>'+z(s2.enrOpen)+'</td>'
    +'<td>'+(s2.enrMiss?'<span class="miss">'+s2.enrMiss+'</span>':'<span class="z">·</span>')+'</td>'
    +'<td>'+z(s2.wait)+'</td><td>'+z(s2.notenr)+'</td>'
    +'<td class="sep">'+(s2.rate==null?'<span class="z">—</span>':s2.rate+'%')+'</td>'
    +'<td>'+(s2.open?'<span class="flag">'+s2.open+'</span>':'<span class="z">·</span>')+'</td>';
  const brData=b=>{
    const rs=rows.filter(r=>r.branchId===b.id), bl=(byBr[b.id]||[]);
    return { b:b, rs:rs, bl:bl, t:jhCount(rs, semId) };
  };
  const all=brs.map(brData).filter(x=> x.rs.length || x.bl.length);
  const byRate=(a,b)=> (b.t.rate==null?-1:b.t.rate)-(a.t.rate==null?-1:a.t.rate) || b.t.book-a.t.book;
  const withBrief=all.filter(x=>x.bl.length).sort(byRate);
  const onlyInd =all.filter(x=>!x.bl.length).sort(byRate);
  html+='<div class="jh-card"><div class="jh-hd"><h3>분원별</h3>'
    +'<span class="why">왼쪽에서 오른쪽으로 읽으면 학생이 어디까지 왔는지 보입니다</span></div>'
    +'<div style="overflow-x:auto"><table class="jh-t"><thead>'
    +'<tr class="grp"><th class="gl">&nbsp;</th><th class="sep" colspan="4">응 시</th>'
    +'<th class="sep" colspan="6">전형 결과</th><th class="sep" colspan="2">&nbsp;</th></tr>'
    +'<tr><th class="l">분원 / 회차</th>'
    +'<th class="sep">예약</th><th>응시</th><th title="취소·노쇼·연락 없이 안 온 인원">불참</th><th>미통과</th>'
    +'<th class="sep" title="등록·대기·미등록이 정해진 인원. 미통과와 결과 미입력은 빠집니다.">확정</th>'
    +'<th title="반배정까지 끝난 학생">등록</th><th title="등록 처리는 했는데 반이 아직 미배정인 학생">반 미정</th>'
    +'<th title="레벨테스트에서 바로 등록을 눌러 학기 명단에 아예 없는 학생 — 대기로 되돌린 뒤 대기명단에서 다시 등록해야 합니다">누락</th>'
    +'<th>대기</th><th>미등록</th>'
    +'<th class="sep">전환</th><th title="분원이 아직 결과를 넣지 않은 예약">미입력</th></tr>'
    +'</thead><tbody>';
  const sec=t=>'<tr class="sec"><td colspan="13">'+t+'</td></tr>';
  const trackRows=x=>{
    const md=d=>edDs(d).slice(5).replace('-','.');
    const ts=x.bl.map(e=>({key:'b'+(e.briefing_no||1), label:'설명회 '+(e.briefing_no||1)+'차', date:md(e.exam_date)}))
      .concat([{key:'ind', label:'개별', date:'수시'}]);
    return ts.map((t,i2)=>{
      const rs=x.rs.filter(r=> jhTrack(r.branchId,r.date,semId).key===t.key);
      return '<tr class="sub'+(i2===ts.length-1?' last end':'')+'">'
        +'<td class="l"><em>'+esc(t.label)+'</em><span>'+esc(t.date)+'</span></td>'
        +cells(jhCount(rs, semId))+'</tr>';
    }).join('');
  };
  if(withBrief.length) html+=sec('설명회 진행')
    + withBrief.map(x=>'<tr class="br"><td class="l">'+esc(x.b.name)+'</td>'+cells(x.t,1)+'</tr>'+trackRows(x)).join('');
  if(onlyInd.length) html+=sec('개별전형만')
    + onlyInd.map(x=>'<tr class="br end"><td class="l">'+esc(x.b.name)+'</td>'+cells(x.t,1)+'</tr>').join('');
  if(!all.length) html+='<tr><td colspan="13" style="text-align:center;color:#a9a2b6;font-weight:400;height:60px">'
    +esc(semNm)+' 전형으로 잡힌 학생이 아직 없습니다.</td></tr>';
  html+='<tr class="tot"><td class="l">합계</td>'+cells(S,1)+'</tr>';
  html+='</tbody></table></div>';
  if(!briefs.length) html+='<div style="padding:12px 20px 16px;font-size:12px;color:#a9a2b6;line-height:1.65">'
    +'이 학기에 표시된 설명회가 없어 응시자가 전부 <b>개별</b>로 잡혔습니다. 설명회를 진행한 날이 있다면 '
    +'분원 계정에서 그 날짜를 열어 <b>설명회 진행</b>을 켜주세요.</div>';
  html+='</div>';

  /* ---- 명단 ---- */
  html+='<div style="'+card+'"><h3 style="'+h3s+'">학생 명단</h3><div style="'+css+'">'+rows.length+'명</div>';
  if(!rows.length){
    html+='<div style="padding:26px 0;text-align:center;color:#a9a2b6;font-size:13px">'
      +esc(semNm)+' 전형으로 잡힌 학생이 아직 없습니다.<br>'
      +'<span style="font-size:12px">레벨테스트 캘린더에서 시험 날짜에 <b>다음 학기 전형</b>을 켜주세요.</span></div>';
  } else {
    const ord=r=> r.enrolled==='waiting_next'?0 : r.enrolled==='not_enrolled'?1 : r.enrolled==='enrolled'?2
              : r.enrolled==='failed'?3 : (r.status==='noshow'||r.status==='canceled')?5 : 4;
    const sorted=rows.slice().sort((a,b)=> (ord(a)-ord(b)) || String(a.name).localeCompare(String(b.name),'ko'));
    html+='<div style="overflow-x:auto"><table class="jh-l"><thead><tr>'
      +['학생','회원코드','분원','전형','포함 이유','학교 / 학년','시험일','상태','비고'].map(t=>'<th>'+t+'</th>').join('')
      +'</tr></thead><tbody>';
    sorted.forEach(r=>{
      const sg=[r.school,gradeTxt(r.grade)].filter(Boolean).join(' · ');
      const tk=jhTrack(r.branchId,r.date,semId);
      const tkHtml = jhTrackChip({key:tk.key, kind:(tk.brief?'brief':'ind'), label:tk.label});
      html+='<tr>'
        +'<td class="nm">'+esc(r.name||'?')+'</td>'
        +'<td class="cd">'+esc(r.code||'—')+'</td>'
        +'<td>'+esc(bName(r.branchId))+'</td>'
        +'<td>'+tkHtml+'</td>'
        +'<td>'+jhViaChip(r.via)+'</td>'
        +'<td>'+esc(sg||'—')+'</td>'
        +'<td>'+esc(r.date||'—')+'</td>'
        +'<td>'+jhStateChip(r, semId)+'</td>'
        +'<td class="rs">'+esc(r.reason||'')+'</td></tr>';
    });
    html+='</tbody></table></div>';
  }
  html+='</div>';
  c.innerHTML=html;
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

/* ── 전출입 매칭 현황 (학기를 넘나드는 이동도 회원코드로 짝지어 한 화면에 · 어드민 전용) ── */
function _xrSemShort(id){ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return String(id); const yy=String(m[1]).slice(2); const s={spring:'봄',summer:'여름',fall:'가을',winter:'겨울'}[m[2]]||m[2]; return yy+s; }
function _xrMd(d){ const m=String(d||'').match(/\d{4}-(\d{1,2})-(\d{1,2})/); return m?(parseInt(m[1],10)+'/'+parseInt(m[2],10)):''; }
function xferReconMoves(){
  const outs={}, ins={};
  (db.semesterRecords||[]).forEach(r=>{
    const st=getStudent(r.studentId); const code=st&&st.code?st.code:null; if(!code) return;
    if(r.transfer && r.transferTo){ const k=code+'|'+r.branchId+'|'+r.transferTo; if(!outs[k]) outs[k]={code,name:st.name,from:r.branchId,to:r.transferTo,sem:r.semesterId,date:r.withdrawDate}; }
    if(r.transferIn && r.transferTo){ const k=code+'|'+r.transferTo+'|'+r.branchId; if(!ins[k]) ins[k]={code,name:st.name,from:r.transferTo,to:r.branchId,sem:r.semesterId,date:r.enrollDate}; }
  });
  const keys=Object.keys(outs).concat(Object.keys(ins).filter(k=>!outs[k]));
  const moves=keys.map(k=>({o:outs[k]||null,i:ins[k]||null}));
  moves.sort((a,b)=>{ const ma=(a.o&&a.i)?1:0, mb=(b.o&&b.i)?1:0; if(ma!==mb) return ma-mb;  // 미매칭 먼저
    const na=(a.o||a.i).name, nb=(b.o||b.i).name; return String(na).localeCompare(String(nb),'ko'); });
  return moves;
}
function xferReconBox(){
  if(session.role!=='admin') return '';
  const moves=xferReconMoves(); if(!moves.length) return '';
  const matched=moves.filter(m=>m.o&&m.i).length, mismatch=moves.length-matched;
  const bn=id=>{ const n=bName(id); return String(n).replace(/분원$/,'')||'?'; };
  const cell=(o,isOut)=>{ if(!o) return '<span style="color:#b7791f;font-weight:800;font-size:12px">— 없음</span>';
    const bg=isOut?'#fdeef0':'#eef2fb', fg=isOut?'#b5405a':'#3a5a86';
    return '<span style="display:inline-flex;align-items:center;gap:7px"><span style="background:'+bg+';color:'+fg+';border-radius:6px;padding:2px 8px;font-size:11.5px;font-weight:800">'+esc(bn(o.from))+'→'+esc(bn(o.to))+'</span><span style="font-size:11px;color:#9a93b0;font-weight:700">'+esc(_xrSemShort(o.sem))+' '+esc(_xrMd(o.date))+'</span></span>'; };
  const rows=moves.map(m=>{ const ok=m.o&&m.i; const who=m.o||m.i;
    const stt = ok?'<span style="background:#e8f6ec;color:#0ca30c;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:20px">✓ 짝맞음</span>'
      :'<span style="background:#fff3d6;color:#b7791f;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:20px">⚠ '+(m.i?'전출 없음':'전입 없음')+'</span>';
    return '<tr style="'+(ok?'':'background:#fffaf0')+'">'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa"><b>'+esc(who.name)+'</b> <span style="font-size:10.5px;color:#9a93b0;font-family:monospace">'+esc(who.code)+'</span></td>'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa">'+cell(m.o,true)+'</td>'
      +'<td style="padding:9px 4px;border-bottom:1px solid #f4f1fa;color:#9a93b0">→</td>'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa">'+cell(m.i,false)+'</td>'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa;text-align:right">'+stt+'</td></tr>';
  }).join('');
  return '<style>details.xrecon>summary::-webkit-details-marker{display:none}</style>'
    +'<details class="xrecon" style="margin:0 0 16px;border:1px solid #ece8f5;border-radius:14px;background:#fff;overflow:hidden">'
    +'<summary style="list-style:none;cursor:pointer;padding:13px 16px;display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:800;color:#2f3138">'
    +'<span>전출입 매칭 현황</span>'
    +'<span style="font-size:12px;font-weight:700;color:#6b6385">전출 '+moves.filter(m=>m.o).length+' · 전입 '+moves.filter(m=>m.i).length+' · 짝맞음 '+matched+'</span>'
    +(mismatch>0?'<span style="font-size:12px;font-weight:800;color:#e5484d;background:#fdecec;padding:2px 10px;border-radius:20px">⚠ 미매칭 '+mismatch+'</span>':'<span style="font-size:12px;font-weight:800;color:#0ca30c">✓ 모두 매칭</span>')
    +'<span style="margin-left:auto;font-size:11.5px;color:#9a93b0;font-weight:700">펼치기 ▾</span>'
    +'</summary>'
    +'<div style="max-height:440px;overflow:auto;border-top:1px solid #ece8f5">'
    +'<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr>'
    +'<th style="text-align:left;padding:9px 12px;font-size:11px;color:#9a93b0;font-weight:700;position:sticky;top:0;background:#faf8fe">학생</th>'
    +'<th style="text-align:left;padding:9px 12px;font-size:11px;color:#9a93b0;font-weight:700;position:sticky;top:0;background:#faf8fe">전출(나간 곳)</th>'
    +'<th style="position:sticky;top:0;background:#faf8fe"></th>'
    +'<th style="text-align:left;padding:9px 12px;font-size:11px;color:#9a93b0;font-weight:700;position:sticky;top:0;background:#faf8fe">전입(들어간 곳)</th>'
    +'<th style="text-align:right;padding:9px 12px;font-size:11px;color:#9a93b0;font-weight:700;position:sticky;top:0;background:#faf8fe">상태</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'</details>';
}

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
    // 기준(학기초 or 그 달 시작) 인원 레코드 — 월 선택 시에도 CHESS/ACE 세도록 실제 레코드로 계산
    let startRecs;
    if(whole){ startRecs = recs.filter(r=>enrollMonth(r)==null); }
    else {
      const prior = months.slice(0, mi);   // 그 달보다 앞선 달들
      startRecs = recs.filter(r=>{
        const em=enrollMonth(r);
        const enrolledByStart = (em==null) || prior.includes(em);   // 학기초부터 or 이전 달 입학
        if(!enrolledByStart) return false;
        const wm=withdrawMonth(r);
        return !(wm!=null && prior.includes(wm));                   // 이전 달에 이미 나간 학생 제외
      });
    }
    // 학기 전체: 원무(인원현황)와 동일하게 origin·상태 기준 집계(입학일/퇴원일 날짜 오류에 영향 안 받음). 월별: 날짜 기준 유지.
    const nwRecs = whole ? recs.filter(r=>(r.origin==='new'||r.origin==='return')&&!r.transferIn)
                         : recs.filter(r=>scope(enrollMonth(r))&&!r.transferIn);
    const tiRecs = whole ? recs.filter(r=>r.transferIn)
                         : recs.filter(r=>scope(enrollMonth(r))&&r.transferIn);
    const wdRecs = whole ? recs.filter(r=>!r.transfer&&(r.status==='withdraw'||(r.status==='active'&&r.withdrawDate)))
                         : recs.filter(r=>scope(withdrawMonth(r))&&!r.transfer);
    const trRecs = whole ? recs.filter(r=>r.status==='withdraw'&&r.transfer)
                         : recs.filter(r=>scope(withdrawMonth(r))&&r.transfer);
    const actRecs = recs.filter(r=>r.status==='active');
    // 학기 전체 학기초 = 재원+퇴원+전출−신규−전입 (원무와 동일 공식, 항상 재원과 정합). 월별은 기존 날짜기준(startRecs) 유지.
    const baseNum = whole ? (actRecs.length + wdRecs.length + trRecs.length - nwRecs.length - tiRecs.length) : startRecs.length;
    return {b, mc, startRecs, nwRecs, tiRecs, wdRecs, trRecs, actRecs, baseNum};
  });
  const flat=(g)=>{ const a=[]; data.forEach(d=>a.push(...g(d))); return a; };
  const caNew=countCA(flat(d=>d.nwRecs)), caTi=countCA(flat(d=>d.tiRecs)), caWd=countCA(flat(d=>d.wdRecs)), caTr=countCA(flat(d=>d.trRecs)), caAct=countCA(flat(d=>d.actRecs));
  // 학기초 CHESS/ACE도 같은 공식(학기 전체) → 카드/표가 재원과 정합. 월별은 날짜기준 유지.
  const caStart = whole
    ? { chess: caAct.chess+caWd.chess+caTr.chess-caNew.chess-caTi.chess,
        ace:   caAct.ace  +caWd.ace  +caTr.ace  -caNew.ace  -caTi.ace,
        total: caAct.total+caWd.total+caTr.total-caNew.total-caTi.total }
    : countCA(flat(d=>d.startRecs));
  const baseTot=caStart.total;
  const sumRate=(baseTot+caNew.total+caTi.total)>0 ? caWd.total/(baseTot+caNew.total+caTi.total)*100 : 0;
  const net=caNew.total+caTi.total-caWd.total-caTr.total;
  const best = data.length? Math.min(...data.map(d=>{ const b2=d.baseNum, nw=d.nwRecs.length, ti=d.tiRecs.length, wd=d.wdRecs.length; return (b2+nw+ti)>0?wd/(b2+nw+ti)*100:0; })) : 0;
  const baseLabel = whole ? '학기초' : '전월마감';

  const title = session.role==='admin' ? '전 분원 인원 현황' : `${(db.branches.find(b=>b.id===session.branchId)||{}).name||'분원'} 인원 현황`;
  const periodTxt = whole ? '학기 전체' : `${months[mi]}월`;
  let h=`<div class="page-h"><div><h2><span class="h-ic">${icon('clip',24)}</span><span class="em">${title}</span></h2><p>${esc(semNm)} · ${periodTxt} 기준</p></div>
    <div class="pick"><span>기간</span><select onchange="state.dashMonthIdx=+this.value;render()">
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

  // 전출입 매칭 현황 (어드민 전용, 접이식) — 분원별 표 위
  h+= xferReconBox();

  // 표
  h+=`<div class="twrap"><div class="tw-h"><div class="t">분원별 인원 현황 (${periodTxt})</div>
    <div class="leg"><span><span class="dot" style="background:var(--pos)"></span>신입·전입</span><span><span class="dot" style="background:var(--neg)"></span>퇴원·전출</span><span><span class="dot" style="background:#c24a4a"></span>CHESS</span><span><span class="dot" style="background:#356fb2"></span>ACE</span></div></div>
    <div class="scroll"><table class="grid"><thead>
    <tr class="sub"><th class="col-b">분원</th><th>${baseLabel}</th><th class="sep-l">신입</th><th>전입</th><th>퇴원</th><th>전출</th><th class="col-now">현재 재원</th><th class="col-rate">퇴원율</th><th class="col-note">비고</th></tr>
    </thead><tbody>`;
  data.forEach(d=>{
    const b2=d.baseNum, nw=d.nwRecs.length, ti=d.tiRecs.length, wd=d.wdRecs.length, tr=d.trRecs.length;
    const rate=(b2+nw+ti)>0?wd/(b2+nw+ti)*100:0; const isBest=rate===best&&data.length>1;
    const ca=countCA(d.actRecs);
    const notes=[];
    d.tiRecs.forEach(r=>notes.push(`<span class="n-in">↘ 전입 ${esc(sName(r))}${r.transferTo?' ←'+esc(bName(r.transferTo)):''}</span>`));
    d.trRecs.forEach(r=>notes.push(`<span class="n-out">↗ 전출 ${esc(sName(r))}${r.transferTo?'→'+esc(bName(r.transferTo)):''}</span>`));
    h+=`<tr><td class="col-b">${esc(d.b.name)}</td><td class="num">${b2}</td>
      <td class="num in sep-l">${nw?'+'+nw:'·'}</td><td class="num jin">${ti?'+'+ti:'·'}</td>
      <td class="num out">${wd?'-'+wd:'·'}</td><td class="num out">${tr?'-'+tr:'·'}</td>
      <td class="col-now"><div class="now-wrap"><span class="now-num num">${ca.total}</span><span class="now-ca"><span class="ca-chess">CHESS ${ca.chess}</span><span class="ca-ace">ACE ${ca.ace}</span></span></div></td>
      <td class="col-rate"><span class="rate ${rateCls(rate)} ${isBest?'best':''}">${rate.toFixed(1)}%</span></td>
      <td class="col-note">${notes.length?notes.join(''):'<span class="mut">·</span>'}</td></tr>`;
  });
  if(data.length>1){   // 분원이 여러 개(=어드민)일 때만 합계 행 표시. 분원 계정은 자기 한 줄뿐이라 합계 불필요
  h+=`<tr class="sum"><td class="col-b">합계</td><td class="num">${fmt(baseTot)}</td>
    <td class="num sep-l">+${caNew.total}</td><td class="num">${caTi.total?'+'+caTi.total:'·'}</td><td class="num">-${caWd.total}</td><td class="num">${caTr.total?'-'+caTr.total:'·'}</td>
    <td class="col-now"><div class="now-wrap"><span class="now-num num">${fmt(caAct.total)}</span><span class="now-ca"><span class="ca-chess">CHESS ${caAct.chess}</span><span class="ca-ace">ACE ${caAct.ace}</span></span></div></td>
    <td class="col-rate"><span class="rate ${rateCls(sumRate)}">${sumRate.toFixed(1)}%</span></td><td class="col-note"></td></tr>`;
  }
  h+='</tbody></table></div></div>';

  // 월별 상세 — 월 카드 (위 KPI줄과 리듬 맞춤, 폭은 위 표와 동일하게 꽉 참)
  const trend=months.map((m,i)=>{ let ins=0,outs=0; data.forEach(d=>{const cc=d.mc.cells[i];ins+=cc.newThis+cc.transferIn;outs+=cc.withdraw+cc.transfer;}); return {m,ins,outs}; });
  h+=`<div class="mtitle">학기 월별 상세 <span>신규 · 퇴원 · 순증감</span></div><div class="mcards">`;
  trend.forEach(t=>{ const nn=t.ins-t.outs; const nnTxt=nn>0?'순증 +'+nn:(nn<0?'순증 '+nn:'순증 0');
    h+=`<div class="mcard"><div class="mc-top"><span class="mm">${t.m}월</span><span class="net ${nn>0?'pos':nn<0?'neg':'zero'}">${nnTxt}</span></div>
      <div class="mc-body">
        <div class="mi"><span class="l">신규</span><span class="v ${t.ins?'in':'mut'}">${t.ins?'+'+t.ins:'·'}</span></div>
        <div class="mi"><span class="l">퇴원</span><span class="v ${t.outs?'out':'mut'}">${t.outs?'-'+t.outs:'·'}</span></div>
      </div></div>`; });
  h+='</div>';
  c.innerHTML=h;
}

/* ---------- 대시보드: 레벨테스트 퍼널 (예약→참석→등록, 분원별·월별) ---------- */
function ltMetrics(recs){
  let booked=recs.length, attended=0, enrolled=0, notEnr=0, failed=0, waitNext=0, noshow=0, canceled=0, parentOnly=0;
  recs.forEach(r=>{
    const en=r.enrolled, st=r.status;
    if(st==='canceled') canceled++;
    else if(st==='noshow') noshow++;
    else if(st==='parent_only') parentOnly++;   // 학부모만 참석 — 시험 안 봤으니 응시/합격 아님
    // 시험을 본 상태(참석): 학부모만참석은 제외. attended 또는 등록/미등록/미통과/다음학기대기 판정이 있으면 참석
    if(st!=='parent_only' && (st==='attended' || en==='enrolled' || en==='not_enrolled' || en==='failed' || en==='waiting_next')) attended++;
    if(en==='enrolled' && st!=='parent_only') enrolled++;
    if(en==='not_enrolled' && st!=='parent_only') notEnr++;
    if(en==='failed' && st!=='parent_only') failed++;   // 미통과: 성적 미달로 등록 불가
    if(en==='waiting_next' && st!=='parent_only') waitNext++;  // 다음학기 대기
  });
  return {booked,attended,enrolled,notEnr,failed,waitNext,noshow,canceled,parentOnly};
}
/* 미통과는 "우리가 등록시킬 수 없는" 인원이라 등록률·전환율 분모에서 제외.
   대신 미통과율은 별도 지표로 표시. */
function ltRates(m){
  const convBase = Math.max(0, m.attended - m.failed);   // 전환 모수 = 참석 − 미통과 (시험 통과자)
  const bookBase = Math.max(0, m.booked   - m.failed);   // 예약 기준에서도 미통과 제외
  return {
    att:  m.booked   ? m.attended/m.booked*100   : 0,    // 참석률 (미통과도 시험은 봤으니 포함)
    conv: convBase   ? m.enrolled/convBase*100   : 0,    // 전환율 (참석 기준, 미통과 제외)
    enr:  bookBase   ? m.enrolled/bookBase*100   : 0,    // 등록률 (예약 기준, 미통과 제외)
    fail: m.attended ? m.failed/m.attended*100   : 0,    // 미통과율 (참석 기준)
    convBase, bookBase
  };
}
function goodRate(r){ return r>=60?'lo':r>=40?'mid':'hi'; }
function enrRateCls(r){ return r>=50?'lo':r>=30?'mid':'hi'; }

/* ============================================================================
   원무 모듈 — 레벨테스트 예약 (Supabase: level_test_reservations)
   ============================================================================ */
let reservations=[];
let bookState={ y:null, m:null, sel:null, branchId:null, loaded:false, adding:false, editId:null };
let wonmuState={ view:'hub', ltPeriod:-1, ltFilter:'all', ltListBranch:'all', ltPage:1, delLogOpen:false, ltSearch:'', ltGrade:'all', ltTab:'status', anBranch:'all', anType:'all', anPeriod:-1, anGrade:'all', anExamPage:0, anLevelPage:0, anListPage:0, inSort:'active', inOpenBr:null };
function anPager(page,total,per,fn){ const pages=Math.ceil(total/per); if(pages<=1) return ''; let pg=Math.min(Math.max(0,page),pages-1);
  return `<div class="an-pager"><button onclick="${fn}(-1)" ${pg<=0?'disabled':''}>‹</button><span>${pg+1} / ${pages}</span><button onclick="${fn}(1)" ${pg>=pages-1?'disabled':''}>›</button></div>`; }
function gradeSort(a,b){ const o=['초등1','초등2','초등3','초등4','초등5','초등6','중등1','중등2','중등3','고등1','고등2','고등3']; const ia=o.indexOf(a),ib=o.indexOf(b); return (ia<0?99:ia)-(ib<0?99:ib)||String(a).localeCompare(String(b)); }
const _pad=n=>String(n).padStart(2,'0');
const IC_CAL='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>';
const IC_ROSTER='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/></svg>';

function renderWonmu(c){ c.innerHTML='<div class="wscope" id="wonmuBody"></div>'; renderWonmuBody(); }
function wonmuGo(v){ wonmuState.view=v; renderWonmuBody(); window.scrollTo(0,0); }
function renderWonmuBody(){
  const body=$('wonmuBody'); if(!body) return;
  const v=wonmuState.view, cr=$('crumbs');
  const home='<span class="cl" onclick="wonmuGo(\'hub\')">원무</span>';
  if(v==='leveltest'){ if(cr) cr.innerHTML=`${home} › <b>레벨테스트</b>`; renderLtDetail(body); }
  else if(v==='inwon'){ if(cr) cr.innerHTML=`${home} › <b>인원현황</b>`; renderInwon(body); }
  else if(v==='booking'){ if(cr) cr.innerHTML=`${home} › <span class="cl" onclick="wonmuGo('leveltest')">레벨테스트</span> › <b>예약 입력</b>`; body.innerHTML='<div class="lt-back" onclick="wonmuGo(\'leveltest\')">‹ 레벨테스트로</div><div id="bkInner"></div>'; renderBooking($('bkInner')); }
  else if(v==='exam'){ if(cr) cr.innerHTML='<b>원무</b>'; wonmuState.view='hub'; renderWonmuHub(body); openExam(); }
  else { if(cr) cr.innerHTML='<b>원무</b>'; renderWonmuHub(body); }
}

/* ---------- 원무 홈(허브): 레벨테스트 / 인원현황 두 카드 ---------- */
function branchHeadcount(bid){
  const recs=recordsOf(bid,state.semId);
  return {
    active: recs.filter(r=>r.status==='active').length,
    nw: recs.filter(r=>enrollMonth(r)!=null && !r.transferIn).length,
    wd: recs.filter(r=>withdrawMonth(r)!=null && !r.transfer).length,
  };
}
function ltBarRow(name, m, maxBooked){
  const w=(n)=> maxBooked>0 ? Math.max(n>0?4:0, n/maxBooked*100) : 0;
  const R=ltRates(m);
  return `<div class="frow"><div class="fr-nm">${esc(name)}</div>
    <div class="track">
      <div class="seg s0" style="width:${w(m.booked)}%">${m.booked?`<span class="cnt">${m.booked}</span>`:''}</div>
      <div class="seg s1" style="width:${w(m.attended)}%">${m.attended?`<span class="cnt">${m.attended}</span>`:''}</div>
      <div class="seg s2" style="width:${w(m.enrolled)}%">${m.enrolled?`<span class="cnt">${m.enrolled}</span>`:''}</div>
    </div>
    <div class="fr-pct"><div class="p1">참석률 ${m.booked?R.att.toFixed(0):0}%</div><div class="p2">등록률 ${m.booked?R.enr.toFixed(0):0}%</div></div></div>`;
}
/* 다음학기 대기 알림 배너 — 현재 학기가 대기 대상 학기와 같아지면 연락 대상으로 표시 */
const IC_BELL='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
let waitOpen=false;
function toggleWait(){ waitOpen=!waitOpen; renderWonmuBody(); }
/* 다음학기 대기명단 — 분원 계정 전용(본사관리자·직원 미표시). 접이식(제목만 → 펼치기). 등록/미등록 버튼. */
function waitAlertBanner(){
  if(session.role!=='branch') return '';   // 어드민(본사관리자)·직원 등은 안 보임
  // 이 분원의 '다음학기 대기' 학생 전부 표시. wait_semester 비어있어도 포함(→ 다음 학기 기본).
  const due=reservations.filter(r=> r.enrolled==='waiting_next' && r.branch_id===session.branchId);
  if(!due.length) return '';
  const head=`<div class="wa-head" style="cursor:pointer" onclick="toggleWait()">
    <span class="wa-ic">${IC_BELL}</span>
    <span class="wa-t">다음학기 대기명단 <b>${due.length}명</b></span>
    <span class="wa-hint">‘다음학기 대기’로 잡아둔 학생들이에요 · 펼쳐서 등록/미등록 처리</span>
    <span style="margin-left:auto;font-weight:800;color:#1f8a95">${waitOpen?'접기 ▲':'펼치기 ▼'}</span>
  </div>`;
  if(!waitOpen) return `<div class="wait-alert">${head}</div>`;
  const rows=due.sort((a,b)=>String(a.student_name||'').localeCompare(String(b.student_name||''))).map(r=>{
    const wsem=r.wait_semester||nextSemId();
    const meta=[semNameFromId(wsem), r.school, gradeTxt(r.grade)].filter(Boolean).join(' · ');
    return `<div class="wa-item" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span class="wa-nm">${esc(r.student_name||'')}</span>
      <span class="wa-meta">${esc(meta)}</span>
      ${r.parent_phone?`<span class="wa-ph">${esc(r.parent_phone)}</span>`:''}
      <span style="flex:1"></span>
      <button class="btn-sm" style="border:1px solid #1f8a95;color:#fff;background:#1f8a95;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer" onclick="waitRegisterOpen('${r.id}')">${esc(seasonWord(wsem))} 등록</button>
      <button class="btn-sm" style="border:1px solid #d99;color:#c0504d;background:#fff;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer" onclick="waitNotEnrolledOpen('${r.id}')">미등록</button>
    </div>`;
  }).join('');
  return `<div class="wait-alert">${head}<div class="wa-list">${rows}${waitDoneListHTML()}</div></div>`;
}
/* 이번에 '대기→등록'한 학생 목록 (취소 가능) */
function waitDoneListHTML(){
  const done=(db.studentMovements||[]).filter(m=> m.memo==='레벨테스트 대기→등록' && m.branchId===session.branchId);
  if(!done.length) return '';
  const items=done.map(m=>{
    const s=(db.students||[]).find(x=>x.id===m.studentId)||{};
    return `<div class="wa-item" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span class="wa-nm">${esc(s.name||'?')}</span>
      <span class="wa-meta">${esc(semNameFromId(m.semesterId))} · 대기→등록됨</span>
      <span style="flex:1"></span>
      <button class="btn-sm" style="border:1px solid #c99;color:#a55;background:#fff;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer" onclick="waitCancelOpen('${m.studentId}')">등록 취소</button>
    </div>`;
  }).join('');
  return `<div style="margin-top:12px;border-top:1px dashed #cfd3e0;padding-top:10px">
    <div style="font-size:12px;font-weight:800;color:#778;margin-bottom:6px">이번에 대기→등록한 학생 (취소 가능)</div>${items}</div>`;
}
function waitCancelOpen(studentId){
  const s=(db.students||[]).find(x=>x.id===studentId)||{};
  waitModalOpen(`
    <div style="font-weight:800;font-size:16px;margin-bottom:6px">등록 취소</div>
    <div style="font-size:13px;color:#667;line-height:1.6;margin-bottom:16px"><b>${esc(s.name||'')}</b> 학생의 이번 등록을 취소합니다.<br>등록한 반(미배정 등)에서 빠지고, 레벨테스트에서 <b>다시 ‘다음학기 대기’</b>로 돌아갑니다.</div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn-sm" style="border:1px solid #dcdce6;background:#fff;border-radius:9px;padding:8px 14px;cursor:pointer" onclick="waitModalClose()">닫기</button>
      <button class="btn-sm" style="border:1px solid #a55;background:#a55;color:#fff;border-radius:9px;padding:8px 14px;font-weight:700;cursor:pointer" onclick="waitCancelConfirm('${studentId}')">등록 취소</button>
    </div>`);
}
async function waitCancelConfirm(studentId){
  if(!curCanEdit()){ toast('수정 권한이 없습니다','err'); return; }
  const brId=session.branchId;
  const mv=(db.studentMovements||[]).find(m=> m.studentId===studentId && m.branchId===brId && m.memo==='레벨테스트 대기→등록');
  const semId=mv?mv.semesterId:null;
  const stu=(db.students||[]).find(s=>s.id===studentId)||{};
  try{
    const rec=(db.semesterRecords||[]).find(r=> r.studentId===studentId && r.branchId===brId && (!semId||r.semesterId===semId) && (r.kind||'regular')!=='exam');
    if(rec){ const { error }=await sb.from('semester_records').delete().eq('id',rec.id); if(error) throw error; db.semesterRecords=db.semesterRecords.filter(x=>x.id!==rec.id); }
    if(mv){ const { error:e2 }=await sb.from('student_movements').delete().eq('id',mv.id); if(e2) throw e2; db.studentMovements=db.studentMovements.filter(x=>x.id!==mv.id); }
    const res=reservations.find(r=> r.branch_id===brId && ((stu.code && r.student_code===stu.code) || r.student_name===stu.name));
    if(res){ await updateReservation(res.id, {enrolled:'waiting_next', wait_semester: semId||nextSemId(), not_enrolled_reason:null}); }
    waitModalClose();
    toast(`${stu.name||''} 등록 취소 — 대기명단으로 복귀 ✓`);
    renderWonmuBody();
  }catch(e){ console.error('등록 취소 실패', e); toast('취소 실패: '+(e.message||e),'err'); }
}
/* 학기 id → '가을' 같은 계절 단어 */
function seasonWord(semId){
  const m=String(semId||'').match(/sem_\d+_(\w+)/); const k=m?m[1]:'';
  return ({spring:'봄',summer:'여름',fall:'가을',winter:'겨울'})[k]||'해당 학기';
}
/* 가벼운 팝업(루트 앱엔 모달이 없어 동적 생성) */
function waitModalOpen(inner){
  waitModalClose();
  const ov=document.createElement('div'); ov.id='waitModal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(20,20,30,.42);display:flex;align-items:center;justify-content:center;z-index:99999';
  ov.innerHTML=`<div style="background:#fff;border-radius:16px;max-width:420px;width:92%;padding:22px;box-shadow:0 16px 50px rgba(0,0,0,.25)">${inner}</div>`;
  ov.addEventListener('click',e=>{ if(e.target===ov) waitModalClose(); });
  document.body.appendChild(ov);
}
function waitModalClose(){ const m=$('waitModal'); if(m) m.remove(); }
/* 전형 학생을 '그 학기 신규생'으로 실제 등록시킨다.
   예약에 등록완료 도장만 찍으면 semester_records가 없어서 인원 현황·반배정표·
   교재관리 어디에도 학생이 안 나온다. 등록은 반드시 이 함수를 거친다. */
function jhFirstDay(semId){
  const p=(semesterYM(semId)||[])[0];
  return p ? p.ym+'-01' : new Date().toISOString().slice(0,10);
}
async function enrollNewFromRes(r, semId, enrollDate, pickCls){
  const brId=r.branch_id||session.branchId, code=(r.student_code||'').trim();
  let className='미배정', classLabelV='미배정', teacherV='미배정';
  if(pickCls && pickCls!=='미배정'){
    const ref=(db.semesterRecords||[]).find(x=>x.branchId===brId && x.semesterId===semId && x.className===pickCls);
    className=pickCls; classLabelV=(ref&&ref.classLabel)||pickCls; teacherV=(ref&&ref.teacher)||'미배정';
  }
  // 학기가 아직 없으면 만든다 (레코드만 붕 뜨는 것 방지)
  if(!(db.semesters||[]).some(x=>x.id===semId)){
    const semNm=semNameFromId(semId);
    const { error:eSem }=await sb.from('semesters').insert({id:semId, name:semNm});
    if(eSem) throw eSem;
    db.semesters.push({id:semId, name:semNm});
  }
  // 학생 찾기 — 회원코드 우선, 없으면 동명이인이 없을 때만 이름으로
  let stu = code ? (db.students||[]).find(x=>x.code===code) : null;
  if(!stu && !code){
    const cand=(db.students||[]).filter(x=>x.name===(r.student_name||'').trim());
    if(cand.length===1) stu=cand[0];
  }
  if(!stu){
    stu={ id:uid('st'), code:code||null, name:r.student_name||'', school:r.school||'', grade:r.grade||'' };
    const { error }=await sb.from('students').insert({id:stu.id,code:stu.code,name:stu.name,school:stu.school,grade:stu.grade});
    if(error) throw error;
    db.students.push(stu);
  }
  const dup=(db.semesterRecords||[]).some(x=>x.studentId===stu.id && x.branchId===brId
    && x.semesterId===semId && (x.kind||'regular')!=='exam' && x.status==='active');
  if(!dup){
    const recId=uid('rec');
    const { error:e2 }=await sb.from('semester_records').insert({
      id:recId, student_id:stu.id, branch_id:brId, semester_id:semId,
      class_name:className, class_label:classLabelV, teacher:teacherV, note:'신규생',
      target_type:'HCMC', status:'active', origin:'new', enroll_date:enrollDate,
      withdraw_date:'', transfer:false, transfer_in:false, transfer_to:null, kind:'regular'
    });
    if(e2) throw e2;
    db.semesterRecords.push({ id:recId, studentId:stu.id, branchId:brId, semesterId:semId,
      className, classLabel:classLabelV, teacher:teacherV, targetType:'HCMC',
      status:'active', origin:'new', enrollDate, withdrawDate:'', transfer:false, transferIn:false, transferTo:null, kind:'regular' });
    const mvId=uid('mv');
    await sb.from('student_movements').insert({ id:mvId, student_id:stu.id, branch_id:brId, semester_id:semId, type:'new', date:enrollDate, memo:'레벨테스트 대기→등록' });
    db.studentMovements&&db.studentMovements.push({ id:mvId, studentId:stu.id, branchId:brId, semesterId:semId, type:'new', date:enrollDate, memo:'레벨테스트 대기→등록' });
  }
  // 대기 학기를 지우지 않고 '실제로 등록한 학기'로 확정 → 전형 현황에서 등록으로 잡힌다
  await updateReservation(r.id, { enrolled:'enrolled', not_enrolled_reason:null, wait_semester:semId });
  return { name:r.student_name||'', className, classLabelV, dup };
}
/* [등록] 캘린더 팝업 → 신규생(미배정) 자동 등록 */
function waitRegisterOpen(resId){
  const r=reservations.find(x=>x.id===resId); if(!r) return;
  const semId=r.wait_semester||nextSemId();
  const yms=(semesterYM(semId)||[]).map(p=>p.ym);
  const defDate=(yms[0]||'')+'-01';
  // 이 학기(가을)에 이미 만들어진 반 목록 (전체명단 업로드됐으면 채워짐)
  const cls=[...new Map((db.semesterRecords||[])
    .filter(x=>x.branchId===session.branchId && x.semesterId===semId && x.status==='active' && (x.kind||'regular')!=='exam' && x.className && x.className!=='미배정')
    .map(x=>[x.className,x])).values()]
    .sort((a,b)=>String(a.classLabel||a.className).localeCompare(String(b.classLabel||b.className),'ko'));
  const hasCls=cls.length>0;
  const clsOpts=`<option value="미배정">미배정 (반은 나중에)</option>`
    + cls.map(x=>`<option value="${esc(x.className)}">${esc(x.classLabel||x.className)}${x.teacher?' · '+esc(x.teacher):''}</option>`).join('');
  waitModalOpen(`
    <div style="font-weight:800;font-size:16px;margin-bottom:4px">${esc(semNameFromId(semId))} 신규생 등록</div>
    <div style="font-size:13px;color:#667;line-height:1.6;margin-bottom:14px">${esc(r.student_name||'')} · ${esc([r.school,gradeTxt(r.grade)].filter(Boolean).join(' · '))}</div>
    <label style="font-size:12.5px;font-weight:700;color:#556">입학일(등원일)</label>
    <input type="date" id="waitRegDate" value="${defDate}" style="width:100%;height:40px;padding:0 11px;margin:5px 0 12px;border:1px solid #dcdce6;border-radius:9px">
    <label style="font-size:12.5px;font-weight:700;color:#556">등록 반</label>
    <select id="waitRegClass" ${hasCls?'':'disabled'} style="width:100%;height:40px;padding:0 8px;margin-top:5px;border:1px solid #dcdce6;border-radius:9px;background:${hasCls?'#fff':'#f3f3f6'}">${clsOpts}</select>
    <div style="font-size:12px;color:#8a8fa3;margin-top:6px">${hasCls?'이미 올라온 가을 반 중에서 고르세요. (미정이면 미배정)':'전체명단 업로드 전이라 반 선택은 잠겨 있어요 → <b>미배정</b>으로 등록됩니다.'}</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
      <button class="btn-sm" style="border:1px solid #dcdce6;background:#fff;border-radius:9px;padding:8px 14px;cursor:pointer" onclick="waitModalClose()">취소</button>
      <button class="btn-sm" style="border:1px solid #1f8a95;background:#1f8a95;color:#fff;border-radius:9px;padding:8px 14px;font-weight:700;cursor:pointer" onclick="waitRegisterConfirm('${resId}')">등록</button>
    </div>`);
}
async function waitRegisterConfirm(resId){
  if(!curCanEdit()){ toast('수정 권한이 없습니다','err'); return; }
  const r=reservations.find(x=>x.id===resId); if(!r){ waitModalClose(); return; }
  const enrollDate=($('waitRegDate')&&$('waitRegDate').value)||'';
  if(!enrollDate){ toast('입학일을 선택하세요','err'); return; }
  const semId=r.wait_semester||nextSemId();
  const pickCls=($('waitRegClass')&&$('waitRegClass').value)||'미배정';
  try{
    const out=await enrollNewFromRes(r, semId, enrollDate, pickCls);
    waitModalClose();
    toast(out.dup ? `${out.name} 학생은 이미 ${semNameFromId(semId)} 명단에 있어요 — 예약만 등록완료로 ✓`
                  : `${out.name} 신규생 등록 완료 (${out.className==='미배정'?'미배정':out.classLabelV}) ✓`);
    renderWonmuBody();
  }catch(e){ console.error('대기→등록 실패', e); toast('등록 실패: '+(e.message||e),'err'); }
}
/* [미등록] 사유 팝업 → 레벨테스트 상태를 '미등록'으로 변경 + 사유 저장 */
function waitNotEnrolledOpen(resId){
  const r=reservations.find(x=>x.id===resId); if(!r) return;
  waitModalOpen(`
    <div style="font-weight:800;font-size:16px;margin-bottom:4px">미등록 처리</div>
    <div style="font-size:13px;color:#667;line-height:1.6;margin-bottom:14px">${esc(r.student_name||'')} 학생을 <b>미등록</b>으로 처리합니다. 레벨테스트 현황에서도 '다음학기 대기' → '미등록'으로 바뀝니다.</div>
    <label style="font-size:12.5px;font-weight:700;color:#556">미등록 사유</label>
    <textarea id="waitNoReason" rows="3" placeholder="예: 타 학원 등록 / 이사 / 연락 두절 등" style="width:100%;padding:9px 11px;margin-top:5px;border:1px solid #dcdce6;border-radius:9px;resize:vertical;font:inherit"></textarea>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
      <button class="btn-sm" style="border:1px solid #dcdce6;background:#fff;border-radius:9px;padding:8px 14px;cursor:pointer" onclick="waitModalClose()">취소</button>
      <button class="btn-sm" style="border:1px solid #c0504d;background:#c0504d;color:#fff;border-radius:9px;padding:8px 14px;font-weight:700;cursor:pointer" onclick="waitNotEnrolledConfirm('${resId}')">미등록 처리</button>
    </div>`);
}
async function waitNotEnrolledConfirm(resId){
  if(!curCanEdit()){ toast('수정 권한이 없습니다','err'); return; }
  const reason=($('waitNoReason')&&$('waitNoReason').value.trim())||'';
  if(!reason){ toast('미등록 사유를 입력하세요','err'); return; }
  // 대기 학기 보존 — 어느 학기 대기였다가 안 왔는지가 전형 현황에 필요
  const r0=reservations.find(x=>x.id===resId);
  const keepSem=(r0&&r0.wait_semester)||nextSemId();
  const ok=await updateReservation(resId, { enrolled:'not_enrolled', not_enrolled_reason:reason, wait_semester:keepSem });
  if(ok){ waitModalClose(); toast('미등록 처리 완료 ✓'); renderWonmuBody(); }
}
function renderWonmuHub(b){
  if(!bookState.loaded){ b.innerHTML='<div class="page-h"><div><h2><span class="h-ic">'+icon('wonmu',24)+'</span><span class="em">원무</span></h2><p>불러오는 중…</p></div></div><div class="book-loading">현황 불러오는 중…</div>'; ensureReservations().then(()=>{ if(state.view==='wonmu') renderWonmuBody(); }); return; }
  const brs=branchList();
  const semYms=semesterYM(state.semId).map(p=>p.ym);   // 학기 전체 월들
  const inSem=r=>{ const ym=String(r.reserved_date||'').slice(0,7); return semYms.length?semYms.includes(ym):true; };
  const ltRows=brs.map(x=>({b:x, m:ltMetrics(reservations.filter(r=>r.branch_id===x.id && inSem(r)))}));
  const ltTot=ltMetrics(reservations.filter(r=> (session.role==='admin'||r.branch_id===session.branchId) && inSem(r)));
  const maxBooked=Math.max(1,...ltRows.map(r=>r.m.booked));
  const ltR=ltRates(ltTot);
  const hcRows=brs.map(x=>({b:x, ...branchHeadcount(x.id)}));
  const maxAct=Math.max(1,...hcRows.map(r=>r.active));
  const hcTot=hcRows.reduce((a,r)=>({active:a.active+r.active,nw:a.nw+r.nw,wd:a.wd+r.wd}),{active:0,nw:0,wd:0});
  const wdRate=(hcTot.active+hcTot.wd)>0?hcTot.wd/(hcTot.active+hcTot.wd)*100:0;

  let h=`<div class="page-h"><div><h2><span class="h-ic">${icon('wonmu',24)}</span><span class="em">원무</span></h2><p>원생 · 상담 · 레벨테스트 — 보고 싶은 걸 골라 들어가세요</p></div></div>`;
  h+=waitAlertBanner();
  h+=`<div class="whub">`;

  // 레벨테스트 카드 (레벨테스트 메뉴 권한 있을 때만)
  if(hasMenu('leveltest')){
  h+=`<div class="hub-card" onclick="wonmuGo('leveltest')">
    <div class="hc-head"><div class="hc-ic lt">${IC_CAL}</div><div class="hc-t"><h3>레벨테스트</h3><p>예약 · 참석 · 등록 현황 + 성적 · 코멘트</p></div><div class="hc-go">들어가기 ›</div></div>
    <div class="legend"><div class="ls"><div class="li"><span class="sw r0"></span>예약</div><div class="li"><span class="sw r1"></span>참석</div><div class="li"><span class="sw r2"></span>등록</div></div><span class="mo">${esc(semName(state.semId))} · 분원별</span></div>`;
  if(ltRows.length){ ltRows.forEach(r=>{ h+=ltBarRow(r.b.name, r.m, maxBooked); }); }
  else h+=`<div class="empty-msg">표시할 분원이 없어요.</div>`;
  h+=`<div class="hc-foot"><span class="l">전체 예약 ${ltTot.booked} · 참석 ${ltTot.attended} · 등록 ${ltTot.enrolled}${ltTot.failed?` · 미통과 ${ltTot.failed}`:''}</span><span class="r"><span class="b">참석률 ${ltR.att.toFixed(0)}%</span> · 등록률 ${ltR.enr.toFixed(0)}%</span></div></div>`;
  }

  // 인원현황 카드 (인원현황 메뉴 권한 있을 때만)
  if(hasMenu('inwon')){
  h+=`<div class="hub-card" onclick="wonmuGo('inwon')">
    <div class="hc-head"><div class="hc-ic hd">${IC_ROSTER}</div><div class="hc-t"><h3>인원현황</h3><p>재원 · 신규 · 퇴원 · 반별 · 담임별 · 상담</p></div><div class="hc-go">들어가기 ›</div></div>
    <div class="legend"><div class="ls"><div class="li"><span class="sw h1"></span>현재 재원</div></div><span class="mo h">${esc(semName(state.semId))} · 분원별</span></div>`;
  if(hcRows.length){ hcRows.forEach(r=>{ const w=Math.max(r.active>0?6:0, r.active/maxAct*100);
    h+=`<div class="frow"><div class="fr-nm">${esc(r.b.name)}</div>
      <div class="track"><div class="seg hbg" style="width:100%"></div><div class="seg h1seg" style="width:${w}%"></div><span class="n-in">${r.active}</span></div>
      <div class="fr-pct"><div class="h-in">신규 +${r.nw}</div><div class="h-out">${r.wd?('퇴원 -'+r.wd):'퇴원 0'}</div></div></div>`;
  }); } else h+=`<div class="empty-msg">표시할 분원이 없어요.</div>`;
  h+=`<div class="hc-foot"><span class="l">현재 재원 ${fmt(hcTot.active)}명</span><span class="r"><span class="g">신규 +${hcTot.nw}</span> · 퇴원율 ${wdRate.toFixed(1)}%</span></div></div>`;
  }

  // 시험채점 카드 (DT · AT · 내신모의고사) — 레벨테스트/인원현황과 독립
  if(hasMenu('grading')){
  h+=`<div class="hub-card" onclick="openExam()">
    <div class="hc-head"><div class="hc-ic lt">${IC_CAL}</div><div class="hc-t"><h3>시험채점 <span style="font-size:12px;color:var(--wink3);font-weight:700">DT · AT · 내신모의고사</span></h3><p>정답키로 반별 즉시 채점 · 분원별 진행률 · 엑셀 다운(큐앱)</p></div><div class="hc-go">들어가기 ›</div></div>
    <div class="hc-foot"><span class="l">답안 입력하면 즉시 O/X·점수</span><span class="r"><span class="b">분원별 진행률</span></span></div></div>`;
  }

  h+=`</div>`;
  b.innerHTML=h;
}

/* ---------- 레벨테스트 상세 (admin 뷰어) ---------- */
function statusBadge(r){
  const st=r.status||'booked';
  if(st==='noshow') return '<span class="st noshow">노쇼</span>';
  if(st==='canceled') return '<span class="st cancel">취소</span>';
  if(st==='parent_only') return '<span class="st parent">학부모만 참석</span>';
  if(st==='attended') return '<span class="st done">참석</span>';
  return '<span class="st booked">예약</span>';
}
function enrollBadge(r){
  if(r.status==='canceled'||r.status==='noshow'||r.status==='parent_only') return '<span class="mut">–</span>';
  const en=r.enrolled||'pending';
  if(en==='enrolled') return '<span class="st enroll">등록완료</span>';
  if(en==='not_enrolled') return '<span class="st noenr">미등록</span>';
  if(en==='failed') return '<span class="st fail">미통과</span>';
  if(en==='waiting_next') return '<span class="st waitn">다음학기 대기</span>'+(r.wait_semester?`<div class="waitn-sem">${esc(semNameFromId(r.wait_semester))}</div>`:'');
  return '<span class="mut">대기</span>';
}
function scoreCell(r){
  if(r.test_level||r.test_score!=null&&r.test_score!==''){ return `${r.test_level?`<span class="lvl">${esc(r.test_level)}</span>`:''}${(r.test_score!=null&&r.test_score!=='')?esc(r.test_score)+'점':''}`; }
  return '<span class="mut">·</span>';
}
function isAttended(r){ if(r.status==='parent_only'||r.status==='canceled'||r.status==='noshow') return false; return r.status==='attended'||r.enrolled==='enrolled'||r.enrolled==='not_enrolled'||r.enrolled==='failed'||r.enrolled==='waiting_next'; }
/* 테스터 코멘트 칸: 테스터 코멘트가 있으면 그걸, 없으면 미등록 사유(실무자가 남긴 메모)를 보여줌 */
function cmtCell(r){
  const c = r.tester_comment || r.not_enrolled_reason;
  if(c) return esc(c);
  if(r.status==='noshow') return '<span class="mut">미응시</span>';
  if(r.status==='canceled') return '<span class="mut">취소</span>';
  if(r.status==='parent_only') return '<span class="mut">학부모만 참석 (시험 미응시)</span>';
  return '<span class="mut">·</span>';
}
/* 상세 목록에서 등록 여부를 바로 바꾸는 드롭다운 (캘린더 안 들어가고) */
function enrollEditCell(r){
  if(r.status==='canceled'||r.status==='noshow'||r.status==='parent_only') return '<span class="mut">–</span>';
  const en=r.enrolled||'pending';
  const opts=[['pending','대기'],['enrolled','등록완료'],['not_enrolled','미등록'],['failed','미통과'],['waiting_next','다음학기 대기']];
  return `<select class="enr-sel enr-${en}" onchange="setResEnrolled('${r.id}',this.value)">${opts.map(o=>`<option value="${o[0]}" ${o[0]===en?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`;
}
function scoreLinkCell(r){
  const res=ltResults[r.id];
  if(res){ return `<span class="score-link" onclick="openScoreView('${res.id}')"><span class="lvl">${esc(res.assigned_level||'')}</span>${res.total_score!=null?esc(res.total_score)+'점':''}<span class="sv-ic">›</span></span>`; }
  return scoreCell(r);
}
function semesterYM(semId){
  const mm=String(semId||'').match(/sem_(\d+)_(\w+)/); if(!mm) return [];
  const year=+mm[1]; const season=SEASONS.find(s=>s.key===mm[2]); if(!season) return [];
  return season.months.map(mo=>{ const y=(season.key==='winter'&&(mo===1||mo===2))?year+1:year; return {y, m:mo, ym:`${y}-${_pad(mo)}`}; });
}
function ltSetPeriod(v){ wonmuState.ltPeriod=parseInt(v,10); wonmuState.ltPage=1; renderWonmuBody(); }
function ltSetFilter(f){ wonmuState.ltFilter=f; wonmuState.ltPage=1; renderWonmuBody(); }
function ltSetListBranch(v){ wonmuState.ltListBranch=v; wonmuState.ltPage=1; renderWonmuBody(); }
function ltSetPage(p){ wonmuState.ltPage=p; renderApptbl(); }
function toggleDelLog(){ wonmuState.delLogOpen=!wonmuState.delLogOpen; renderWonmuBody(); }
function ltSetSearch(v){ wonmuState.ltSearch=v; wonmuState.ltPage=1; renderApptbl(); }
function ltSetGrade(v){ wonmuState.ltGrade=v; wonmuState.ltPage=1; renderApptbl(); }
function pageList(cur,total){ const out=[]; if(total<=7){ for(let p=1;p<=total;p++)out.push(p); return out; } out.push(1); let s=Math.max(2,cur-1), e=Math.min(total-1,cur+1); if(s>2)out.push('…'); for(let p=s;p<=e;p++)out.push(p); if(e<total-1)out.push('…'); out.push(total); return out; }
function openBranchCalendar(id){ bookState.branchId=id; bookState.sel=null; bookState.adding=false; bookState.editId=null; wonmuGo('booking'); }
/* 상세에서 학생 클릭 → 그 학생 예약이 있는 캘린더 날짜로 이동 + 편집칸 열기 */
function openResInCalendar(id){
  const r=reservations.find(x=>x.id===id); if(!r){ toast('예약을 찾을 수 없어요','err'); return; }
  const d=String(r.reserved_date||'').slice(0,10);
  bookState.branchId=r.branch_id||(session.role==='admin'?'all':session.branchId);
  if(d){ bookState.y=+d.slice(0,4); bookState.m=+d.slice(5,7)-1; bookState.sel=d; }
  bookState.editId=id; bookState.adding=false; bookState.delConfirm=null;
  wonmuGo('booking'); window.scrollTo(0,0);
}
function renderLtDetail(b){
  if(!bookState.loaded){ b.innerHTML='<div class="lt-back" onclick="wonmuGo(\'hub\')">‹ 원무 홈</div><div class="book-loading">레벨테스트 불러오는 중…</div>'; ensureReservations().then(()=>{ if(state.view==='wonmu') renderWonmuBody(); }); return; }
  const tab=wonmuState.ltTab||'status';
  const tabBar=`<div class="lt-headrow"><div class="lt-back" onclick="wonmuGo('hub')">‹ 원무 홈</div>
    <div class="lt-tabs"><button class="${tab==='status'?'on':''}" onclick="ltSetTab('status')">현황</button><button class="${tab==='analysis'?'on':''}" onclick="ltSetTab('analysis')">분석</button></div></div>`;
  if(tab==='analysis'){ b.innerHTML = tabBar + renderLtAnalysis(); return; }
  let periods=semesterYM(state.semId);
  if(!periods.length){ const t=new Date(); periods=[{y:t.getFullYear(),m:t.getMonth()+1,ym:`${t.getFullYear()}-${_pad(t.getMonth()+1)}`}]; }
  if(wonmuState.ltPeriod==null) wonmuState.ltPeriod=-1;
  let sel=wonmuState.ltPeriod; if(sel>=periods.length) sel=-1;
  const ymSet=periods.map(p=>p.ym);
  const inScope=r=>{ const ym=String(r.reserved_date||'').slice(0,7); return sel<0?ymSet.includes(ym):ym===ymSet[sel]; };
  const brs=branchList();
  const scopedAll=reservations.filter(r=> (session.role==='admin'||r.branch_id===session.branchId) && inScope(r));
  const tot=ltMetrics(scopedAll);
  const R=ltRates(tot);
  const brData=brs.map(x=>({b:x, m:ltMetrics(reservations.filter(r=>r.branch_id===x.id && inScope(r)))}));
  const maxBooked=Math.max(1,...brData.map(d=>d.m.booked));
  const periodLabel=sel<0?'학기 전체':`${periods[sel].m}월`;

  let h=tabBar+`
  <div class="lt-top"><div><h2><span class="hic">${IC_CAL}</span>레벨테스트</h2><p>분원을 누르면 그 분원 캘린더(예약·출결)로 들어가요</p></div>
    <div class="lt-ctrls">
      <button class="lt-xlsxbtn" onclick="triggerExcelUpload()"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>엑셀 등록</button>
      <button class="lt-inputbtn" onclick="openBranchCalendar('all')">＋ 예약 입력</button>
      ${session.role==='admin'?`<button class="lt-logbtn ${wonmuState.delLogOpen?'on':''}" onclick="toggleDelLog()"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>삭제 기록${delLogs.length?` ${delLogs.length}`:''}</button>`:''}
      <div class="pick"><span>기간</span><select onchange="ltSetPeriod(this.value)"><option value="-1" ${sel<0?'selected':''}>학기 전체</option>${periods.map((p,i)=>`<option value="${i}" ${i===sel?'selected':''}>${p.m}월</option>`).join('')}</select></div>
    </div></div>`;

  // 삭제 기록 패널 (본사 전용) — 노쇼 지우기 조작 감사
  if(session.role==='admin' && wonmuState.delLogOpen){
    h+=`<div class="lt-card dellog"><div class="lt-ch"><div class="t">예약 삭제 기록 <span class="hint">누가·언제·왜 지웠는지 · 최근순</span></div></div>`;
    if(!delLogs.length){ h+=`<div class="empty-msg">삭제된 예약이 없어요.</div>`; }
    else{
      h+=`<div class="apptbl-wrap"><table class="apptbl"><thead><tr><th>삭제일시</th><th>삭제자</th><th>학생</th><th>분원</th><th>예약일</th><th>삭제 시 상태</th><th>사유</th></tr></thead><tbody>`;
      delLogs.forEach(l=>{
        const dt=String(l.deleted_at||'').replace('T',' ').slice(0,16);
        const stTxt=[l.status_at_delete==='noshow'?'노쇼':l.status_at_delete==='canceled'?'취소':l.status_at_delete==='attended'?'참석':'예약',
          l.enrolled_at_delete==='enrolled'?'등록':l.enrolled_at_delete==='not_enrolled'?'미등록':l.enrolled_at_delete==='failed'?'미통과':l.enrolled_at_delete==='waiting_next'?'다음학기대기':''].filter(Boolean).join(' · ');
        const isNoshow=l.status_at_delete==='noshow'||l.status_at_delete==='canceled';
        h+=`<tr><td class="dt">${esc(dt)}</td><td>${esc(l.deleted_by||'')}</td>
          <td class="stu">${esc(l.student_name||'')}${l.student_code?`<span class="code">${esc(l.student_code)}</span>`:''}</td>
          <td class="subc">${esc(bName(l.branch_id))}</td>
          <td class="subc">${esc(String(l.reserved_date||'').slice(5).replace('-','/'))}</td>
          <td>${isNoshow?`<span class="st noshow">${esc(stTxt)}</span>`:`<span class="mut">${esc(stTxt||'·')}</span>`}</td>
          <td class="cmt">${l.reason?esc(l.reason):'<span class="mut">·</span>'}</td></tr>`;
      });
      h+=`</tbody></table></div>`;
    }
    h+=`</div>`;
  }

  // 요약 퍼널 (위: 예약→참석→등록 가운데정렬 / 아래: 상태별 통계 한 줄)
  h+=`<div class="summary">
    <div class="sfunnel">
      <div class="sstep tipable" onmouseover="ltTip(event,'booked')" onmouseout="ltTipHide()"><span class="l" style="color:var(--r2)">예약</span><span class="v">${tot.booked}<span class="u">명</span></span><span class="r">&nbsp;</span></div>
      <span class="sarrow">›</span>
      <div class="sstep tipable" onmouseover="ltTip(event,'attended')" onmouseout="ltTipHide()"><span class="l" style="color:var(--wpos)">참석</span><span class="v">${tot.attended}<span class="u">명</span></span><span class="r">${tot.booked?'참석률 '+R.att.toFixed(0)+'%':'&nbsp;'}</span></div>
      <span class="sarrow">›</span>
      <div class="sstep tipable" onmouseover="ltTip(event,'enrolled')" onmouseout="ltTipHide()"><span class="l" style="color:var(--wblue)">등록</span><span class="v">${tot.enrolled}<span class="u">명</span></span><span class="r">${tot.booked?'등록률 '+R.enr.toFixed(0)+'%':'&nbsp;'}</span></div>
      <span class="sdiv">｜</span>
      <div class="sstep tipable" onmouseover="ltTip(event,'waitn')" onmouseout="ltTipHide()"><span class="l" style="color:#1f8a95">다음학기 대기</span><span class="v" style="color:#1f8a95">${tot.waitNext}<span class="u">명</span></span><span class="r">&nbsp;</span></div>
    </div>
    <div class="sstats">
      <div class="smini tipable" onmouseover="ltTip(event,'noshow')" onmouseout="ltTipHide()"><span class="l">노쇼</span><span class="v neg">${tot.noshow}</span></div>
      <div class="smini tipable" onmouseover="ltTip(event,'canceled')" onmouseout="ltTipHide()"><span class="l">취소</span><span class="v mut">${tot.canceled}</span></div>
      <div class="smini tipable" onmouseover="ltTip(event,'notenr')" onmouseout="ltTipHide()"><span class="l">미등록</span><span class="v warn">${tot.notEnr}</span></div>
      <div class="smini tipable" onmouseover="ltTip(event,'failed')" onmouseout="ltTipHide()"><span class="l">미통과</span><span class="v fail">${tot.failed}</span></div>
      <div class="smini"><span class="l">미통과율</span><span class="v fail">${tot.attended?R.fail.toFixed(0)+'%':'·'}</span></div>
    </div></div>`;

  // 분원별 현황 (클릭 → 그 분원 캘린더)
  h+=`<div class="lt-card"><div class="lt-ch"><div class="t">분원별 현황 <span class="hint">${periodLabel} · 분원을 누르면 캘린더로</span></div><div class="legend"><div class="ls"><div class="li"><span class="sw r0"></span>예약</div><div class="li"><span class="sw r1"></span>참석</div><div class="li"><span class="sw r2"></span>등록</div></div></div></div><div class="bars">`;
  brData.forEach(d=>{
    const m=d.m; const w=(n)=> maxBooked>0?Math.max(n>0?4:0,n/maxBooked*100):0;
    const br=ltRates(m);
    h+=`<div class="brow" onclick="openBranchCalendar('${d.b.id}')">
      <div class="fr-nm">${esc(d.b.name)}</div>
      <div class="track">
        <div class="seg s0" style="width:${w(m.booked)}%">${m.booked?`<span class="cnt">${m.booked}</span>`:''}</div>
        <div class="seg s1" style="width:${w(m.attended)}%">${m.attended?`<span class="cnt">${m.attended}</span>`:''}</div>
        <div class="seg s2" style="width:${w(m.enrolled)}%">${m.enrolled?`<span class="cnt">${m.enrolled}</span>`:''}</div>
      </div>
      <div class="fr-pct2">참석 <b>${m.booked?br.att.toFixed(0):0}%</b> · 등록 <b>${m.booked?br.enr.toFixed(0):0}%</b>${m.failed?` · <span class="fail">미통과 ${m.failed}</span>`:''}</div>
      <div class="chev">›</div></div>`;
  });
  h+=`</div></div>`;

  // 응시자 상세 목록 (분원 선택 + 상태 필터 + 10명씩 페이지)
  const lb=wonmuState.ltListBranch||'all';
  const base=scopedAll.filter(r=> lb==='all'?true:r.branch_id===lb);
  const f=wonmuState.ltFilter||'all';
  const cnt={ all:base.length,
    attended:base.filter(isAttended).length,
    enrolled:base.filter(r=>r.enrolled==='enrolled').length,
    notenr:base.filter(r=>r.enrolled==='not_enrolled').length,
    failed:base.filter(r=>r.enrolled==='failed').length,
    waitn:base.filter(r=>r.enrolled==='waiting_next').length,
    noshow:base.filter(r=>r.status==='noshow').length,
    booked:base.filter(r=>(r.status||'booked')==='booked').length };
  const chip=(k,label)=>`<span class="chip ${f===k?'on':''}" onclick="ltSetFilter('${k}')">${label} <span class="c">${cnt[k]}</span></span>`;

  h+=`<div class="lt-card"><div class="lt-ch"><div class="t">응시자 상세 <span class="hint">${periodLabel} · ${cnt.all}명</span></div><div class="lt-ch-r">`;
  h+=`<div class="lt-search"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input id="ltSearchInput" placeholder="학생 이름·코드 검색" value="${esc(wonmuState.ltSearch||'')}" oninput="ltSetSearch(this.value)"><button class="lt-search-x" onclick="var i=document.getElementById('ltSearchInput'); if(i)i.value=''; ltSetSearch('')">✕</button></div>`;
  const gradeOptsH=[...new Set(base.map(r=>gradeTxt(r.grade)).filter(Boolean))].sort(gradeSort);
  const lg=wonmuState.ltGrade||'all';
  h+=`<div class="pick"><span>학년</span><select onchange="ltSetGrade(this.value)"><option value="all" ${lg==='all'?'selected':''}>전체 학년</option>${gradeOptsH.map(g=>`<option value="${esc(g)}" ${g===lg?'selected':''}>${esc(g)}</option>`).join('')}</select></div>`;
  if(session.role==='admin'){
    h+=`<div class="pick"><span>분원</span><select onchange="ltSetListBranch(this.value)"><option value="all" ${lb==='all'?'selected':''}>전체 분원</option>${brs.map(b2=>`<option value="${b2.id}" ${b2.id===lb?'selected':''}>${esc(b2.name)}</option>`).join('')}</select></div>`;
  }
  h+=`</div></div>`;
  h+=`<div class="chips">${chip('all','전체')}${chip('attended','참석')}${chip('enrolled','등록완료')}${chip('notenr','미등록')}${chip('failed','미통과')}${chip('waitn','다음학기 대기')}${chip('noshow','노쇼')}${chip('booked','예약대기')}</div>`;
  h+=`<div id="apptblHost"></div>`;
  h+=`</div>`;
  b.innerHTML=h;
  renderApptbl();   // 표 부분만 별도 렌더 (검색 입력이 안 지워져서 한글 조합 안 깨짐)
}
/* 응시자 상세 표만 계산·렌더 (검색·페이지 변경 시 이 부분만 다시 그림) */
function ltFilteredRows(){
  let periods=semesterYM(state.semId);
  if(!periods.length){ const t=new Date(); periods=[{y:t.getFullYear(),m:t.getMonth()+1,ym:`${t.getFullYear()}-${_pad(t.getMonth()+1)}`}]; }
  let sel=wonmuState.ltPeriod; if(sel==null)sel=-1; if(sel>=periods.length)sel=-1;
  const ymSet=periods.map(p=>p.ym);
  const inScope=r=>{ const ym=String(r.reserved_date||'').slice(0,7); return sel<0?ymSet.includes(ym):ym===ymSet[sel]; };
  const scopedAll=reservations.filter(r=> (session.role==='admin'||r.branch_id===session.branchId) && inScope(r));
  const lb=wonmuState.ltListBranch||'all';
  const base=scopedAll.filter(r=> lb==='all'?true:r.branch_id===lb);
  const f=wonmuState.ltFilter||'all';
  const pred={ all:()=>true, attended:isAttended, enrolled:r=>r.enrolled==='enrolled', notenr:r=>r.enrolled==='not_enrolled', failed:r=>r.enrolled==='failed', waitn:r=>r.enrolled==='waiting_next', noshow:r=>r.status==='noshow', booked:r=>(r.status||'booked')==='booked' }[f]||(()=>true);
  const q=(wonmuState.ltSearch||'').trim().toLowerCase();
  const lg=wonmuState.ltGrade||'all';
  return base.filter(pred)
    .filter(r=> lg==='all' || gradeTxt(r.grade)===lg)
    .filter(r=> !q || String(r.student_name||'').toLowerCase().includes(q) || String(r.student_code||'').toLowerCase().includes(q))
    .sort((a,b)=> (String(a.reserved_date)+String(a.reserved_time||'')).localeCompare(String(b.reserved_date)+String(b.reserved_time||'')));
}
function renderApptbl(){
  const host=$('apptblHost'); if(!host) return;
  const allRows=ltFilteredRows();
  const PER=10;
  const totalPages=Math.max(1,Math.ceil(allRows.length/PER));
  let page=wonmuState.ltPage||1; if(page>totalPages) page=totalPages; if(page<1) page=1;
  const rows=allRows.slice((page-1)*PER, page*PER);
  let h='';
  if(!allRows.length){ h=`<div class="empty-msg">해당 조건의 응시자가 없어요.</div>`; }
  else{
    h+=`<div class="apptbl-wrap"><table class="apptbl"><thead><tr><th>날짜 · 시간</th><th>분원</th><th>학생</th><th>학교 · 학년</th><th>상태</th><th>등록</th><th>성적</th><th>테스터 코멘트</th></tr></thead><tbody>`;
    rows.forEach(r=>{
      const dstr=String(r.reserved_date||'').slice(5).replace('-','/').replace(/^0/,'');
      const meta=[esc(r.school||''), gradeTxt(r.grade)].filter(Boolean).join(' · ')||'<span class="mut">·</span>';
      h+=`<tr><td class="dt">${dstr} <span>${esc(String(r.reserved_time||'').slice(0,5))}</span></td>
        <td class="subc">${esc(bName(r.branch_id))}</td>
        <td class="stu stu-link" onclick="openResInCalendar('${r.id}')" title="캘린더에서 열기"><span class="stu-nm">${esc(r.student_name||'')}</span>${r.student_code?`<span class="code">${esc(r.student_code)}</span>`:''}</td>
        <td class="subc">${meta}</td>
        <td>${statusBadge(r)}</td><td class="enr-cell">${enrollEditCell(r)}</td>
        <td class="score">${scoreLinkCell(r)}</td>
        <td class="cmt">${cmtCell(r)}</td></tr>`;
    });
    h+=`</tbody></table></div>`;
    if(totalPages>1){
      h+=`<div class="pager"><span class="pg-info">${(page-1)*PER+1}–${Math.min(page*PER,allRows.length)} / ${allRows.length}명</span>
        <div class="pg-btns"><button class="pg-nav" ${page<=1?'disabled':''} onclick="ltSetPage(${page-1})">‹</button>`;
      pageList(page,totalPages).forEach(p=>{ h+= (p==='…') ? `<span class="dots">…</span>` : `<button class="pg ${p===page?'on':''}" onclick="ltSetPage(${p})">${p}</button>`; });
      h+=`<button class="pg-nav" ${page>=totalPages?'disabled':''} onclick="ltSetPage(${page+1})">›</button></div></div>`;
    }
  }
  host.innerHTML=h;
}

/* ============================================================================
   레벨테스트 분석 탭 — 지금 데이터로만 (비교군·백분위 없음). 미통과 = 불합격.
   ============================================================================ */
function ltSetTab(t){ wonmuState.ltTab=t; renderWonmuBody(); window.scrollTo(0,0); }
function anSetBranch(v){ wonmuState.anBranch=v; renderWonmuBody(); }
function anSetType(v){ wonmuState.anType=v; renderWonmuBody(); }
function anSetPeriod(v){ wonmuState.anPeriod=parseInt(v,10); renderWonmuBody(); }
function anSetGrade(v){ wonmuState.anGrade=v; wonmuState.anListPage=0; renderWonmuBody(); }
function anExamPg(d){ wonmuState.anExamPage=(wonmuState.anExamPage||0)+d; renderWonmuBody(); }
function anLevelPg(d){ wonmuState.anLevelPage=(wonmuState.anLevelPage||0)+d; renderWonmuBody(); }
function anListPg(d){ wonmuState.anListPage=(wonmuState.anListPage||0)+d; renderWonmuBody(); }
/* 지표 위에 마우스 올리면 해당 학생 명단 툴팁 */
const TIP_LABEL={booked:'예약',attended:'응시(참석)',passed:'합격',enrolled:'등록',notenr:'미등록',failed:'불합격(미통과)',waitn:'다음학기 대기',noshow:'노쇼',canceled:'취소',parent:'학부모만 참석'};
const TIP_PRED={
  booked:()=>true, attended:isAttended,
  passed:r=>isAttended(r)&&r.enrolled!=='failed',
  enrolled:r=>r.enrolled==='enrolled'&&r.status!=='parent_only',
  notenr:r=>r.enrolled==='not_enrolled'&&r.status!=='parent_only',
  failed:r=>r.enrolled==='failed'&&r.status!=='parent_only',
  waitn:r=>r.enrolled==='waiting_next'&&r.status!=='parent_only',
  noshow:r=>r.status==='noshow', canceled:r=>r.status==='canceled', parent:r=>r.status==='parent_only'
};
function ltTipScope(){
  let periods=semesterYM(state.semId);
  if(!periods.length){ const t=new Date(); periods=[{y:t.getFullYear(),m:t.getMonth()+1,ym:`${t.getFullYear()}-${_pad(t.getMonth()+1)}`}]; }
  const isAdmin=session.role==='admin';
  if(wonmuState.ltTab==='analysis'){
    let sel=wonmuState.anPeriod; if(sel==null)sel=-1; if(sel>=periods.length)sel=-1;
    const ymSet=periods.map(p=>p.ym); const anBranch=isAdmin?(wonmuState.anBranch||'all'):session.branchId; const anType=wonmuState.anType||'all';
    let s=reservations.filter(r=> (isAdmin?(anBranch==='all'||r.branch_id===anBranch):r.branch_id===session.branchId) && (sel<0?ymSet.includes(String(r.reserved_date||'').slice(0,7)):String(r.reserved_date||'').slice(0,7)===ymSet[sel]));
    if(anType!=='all') s=s.filter(r=>examTypeOf(r)===anType);
    return s;
  }
  let sel=wonmuState.ltPeriod; if(sel==null)sel=-1; if(sel>=periods.length)sel=-1;
  const ymSet=periods.map(p=>p.ym);
  return reservations.filter(r=> (isAdmin||r.branch_id===session.branchId) && (sel<0?ymSet.includes(String(r.reserved_date||'').slice(0,7)):String(r.reserved_date||'').slice(0,7)===ymSet[sel]));
}
let _ltTipTimer=null, _tipState={list:[],page:0,label:''};
const TIP_PER=8;
function ltTip(ev,bucket){
  if(_ltTipTimer){ clearTimeout(_ltTipTimer); _ltTipTimer=null; }
  const pred=TIP_PRED[bucket]||(()=>false);
  const list=ltTipScope().filter(pred).sort((a,b)=> (String(a.reserved_date)+String(a.reserved_time||'')).localeCompare(String(b.reserved_date)+String(b.reserved_time||'')));
  _tipState={list, page:0, label:TIP_LABEL[bucket]||''};
  let t=document.getElementById('ltTip'); if(!t){ t=document.createElement('div'); t.id='ltTip'; t.className='lt-tip'; document.body.appendChild(t);
    t.addEventListener('mouseenter',()=>{ if(_ltTipTimer){ clearTimeout(_ltTipTimer); _ltTipTimer=null; } });
    t.addEventListener('mouseleave',ltTipHide);
  }
  t.style.display='block';
  renderTipBody();
  t.style.left='0px'; t.style.top='0px';
  const rect=ev.currentTarget.getBoundingClientRect(); const tw=t.offsetWidth, th=t.offsetHeight;
  let left=rect.left, top=rect.bottom+8;
  if(left+tw>window.innerWidth-12) left=window.innerWidth-tw-12;
  if(top+th>window.innerHeight-12) top=rect.top-th-8;
  t.style.left=Math.max(12,left)+'px'; t.style.top=Math.max(12,top)+'px';
}
function renderTipBody(){
  const t=document.getElementById('ltTip'); if(!t) return;
  const list=_tipState.list, label=_tipState.label;
  if(!list.length){ t.innerHTML=`<div class="tp-head">${esc(label)} · 0명</div><div class="tp-more">해당 없음</div>`; return; }
  const rows=list.map(r=>{ const sc=scoreOf(r); const lv=levelOf(r); const d=String(r.reserved_date||'').slice(5).replace('-','/');
    return `<div class="tp-row"><span class="tp-nm">${esc(r.student_name||'')}</span><span class="tp-meta">${esc([r.school||'',gradeTxt(r.grade)].filter(Boolean).join(' · '))||'·'}</span><span class="tp-sc">${d}${lv?' · '+esc(lv):''}${sc!=null?' · '+sc+'점':''}</span></div>`;
  }).join('');
  t.innerHTML=`<div class="tp-head">${esc(label)} · ${list.length}명</div>${rows}`;
}
function ltTipPage(d){}
function ltTipHide(){ if(_ltTipTimer) clearTimeout(_ltTipTimer); _ltTipTimer=setTimeout(function(){ const t=document.getElementById('ltTip'); if(t) t.style.display='none'; },260); }
function examTypeOf(r){ const res=ltResults[r.id]; if(res&&res.report_type) return res.report_type==='chess'?'chess':'ace'; return null; }
function examKeyOf(r){ const res=ltResults[r.id]; return (res&&res.exam_key)||''; }
/* 시험 종류 라벨 — 공용 시험지("M1,M2(일반형)")는 학년으로 갈라서 M1/M2 구분 */
function examLabel(r){
  const k=examKeyOf(r); if(!k) return '';
  if(/일반형/.test(k) && /M1|M2/.test(k)){
    const g=gradeKey(r.grade);
    if(g==='중1') return 'M1(일반형)';
    if(g==='중2') return 'M2(일반형)';
  }
  return k;
}
/* 시험 종류 카탈로그 (학년별로 정해진 시험지) */
const EXAM_META=[
  {k:'D1',g:'초등1~5',t:'chess'},{k:'D2',g:'초등1~5',t:'chess'},{k:'D3',g:'초등1~5',t:'chess'},{k:'D4',g:'초등1~5',t:'chess'},
  {k:'L1',g:'초등1~5',t:'chess'},{k:'L2',g:'초등1~5',t:'chess'},{k:'L3',g:'초등1~5',t:'chess'},{k:'L4',g:'초등1~5',t:'chess'},
  {k:'E6',g:'초등6',t:'ace'},{k:'Voca & Translation',g:'초등6·중등1',t:'ace'},
  {k:'M1(일반형)',g:'중등1',t:'ace'},{k:'M1(수능형)',g:'중등1',t:'ace'},
  {k:'M2(일반형)',g:'중등2',t:'ace'},{k:'M2(수능형)',g:'중등2',t:'ace'},
  {k:'M3(고1형)',g:'중등3',t:'ace'},{k:'M3(고2형)',g:'중등3',t:'ace'},
];
function scoreOf(r){ const res=ltResults[r.id]; let s=(res&&res.total_score!=null&&res.total_score!=='')?res.total_score:(r.test_score!=null&&r.test_score!==''?r.test_score:null); return s==null?null:Number(s); }
function levelOf(r){ const res=ltResults[r.id]; return (res&&res.assigned_level)||r.test_level||''; }
function gradeKey(g){ g=String(g||'').trim(); let m; if(m=g.match(/중\s*등?\s*(\d)/))return '중'+m[1]; if(m=g.match(/초\s*등?\s*(\d)/))return '초'+m[1]; if(m=g.match(/고\s*(\d)/))return '고'+m[1]; if(m=g.match(/^(\d)$/))return '초'+m[1]; return g||'기타'; }
const GRADE_ORDER=['초1','초2','초3','초4','초5','초6','중1','중2','중3','고1','고2','고3'];
const CHESS_LV_ORDER=['D1','D2','D3','D4','L1','L2','L3','L4'];
let anLastRows=[];   // 엑셀 내보내기용

function renderLtAnalysis(){
  const isAdmin=session.role==='admin';
  const brs=branchList();
  const anBranch=isAdmin?(wonmuState.anBranch||'all'):session.branchId;
  let periods=semesterYM(state.semId);
  if(!periods.length){ const t=new Date(); periods=[{y:t.getFullYear(),m:t.getMonth()+1,ym:`${t.getFullYear()}-${_pad(t.getMonth()+1)}`}]; }
  let sel=wonmuState.anPeriod; if(sel==null)sel=-1; if(sel>=periods.length)sel=-1;
  const ymSet=periods.map(p=>p.ym);
  const inScope=r=>{ const ym=String(r.reserved_date||'').slice(0,7); return sel<0?ymSet.includes(ym):ym===ymSet[sel]; };
  const anType=wonmuState.anType||'all';
  let scoped=reservations.filter(r=> (isAdmin?(anBranch==='all'||r.branch_id===anBranch):r.branch_id===session.branchId) && inScope(r));
  if(anType!=='all') scoped=scoped.filter(r=>examTypeOf(r)===anType);

  const m=ltMetrics(scoped);
  const passed=Math.max(0,m.attended-m.failed);
  const att=scoped.filter(isAttended);
  const periodLabel=sel<0?'학기 전체':`${periods[sel].m}월`;
  const brLabel=isAdmin?(anBranch==='all'?'전체 분원':bName(anBranch)):bName(session.branchId);

  // ---- 필터 바 ----
  let h=`<div class="an-filter">
    ${isAdmin?`<div class="pick"><span>분원</span><select onchange="anSetBranch(this.value)"><option value="all" ${anBranch==='all'?'selected':''}>전체 분원</option>${brs.map(b=>`<option value="${b.id}" ${b.id===anBranch?'selected':''}>${esc(b.name)}</option>`).join('')}</select></div>`:''}
    <div class="pick"><span>기간</span><select onchange="anSetPeriod(this.value)"><option value="-1" ${sel<0?'selected':''}>학기 전체</option>${periods.map((p,i)=>`<option value="${i}" ${i===sel?'selected':''}>${p.m}월</option>`).join('')}</select></div>
    <div class="an-seg"><button class="${anType==='all'?'on':''}" onclick="anSetType('all')">전체</button><button class="${anType==='chess'?'on':''}" onclick="anSetType('chess')">체스</button><button class="${anType==='ace'?'on':''}" onclick="anSetType('ace')">에이스</button></div>
  </div>`;

  // ---- 전형 퍼널 ----
  const mr=ltRates(m);
  const attRate=mr.att, passRate=m.attended?passed/m.attended*100:0;
  const enrOfPass=mr.conv, enrOfBook=mr.enr;   // 예약대비 = 등록÷(예약−미통과), 현황과 동일 기준
  h+=`<div class="lt-card"><div class="lt-ch"><div class="t">신입생 등록 현황 <span class="hint">예약 → 응시 → 합격 → 등록 · ${esc(brLabel)} · ${periodLabel}</span></div></div>
    <div style="padding:16px 18px 4px">
    <div class="an-funnel">
      <div class="an-fstep tipable" onmouseover="ltTip(event,'booked')" onmouseout="ltTipHide()"><div class="fl" style="color:#9f88e8">예약</div><div class="fv">${m.booked}<span class="u">명</span></div><div class="fr">&nbsp;</div></div>
      <div class="an-farrow">›</div>
      <div class="an-fstep tipable" onmouseover="ltTip(event,'attended')" onmouseout="ltTipHide()"><div class="fl" style="color:#4bb894">응시</div><div class="fv">${m.attended}<span class="u">명</span></div><div class="fr">${m.booked?'참석률 '+attRate.toFixed(0)+'%':'&nbsp;'}</div></div>
      <div class="an-farrow">›</div>
      <div class="an-fstep tipable" onmouseover="ltTip(event,'passed')" onmouseout="ltTipHide()"><div class="fl" style="color:#6f9ad6">합격</div><div class="fv">${passed}<span class="u">명</span></div><div class="fr">${m.attended?'합격률 '+passRate.toFixed(0)+'%':'&nbsp;'}</div></div>
      <div class="an-farrow">›</div>
      <div class="an-fstep tipable" onmouseover="ltTip(event,'enrolled')" onmouseout="ltTipHide()"><div class="fl" style="color:#7a5ce0">등록</div><div class="fv">${m.enrolled}<span class="u">명</span></div><div class="fr">${passed?'합격자 중 '+enrOfPass.toFixed(0)+'% · 예약대비 '+enrOfBook.toFixed(0)+'%':'&nbsp;'}</div></div>
      <div class="an-fdiv">｜</div>
      <div class="an-fstep tipable" onmouseover="ltTip(event,'waitn')" onmouseout="ltTipHide()"><div class="fl" style="color:#1f8a95">다음학기 대기</div><div class="fv" style="color:#1f8a95">${m.waitNext}<span class="u">명</span></div><div class="fr">&nbsp;</div></div>
    </div>
    <div class="an-drops">
      <div class="an-drop tipable" onmouseover="ltTip(event,'failed')" onmouseout="ltTipHide()">불합격(미통과) <b style="color:#bb4a68">${m.failed}</b></div>
      <div class="an-drop tipable" onmouseover="ltTip(event,'notenr')" onmouseout="ltTipHide()">합격했지만 미등록 <b style="color:#e2953f">${m.notEnr}</b></div>
      <div class="an-drop tipable" onmouseover="ltTip(event,'noshow')" onmouseout="ltTipHide()">노쇼 <b>${m.noshow}</b></div>
      <div class="an-drop tipable" onmouseover="ltTip(event,'canceled')" onmouseout="ltTipHide()">취소 <b>${m.canceled}</b></div>
      <div class="an-drop tipable" onmouseover="ltTip(event,'parent')" onmouseout="ltTipHide()">학부모만 참석 <b>${m.parentOnly}</b></div>
    </div></div></div>`;

  // ---- 시험 종류별 응시 현황 (실제 시험지 기준) — 평균도 시험지별로만 ----
  const examAgg={}; att.forEach(r=>{ const k=examLabel(r); if(!k)return; if(!examAgg[k])examAgg[k]={n:0,pass:0,enr:0,scores:[],grades:{}}; examAgg[k].n++; if(r.enrolled!=='failed')examAgg[k].pass++; if(r.enrolled==='enrolled')examAgg[k].enr++; const s=scoreOf(r); if(s!=null)examAgg[k].scores.push(s); const gk=gradeTxt(r.grade); if(gk)examAgg[k].grades[gk]=(examAgg[k].grades[gk]||0)+1; });
  const metaKeys=EXAM_META.map(m=>m.k);
  const extraKeys=Object.keys(examAgg).filter(k=>!metaKeys.includes(k));
  const examRows=[...EXAM_META.filter(m=>examAgg[m.k]), ...extraKeys.map(k=>({k,g:'기타',t:'ace'}))].filter(m=>examAgg[m.k]);
  const EX_PER=12; const exPages=Math.max(1,Math.ceil(examRows.length/EX_PER)); let exPg=Math.min(Math.max(0,wonmuState.anExamPage||0),exPages-1);
  const exSlice=examRows.slice(exPg*EX_PER,(exPg+1)*EX_PER);
  h+=`<div class="an-grid2 an-grid-exam">`;
  h+=`<div class="lt-card"><div class="lt-ch"><div class="t">시험 종류별 응시 현황 <span class="hint">어느 시험지를 어느 학년이 봤나 · 실제 시험 기준</span></div></div>
    <div class="apptbl-wrap"><table class="apptbl an-tbl"><thead><tr><th>시험 종류</th><th>대상 학년</th><th class="r">응시</th><th class="r">평균</th><th class="r">합격</th><th class="r">등록</th></tr></thead><tbody>`;
  if(!examRows.length) h+=`<tr><td colspan="6" style="text-align:center;color:#a9a2b6;padding:20px">채점된 응시 데이터가 없어요.</td></tr>`;
  exSlice.forEach(m=>{ const a=examAgg[m.k];
    const avg=a.scores.length?(a.scores.reduce((x,y)=>x+y,0)/a.scores.length).toFixed(1):'·';
    const ge=Object.entries(a.grades||{}).sort((x,y)=>y[1]-x[1]);
    let gradeCell;
    if(/~/.test(m.g)){   // 체스: 설계범위 + 최다(동률이면 나란히) 박스
      let badge='';
      if(ge.length){ const tc=ge[0][1]; const tops=ge.filter(e=>e[1]===tc).map(e=>e[0]);
        const txt = tops.length===1 ? '최다 '+esc(tops[0]) : esc(tops.slice(0,3).join('·'))+(tops.length>3?' 외':'');
        badge=` <span class="grade-badge">${txt}</span>`; }
      gradeCell = esc(m.g)+badge;
    } else {   // 에이스: 학년 고정 — 박스 하나
      gradeCell = `<span class="grade-badge">${esc(ge[0]?ge[0][0]:m.g)}</span>`;
    }
    h+=`<tr><td class="nm">${esc(m.k)} <span class="typetag ${m.t}" style="margin-left:5px">${m.t==='ace'?'에이스':'체스'}</span></td><td class="subc">${gradeCell}</td><td class="r"><b>${a.n}</b></td><td class="r">${avg}</td><td class="r">${a.pass}</td><td class="r">${a.enr}</td></tr>`;
  });
  h+=`</tbody></table></div>${anPager(exPg,examRows.length,EX_PER,'anExamPg')}</div>`;

  // ---- 배정 레벨 분포 (카드 현황판 · 인원 많은 순 · 6개씩 페이지) ----
  const lvAgg={}; att.forEach(r=>{ const t=examTypeOf(r); const lv=levelOf(r); if(t&&lv){ const k=t+'|'+lv; if(!lvAgg[k])lvAgg[k]={lv,t,n:0,enr:0}; lvAgg[k].n++; if(r.enrolled==='enrolled')lvAgg[k].enr++; } });
  const lvList=Object.values(lvAgg).sort((a,b)=> b.n-a.n || String(a.lv).localeCompare(String(b.lv)));
  const lvTotal=lvList.reduce((s,x)=>s+x.n,0);
  const LV_PER=6; const lvPages=Math.max(1,Math.ceil(lvList.length/LV_PER)); let lvPg=Math.min(Math.max(0,wonmuState.anLevelPage||0),lvPages-1);
  const lvSlice=lvList.slice(lvPg*LV_PER,(lvPg+1)*LV_PER);
  h+=`<div class="lt-card"><div class="lt-ch"><div class="t">배정 레벨 분포 <span class="hint">많은 순 · 레벨 ${lvList.length}종</span></div></div>`;
  if(!lvList.length){ h+=`<div class="empty-msg">성적 데이터가 없어요.</div>`; }
  else{
    h+=`<div class="lvgrid">`;
    lvSlice.forEach(x=>{ const pct=lvTotal?Math.round(x.n/lvTotal*100):0;
      h+=`<div class="lvcard ${x.t}"><div class="lvc-top"><span class="lname">${esc(x.lv)}</span><span class="ltag ${x.t==='ace'?'a':'c'}">${x.t==='ace'?'에이스':'체스'}</span></div><div class="lbig">${x.n}<small>명</small></div><div class="lsub">비율 ${pct}% · 등록 ${x.enr}</div></div>`;
    });
    h+=`</div>${anPager(lvPg,lvList.length,LV_PER,'anLevelPg')}`;
  }
  h+=`</div>`;
  h+=`</div>`;   // an-grid-exam 닫기

  // ---- 응시자 상세 (시험지별 등수 — D1·D2… 각 시험지 안에서 순위) ----
  const scoredByExam={};
  att.forEach(r=>{ const k=examLabel(r); const s=scoreOf(r); if(k&&s!=null){ (scoredByExam[k]=scoredByExam[k]||[]).push({id:r.id,s}); } });
  Object.keys(scoredByExam).forEach(k=>scoredByExam[k].sort((a,b)=>b.s-a.s));
  const rankOf=r=>{ const k=examLabel(r); const s=scoreOf(r); if(!k||s==null) return null; const arr=scoredByExam[k]||[]; const i=arr.findIndex(x=>x.id===r.id); return i<0?null:{rank:i+1,total:arr.length}; };
  const anGrade=wonmuState.anGrade||'all';
  const gradeOpts=[...new Set(att.map(r=>gradeTxt(r.grade)).filter(Boolean))].sort(gradeSort);
  const listRows=att.slice()
    .filter(r=> anGrade==='all' || gradeTxt(r.grade)===anGrade)
    .sort((a,b)=> (String(a.reserved_date)+String(a.reserved_time||'')).localeCompare(String(b.reserved_date)+String(b.reserved_time||'')));
  anLastRows=listRows;

  h+=`<div class="lt-card"><div class="lt-ch"><div class="t">응시자 상세 <span class="hint">${listRows.length}명 · 시험지 내 등수</span></div><div class="lt-ch-r">
    <div class="pick"><span>학년</span><select onchange="anSetGrade(this.value)"><option value="all" ${anGrade==='all'?'selected':''}>전체 학년</option>${gradeOpts.map(g=>`<option value="${esc(g)}" ${g===anGrade?'selected':''}>${esc(g)}</option>`).join('')}</select></div>
    <button class="lt-xlsxbtn" onclick="anExportCsv()"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>엑셀(CSV)</button></div></div>`;
  if(!listRows.length){ h+=`<div class="empty-msg">해당 학년 응시자가 없어요.</div>`; }
  else{
    const isAdmin=session.role==='admin';
    const LST_PER=10; const lstPages=Math.max(1,Math.ceil(listRows.length/LST_PER)); let lstPg=Math.min(Math.max(0,wonmuState.anListPage||0),lstPages-1);
    const lstSlice=listRows.slice(lstPg*LST_PER,(lstPg+1)*LST_PER);
    h+=`<div class="apptbl-wrap"><table class="apptbl"><thead><tr><th>날짜</th>${isAdmin?'<th>분원</th>':''}<th>학생</th><th>학교·학년</th><th>시험지</th><th>배정레벨</th><th class="r">총점</th><th class="r">시험지 내 등수</th><th>합격</th><th>등록</th></tr></thead><tbody>`;
    lstSlice.forEach(r=>{
      const dstr=String(r.reserved_date||'').slice(5).replace('-','/').replace(/^0/,'');
      const t=examTypeOf(r); const el=examLabel(r); const s=scoreOf(r); const lv=levelOf(r); const rk=rankOf(r);
      const meta=[esc(r.school||''),gradeTxt(r.grade)].filter(Boolean).join(' · ')||'·';
      const passTag = r.enrolled==='failed' ? '<span class="st fail">불합격</span>' : '<span class="st pass">합격</span>';
      const enrTag = r.enrolled==='enrolled'?'<span class="st enroll">등록</span>':r.enrolled==='not_enrolled'?'<span class="st noenr">미등록</span>':r.enrolled==='waiting_next'?'<span class="st waitn">다음학기대기</span>':r.enrolled==='failed'?'<span class="mut">–</span>':'<span class="mut">대기</span>';
      h+=`<tr><td class="dt">${dstr}</td>${isAdmin?`<td class="subc">${esc(bName(r.branch_id))}</td>`:''}<td class="stu">${esc(r.student_name||'')}${r.student_code?`<span class="code">${esc(r.student_code)}</span>`:''}</td>
        <td class="subc">${meta}</td>
        <td>${el?`<span class="typetag ${t||'ace'}">${esc(el)}</span>`:'<span class="mut">·</span>'}</td>
        <td class="subc">${lv?esc(lv):'<span class="mut">·</span>'}</td>
        <td class="r">${s!=null?s:'<span class="mut">·</span>'}</td>
        <td class="r">${rk?`<span class="rankpill">${rk.rank} / ${rk.total}</span>`:'<span class="mut">·</span>'}</td>
        <td>${passTag}</td><td>${enrTag}</td></tr>`;
    });
    h+=`</tbody></table></div>${anPager(lstPg,listRows.length,LST_PER,'anListPg')}`;
  }
  h+=`</div>`;
  return h;
}
function anExportCsv(){
  const head=['날짜','학생','학생코드','학교','학년','시험지','배정레벨','총점','시험지내등수','합격여부','등록여부'];
  const enrK={enrolled:'등록',not_enrolled:'미등록',waiting_next:'다음학기대기',failed:'불합격',pending:'대기'};
  const scoredByExam={};
  anLastRows.forEach(r=>{ const k=examLabel(r); const s=scoreOf(r); if(k&&s!=null){ (scoredByExam[k]=scoredByExam[k]||[]).push({id:r.id,s}); } });
  Object.keys(scoredByExam).forEach(k=>scoredByExam[k].sort((a,b)=>b.s-a.s));
  const rows=anLastRows.map(r=>{ const k=examLabel(r); const s=scoreOf(r); let rk=''; if(k&&s!=null){ const arr=scoredByExam[k]; const i=arr.findIndex(x=>x.id===r.id); if(i>=0) rk=`${i+1}/${arr.length}`; }
    return [String(r.reserved_date||'').slice(0,10), r.student_name||'', r.student_code||'', r.school||'', gradeTxt(r.grade), k||'', levelOf(r), s!=null?s:'', rk, r.enrolled==='failed'?'불합격':'합격', enrK[r.enrolled||'pending']||''];
  });
  const csv=[head,...rows].map(row=>row.map(c=>{ c=String(c==null?'':c); return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c; }).join(',')).join('\r\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='레벨테스트_응시자.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('응시자 명단을 내려받았어요 ✓');
}

/* 인원현황(renderInwon 등) → inwon.js 로 분리됨 */

let ltResults={};   // reservation_id → { id, assigned_level, total_score }
async function loadLtResults(){
  try{
    initSupabase();
    const { data, error } = await sb.from('level_test_results').select('id,reservation_id,assigned_level,total_score,report_type,exam_key,created_at').order('created_at',{ascending:true});
    if(error) throw error;
    ltResults={};
    (data||[]).forEach(r=>{ if(r.reservation_id) ltResults[r.reservation_id]=r; });  // 같은 예약 여러개면 최신 유지
  }catch(e){ console.error('성적 로드 실패', e); }
}
async function ensureReservations(){
  try{
    initSupabase();
    const { data, error } = await sb.from('level_test_reservations').select('*');
    if(error) throw error;
    reservations = data||[];
  }catch(e){ console.error('예약 로드 실패', e); toast('예약을 불러오지 못했어요','err'); reservations=[]; }
  await loadLtResults();
  await loadDelLogs();
  await loadExamDays();
  bookState.loaded=true;
}
let delLogs=[];   // 예약 삭제 기록 (감사용)
async function loadDelLogs(){
  try{
    initSupabase();
    const { data, error } = await sb.from('level_test_deletion_logs').select('*').order('deleted_at',{ascending:false}).limit(300);
    if(error) throw error;
    delLogs = data||[];
  }catch(e){ console.error('삭제기록 로드 실패', e); delLogs=[]; }  // 테이블 없거나 실패해도 앱은 계속
}

/* ---------- 시험채점 전체화면 오버레이 (grader.html을 iframe으로 꽉 차게) ---------- */
function openExam(){
  const _gq='sem='+encodeURIComponent(state.semId||'')+'&role='+encodeURIComponent(session.role||'')+'&branch='+encodeURIComponent(session.branchId||'')+'&user='+encodeURIComponent(session.teacherName||session.username||'')+'&v='+Date.now();
  let ov=document.getElementById('examOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='examOverlay'; document.body.appendChild(ov); }
  ov.className='lt-overlay';
  // 인원현황·교재관리와 동일한 형태의 상단바: ‹ 원무 홈 (이전페이지로) · 제목 · 새 탭으로 열기
  ov.innerHTML='<div class="lt-ov-bar">'
    +'<button class="lt-ov-close" onclick="examBack()">‹ 원무 홈</button>'
    +'<span class="lt-ov-title">시험채점</span>'
    +'<a class="lt-ov-open" href="grader.html?'+_gq+'" target="_blank" rel="noopener" style="margin-left:auto;font-size:12px;font-weight:700;color:#8b6ee8;text-decoration:none">새 탭으로 열기 ↗</a>'
    +'</div>'
    +'<iframe class="lt-ov-frame" src="grader.html?'+_gq+'" title="시험채점" allow="clipboard-write"></iframe>';
  document.body.style.overflow='hidden';
}
function closeExam(){ const ov=document.getElementById('examOverlay'); if(ov) ov.remove(); document.body.style.overflow=''; }
/* 시험채점 상단바 '‹ 원무 홈' — 오버레이 닫고 원무 홈(허브)으로 복귀 (인원현황/교재관리와 동일한 동작) */
function examBack(){
  closeExam();
  state.view='wonmu'; wonmuState.view='hub';
  if(typeof buildSidebar==='function') buildSidebar();
  render(); window.scrollTo(0,0);
}

/* ---------- 레벨테스트 채점/열람 오버레이 (leveltest/ 미니앱을 iframe으로) ---------- */
function ltOverlay(src){
  let ov=document.getElementById('ltOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='ltOverlay'; document.body.appendChild(ov); }
  ov.className='lt-overlay';
  ov.innerHTML=`<div class="lt-ov-bar"><button class="lt-ov-close" onclick="closeLevelTest()">‹ 닫기</button><span class="lt-ov-title">레벨테스트</span></div><iframe class="lt-ov-frame" src="${src}"></iframe>`;
  document.body.style.overflow='hidden';
}
function closeLevelTest(){ const ov=document.getElementById('ltOverlay'); if(ov) ov.remove(); document.body.style.overflow=''; }
function openScoreTest(rid){
  const r=reservations.find(x=>x.id===rid); if(!r){ toast('예약을 찾을 수 없어요','err'); return; }
  const q=new URLSearchParams({ rid:r.id, code:r.student_code||'', name:r.student_name||'', school:r.school||'', grade:r.grade||'', date:String(r.reserved_date||'').slice(0,10), branch:r.branch_id||'' });
  ltOverlay('leveltest/index.html?'+q.toString());
}
function openScoreView(resultId){ ltOverlay('leveltest/index.html?view='+encodeURIComponent(resultId)); }

/* ---------- 학부모 예약 안내 문자 양식 (복사용) ---------- */
const SMS_BRANCH = {
  '서수원': { addr:'금곡로 102번길 56 스카이빌딩 2층 (지하주차장 이용가능)' },
  '장안':   { addr:'대평로 80 정연메이저빌딩 10층' },
  '수원':   { elem:'권선로908번길 47 드림타워 5층 (초등관)', mid:'권선로908번길 50 TGE빌딩 3층 (중등관)' },
  '운정1':  { addr:'교하로 83 동광위너스프라자 5층' },
  '운정2':  { addr:'경의로1240번길 37-1 명품프라자3차 8층' },
  '남동탄': { addr:'동탄순환대로14길 77 트램프라자 5층' },
};
function branchSmsKey(bid){ return String(bName(bid)||'').replace(/\s/g,'').replace(/분원$/,''); }
function smsDateStr(r){
  const d=String(r.reserved_date||'').slice(0,10); if(!d) return '';
  const dt=new Date(d+'T00:00:00'); const dow=['일','월','화','수','목','금','토'][dt.getDay()];
  const t=String(r.reserved_time||'').slice(0,5);
  return `${dt.getMonth()+1}월 ${dt.getDate()}일(${dow})${t?' '+t:''}`;
}
function buildSmsText(r, exam, free){
  const key=branchSmsKey(r.branch_id); const info=SMS_BRANCH[key]||{};
  const header=`[${key||''}JLS-레벨테스트 예약 안내]`;
  let addr=info.addr||'';
  if(info.elem){ // 수원: 학년으로 초등관/중등관 자동 선택
    const g=String(r.grade||'');
    addr = /중/.test(g) ? info.mid : /초/.test(g) ? info.elem : (info.elem+'\n           '+info.mid);
  }
  const feeLine = free ? '*상담료: 무료'
    : `*상담료: ${exam==='ace'?'2만원':'1만원'}(카드결제만 가능합니다)\n-등록시 수강료에서 차감`;
  return [
    header,
    '안녕하세요. 학부모님.',
    '정상어학원 입니다.',
    '테스트 예약 안내 드립니다.',
    `*이름: ${r.student_name||''}`,
    `*테스트 날짜: ${smsDateStr(r)}`,
    feeLine,
    `*주소: ${addr}`,
    '테스트 일정 변경시 학원으로 연락주세요.',
    '감사합니다.'
  ].join('\n');
}
let smsState={ rid:null, exam:'chess', free:false };
function openSms(rid){ const r=reservations.find(x=>x.id===rid); if(!r){ toast('예약을 찾을 수 없어요','err'); return; } smsState={rid, exam:'chess', free:false}; renderSms(); }
function smsSetExam(e){ smsState.exam=e; renderSms(); }
function smsToggleFree(v){ smsState.free=v; renderSms(); }
function closeSms(){ const m=document.getElementById('smsModal'); if(m) m.remove(); }
async function copySms(){
  const t=document.getElementById('smsText'); if(!t) return;
  try{ await navigator.clipboard.writeText(t.value); toast('문자 양식이 복사됐어요 ✓'); }
  catch(e){ t.focus(); t.select(); try{ document.execCommand('copy'); toast('복사됐어요 ✓'); }catch(_){ toast('복사 실패 — 글상자를 직접 선택해 복사하세요','err'); } }
}
function renderSms(){
  const r=reservations.find(x=>x.id===smsState.rid); if(!r) return;
  let m=document.getElementById('smsModal'); if(!m){ m=document.createElement('div'); m.id='smsModal'; document.body.appendChild(m); }
  const msg=buildSmsText(r, smsState.exam, smsState.free);
  m.className='sms-modal';
  m.innerHTML=`<div class="sms-back" onclick="closeSms()"></div>
   <div class="sms-panel">
     <div class="sms-head"><div class="sms-t">학부모 예약 안내 문자</div><button class="sms-x" onclick="closeSms()">✕</button></div>
     <div class="sms-sub">${esc(r.student_name||'')} · ${esc(smsDateStr(r))} · ${esc(bName(r.branch_id))}</div>
     <div class="sms-ctrls">
       <div class="sms-seg">
         <button class="${smsState.exam==='chess'&&!smsState.free?'on':''}" ${smsState.free?'disabled':''} onclick="smsSetExam('chess')">체스 1만원</button>
         <button class="${smsState.exam==='ace'&&!smsState.free?'on':''}" ${smsState.free?'disabled':''} onclick="smsSetExam('ace')">에이스 2만원</button>
       </div>
       <label class="sms-free"><input type="checkbox" ${smsState.free?'checked':''} onchange="smsToggleFree(this.checked)"> 무료 상담 (상담료 면제)</label>
     </div>
     <textarea id="smsText" class="sms-text" rows="12">${esc(msg)}</textarea>
     <div class="sms-act"><button class="sms-copy" onclick="copySms()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="13" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>복사하기</button></div>
   </div>`;
}

function resBranchScope(){ return session.role==='admin' ? reservations : reservations.filter(r=>r.branch_id===session.branchId); }
function resBadge(r){
  if(r.status==='parent_only')    return '<span class="st parent">학부모만 참석</span>';
  if(r.enrolled==='enrolled')     return '<span class="st enroll">등록완료</span>';
  if(r.enrolled==='not_enrolled') return '<span class="st noenr">미등록</span>';
  if(r.enrolled==='failed')       return '<span class="st fail">미통과</span>';
  if(r.enrolled==='waiting_next') return '<span class="st waitn">다음학기 대기</span>';
  if(r.status==='noshow')         return '<span class="st noshow">노쇼</span>';
  if(r.status==='canceled')       return '<span class="st cancel">취소</span>';
  if(r.status==='attended')       return '<span class="st done">참석</span>';
  return '<span class="st booked">예약</span>';
}
function gradeTxt(g){ g=String(g||'').trim(); if(!g) return ''; let m;
  if(m=g.match(/^초\s*등?\s*(\d)/)) return '초등'+m[1];
  if(m=g.match(/^중\s*등?\s*(\d)/)) return '중등'+m[1];
  if(m=g.match(/^고\s*등?\s*(\d)/)) return '고등'+m[1];
  return /^\d+$/.test(g)?g+'학년':g; }

/* ============================================================================
   전형·설명회 날짜 설정 (lt_exam_days)
   레벨테스트 '날짜'에 성격을 붙인다. 학생마다 표시하지 않고 날짜 한 번만 표시하면
   그날 예약자가 통째로 그 전형으로 잡힌다.
     is_admission = 다음 학기 전형인가 (끄면 평소 레벨테스트)
     is_briefing  = 그날 설명회도 했는가
   '개별전형'은 별도 값이 아니라 전형 ON + 설명회 OFF 다. 분원은 그 단어를 볼 일이 없다.
   표가 아직 없어도 앱은 그냥 돌아간다(설정만 안 보임).
   ============================================================================ */
let examDays=[];
async function loadExamDays(){
  try{
    initSupabase();
    const { data, error } = await sb.from('lt_exam_days').select('*');
    if(error) throw error;
    examDays = data||[];
  }catch(e){ console.error('전형·설명회 설정 로드 실패(표 미생성일 수 있음)', e); examDays=[]; }
}
function edDs(d){ return String(d||'').slice(0,10); }
function edGet(branchId, ds){
  if(!branchId || branchId==='all') return null;
  return examDays.find(x=> x.branch_id===branchId && edDs(x.exam_date)===edDs(ds)) || null;
}
/* 같은 분원·같은 대상 학기에서 이 날이 몇 번째 설명회인지 (날짜순) */
function edNextNo(branchId, ds, semId){
  const mine=edDs(ds);
  const earlier=examDays.filter(x=> x.branch_id===branchId && x.is_briefing && x.target_semester===semId && edDs(x.exam_date)<mine).length;
  return earlier+1;
}
async function edSave(branchId, ds, patch){
  if(!curCanEdit()){ toast('수정 권한이 없습니다','err'); return false; }
  const cur = edGet(branchId, ds) || { id:uid('ed'), branch_id:branchId, exam_date:edDs(ds),
    is_admission:false, target_semester:null, is_briefing:false, briefing_no:null, attendees:null };
  const row = Object.assign({}, cur, patch, { updated_at:new Date().toISOString() });
  // 전형이 아니면 설명회도 대상 학기도 의미가 없다 → 같이 정리
  if(!row.is_admission){ row.is_briefing=false; row.briefing_no=null; row.attendees=null; row.target_semester=null; }
  if(!row.is_briefing){ row.briefing_no=null; row.attendees=null; }
  try{
    initSupabase();
    const { error } = await sb.from('lt_exam_days').upsert(row, { onConflict:'branch_id,exam_date' });
    if(error) throw error;
    const i=examDays.findIndex(x=> x.branch_id===branchId && edDs(x.exam_date)===edDs(ds));
    if(i>=0) examDays[i]=row; else examDays.push(row);
    return true;
  }catch(e){
    console.error('전형·설명회 설정 저장 실패', e);
    toast('저장 실패 — sql/lt_exam_days.sql 을 실행했는지 확인해 주세요','err');
    return false;
  }
}
async function edToggleAdmission(branchId, ds){
  const c=edGet(branchId, ds), on=!(c && c.is_admission);
  const ok=await edSave(branchId, ds, { is_admission:on, target_semester: on ? ((c&&c.target_semester)||nextSemId(state.semId)) : null });
  if(ok){ toast(on?'다음 학기 전형으로 표시했어요 ✓':'전형 표시를 껐어요'); renderWonmuBody(); }
}
async function edSetSemester(branchId, ds, v){
  const ok=await edSave(branchId, ds, { target_semester:v||null });
  if(ok){ toast('입학 대상 학기 저장됨 ✓'); renderWonmuBody(); }
}
async function edToggleBriefing(branchId, ds){
  const c=edGet(branchId, ds)||{};
  const on=!c.is_briefing, sem=c.target_semester||nextSemId(state.semId);
  // is_admission은 데이터 일관성용으로 같이 켜둔다(설명회 = 다음 학기 전형)
  const ok=await edSave(branchId, ds, { is_admission:on, target_semester: on?sem:null, is_briefing:on,
    briefing_no: on ? (c.briefing_no || edNextNo(branchId, ds, sem)) : null });
  if(ok){ toast(on?'설명회로 표시했어요 ✓':'설명회 표시를 껐어요'); renderWonmuBody(); }
}
async function edSetNo(branchId, ds, v){
  const n=parseInt(v,10);
  const ok=await edSave(branchId, ds, { briefing_no: isNaN(n)?null:n });
  if(ok){ toast('회차 저장됨 ✓'); renderWonmuBody(); }
}
/* 그날 예약의 진행 상황 — 참석·노쇼는 이미 예약마다 기록돼 있으니 세기만 하면 된다 */
function edDayStats(branchId, ds){
  const rs=reservations.filter(r=> r.branch_id===branchId && edDs(r.reserved_date)===edDs(ds));
  const s={book:rs.length, att:0, noshow:0, cancel:0, parent:0, fail:0, wait:0, enr:0, notenr:0};
  rs.forEach(r=>{
    if(r.status==='noshow') s.noshow++;
    else if(r.status==='canceled') s.cancel++;
    else if(r.status==='parent_only') s.parent++;
    if(isAttended(r)) s.att++;
    if(r.enrolled==='failed') s.fail++;
    else if(r.enrolled==='waiting_next') s.wait++;
    else if(r.enrolled==='enrolled') s.enr++;
    else if(r.enrolled==='not_enrolled') s.notenr++;
  });
  return s;
}
/* 캘린더 날짜 칸에 붙는 작은 딱지 */
function edDayTag(branchId, ds){
  // 개별전형은 켤 게 없으니 딱지도 없다 — 설명회 한 날만 표시
  const e=edGet(branchId, ds); if(!e || !e.is_briefing) return '';
  return '<div style="display:inline-block;font-size:9.5px;font-weight:800;border-radius:5px;padding:1px 5px;line-height:1.5;margin-top:2px;white-space:nowrap;background:#8b6ee8;color:#fff">설명회'+(e.briefing_no?' '+e.briefing_no+'차':'')+'</div>';
}
/* 선택한 날짜의 설정 패널 (분원이 특정됐을 때만) */
function edPanel(branchId, ds){
  if(!branchId || branchId==='all'){
    return '<div style="margin:0 14px 12px;padding:11px 13px;background:#faf8fe;border:1px dashed #e2dcf2;border-radius:11px;font-size:12px;color:#a9a2b6;line-height:1.6">'
      +'설명회 표시는 <b>분원을 하나 고른 뒤</b>에 할 수 있어요.</div>';
  }
  const e=edGet(branchId, ds) || {};
  const brf=!!e.is_briefing;
  const sem=e.target_semester || nextSemId(state.semId);
  const box='margin:0 14px 12px;border:1px solid #ece8f5;border-radius:12px;background:#fff;overflow:hidden';
  const rowS='display:flex;align-items:center;gap:10px;padding:11px 13px';
  const labS='font-size:12.5px;font-weight:800;color:#3a3742;flex:1';
  const sw=(on)=>'width:38px;height:21px;border-radius:11px;border:1px solid '+(on?'#8b6ee8':'#e2dcf2')+';background:'+(on?'#8b6ee8':'#f3f0fa')+';position:relative;flex:none;cursor:pointer;padding:0';
  const knob=(on)=>'<span style="position:absolute;top:2px;left:'+(on?'19px':'2px')+';width:15px;height:15px;border-radius:50%;background:'+(on?'#fff':'#a9a2b6')+';display:block"></span>';
  const subS='padding:0 13px 11px 24px;border-left:2px solid #f0ebfe;margin-left:13px;display:flex;flex-direction:column;gap:8px';
  const selS='background:#f6f3fc;border:1px solid #e2dcf2;border-radius:8px;padding:5px 8px;font:inherit;font-size:12px;font-weight:700;color:#8b6ee8;cursor:pointer';
  const flS='font-size:11.5px;font-weight:700;color:#7b7488;min-width:74px';
  let h='<div style="'+box+'">';
  h+='<div style="'+rowS+'"><span style="'+labS+'">설명회 진행</span>'
    +'<button style="'+sw(brf)+'" onclick="edToggleBriefing(\''+branchId+'\',\''+ds+'\')" aria-label="설명회 진행 켜기/끄기">'+knob(brf)+'</button></div>';
  if(brf){
    h+='<div style="'+subS+'">'
      +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="'+flS+'">입학 학기</span>'
      +'<select style="'+selS+'" onchange="edSetSemester(\''+branchId+'\',\''+ds+'\',this.value)">'
      + (function(){ const L=waitSemList().slice(); if(!L.some(x=>x.id===sem)) L.unshift({id:sem, name:semNameFromId(sem)});
          return L.map(x=>'<option value="'+x.id+'" '+(x.id===sem?'selected':'')+'>'+esc(x.name)+'</option>').join(''); })()
      +'</select></div>'
      +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="'+flS+'">회차</span>'
      +'<select style="'+selS+'" onchange="edSetNo(\''+branchId+'\',\''+ds+'\',this.value)">'
      + [1,2,3,4].map(n=>'<option value="'+n+'" '+(n===(e.briefing_no||1)?'selected':'')+'>'+n+'차</option>').join('')
      +'</select></div></div>';
  }
  h+='</div>';
  if(brf){
    const st=edDayStats(branchId, ds);
    h+='<div style="margin:0 14px 12px;padding:11px 13px;background:#f0ebfe;border-radius:11px;font-size:11.5px;color:#5b41b5;line-height:1.7">'
      +'이 날 예약이 <b>'+esc(semNameFromId(sem))+' 설명회 '+(e.briefing_no||1)+'차</b>로 집계됩니다.<br>'
      +'그날 예약은 <b>학생별 버튼을 누르지 않아도</b> 전부 이 설명회로 잡힙니다.<br>'
      +'예약 <b>'+st.book+'</b> · 참석 <b>'+st.att+'</b>'
      +(st.noshow?' · 노쇼 '+st.noshow:'')+(st.cancel?' · 취소 '+st.cancel:'')
      +(st.fail?' · 미통과 '+st.fail:'')+(st.wait?' · 대기 '+st.wait:'')
      +(st.enr?' · 등록 '+st.enr:'')+(st.notenr?' · 미등록 '+st.notenr:'')
      +'</div>';
  } else {
    h+='<div style="margin:0 14px 12px;padding:11px 13px;background:#faf8fe;border:1px dashed #e2dcf2;border-radius:11px;font-size:11.5px;color:#7b7488;line-height:1.7">'
      +'<b>설명회를 진행한 날이면</b> 켜주세요. 그러면 이 날 예약이 설명회전형으로 잡힙니다.<br>'
      +'<b>개별전형으로 볼 학생은 아래 학생별 버튼을 눌러</b> 표시하세요. 다음학기 대기로 처리한 학생은 자동으로 잡힙니다.</div>';
  }
  return h;
}
/* ── 예약마다 '다음 학기 입학용 시험'인지 표시 ──
   같은 날에도 그 학기에 바로 등록할 학생과 다음 학기에 등록할 학생이 섞여서
   날짜로는 가를 수 없다. 그래서 학생 한 명 단위로 켠다.
   '다음학기 대기'를 누른 학생은 wait_semester로 이미 알 수 있어 자동으로 잡힌다. */
function admSem(){ return nextSemId(state.semId); }
function isAdmRes(r){ const sm=admSem();
  return edBriefOn(r.branch_id, r.reserved_date, sm) || r.admission_semester===sm || r.wait_semester===sm; }
function admLabel(r){ const e=edGet(r.branch_id, r.reserved_date); return (e&&e.is_briefing)?'설명회전형':'개별전형'; }
function admToggleHtml(r){
  const sm=admSem(), on=r.admission_semester===sm;
  const base='font:inherit;font-size:10.5px;font-weight:800;border-radius:20px;padding:3px 10px;white-space:nowrap;flex:none';
  if(edBriefOn(r.branch_id, r.reserved_date, sm))
    return '<span title="설명회 진행일이라 이 날 예약은 전부 설명회전형으로 자동 집계됩니다" style="'+base+';border:1px solid #8b6ee8;background:#8b6ee8;color:#fff">설명회전형</span>';
  const auto=(!on && r.wait_semester===sm);
  if(auto) return '<span title="다음학기 대기를 눌러서 자동으로 전형에 포함됩니다" style="'+base+';border:1px solid #cfeaea;background:#e4f4f5;color:#1f8a95">전형 자동</span>';
  if(!curCanEdit()) return on?'<span style="'+base+';border:1px solid #8b6ee8;background:#8b6ee8;color:#fff">'+admLabel(r)+'</span>':'';
  const st = on ? base+';border:1px solid #8b6ee8;background:#8b6ee8;color:#fff;cursor:pointer'
                : base+';border:1px solid #e2dcf2;background:#fff;color:#a9a2b6;cursor:pointer';
  return '<button style="'+st+'" title="이 학생이 다음 학기 입학을 목표로 본 시험이면 켜세요" onclick="event.stopPropagation();toggleAdmRes(\''+r.id+'\')">'+admLabel(r)+'</button>';
}
async function toggleAdmRes(id){
  if(!curCanEdit()){ toast('수정 권한이 없습니다','err'); return; }
  const r=reservations.find(x=>x.id===id); if(!r) return;
  const sm=admSem(), on=(r.admission_semester!==sm);
  const ok=await updateReservation(id,{ admission_semester: on?sm:null });
  if(ok){ toast(on?(admLabel(r)+'으로 표시 ✓'):'전형 표시를 껐어요'); renderWonmuBody(); }
}
function renderBooking(c){
  const today=new Date();
  if(bookState.y==null){ bookState.y=today.getFullYear(); bookState.m=today.getMonth(); }
  if(bookState.branchId==null){ bookState.branchId = session.role==='admin' ? 'all' : session.branchId; }
  if(!bookState.loaded){
    c.innerHTML='<div class="book-loading">예약 불러오는 중…</div>';
    ensureReservations().then(()=>{ if(state.view==='wonmu' && wonmuState.view==='booking') renderWonmuBody(); });
    return;
  }
  const ym=`${bookState.y}-${_pad(bookState.m+1)}`;
  const scoped = resBranchScope().filter(r=> bookState.branchId==='all' ? true : r.branch_id===bookState.branchId );
  // 날짜별 건수
  const cnt={}; scoped.forEach(r=>{ if(r.reserved_date){ const d=String(r.reserved_date).slice(0,10); cnt[d]=(cnt[d]||0)+1; } });
  // 선택일 기본값
  if(!bookState.sel || !String(bookState.sel).startsWith(ym)){
    const todayStr=`${today.getFullYear()}-${_pad(today.getMonth()+1)}-${_pad(today.getDate())}`;
    if(todayStr.startsWith(ym)) bookState.sel=todayStr;
    else { const withRes=Object.keys(cnt).filter(k=>k.startsWith(ym)).sort(); bookState.sel=withRes[0]||`${ym}-01`; }
  }
  const daysIn=new Date(bookState.y, bookState.m+1, 0).getDate();
  const firstDow=new Date(bookState.y, bookState.m, 1).getDay();

  // 좌: 달력
  let cal=`<div class="card">
    <div class="cal-top"><div class="m">${bookState.y}년 ${bookState.m+1}월</div>
    <div class="cal-nav"><button onclick="calMove(-1)">‹</button><button onclick="calMove(1)">›</button></div></div>
    <div class="cal">
      <div class="dow sun">일</div><div class="dow">월</div><div class="dow">화</div><div class="dow">수</div><div class="dow">목</div><div class="dow">금</div><div class="dow sat">토</div>`;
  for(let i=0;i<firstDow;i++) cal+=`<div class="day empty"></div>`;
  for(let d=1; d<=daysIn; d++){
    const ds=`${ym}-${_pad(d)}`;
    const dow=new Date(bookState.y, bookState.m, d).getDay();
    const cls=[ 'day', dow===0?'sun':'', dow===6?'sat':'', ds===bookState.sel?'sel':'' ].filter(Boolean).join(' ');
    const n=cnt[ds];
    cal+=`<div class="${cls}" onclick="selDay('${ds}')"><div class="dn">${d}</div>${n?`<div class="cnt">${n}건</div>`:''}${edDayTag(bookState.branchId, ds)}</div>`;
  }
  cal+=`</div></div>`;

  // 우: 그날 목록
  const dayRes = scoped.filter(r=> String(r.reserved_date).slice(0,10)===bookState.sel )
                       .sort((a,b)=> String(a.reserved_time||'').localeCompare(String(b.reserved_time||'')) );
  const sd=new Date(bookState.sel+'T00:00:00');
  const dowKo=['일','월','화','수','목','금','토'][sd.getDay()];
  let list=`<div class="card"><div class="dl-top">
    <div class="d">${sd.getMonth()+1}월 ${sd.getDate()}일 <span>${dowKo}요일 · ${dayRes.length}건</span></div>
    <button class="addbtn" onclick="openAddForm()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>새 예약</button>
  </div>`;

  // 이 날짜의 성격(전형·설명회) 설정 — 그날 예약자가 통째로 이 전형으로 집계된다
  list+=edPanel(bookState.branchId, bookState.sel);

  // 추가 폼
  if(bookState.adding){
    const brOpts = db.branches.map(b=>`<option value="${b.id}" ${b.id===(bookState.branchId!=='all'?bookState.branchId:'')?'selected':''}>${esc(b.name)}</option>`).join('');
    list+=`<div class="add-form">
      <div class="af-grid">
        ${session.role==='admin'?`<label class="af-f af-2"><span>분원</span><select id="bk_branch">${brOpts}</select></label>`:''}
        <label class="af-f"><span>시간</span><input id="bk_time" type="time" value="16:00"></label>
        <label class="af-f"><span>학생코드</span><input id="bk_code"></label>
        <label class="af-f"><span>학생 이름 *</span><input id="bk_name" placeholder="이름"></label>
        <label class="af-f"><span>학부모 연락처</span><input id="bk_phone" placeholder="010-0000-0000"></label>
        <label class="af-f"><span>학교</span><input id="bk_school" placeholder="○○중"></label>
        <label class="af-f"><span>학년</span><input id="bk_grade" placeholder="초등2"></label>
        <label class="af-f af-2"><span>메모</span><input id="bk_memo" placeholder="선택"></label>
      </div>
      <div class="af-act"><button class="af-cancel" onclick="openAddForm()">취소</button><button class="af-save" onclick="submitReservation()">예약 등록</button></div>
    </div>`;
  }

  if(!dayRes.length && !bookState.adding){
    list+=`<div class="empty-msg">이 날짜에는 예약이 없어요.<br>‘새 예약’으로 추가해 보세요.</div>`;
  }
  dayRes.forEach(r=>{
    const meta=[ r.school, gradeTxt(r.grade) ].filter(Boolean).join(' · ');
    list+=`<div class="slot-wrap"><div class="slot" onclick="editRes('${r.id}')">
      <div class="time">${esc(String(r.reserved_time||'').slice(0,5))}</div>
      <div class="info"><div class="nm">${esc(r.student_name||'')}${r.student_code?`<span class="code">${esc(r.student_code)}</span>`:''}</div>
      <div class="meta">${esc(meta)||'<span class="mut">정보 미입력</span>'}</div></div>
      ${admToggleHtml(r)}${resBadge(r)}</div>`;
    if(bookState.editId===r.id){
      const st=r.status||'booked', en=r.enrolled||'pending';
      list+=`<div class="res-edit">
        <div class="re-row re-stu"><span class="re-l">학생 정보</span>
          <input id="bk_en_${r.id}" class="re-in" value="${esc(r.student_name||'')}" placeholder="이름">
          <input id="bk_es_${r.id}" class="re-in" value="${esc(r.school||'')}" placeholder="학교">
          <input id="bk_eg_${r.id}" class="re-in" value="${esc(r.grade||'')}" placeholder="학년">
          <input id="bk_ep_${r.id}" class="re-in" value="${esc(r.parent_phone||'')}" placeholder="연락처">
          <button class="re-save" onclick="saveResInfo('${r.id}')">저장</button>
        </div>
        <div class="re-row"><span class="re-l">참석 상태</span><div class="seg2 seg2-wrap">
          <button class="${st==='booked'?'on':''}" onclick="setResStatus('${r.id}','booked')">예약</button>
          <button class="${st==='attended'?'on b-pos':''}" onclick="setResStatus('${r.id}','attended')">참석</button>
          <button class="${st==='parent_only'?'on b-parent':''}" onclick="setResStatus('${r.id}','parent_only')">학부모만</button>
          <button class="${st==='noshow'?'on b-neg':''}" onclick="setResStatus('${r.id}','noshow')">노쇼</button>
          <button class="${st==='canceled'?'on':''}" onclick="setResStatus('${r.id}','canceled')">취소</button>
        </div></div>
        <div class="re-row"><span class="re-l">등록 여부</span><div class="seg2 seg2-wrap">
          <button class="${en==='pending'?'on':''}" onclick="setResEnrolled('${r.id}','pending')">대기</button>
          <button class="${en==='enrolled'?'on b-blue':''}" onclick="setResEnrolled('${r.id}','enrolled')">등록</button>
          <button class="${en==='not_enrolled'?'on b-neg':''}" onclick="setResEnrolled('${r.id}','not_enrolled')">미등록</button>
          <button class="${en==='failed'?'on b-fail':''}" onclick="setResEnrolled('${r.id}','failed')">미통과</button>
          <button class="${en==='waiting_next'?'on b-wait':''}" onclick="setResEnrolled('${r.id}','waiting_next')">다음학기 대기</button>
        </div></div>
        ${en==='failed'?`<div class="re-hint">성적 미달로 등록 불가 — 등록률 계산에서 제외돼요. 점수는 채점 결과가 자동 표시됩니다.</div>`:''}
        ${en==='waiting_next'?`<div class="re-row"><span class="re-l">대기 학기</span><select id="bk_wait_${r.id}" class="re-in" onchange="setWaitSemester('${r.id}',this.value)">${waitSemList().map(s=>`<option value="${s.id}" ${s.id===(r.wait_semester||nextSemId())?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div class="re-hint wait">시험은 통과, 다음 학기 등록 예정 — 해당 학기가 되면 로그인 시 상단에 연락 대상으로 떠요. (이번 학기 등록률엔 미등록으로 포함)</div>`:''}
        ${en==='not_enrolled'?`<div class="re-row"><span class="re-l">미등록 사유</span><input id="bk_reason_${r.id}" class="re-in" value="${esc(r.not_enrolled_reason||'')}" placeholder="예: 거리·시간·비용"><button class="re-save" onclick="saveResReason('${r.id}')">저장</button></div>`:''}
        <div class="re-row"><span class="re-l">날짜 이동</span><input id="bk_date_${r.id}" class="re-in re-date" type="date" value="${esc(String(r.reserved_date||'').slice(0,10))}"><input id="bk_time_${r.id}" class="re-in re-time" type="time" value="${esc(String(r.reserved_time||'').slice(0,5))}"><button class="re-save" onclick="moveReservation('${r.id}')">이동</button></div>
        <div class="re-row"><span class="re-l">레벨테스트</span><button class="re-score" onclick="openScoreTest('${r.id}')">채점하기</button>${ltResults[r.id]?`<button class="re-score-view" onclick="openScoreView('${ltResults[r.id].id}')">성적표 보기</button>`:''}</div>
        <div class="re-row"><span class="re-l">학부모 문자</span><button class="re-sms" onclick="openSms('${r.id}')">예약 안내 문자 복사</button></div>
        ${r.parent_phone?`<div class="re-info">학부모 연락처 · ${esc(r.parent_phone)}</div>`:''}
        ${bookState.delConfirm===r.id
          ? `<div class="re-del-confirm"><span class="re-l">삭제 사유</span><input id="del_reason_${r.id}" class="re-in" placeholder="예: 중복 입력 / 오입력"><button class="re-del-yes" onclick="confirmDelete('${r.id}')">삭제 확정</button><button class="re-del-no" onclick="cancelDelete()">취소</button></div>`
          : `<div class="re-del"><button onclick="askDelete('${r.id}')">예약 삭제</button></div>`}
      </div>`;
    }
  });
  list+=`</div>`;

  // 상단 분원 필터(본사만)
  let head='';
  if(session.role==='admin'){
    const opts=`<option value="all" ${bookState.branchId==='all'?'selected':''}>전체 분원</option>`+db.branches.map(b=>`<option value="${b.id}" ${b.id===bookState.branchId?'selected':''}>${esc(b.name)}</option>`).join('');
    head=`<div class="book-bar"><div class="pick"><span>분원</span><select onchange="branchFilterChange(this.value)">${opts}</select></div>
      <div class="book-hint">날짜를 고르면 그날 예약이 시간순으로 보여요</div></div>`;
  }else{
    const br=db.branches.find(b=>b.id===session.branchId);
    head=`<div class="book-bar"><div class="book-scope">${esc(br?br.name:'우리 분원')}</div><div class="book-hint">날짜를 고르면 그날 예약이 시간순으로 보여요</div></div>`;
  }

  c.innerHTML=head+`<div class="grid2 book-grid">${cal}${list}</div>`;
}

/* ---- 달력/목록 조작 ---- */
function calMove(delta){ let m=bookState.m+delta, y=bookState.y; if(m<0){m=11;y--;} if(m>11){m=0;y++;} bookState.m=m; bookState.y=y; bookState.sel=null; bookState.adding=false; bookState.editId=null; renderWonmuBody(); }
function selDay(ds){ bookState.sel=ds; bookState.adding=false; bookState.editId=null; renderWonmuBody(); }
function openAddForm(){ bookState.adding=!bookState.adding; bookState.editId=null; renderWonmuBody(); }
function editRes(id){ bookState.editId = bookState.editId===id?null:id; bookState.adding=false; renderWonmuBody(); }
function branchFilterChange(v){ bookState.branchId=v; bookState.sel=null; bookState.editId=null; bookState.adding=false; renderWonmuBody(); }

/* ---- Supabase 쓰기 ---- */
async function addReservation(obj){
  if(!curCanEdit()){ toast('뷰어 계정은 수정 권한이 없습니다','err'); return false; }
  try{
    const { data, error } = await sb.from('level_test_reservations').insert(obj).select();
    if(error) throw error;
    if(data && data[0]){ reservations.push(data[0]); return data[0]; }
    return true;
  }catch(e){ console.error('예약 저장 실패', e); toast('저장 실패: '+(e.message||e),'err'); return false; }
}
async function updateReservation(id,patch){
  if(!curCanEdit()){ toast('뷰어 계정은 수정 권한이 없습니다','err'); return false; }
  try{
    const { data, error } = await sb.from('level_test_reservations').update(patch).eq('id',id).select();
    if(error) throw error;
    const i=reservations.findIndex(r=>r.id===id); if(i>=0 && data && data[0]) reservations[i]=data[0];
    return true;
  }catch(e){ console.error('예약 수정 실패', e); toast('수정 실패: '+(e.message||e),'err'); return false; }
}
async function submitReservation(){
  const g=id=>{ const el=$('bk_'+id); return el?el.value.trim():''; };
  const branchId = session.role==='admin' ? ($('bk_branch')?$('bk_branch').value:null) : session.branchId;
  const time=g('time'), name=g('name');
  if(!branchId){ toast('분원을 선택하세요','err'); return; }
  if(!time){ toast('시간을 입력하세요','err'); return; }
  if(!name){ toast('학생 이름을 입력하세요','err'); return; }
  const obj={
    branch_id: branchId,
    student_code: g('code')||null,
    student_name: name,
    parent_phone: g('phone')||null,
    school: g('school')||null,
    grade: g('grade')||null,
    reserved_date: bookState.sel,
    reserved_time: time,
    manager: null,
    memo: g('memo')||null,
    status:'booked', enrolled:'pending'
  };
  const created=await addReservation(obj);
  if(created){ bookState.adding=false; toast('예약이 등록됐어요 ✓'); renderWonmuBody(); if(created.id) openSms(created.id); }
}
async function setResStatus(id,st){ const ok=await updateReservation(id,{status:st}); if(ok){ toast('상태 변경됨 ✓'); renderWonmuBody(); } }
/* '등록' 버튼은 이번 학기 등록이라는 뜻이다. 다음 학기에 올 학생을 여기서 등록하면
   원무 대기명단에도, 다음 학기 신규생 명단에도 영영 안 들어간다.
   그래서 누를 때마다 어느 학기인지 반드시 고르게 한다. */
function resEnrollAsk(id){
  const r=reservations.find(x=>x.id===id); if(!r) return;
  if(!curCanEdit()){ toast('수정 권한이 없습니다','err'); return; }
  const curNm=semNameFromId(state.semId), nxtNm=semNameFromId(nextSemId(state.semId));
  const adm=isAdmRes(r);
  const btn='width:100%;text-align:left;border-radius:12px;padding:13px 15px;cursor:pointer;font:inherit;margin-top:9px';
  waitModalOpen(
    '<div style="font-weight:800;font-size:16.5px">'+esc(r.student_name||'학생')+' — 어느 학기 등록인가요?</div>'
   +'<div style="font-size:12.5px;color:#7b7488;margin-top:4px">고른 학기에 따라 처리가 완전히 달라집니다.</div>'
   +(adm?'<div style="margin-top:12px;background:#f0ebfe;color:#5b41b5;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700">이 예약은 <b>'+esc(nxtNm)+' 전형</b>으로 표시돼 있습니다.</div>':'')
   +'<button style="'+btn+';border:1.5px solid #8b6ee8;background:#f6f3fc" onclick="resEnrollNext(\''+r.id+'\')">'
     +'<div style="font-size:14px;font-weight:800;color:#5b41b5">'+esc(nxtNm)+'에 등록합니다</div>'
     +'<div style="font-size:11.5px;color:#7b7488;line-height:1.6;margin-top:3px">'
     +'<b>다음학기 대기</b>로 표시됩니다. 원무 › 레벨테스트 위쪽 <b>대기명단</b>에 뜨고,'
     +' 반배정이 끝나면 거기서 <b>'+esc(nxtNm)+' 등록</b>을 눌러야 인원 현황 신규생으로 들어갑니다.</div></button>'
   +'<button style="'+btn+';border:1px solid #e2dcf2;background:#fff" onclick="resEnrollNow(\''+r.id+'\')">'
     +'<div style="font-size:14px;font-weight:800;color:#3a3742">'+esc(curNm)+'에 등록했습니다</div>'
     +'<div style="font-size:11.5px;color:#a9a2b6;line-height:1.6;margin-top:3px">'
     +'이번 학기 등록으로만 잡힙니다. <b>'+esc(nxtNm)+' 신규생 명단에는 들어가지 않습니다.</b></div></button>'
   +'<div style="display:flex;justify-content:flex-end;margin-top:14px">'
     +'<button style="border:1px solid #e2dcf2;background:#fff;border-radius:9px;padding:8px 14px;cursor:pointer;font:inherit;font-size:12.5px" onclick="waitModalClose()">취소</button></div>');
}
async function resEnrollNext(id){
  waitModalClose();
  await setResEnrolledRaw(id,'waiting_next');
  toast('다음학기 대기로 표시했습니다 — 반배정 후 대기명단에서 등록하세요');
}
async function resEnrollNow(id){ waitModalClose(); await setResEnrolledRaw(id,'enrolled'); }
async function setResEnrolled(id,en){
  if(en==='enrolled'){ resEnrollAsk(id); renderWonmuBody(); return; }
  return setResEnrolledRaw(id,en);
}
async function setResEnrolledRaw(id,en){
  const r=reservations.find(x=>x.id===id);
  const patch={enrolled:en};
  if(en!=='not_enrolled') patch.not_enrolled_reason=null;
  // ★ wait_semester는 지우지 않는다.
  //   '어느 학기 대기였다가 등록·미등록했는지'가 전형 현황의 유일한 근거라,
  //   지워버리면 대기 → 등록 전환을 영영 셀 수 없다.
  if(en==='waiting_next' && (!r || !r.wait_semester)) patch.wait_semester=nextSemId();  // 다음학기대기 기본값 = 다음 학기
  // ★ 등록결과(등록완료·미등록·미통과·다음학기대기)를 정했다는 건 시험을 봤다는 뜻
  //   → 상태가 '예약'이면 '참석'으로 자동 승격. (parent_only·취소·노쇼는 의도된 상태라 안 건드림)
  const attendedOutcome = (en==='enrolled'||en==='not_enrolled'||en==='failed'||en==='waiting_next');
  if(attendedOutcome && r && (!r.status || r.status==='booked')) patch.status='attended';
  const ok=await updateReservation(id,patch); if(ok){ toast('등록 여부 변경됨 ✓'); renderWonmuBody(); }
}
async function setWaitSemester(id,sem){ const ok=await updateReservation(id,{wait_semester:sem||null}); if(ok) toast('대기 학기 저장됨 ✓'); }
async function saveResReason(id){ const el=$('bk_reason_'+id); const v=el?el.value.trim():''; const ok=await updateReservation(id,{not_enrolled_reason:v||null}); if(ok) toast('사유 저장됨 ✓'); }
async function saveResInfo(id){
  const g=k=>{ const e=$(k+id); return e?e.value.trim():''; };
  const name=g('bk_en_');
  if(!name){ toast('이름을 입력하세요','err'); return; }
  const ok=await updateReservation(id,{ student_name:name, school:g('bk_es_')||null, grade:g('bk_eg_')||null, parent_phone:g('bk_ep_')||null });
  if(ok){ toast('학생 정보 수정됨 ✓'); renderWonmuBody(); }
}
async function moveReservation(id){
  const d=$('bk_date_'+id), t=$('bk_time_'+id);
  const nd=d?d.value:''; const nt=t?t.value:'';
  if(!nd){ toast('옮길 날짜를 선택하세요','err'); return; }
  const ok=await updateReservation(id,{reserved_date:nd, reserved_time:nt||null});
  if(ok){ bookState.sel=nd; bookState.editId=null; bookState.adding=false; toast(`${(+nd.slice(5,7))}월 ${(+nd.slice(8,10))}일로 옮겼어요 ✓`); renderWonmuBody(); }
}
function askDelete(id){ bookState.delConfirm=id; renderWonmuBody(); }
function cancelDelete(){ bookState.delConfirm=null; renderWonmuBody(); }
async function confirmDelete(id){
  const el=$('del_reason_'+id); const reason=el?el.value.trim():'';
  await deleteReservation(id, reason);
}
async function deleteReservation(id, reason){
  if(!curCanEdit()){ toast('뷰어 계정은 삭제 권한이 없습니다','err'); return false; }
  const r=reservations.find(x=>x.id===id);
  try{
    // 1) 삭제 전에 로그부터 기록 (로그 실패 시 삭제 중단 — 기록 없는 삭제 방지)
    if(r){
      const log={ reservation_id:id, branch_id:r.branch_id||null, student_code:r.student_code||null,
        student_name:r.student_name||null, school:r.school||null, grade:r.grade||null,
        reserved_date:r.reserved_date||null, reserved_time:r.reserved_time||null,
        status_at_delete:r.status||null, enrolled_at_delete:r.enrolled||null,
        reason:reason||null, deleted_by:(session&&(session.teacherName||session.username))||'알수없음' };
      const { error:logErr } = await sb.from('level_test_deletion_logs').insert(log);
      if(logErr) throw logErr;
    }
    // 2) 실제 삭제
    const { error } = await sb.from('level_test_reservations').delete().eq('id',id);
    if(error) throw error;
    reservations = reservations.filter(r=>r.id!==id);
    bookState.editId=null; bookState.delConfirm=null; toast('예약이 삭제됐어요 (기록 남김)'); renderWonmuBody();
  }catch(e){ console.error('예약 삭제 실패', e); toast('삭제 실패: '+(e.message||e),'err'); }
}

/* ---------- IMS 엑셀 업로드 → 레벨테스트 자동 등록 ---------- */
function triggerExcelUpload(){ const inp=$('ltXlsx'); if(inp){ inp.value=''; inp.click(); } }
function xlDate(s){ const m=String(s==null?'':s).match(/(\d{4})[.\-/\s]+(\d{1,2})[.\-/\s]+(\d{1,2})/); return m?`${m[1]}-${_pad(+m[2])}-${_pad(+m[3])}`:null; }
function xlPhone(s){ const d=String(s==null?'':s).replace(/[^0-9]/g,''); return d.length===11?`${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`:(d||null); }
/* 분원명 핵심어만 남김 — IMS의 '○○정상어학원'·'○○어학CHESS관' 같은 표기를 분원명과 맞추기 위함.
   ('관'·'점' 같은 한 글자는 지우지 않음 → 관악분원 등이 깨지지 않도록) */
function _brCore(s){ return String(s||'').replace(/\s/g,'').replace(/CHESS관|정상어학원|어학원|정상|어학|학원|분원|캠퍼스/g,''); }
/* 여러 후보(장소·분원명)를 받아 가장 잘 맞는 분원을 찾음.
   1) 원문 그대로 정확/포함  2) 핵심어(core) 정확  3) 핵심어 포함(가장 구체적인=긴 것 우선)
   → '수원'과 '수원장안'처럼 겹치는 이름도 더 구체적인 쪽으로 정확히 매칭 */
function matchBranch(...places){
  const cands=places.flat().map(x=>String(x==null?'':x).replace(/\s/g,'')).filter(Boolean);
  if(!cands.length) return null;
  const list=(db.branches||[]).map(b=>({id:b.id, raw:String(b.name||'').replace(/\s/g,''), core:_brCore(b.name)})).filter(x=>x.raw);
  // 1) 원문(공백제거) 정확 일치
  for(const p of cands){ const hit=list.find(x=>x.raw===p); if(hit) return hit.id; }
  // 2) 핵심어 정확 일치
  for(const p of cands){ const pc=_brCore(p); if(pc){ const hit=list.find(x=>x.core===pc); if(hit) return hit.id; } }
  // 3) 핵심어 포함 — 가장 구체적인 것 우선: (a)코어가 긴 것(서수원>수원) (b)같으면 글자상 더 뒤에 나오는 것(수원'장안'→장안)
  for(const p of cands){ const pc=_brCore(p)||p;
    const hit=list.filter(x=>x.core&&pc.includes(x.core))
      .sort((a,b)=> b.core.length-a.core.length || pc.lastIndexOf(b.core)-pc.lastIndexOf(a.core))[0];
    if(hit) return hit.id; }
  // 4) 반대 포함(분원명이 파일 글자를 포함) — 가장 짧은(구체적인) 것
  for(const p of cands){ const pc=_brCore(p);
    const hit=list.filter(x=>x.raw.includes(p)||(pc&&x.core.includes(pc))).sort((a,b)=>a.raw.length-b.raw.length)[0];
    if(hit) return hit.id; }
  return null;
}
async function handleExcelFile(ev){
  if(!curCanEdit()){ toast('뷰어 계정은 업로드 권한이 없습니다','err'); return; }
  const file=ev.target && ev.target.files && ev.target.files[0]; if(!file) return;
  if(typeof XLSX==='undefined'){ toast('엑셀 라이브러리를 불러오지 못했어요','err'); return; }
  toast('엑셀 읽는 중…');
  try{
    if(!bookState.loaded) await ensureReservations();
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    let hi=rows.findIndex(r=>Array.isArray(r)&&r.map(x=>String(x).trim()).includes('이름')&&r.map(x=>String(x).trim()).includes('예약일'));
    if(hi<0){ toast('예약 명단 형식이 아니에요 (헤더 못 찾음)','err'); return; }
    const H=rows[hi].map(x=>String(x==null?'':x).trim());
    const col=n=>H.indexOf(n);
    const cB=col('장소'), cB2=col('분원명'), cD=col('예약일'), cT=col('예약시간'),
      cN=col('이름'), cC=col('회원코드')>=0?col('회원코드'):col('아이디'),
      cS=col('학교'), cG=col('학년'), cP=col('학부모 연락처'), cM=col('공지'), cR=col('접수자');
    if(cN<0||cD<0){ toast('이름·예약일 칸을 못 찾았어요','err'); return; }
    const seen=new Set(reservations.map(r=>`${r.branch_id}|${(r.student_code||r.student_name||'').trim()}|${String(r.reserved_date).slice(0,10)}|${String(r.reserved_time||'').slice(0,5)}`));
    // ★ 분원 계정이 올리면 파일의 장소/분원명을 신뢰하지 않고 '내 분원'으로 고정.
    //   (운정1이 올렸는데 파일 장소칸이 운정2로 매칭돼 엉뚱한 분원에 들어가는 사고 방지)
    //   어드민만 여러 분원 섞인 파일을 파일값(matchBranch)으로 분배.
    const forcedBranch = (session && session.role!=='admin') ? (session.branchId||null) : null;
    const toInsert=[]; let dup=0, noBr=0, bad=0;
    for(let i=hi+1;i<rows.length;i++){
      const r=rows[i]; if(!r) continue;
      const name=String(r[cN]==null?'':r[cN]).trim(); if(!name) continue;
      const branchId = forcedBranch || matchBranch(cB>=0?r[cB]:'', cB2>=0?r[cB2]:'');
      if(!branchId){ noBr++; continue; }
      const date=xlDate(r[cD]); if(!date){ bad++; continue; }
      const time=String(r[cT]==null?'':r[cT]).trim().slice(0,5);
      const code=String(r[cC]==null?'':r[cC]).trim();
      const memo=String(r[cM]==null?'':r[cM]).trim();
      const canceled=memo.includes('[취소]')||/^취소/.test(memo);
      const key=`${branchId}|${(code||name).trim()}|${date}|${time}`;
      if(seen.has(key)){ dup++; continue; }
      seen.add(key);
      toInsert.push({ branch_id:branchId, student_code:code||null, student_name:name,
        parent_phone:xlPhone(r[cP]), school:String(r[cS]==null?'':r[cS]).trim()||null,
        grade:String(r[cG]==null?'':r[cG]).trim()||null, reserved_date:date, reserved_time:time,
        manager:null, memo:memo||null,
        status:canceled?'canceled':'booked', enrolled:'pending' });
    }
    if(!toInsert.length){ toast(`추가할 새 예약 없음${dup?` · 중복 ${dup}건`:''}${noBr?` · 분원매칭실패 ${noBr}건`:''}`); return; }
    const { data, error } = await sb.from('level_test_reservations').insert(toInsert).select();
    if(error){ console.error(error); toast('등록 실패: '+error.message,'err'); return; }
    if(data) reservations.push(...data);
    let msg=`${(data?data.length:toInsert.length)}건 등록됨`;
    if(dup) msg+=` · 중복 ${dup} 건너뜀`;
    if(noBr) msg+=` · 분원매칭 실패 ${noBr}`;
    if(bad) msg+=` · 날짜오류 ${bad}`;
    toast(msg+' ✓');
    renderWonmuBody();
  }catch(e){ console.error('엑셀 처리 실패', e); toast('엑셀을 읽지 못했어요 — 형식을 확인해주세요','err'); }
}

/* ---------- 업무 모듈 stub ---------- */
function renderStub(c,m){
  c.innerHTML=`<div class="page-h"><div><h2><span class="h-ic">${icon(m.ic,24)}</span><span class="em">${m.name}</span></h2><p>${m.sub}</p></div></div>
  <div class="stub"><div class="big">${icon(m.ic,46)}</div><h3>${m.name} 모듈</h3>
  <p>이 영역은 곧 실제 기능으로 채워집니다.<br>아래 세부 메뉴들이 여기에 들어올 예정이에요.</p>
  <div class="chips">${m.items.map(i=>`<span class="chip">${i[0]}</span>`).join('')}</div></div>`;
}

/* ---------- 권한 설정 ---------- */
const LEVELS=['안보임','보기','수정','삭제'];
let permEditRole='branch', permOpened={wonmu:true};
function renderPerm(c){
  const roles=[['admin','관리자 (본사)'],['branch','분원 관리자'],['teacher','선생님'],['assistant','보조']];
  const saved=loadPerms(); const cur=saved[permEditRole]||ROLE_PRESET[permEditRole];
  let h=`<div class="page-h"><div><h2><span class="h-ic">${icon('perm',24)}</span><span class="em">권한 설정</span></h2><p>역할을 고르고 메뉴별 권한을 지정하세요. (v1은 모듈 단위로 적용 — 세부 항목은 기능 완성 시 연결)</p></div></div>`;
  h+=`<div class="bar-ctl"><span class="lbl">설정 역할</span>
    <select onchange="permEditRole=this.value;renderPerm(document.getElementById('content'))">${roles.map(r=>`<option value="${r[0]}" ${r[0]===permEditRole?'selected':''}>${r[1]}</option>`).join('')}</select>
    <div class="presets"><span class="pl">프리셋:</span>
      <button class="preset-btn" onclick="applyPreset('admin')">본사</button>
      <button class="preset-btn" onclick="applyPreset('branch')">분원관리자</button>
      <button class="preset-btn" onclick="applyPreset('teacher')">선생님</button>
      <button class="save-btn" onclick="doSavePerm()">저장</button></div></div>`;
  h+=`<div class="legend2"><span><span class="kdot" style="background:var(--neg)"></span>안보임</span><span><span class="kdot" style="background:var(--warn)"></span>보기</span><span><span class="kdot" style="background:var(--brand)"></span>수정</span><span><span class="kdot" style="background:#6d4fd0"></span>삭제</span></div>`;
  h+='<div class="tree">';
  const allMods=MODULES.concat([{key:'perm',ic:'perm',name:'권한 설정',sub:'이 화면 접근 권한 (메타)',items:[]}]);
  allMods.forEach(m=>{
    const lv=(cur[m.key]!=null)?cur[m.key]:0;
    h+=`<div class="cat"><div class="cat-head">
      <div class="cat-ic">${icon(m.ic)}</div><div><div class="cat-nm">${m.name}</div><div class="cat-sub">${m.sub}</div></div>
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

/* ================= 계정 관리 (관리자 전용) ================= */
function reloadUsers(){
  return sb.from('users').select('*').then(({data,error})=>{
    if(error){ console.error(error); return; }
    const t=TABLES.find(x=>x.key==='users'); db.users=(data||[]).map(t.fromRow);
  });
}
function reloadBranches(){
  return sb.from('branches').select('*').then(({data,error})=>{
    if(error){ console.error(error); return; }
    const t=TABLES.find(x=>x.key==='branches'); db.branches=(data||[]).map(t.fromRow);
  });
}
/* 분원 관리 카드 (어드민 전용) — 분원 목록 + 삭제 */
function accBranchCard(){
  if(session.role!=='admin') return '';
  const rows=(db.branches||[]).map(b=>{
    const nRec=(db.semesterRecords||[]).filter(r=>r.branchId===b.id).length;
    const nUser=(db.users||[]).filter(u=>u.branchId===b.id).length;
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:9px;margin-bottom:6px">
      <div><b>${esc(b.name)}</b> <span style="color:var(--ink-3);font-size:12px">· 기록 ${nRec} · 계정 ${nUser}</span></div>
      <button onclick="delBranch('${b.id}')" style="border:1px solid #f3cdcf;color:#d03b3b;background:#fff;border-radius:7px;padding:5px 13px;font:inherit;font-weight:700;font-size:12.5px;cursor:pointer">삭제</button>
    </div>`;
  }).join('');
  return `<div class="acc-card"><div class="acc-h">분원 관리 <span style="font-weight:600;color:var(--ink-3);font-size:12px">— 어드민 전용 · 삭제는 되돌릴 수 없어요</span></div>${rows||'<div style="color:var(--ink-3);font-size:13px">분원이 없어요</div>'}</div>`;
}
async function delBranch(id){
  if(session.role!=='admin'){ toast('권한이 없어요','err'); return; }
  const b=(db.branches||[]).find(x=>x.id===id); if(!b) return;
  const nRec=(db.semesterRecords||[]).filter(r=>r.branchId===id).length;
  const nUser=(db.users||[]).filter(u=>u.branchId===id).length;
  let msg='‘'+b.name+'’ 분원을 삭제할까요?';
  if(nRec||nUser) msg+='\n\n⚠️ 이 분원에 학생 기록 '+nRec+'건, 계정 '+nUser+'개가 남아 있어요.\n분원만 삭제되고 그 데이터는 남습니다(소속 없는 데이터가 됨).\n정말 삭제하려면 확인을 누르세요.';
  if(!confirm(msg)) return;
  try{
    const { error }=await sb.from('branches').delete().eq('id',id);
    if(error) throw error;
    await reloadBranches();
    if(accView.branch===id) accView.branch='';
    renderAccounts($('content'));
    toast(b.name+' 분원 삭제됨 ✓');
  }catch(e){ console.error(e); toast('삭제 실패 — '+(e.message||''),'err'); }
}
/* 계정관리 분원 드롭다운: 일반 선택 or "＋ 새 분원 추가…" */
function onAcBranchChange(v){
  if(v==='__add__'){ addBranchPrompt(); return; }
  accView.branch=v; renderAccounts($('content'));
}
async function addBranchPrompt(){
  const name=(prompt('추가할 분원 이름을 입력하세요 (예: 아산탕정분원)')||'').trim();
  if(!name){ renderAccounts($('content')); return; }                 // 취소 → 드롭다운 원상복구
  const dup=(db.branches||[]).find(b=>b.name===name);
  if(dup){ toast('이미 있는 분원이에요'); accView.branch=dup.id; renderAccounts($('content')); return; }
  try{
    const id=uid('br');
    const { error }=await sb.from('branches').insert({id, name});
    if(error) throw error;
    await reloadBranches();
    accView.branch=id;
    toast('분원 추가됨: '+name+' ✓');
  }catch(e){ console.error(e); toast('분원 추가 실패 — '+(e.message||''),'err'); }
  renderAccounts($('content'));
}
function tierLabelOf(u){
  if(u.role==='admin') return u.isManager?'본사 관리자':'본사 일반';
  if(u.role==='branch') return u.isManager?'분원 관리자':'분원 일반';
  if(u.role==='teacher') return '담임';
  return u.role||'-';
}
function menusTextOf(u){
  if(u.isManager) return '전체';
  if(u.role==='teacher') return '담임 화면';
  try{ const a=JSON.parse(u.menus||'[]'); return a.length? a.map(k=>MENU_LABEL[k]||k).join(', ') : '지정 없음'; }catch(e){ return '지정 없음'; }
}
/* ---- 계정관리 v2 상태/헬퍼 ---- */
let accView={ mode:'roster', editId:null, branch:null };
function accSetMode(m){ accView.mode=m; renderAccounts($('content')); }
function openAccEdit(id){ accView.editId=id; renderAccounts($('content')); try{ window.scrollTo({top:0,behavior:'smooth'}); const el=$('content'); if(el&&el.scrollIntoView) el.scrollIntoView({block:'start',behavior:'smooth'}); }catch(e){} }
function accScopeIsHQ(){ return session.role==='admin'; }
function titleLabel(tk){ return (TITLE_MAP[tk]&&TITLE_MAP[tk].label)||''; }
function tierClass(u){ if(u.canManage) return 'mgr'; if(u.title==='teacher'||u.role==='teacher') return 'tea'; return 'mem'; }
function capText(u){ const p=[]; if(u.canManage)p.push('계정관리'); p.push(u.canEdit?'수정':'뷰어'); if(u.active===false)p.push('비활성'); return p.join(' · '); }
function titleOptionsFor(){ const keys=accScopeIsHQ()?HQ_TITLES:BR_TITLES; return TITLES.filter(t=>keys.includes(t.k)); }
// 로스터 선생님 이름(해당 분원, 계정 미보유자만)
function rosterTeacherNames(branchId){
  const semId=state.semId;                                   // 현재 선택 학기 기준
  const set=new Set();
  (db.semesterRecords||[]).forEach(r=>{
    if(semId && r.semesterId!==semId) return;
    if(branchId && r.branchId!==branchId) return;
    String(r.teacher||'').split(',').forEach(t=>{ t=t.trim(); if(t&&t!=='미배정') set.add(t); });  // 담임 2명(콤마) 분리
  });
  const used=new Set((db.users||[]).filter(u=>u.teacherName).map(u=>u.teacherName));
  return [...set].filter(n=>!used.has(n)).sort((a,b)=>a.localeCompare(b));
}
// 메뉴 체크박스 트리
/* 메뉴 권한(계층·가로) — 처음엔 상위 4개만, 누르면 그 아래가 가로로 펼쳐짐. 원무·총무는 묶음(권한 아님). */
const MTREE_CSS=`<style>
.mtree .mrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.mtree .chip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line,#e7e3f2);border-radius:10px;padding:7px 12px;font-size:13.5px;font-weight:700;color:var(--ink-1,#2f2b3a);background:#fff;cursor:pointer;user-select:none}
.mtree .chip .bx{width:15px;height:15px;border:1.6px solid #cfc7e6;border-radius:4px;flex:none;position:relative}
.mtree .chip.on{background:var(--soft,#f3f0fc);border-color:var(--brand,#7C5CFF);color:var(--brand,#7C5CFF)}
.mtree .chip.on .bx{background:var(--brand,#7C5CFF);border-color:var(--brand,#7C5CFF)}
.mtree .chip.on .bx::after{content:'';position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.mtree .chip .arw{color:var(--ink-3,#9a94ad);font-size:11px;margin-left:1px}
.mtree .mpanel{margin:8px 0 0 14px;padding:10px 12px;border-left:2.5px solid #e0d8f5;background:var(--surface-2,#faf9ff);border-radius:0 10px 10px 0}
.mtree .mpanel .mpt{font-size:11.5px;font-weight:800;color:var(--brand,#7C5CFF);margin-bottom:8px}
</style>`;
function nodeExpanded(node,S){ return (node.k&&S.has(node.k)) || (node.sub&&node.sub.some(c=>nodeExpanded(c,S))); }
function menuChip(node,S){
  const isGroup=!node.k, hasKids=node.sub&&node.sub.length;
  const checked = node.k?S.has(node.k):false;
  const exp = hasKids && nodeExpanded(node,S);
  const on = checked || (isGroup&&exp);
  const pid = hasKids ? 'mp_'+(node.k||node.label) : '';
  return `<label class="chip ${on?'on':''}"><input type="checkbox" ${node.k?`value="${node.k}"`:'data-group="1"'} ${on?'checked':''} ${pid?`data-panel="${pid}"`:''} onchange="mtoggle(this)" style="position:absolute;opacity:0;width:0;height:0"><span class="bx"></span>${esc(node.label)}${hasKids?' <span class="arw">▾</span>':''}</label>`;
}
function menuRow(nodes,S){
  const chips = nodes.map(n=>menuChip(n,S)).join('');
  const panels = nodes.filter(n=>n.sub&&n.sub.length).map(n=>{
    const pid='mp_'+(n.k||n.label);
    return `<div class="mpanel" id="${pid}" style="display:${nodeExpanded(n,S)?'block':'none'}"><div class="mpt">${esc(n.label)}</div>${menuRow(n.sub,S)}</div>`;
  }).join('');
  return `<div class="mrow">${chips}</div>${panels}`;
}
function menuChkHtml(sel){ const S=new Set(sel||[]); return `${MTREE_CSS}<div class="mtree">${menuRow(MENU_TREE,S)}</div>`; }
function mtoggle(cb){
  const chip=cb.closest('.chip'); if(chip) chip.classList.toggle('on', cb.checked);
  const pid=cb.dataset.panel;
  if(pid){ const panel=document.getElementById(pid);
    if(panel){ panel.style.display=cb.checked?'block':'none';
      if(!cb.checked){ panel.querySelectorAll('input[type=checkbox]').forEach(c=>{ c.checked=false; const cl=c.closest('.chip'); if(cl)cl.classList.remove('on'); if(c.dataset.panel){ const pp=document.getElementById(c.dataset.panel); if(pp)pp.style.display='none'; } }); }
    }
  }
  if(cb.checked){ let panel=cb.closest('.mpanel');   // 하위 체크 시 상위(원무·인원현황) 자동 켜기
    while(panel){ const op=document.querySelector('input[data-panel="'+panel.id+'"]'); if(op&&!op.checked){ op.checked=true; const ol=op.closest('.chip'); if(ol)ol.classList.add('on'); } panel=panel.parentElement&&panel.parentElement.closest('.mpanel'); }
  }
}
function readMenuChk(){ const a=[]; document.querySelectorAll('#acMenus input[type=checkbox]').forEach(b=>{ if(b.checked && !b.dataset.group && b.value) a.push(b.value); });
  if(a.some(k=>k.indexOf('inwon.')===0) && a.indexOf('inwon')<0) a.push('inwon');   // 세부 있으면 인원현황 접근권한 보장
  return a; }
// 직급 바꿔도 메뉴는 자동 체크 안 함(사람이 직접 선택). 단, 담임은 시험채점만 자동 체크.
function onTitleChange(){
  const tk=$('acTitle')?$('acTitle').value:''; const T=TITLE_MAP[tk]||{};
  if(tk==='teacher'){ const host=$('acMenus'); const row=host&&host.querySelector('.amrow'); if(row) row.innerHTML=menuChkHtml(['grading']); }
  const et=$('acEditWrap'); if(et) et.style.display=T.editToggle?'flex':'none';
}
function renderAccounts(c){
  const isHQ=accScopeIsHQ();
  const editing = accView.editId ? (db.users||[]).find(u=>u.id===accView.editId) : null;
  let h=`<div class="page-h"><div><h2><span class="h-ic">${icon('perm',24)}</span><span class="em">계정 관리</span></h2><p>아이디를 만들고 직급·권한을 지정하세요.</p></div></div>`;
  h += editing ? accEditCard(editing) : accCreateCard(isHQ);
  h += accListCard();
  h += accBranchCard();
  c.innerHTML=h;
  if(!editing) onTitleChange();   // 생성카드 초기 프리셋
}
function accCreateCard(isHQ){
  const mode = isHQ ? 'manual' : (accView.mode||'roster');   // 본사(admin)는 항상 직접입력
  const brId = isHQ ? (accView.branch||'') : session.branchId;
  const names = rosterTeacherNames(brId||session.branchId);
  const titles = titleOptionsFor();
  let h=`<div class="acc-card"><div class="acc-h">새 계정 만들기</div>`;
  if(!isHQ){   // 분원 계정관리에서만 모드 토글(선생님 드롭다운/직접입력)
    const btn=(m,l)=>`<button type="button" onclick="accSetMode('${m}')" style="padding:5px 12px;border-radius:7px;border:1px solid var(--line);background:${mode===m?'var(--brand)':'var(--surface-2)'};color:${mode===m?'#fff':'var(--ink-2)'};font-size:12.5px;cursor:pointer">${l}</button>`;
    h+=`<div style="display:flex;gap:6px;margin-bottom:12px">${btn('roster','선생님 목록에서')}${btn('manual','직접 입력')}</div>`;
  }
  h+=`<div class="acc-form">`;
  if(isHQ) h+=`<div class="af"><label>분원</label><select id="acBranch" onchange="onAcBranchChange(this.value)"><option value="">본사</option>${(db.branches||[]).map(b=>`<option value="${b.id}" ${b.id===brId?'selected':''}>${esc(b.name)}</option>`).join('')}<option value="__add__">＋ 새 분원 추가…</option></select></div>`;
  if(mode==='roster') h+=`<div class="af"><label>선생님</label><select id="acName">${names.length?names.map(n=>`<option>${esc(n)}</option>`).join(''):'<option value="">등록 가능한 선생님 없음</option>'}</select></div>`;
  else h+=`<div class="af"><label>이름</label><input id="acName" placeholder="이름"></div>`;
  h+=`<div class="af"><label>아이디</label><input id="acUser" autocomplete="off"></div>`;
  h+=`<div class="af"><label>비밀번호</label><input id="acPw" autocomplete="off"></div>`;
  h+=`<div class="af"><label>직급</label><select id="acTitle" onchange="onTitleChange()">${titles.map(t=>`<option value="${t.k}">${t.label}</option>`).join('')}</select></div>`;
  h+=`<div class="af" id="acEditWrap" style="display:none;align-items:center"><label>수정 권한</label><label class="amchk"><input type="checkbox" id="acEdit"> 허용</label></div>`;
  h+=`</div>`;
  h+=`<div class="acc-menus" id="acMenus"><div class="aml">이 계정이 볼 메뉴</div><div class="amrow">${menuChkHtml([])}</div></div>`;
  h+=`<button class="acc-btn" onclick="createAccount()">＋ 계정 생성</button></div>`;
  return h;
}
function accEditCard(u){
  const titles=titleOptionsFor(); let sel=[]; try{sel=JSON.parse(u.menus||'[]');}catch(e){}
  const T=TITLE_MAP[u.title]||{};
  let h=`<div class="acc-card"><div class="acc-h">계정 편집 — ${esc(u.username)}${u.teacherName?' ('+esc(u.teacherName)+')':''} <button type="button" onclick="accView.editId=null;renderAccounts($('content'))" style="float:right;border:none;background:var(--surface-2);border-radius:6px;padding:2px 9px;cursor:pointer">닫기</button></div>`;
  h+=`<div class="acc-form">`;
  h+=`<div class="af"><label>직급</label><select id="acTitle" onchange="onTitleChange()">${titles.map(t=>`<option value="${t.k}" ${t.k===u.title?'selected':''}>${t.label}</option>`).join('')}</select></div>`;
  h+=`<div class="af" id="acEditWrap" style="display:${T.editToggle?'flex':'none'};align-items:center"><label>수정 권한</label><label class="amchk"><input type="checkbox" id="acEdit" ${u.canEdit?'checked':''}> 허용</label></div>`;
  h+=`<div class="af" style="align-items:center"><label>상태</label><label class="amchk"><input type="checkbox" id="acActive" ${u.active!==false?'checked':''}> 재직(해제 시 비활성)</label></div>`;
  h+=`<div class="af"><label>새 비밀번호</label><input id="acPw" placeholder="바꿀 때만 입력"></div>`;
  h+=`</div>`;
  h+=`<div class="acc-menus" id="acMenus"><div class="aml">이 계정이 볼 메뉴</div><div class="amrow">${menuChkHtml(sel)}</div></div>`;
  h+=`<button class="acc-btn" onclick="saveAccountEdit('${u.id}')">저장</button></div>`;
  return h;
}
function accListCard(){
  const isHQ=accScopeIsHQ();
  let users;
  if(isHQ) users=(db.users||[]).filter(u=> HQ_TITLES.includes(u.title) || (!u.title && (u.role==='admin' || (u.role==='branch'&&u.canManage))) );
  else users=(db.users||[]).filter(u=> u.branchId===session.branchId || u.id===session.userId);
  const rank=u=> u.title==='admin'?0 : u.canManage?1 : (u.title==='teacher'||u.role==='teacher')?4 : 2;
  users.sort((a,b)=> rank(a)-rank(b) || String(a.username||'').localeCompare(b.username||''));
  let h=`<div class="acc-card"><div class="acc-h">계정 목록 <span class="acc-cnt">${users.length}</span></div>`;
  if(!users.length) h+=`<div class="empty-msg">계정이 없어요.</div>`;
  users.forEach(u=>{
    const isMe=u.id===session.userId;
    const brName=(db.branches.find(b=>b.id===u.branchId)||{}).name||((u.role==='admin')?'본사':'');
    const lbl=u.title?titleLabel(u.title):tierLabelOf(u);
    h+=`<div class="acc-row" style="${u.active===false?'opacity:.5':''}">
      <div class="acc-u"><b>${esc(u.username)}</b>${u.teacherName?`<span class="acc-nm">${esc(u.teacherName)}</span>`:''}${brName?`<span class="acc-nm">${esc(brName)}</span>`:''}</div>
      <div><span class="acc-badge ${tierClass(u)}">${esc(lbl)}</span></div>
      <div class="acc-mn">${esc(capText(u))}</div>
      <div class="acc-act">${isMe?`<button onclick="resetAccountPw('${u.id}')">내 비번</button>`:`<button onclick="openAccEdit('${u.id}')">편집</button> <button onclick="delAccount('${u.id}')" style="color:var(--neg)">삭제</button>`}</div>
    </div>`;
  });
  h+=`</div>`;
  return h;
}
async function createAccount(){
  const isHQ=accScopeIsHQ();
  const name=($('acName')?$('acName').value:'').trim();
  const user=($('acUser')?$('acUser').value:'').trim();
  const pw=($('acPw')?$('acPw').value:'').trim();
  const tk=$('acTitle').value; const T=TITLE_MAP[tk]||{};
  if(!user||!pw){ toast('아이디와 비밀번호를 입력하세요','err'); return; }
  if((db.users||[]).some(u=>u.username===user)){ toast('이미 존재하는 아이디입니다','err'); return; }
  const branchId = T.tier==='hq' ? null : (isHQ ? (accView.branch||null) : session.branchId);
  if(T.tier!=='hq' && !branchId){ toast('분원을 선택하세요','err'); return; }
  const role = T.tier==='hq' ? 'admin' : (tk==='teacher'?'teacher':'branch');
  const canEdit = T.editToggle ? !!($('acEdit')&&$('acEdit').checked) : !!T.edit;
  const row={ id:uid('u'), username:user, password:pw, role, teacher_name:name||null, branch_id:branchId,
    is_manager:!!T.manage, menus:JSON.stringify(readMenuChk()), title:tk, active:true, can_manage:!!T.manage, can_edit:canEdit };
  try{ const { error }=await sb.from('users').insert(row); if(error) throw error;
    await reloadUsers(); toast('계정 생성 완료 ✓'); accView.editId=null; renderAccounts($('content'));
  }catch(e){ console.error(e); toast('생성 실패: '+(e.message||''),'err'); }
}
async function saveAccountEdit(id){
  const u=(db.users||[]).find(x=>x.id===id); if(!u) return;
  const tk=$('acTitle').value; const T=TITLE_MAP[tk]||{};
  const canEdit = T.editToggle ? !!($('acEdit')&&$('acEdit').checked) : !!T.edit;
  const patch={ title:tk, menus:JSON.stringify(readMenuChk()), can_manage:!!T.manage, can_edit:canEdit,
    active:!!($('acActive')&&$('acActive').checked), is_manager:!!T.manage,
    role: T.tier==='hq'?'admin':(tk==='teacher'?'teacher':'branch') };
  const np=($('acPw')?$('acPw').value:'').trim(); if(np) patch.password=np;
  try{ const { error }=await sb.from('users').update(patch).eq('id',id); if(error) throw error;
    await reloadUsers(); toast('저장됨 ✓'); accView.editId=null; renderAccounts($('content'));
  }catch(e){ console.error(e); toast('저장 실패: '+(e.message||''),'err'); }
}
async function resetAccountPw(id){
  const u=(db.users||[]).find(x=>x.id===id); if(!u) return;
  const np=prompt(`${u.username} 계정의 새 비밀번호:`); if(np==null) return;
  if(!np.trim()){ toast('비밀번호를 입력하세요','err'); return; }
  try{ const { error }=await sb.from('users').update({password:np.trim()}).eq('id',id); if(error) throw error; await reloadUsers(); toast('비밀번호 변경됨 ✓'); }
  catch(e){ toast('변경 실패','err'); }
}
async function delAccount(id){
  const u=(db.users||[]).find(x=>x.id===id); if(!u) return;
  if(!confirm(`${u.username} 계정을 완전히 삭제할까요?\n되돌릴 수 없습니다. (임시 정지는 편집→재직 해제를 쓰세요)`)) return;
  try{ const { error }=await sb.from('users').delete().eq('id',id); if(error) throw error; await reloadUsers(); toast('삭제됨'); renderAccounts($('content')); }
  catch(e){ console.error(e); toast('삭제 실패: '+(e.message||''),'err'); }
}
async function changeMyPw(){
  const u=curUser(); if(!u||!u.id){ toast('세션 확인 필요','err'); return; }
  const np=prompt('새 비밀번호를 입력하세요:'); if(np==null) return;
  if(!np.trim()){ toast('비밀번호를 입력하세요','err'); return; }
  try{ const { error }=await sb.from('users').update({password:np.trim()}).eq('id',u.id); if(error) throw error; await reloadUsers(); toast('비밀번호가 변경되었습니다 ✓'); }
  catch(e){ toast('변경 실패','err'); }
}
window.accSetMode=accSetMode; window.openAccEdit=openAccEdit; window.onTitleChange=onTitleChange; window.createAccount=createAccount; window.saveAccountEdit=saveAccountEdit; window.resetAccountPw=resetAccountPw; window.delAccount=delAccount; window.changeMyPw=changeMyPw;

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
window.wonmuGo=wonmuGo; window.ltSetPeriod=ltSetPeriod; window.ltSetFilter=ltSetFilter; window.ltSetListBranch=ltSetListBranch; window.ltSetPage=ltSetPage; window.ltSetSearch=ltSetSearch; window.toggleDelLog=toggleDelLog; window.openBranchCalendar=openBranchCalendar; window.triggerExcelUpload=triggerExcelUpload;
window.ltSetTab=ltSetTab; window.anSetBranch=anSetBranch; window.anSetType=anSetType; window.anSetPeriod=anSetPeriod; window.anSetGrade=anSetGrade; window.anExportCsv=anExportCsv; window.anExamPg=anExamPg; window.anLevelPg=anLevelPg; window.anListPg=anListPg;
window.ltSetGrade=ltSetGrade; window.ltTip=ltTip; window.ltTipHide=ltTipHide; window.ltTipPage=ltTipPage;
window.openScoreTest=openScoreTest; window.openScoreView=openScoreView; window.closeLevelTest=closeLevelTest; window.openResInCalendar=openResInCalendar;
window.openExam=openExam; window.closeExam=closeExam; window.examBack=examBack;
window.setDashView=setDashView; window.mgSetRange=mgSetRange; window.mgSetBranch=mgSetBranch; window.delBranch=delBranch; window.mgSetLtRange=mgSetLtRange;
window.banSetBranch=banSetBranch; window.downloadBanXlsx=downloadBanXlsx;
window.openSms=openSms; window.smsSetExam=smsSetExam; window.smsToggleFree=smsToggleFree; window.closeSms=closeSms; window.copySms=copySms;
window.addEventListener('message', async (e)=>{
  if(e.data && e.data.type==='lt-saved'){
    closeLevelTest();
    await ensureReservations();
    if(state.view==='wonmu') renderWonmuBody();
    toast('레벨테스트 결과가 저장됐어요 ✓');
  }
});
window.calMove=calMove; window.selDay=selDay; window.openAddForm=openAddForm; window.editRes=editRes; window.branchFilterChange=branchFilterChange;
window.submitReservation=submitReservation; window.setResStatus=setResStatus; window.setResEnrolled=setResEnrolled; window.resEnrollAsk=resEnrollAsk; window.resEnrollNext=resEnrollNext; window.resEnrollNow=resEnrollNow; window.setWaitSemester=setWaitSemester; window.saveResReason=saveResReason; window.saveResInfo=saveResInfo; window.deleteReservation=deleteReservation; window.askDelete=askDelete; window.confirmDelete=confirmDelete; window.cancelDelete=cancelDelete; window.toggleDelLog=toggleDelLog; window.moveReservation=moveReservation;
$('loginBtn').addEventListener('click', doLogin);
$('loginPw').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
$('logoutBtn').addEventListener('click', logout);
{ const _x=$('ltXlsx'); if(_x) _x.addEventListener('change', handleExcelFile); }
boot();