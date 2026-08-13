/* ==========================================================================
   inwon.js — 인원현황 모듈 (통합 대시보드 카드형)
   app.js 뒤에 로드 · 전역 공유(db, state, session, wonmuState, recordsOf,
   enrollMonth, withdrawMonth, semesterMonths, esc, semName, branchList,
   wonmuGo, renderWonmuBody, icon)를 사용
   계산 로직·디자인은 학사관리(상담) 앱에서 이식 — 같은 Supabase라 숫자 동일
   ========================================================================== */

/* ---- CHESS / ACE 구분 ---- (CHESS_LEVELS·levelAlphaOf·isChess 는 app.js 것을 재사용) */
function countChessAce(records){ let chess=0,ace=0; records.forEach(r=>{ if(isChess(r.className)) chess++; else ace++; }); return {chess,ace,total:chess+ace}; }

/* ---- 학기 인원 집계 (origin 기준, 상담앱 headcountClean 이식) ---- */
function headcountClean(branchId, semId){
  const recs = recordsOf(branchId, semId);
  const total = recs.length;
  const newRecs     = recs.filter(r=>(r.origin==='new'||r.origin==='return') && !r.transferIn);
  const transferInR = recs.filter(r=>r.transferIn);
  const withdrawR   = recs.filter(r=>!r.transfer && (r.status==='withdraw' || (r.status==='active' && r.withdrawDate)));
  const transferR   = recs.filter(r=>r.status==='withdraw' && r.transfer);
  const activeR     = recs.filter(r=>r.status==='active');
  const newCnt=newRecs.length, transferIn=transferInR.length, withdraw=withdrawR.length, transfer=transferR.length, active=activeR.length;
  // 학기초 = 재원 + 퇴원 + 전출 − 신규 − 전입 (복귀생처럼 학기초에 있다가 중간에 퇴원·복귀한 학생도 정확히 포함 → 항상 재원과 아귀 맞음)
  const startCount = active + withdraw + transfer - newCnt - transferIn;
  const ca = rr => countChessAce(rr);
  const caNew=ca(newRecs), caTI=ca(transferInR), caWd=ca(withdrawR), caTr=ca(transferR), caAc=ca(activeR);
  const caStart = {
    chess: caAc.chess + caWd.chess + caTr.chess - caNew.chess - caTI.chess,
    ace:   caAc.ace   + caWd.ace   + caTr.ace   - caNew.ace   - caTI.ace,
    total: caAc.total + caWd.total + caTr.total - caNew.total - caTI.total,
  };
  return {
    start:startCount, newCnt, transferIn, withdraw, transfer, active,
    net:newCnt+transferIn-withdraw-transfer,
    ca:{ start:caStart, newCnt:caNew, transferIn:caTI, withdraw:caWd, transfer:caTr, active:caAc }
  };
}

/* ---- 상담률 (calcRates 이식) — counseling_histories / mc_exemptions 사용 ---- */
const STAGES = ['HC1','HC2','MC1','MC2','MC3'];
function examRecordsOf(branchId, semId){ return db.semesterRecords.filter(r=>r.branchId===branchId && r.semesterId===semId && (r.kind||'regular')==='exam' && r.status==='active'); }
function rateRecordsOf(branchId, semId){ return recordsOf(branchId, semId).concat(examRecordsOf(branchId, semId)); }
function isExempt(studentId, branchId, semId, stage){ return (db.mcExemptions||[]).some(e=> e.studentId===studentId && e.branchId===branchId && e.semesterId===semId && e.stage===stage); }
function isDone(studentId, branchId, semId, stage){ return (db.counselingHistories||[]).some(c=> c.studentId===studentId && c.branchId===branchId && c.semesterId===semId && c.type===stage && !c.mistag); }
function isTarget(rec, stage, semId){
  const sid = semId || (typeof state!=='undefined'?state.semId:null);
  const isExam = (rec.kind||'regular')==='exam';
  if(isExam){ if(stage==='HC1'||stage==='HC2') return false; return isExempt(rec.studentId, rec.branchId, sid, stage); }
  if(stage!=='HC1' && stage!=='HC2' && isExempt(rec.studentId, rec.branchId, sid, stage)) return false;
  if(rec.status==='withdraw' && (stage==='MC1'||stage==='MC2'||stage==='MC3')){
    const wm = withdrawMonth(rec);
    if(wm!=null){ const ms=semesterMonths(sid); const stgMonth={MC1:ms[0],MC2:ms[1],MC3:ms[2]}[stage]; const order=m=>ms.indexOf(m); if(order(stgMonth)>order(wm)) return false; }
  }
  if(stage==='HC1'||stage==='HC2') return rec.targetType==='HCMC';
  const months = semesterMonths(sid);
  const mcMonth = {MC1:months[0],MC2:months[1],MC3:months[2]}[stage];
  const em = enrollMonth(rec);
  if(em==null) return true;
  return em <= mcMonth;
}
function calcRates(recs, branchId, semId){
  const out = { stages:{}, totalTarget:0, totalDone:0, totalRate:0, incompleteStudents:0 };
  STAGES.forEach(s=> out.stages[s]={target:0,done:0,rate:0});
  const incomplete = new Set();
  recs.forEach(rec=>{
    STAGES.forEach(stg=>{
      if(!isTarget(rec, stg, semId)) return;
      out.stages[stg].target++; out.totalTarget++;
      if(isDone(rec.studentId, branchId, semId, stg)){ out.stages[stg].done++; out.totalDone++; }
      else incomplete.add(rec.studentId);
    });
  });
  STAGES.forEach(s=>{ const st=out.stages[s]; st.rate = st.target ? Math.round(st.done/st.target*100) : null; });
  out.totalRate = out.totalTarget ? Math.round(out.totalDone/out.totalTarget*100) : 0;
  out.incompleteStudents = incomplete.size;
  return out;
}
function rateColorIw(r){ if(r==null) return 'var(--line-2)'; if(r>=80) return 'var(--pos)'; if(r>=50) return 'var(--brand)'; if(r>=30) return 'var(--warn)'; return 'var(--neg)'; }

