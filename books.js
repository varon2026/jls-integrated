/* ==========================================================================
   books.js — 총무 › 교재 재고관리 모듈
   ① 총무 첫 화면 = 교재비 입금현황 카드 (admin=6분원 컴팩트 리스트 / 분원=자기분원 요약)
   ② "교재 시스템 열기" → 교재 앱(로컬 사본) 전체화면 임베드 + 분원별 자동로그인
   교재 데이터는 메인 DB(jls-counseling)의 bk_ 테이블로 통합됨(2026-08 이전 완료).
   ========================================================================== */

const BOOKS_APP_URL = 'books-app/index.html';
let chongmuView = 'hub';   // 'hub' | 'books'
function chongmuGo(v){ chongmuView = v; if(state.view==='chongmu') render(); window.scrollTo(0,0); }

/* ===== 6개 분원 (교재코드 ↔ 이름) ===== */
const BOOKS_BRANCHES = [
  {code:'seosuwonjls',  name:'서수원'},
  {code:'suwonjls2009', name:'장안'},
  {code:'suwon_jls',    name:'수원'},
  {code:'unjeongjls',   name:'운정1'},
  {code:'unjeongjls2',  name:'운정2'},
  {code:'namdongtanjls',name:'남동탄'}
];
const BOOKS_NAME = (code)=>{ const b=BOOKS_BRANCHES.find(x=>x.code===code); return b?b.name:code; };

/* 통합 분원 → 교재 앱 분원코드 (이름 기준, 공백·"분원" 제거 후 매칭) */
function booksBranchCode(){
  if(session.role==='admin') return 'varon';            // 관리자 = 전체
  const nm = String((typeof bName==='function'?bName(session.branchId):'')||'').replace(/\s/g,'').replace(/분원$/,'');
  const map = {'서수원':'seosuwonjls','장안':'suwonjls2009','수원':'suwon_jls','운정1':'unjeongjls','운정2':'unjeongjls2','남동탄':'namdongtanjls','바론':'baronbooks'};
  return map[nm] || '';
}
/* 이 계정이 입금현황에서 볼 분원 코드들 (admin=6개 / 분원=자기 1개) */
function booksScopeCodes(){
  if(session.role==='admin') return BOOKS_BRANCHES.map(b=>b.code);
  const c = booksBranchCode();
  return (c && c!=='varon' && c!=='baronbooks') ? [c] : [];
}

/* ===== 교재 Supabase 직접 조회 (입금현황 집계용) ===== */
const BOOKS_SB_URL='https://hplndiuoohantbalixwu.supabase.co/rest/v1';
const BOOKS_SB_KEY='sb_publishable_xO8KB46SzMx8KeuEE-OVSw_su22mv9X';
const BOOKS_SB_HEADERS={'apikey':BOOKS_SB_KEY,'Authorization':'Bearer '+BOOKS_SB_KEY};
async function booksSb(table, params){
  const t = (table.indexOf('bk_')===0) ? table : ('bk_'+table);   // 메인 통합: 교재 테이블은 bk_ 접두어
  const all=[]; let from=0; const size=1000;                        // 페이지 단위로 전량 읽기(데이터 많아도 누락 방지)
  while(true){
    const r=await fetch(BOOKS_SB_URL+'/'+t+'?'+params, {headers:Object.assign({},BOOKS_SB_HEADERS,{'Range-Unit':'items','Range':from+'-'+(from+size-1)})});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const rows=await r.json();
    if(Array.isArray(rows)) all.push(...rows); else return rows;
    if(!Array.isArray(rows) || rows.length<size) break;
    from+=size;
  }
  return all;
}

/* ===== 집계 (순수함수 · 테스트 대상) =====
   교재 시스템 자체 통계와 동일: 학기 구분 없이 학생별로 판매(출고)합·입금합을 모아 미수금 계산.
   학생별: 청구 c = Σ sales.total, 입금 p = Σ payments.paid_amount
   분원 집계: charged += c, paid += min(c,p), unpaid += max(0,c-p)  → 항상 charged = paid + unpaid */
