/* ============================================================================
   교재표 (학사관리 › 교재표)

   목적: 겨울학기 전체명단을 올리면 반 이름에서 레벨을 읽어, 선생님마다 받을 교재
   목록을 자동으로 만든다. 예전엔 본사가 보낸 '분원 교재 배부현황' 엑셀에서
   선생님 칸에 1을 손으로 찍었다.

   · 기본 교재 목록은 textbook-data.js(본사 교재 리스트)에 있다.
   · 분원이 어떤 레벨의 교재를 바꾸면(활용교재 변경 · HM처럼 전부 외부교재) 그 분원·학기·레벨의
     '바뀐 전체 목록'을 tb_levels 에 한 줄 저장한다. 줄이 없으면 기본 목록.
   · 교재 한 권마다 학원 배부(분원이 체크) / 수령 확인(담임이 체크) / 받은 것과 다름(담임)을
     tb_checks 에 저장한다. 이 화면은 saveDB 를 안 쓴다 — 담임 계정은 읽기 전용이라
     saveDB 가 막혀 있고(미통과 관리와 같은 사정), 내 표에만 직접 쓰는 편이 안전하다.
   · 선생님은 따로 등록하지 않는다. 전체명단의 반 → 담임에서 그대로 읽는다.

   에이스는 레벨 + 텀(1-3개월=3번째 텀, 4-6개월=4번째 텀)으로 목록이 갈린다.
   반 이름에 괄호가 없으면(예: [PA1]) 화면 위에서 고른 텀으로 본다.
   ============================================================================ */
const TB = {
  term: '3',            // 괄호 없는 에이스 반을 몇 번째 텀으로 볼지
  sel: null,            // 분원 화면에서 고른 선생님(teacherKey)
  levels: new Map(),    // `${분원}|${학기}|${레벨}` → 바뀐 목록
  checks: new Map(),    // `${teacherKey}|${레벨}|${교재명}` → {delivered,received,mismatch}
  loadedFor: '', missing: false, model: null, tab: 'teacher'
};
const TB_AREAS = ['활용','독해','듣기','단어','문법','쓰기','말하기','스토리북','CHESS','몰입','해설','모의고사','내신','외부'];

function tbIsMgr(){ return !!session && (session.role==='admin' || session.role==='branch'); }
function tbBranchId(){ return session.role==='admin' ? (state.tbBranch || (db.branches[0]&&db.branches[0].id)) : session.branchId; }

/* ── 반 이름 → 레벨 열쇠 ─────────────────────────────────────────── */
function tbLevelKey(cn){
  const m = String(banLevel(cn)||'').trim().match(/^([A-Za-z]+\d*)\s*(?:\(([^)]*)\))?/);
  if(!m) return '';
  const base = m[1].toUpperCase(), par = m[2]||'';
  if(banIsChess(base)) return base;
  let term = TB.term;
  if(/4\s*[-~]\s*6/.test(par)) term='4'; else if(/1\s*[-~]\s*3/.test(par)) term='3';
  /* HM3 처럼 '고등' 표에만 있는 레벨은 괄호가 없어도 그쪽으로 본다 */
  if(/고등/.test(par) || (!TB_BASE.ace[base] && TB_BASE.ace[base+'(고등)'])) return base+'(고등)|'+term;
  return base+'|'+term;
}
function tbLevelLabel(lk){
  if(lk.indexOf('|')<0) return lk;
  const p=lk.split('|'); const hi=/\(고등\)/.test(p[0]);
  return hi ? p[0].replace('(고등)',' (고등)') : p[0]+' ('+(p[1]==='4'?'4-6개월':'1-3개월')+')';
}
function tbBase(lk){
  if(lk.indexOf('|')<0) return TB_BASE.chess[lk]||[];
  const p=lk.split('|'); return ((TB_BASE.ace[p[0]]||{})[p[1]])||[];
}
let _tbAllNames=null;
function tbAllBaseNames(){
  if(_tbAllNames) return _tbAllNames;
  const s=new Set();
  Object.values(TB_BASE.chess).forEach(a=>a.forEach(i=>s.add(i.n)));
  Object.values(TB_BASE.ace).forEach(t=>Object.values(t).forEach(a=>a.forEach(i=>s.add(i.n))));
  return (_tbAllNames=s);
}
/* 활용교재 후보 — 에이스 기본 목록 중 영역이 '활용'인 것 전부 */
let _tbHwal=null;
function tbHwalList(){
  if(_tbHwal) return _tbHwal;
  const s=new Set();
  Object.values(TB_BASE.ace).forEach(t=>Object.values(t).forEach(a=>a.forEach(i=>{ if(i.a==='활용') s.add(i.n); })));
  return (_tbHwal=[...s].sort((a,b)=>a.localeCompare(b)));
}
/* 이 분원·학기·레벨의 교재 목록: 분원이 고친 게 있으면 그것, 없으면 기본 */
function tbItems(brId, semId, lk){
  const o = TB.levels.get(brId+'|'+semId+'|'+lk);
  const arr = (o||tbBase(lk)).map(i=>({n:i.n, a:i.a||''}));
  const known = tbAllBaseNames();
  arr.forEach(i=>{ i.x = !known.has(i.n); });     // 기본 목록에 없는 이름 = 외부교재
  return {items:arr, changed:!!o};
}