/* ---- 반·담임 그룹핑 (상세 패널용) ---- */
function inwStu(id){ return (db.students||[]).find(s=>s.id===id); }
function inwClassGroups(recs){
  const g={};
  recs.forEach(r=>{
    const key=[r.className||'', r.classLabel||'', r.teacher||''].join('|');
    if(!g[key]) g[key]={className:r.className, classLabel:r.classLabel, teacher:r.teacher, active:0, nw:0, wd:0};
    if(r.status==='active') g[key].active++;
    if((r.origin==='new'||r.origin==='return') && !r.transferIn) g[key].nw++;
    if(!r.transfer && (r.status==='withdraw' || (r.status==='active' && r.withdrawDate))) g[key].wd++;
  });
  return Object.values(g).filter(x=>x.active||x.nw||x.wd);
}
const inwCls=g=>[g.className,g.classLabel].filter(Boolean).join(' ')||'미배정';

/* ---- UI 조각 ---- */
function iwKpi(label, value, opts={}){
  const cls = opts.accent?' accent':'';
  const v = `<span class="num">${esc(value)}</span>${opts.unit?`<small>${esc(opts.unit)}</small>`:''}`;
  let badges='';
  if(opts.ca) badges = `<div class="iw-kpi-ca"><span class="ca-chess">CHESS ${opts.ca.chess}</span><span class="ca-ace">ACE ${opts.ca.ace}</span></div>`;
  return `<div class="iw-kpi${cls}"><div class="kl">${esc(label)}</div><div class="kv">${v}</div>${badges}</div>`;
}
function iwStageBars(rates){
  return `<div class="iw-stages">`+ STAGES.map(s=>{
    const st=rates.stages[s];
    if(st.rate==null) return `<div class="iw-stage na"><span class="sl">${s}</span><div class="strack"></div><span class="sv">–</span></div>`;
    return `<div class="iw-stage"><span class="sl">${s}</span><div class="strack"><div class="sfill" style="width:${st.rate}%;background:${rateColorIw(st.rate)}"></div></div><span class="sv num">${st.rate}%</span></div>`;
  }).join('')+`</div>`;
}
function iwInc(n){ return n===0 ? `<span class="iw-inc zero">미완료 0명</span>` : `<span class="iw-inc">미완료 ${n}명</span>`; }
function iwSortBtn(key,label){ return `<button class="iw-sbtn ${(wonmuState.inSort||'active')===key?'on':''}" onclick="inSetSort('${key}')">${esc(label)}</button>`; }
function inSetSort(k){ wonmuState.inSort=k; renderWonmuBody(); }
function inToggleBr(bid){ wonmuState.inOpenBr=(wonmuState.inOpenBr===bid?null:bid); renderWonmuBody(); }