function aggBooksPayments(sales, payments, branchCodes){
  const sidOf=(id,name)=> (id&&id!=='null'&&id!=='')?('#'+id):('@'+(name||'__no__'));
  const keyOf=(b,id,name)=> b+'||'+sidOf(id,name);

  const charged={};
  sales.forEach(r=>{
    const b=r.branch; if(branchCodes.indexOf(b)<0) return;
    const k=keyOf(b,r.student_id,r.student_name);
    charged[k]=(charged[k]||0)+Number(r.total||0);
  });
  const paid={};
  payments.forEach(p=>{
    const b=p.branch; if(branchCodes.indexOf(b)<0) return;
    const k=keyOf(b,p.student_id,p.student_name);
    paid[k]=(paid[k]||0)+Number(p.paid_amount||0);
  });
  const per={};
  branchCodes.forEach(b=>{ per[b]={code:b, name:BOOKS_NAME(b), sem:'', charged:0, paid:0, unpaid:0, students:0, unpaidStudents:0}; });
  Object.keys(charged).forEach(k=>{
    const b=k.split('||')[0]; if(!per[b]) return;
    const c=charged[k], p=paid[k]||0;
    per[b].charged += c;
    per[b].paid    += Math.min(c,p);
    const bal=Math.max(0,c-p);
    per[b].unpaid  += bal;
    per[b].students++;
    if(bal>0) per[b].unpaidStudents++;
  });
  branchCodes.forEach(b=>{ per[b].rate = per[b].charged>0 ? Math.round(per[b].paid/per[b].charged*100) : null; });
  return branchCodes.map(b=>per[b]);
}

/* ===== 입금현황 로드(비동기) + 캐시 (스코프 바뀌면 자동 재조회) ===== */
let booksPay = { status:'idle', rows:null, error:null, scopeKey:null };   // idle|loading|ok|error
function loadBooksPay(force){
  const codes = booksScopeCodes();
  const key = codes.join(',');
  if(!codes.length){ booksPay={status:'error', rows:null, error:'분원코드 매핑 없음', scopeKey:key}; return Promise.resolve(); }
  // 같은 스코프면 재요청 안 함(로딩/완료/에러 모두) — 에러 시 무한 재조회 방지. 새로고침(force)만 재시도
  if(!force && booksPay.scopeKey===key && booksPay.status!=='idle') return Promise.resolve();
  booksPay={status:'loading', rows:null, error:null, scopeKey:key};
  const inList = '('+codes.join(',')+')';
  const salesP = booksSb('sales_history','select=branch,semester,sale_date,student_id,student_name,total&type=eq.'+encodeURIComponent('출고')+'&branch=in.'+inList);
  const pmtsP  = booksSb('payments','select=branch,semester,student_id,student_name,paid_amount&branch=in.'+inList);
  return Promise.all([salesP, pmtsP]).then(([sales, pmts])=>{
    booksPay={ status:'ok', rows:aggBooksPayments(sales||[], pmts||[], codes), error:null, scopeKey:key };
  }).catch(e=>{
    booksPay={ status:'error', rows:null, error:(e&&e.message)||'조회 실패', scopeKey:key };
  }).then(()=>{ if(state.view==='chongmu' && chongmuView==='hub') render(); });
}
function refreshBooksPay(){ loadBooksPay(true); render(); }

/* ===== 화면 조각 ===== */
const won = n => (typeof fmt==='function'?fmt(Math.round(n||0)):Math.round(n||0).toLocaleString())+'원';
/* 파스텔 쿨톤 스케일 (높음=소프트블루 → 보라 → 오키드 → 로즈), 초록·쨍한 색 제거 */
function payColor(r){ if(r==null) return '#cfc8dd'; if(r>=80) return '#8fb4e6'; if(r>=55) return '#a892e2'; if(r>=30) return '#c59fd4'; return '#e0a7b9'; }