/* ── 서버 읽기 · 쓰기 ──────────────────────────────────────────── */
async function tbLoad(brId, semId){
  const tag = brId+'|'+semId;
  if(TB.loadedFor===tag) return;
  if(!sb){ try{ initSupabase(); }catch(e){ console.error(e); } }
  TB.levels = new Map(); TB.checks = new Map(); TB.missing=false;
  try{
    const a = await sb.from('tb_levels').select('*').eq('branch_id',brId).eq('semester_id',semId);
    const b = await sb.from('tb_checks').select('*').eq('branch_id',brId).eq('semester_id',semId).limit(20000);
    if(a.error) throw a.error;
    if(b.error) throw b.error;
    (a.data||[]).forEach(r=> TB.levels.set(brId+'|'+semId+'|'+r.level_key, Array.isArray(r.items)?r.items:[]));
    (b.data||[]).forEach(r=> TB.checks.set(r.teacher_key+'|'+r.level_key+'|'+r.book_name, {delivered:!!r.delivered, received:!!r.received, mismatch:!!r.mismatch}));
    TB.loadedFor = tag;
  }catch(e){
    console.error('교재표 불러오기 실패', e);
    TB.missing = true;       // sql/textbook_list.sql 을 아직 안 돌린 경우
  }
}
function tbChk(tk, lk, name){ return TB.checks.get(tk+'|'+lk+'|'+name) || {delivered:false,received:false,mismatch:false}; }
async function tbSetCheck(tk, lk, name, patch){
  if(TB.missing){ toast('교재표 표가 아직 없습니다 — sql/textbook_list.sql 을 먼저 실행해 주세요','err'); return; }
  const key=tk+'|'+lk+'|'+name, old=tbChk(tk,lk,name), next=Object.assign({},old,patch);
  /* 받은 게 맞다고 확인하면 '다름' 표시는 풀고, 배부를 취소하면 수령 확인도 같이 푼다 */
  if(patch.received) next.mismatch=false;
  if(patch.mismatch) next.received=false;
  if(patch.delivered===false){ next.received=false; next.mismatch=false; }
  TB.checks.set(key,next);
  const row={branch_id:tbBranchId(), semester_id:state.semId, teacher_key:tk, level_key:lk, book_name:name,
    delivered:next.delivered, received:next.received, mismatch:next.mismatch,
    updated_by:(session&&session.username)||null, updated_at:new Date().toISOString()};
  const { error } = await sb.from('tb_checks').upsert(row, {onConflict:'branch_id,semester_id,teacher_key,level_key,book_name'});
  if(error){ console.error(error); TB.checks.set(key,old); toast('저장하지 못했습니다. 다시 눌러 주세요','err'); }
  tbPaint();
}
async function tbSaveLevel(brId, semId, lk, items){
  const baseSame = JSON.stringify(tbBase(lk).map(i=>[i.n,i.a||''])) === JSON.stringify(items.map(i=>[i.n,i.a||'']));
  const k=brId+'|'+semId+'|'+lk;
  let error;
  if(baseSame){
    ({error} = await sb.from('tb_levels').delete().eq('branch_id',brId).eq('semester_id',semId).eq('level_key',lk));
    if(!error) TB.levels.delete(k);
  } else {
    ({error} = await sb.from('tb_levels').upsert({branch_id:brId, semester_id:semId, level_key:lk, items:items,
      updated_by:(session&&session.username)||null, updated_at:new Date().toISOString()}, {onConflict:'branch_id,semester_id,level_key'}));
    if(!error) TB.levels.set(k, items);
  }
  if(error){ console.error(error); toast('저장하지 못했습니다','err'); return false; }
  return true;
}