/* ---- (보관) 네이티브 대시보드 렌더 — 나중에 코드 통합 때 재사용 ---- */
function renderInwonNative(b){
  const brs = branchList();
  const semId = state.semId;
  const CA=['start','newCnt','transferIn','withdraw','transfer','active'];
  let tot={start:0,newCnt:0,transferIn:0,withdraw:0,transfer:0,active:0};
  const totCa={}; CA.forEach(k=>totCa[k]={chess:0,ace:0});
  const cards = brs.map(bx=>{
    const hc = headcountClean(bx.id, semId);
    const rates = calcRates(rateRecordsOf(bx.id, semId), bx.id, semId);
    CA.forEach(k=>{ tot[k]+=hc[k]; totCa[k].chess+=hc.ca[k].chess; totCa[k].ace+=hc.ca[k].ace; });
    const wbase=hc.active+hc.withdraw; const withdrawRate=wbase>0?Math.round(hc.withdraw/wbase*100):0;
    return {b:bx, hc, rates, withdrawRate};
  });
  const totWbase=tot.active+tot.withdraw; const totWrate=totWbase>0?Math.round(tot.withdraw/totWbase*100):0;

  let h = `<div class="lt-back" onclick="wonmuGo('hub')">‹ 원무 홈</div>`;
  h += `<div class="iw-head"><h2>인원현황</h2><div class="sub">${brs.length}개 분원 통합 현황 · ${esc(semName(semId))}</div></div>`;

  h += `<div class="iw-kpi-row">
    ${iwKpi('전체 학기초 인원', tot.start, {unit:'명', ca:totCa.start})}
    ${iwKpi('전체 신규생', tot.newCnt, {unit:'명', ca:totCa.newCnt})}
    ${iwKpi('전체 전입', tot.transferIn, {unit:'명', ca:totCa.transferIn})}
    ${iwKpi('전체 퇴원생', tot.withdraw, {unit:'명', ca:totCa.withdraw})}
    ${iwKpi('전체 전출', tot.transfer, {unit:'명', ca:totCa.transfer})}
    ${iwKpi('전체 퇴원율', totWrate, {unit:'%'})}
    ${iwKpi('현 재원생', tot.active, {unit:'명', accent:true, ca:totCa.active})}
  </div>`;

  h += `<div class="iw-sect"><h3>분원별 현황</h3><div class="iw-sort">
    ${iwSortBtn('active','재원생순')}${iwSortBtn('new','신규순')}${iwSortBtn('withdraw','퇴원순')}${iwSortBtn('wrate','퇴원율순')}${iwSortBtn('rate','상담률순')}
  </div></div>`;

  const sortKey = wonmuState.inSort||'active';
  const val = c => sortKey==='active'?c.hc.active : sortKey==='new'?c.hc.newCnt : sortKey==='withdraw'?c.hc.withdraw : sortKey==='wrate'?c.withdrawRate : c.rates.totalRate;
  cards.sort((a,b2)=> val(b2)-val(a));
  const rated = cards.filter(c=>c.hc.active>0);
  const bestId = (sortKey==='rate' && rated.length) ? rated[0].b.id : null;
  const worstId = (sortKey==='rate' && rated.length>1) ? rated[rated.length-1].b.id : null;

  h += `<div class="iw-grid">`;
  h += cards.map(({b:bx,hc,rates,withdrawRate}, i)=>{
    const hasData = hc.active>0 || hc.start>0;
    const rank=i+1; const rankCls=rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
    const cardCls = bx.id===bestId?' best' : bx.id===worstId?' worst' : '';
    const open = wonmuState.inOpenBr===bx.id;
    const wrColor = withdrawRate>=15?'var(--neg)':withdrawRate>=8?'var(--warn)':'var(--ink-2)';
    return `<div class="iw-card${cardCls}${open?' open':''}" onclick="inToggleBr('${bx.id}')">
      <div class="iw-rank ${rankCls}">${rank}</div>
      <div class="iw-card-top">
        <div>
          <div class="iw-card-name">${esc(bx.name)}${bx.id===bestId?'<span class="iw-best">최고</span>':bx.id===worstId?'<span class="iw-worst">최저</span>':''}</div>
          <div class="iw-card-sub">신규 <b style="color:var(--brand)">${hc.newCnt}</b> · 퇴원 <b style="color:${wrColor}">${hc.withdraw}</b> <span style="color:${wrColor}">(${withdrawRate}%)</span> · 상담률 <b style="color:${hasData?rateColorIw(rates.totalRate):'var(--ink-3)'}">${hasData?rates.totalRate+'%':'–'}</b></div>
          <div class="iw-card-ca"><span class="ca-chess">CHESS ${hc.ca.active.chess}</span><span class="ca-ace">ACE ${hc.ca.active.ace}</span></div>
        </div>
        <div class="iw-hc"><div class="hc-num num">${hc.active}</div><div class="hc-label">현재 재원생</div></div>
      </div>
      <div class="iw-mini">
        <div class="iw-ms"><div class="v num">${hc.start}</div><div class="l">학기초</div></div>
        <div class="iw-ms"><div class="v num" style="color:var(--brand)">${hc.newCnt}</div><div class="l">신규</div></div>
        <div class="iw-ms"><div class="v num" style="color:${hc.withdraw>0?'var(--neg)':'var(--ink-2)'}">${hc.withdraw}</div><div class="l">퇴원</div></div>
      </div>
      ${hasData ? iwStageBars(rates) : `<div style="color:var(--ink-3);font-size:12.5px;padding:8px 0">아직 업로드된 데이터가 없습니다</div>`}
      <div class="iw-foot">${hasData?iwInc(rates.incompleteStudents):'<span></span>'}<span class="iw-go">${open?'접기 ▴':'담임별 ▾'}</span></div>
    </div>`;
  }).join('');
  h += `</div>`;

  // 담임별 상세 패널 (카드 클릭 시)
  if(wonmuState.inOpenBr){
    const bx = brs.find(x=>x.id===wonmuState.inOpenBr);
    if(bx){
      const sub = inwClassGroups(recordsOf(bx.id, semId)).sort((a,b3)=> String(inwCls(a)).localeCompare(inwCls(b3)));
      h += `<div class="iw-detail">
        <div class="iw-detail-h"><div class="t">${esc(bx.name)} · 반별 · 담임별</div><div class="x" onclick="inToggleBr('${bx.id}')">닫기 ✕</div></div>`;
      h += sub.length ? sub.map(g=>`<div class="inw-exp-row"><span class="ie-cls">${esc(inwCls(g))}</span><span class="ie-tch">${esc(g.teacher||'-')}</span><span class="ie-n">${g.active}명</span><span class="ie-sub">${g.nw?'신규 +'+g.nw:''}${g.nw&&g.wd?' · ':''}${g.wd?'퇴원 -'+g.wd:''}</span></div>`).join('') : `<div class="empty-msg sm">반 정보가 없어요.</div>`;
      h += `</div>`;
    }
  }

  b.innerHTML = h;
}