/* ===== 운영비 요약 (자체 Supabase ktizqd 직접 조회) ===== */
const EXP_SB_URL='https://hplndiuoohantbalixwu.supabase.co/rest/v1';
const EXP_SB_KEY='sb_publishable_xO8KB46SzMx8KeuEE-OVSw_su22mv9X';
const EXP_SB_HEADERS={'apikey':EXP_SB_KEY,'Authorization':'Bearer '+EXP_SB_KEY};
function expSb(table, params){
  return fetch(EXP_SB_URL+'/'+table+'?'+params, {headers:Object.assign({},EXP_SB_HEADERS,{'Range-Unit':'items','Range':'0-99999'})})
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
}
function expCurYM(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
/* 운영비 앱은 entries.branch 에 "분원 표시명"(코드 아님)을 저장한다 */
const EXP_BRANCHES=[
  {key:'남동탄 분원', name:'남동탄'},
  {key:'수원 분원',   name:'수원'},
  {key:'장안 분원',   name:'장안'},
  {key:'서수원 분원', name:'서수원'},
  {key:'운정 1분원',  name:'운정1'},
  {key:'운정 2분원',  name:'운정2'}
];
const EXP_NAME=(key)=>{ const b=EXP_BRANCHES.find(x=>x.key===key); return b?b.name:key; };
/* 통합 분원 → 운영비 분원 표시명 */
function expBranchKey(){
  const nm=String((typeof bName==='function'?bName(session.branchId):'')||'').replace(/\s/g,'').replace(/분원$/,'');
  const map={'남동탄':'남동탄 분원','수원':'수원 분원','장안':'장안 분원','서수원':'서수원 분원','운정1':'운정 1분원','운정2':'운정 2분원'};
  return map[nm]||'';
}
function expScopeKeys(){
  if(session.role==='admin') return EXP_BRANCHES.map(b=>b.key);
  const k=expBranchKey(); return k?[k]:[];
}
/* 집계(순수함수): 분원별 현재시재(누적 입금-지출) + 이번달 지출·입금. branch=표시명 */
function aggExpEntries(entries, keys, ym){
  const per={}; keys.forEach(k=>{ per[k]={code:k, name:EXP_NAME(k), balance:0, monthExp:0, monthInc:0, ym:ym}; });
  entries.forEach(e=>{
    const b=e.branch; if(!per[b]) return;
    const amt=Number(e.amt)||0;
    if(e.kind==='입금') per[b].balance+=amt; else if(e.kind==='지출') per[b].balance-=amt;
    if(String(e.date||'').slice(0,7)===ym){
      if(e.kind==='지출') per[b].monthExp+=amt;
      else if(e.kind==='입금') per[b].monthInc+=amt;
    }
  });
  return keys.map(k=>per[k]);
}
let expSummary={status:'idle', rows:null, error:null, scopeKey:null};
function loadExpSummary(force){
  const keys=expScopeKeys(); const scopeKey=keys.join('|');
  if(!keys.length){ expSummary={status:'error', rows:null, error:'분원 매핑 없음', scopeKey}; return Promise.resolve(); }
  if(!force && expSummary.scopeKey===scopeKey && expSummary.status!=='idle') return Promise.resolve();  // 에러 시 무한 재조회 방지
  expSummary={status:'loading', rows:null, error:null, scopeKey};
  // admin=전체 조회 후 집계 / 분원=자기 표시명만 (표시명에 공백 있어 eq로 인코딩 조회)
  const params = (session.role==='admin')
    ? 'select=branch,date,kind,amt'
    : 'select=branch,date,kind,amt&branch=eq.'+encodeURIComponent(keys[0]);
  return expSb('exp_entries',params)
    .then(rows=>{ expSummary={status:'ok', rows:aggExpEntries(rows||[], keys, expCurYM()), error:null, scopeKey}; })
    .catch(e=>{ expSummary={status:'error', rows:null, error:(e&&e.message)||'조회 실패', scopeKey}; })
    .then(()=>{ if(state.view==='chongmu' && chongmuView==='hub') render(); });
}
function refreshExpSummary(){ loadExpSummary(true); render(); }

function renderExpCard(){
  loadExpSummary(false);   // 스코프(계정) 바뀌면 자동 재조회
  let h=`<div class="bkpay-card clickable" onclick="chongmuGo('expense')" title="클릭하면 운영비 관리 시스템이 열려요">
    <div class="bkpay-hd">
      <div class="bkpay-ic exp">${icon('unyoung',22)}</div>
      <div class="bkpay-tt"><h3>운영비 현황 <span class="bkpay-open">운영비 시스템 열기 ›</span></h3><p>현재 잔여 시재 · 이번 달 지출 한눈에 · 카드를 누르면 운영비 시스템으로</p></div>
      <button class="bkpay-refresh" onclick="event.stopPropagation();refreshExpSummary()">↻ 새로고침</button>
    </div>`;
  if(expSummary.status==='loading'){
    h+=`<div class="bkpay-loading"><span class="spin-sm"></span> 불러오는 중…</div>`;
  } else if(expSummary.status==='error'){
    h+=`<div class="bkpay-err">운영비 현황을 불러오지 못했어요 <span class="e">(${esc(expSummary.error||'')})</span><button onclick="event.stopPropagation();refreshExpSummary()">다시 시도</button></div>`;
  } else if(expSummary.status==='ok'){
    h+=renderExpBody(expSummary.rows, session.role==='admin');
  } else {
    h+=`<div class="bkpay-loading"><span class="spin-sm"></span> 준비 중…</div>`;
  }
  h+=`</div>`;
  return h;
}
function renderExpBody(rows, isAdmin){
  const tot=rows.reduce((a,r)=>({monthExp:a.monthExp+r.monthExp, monthInc:a.monthInc+r.monthInc, balance:a.balance+r.balance}), {monthExp:0,monthInc:0,balance:0});
  const ymLabel=(rows[0]&&rows[0].ym)?rows[0].ym.replace('-','.'):'';
  let h='';
  h+=`<div class="bkpay-legend"><span class="lg"><i style="background:#8fb4e6"></i>현재 시재</span><span class="lg"><i style="background:#e3a08f"></i>이번 달 지출</span><span class="bkpay-mo">${esc(ymLabel)} · 분원별 · 같은 척도</span></div>`;
  // 시재(위)·지출(아래) 두 막대를 "최대 시재" 같은 척도로 → 지출이 작으면 주황도 짧게
  const maxBal=Math.max(1, ...rows.map(r=>Math.max(Math.abs(r.balance), r.monthExp)));
  const sorted=rows.slice().sort((a,b)=> b.balance-a.balance);
  h+=`<div class="bkpay-list">`;
  sorted.forEach(r=>{
    const has=(r.monthExp>0 || r.balance!==0);
    const wBal=r.balance!==0?Math.max(3, Math.round(Math.abs(r.balance)/maxBal*100)):0;
    const wExp=r.monthExp>0?Math.max(3, Math.round(r.monthExp/maxBal*100)):0;
    const balColor=r.balance<0?'#cf7d97':'#8fb4e6';
    h+=`<div class="bp-row${has?'':' empty'}">
      <div class="bp-nm">${esc(r.name)}${ymLabel?`<span class="bp-sem">${esc(ymLabel)}</span>`:''}</div>
      <div class="bp-track">
        <div style="position:absolute;left:0;top:3px;height:7px;border-radius:5px;background:${balColor};width:${wBal}%;transition:width .5s ease"></div>
        <div style="position:absolute;left:0;bottom:3px;height:7px;border-radius:5px;background:#e3a08f;width:${wExp}%;transition:width .5s ease"></div>
      </div>
      <div class="bp-right">
        <span class="bp-bal${r.balance<0?' neg':''}">시재 ${won(r.balance)}</span>
        <span class="bp-sub">이번 달 지출 ${won(r.monthExp)}</span>
      </div>
    </div>`;
  });
  h+=`</div>`;
  h+=`<div class="bkpay-foot">
    <span class="bf-l">이번 달 총 지출 <b class="exp">${won(tot.monthExp)}</b></span>
    <span class="bf-r">전체 현재 시재 <b class="${tot.balance<0?'neg':'bal'}">${won(tot.balance)}</b></span>
  </div>`;
  return h;
}

function renderChongmu(c){
  if(chongmuView==='books'){ renderBooks(c); return; }
  if(chongmuView==='expense'){ renderExpense(c); return; }

  const isAdmin = session.role==='admin';
  const canBooks   = (typeof hasMenu==='function') ? hasMenu('chongmu') : true;
  const canExpense = (typeof hasMenu==='function') ? hasMenu('unyoung') : true;
  let h = `<div class="page-h"><div><h2><span class="h-ic">${icon('chongmu',24)}</span><span class="em">총무</span></h2><p>교재 · 운영비 · 소모품 — 항목을 골라 들어가세요</p></div></div>`;

  h += `<div class="cm-wrap">`;

  // 교재비 입금현황 카드 (교재 권한) — 카드 자체가 교재 시스템 진입
  if(canBooks){
    loadBooksPay(false);   // 스코프(계정) 바뀌면 자동 재조회
    h += `<div class="bkpay-card clickable" onclick="chongmuGo('books')" title="클릭하면 교재 재고관리 시스템이 열려요">
      <div class="bkpay-hd">
        <div class="bkpay-ic">${icon('unyoung',22)}</div>
        <div class="bkpay-tt"><h3>교재비 입금현황 <span class="bkpay-open">교재 시스템 열기 ›</span></h3><p>청구 · 입금 · 미입금 한눈에 · 카드를 누르면 교재 시스템으로</p></div>
        <button class="bkpay-refresh" onclick="event.stopPropagation();refreshBooksPay()">↻ 새로고침</button>
      </div>`;
    if(booksPay.status==='loading'){
      h += `<div class="bkpay-loading"><span class="spin-sm"></span> 불러오는 중…</div>`;
    } else if(booksPay.status==='error'){
      h += `<div class="bkpay-err">입금현황을 불러오지 못했어요 <span class="e">(${esc(booksPay.error||'')})</span><button onclick="event.stopPropagation();refreshBooksPay()">다시 시도</button></div>`;
    } else if(booksPay.status==='ok'){
      h += renderBkPayBody(booksPay.rows, isAdmin);
    } else {
      h += `<div class="bkpay-loading"><span class="spin-sm"></span> 준비 중…</div>`;
    }
    h += `</div>`;   // .bkpay-card
  }

  // 운영비 현황 카드 (교재비 입금현황과 같은 요약 형태, 카드 클릭 = 운영비 시스템)
  if(canExpense){
    h += renderExpCard();
  }

  // 준비중 항목 (교재 권한)
  h += `<div class="cm-grid">`;
  if(canBooks){
    ['청소업체','A/S 관리'].forEach(t=>{
      h += `<div class="cm-card off"><div class="cm-ic">${icon('chongmu',24)}</div><div class="cm-tt">${esc(t)}</div><div class="cm-sub">준비 중</div></div>`;
    });
  }
  h += `</div>`;
  h += `</div>`;   // .cm-wrap
  c.innerHTML = h;
}

function renderBkPayBody(rows, isAdmin){
  const tot = rows.reduce((a,r)=>({charged:a.charged+r.charged, paid:a.paid+r.paid, unpaid:a.unpaid+r.unpaid, unpaidStudents:a.unpaidStudents+r.unpaidStudents}), {charged:0,paid:0,unpaid:0,unpaidStudents:0});
  const totRate = tot.charged>0 ? Math.round(tot.paid/tot.charged*100) : null;

  let h='';
  // 범례
  h += `<div class="bkpay-legend"><span class="lg"><i style="background:#a892e2"></i>입금</span><span class="lg"><i style="background:#e9e3f6"></i>미입금</span><span class="bkpay-mo">전체 학기 · 분원별</span></div>`;

  // 분원별 컴팩트 리스트 (미입금 큰 순)
  const sorted = rows.slice().sort((a,b)=> b.unpaid-a.unpaid);
  h += `<div class="bkpay-list">`;
  sorted.forEach(r=>{
    const has = r.charged>0;
    const rate = r.rate;
    h += `<div class="bp-row${has?'':' empty'}">
      <div class="bp-nm">${esc(r.name)}${r.sem?`<span class="bp-sem">${esc(r.sem)}</span>`:''}</div>
      <div class="bp-track"><div class="bp-fill" style="width:${has?(rate||0):0}%;background:${payColor(rate)}"></div><span class="bp-rate">${rate==null?'–':rate+'%'}</span></div>
      <div class="bp-right">
        <span class="bp-unpaid${r.unpaid>0?' hot':''}">미입금 ${won(r.unpaid)}${r.unpaidStudents?` <b>(${r.unpaidStudents}명)</b>`:''}</span>
        <span class="bp-sub">청구 ${won(r.charged)} · 입금 ${won(r.paid)}</span>
      </div>
    </div>`;
  });
  h += `</div>`;

  // 합계 푸터
  h += `<div class="bkpay-foot">
    <span class="bf-l">총 청구 <b>${won(tot.charged)}</b> · 입금 <b class="pos">${won(tot.paid)}</b></span>
    <span class="bf-r">미입금 <b class="neg">${won(tot.unpaid)}</b>${tot.unpaidStudents?` <span class="bf-cnt">${tot.unpaidStudents}명</span>`:''} · 입금률 <b style="color:${payColor(totRate)}">${totRate==null?'–':totRate+'%'}</b></span>
  </div>`;
  return h;
}

/* ===== 교재 앱 전체화면 임베드 ===== */
function renderBooks(c){
  const code = booksBranchCode();
  if(!code){
    c.innerHTML = `<div class="lt-back" onclick="chongmuGo('hub')">‹ 총무 홈</div>
      <div class="empty-msg">이 분원은 교재 시스템 분원코드가 연결되지 않았어요.<br>관리자에게 문의해주세요.</div>`;
    return;
  }
  try{ sessionStorage.setItem('jls_branch', code); }catch(e){}   // 같은 origin → 자동 로그인
  c.innerHTML = `<div class="bk-fs">
      <div class="bk-fs-bar">
        <button class="bk-fs-back" onclick="chongmuGo('hub')">‹ 총무 홈</button>
        <span class="bk-fs-title">교재 재고관리 · ${esc(session.role==='admin'?'전체':(BOOKS_NAME(code)||'분원'))}</span>
        <a class="bk-fs-open" href="${BOOKS_APP_URL}" target="_blank" rel="noopener">새 탭으로 열기 ↗</a>
      </div>
      <iframe class="bk-fs-frame" id="booksFrame" src="${BOOKS_APP_URL}?embed=1" title="교재 재고관리" allow="clipboard-write"></iframe>
    </div>`;
  booksHookSso(code);
}
function booksHookSso(code){
  if(window.__booksSsoHooked) return;
  window.__booksSsoHooked = true;
  window.addEventListener('message', function(e){
    if(e.origin !== location.origin) return;
    const d = e.data || {};
    if(d.type==='jls-books-logout'){ chongmuView='hub'; if(state.view==='chongmu') render(); return; }
    if(d.type==='jls-books-ready'){
      const f = document.getElementById('booksFrame');
      const cur = booksBranchCode() || code;
      if(f && f.contentWindow && cur){ f.contentWindow.postMessage({ type:'jls-books-branch', branch:cur }, location.origin); }
    }
  });
}

/* ===== 운영비 관리 전체화면 임베드 (자체 Supabase ktizqdrhndefvoeltjko) ===== */
const EXPENSE_APP_URL = 'expense-app/index.html';
/* 통합 세션 → 운영비 앱 curUser 주입 (admin=super/6분원, 분원=user/자기분원) */
function expenseCurUser(){
  const keys = expScopeKeys();   // 운영비 분원 표시명 (admin→6개, 분원→1개)
  if(!keys.length) return null;
  if(session.role==='admin') return { id:'admin', role:'super', branches:keys };
  return { id:'branch', role:'user', branches:keys };
}
function renderExpense(c){
  const u = expenseCurUser();
  if(!u){
    c.innerHTML = `<div class="lt-back" onclick="chongmuGo('hub')">‹ 총무 홈</div>
      <div class="empty-msg">이 분원은 운영비 시스템 분원코드가 연결되지 않았어요.<br>관리자에게 문의해주세요.</div>`;
    return;
  }
  try{ sessionStorage.setItem('jls_expense_user', JSON.stringify(u)); }catch(e){}   // 자동로그인용 주입
  c.innerHTML = `<div class="bk-fs">
      <div class="bk-fs-bar">
        <button class="bk-fs-back" onclick="chongmuGo('hub')">‹ 총무 홈</button>
        <span class="bk-fs-title">운영비 관리${session.role==='admin'?' · 전체':''}</span>
        <a class="bk-fs-open" href="${EXPENSE_APP_URL}" target="_blank" rel="noopener">새 탭으로 열기 ↗</a>
      </div>
      <iframe class="bk-fs-frame" id="expenseFrame" src="${EXPENSE_APP_URL}?embed=1" title="운영비 관리" allow="clipboard-write"></iframe>
    </div>`;
  expenseHookSso(u);
}
function expenseHookSso(u){
  if(window.__expenseSsoHooked) return;
  window.__expenseSsoHooked = true;
  window.addEventListener('message', function(e){
    if(e.origin !== location.origin) return;
    const d = e.data || {};
    if(d.type==='jls-expense-logout'){ chongmuView='hub'; if(state.view==='chongmu') render(); return; }
    if(d.type==='jls-expense-ready'){
      const f = document.getElementById('expenseFrame');
      const cur = expenseCurUser() || u;
      if(f && f.contentWindow && cur){ f.contentWindow.postMessage({ type:'jls-expense-user', user:cur }, location.origin); }
    }
  });
}

window.chongmuGo=chongmuGo; window.renderChongmu=renderChongmu; window.renderBooks=renderBooks;
window.renderExpense=renderExpense; window.refreshBooksPay=refreshBooksPay; window.refreshExpSummary=refreshExpSummary;