/* ── 전체명단 → 선생님별 레벨·반 ────────────────────────────────── */
function tbBuild(brId, semId){
  const byT = new Map();
  activeRecordsOf(brId, semId).forEach(r=>{
    const name = String(r.teacher||'').trim() || '담임 미지정';
    const tk = teacherKey(name);
    if(!byT.has(tk)) byT.set(tk,{key:tk, name:name, classes:new Map()});
    const t=byT.get(tk);
    if(/[가-힣]/.test(name) && !/[가-힣]/.test(t.name)) t.name=name;
    const cn=String(r.className||'').trim();
    if(!cn) return;
    if(!t.classes.has(cn)) t.classes.set(cn,{cn:cn, n:0});
    t.classes.get(cn).n++;
  });
  const unreadable=[];
  const teachers=[...byT.values()].map(t=>{
    const lvMap=new Map();
    t.classes.forEach(c=>{
      const lk=tbLevelKey(c.cn);
      if(!lk || !/^\s*\[/.test(c.cn)){ unreadable.push({teacher:t.name, cn:c.cn}); return; }
      if(!lvMap.has(lk)) lvMap.set(lk,{lk:lk, label:tbLevelLabel(lk), classes:[]});
      lvMap.get(lk).classes.push(c);
    });
    const levels=[...lvMap.values()].sort((a,b)=> banLvRank(a.lk.split('|')[0]) - banLvRank(b.lk.split('|')[0]) || a.lk.localeCompare(b.lk));
    levels.forEach(L=>{
      const r=tbItems(brId, semId, L.lk); L.items=r.items; L.changed=r.changed;
      L.students=L.classes.reduce((s,c)=>s+c.n,0);
      L.grade=tbGradeOf(L.classes);
    });
    return {key:t.key, name:t.name, levels:levels};
  }).filter(t=>t.levels.length)
    .sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  return {teachers:teachers, unreadable:unreadable};
}
function tbGradeOf(classes){
  const cnt={};
  classes.forEach(c=>{ banParts(c.cn).map(banGrade).filter(Boolean).forEach(g=>{ cnt[g]=(cnt[g]||0)+1; }); });
  const g=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  return ({E5:'5학년',E6:'6학년',M1:'중등1',M2:'중등2',M3:'중등3'})[g]||'';
}
function tbClassLine(c, brId){
  const bu=banBu(c.cn, brId);
  const rm=banRoom(c.cn);
  return (bu?bu.label.replace(/\s*·\s*\d+:\d+~\d+:\d+$/,''):stripBooks(c.cn))+(rm?' · '+rm:'')+' · '+c.n+'명';
}
function tbCount(t){
  let all=0, got=0;
  t.levels.forEach(L=>L.items.forEach(i=>{ all++; if(tbChk(t.key,L.lk,i.n).received) got++; }));
  return {all:all, got:got};
}

/* ── 화면 ──────────────────────────────────────────────────────── */
function tbCss(){
  if(document.getElementById('tbCss')) return;
  const s=document.createElement('style'); s.id='tbCss';
  s.textContent=`
  .tb-wrap{display:flex;gap:28px;align-items:flex-start}
  .tb-side{width:210px;flex:none;position:sticky;top:12px}
  .tb-side .lab{font-size:11.5px;color:var(--ink-3);margin:0 0 6px 2px}
  .tb-t{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:10px;cursor:pointer;color:var(--ink-2);font-size:13.5px}
  .tb-t:hover{background:var(--line-2)}
  .tb-t.on{background:var(--brand-soft);color:var(--brand);font-weight:800}
  .tb-t i{font-style:normal;font-size:11.5px;color:var(--ink-3)}
  .tb-t.on i{color:var(--brand)}
  .tb-main{flex:1;min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:22px 26px}
  .tb-hd{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
  .tb-hd b{font-size:18px;font-weight:800}
  .tb-bar{height:5px;background:var(--line-2);border-radius:3px;width:210px;margin-top:6px;margin-left:auto}
  .tb-bar div{height:5px;background:var(--brand);border-radius:3px}
  .tb-lv{margin-top:26px;display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #cebef4;padding-bottom:6px;gap:10px;flex-wrap:wrap}
  .tb-lv b{font-size:14.5px;color:var(--brand);font-weight:800}
  .tb-lv small{color:var(--ink-3);margin-left:8px;font-size:12px}
  .tb-lv .tb-mini{font-size:12px;color:var(--brand);background:var(--brand-soft);border:1px solid #cebef4;border-radius:7px;padding:3px 10px;cursor:pointer;margin-left:6px}
  .tb-tbl{width:100%;border-collapse:collapse;font-size:13.5px}
  .tb-tbl th{font-size:11.5px;font-weight:600;color:var(--ink-3);text-align:left;padding:7px 4px;border-bottom:1px solid var(--line-2)}
  .tb-tbl td{padding:9px 4px;border-bottom:1px solid var(--line-2)}
  .tb-tbl .s{width:90px;text-align:center}
  .tb-tbl .a{width:110px;color:var(--ink-3);font-size:12.5px}
  .tb-ck{display:inline-block;width:20px;height:20px;border:1.5px solid #d9d2ee;border-radius:6px;vertical-align:middle;cursor:pointer;position:relative;background:#fff}
  .tb-ck.y{background:var(--brand);border-color:var(--brand)}
  .tb-ck.y:after{content:'';position:absolute;left:5.5px;top:1.5px;width:5px;height:10px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
  .tb-ck.ro{cursor:default}
  .tb-ck.off{opacity:.35;cursor:not-allowed}
  .tb-ext{font-size:11px;background:var(--warn-soft);color:#c9761f;border-radius:5px;padding:1px 6px;margin-left:6px}
  .tb-chg{font-size:11px;background:var(--brand-soft);color:var(--brand);border-radius:5px;padding:1px 6px;margin-left:6px}
  .tb-neg{font-size:12px;color:var(--neg);cursor:pointer}
  .tb-warn{background:var(--warn-soft);border:1px solid #f6d9b4;border-radius:10px;padding:10px 14px;margin:0 0 14px;color:#9a5a12;font-size:12.5px;line-height:1.6}
  .tb-bad{background:var(--neg-soft);border:1px solid #f6c4d1;color:#b8325a}
  .tb-sel{border:1px solid #cebef4;border-radius:7px;padding:3px 6px;background:#fff;font-size:13px;max-width:420px}
  .tb-in{border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:13px;width:100%;box-sizing:border-box}
  @media(max-width:820px){.tb-wrap{flex-direction:column}.tb-side{width:100%;position:static;display:flex;flex-wrap:wrap;gap:6px}.tb-side .lab{width:100%}}
  `;
  document.head.appendChild(s);
}
async function renderTextbook(){
  tbCss();
  const brId=tbBranchId(), semId=state.semId;
  const b=getBranch(brId)||{}, sem=(db.semesters.find(s=>s.id===semId)||{}).name||'';
  crumbs([{label:'교재표'}]);
  el('content').innerHTML='<div style="padding:40px;color:var(--ink-3)">불러오는 중…</div>';
  await tbLoad(brId, semId);
  TB.model = tbBuild(brId, semId);
  const M=TB.model;
  const isT = session.role==='teacher';
  if(isT){ const mk=teacherKey(session.teacherName||''); TB.sel = mk; }
  else if(!TB.sel || !M.teachers.some(t=>t.key===TB.sel)) TB.sel = M.teachers[0] ? M.teachers[0].key : null;

  const brSel = session.role==='admin'
    ? `<select class="tb-sel" onchange="state.tbBranch=this.value;TB.loadedFor='';TB.sel=null;renderTextbook()">${db.branches.map(x=>`<option value="${esc(x.id)}"${x.id===brId?' selected':''}>${esc(x.name)}</option>`).join('')}</select>` : '';
  const termSel = tbIsMgr()
    ? `<span style="font-size:12px;color:var(--ink-3)">에이스 반이름에 괄호가 없으면</span> <select class="tb-sel" onchange="TB.term=this.value;renderTextbook()"><option value="3"${TB.term==='3'?' selected':''}>3번째 텀(1-3개월)</option><option value="4"${TB.term==='4'?' selected':''}>4번째 텀(4-6개월)</option></select> <span style="font-size:12px;color:var(--ink-3)">으로 봄</span>` : '';
  let html = `<div class="page-head" style="display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap">
      <div><h2>${isT?'내 교재':'교재표'}</h2><div class="sub">${esc(b.name||'')} · ${esc(sem)} · 전체명단의 반 이름으로 자동 정리</div></div>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap">${brSel}${termSel}
      ${tbIsMgr()?'<button class="btn sm" onclick="tbExport()">엑셀 내보내기</button>':''}
      ${isT?'<button class="btn sm" onclick="tbExport()">내 교재 엑셀</button>':''}</div></div>`;
  if(TB.missing) html += `<div class="tb-warn tb-bad"><b>교재표 표가 아직 만들어지지 않았습니다.</b> Supabase → SQL Editor 에서 <b>sql/textbook_list.sql</b> 을 한 번 실행한 뒤 새로고침해 주세요. (그 전에는 목록은 보이지만 체크·수정은 저장되지 않습니다)</div>`;
  if(tbIsMgr() && M.unreadable.length){
    const u=M.unreadable.slice(0,4).map(x=>`${esc(x.teacher)} · ${esc(x.cn)}`).join(' / ');
    html += `<div class="tb-warn">레벨을 못 읽은 반 ${M.unreadable.length}개 — 교재표에서 빠져 있습니다. 예: ${u}${M.unreadable.length>4?' …':''}</div>`;
  }
  if(tbIsMgr()){
    const noList=[]; M.teachers.forEach(t=>t.levels.forEach(L=>{ if(!L.items.length && noList.indexOf(L.label)<0) noList.push(L.label); }));
    if(noList.length) html += `<div class="tb-warn">기본 교재 목록이 없는 레벨: <b>${esc(noList.join(', '))}</b> — 해당 레벨의 [교재 목록 수정]에서 직접 넣어 주세요.</div>`;
  }
  if(!M.teachers.length){
    html += emptyState('이번 학기 전체명단이 없습니다','전체명단이 올라오면 반 이름에서 선생님별 교재가 자동으로 나옵니다.');
    el('content').innerHTML=html; return;
  }
  if(isT){
    html += '<div id="tbBody"></div>';
  } else {
    html += `<div class="tb-wrap"><div class="tb-side"><div class="lab">선생님</div><div id="tbSide"></div></div><div class="tb-main" id="tbBody" style="flex:1"></div></div>`;
  }
  el('content').innerHTML=html;
  tbPaint();
}
function tbPaint(){
  const M=TB.model; if(!M) return;
  const brId=tbBranchId(), isT=session.role==='teacher';
  const side=document.getElementById('tbSide');
  if(side) side.innerHTML = M.teachers.map((t,i)=>{
    const c=tbCount(t);
    return `<div class="tb-t${t.key===TB.sel?' on':''}" onclick="TB.sel='${esc(t.key).replace(/'/g,'')}';tbPaint()"><span>${esc(t.name)}</span><i>${c.got}/${c.all}</i></div>`;
  }).join('');
  const t=M.teachers.find(x=>x.key===TB.sel);
  const body=document.getElementById('tbBody'); if(!body) return;
  if(!t){
    body.innerHTML = isT ? emptyState('이번 학기 담당 반이 없습니다','전체명단이 올라오면 내 교재가 자동으로 나옵니다.') : '';
    return;
  }
  const mgr=tbIsMgr(), c=tbCount(t), pct=c.all?Math.round(c.got/c.all*100):0;
  const wrapStart = isT ? '<div class="tb-main">' : '', wrapEnd = isT ? '</div>' : '';
  let h = wrapStart + `<div class="tb-hd"><div><b>${esc(t.name)}</b> <span style="color:var(--ink-3);font-size:12.5px">${isT?'':'선생님 · '}반 ${t.levels.reduce((s,L)=>s+L.classes.length,0)}개 · 교재 ${c.all}권</span>
      ${isT?'<div style="font-size:12.5px;color:var(--ink-3);margin-top:4px">학원에서 준 교재가 실제로 받은 것과 맞으면 체크해 주세요.</div>':''}</div>
      <div style="text-align:right"><span style="font-size:12.5px;color:var(--ink-3)">수령 확인 ${c.got} / ${c.all}</span><div class="tb-bar"><div style="width:${pct}%"></div></div></div></div>`;
  t.levels.forEach((L,li)=>{
    h += `<div class="tb-lv"><div><b>${esc(L.label)}</b><small>${L.grade?esc(L.grade)+' · ':''}반 ${L.classes.length}개 · 학생 ${L.students}명${L.changed?'<span class="tb-chg">분원 수정</span>':''}</small></div>
      <div>${mgr?`<span class="tb-mini" onclick="tbBulk(${li},'d')">전부 배부</span><span class="tb-mini" onclick="tbEdit(${li})">교재 목록 수정</span>`:`<span class="tb-mini" onclick="tbBulk(${li},'r')">이 레벨 전부 받았어요</span>`}</div></div>
      <div style="font-size:12px;color:var(--ink-3);margin:6px 0 2px">${L.classes.map(x=>esc(tbClassLine(x,brId))).join('  ·  ')}</div>`;
    if(!L.items.length){ h+=`<div style="padding:14px 4px;color:var(--ink-3);font-size:13px">이 레벨은 기본 교재 목록이 없습니다.${mgr?' [교재 목록 수정]에서 넣어 주세요.':' 분원 관리자에게 문의해 주세요.'}</div>`; return; }
    h += `<table class="tb-tbl"><tr><th>교재명</th><th class="a">영역</th><th class="s">학원 배부</th><th class="s">수령 확인</th><th style="width:120px"></th></tr>`;
    L.items.forEach((it,bi)=>{
      const k=tbChk(t.key,L.lk,it.n);
      let nameCell;
      if(mgr && it.a==='활용' && !it.x){
        const opts=tbHwalList().slice(); if(opts.indexOf(it.n)<0) opts.push(it.n);
        nameCell=`<select class="tb-sel" onchange="tbPickHwal(${li},${bi},this.value)">${opts.map(o=>`<option value="${esc(o)}"${o===it.n?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
      } else nameCell=esc(it.n);
      const dCk = mgr ? `<span class="tb-ck${k.delivered?' y':''}" onclick="tbToggle(${li},${bi},'d')"></span>`
                      : `<span class="tb-ck ro${k.delivered?' y':''}"></span>`;
      const rCk = mgr ? `<span class="tb-ck ro${k.received?' y':''}"></span>`
        : (k.delivered ? `<span class="tb-ck${k.received?' y':''}" onclick="tbToggle(${li},${bi},'r')"></span>` : `<span class="tb-ck off" title="아직 학원에서 배부 전입니다"></span>`);
      let ex='';
      if(k.mismatch) ex = isT ? `<span class="tb-neg" onclick="tbToggle(${li},${bi},'m')">받은 것과 달라요 ✕</span>` : '<span class="tb-neg">받은 것과 달라요</span>';
      else if(isT && k.delivered && !k.received) ex=`<span class="tb-neg" style="color:var(--ink-3)" onclick="tbToggle(${li},${bi},'m')">받은 것과 달라요</span>`;
      else if(isT && !k.delivered) ex='<span style="font-size:12px;color:var(--ink-3)">아직 배부 전</span>';
      h += `<tr><td>${nameCell}${it.x?'<span class="tb-ext">외부교재</span>':''}</td><td class="a">${esc(it.a)}</td><td class="s">${dCk}</td><td class="s">${rCk}</td><td>${ex}</td></tr>`;
    });
    h += '</table>';
  });
  if(isT) h += '<div style="margin-top:22px;font-size:12px;color:var(--ink-3)">교재 목록은 분원 관리자만 고칠 수 있어요. 목록이 다르면 [받은 것과 달라요]를 눌러 주세요.</div>';
  body.innerHTML = h + wrapEnd;
}
function tbCur(){ const t=TB.model.teachers.find(x=>x.key===TB.sel); return t; }
function tbToggle(li,bi,w){
  const t=tbCur(); if(!t) return; const L=t.levels[li], it=L.items[bi], k=tbChk(t.key,L.lk,it.n);
  if(w==='d' && tbIsMgr()) tbSetCheck(t.key,L.lk,it.n,{delivered:!k.delivered});
  else if(w==='r' && session.role==='teacher'){ if(k.delivered) tbSetCheck(t.key,L.lk,it.n,{received:!k.received}); }
  else if(w==='m' && session.role==='teacher'){ if(k.delivered||k.mismatch) tbSetCheck(t.key,L.lk,it.n,{mismatch:!k.mismatch}); }
}
async function tbBulk(li, w){
  const t=tbCur(); if(!t) return; const L=t.levels[li];
  for(const it of L.items){
    const k=tbChk(t.key,L.lk,it.n);
    if(w==='d' && !k.delivered) await tbSetCheck(t.key,L.lk,it.n,{delivered:true});
    if(w==='r' && k.delivered && !k.received) await tbSetCheck(t.key,L.lk,it.n,{received:true});
  }
}
/* 활용교재만 드롭다운으로 바꾼다 — 그 레벨의 바뀐 목록으로 저장 */
async function tbPickHwal(li,bi,val){
  const t=tbCur(); if(!t) return; const L=t.levels[li];
  const items=L.items.map((x,i)=>({n:i===bi?val:x.n, a:x.a}));
  if(await tbSaveLevel(tbBranchId(), state.semId, L.lk, items)){ TB.model=tbBuild(tbBranchId(), state.semId); tbPaint(); }
  else tbPaint();
}

/* 교재 목록 수정 창 — 분원 관리자(본사 포함) */
let _tbEdit=null;
function tbEdit(li){
  const t=tbCur(); if(!t) return; const L=t.levels[li];
  _tbEdit={lk:L.lk, label:L.label, items:L.items.map(x=>({n:x.n,a:x.a}))};
  tbEditPaint();
}
function tbEditPaint(){
  const E=_tbEdit;
  const opts=a=>TB_AREAS.map(x=>`<option value="${x}"${x===a?' selected':''}>${x}</option>`).join('')+(TB_AREAS.indexOf(a)<0&&a?`<option selected>${esc(a)}</option>`:'');
  openModal(`<div style="width:min(760px,92vw);max-height:84vh;overflow:auto">
    <h3 style="margin:0 0 4px;font-size:16px">${esc(E.label)} 교재 목록</h3>
    <div style="font-size:12.5px;color:var(--ink-3);margin-bottom:12px">이 분원의 이 레벨만 바뀌고, 기본 목록은 그대로예요. 활용교재 칸에는 기본 목록의 이름이 후보로 떠요.</div>
    <datalist id="tbDl">${tbHwalList().map(o=>`<option value="${esc(o)}">`).join('')}</datalist>
    ${E.items.map((it,i)=>`<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
      <input class="tb-in" list="tbDl" value="${esc(it.n)}" onchange="_tbEdit.items[${i}].n=this.value.trim()" placeholder="교재명 직접 입력">
      <select class="tb-sel" style="width:120px" onchange="_tbEdit.items[${i}].a=this.value">${opts(it.a)}</select>
      <span style="color:var(--ink-3);cursor:pointer;padding:6px;white-space:nowrap" onclick="tbEditDel(${i})">삭제</span></div>`).join('')}
    <div style="margin:6px 0 14px"><span class="btn sm" onclick="tbEditAdd()">+ 교재 추가</span></div>
    <div style="display:flex;justify-content:space-between;gap:8px">
      <span class="btn sm" onclick="tbEditReset()">기본 목록으로 되돌리기</span>
      <span style="display:flex;gap:8px"><span class="btn sm" onclick="closeModal()">취소</span><span class="btn sm primary" onclick="tbEditSave()">저장</span></span></div></div>`);
}
function tbEditDel(i){ _tbEdit.items.splice(i,1); tbEditPaint(); }
function tbEditAdd(){ _tbEdit.items.push({n:'',a:'외부'}); tbEditPaint(); }
async function tbEditSave(){
  const E=_tbEdit;
  const items=E.items.map(x=>({n:String(x.n||'').trim(), a:x.a||''})).filter(x=>x.n);
  if(!items.length && !confirm('교재를 모두 지웠습니다. 이 레벨에는 교재가 없는 것으로 저장할까요?')) return;
  if(await tbSaveLevel(tbBranchId(), state.semId, E.lk, items)){ closeModal(); TB.model=tbBuild(tbBranchId(), state.semId); tbPaint(); toast('저장했습니다'); }
}
async function tbEditReset(){
  if(!confirm('이 레벨을 기본 목록으로 되돌릴까요? 분원이 고친 내용이 사라집니다.')) return;
  const E=_tbEdit; const k=tbBranchId()+'|'+state.semId+'|'+E.lk;
  const { error } = await sb.from('tb_levels').delete().eq('branch_id',tbBranchId()).eq('semester_id',state.semId).eq('level_key',E.lk);
  if(error){ toast('되돌리지 못했습니다','err'); return; }
  TB.levels.delete(k); closeModal(); TB.model=tbBuild(tbBranchId(), state.semId); tbPaint();
}

/* ── 엑셀 ──────────────────────────────────────────────────────── */
/* 시트1 = 본사가 보내던 '분원 교재 배부현황' 양식(레벨·교재 × 선생님, 사용하면 1, 맨 끝 TOT)
   시트2 = 선생님 / 레벨 / 영역 / 교재명을 한 줄씩 — 필터로 선생님별로 바로 볼 수 있게 */
function tbExport(){
  const M=TB.model; if(!M) return;
  const brId=tbBranchId(), semId=state.semId;
  const bn=(getBranch(brId)||{}).name||'분원', sn=(db.semesters.find(s=>s.id===semId)||{}).name||'';
  const ts = session.role==='teacher' ? M.teachers.filter(t=>t.key===TB.sel) : M.teachers;
  const levelMap=new Map();
  ts.forEach(t=>t.levels.forEach(L=>{ if(!levelMap.has(L.lk)) levelMap.set(L.lk,{L:L,teachers:new Set()}); levelMap.get(L.lk).teachers.add(t.key); }));
  const lvs=[...levelMap.values()].sort((a,b)=> banLvRank(a.L.lk.split('|')[0]) - banLvRank(b.L.lk.split('|')[0]) || a.L.lk.localeCompare(b.L.lk));
  const head=['사용 학년','iMS레벨명','영역','사용기간','교재명'].concat(ts.map(t=>t.name),['TOT']);
  const rows=[[bn+' '+sn+' 교재 배부현황'],[],head];
  lvs.forEach(({L,teachers})=>{
    L.items.forEach(it=>{
      const per=/\(고등\)/.test(L.lk)?'12주':'3개월';
      const r=[L.grade, L.label, it.a, per, it.n];
      let tot=0; ts.forEach(t=>{ const on=teachers.has(t.key)&&t.levels.some(x=>x.lk===L.lk); r.push(on?1:''); if(on) tot++; });
      r.push(tot); rows.push(r);
    });
  });
  const ws1=XLSX.utils.aoa_to_sheet(rows);
  ws1['!cols']=[{wch:9},{wch:16},{wch:9},{wch:8},{wch:42}].concat(ts.map(()=>({wch:9})),[{wch:6}]);
  const r2=[['선생님','사용 학년','레벨','영역','교재명','외부교재','학원 배부','수령 확인','비고']];
  ts.forEach(t=>t.levels.forEach(L=>L.items.forEach(it=>{
    const k=tbChk(t.key,L.lk,it.n);
    r2.push([t.name,L.grade,L.label,it.a,it.n,it.x?'외부':'',k.delivered?'O':'',k.received?'O':'',k.mismatch?'받은 것과 다름':'']);
  })));
  const ws2=XLSX.utils.aoa_to_sheet(r2);
  ws2['!cols']=[{wch:14},{wch:9},{wch:16},{wch:9},{wch:42},{wch:8},{wch:9},{wch:9},{wch:16}];
  ws2['!autofilter']={ref:'A1:I'+r2.length};
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, '교재 배부현황');
  XLSX.utils.book_append_sheet(wb, ws2, '선생님별 목록');
  XLSX.writeFile(wb, bn+'_교재표_'+sn+'.xlsx');
}