/* ---- 메인 렌더 (임베드·전체화면) — 인원현황 = 상담앱(로컬 사본)을 화면 꽉 채워 그대로 ---- */
/* 같은 폴더 안 사본이라 같은 origin → 로그인 세션이 그대로 공유됨(자동 로그인, push 불필요) */
const INWON_APP_URL = 'inwon-app/index.html';
function renderInwon(b){
  // ① 같은 origin이라 세션 공유 — 통합앱 로그인 정보를 상담앱 세션키에 심어두면 자동 로그인
  try{
    if(session) sessionStorage.setItem('jls_session_v1', JSON.stringify({
      userId:session.userId, username:session.username, role:session.role,
      branchId:session.branchId, teacherName:session.teacherName||null,
      canEdit:(typeof curCanEdit==='function'?curCanEdit():true)   // 뷰어면 false → inwon-app 읽기전용
    }));
  }catch(e){}
  // ② 전체화면 오버레이 (바깥 통합 사이드바를 덮고 상담앱이 화면 전체)
  const teacher = session && session.role==='teacher';   // 담임은 통합 홈으로 나갈 데가 없음 → 상단 바 없이 iframe만
  b.innerHTML = teacher
    ? `<div class="iw-fs"><iframe class="iw-fs-frame" id="inwonFrame" src="${INWON_APP_URL}?embed=1" title="담임 화면" allow="clipboard-write"></iframe></div>`
    : `<div class="iw-fs">
        <div class="iw-fs-bar">
          <button class="iw-fs-back" onclick="wonmuGo('hub')">‹ 통합 홈</button>
          <span class="iw-fs-title">인원현황 · 학사관리</span>
          <a class="iw-fs-open" href="${INWON_APP_URL}" target="_blank" rel="noopener">새 탭으로 열기 ↗</a>
        </div>
        <iframe class="iw-fs-frame" id="inwonFrame" src="${INWON_APP_URL}?embed=1" title="인원현황 · 학사관리" allow="clipboard-write"></iframe>
      </div>`;
  inwonHookSso();

}
/* 백업 경로 — iframe이 'ready' 보내면 세션을 postMessage로도 넘겨줌(세션 심기 실패 대비) */
function inwonHookSso(){
  if(window.__inwonSsoHooked) return;
  window.__inwonSsoHooked = true;
  window.addEventListener('message', function(e){
    if(e.origin!==location.origin) return;   // 같은 origin(로컬 사본)만
    if(e.data && e.data.type==='jls-embed-logout'){ if(typeof logout==='function'){ try{ logout(); }catch(err){} } return; }
    if(e.data && e.data.type==='jls-embed-ready'){
      const f = document.getElementById('inwonFrame');
      if(f && f.contentWindow && session){
        f.contentWindow.postMessage({ type:'jls-embed-session', userId:session.userId, username:session.username }, location.origin);
      }
    }
  });
}

window.renderInwon=renderInwon; window.inSetSort=inSetSort; window.inToggleBr=inToggleBr;
