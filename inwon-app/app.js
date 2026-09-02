/* ============================================================================
   1. 데이터 레이어 (localStorage, 서버 이전 용이한 정규화 구조)
   ============================================================================ */
const STAGES = ['HC1','HC2','MC1','MC2','MC3'];

/* ----- 학기 자동 계산 -----
   월 기준: 12·1·2=겨울, 3·4·5=봄, 6·7·8=여름, 9·10·11=가을
   12월은 다음 해 겨울학기로 귀속 (예: 2026-12 → "2027년 겨울학기") */
const SEASONS = [
  { key:'winter', label:'겨울', months:[12,1,2] },
  { key:'spring', label:'봄',   months:[3,4,5] },
  { key:'summer', label:'여름', months:[6,7,8] },
  { key:'fall',   label:'가을', months:[9,10,11] },
];
function seasonOfMonth(m){ return SEASONS.find(s=> s.months.includes(m)); }
/* 특정 날짜(Date)가 속한 학기 → {id, name, year, key} */
function semesterOfDate(d){
  const month = d.getMonth()+1;
  const day = d.getDate();
  // 학사일정이 밀려 학기 마지막 달의 마지막 주(약 7일)에 다음 학기 수업이 시작하는 경우:
  // 그 날짜는 다음 학기로 귀속시킨다. (예: 반시작일 8/28 → 여름 아닌 가을)
  const SEASON_LAST_MONTH = { winter:2, spring:5, summer:8, fall:11 };
  const season0 = seasonOfMonth(month);
  if(SEASON_LAST_MONTH[season0.key] === month){
    const lastDay = new Date(d.getFullYear(), month, 0).getDate(); // 해당 달 말일
    if(day >= lastDay - 6){ // 마지막 7일
      // 다음 달 1일로 이동시켜 다음 학기로 재판별 (month는 1-based → new Date의 0-based로 넣으면 다음 달)
      return semesterOfDate(new Date(d.getFullYear(), month, 1));
    }
  }
  let year = d.getFullYear();
  const season = seasonOfMonth(month);
  if(season.key==='winter' && (month===1 || month===2)) year -= 1; // 1~2월은 직전 해 겨울(2026.01 → 25-26겨울 = sem_2025_winter)
  return { id:`sem_${year}_${season.key}`, name:winterAwareName(year, season), year, key:season.key };
}
function winterAwareName(year, season){
  if(season.key==='winter'){
    const yy = String(year).slice(2), ny = String(year+1).slice(2);
    return `${yy}-${ny} ${season.label}학기`; // 25-26 겨울학기
  }
  return `${year}년 ${season.label}학기`;
}
function currentSemester(){ return semesterOfDate(new Date()); }
/* 학기 드롭다운에서 '다음 학기 추가' 선택 시 — 가장 최신 학기의 다음 학기를 만들어 전환 */
/* 학기 추가 — 연도·학기를 드롭다운으로 고르는 팝업. 생성 후 빈 상태로 대시보드부터 시작. */
function goAddSemester(){
  const cy = new Date().getFullYear();
  const years = []; for(let y=cy-1; y<=cy+2; y++) years.push(y);
  const yOpts = years.map(y=>`<option value="${y}" ${y===cy?'selected':''}>${y}년</option>`).join('');
  const sOpts = SEASONS.map(s=>`<option value="${s.key}" ${s.key==='fall'?'selected':''}>${s.label}학기</option>`).join('');
  openModal(`
    <div class="modal-head"><div><h3>학기 추가</h3></div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--ink-2);line-height:1.6;margin-bottom:14px">추가할 학기를 선택하세요. 생성하면 <b>빈 상태(0명)</b>로 시작하고, 대시보드에서 전체명단 업로드 또는 신규생 등록을 진행하면 됩니다.</p>
      <div style="display:flex;gap:10px">
        <div class="field" style="flex:1"><label>연도</label><select id="addSemYear" onchange="updateAddSemPreview()">${yOpts}</select></div>
        <div class="field" style="flex:1"><label>학기</label><select id="addSemSeason" onchange="updateAddSemPreview()">${sOpts}</select></div>
      </div>
      <div id="addSemPreview" style="margin-top:14px;font-weight:800;color:var(--brand);font-size:14px"></div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">취소</button>
      <button class="btn primary" id="addSemYes" onclick="confirmAddSemester()">학기 생성</button>
    </div>`);
  updateAddSemPreview();
}
function addSemPick(){
  const y = parseInt(el('addSemYear').value,10);
  const key = el('addSemSeason').value;
  const season = SEASONS.find(s=>s.key===key);
  return { id:`sem_${y}_${key}`, name:winterAwareName(y, season), year:y, key };
}
function updateAddSemPreview(){
  const sem = addSemPick();
  const exists = db.semesters.some(s=>s.id===sem.id);
  el('addSemPreview').innerHTML = `→ ${esc(sem.name)}` + (exists?` <span style="color:var(--warn);font-weight:700">(이미 있는 학기 — 생성 대신 전환됩니다)</span>`:'');
  const btn = el('addSemYes'); if(btn) btn.textContent = exists ? '이 학기로 전환' : '학기 생성';
}
function confirmAddSemester(){
  const sem = addSemPick();
  if(!db.semesters.some(s=>s.id===sem.id)){
    db.semesters.push({ id:sem.id, name:sem.name });
    const rk = id=>{ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return 0;
      const o={spring:0,summer:1,fall:2,winter:3}; return parseInt(m[1],10)*10+(o[m[2]]||0); };
    db.semesters.sort((a,b)=>rk(b.id)-rk(a.id));
    saveDB();
    toast(`${sem.name} 생성됨`,'ok');
  } else {
    toast(`${sem.name}(으)로 전환`,'ok');
  }
  state.semId = sem.id;
  state.addSemesterMode = false;
  closeModal();
  buildShell();
  go(session.role==='admin' ? 'admin' : 'branch');   // 첫 화면은 대시보드
}
function addNextSemester(){
  // db.semesters 중 가장 최신(rank 큰) 학기를 기준으로 다음 학기 계산
  const rank = id=>{ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return 0;
    const o={spring:0,summer:1,fall:2,winter:3}; return parseInt(m[1],10)*10+(o[m[2]]||0); };
  const latest = [...db.semesters].sort((a,b)=>rank(b.id)-rank(a.id))[0];
  let base;
  if(latest){ const m=String(latest.id).match(/sem_(\d+)_(\w+)/);
    base={year:parseInt(m[1],10), key:m[2]}; }
  else base=currentSemester();
  const next = semesterForward(base, 1);
  if(db.semesters.some(s=>s.id===next.id)){
    state.semId = next.id;  // 이미 있으면 그냥 전환
    buildShell(); render(); return;
  }
  db.semesters.push({ id:next.id, name:next.name });
  // 최신순 재정렬
  const rk = id=>{ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return 0;
    const o={spring:0,summer:1,fall:2,winter:3}; return parseInt(m[1],10)*10+(o[m[2]]||0); };
  db.semesters.sort((a,b)=>rk(b.id)-rk(a.id));
  state.semId = next.id;
  saveDB();
  buildShell();
  toast(`${next.name} 추가됨 — 신규생 등록 또는 전체명단 업로드로 시작하세요`,'ok');
  render();
}

/* 학기 삭제 — 분원 계정 전용.
   · 데이터 있으면: 자기 분원의 그 학기 데이터만 삭제 (학기는 유지)
   · 빈 학기면: 잘못 만든 거라 보고 학기 자체를 목록에서 제거 (현재 진행 학기는 제외) */
function confirmDeleteSemester(){
  const semId = state.semId;
  const sem = db.semesters.find(s=>s.id===semId);
  if(!sem) return;
  const branchId = session.branchId;
  if(!branchId){ toast('분원 계정만 삭제할 수 있습니다','err'); return; }
  const b = getBranch(branchId);
// 지난 학기는 데이터 유무와 상관없이 삭제 잠금 (빈 미래 학기 제거는 허용)
  if(isPastSemester(semId)){ lockedPastToast(); return; }

  const stuCnt = (db.semesterRecords||[]).filter(r=>r.semesterId===semId && r.branchId===branchId).length;
  const hisCnt = (db.counselingHistories||[]).filter(c=>c.semesterId===semId && c.branchId===branchId).length;

  // 빈 학기(이 분원 데이터 없음) → 학기 목록에서 제거 시도
  if(stuCnt===0 && hisCnt===0){
    const cur = currentSemester();
    if(semId===cur.id){ toast('현재 진행 중인 학기는 목록에서 제거할 수 없습니다','err'); return; }
    // 다른 분원이 이 학기에 데이터를 갖고 있으면 목록에서 빼면 안 됨
    const usedByOthers = (db.semesterRecords||[]).some(r=>r.semesterId===semId)
      || (db.counselingHistories||[]).some(c=>c.semesterId===semId);
    if(usedByOthers){ toast('다른 분원이 이 학기 데이터를 사용 중이라 제거할 수 없습니다','err'); return; }
    openConfirm('학기 제거', `「${sem.name}」을(를) 목록에서 제거할까요?\n\n이 학기엔 데이터가 없습니다 (잘못 추가한 학기). 목록에서 사라집니다.`, ()=>{
      db.semesters = db.semesters.filter(s=>s.id!==semId);
      state.semId = db.semesters.some(s=>s.id===cur.id) ? cur.id : (db.semesters[0]?db.semesters[0].id:null);
      showSaving('학기 제거 중…');
      saveDB().then(ok=>{ hideSaving(); closeModal();
        toast(ok?`${sem.name} 제거됨`:'저장 실패, 다시 시도하세요', ok?'ok':'err');
        buildShell(); render();
      });
    }, {yesLabel:'목록에서 제거'});
    return;
  }

  // 데이터 있는 학기 → 자기 분원 데이터만 삭제
  const msg = `정말 「${b?b.name:''} · ${sem.name}」 데이터를 삭제할까요?\n\n이 분원의 이 학기 학생 ${stuCnt}명, 상담이력 ${hisCnt}건, 신규/퇴원·담임변경 기록이 모두 사라집니다. 다른 분원과 다른 학기는 영향받지 않습니다.\n\n복구할 수 없습니다.`;
  openConfirm('학기 데이터 삭제', msg, ()=>{
    const keep = (arr)=> (arr||[]).filter(x=> !(x.semesterId===semId && x.branchId===branchId));
    db.semesterRecords     = keep(db.semesterRecords);
    db.counselingHistories = keep(db.counselingHistories);
    db.studentMovements    = keep(db.studentMovements);
    db.uploadBatches       = keep(db.uploadBatches);
    db.teacherChanges      = keep(db.teacherChanges);
    db.counselRejects      = keep(db.counselRejects);
    db.examClassStages     = keep(db.examClassStages);
    showSaving('학기 데이터 삭제 중…');
    saveDB().then(ok=>{
      hideSaving(); closeModal();
      toast(ok?`${sem.name} 데이터 삭제 완료`:'저장 실패, 다시 시도하세요', ok?'ok':'err');
      render();
    });
  }, {yesLabel:'영구 삭제'});
}
/* 현재 학기에서 n학기 전 */
function semesterBack(base, n){
  const order = ['spring','summer','fall','winter']; // 봄→여름→가을→겨울
  let year = base.year, idx = order.indexOf(base.key);
  for(let i=0;i<n;i++){ idx-=1; if(idx<0){ idx=order.length-1; year-=1; } }
  const key = order[idx];
  const label = SEASONS.find(s=>s.key===key).label;
  return { id:`sem_${year}_${key}`, name:`${year}년 ${label}학기`, year, key };
}
/* 현재 학기에서 n학기 후 */
function semesterForward(base, n){
  const order = ['spring','summer','fall','winter'];
  let year = base.year, idx = order.indexOf(base.key);
  for(let i=0;i<n;i++){ idx+=1; if(idx>=order.length){ idx=0; year+=1; } }
  const key = order[idx];
  const label = SEASONS.find(s=>s.key===key).label;
  return { id:`sem_${year}_${key}`, name:`${year}년 ${label}학기`, year, key };
}
/* db.semesters를 현재 학기 기준으로 최신화 (현재 + 직전 3학기 + 데이터 있는 과거학기 유지) */
function ensureSemesters(){
  if(!db.semesters) db.semesters = [];
  const cur = currentSemester();
  // 현재 학기는 항상 포함 (없으면 추가)
  if(!db.semesters.some(s=>s.id===cur.id)){
    db.semesters.push({ id:cur.id, name:cur.name });
  } else {
    const ex = db.semesters.find(s=>s.id===cur.id);
    if(ex.name!==cur.name) ex.name = cur.name;
  }
  // 실제 데이터(학생 레코드/상담)가 있는 과거 학기 + 현재 + 미래(수동 추가) 학기 유지
  const curRank = (()=>{ const o={spring:0,summer:1,fall:2,winter:3}; return cur.year*10+(o[cur.key]||0); })();
  const rankOf = id=>{ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return 0;
    const o={spring:0,summer:1,fall:2,winter:3}; return parseInt(m[1],10)*10+(o[m[2]]||0); };
  const usedSemIds = new Set([
    cur.id,
    ...((db.semesterRecords||[]).map(r=>r.semesterId)),
    ...((db.counselingHistories||[]).map(c=>c.semesterId)),
  ]);
  db.semesters = db.semesters.filter(s=> usedSemIds.has(s.id) || rankOf(s.id) > curRank);
  // 최신순 정렬
  const rank = id=>{
    const m = String(id).match(/sem_(\d+)_(\w+)/);
    if(!m) return 0;
    const order = {spring:0,summer:1,fall:2,winter:3};
    return parseInt(m[1],10)*10 + (order[m[2]]||0);
  };
  db.semesters.sort((a,b)=> rank(b.id)-rank(a.id));
}

/* ============================================================================
   ★ Supabase 연동 — 여러 컴퓨터에서 같은 데이터 공유
   ============================================================================
   동작 방식:
   - 앱 시작 시 Supabase에서 전체 데이터를 읽어 메모리(db)에 적재
   - 화면 렌더링은 기존처럼 메모리 db를 보고 그림 (렌더 코드 그대로 유지)
   - saveDB() 호출 시, 직전 스냅샷과 비교해 바뀐 행만 서버에 반영(upsert/삭제)
   ============================================================================ */
const SUPABASE_URL = 'https://hplndiuoohantbalixwu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xO8KB46SzMx8KeuEE-OVSw_su22mv9X';
let sb = null;              // supabase client
let dbSnapshot = null;      // 마지막으로 서버와 동기화된 상태(diff 비교용)

/* JS 컬렉션명 ↔ DB 테이블명 ↔ 행 매핑 정의 */
const TABLES = [
  { key:'branches',           table:'branches',             toRow:b=>({id:b.id,name:b.name}),
    fromRow:r=>({id:r.id,name:r.name}) },
{ key:'users', table:'users', toRow:u=>{ const r={id:u.id,username:u.username,role:u.role,branch_id:u.branchId,teacher_name:u.teacherName||null}; if(u.password!==undefined) r.password=u.password; return r; },
    fromRow:r=>({id:r.id,username:r.username,password:r.password,role:r.role,branchId:r.branch_id,teacherName:r.teacher_name,menus:r.menus}) },
  { key:'semesters',          table:'semesters',            toRow:s=>({id:s.id,name:s.name}),
    fromRow:r=>({id:r.id,name:r.name}) },
  { key:'students',           table:'students',             toRow:s=>({id:s.id,code:s.code,name:s.name,school:s.school,grade:s.grade}),
    fromRow:r=>({id:r.id,code:r.code,name:r.name,school:r.school,grade:r.grade}) },
{ key:'semesterRecords',    table:'semester_records',     toRow:r=>({id:r.id,student_id:r.studentId,branch_id:r.branchId,semester_id:r.semesterId,class_name:r.className,class_label:r.classLabel,teacher:r.teacher,note:r.note,target_type:r.targetType,status:r.status,origin:r.origin,enroll_date:r.enrollDate,withdraw_date:r.withdrawDate,transfer:!!r.transfer,transfer_in:!!r.transferIn,transfer_to:r.transferTo||null,kind:r.kind||'regular',withdraw_reason:r.withdrawReason||null,withdraw_memo:r.withdrawMemo||null,grade:r.grade||null}),
    fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,className:r.class_name,classLabel:r.class_label,teacher:r.teacher,note:r.note,targetType:r.target_type,status:r.status,origin:r.origin,enrollDate:r.enroll_date,withdrawDate:r.withdraw_date,transfer:!!r.transfer,transferIn:!!r.transfer_in,transferTo:r.transfer_to,kind:r.kind||'regular',withdrawReason:r.withdraw_reason||null,withdrawMemo:r.withdraw_memo||null,grade:r.grade||''}) },
  { key:'counselingHistories',table:'counseling_histories', toRow:c=>({id:c.id,student_id:c.studentId,branch_id:c.branchId,semester_id:c.semesterId,date:c.date,type:c.type,content:c.content,counselor:c.counselor,batch_id:c.batchId,mistag:!!c.mistag}),
    fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,date:r.date,type:r.type,content:r.content,counselor:r.counselor,batchId:r.batch_id,mistag:!!r.mistag}) },
  { key:'studentMovements',   table:'student_movements',    toRow:m=>({id:m.id,student_id:m.studentId,branch_id:m.branchId,semester_id:m.semesterId,type:m.type,date:m.date,memo:m.memo}),
    fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,type:r.type,date:r.date,memo:r.memo}) },
  { key:'uploadBatches',      table:'upload_batches',       toRow:b=>({id:b.id,branch_id:b.branchId,semester_id:b.semesterId,kind:b.kind,file_name:b.fileName,uploaded_at:b.uploadedAt,added:b.added,dup:b.dup,skip:b.skip,payload:b.payload||null}),
    fromRow:r=>({id:r.id,branchId:r.branch_id,semesterId:r.semester_id,kind:r.kind,fileName:r.file_name,uploadedAt:r.uploaded_at,added:r.added,dup:r.dup,skip:r.skip,payload:r.payload||null}) },
  { key:'teacherChanges',     table:'teacher_changes',      toRow:c=>({id:c.id,branch_id:c.branchId,semester_id:c.semesterId,class_name:c.className,from_teacher:c.fromTeacher,to_teacher:c.toTeacher,date:c.date}),
    fromRow:r=>({id:r.id,branchId:r.branch_id,semesterId:r.semester_id,className:r.class_name,fromTeacher:r.from_teacher,toTeacher:r.to_teacher,date:r.date}) },
    { key:'segments', table:'segments', toRow:s=>({id:s.id,branch_id:s.branchId,semester_id:s.semesterId,stage:s.stage,sec1:s.sec1,sec2:s.sec2,sec3:s.sec3,sec4:s.sec4,updated_at:s.updatedAt}),
    fromRow:r=>({id:r.id,branchId:r.branch_id,semesterId:r.semester_id,stage:r.stage,sec1:r.sec1,sec2:r.sec2,sec3:r.sec3,sec4:r.sec4,updatedAt:r.updated_at}) },
   { key:'mcExemptions', table:'mc_exemptions', toRow:e=>({id:e.id,student_id:e.studentId,branch_id:e.branchId,semester_id:e.semesterId,stage:e.stage}),
    fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,stage:r.stage}) },
    { key:'qappScores', table:'qapp_scores', toRow:s=>({id:s.id,branch_id:s.branchId,semester_id:s.semesterId,student_code:s.studentCode,student_name:s.studentName,class_label:s.classLabel,gubun:s.gubun,hoi:s.hoi,lesson:s.lesson,textbook:s.textbook,teacher:s.teacher,jumsu:s.jumsu,baejeom:s.baejeom,eungsi:s.eungsi,tonggwa:s.tonggwa,yeyak:s.yeyak,exam_date:s.examDate,fingerprint:s.fingerprint}),
    fromRow:r=>({id:r.id,branchId:r.branch_id,semesterId:r.semester_id,studentCode:r.student_code,studentName:r.student_name,classLabel:r.class_label,gubun:r.gubun,hoi:r.hoi,lesson:r.lesson,textbook:r.textbook,teacher:r.teacher,jumsu:r.jumsu,baejeom:r.baejeom,eungsi:r.eungsi,tonggwa:r.tonggwa,yeyak:r.yeyak,examDate:r.exam_date,fingerprint:r.fingerprint}) },
    /* 내신반이 몇 회차인지 (사람이 반별로 지정). sql/exam_class_stages.sql — optional */
    { key:'examClassStages', table:'exam_class_stages', optional:true,
    toRow:r=>({id:r.id,branch_id:r.branchId,semester_id:r.semesterId,class_name:r.className,stage:r.stage}),
    fromRow:r=>({id:r.id,branchId:r.branch_id,semesterId:r.semester_id,className:r.class_name,stage:r.stage}) },
    /* 상담 인정 제외(△). sql/counsel_rejects.sql 을 아직 안 돌렸어도 앱이 죽지 않게 optional */
    { key:'counselRejects', table:'counsel_rejects', optional:true,
    toRow:r=>({id:r.id,student_id:r.studentId,branch_id:r.branchId,semester_id:r.semesterId,stage:r.stage,content_key:r.contentKey,created_at:r.createdAt||null}),
    fromRow:r=>({id:r.id,studentId:r.student_id,branchId:r.branch_id,semesterId:r.semester_id,stage:r.stage,contentKey:r.content_key,createdAt:r.created_at}) },
    { key:'teacherOverrides', table:'teacher_overrides', toRow:o=>({id:o.id,branch_id:o.branchId,semester_id:o.semesterId,class_label:o.classLabel,gubun:o.gubun,teacher:o.teacher}),
    fromRow:r=>({id:r.id,branchId:r.branch_id,semesterId:r.semester_id,classLabel:r.class_label,gubun:r.gubun,teacher:r.teacher}) },
];

const MISSING_TABLES = new Set();   // 아직 Supabase에 안 만든 optional 표
function blankDB(){
  return { users:[], branches:[], semesters:[], students:[],
           semesterRecords:[], counselingHistories:[], studentMovements:[],
           uploadBatches:[], teacherChanges:[], segments:[], mcExemptions:[],
           counselRejects:[], examClassStages:[] };
}
let db = null;

/* Supabase 클라이언트 초기화 */
function initSupabase(){
  if(sb) return sb;
  if(typeof supabase==='undefined' || !supabase.createClient){
    throw new Error('Supabase 라이브러리가 로드되지 않았습니다 (인터넷 연결 확인).');
  }
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return sb;
}

/* 서버에서 전체 데이터 읽기 → 메모리 db.
   Supabase는 한 요청에 최대 1000행만 주므로, range()로 끝까지 페이지를 넘기며 전부 가져옴. */
async function loadDB(){
  initSupabase();
  db = blankDB();
  MISSING_TABLES.clear();
  const PAGE = 1000;
  for(const t of TABLES){
    let all = [];
    let from = 0;
    let gone = false;
    while(true){
      const { data, error } = await sb.from(t.table).select('*').range(from, from+PAGE-1);
      if(error && t.optional){
        // 아직 만들지 않은 표 — 기능만 잠깐 쉬고 나머지는 그대로 쓴다
        console.warn('optional table missing', t.table, error.message||error);
        MISSING_TABLES.add(t.key); gone = true; break;
      }
      if(error){ console.error('load fail', t.table, error); throw error; }
      const chunk = data || [];
      all = all.concat(chunk);
      if(chunk.length < PAGE) break;   // 마지막 페이지 (1000개 미만이면 끝)
      from += PAGE;
    }
    db[t.key] = gone ? [] : all.map(t.fromRow);
  }
  // 기존 데이터 보정: classLabel이 원본 형식(대괄호 포함)이면 깔끔한 라벨로 변환
  (db.semesterRecords||[]).forEach(r=>{
    if(r.classLabel && /^\s*\[/.test(r.classLabel)){
      r.classLabel = classLabel(r.classLabel) || r.classLabel;
    }
  });
 // 기존 퇴원생 보정: studentMovements.memo → rec.withdrawMemo 로 1회 이관
  (db.semesterRecords||[]).forEach(r=>{
    if(r.status!=='withdraw') return;
    if(r.withdrawMemo!=null) return;
    const mv = (db.studentMovements||[]).find(m=>m.studentId===r.studentId && m.branchId===r.branchId && m.semesterId===r.semesterId && m.type==='withdraw');
    let memo = (mv && mv.memo) || '';
    memo = memo.replace(/^\[[^\]]*\]\s*/, '').trim();   // [전출→…] / [사유] 접두사 제거
    if(memo==='퇴원 처리') memo='';
    r.withdrawMemo = memo;
  });

  // 학기 자동 보강 (현재+직전 학기). 새로 추가된 학기는 서버에도 저장.
  ensureSemesters();
  dbSnapshot = JSON.parse(JSON.stringify(db));  // 기준 스냅샷
  await saveDB(); // ensureSemesters로 늘어난 학기 등 반영
}

/* ============================================================================
   교재관리(bk_students) 자동 동기화
   - 원무에서 신규 등록(재원) → bk_students upsert(재원)
   - 원무에서 퇴원 처리      → bk_students status='퇴원' (기록·미납은 그대로 유지, 절대 삭제 안 함)
   - 연결 키: bk_students.student_id = 회원코드(students.code)
   - 분원: 교재관리는 자체 코드 사용(아래 매핑). 아산탕정 등 교재관리에 없는 분원은 건너뜀.
   ============================================================================ */
const BK_BRANCH_BY_NAME = {
  '남동탄':'namdongtanjls', '수원':'suwon_jls', '장안':'suwonjls2009',
  '서수원':'seosuwonjls', '운정1':'unjeongjls', '운정2':'unjeongjls2'
};
function bkBranchCode(branchId){
  const b=getBranch(branchId); if(!b) return null;
  const key=String(b.name||'').replace(/분원$/,'').trim();
  return BK_BRANCH_BY_NAME[key]||null;
}
function bkSemester(semId){
  const m=String(semId||'').match(/sem_(\d+)_(\w+)/); if(!m) return null;
  const yy=String(m[1]).slice(2), s={spring:'봄',summer:'여름',fall:'가을',winter:'겨울'}[m[2]];
  return s?(yy+'년'+s):null;
}
function bkDivision(grade, className){
  const cn=String(className||'').toUpperCase();
  const mm=cn.match(/\[?\s*([A-Z]+)/); const lv=mm?mm[1]:'';
  if(/^(IS|DS|LS|MS)/.test(lv)) return 'CHESS';
  return 'ACE';
}
/* 바뀐 semesterRecords만 교재관리로 반영 (saveDB 성공 후 호출). 실패해도 원무 저장엔 영향 없음.
   ★ 학기 보존 — bk_students는 (student_id, branch) 한 행 구조라, 학기가 바뀌면 이전 학기가 덮어써진다.
     그래서 덮어쓰기 전에 이전 학기 행을 bk_students_history에 스냅샷으로 남긴다.
     (교재관리 앱의 명단 업로드가 쓰는 방식과 동일. 교재앱 학기별 조회가 현재+history를 합쳐 보므로,
      가을 명단을 올려도 여름 학기 조회는 그대로 남는다.)
     스냅샷에 실패한 학생은 덮어쓰지 않고 건너뛴다 → 지난 학기가 유실되는 일은 없다. */
const BK_SNAP_COLS='student_id,name,contact,grade,class_name,semester,note,created_at,branch,division,status,updated_at,school';
async function mirrorToBooks(records){
  if(!sb || !records || !records.length) return;
  const nowIso=new Date().toISOString();
  const wdByBranch={};
  // 같은 학생이 여러 학기 행으로 한꺼번에 바뀌었으면 최신 학기 1건만 남긴다.
  // (한 배치 안에 (student_id,branch) 중복이 있으면 Supabase upsert가 통째로 실패한다)
  const upMap=new Map();
  for(const r of records){
    if((r.kind||'regular')==='exam') continue;              // 내신반은 교재 대상 아님 — 정규반 반정보를 덮어쓰지 않게 제외
    const st=getStudent(r.studentId); const code=st&&st.code?st.code:null; if(!code) continue;
    const bk=bkBranchCode(r.branchId); if(!bk) continue;   // 교재관리에 없는 분원 제외
    if(r.status==='active'){
      const key=code+'|'+bk, rank=semRank(r.semesterId);
      const prev=upMap.get(key);
      if(prev && prev._rank>rank) continue;                 // 이미 더 최신 학기 행을 잡아둠
      upMap.set(key,{ _rank:rank, row:{ student_id:code, branch:bk, name:st.name||'', grade:st.grade||null, school:st.school||null,
        class_name:r.classLabel||r.className||null, semester:bkSemester(r.semesterId),
        division:bkDivision(st.grade, r.className), status:'재원', updated_at:nowIso } });
    } else if(r.status==='withdraw'){
      (wdByBranch[bk]=wdByBranch[bk]||[]).push(code);
    }
  }
  let upserts=[...upMap.values()].map(v=>v.row);
  let snapFail=0, upFail=0;
  try{
    // ── 학기가 바뀌는 학생은 덮어쓰기 전에 이전 학기를 history로 백업 ──
    const byBranch={};
    upserts.forEach(u=>{ (byBranch[u.branch]=byBranch[u.branch]||[]).push(u); });
    const blocked=new Set();   // 백업 실패 → 덮어쓰지 않을 학생 ('학생코드|분원')
    for(const bk of Object.keys(byBranch)){
      const newSem=new Map(byBranch[bk].map(u=>[u.student_id,u.semester]));
      const ids=[...newSem.keys()]; const olds=[];
      for(let i=0;i<ids.length;i+=200){
        const chunk=ids.slice(i,i+200);
        const { data, error }=await sb.from('bk_students').select(BK_SNAP_COLS).eq('branch',bk).in('student_id',chunk);
        // 기존 행을 못 읽으면 학기가 바뀌는지 알 수 없다 → 안전하게 덮어쓰기 보류
        if(error){ console.error('교재관리 기존 명단 조회 실패', error); chunk.forEach(c=>blocked.add(c+'|'+bk)); snapFail++; continue; }
        if(data) olds.push(...data);
      }
      // 학기가 실제로 달라지는 행만 스냅샷 (같은 학기 재업로드는 백업할 필요 없음)
      const snapRows=olds.filter(o=> o.semester && newSem.get(o.student_id) && o.semester!==newSem.get(o.student_id));
      for(let i=0;i<snapRows.length;i+=200){
        const slice=snapRows.slice(i,i+200);
        const { error }=await sb.from('bk_students_history').insert(slice.map(o=>Object.assign({snapshot_at:nowIso},o)));
        if(error){ console.error('교재관리 학기 스냅샷 실패', error); slice.forEach(o=>blocked.add(o.student_id+'|'+bk)); snapFail++; }
      }
    }
    if(blocked.size) upserts=upserts.filter(u=>!blocked.has(u.student_id+'|'+u.branch));
    for(let i=0;i<upserts.length;i+=200){
      const { error }=await sb.from('bk_students').upsert(upserts.slice(i,i+200),{onConflict:'student_id,branch'});
      if(error){ console.error('교재관리 신규 반영 실패', error); upFail++; }
    }
    for(const bk of Object.keys(wdByBranch)){
      const codes=[...new Set(wdByBranch[bk])];
      for(let i=0;i<codes.length;i+=200){
        // 이미 교재관리에 있는 학생만 퇴원 표시(없으면 아무 행도 안 바뀜) — 기록·미납 그대로 보존
        const { error }=await sb.from('bk_students').update({status:'퇴원',updated_at:nowIso}).eq('branch',bk).in('student_id',codes.slice(i,i+200));
        if(error){ console.error('교재관리 퇴원 반영 실패', error); upFail++; }
      }
    }
  }catch(e){ console.error('교재관리 동기화 오류', e); upFail++; }
  // 조용히 실패하면 모르고 지나가므로, 실패했을 때만 알린다
  if(snapFail||upFail){
    toast(snapFail
      ? '교재관리 반영 일부 실패 — 지난 학기 백업이 안 돼서 해당 학생은 덮어쓰지 않았습니다. 새로고침 후 다시 저장해 주세요.'
      : '교재관리 반영에 일부 실패했습니다. 새로고침 후 다시 저장해 주세요.', 'err');
  }
}

/* 메모리 db를 서버에 동기화 — 직전 스냅샷과 비교해 바뀐 행만 upsert + 삭제된 행 delete.
   대량 데이터는 Supabase 요청 한도를 넘지 않게 잘게 나눠서 보냄(배치). */
async function saveDB(){
  if(session && session.canEdit===false){ toast('뷰어 계정은 수정 권한이 없습니다',false); return false; }  // 읽기전용 게이트
  if(!sb){ try{ initSupabase(); }catch(e){ console.error(e); return false; } }
  const CHUNK = 200;  // 한 번에 보낼 최대 행 수
  let failed = false;
  const bkChangedRecs = [];   // 교재관리로 반영할 바뀐 명단(재원/퇴원) 행
  try{
    for(const t of TABLES){
      if(t.optional && MISSING_TABLES.has(t.key)) continue;   // 표가 아직 없으면 저장도 건너뛴다
      const cur = db[t.key] || [];
      const prev = (dbSnapshot && dbSnapshot[t.key]) || [];
      const curById = new Map(cur.map(x=>[x.id,x]));
      const prevById = new Map(prev.map(x=>[x.id,x]));
      // upsert 대상: 새로 생겼거나 내용이 바뀐 행
      const ups = [];
      for(const [id,row] of curById){
        const before = prevById.get(id);
        if(!before || JSON.stringify(before)!==JSON.stringify(row)){ ups.push(t.toRow(row)); if(t.key==='semesterRecords') bkChangedRecs.push(row); }
      }
      // 삭제 대상: 이전엔 있었는데 지금 없는 행
      const delIds = [];
      for(const id of prevById.keys()){ if(!curById.has(id)) delIds.push(id); }
      // upsert 배치 처리
      for(let i=0;i<ups.length;i+=CHUNK){
        const slice = ups.slice(i, i+CHUNK);
        const { error } = await sb.from(t.table).upsert(slice);
        if(error){ console.error('upsert fail', t.table, error); failed = true; }
      }
      // delete 배치 처리
      for(let i=0;i<delIds.length;i+=CHUNK){
        const slice = delIds.slice(i, i+CHUNK);
        const { error } = await sb.from(t.table).delete().in('id', slice);
        if(error){ console.error('delete fail', t.table, error); failed = true; }
      }
    }
    if(failed){
      toast('일부 데이터 저장에 실패했습니다. 새로고침 후 다시 시도하세요.','err');
      return false;  // 스냅샷 갱신 안 함 → 다음 저장에서 재시도
    }
    dbSnapshot = JSON.parse(JSON.stringify(db));  // 동기화 완료 → 스냅샷 갱신
    mirrorToBooks(bkChangedRecs);  // 교재관리 자동 반영(실패해도 원무 저장 성공엔 영향 없음)
    return true;
  }catch(e){ console.error('saveDB error', e); toast('서버 저장 중 오류가 발생했습니다','err'); return false; }
}

/* 전체 초기화 — 학생/상담/명단/이동/배치 비우고 분원·계정·학기는 유지 */
async function resetDB(){
  // 데이터성 테이블만 비움 (branches/users/semesters 유지)
  for(const key of ['students','semesterRecords','counselingHistories','studentMovements','uploadBatches']){
    db[key] = [];
  }
  ensureSemesters();
  await saveDB();
}
function uid(p){ return p+'_'+Math.random().toString(36).slice(2,9); }

/* ----- 세션 ----- */
const SESSION_KEY = 'jls_session_v1';
let session = null;
function loadSession(){ try{ session = JSON.parse(sessionStorage.getItem(SESSION_KEY)); }catch(e){ session=null; } }
function setSession(s){ session = s; sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession(){ session=null; sessionStorage.removeItem(SESSION_KEY); }

/* ---------- 로그인 · 비밀번호 (확인은 전부 서버에서) ----------
   users 표에서 비밀번호를 걷어냈다. sql/auth_stage1.sql 을 아직 안 돌렸으면
   RPC가 없으므로 예전 방식으로 자동 폴백한다. */
function rpcMissing(e){
  const m = String((e && (e.message || e.hint)) || '');
  return (e && e.code === 'PGRST202') || /Could not find the function|schema cache|does not exist/i.test(m);
}
function pwColumnExists(){ return (((db && db.users) || []).some(u => u.password !== undefined)); }
let _actorPw = null;                      // 이번 탭에서만 기억
async function actorPw(){
  if(_actorPw) return _actorPw;
  const p = window.prompt('본인 확인 — 로그인 비밀번호를 입력하세요:');
  if(p == null || !p) return null;
  _actorPw = p; return p;
}
/* 비밀번호 지정 — true / 취소하면 null */
async function setUserPwSafe(targetId, newPw){
  if(!sb){ try{ initSupabase(); }catch(e){ throw e; } }
  const me = db.users.find(u=>u.id===session.userId) || {};
  try{
    const ap = await actorPw(); if(ap == null) return null;
    const { error } = await sb.rpc('jls_set_password', {
      p_actor_login: me.username, p_actor_password: ap,
      p_target_id: String(targetId), p_new: newPw });
    if(error){ _actorPw = null; if(rpcMissing(error)) throw 'legacy'; throw error; }
    return true;
  }catch(e){
    if(e !== 'legacy') throw e;
    const { error } = await sb.from('users').update({ password:newPw }).eq('id', targetId);
    if(error) throw error;
    return true;
  }
}
/* menus 배열 → 인원현황 세부권한 6종. 세부 지정이 전혀 없으면 null(=전체 허용, 기존 동작 유지).
   구버전 키(inwon.hyeon/stu/counsel/set)도 새 6종으로 매핑(하위호환). */
function inwonPermsFromMenus(menusArr){
  let s; try{ s=new Set(Array.isArray(menusArr)?menusArr:JSON.parse(menusArr||'[]')); }catch(e){ s=new Set(); }
  const NEW=['inwon.roster','inwon.closing','inwon.students','inwon.segments','inwon.data'];
  const OLD=['inwon.hyeon','inwon.stu','inwon.counsel','inwon.set'];
  if(!NEW.some(k=>s.has(k)) && !OLD.some(k=>s.has(k))) return null;   // 세부지정 없음 → 전체 허용
  return {
    roster:   s.has('inwon.roster')   || s.has('inwon.hyeon'),
    closing:  s.has('inwon.closing')  || s.has('inwon.hyeon'),
    students: s.has('inwon.students') || s.has('inwon.stu'),
    segments: s.has('inwon.segments') || s.has('inwon.counsel'),
    data:     s.has('inwon.data')     || s.has('inwon.set'),
  };
}
/* 현재 로그인 계정의 인원현황 세부권한 (db.users의 menus에서 계산). null이면 전체 허용 */
function curInwonPerms(){
  const u=(db.users||[]).find(x=> session && (x.id===session.userId || x.username===session.username));
  return inwonPermsFromMenus(u && u.menus);
}
const INWON_PALL={roster:1,closing:1,students:1,segments:1,data:1};

/* ============================================================================
   2. (시드 함수 제거됨 — 분원·계정·학기는 Supabase에서 관리)
   ============================================================================ */


/* ============================================================================
   3. 조회 / 계산 로직
   ============================================================================ */
function getBranch(id){ return db.branches.find(b=>b.id===id); }
function getStudent(id){ return db.students.find(s=>s.id===id); }
function currentSemId(){ return state.semId; }
/* 지난 학기인지 — 보고 있는 학기가 오늘 기준 현재 학기보다 과거면 true.
   과거 학기는 삭제·전체명단 업로드 잠금 (상담이력 추가 업로드는 허용).
   미래 학기(잘못 만든 다음 학기)는 과거가 아니므로 잠그지 않음. */
function semRank(id){
  const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return 0;
  const o={spring:0,summer:1,fall:2,winter:3}; return parseInt(m[1],10)*10+(o[m[2]]||0);
}
function isPastSemester(semId){
  if(state.migrationMode) return false; // 과거 데이터 이관 중엔 잠금 전체 해제
  const cur = currentSemester();
  return semRank(semId) < semRank(cur.id);
}
/* 지난 학기 보호 안내 팝업 — 잠금 해제 안내 포함 */
function lockedPastToast(){
  const tail = canUnlockPast()
    ? '정말 수정해야 하면, 데이터관리 화면 위쪽의 "🔓 지난 학기 잠금 해제"를 눌러 푸신 뒤 진행하세요.'
    : '수정이 필요하면 서수원분원 엄윤경 대리 계정에서만 잠금 해제가 가능합니다.';
  openConfirm('지난 학기는 잠겨 있습니다',
    '이미 마감된 지난 학기 데이터입니다.\n\n삭제와 전체명단 덮어쓰기는 막아두었습니다. (실수로 지난 장부가 날아가는 걸 방지)\n\n'+tail,
    ()=>{ closeModal(); }, {yesLabel:'확인', danger:false});
}
/* 지난 학기 잠금 해제 / 다시 잠그기 (이 세션 한정 — 새로고침하면 자동 재잠금) */
/* 지난 학기 잠금 해제 권한 — 서수원분원 엄윤경 대리(로그인 아이디 '엄윤경')만. 어드민 포함 그 외 전원 불가. */
function canUnlockPast(){ return !!(session && session.username==='엄윤경'); }
function unlockPast(){
  if(!canUnlockPast()){
    openConfirm('권한 없음','지난 학기 잠금 해제는 서수원분원 엄윤경 대리 계정에서만 가능합니다.', ()=>closeModal(), {yesLabel:'확인', danger:false});
    return;
  }
  openConfirm('지난 학기 잠금을 풀까요?',
    '지난 학기 데이터를 삭제·덮어쓸 수 있게 됩니다.\n실수로 지난 명단이 바뀔 수 있으니 주의하세요.\n\n(새로고침하면 자동으로 다시 잠깁니다.)',
    ()=>{ state.migrationMode=true; closeModal(); toast('잠금 해제됨 — 이제 명단을 다시 올릴 수 있어요','ok'); render(); },
    {yesLabel:'잠금 해제', danger:true});
}
function relockPast(){ state.migrationMode=false; toast('다시 잠갔어요','ok'); render(); }

/* 한 학기 한 분원의 학기레코드 — 정규반(regular)만. 내신반(exam)은 인원 집계 전부 제외 */
function recordsOf(branchId, semId){
  return db.semesterRecords.filter(r=>r.branchId===branchId && r.semesterId===semId && (r.kind||'regular')!=='exam');
}
function activeRecordsOf(branchId, semId){
  return recordsOf(branchId,semId).filter(r=>r.status==='active');
}
/* 내신반(exam)만 — 표시용. 인원에 더하지 않고 "현재 내신반 N명"만 보여줄 때 사용 */
function examRecordsOf(branchId, semId){
  return db.semesterRecords.filter(r=>r.branchId===branchId && r.semesterId===semId && (r.kind||'regular')==='exam' && r.status==='active');
}
/* 상담률 계산용 — 정규반 active + 내신반 active 합친 레코드.
   인원/퇴원 집계엔 쓰지 말 것(그건 recordsOf/activeRecordsOf만). 상담률(calcRates) 전용. */
function rateRecordsOf(branchId, semId){
  // 상담률 분모엔 재원생 + 퇴원생(정규반) 모두 포함.
  // 퇴원생은 isTarget이 '퇴원월 이후 회차'를 알아서 제외하므로,
  // 퇴원 전에 했어야 할 회차의 펑크는 정직하게 분모에 잡힌다.
  return recordsOf(branchId, semId).concat(examRecordsOf(branchId, semId));
}
/* 특정 담임의 정규+내신 active 합본 (상담률용) */
function rateRecordsOfTeacher(branchId, semId, teacher){
  return rateRecordsOf(branchId, semId).filter(r=>r.teacher===teacher);
}

/* 학기 시작 월 (학기명에서 계절 추출) → [1번째달, 2번째달, 3번째달] */
function semesterMonths(semId){
  const sem = db.semesters.find(s=>s.id===semId);
  const name = sem ? sem.name : '';
  if(name.includes('겨울')) return [12,1,2];
  if(name.includes('봄'))   return [3,4,5];
  if(name.includes('여름')) return [6,7,8];
  if(name.includes('가을')) return [9,10,11];
  return [1,2,3];
}

/* 상담 회차와 실제 상담 날짜를 비교해 어느 학기 상담인지 판정.
   - HC1/HC2: 입학월 기준. (입학월 전달) ~ (학기 마지막 달) 사이면 인정.
              입학일 없으면 학기 첫 달 신규로 보고 첫 달의 전달부터 인정.
              그보다 전이면 이전 학기 상담 → 'prev'.
   - MC1~3: 기존대로 회차-월 비교. */
function stageTimingCheck(type, dateStr, semId, enrollDate){
  const months = semesterMonths(semId);            // 예: [6,7,8]
  const m = String(dateStr||'').match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(!m) return 'ok';                              // 날짜 파싱 불가 → 인정
  const cMonth = parseInt(m[2],10);

  if(type==='HC1' || type==='HC2'){
    // 입학월: 있으면 그 월, 없으면 학기 첫 달(시작신규생)
    const em = String(enrollDate||'').match(/\d{4}-(\d{1,2})/);
    const enrollM = em ? parseInt(em[1],10) : months[0];
    // 인정 시작월 = 입학월의 전달 (단, 학기 첫 달보다 앞서면 학기 첫 달의 전달로 맞춤)
    const baseM = Math.max(enrollM, months[0]);    // 입학월이 학기 첫 달보다 이르면 첫 달 기준
    const prevMonth = baseM===1 ? 12 : baseM-1;    // 그 달의 전달
    // 인정 범위: 전달 + 학기 3개월
    const okMonths = [prevMonth, ...months];
    return okMonths.includes(cMonth) ? 'ok' : 'prev';
  }

  const stageIdx = { MC1:0, MC2:1, MC3:2 }[type];  // 회차의 정상 '몇 번째 달'
  if(stageIdx==null) return 'ok';
  const slot = months.indexOf(cMonth);             // 상담월이 이 학기의 몇 번째 달인지
  if(slot===-1) return 'prev';                     // 학기 3개월에 없음 → 이전학기
const diff = stageIdx - slot;                    // 회차정상위치 - 실제상담위치
  if(diff <= 0) return 'ok';
  if(diff === 1){
    // 월말(25일 이후)에 다음 달 회차를 미리 한 경우는 정상으로 인정
    const day = parseInt(m[3],10);
    if(day >= 25) return 'ok';
    return 'mistag';
  }
  return 'prev';
}
/* 입학일(enrollDate)에서 월 추출. 없으면 null(=학기초부터 다닌 학생) */
function enrollMonth(rec){
  if(!rec.enrollDate) return null;
  const m = String(rec.enrollDate).match(/\d{4}-(\d{1,2})/) || String(rec.enrollDate).match(/\d{4}\.(\d{1,2})/);
  return m ? parseInt(m[1],10) : null;
}
/* 퇴원월 추출 (withdrawDate 우선, 없으면 이동이력) */
function withdrawMonth(rec){
  let d = rec.withdrawDate;
  if(!d){
    const mv = db.studentMovements.find(m=>m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId && m.type==='withdraw');
    d = mv && mv.date;
  }
  if(!d) return null;
  const m = String(d).match(/\d{4}-(\d{1,2})/) || String(d).match(/\d{4}\.(\d{1,2})/);
  return m ? parseInt(m[1],10) : null;
}
/* 변경월을 변경일(cutDay) 기준으로 앞/뒤 구간 실적으로 쪼갬.
   퇴원 책임: 변경일 당일까지(<=cutDay) = 이전 담임(마지막 수업이 이전 담임),
            변경일 다음날부터(>cutDay) = 새 담임.
   신규/등원: 변경일 당일부터(>=cutDay) = 새 담임이 받음. */
function splitMonthForGroup(recs, month, cutDay){
  let monthStart = 0;
  recs.forEach(r=>{
    const em = r.enrollDate ? monthOfDate(r.enrollDate) : null;
    const wm = r.withdrawDate ? monthOfDate(r.withdrawDate) : null;
    const enrolledBefore = (em==null || em<month);
    const notLeftBefore  = (wm==null || wm>=month);
    if(enrolledBefore && notLeftBefore) monthStart++;
  });
  // 신규: 변경일 전(<cutDay)은 이전 담임, 당일부터(>=cutDay)는 새 담임
  const newBefore = recs.filter(r=> monthOfDate(r.enrollDate)===month && dayOfDate(r.enrollDate)<cutDay).length;
  const newAfter  = recs.filter(r=> monthOfDate(r.enrollDate)===month && dayOfDate(r.enrollDate)>=cutDay).length;
  // 퇴원: 변경일 당일까지(<=cutDay)는 이전 담임, 다음날부터(>cutDay)는 새 담임
  const wdBefore  = recs.filter(r=> monthOfDate(r.withdrawDate)===month && dayOfDate(r.withdrawDate)<=cutDay && !r.transfer).length;
  const trBefore  = recs.filter(r=> monthOfDate(r.withdrawDate)===month && dayOfDate(r.withdrawDate)<=cutDay && r.transfer).length;
  const wdAfter   = recs.filter(r=> monthOfDate(r.withdrawDate)===month && dayOfDate(r.withdrawDate)>cutDay && !r.transfer).length;
  const trAfter   = recs.filter(r=> monthOfDate(r.withdrawDate)===month && dayOfDate(r.withdrawDate)>cutDay && r.transfer).length;
  const handover  = monthStart + newBefore - wdBefore - trBefore; // 인계 시점 인원
  return {
    before:{ monthStart, newCnt:newBefore, wd:wdBefore, tr:trBefore },
    after: { monthStart:handover, newCnt:newAfter, wd:wdAfter, tr:trAfter },
  };
}
/* 인원마감 — 한 그룹(강사 또는 레벨)의 월별 월초+신규/퇴원/퇴원율 계산.
   recs: 해당 그룹의 semesterRecords(재원+퇴원 모두 포함). months: [3,4,5] 등.
   첫 달 월초 = 학기초부터 다닌 인원(enrollMonth==null).
   이후 달 월초 = 전달(월초+신규) − 전달 퇴원.
   월별 퇴원율 = 그 달 퇴원 ÷ (월초+신규). 평균퇴원율 = 월별 퇴원율의 단순평균. */
function monthlyClosing(recs, months, activeMonths, splits, moves){
  // activeMonths: 담당 월 Set (그 외 빈칸). splits: 변경월 날짜쪼갬 정보 배열.
  // moves: 반이동 보정 {out:Map(month→cnt), in:Map(month→cnt)} — 컬럼엔 안 뜨고 다음달 월초에만 반영(반이동으로 인한 월초 변동).
  const startOfSem = recs.filter(r=> enrollMonth(r)==null).length;
  const splitByMonth = new Map();
  (splits||[]).forEach(sp=> splitByMonth.set(sp.month, sp));
  const mvOut = (moves&&moves.out)||null, mvIn = (moves&&moves.in)||null;
  let carry = 0, prevMoveIn = 0, prevMoveOut = 0;
  const cells = [];
  const rates = [];
  months.forEach((m, idx)=>{
    const active = !activeMonths || activeMonths.has(m);
    const sp = splitByMonth.get(m);
    let monthStart = idx===0 ? startOfSem : carry;
let newThis, tiThis=0, wdThis, trThis;
    if(sp){
      // 변경월: 날짜로 쪼갬
      const split = splitMonthForGroup(recs, m, sp.cutDay);
      const part = sp.side==='before' ? split.before : split.after;
      monthStart = part.monthStart;
      newThis = part.newCnt;
      wdThis = part.wd;
      trThis = part.tr;
} else {
      newThis = recs.filter(r=> enrollMonth(r)===m && !r.transferIn).length;
      tiThis  = recs.filter(r=> enrollMonth(r)===m && r.transferIn).length;
      wdThis  = recs.filter(r=> withdrawMonth(r)===m && !r.transfer).length;
      trThis  = recs.filter(r=> withdrawMonth(r)===m && r.transfer).length;
    }
const baseNew = monthStart + newThis + tiThis;
    const rate = baseNew>0 ? (wdThis/baseNew*100) : 0;
    const moveOutThis = mvOut ? (mvOut.get(m)||0) : 0;   // 이 달 다른 반으로 나감 → 다음달 월초 −
    const moveInThis  = mvIn  ? (mvIn.get(m)||0)  : 0;   // 이 달 다른 반에서 들어옴 → 다음달 월초 +
    // 이 달 월초가 반이동 때문에 바뀐 것(= 전달의 in/out). 하이라이트/툴팁용.
    const startMoveIn  = idx===0 ? 0 : prevMoveIn;
    const startMoveOut = idx===0 ? 0 : prevMoveOut;
    if(active){
      cells.push({ month:m, monthStart, newThis, transferIn:tiThis, baseNew, withdraw:wdThis, transfer:trThis, rate, blank:false, startMoveIn, startMoveOut });
      if(baseNew>0) rates.push(rate);
    } else {
      cells.push({ month:m, monthStart:0, newThis:0, transferIn:0, baseNew:0, withdraw:0, transfer:0, rate:0, blank:true, startMoveIn:0, startMoveOut:0 });
    }
    carry = baseNew - wdThis - trThis + moveInThis - moveOutThis;
    prevMoveIn = moveInThis; prevMoveOut = moveOutThis;
  });
 const totWithdraw = cells.reduce((a,c)=>a+(c.blank?0:c.withdraw),0);
  const totTransfer = cells.reduce((a,c)=>a+(c.blank?0:c.transfer),0);
  const totNew = cells.reduce((a,c)=>a+(c.blank?0:c.newThis),0);
  const totTransferIn = cells.reduce((a,c)=>a+(c.blank?0:c.transferIn),0);
  const avgRate = rates.length ? rates.reduce((a,c)=>a+c,0)/rates.length : 0;
  return { cells, totWithdraw, totTransfer, totNew, totTransferIn, avgRate };
}
/* 일별 집계 — 한 달의 날짜별 인원 추적 (퇴원율 집계표용).
   월초인원 = 이 달 전부터 다니고 이 달엔 아직 안 나간 학생.
   각 날짜: 신입(그날)/신입누계/기준학생수/퇴원(그날, 전출제외)/퇴원누계/퇴원율. */
function daysInMonth(year, month){ return new Date(year, month, 0).getDate(); }
function dayOfDate(s){ const m=String(s||'').match(/\d{4}-\d{1,2}-(\d{1,2})/); return m?parseInt(m[1],10):null; }
function monthOfDate(s){ const m=String(s||'').match(/\d{4}-(\d{1,2})-\d{1,2}/); return m?parseInt(m[1],10):null; }
function dailyClosing(recs, year, month){
  const days = daysInMonth(year, month);
  let startCount = 0;
  recs.forEach(r=>{
    const em = r.enrollDate ? monthOfDate(r.enrollDate) : null;
    const wm = r.withdrawDate ? monthOfDate(r.withdrawDate) : null;
    const enrolledBefore = (em==null || em<month);
    const notLeftBefore  = (wm==null || wm>=month);
    if(enrolledBefore && notLeftBefore) startCount++;
  });
  let running = startCount, newAcc = 0, wdAcc = 0;
  const rows = [];
  for(let d=1; d<=days; d++){
    const newToday = recs.filter(r=> monthOfDate(r.enrollDate)===month && dayOfDate(r.enrollDate)===d).length;
    const wdToday  = recs.filter(r=> monthOfDate(r.withdrawDate)===month && dayOfDate(r.withdrawDate)===d && !r.transfer).length;
    const trToday  = recs.filter(r=> monthOfDate(r.withdrawDate)===month && dayOfDate(r.withdrawDate)===d && r.transfer).length;
    running += newToday;
    const base = running;
    running -= (wdToday + trToday);
    newAcc += newToday; wdAcc += wdToday;
    rows.push({ d, newToday, newAcc, base, wdToday, trToday, wdAcc, rate: base>0?(wdToday/base*100):0 });
  }
  return { startCount, rows, endCount:running };
}
/* 학생이 특정 단계 상담 대상인지 — 입학월 기준
   HC1/HC2: 신규·복귀생이면 입학월 상관없이 대상
   MC1/2/3: 입학월 이후의 MC만 대상 (예: 7월 입학 → MC1 제외, MC2·MC3 대상) */
/* ── 내신반 회차 판정 ────────────────────────────────────────────────────
   내신반은 내신 기간에만 도는 반이라 한 학기에 한 회차만 진행한다.
   그 회차를 '내신반 명단을 올린 달'로 잡는다. 가을학기(9·10·11)에 10월에
   올렸으면 MC2 — 내신반은 MC2만 보고, 그 학생들의 정규반 MC2는 자동으로 빠진다.
   회차를 못 알아내면 아무 회차도 대상이 아니다. 잘못 잡느니 안 잡는다. */
/* 내신반이 몇 회차인지는 '사람이 지정한 값'만 본다.
   추정은 전부 버렸다 —
   · 업로드한 달: 내신반이 열린 달이 아니라 엑셀을 사이트에 올린 날이다.
     8월에 여름학기 명단을 올리면 6월에 돌던 내신반까지 전부 MC3로 잡혔다.
   · 상담 기록: 상담이력이 학생·학기·회차 단위라 정규반 건인지 내신반 건인지
     구분이 안 된다. 정규반에서 한 MC1 때문에 내신반이 MC1로 잡히면
     그 학생들의 정규반 MC1이 통째로 빠져버린다.
   지정 안 한 내신반은 상담률에 아예 안 잡힌다. 정규반도 영향 없다. */
function examStageOf(rec){
  if((rec.kind||'regular')!=='exam') return null;
  const e=(db.examClassStages||[]).find(x=> x.branchId===rec.branchId
    && x.semesterId===rec.semesterId && x.className===rec.className);
  return (e && e.stage) || null;
}
/* 내신반 회차 지정/해제 — 분원 관리자만 */
function setExamStage(branchId, semId, className, stage){
  db.examClassStages = db.examClassStages || [];
  const i=db.examClassStages.findIndex(x=> x.branchId===branchId
    && x.semesterId===semId && x.className===className);
  if(!stage){ if(i>=0) db.examClassStages.splice(i,1); }
  else if(i>=0) db.examClassStages[i].stage=stage;
  else db.examClassStages.push({id:uid('exs'), branchId, semesterId:semId, className, stage});
}
function onExamStageChange(className, stage){
  if(!canEditExempt()){ toast('분원 관리자만 변경할 수 있습니다','err'); return; }
  if(MISSING_TABLES.has('examClassStages')){
    toast('sql/exam_class_stages.sql 을 먼저 실행해 주세요','err'); return; }
  setExamStage(activeBranchId(), state.semId, className, stage||null);
  showSaving('회차 저장 중…');
  saveDB().then(ok=>{ hideSaving(); toast(ok?'내신반 회차 저장됨':'저장 실패', ok?'ok':'err'); render(); });
}
/* 이 학생의 이 회차를 내신반이 맡고 있는가 */
function examCovers(studentId, branchId, semId, stage){
  return (db.semesterRecords||[]).some(x=> x.studentId===studentId && x.branchId===branchId
    && x.semesterId===semId && (x.kind||'regular')==='exam' && examStageOf(x)===stage);
}
function isTarget(rec, stage, semId){
  const sid = semId || (typeof state!=='undefined'?state.semId:null);
  const isExam = (rec.kind||'regular')==='exam';

  // 내신반: 내신 기간에만 도는 반이라 한 학기에 '한 회차'만 본다.
  //   그 회차 = 내신반 명단을 올린 달 (가을학기에 10월에 올렸으면 MC2).
  //   나머지 MC와 HC는 아예 대상이 아니다 → 상담률에 안 잡힌다.
  if(isExam){
    if(stage==='HC1'||stage==='HC2') return false;
    return examStageOf(rec) === stage;
  }

  if(stage!=='HC1' && stage!=='HC2'){
    // 사람이 하이픈으로 내린 회차 — 그냥 제외하고 거기서 끝. 내신반으로 넘기지 않는다.
    if(isExempt(rec.studentId, rec.branchId, sid, stage)) return false;
    // 이 학생이 그 회차를 내신반에서 하는 중이면 정규반에선 대상 아님 (자동)
    if(examCovers(rec.studentId, rec.branchId, sid, stage)) return false;
  }

  // 퇴원생: 퇴원월 이후의 MC 회차는 다닐 때가 아니었으므로 대상 아님.
  // (HC와 퇴원월 이전/같은 달 MC는 정상 판정 → 안 했으면 미완료로 분모에 잡힘)
  if(rec.status==='withdraw' && (stage==='MC1'||stage==='MC2'||stage==='MC3')){
    const wm = withdrawMonth(rec);
    if(wm!=null){
      const ms = semesterMonths(sid);
      const stgMonth = { MC1:ms[0], MC2:ms[1], MC3:ms[2] }[stage];
      const order = m => ms.indexOf(m);
      if(order(stgMonth) > order(wm)) return false;
    }
  }

  if(stage==='HC1'||stage==='HC2') return rec.targetType==='HCMC';
  const months = semesterMonths(sid);
  const mcMonth = { MC1:months[0], MC2:months[1], MC3:months[2] }[stage];
  const em = enrollMonth(rec);
  if(em==null) return true;
  return em <= mcMonth;
}
/* 이 학생의 이 회차가 정규반에서 면제됐는지 (= 내신반으로 넘어갔는지) */
function isExempt(studentId, branchId, semId, stage){
  return (db.mcExemptions||[]).some(e=>
    e.studentId===studentId && e.branchId===branchId &&
    e.semesterId===semId && e.stage===stage);
}
/* 면제 토글 — 분원관리자만. 있으면 해제, 없으면 추가 */
function toggleExemption(studentId, branchId, semId, stage){
  const ex = (db.mcExemptions||[]).find(e=>
    e.studentId===studentId && e.branchId===branchId &&
    e.semesterId===semId && e.stage===stage);
  if(ex){
    db.mcExemptions = db.mcExemptions.filter(e=>e!==ex);
  } else {
    (db.mcExemptions||(db.mcExemptions=[])).push({
      id:uid('ex'), studentId, branchId, semesterId:semId, stage });
  }
  saveDB();
}
/* ── 상담 인정 제외 (△) ───────────────────────────────────────────
   IMS 상담이력은 대괄호 태그만 있으면 무조건 완료(○)로 잡힌다. 그런데 막상 열어보면
   [MC3]부재중 이거나 기본 양식만 붙여넣은 것도 많다. 사람이 보고 '이건 상담이 아니다'
   라고 표시하면 △ 가 되고 상담률에서 빠진다.

   표시는 '그때 그 내용'에 붙는다(contentKey). 다음 업로드에서 그 단계 내용이 바뀌면
   지문이 달라져 표시가 저절로 풀린다 → 분원이 제대로 다시 쓰면 ○ 로 돌아온다.
   같은 파일을 다시 올려 내용이 그대로면 △ 가 그대로 유지된다. */
function csKey(txt){
  const t = String(txt||'').replace(/\s+/g,' ').trim();
  let h = 5381;
  for(let i=0;i<t.length;i++) h = ((h*33) ^ t.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + t.length;
}
/* 한 단계에는 상담 기록이 한 건만 남는다(업로드가 같은 단계를 덮어쓴다) */
function counselOf(studentId, branchId, semId, stage){
  return (db.counselingHistories||[]).find(c=>
    c.studentId===studentId && c.branchId===branchId &&
    c.semesterId===semId && c.type===stage);
}
function csRejected(studentId, branchId, semId, stage){
  const c = counselOf(studentId, branchId, semId, stage);
  if(!c) return null;
  const k = csKey(c.content);
  return (db.counselRejects||[]).find(r=>
    r.studentId===studentId && r.branchId===branchId &&
    r.semesterId===semId && r.stage===stage && r.contentKey===k) || null;
}
/* 학생이 특정 단계 완료했는지 */
function isDone(studentId, branchId, semId, stage){
  if(csRejected(studentId, branchId, semId, stage)) return false;   // 사람이 인정 안 한 건
  return db.counselingHistories.some(c=>
    c.studentId===studentId && c.branchId===branchId &&
    c.semesterId===semId && c.type===stage && !c.mistag);  // 오기재 의심은 완료로 치지 않음
}
/* 인정 제외는 분원 관리자와 통합관리(원장)가 할 수 있다 */
function canCsJudge(){ return session && (session.role==='branch' || session.role==='admin'); }
async function onCsReject(studentId, stage){
  if(!canCsJudge()){ toast('권한이 없습니다','err'); return; }
  const branchId = activeBranchId(), semId = state.semId;
  const c = counselOf(studentId, branchId, semId, stage);
  if(!c){ toast('상담 기록이 없습니다','err'); return; }
  if(csRejected(studentId, branchId, semId, stage)) return;
  (db.counselRejects||(db.counselRejects=[])).push({
    id:uid('cr'), studentId, branchId, semesterId:semId, stage,
    contentKey:csKey(c.content), createdAt:nowStamp() });
  const ok = await saveDB();
  render();
  toast(ok===false ? '저장에 실패했습니다' : '상담 인정에서 제외했습니다 — 상담률에 안 잡힙니다');
}
async function onCsRestore(studentId, stage){
  if(!canCsJudge()){ toast('권한이 없습니다','err'); return; }
  const branchId = activeBranchId(), semId = state.semId;
  const before = (db.counselRejects||[]).length;
  db.counselRejects = (db.counselRejects||[]).filter(r=> !(
    r.studentId===studentId && r.branchId===branchId &&
    r.semesterId===semId && r.stage===stage));
  if(db.counselRejects.length===before) return;
  const ok = await saveDB();
  render();
  toast(ok===false ? '저장에 실패했습니다' : '다시 상담으로 인정했습니다');
}
/* 학생의 상담 이력(특정 단계) */
function historiesOf(studentId, branchId, semId, stage){
  return db.counselingHistories.filter(c=>
    c.studentId===studentId && c.branchId===branchId &&
    c.semesterId===semId && (!stage || c.type===stage))
    .sort((a,b)=> a.date.localeCompare(b.date));
}

/*
  상담률 계산 — [전체 대상 건수 대비 완료 건수] 방식으로 통일.
  recs: active 학기레코드 배열.
  반환: { stages:{HC1:{target,done,rate}...}, totalTarget, totalDone, totalRate, incompleteStudents }
*/
function calcRates(recs, branchId, semId){
  const out = { stages:{}, totalTarget:0, totalDone:0, totalRate:0, incompleteStudents:0 };
  STAGES.forEach(s=> out.stages[s] = {target:0, done:0, rate:0});
  const incompleteSet = new Set();
  recs.forEach(rec=>{
    STAGES.forEach(stg=>{
      if(!isTarget(rec, stg, semId)) return;
      out.stages[stg].target++;
      out.totalTarget++;
      if(isDone(rec.studentId, branchId, semId, stg)){
        out.stages[stg].done++; out.totalDone++;
      } else {
        incompleteSet.add(rec.studentId);
      }
    });
  });
  STAGES.forEach(s=>{
    const st = out.stages[s];
    st.rate = st.target ? Math.round(st.done/st.target*100) : null;
  });
  out.totalRate = out.totalTarget ? Math.round(out.totalDone/out.totalTarget*100) : 0;
  out.incompleteStudents = incompleteSet.size;
  return out;
}

/* 인원 통계 — 학기초/신규/퇴원/현재/순증감
   학기초 인원 = 전체 명단 - 신규생 (학기 시작 시점 인원)
   현재 재원생 = status가 active 인 인원
   순증감 = 신규 - 퇴원 */
function headcountClean(branchId, semId){
  const recs = recordsOf(branchId, semId);
  const total = recs.length;
  const newRecs      = recs.filter(r=>(r.origin==='new' || r.origin==='return') && !r.transferIn);
  const transferInR  = recs.filter(r=>r.transferIn);
  const withdrawR    = recs.filter(r=>!r.transfer && (r.status==='withdraw' || (r.status==='active' && r.withdrawDate)));
  const transferR    = recs.filter(r=>r.status==='withdraw' && r.transfer);
  const activeR      = recs.filter(r=>r.status==='active');
 
  const newCnt = newRecs.length;
  const transferIn = transferInR.length;
  const withdraw = withdrawR.length;
  const transfer = transferR.length;
  const active = activeR.length;
  // 학기초 = 재원 + 퇴원 + 전출 − 신규 − 전입.
  // (복귀생처럼 학기 시작엔 있다가 중간에 퇴원·복귀한 학생도 학기초에 정확히 포함됨. 항상 재원과 아귀가 맞음)
  const startCount = active + withdraw + transfer - newCnt - transferIn;

  const ca = recs => countChessAce(recs);   // {chess, ace, total}
  const caNew=ca(newRecs), caTI=ca(transferInR), caWd=ca(withdrawR), caTr=ca(transferR), caAc=ca(activeR);
  // 학기초 CHESS/ACE 분리도 같은 식으로 계산 → 합계가 학기초 총원과 항상 일치
  const caStart = {
    chess: caAc.chess + caWd.chess + caTr.chess - caNew.chess - caTI.chess,
    ace:   caAc.ace   + caWd.ace   + caTr.ace   - caNew.ace   - caTI.ace,
    total: caAc.total + caWd.total + caTr.total - caNew.total - caTI.total,
  };

  return {
    start:startCount, newCnt, transferIn, withdraw, transfer, active,
    net:newCnt + transferIn - withdraw - transfer,
    // CHESS/ACE 분리 (각 카드별)
    ca: {
      start:     caStart,
      newCnt:    caNew,
      transferIn:caTI,
      withdraw:  caWd,
      transfer:  caTr,
      active:    caAc,
    }
  };
}

/* 담임별 집계 */
function teachersOf(branchId, semId){
  const recs = activeRecordsOf(branchId, semId);
  const allRecs = recordsOf(branchId, semId); // 퇴원 포함 전체
  const map = new Map();
  recs.forEach(r=>{
    if(!map.has(r.teacher)) map.set(r.teacher, []);
    map.get(r.teacher).push(r);
  });
 return [...map.entries()].map(([teacher, trecs])=>{
    const classes = new Set(trecs.map(r=>r.className));
    const rates = calcRates(rateRecordsOfTeacher(branchId, semId, teacher), branchId, semId);
    // 이 담임의 퇴원생 수 (status=withdraw, 같은 담임)
    const withdrawCnt = allRecs.filter(r=>r.teacher===teacher && r.status==='withdraw' && !r.transfer).length;
    const newCnt = trecs.filter(r=>r.origin==='new').length;
    // 퇴원율 = 퇴원 / (현재 재원 + 퇴원) — 한때 맡았던 전체 대비
    const base = trecs.length + withdrawCnt;
    const withdrawRate = base>0 ? Math.round(withdrawCnt/base*100) : 0;
    return { teacher, recs:trecs, studentCount:trecs.length,
             classCount:classes.size, rates,
             withdrawCnt, newCnt, withdrawRate };
  }).sort((a,b)=> a.teacher.localeCompare(b.teacher,'ko'));
}

/* 전 분원 통합 담임 목록 — 같은 이름이라도 분원이 다르면 별개로 취급(분원명 병기) */
function allTeachers(semId){
  const out = [];
  db.branches.forEach(b=>{
    teachersOf(b.id, semId).forEach(t=>{
      out.push({ ...t, branchId:b.id, branchName:b.name });
    });
  });
  return out;
}
/* 전출-전입 매칭 검증 — 본사용.
   전출(분원A에서 transfer=true, transferTo=B)에 대응하는 전입(분원B에서 transferIn=true)이 있는지 회원코드로 대조.
   반환: { matched:[], unmatchedOut:[전출했는데 도착분원에 전입 없음], unmatchedIn:[전입인데 출발분원에 전출 없음] } */
function transferMatch(semId){
  const recs = db.semesterRecords.filter(r=>r.semesterId===semId && (r.kind||'regular')!=='exam');
  const outs = recs.filter(r=>r.status==='withdraw' && r.transfer);   // 전출들
  const ins  = recs.filter(r=>r.transferIn);                          // 전입들
  const codeOf = r=>{ const s=getStudent(r.studentId); return s?s.code:''; };

  const matched=[], unmatchedOut=[], unmatchedIn=[];
  const usedIn = new Set();

  outs.forEach(o=>{
    const code = codeOf(o);
    // 이 전출에 대응하는 전입: 도착분원(o.transferTo)에서 같은 회원코드로 전입한 레코드
    const match = ins.find(i=> codeOf(i)===code && i.branchId===o.transferTo && !usedIn.has(i.id));
    if(match){ usedIn.add(match.id); matched.push({out:o, in:match, code}); }
    else unmatchedOut.push({out:o, code});
  });
  // 전입인데 대응 전출 없는 것
  ins.forEach(i=>{
    if(usedIn.has(i.id)) return;
    const code = codeOf(i);
    const match = outs.find(o=> codeOf(o)===code && o.transferTo===i.branchId);
    if(!match) unmatchedIn.push({in:i, code});
  });
  return { matched, unmatchedOut, unmatchedIn };
}

/* 한 담임의 반별 집계 */
/* 반 카드 — 상담률 분모는 퇴원생까지 포함한다.
   담임 전체 진행률(rateRecordsOf)과 반 상세 표가 이미 퇴원생을 넣고 세는데
   반 카드만 재원생으로 세고 있어서, 반 카드가 전부 100%인데 담임 전체는 97%인
   상황이 생겼다. 빠진 학생이 어느 카드에도 안 나와서 화면에서 찾을 수가 없었다.
   학생 수는 그대로 재원생만 센다 — 인원 통계와 어긋나면 안 되므로 퇴원은 따로 적는다. */
function classesOf(branchId, semId, teacher){
  const recs = recordsOf(branchId, semId).filter(r=>r.teacher===teacher);
  const map = new Map();
  recs.forEach(r=>{ if(!map.has(r.className)) map.set(r.className,[]); map.get(r.className).push(r); });
  return [...map.entries()].map(([className, crecs])=>{
    const rates = calcRates(crecs, branchId, semId);
    const act = crecs.filter(r=>r.status==='active');
    const base = act[0] || crecs[0];
    const label = base.classLabel || classLabel(className) || className;
    return { className, label, recs:crecs, studentCount:act.length,
             withdrawCount:crecs.length-act.length, rates };
  }).sort((a,b)=> a.label.localeCompare(b.label,'ko'));
}
/* ============================================================================
   4. 앱 상태 & 라우터
   ============================================================================ */
const state = { semId:null, route:null, branchSort:'active', teacherSort:'rate_desc', classSort:'rate_desc', allTeacherSort:'rate_desc', rosterTab:'new', closingTab:'teacher', closingMonth:null, rosterTeacher:'', rosterQuery:'', segStage:'MC1' };

const el = id => document.getElementById(id);
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmt(n){ return (n==null?'–':n.toLocaleString()); }
function deltaHtml(n){
  const cls = n>0?'pos':n<0?'neg':'zero';
  const sign = n>0?'+':'';
  return `<span class="delta ${cls} num">${sign}${n}</span>`;
}
function rateColor(r){
  if(r==null) return 'var(--line-2)';
  if(r>=80) return 'var(--pos)';
  if(r>=50) return 'var(--brand)';
  if(r>=30) return 'var(--warn)';
  return 'var(--neg)';
}
function toast(msg, kind){
  const t = el('toast'); t.textContent = msg; t.className = 'show'+(kind?' '+kind:'');
  clearTimeout(t._tm); t._tm = setTimeout(()=> t.className='', kind==='err'?5000:2800);
}

/* 저장 중 전체 화면 오버레이 — 저장 끝나기 전 새로고침/조작 방지 */
function showSaving(msg){
  let ov = el('savingOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'savingOverlay';
    ov.innerHTML = `<div class="saving-box"><div class="saving-spin"></div><div class="saving-msg"></div>
      <div class="saving-warn">저장이 끝날 때까지 새로고침하거나 창을 닫지 마세요</div></div>`;
    document.body.appendChild(ov);
  }
  ov.querySelector('.saving-msg').textContent = msg || '저장 중…';
  ov.classList.add('on');
  // 저장 중 페이지 이탈 경고
  window.onbeforeunload = ()=> '저장 중입니다. 지금 나가면 데이터가 사라질 수 있습니다.';
}
function hideSaving(){
  const ov = el('savingOverlay');
  if(ov) ov.classList.remove('on');
  window.onbeforeunload = null;
}

/* 해시 라우트: #/admin , #/admin/branch/:bid , #/branch ,
   #/branch/teacher/:t , #/branch/class/:t/:c , #/data , #/accounts */
function parseRoute(){
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h ? h.split('/') : [];
  return { parts };
}
function go(path){ location.hash = '#/'+path; }
window.addEventListener('hashchange', render);
/* ===== 비밀번호 변경 / 초기화 ===== */
function openPrompt(title, msg, placeholder, onOk, opts={}){
  const type  = opts.inputType || 'text';
  const dval  = opts.defaultValue!=null ? String(opts.defaultValue) : '';
  const label = opts.label ? `<label style="display:block;font-size:12px;font-weight:600;color:var(--ink-2);margin-bottom:7px">${esc(opts.label)}</label>` : '';
  const hint  = opts.hint  ? `<div style="font-size:12px;color:var(--ink-3);margin-top:9px;line-height:1.5">${esc(opts.hint)}</div>` : '';
  openModal(`
    <div class="modal-head"><div><h3>${esc(title)}</h3></div>
      <button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="font-size:13.5px;color:var(--ink-2);line-height:1.65;white-space:pre-line;margin-bottom:16px">${esc(msg)}</p>
      ${label}
      <input id="promptInput" type="${type}" value="${esc(dval)}" placeholder="${esc(placeholder||'')}"
        style="width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:9px;font-size:14px;background:var(--surface-2);box-sizing:border-box;outline:none">
      ${hint}
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">취소</button>
      <button class="btn primary" id="promptOk">${esc(opts.okLabel||'확인')}</button>
    </div>`);
  const inp = el('promptInput');
  if(inp){ inp.focus(); inp.onkeydown = e=>{ if(e.key==='Enter') el('promptOk').click(); }; }
  el('promptOk').onclick = ()=> onOk(el('promptInput').value);
}
// 본인 비밀번호 변경 (현재 비번 확인 후 교체)
function changeMyPassword(){
  const cur = el('pwCur').value;
  const nw  = el('pwNew').value.trim();
  const nw2 = el('pwNew2').value.trim();
  const me = db.users.find(u=>u.id===session.userId);
  if(!me){ toast('세션이 만료되었습니다. 다시 로그인하세요.','err'); return; }
  if(!nw){ toast('새 비밀번호를 입력하세요','err'); return; }
  if(nw.length < 4){ toast('비밀번호는 4자 이상이어야 합니다','err'); return; }
  if(nw !== nw2){ toast('새 비밀번호가 서로 다릅니다','err'); return; }
  if(nw === cur){ toast('현재 비밀번호와 동일합니다','err'); return; }
  showSaving('비밀번호 변경 중…');
  (async ()=>{
    try{
      if(!sb) initSupabase();
      const { error } = await sb.rpc('jls_change_password', { p_login:me.username, p_old:cur, p_new:nw });
      if(error){ if(rpcMissing(error)) throw 'legacy'; throw error; }
      _actorPw = nw; hideSaving(); toast('비밀번호가 변경되었습니다','ok'); render();
    }catch(e){
      if(e==='legacy'){
        if(me.password !== cur){ hideSaving(); toast('현재 비밀번호가 올바르지 않습니다','err'); return; }
        me.password = nw;
        const ok = await saveDB(); hideSaving();
        toast(ok?'비밀번호가 변경되었습니다':'저장 실패, 다시 시도하세요', ok?'ok':'err'); render(); return;
      }
      console.error(e); hideSaving(); toast((e&&e.message)||'변경 실패','err');
    }
  })();
}

// 하위 계정 비밀번호 초기화 (admin→분원, 분원→담임·조교)
function resetAccountPassword(userId){
  const u = db.users.find(x=>x.id===userId);
  if(!u) return;
  const label = u.teacherName || (getBranch(u.branchId)?.name) || u.username;
  openPrompt('비밀번호 초기화', `${esc(label)} 계정의 새 비밀번호를 입력하세요.`, '새 비밀번호', (val)=>{
    const nw = (val||'').trim();
    if(!nw){ toast('비밀번호를 입력하세요','err'); return; }
    if(nw.length < 4){ toast('비밀번호는 4자 이상이어야 합니다','err'); return; }
    showSaving('비밀번호 저장 중…');
    setUserPwSafe(u.id, nw)
      .then(r=>{ hideSaving(); if(r===null) return; toast(`${label} 비밀번호가 변경되었습니다`,'ok'); closeModal(); render(); })
      .catch(e=>{ console.error(e); hideSaving(); toast('저장 실패: '+((e&&e.message)||''),'err'); });
  });
}
function myAccountCard(){
  return `
    <div class="panel" style="margin-bottom:16px">
      <h3 style="font-size:14.5px;font-weight:650;margin-bottom:4px">내 계정 비밀번호 변경</h3>
      <div class="pd" style="margin-bottom:14px">로그인한 본인 계정의 비밀번호를 바꿉니다.</div>
      <div class="acct-add">
        <div class="field"><label>현재 비밀번호</label><input id="pwCur" type="password" placeholder="현재 비밀번호"></div>
        <div class="field"><label>새 비밀번호</label><input id="pwNew" type="password" placeholder="4자 이상"></div>
        <div class="field"><label>새 비밀번호 확인</label><input id="pwNew2" type="password" placeholder="한 번 더"></div>
        <button class="btn primary" onclick="changeMyPassword()">변경</button>
      </div>
    </div>`;
}
function renderMyAccount(){
  crumbs([{label:'계정 관리'}]);
  el('content').innerHTML = `
    <div class="page-head"><h2>계정 관리</h2>
      <div class="sub">로그인한 본인 계정의 비밀번호를 변경할 수 있습니다.</div></div>
    ${myAccountCard()}`;
}
/* ============================================================================
   5. 로그인 / 로그아웃
   ============================================================================ */
async function doLogin(){
  const u = el('loginId').value.trim();
  const p = el('loginPw').value;
  if(!u||!p){ el('loginErr').textContent='아이디와 비밀번호를 입력하세요.'; return; }
  const lb = el('loginBtn');
  if(lb){ lb.disabled=true; lb.textContent='확인 중…'; }
  const done=()=>{ if(lb){ lb.disabled=false; lb.textContent='로그인'; } };
  el('loginErr').textContent='';
  let row=null;
  try{
    if(!sb) initSupabase();
    const { data, error } = await sb.rpc('jls_login', { p_login:u, p_password:p });
    if(error){ if(rpcMissing(error)) throw 'legacy'; throw error; }
    row = data || null;
  }catch(e){
    if(e==='legacy'){
      try{ if(!db) await loadDB(); }
      catch(err){ done(); el('loginErr').textContent='서버 연결에 실패했습니다.'; return; }
      const f=(db.users||[]).find(x=>x.username===u && x.password!=null && x.password===p);
      row = f ? {id:f.id,username:f.username,role:f.role,branch_id:f.branchId,teacher_name:f.teacherName} : null;
    }else{
      done(); el('loginErr').textContent=(e&&e.message)||'로그인에 실패했습니다.'; return;
    }
  }
  if(!row){ done(); el('loginErr').textContent='아이디 또는 비밀번호가 올바르지 않습니다.'; return; }
  try{ if(!db) await loadDB(); }
  catch(e){ done(); el('loginErr').textContent='데이터를 불러오지 못했습니다.'; return; }
  done();
  _actorPw = p;
  setSession({ userId:row.id, username:row.username, role:row.role, branchId:row.branch_id, teacherName:row.teacher_name||null });
  el('loginErr').textContent='';
  el('loginPw').value='';
  enterApp();
}
function logout(){
  if(new URLSearchParams(location.search).has('embed') && window.parent!==window){ try{ window.parent.postMessage({type:'jls-embed-logout'},'*'); }catch(e){} return; }
  clearSession(); location.hash=''; showLogin();
}

function showLogin(){ el('appView').style.display='none'; el('loginView').style.display='flex'; }
function applyReadOnlyBanner(){
  const ro = session && session.canEdit===false;
  let b=el('roBanner');
  if(ro && !b){
    b=document.createElement('div'); b.id='roBanner';
    b.style.cssText='position:sticky;top:0;z-index:60;background:#fff4e5;color:#8a5a00;border-bottom:1px solid #f0d9a8;padding:7px 14px;font-size:12.5px;font-weight:700;text-align:center';
    b.textContent='👁 읽기 전용 계정 — 조회만 가능해요. 수정·업로드·삭제는 되지 않습니다.';
    const av=el('appView'); av.insertBefore(b, av.firstChild);
  } else if(!ro && b){ b.remove(); }
}
function enterApp(){
  el('loginView').style.display='none';
  el('appView').style.display='block';
  applyReadOnlyBanner();
  const cur = currentSemester();
  state.semId = db.semesters.some(s=>s.id===cur.id) ? cur.id : (db.semesters[0] ? db.semesters[0].id : null);
  buildShell();
 const _P=curInwonPerms()||INWON_PALL;
  const branchHome = (_P.roster||_P.closing)?'#/branch' : _P.students?'#/students' : _P.segments?'#/segments-edit' : _P.data?'#/data' : '#/branch';
  const home = session.role==='admin' ? '#/admin'
    : session.role==='teacher' ? '#/myclasses'
    : session.role==='assistant' ? '#/start'
    : branchHome;
  if(!location.hash || location.hash==='#' || location.hash==='#/'){
    location.hash = home;
  } else {
    // 로그인 계정이 갈 수 없는 경로면 홈으로 강제
    const root = location.hash.replace(/^#\//,'').split('/')[0];
    const allowedRoots = {
      admin:['admin','roster','closing','passrate-hub','accounts'],
      teacher:['myclasses','segments','myaccount','branch','passrate'],
      assistant:['start'],
      branch:['branch','roster','closing','data','students','start','passrate','segments-edit','teachers']
    }[session.role]||[];
   if(!allowedRoots.includes(root)) location.hash = home;
    else render();
  }
}
function openSidebar(){
  document.querySelector('.sidebar')?.classList.add('open');
  el('sbBackdrop')?.classList.add('show');
}
function closeSidebar(){
  document.querySelector('.sidebar')?.classList.remove('open');
  el('sbBackdrop')?.classList.remove('show');
}
/* ============================================================================
   6. 앱 셸 (사이드바, 학기 선택)
   ============================================================================ */
// 담임: 자기반 시험채점 열기 (grader 담임모드 · 자기반만 · 읽기전용)
// 새 탭 대신 같은 화면 안에서 전체화면 오버레이로 열고, 상단에 '‹ 뒤로' 바 제공 (인원현황/교재관리와 동일한 방식)
function openMyGrading(){
  const name = session.teacherName || '';
  if(!name){ toast('선생님 이름 정보가 없어 시험채점을 열 수 없어요','err'); return; }
  const url = '../grader.html?role=teacher'
    + '&branch=' + encodeURIComponent(session.branchId||'')
    + '&sem='    + encodeURIComponent(state.semId||'')
    + '&teacher='+ encodeURIComponent(name)
    + '&user='   + encodeURIComponent(session.username||'');
  let ov = document.getElementById('gradingOverlay');
  if(!ov){ ov = document.createElement('div'); ov.id='gradingOverlay'; document.body.appendChild(ov); }
  ov.setAttribute('style','position:fixed;inset:0;z-index:9000;background:#fff;display:flex;flex-direction:column');
  ov.innerHTML =
      '<div style="flex:0 0 46px;height:46px;display:flex;align-items:center;gap:14px;padding:0 16px;border-bottom:1px solid #ece8f5;background:#faf8fe">'
    +   '<button onclick="closeMyGrading()" style="border:1px solid #e3ddf2;background:#fff;color:#6b6385;font-weight:800;font-size:13px;padding:7px 14px;border-radius:9px;cursor:pointer;font-family:inherit">‹ 뒤로</button>'
    +   '<span style="font-size:13px;font-weight:800;color:#2a2440">시험채점</span>'
    +   '<a href="'+url+'" target="_blank" rel="noopener" style="margin-left:auto;font-size:12px;font-weight:700;color:#8b6ee8;text-decoration:none">새 탭으로 열기 ↗</a>'
    + '</div>'
    + '<iframe src="'+url+'" title="시험채점" allow="clipboard-write" style="flex:1;width:100%;border:0;background:#fff"></iframe>';
  document.body.style.overflow='hidden';
}
function closeMyGrading(){ const ov=document.getElementById('gradingOverlay'); if(ov) ov.remove(); document.body.style.overflow=''; }
function buildShell(){
  const isAdmin = session.role==='admin';
  const isTeacher = session.role==='teacher';
  const branch = isAdmin ? null : getBranch(session.branchId);
  el('sbScope').textContent = isAdmin ? '통합 관리자' : (isTeacher ? (branch?branch.name:'분원')+' 선생님' : (session.role==='assistant' ? (branch?branch.name:'분원')+' 조교' : (branch?branch.name:'분원')));
  el('sbAvatar').textContent = (session.username[0]||'U').toUpperCase();
  el('sbUserName').textContent = isAdmin ? '관리자' : (isTeacher ? (session.teacherName||session.username) : (branch?branch.name:session.username));
  el('sbUserRole').textContent = session.username;

  // 학기 선택 — 분원 계정만 '다음 학기 추가' 옵션 노출 (관리자·선생님은 보기 전용)
  const sel = el('semSelect');
  const isBranch = session.role==='branch';
  // 분원 계정: 자기 분원이 실제 쓰는 학기(데이터 있는 학기) + 현재 선택 + 오늘 학기만 표시 (다른 분원이 만든 빈 학기는 안 보임)
  let semList = db.semesters;
  if(isBranch){
    const keep = new Set(db.semesterRecords.filter(r=>r.branchId===session.branchId).map(r=>r.semesterId));
    if(state.semId) keep.add(state.semId);
    const cur=currentSemester(); if(cur) keep.add(cur.id);
    semList = db.semesters.filter(s=> keep.has(s.id));
    if(!semList.length){ const cur2=currentSemester(); semList = db.semesters.filter(s=> s.id===cur2.id); }
  }
  sel.innerHTML = semList.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')
    + (isBranch ? `<option value="__add_semester__">+ 학기 추가…</option>` : '');
  sel.value = state.semId;
  sel.onchange = ()=>{
    if(sel.value==='__add_semester__'){ sel.value=state.semId; goAddSemester(); return; }
    state.semId = sel.value; render();
  };
  // 학기 삭제 버튼 — 분원 계정만. 관리자·선생님은 숨김.
  const delBtn = el('semDelBtn');
  if(delBtn){
    delBtn.style.display = isBranch ? 'inline-flex' : 'none';
    delBtn.onclick = ()=> confirmDeleteSemester();
  }

  // 네비
  const nav = el('sbNav');
  const I = {
    dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    data:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>',
    acct:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    stu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
    roster:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
    closing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="13" y="6" width="3" height="11"/></svg>',
    teach:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    seg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  };
  if(isAdmin){
    nav.innerHTML = `
      <div class="sb-sect">관리</div>
      <div class="sb-item" data-nav="admin">${I.dash}<span>통합 대시보드</span></div>
      <div class="sb-item" data-nav="ban">${I.roster}<span>반배정표</span></div>
      <div class="sb-item" data-nav="roster">${I.roster}<span>신규·퇴원 명단</span></div>
      <div class="sb-item" data-nav="closing">${I.closing}<span>인원마감표</span></div>`;
} else if(isTeacher){
    nav.innerHTML = `
      <div class="sb-sect">선생님</div>
      <div class="sb-item" data-nav="myclasses">${I.dash}<span>내 반 현황</span></div>
      <div class="sb-item" data-nav="segments">${I.seg}<span>세그먼트</span></div>
      <div class="sb-item" onclick="openMyGrading()">${I.closing}<span>시험채점</span></div>
      <div class="sb-item" data-nav="myaccount">${I.acct}<span>계정 관리</span></div>`;
  } else if(session.role==='assistant'){
    nav.innerHTML = `
      <div class="sb-sect">조교</div>
      <div class="sb-item" data-nav="start">${I.stu}<span>STaRT 관리</span></div>`;
 } else {
    const P = curInwonPerms() || INWON_PALL;   // 세부메뉴 권한 (menus에서 계산, 없으면 전체)
    let nv='<div class="sb-sect">분원</div>';
    if(P.roster||P.closing){
      nv+=`<div class="sb-item" data-nav="branch">${I.dash}<span>Dashboard</span></div>
      <div class="sb-item" data-nav="ban">${I.roster}<span>반배정표</span></div>
      <div class="sb-sect">현황</div>`;
      if(P.roster)  nv+=`<div class="sb-item" data-nav="roster">${I.roster}<span>신규·퇴원 명단</span></div>`;
      if(P.closing) nv+=`<div class="sb-item" data-nav="closing">${I.closing}<span>인원마감표</span></div>`;
    }
    if(P.students) nv+=`<div class="sb-sect">학생</div><div class="sb-item" data-nav="students">${I.stu}<span>학생관리</span></div>`;
    if(P.segments) nv+=`<div class="sb-sect">상담</div><div class="sb-item" data-nav="segments-edit">${I.seg}<span>세그먼트 공지</span></div>`;
    if(P.data){
      nv+=`<div class="sb-sect">설정</div><div class="sb-item" data-nav="data">${I.data}<span>데이터관리</span></div>`;
    }
    nav.innerHTML = nv;
  }
  nav.querySelectorAll('[data-nav]').forEach(it=>{
    it.onclick = ()=>{ closeSidebar(); go(it.dataset.nav); };
  });
}
function setActiveNav(key){
  document.querySelectorAll('.sb-item').forEach(it=>{
    it.classList.toggle('active', it.dataset.nav===key);
  });
}
function crumbs(items){
  el('crumbs').innerHTML = items.map((it,i)=>{
    const last = i===items.length-1;
    const sep = i>0 ? '<span class="c-sep">›</span>' : '';
    if(last) return sep+`<span class="c-cur">${esc(it.label)}</span>`;
    return sep+`<span class="c-link" data-go="${it.go||''}">${esc(it.label)}</span>`;
  }).join('');
  el('crumbs').querySelectorAll('[data-go]').forEach(c=>{
    c.onclick = ()=>{ if(c.dataset.go) go(c.dataset.go); };
  });
}

/* ============================================================================
   7. 메인 라우팅 — 권한 가드 포함
   ============================================================================ */
function render(){
   el('content').style.maxWidth = '';
  if(!session){ showLogin(); return; }
  const { parts } = parseRoute();
  const root = parts[0] || (session.role==='admin'?'admin':(session.role==='teacher'?'myclasses':(session.role==='assistant'?'start':'branch')));

  // 권한 가드
  // admin은 branch/teacher, branch/class (담임·반 상세)는 볼 수 있으나
  // branch 대시보드/데이터관리는 불가. branch는 admin/accounts 불가.
  if(session.role==='admin'){
    if(root==='branch' && parts[1]!=='teacher' && parts[1]!=='class'){ go('admin'); return; }
   if(root==='data'||root==='students'||root==='segments-edit'||root==='teachers'||root==='start'||root==='passrate'||root==='assistants'){ go('admin'); return; }
  }
  // 선생님: 자기 반 관련 화면만 (myclasses / branch teacher·class 상세)
if(session.role==='teacher'){
    const allowed = (root==='myclasses')
      || (root==='segments')
      || (root==='myaccount')
      || (root==='passrate')
      || (root==='branch' && (parts[1]==='teacher' || parts[1]==='class'));
    if(!allowed){ go('myclasses'); return; }
  }
  if(session.role==='assistant'){
    if(root!=='start'){ go('start'); return; }
  }
  if(session.role==='branch' && (root==='admin'||root==='accounts')){ go('branch'); return; }
  // 분원 계정은 자기 분원 roster 상세만 (다른 분원 직접 접근 차단)
  if(session.role==='branch' && root==='roster' && parts[1]==='branch' && parts[2] && parts[2]!==session.branchId){ go('roster'); return; }
  if(session.role==='branch' && root==='closing' && parts[1]==='branch' && parts[2] && parts[2]!==session.branchId){ go('closing'); return; }

  const c = el('content');
  if(root==='admin'){
    if(parts[1]==='branch' && parts[2]){ setActiveNav('admin'); renderAdminBranchDetail(parts[2]); }
    else { setActiveNav('admin'); renderAdminDashboard(); }
  } else if(root==='accounts'){ setActiveNav('accounts'); renderAccounts(); }
  else if(root==='branch'){
    if(parts[1]==='teacher' && parts[2]){ setActiveNav('branch'); renderTeacherDetail(decodeURIComponent(parts[2])); }
    else if(parts[1]==='class' && parts[2] && parts[3]){ setActiveNav('branch'); renderClassDetail(decodeURIComponent(parts[2]), decodeURIComponent(parts[3])); }
    else { setActiveNav('branch'); renderBranchDashboard(); }
  } else if(root==='ban'){ setActiveNav('ban'); renderBanTable(); }
  else if(root==='data'){ setActiveNav('data'); renderDataManagement(); }
  else if(root==='students'){ setActiveNav('students'); renderStudentManagement(); }
  else if(root==='roster'){
    if(parts[1]==='branch' && parts[2]){ setActiveNav('roster'); renderRosterDetail(parts[2]); }
    else { setActiveNav('roster'); renderRoster(); }
  }
  else if(root==='closing'){
    // 관리자: closing/branch/:id, 분원: closing (자기 분원)
    if(session.role==='admin'){
      if(parts[1]==='branch' && parts[2]){ setActiveNav('closing'); renderClosing(parts[2]); }
      else { setActiveNav('closing'); renderClosingHub(); }
    } else { setActiveNav('closing'); renderClosing(session.branchId); }
  }
  else if(root==='teachers'){ setActiveNav('teachers'); renderTeacherAccounts(); }
else if(root==='segments-edit'){ setActiveNav('segments-edit'); renderSegmentEdit(); }
  else if(root==='segments'){ setActiveNav('segments'); renderSegmentView(); }
  else if(root==='start'){ setActiveNav('start'); renderStart(); }
  else if(root==='passrate'){ setActiveNav('passrate'); renderPassrate(); }
  else if(root==='passrate-hub'){
    if(parts[1]==='branch' && parts[2]){ setActiveNav('passrate-hub'); renderPassrate(parts[2]); }
    else { setActiveNav('passrate-hub'); renderPassrateHub(); }
  }
  else if(root==='myaccount'){ setActiveNav('myaccount'); renderMyAccount(); }
  else if(root==='myclasses'){ setActiveNav('myclasses'); renderTeacherHome(); }
  else if(root==='myaccount'){ setActiveNav('myaccount'); renderMyAccount(); }
  else if(root==='segments'){ setActiveNav('segments'); renderSegmentView(); }
  else { go(session.role==='admin'?'admin':(session.role==='teacher'?'myclasses':(session.role==='assistant'?'start':'branch'))); return; }
  el('content').scrollIntoView({block:'start'});
  window.scrollTo(0,0);
}
/* ============================================================================
   8. 공통 컴포넌트 헬퍼
   ============================================================================ */
function kpiCard(label, value, opts={}){
  const cls = opts.accent ? ' accent' : '';
  let v = opts.delta!=null ? deltaHtml(opts.delta) :
          `<span class="num">${esc(value)}</span>${opts.unit?`<small>${opts.unit}</small>`:''}`;
  let badges = '';
  if(opts.ca){
    badges = `<div class="kpi-ca">
      <span class="ca-chess">CHESS ${opts.ca.chess}</span>
      <span class="ca-ace">ACE ${opts.ca.ace}</span>
    </div>`;
  }
  return `<div class="kpi${cls}"><div class="kl">${esc(label)}</div><div class="kv">${v}</div>${badges}</div>`;
}

/* 상담 5단계 막대 (카드 안) */
function stageBars(rates){
  return `<div class="stage-bars">`+ STAGES.map(s=>{
    const st = rates.stages[s];
    if(st.rate==null){
      return `<div class="stage na"><span class="sl">${s}</span>
        <div class="strack"></div><span class="sv">–</span></div>`;
    }
    return `<div class="stage"><span class="sl">${s}</span>
      <div class="strack"><div class="sfill" style="width:${st.rate}%;background:${rateColor(st.rate)}"></div></div>
      <span class="sv num">${st.rate}%</span></div>`;
  }).join('')+`</div>`;
}

/* 상담 5단계 패널 (상세 상단, 총계 포함) */
function ratePanel(rates){
  const cells = STAGES.map(s=>{
    const st = rates.stages[s];
    const v = st.rate==null ? '–' : st.rate+'%';
    const meta = st.target ? `${st.done}/${st.target}명` : '대상 없음';
    return `<div class="rate-cell">
      <div class="rcl">${s}</div>
      <div class="rcv num">${v}</div>
      <div class="rcm">${meta}</div>
      <div class="rctrack"><div class="rcfill" style="width:${st.rate||0}%;background:${rateColor(st.rate)}"></div></div>
    </div>`;
  }).join('');
  const tot = `<div class="rate-cell total">
      <div class="rcl">전체 상담률</div>
      <div class="rcv num">${rates.totalRate}%</div>
      <div class="rcm">${rates.totalDone}/${rates.totalTarget}건</div>
      <div class="rctrack"><div class="rcfill" style="width:${rates.totalRate}%;background:var(--brand)"></div></div>
    </div>`;
  return `<div class="rate-panel">${cells}${tot}</div>`;
}

function incompleteTag(n){
  if(n===0) return `<span class="incomplete-tag zero">미완료 0명</span>`;
  return `<span class="incomplete-tag">미완료 ${n}명</span>`;
}

/* 내신반 회차 고르기 — 내신 기간은 학교·학년마다 달라 시스템이 알 수 없다.
   반마다 한 번 골라두면 그 회차만 내신반이 맡고, 그 학생들의 정규반 같은 회차는
   자동으로 빠진다. 안 고르면 이 내신반은 상담률에 아예 안 잡힌다. */
function examStagePicker(className, cur){
  const can = canEditExempt() && !MISSING_TABLES.has('examClassStages');
  const opts = [['','회차 지정 안 함 (상담률 제외)'],['MC1','MC1'],['MC2','MC2'],['MC3','MC3']];
  const sel = `<select class="exs-sel" ${can?'':'disabled'} onchange="onExamStageChange('${esc(className).replace(/'/g,"\\'")}',this.value)">`
    + opts.map(o=>`<option value="${o[0]}" ${o[0]===(cur||'')?'selected':''}>${esc(o[1])}</option>`).join('')
    + `</select>`;
  const note = cur
    ? `이 내신반은 <b>${cur}</b> 회차만 봅니다. 이 학생들의 정규반 ${cur} 은 자동으로 빠집니다.`
    : `회차를 안 고르면 <b>상담률에 잡히지 않습니다</b>. 내신을 진행한 회차를 골라주세요.`;
  const why = MISSING_TABLES.has('examClassStages')
    ? ` <span style="color:var(--neg)">· sql/exam_class_stages.sql 을 먼저 실행해야 저장됩니다</span>` : '';
  return `<div class="exs-bar"><span class="exs-l">내신 회차</span>${sel}
    <span class="exs-note">${note}${why}</span></div>`;
}

/* 미완료가 왜 남았는지 한 줄씩 밝힌다.
   반 카드가 전부 100%인데 담임 전체는 94% 같은 상황에서, 빠진 게 누구이고
   왜 그 회차가 대상인지 화면에서 알 방법이 없었다. 물어봐야만 알 수 있으면 안 된다. */
function incompleteWhy(rec, stg, branchId, semId){
  if(csRejected(rec.studentId, branchId, semId, stg)) return '상담 인정 안 함(△) — 사람이 내린 것';
  if((rec.kind||'regular')==='exam')                  return `내신반 ${examStageOf(rec)||''} 회차`;
  if(stg==='HC1'||stg==='HC2')                        return '신규·복귀생이라 HC 대상';
  if(rec.status==='withdraw')                         return `퇴원 ${rec.withdrawDate||'날짜 없음'} — 퇴원한 달까지의 회차는 대상`;
  return '재원생 미완료';
}
/* 이유가 있는 미완료만 모아 보여준다.
   그냥 안 한 것(✕)은 반 상담표에 이미 다 보인다. 그걸 여기 또 늘어놓으면
   상담을 하나도 안 한 담임 화면에 89줄이 깔리고, 정작 설명이 필요한 줄이 묻힌다.
   여기 남기는 건 '반 카드만 봐서는 왜 빠졌는지 모를' 것들뿐이다. */
function incompletePanel(recs, branchId, semId, teacher){
  const PLAIN = '재원생 미완료';
  const map = new Map();
  recs.forEach(rec=>{
    STAGES.forEach(stg=>{
      if(!isTarget(rec, stg, semId)) return;
      if(isDone(rec.studentId, branchId, semId, stg)) return;
      const why = incompleteWhy(rec, stg, branchId, semId);
      if(why === PLAIN) return;                    // 그냥 안 한 건 반 상담표에서 본다
      const st = getStudent(rec.studentId) || {};
      const key = rec.id + '|' + why;
      if(!map.has(key)) map.set(key, { name:st.name||'?',
        label:rec.classLabel || classLabel(rec.className) || rec.className || '',
        className:rec.className||'', status:rec.status, wd:rec.withdrawDate||'', why, stages:[] });
      map.get(key).stages.push(stg);
    });
  });
  const rows = [...map.values()].sort((a,b)=> a.name.localeCompare(b.name,'ko'));
  const cnt = rows.reduce((n,r)=> n + r.stages.length, 0);
  if(!cnt) return '';                              // 설명할 게 없으면 아예 안 그린다
  const CAP = 40;
  const body = rows.slice(0,CAP).map(r=>`<tr class="clickable" onclick="go('branch/class/${encodeURIComponent(teacher)}/${encodeURIComponent(r.className)}')">
      <td class="st-name">${esc(r.name)}</td>
      <td>${esc(r.label)}</td>
      <td>${r.status==='withdraw'
            ? `<span class="status-badge withdraw">퇴원</span>${r.wd?`<div class="st-meta">${esc(r.wd)}</div>`:''}`
            : '<span class="status-badge active">재원</span>'}</td>
      <td><b>${r.stages.join(', ')}</b></td>
      <td style="color:var(--ink-2);font-size:12.5px">${esc(r.why)}</td>
    </tr>`).join('');
  const more = rows.length>CAP ? `<div class="pd" style="padding:8px 2px">외 ${rows.length-CAP}명</div>` : '';
  return `<div class="sect-head"><h3>이유가 있는 미완료</h3>
      <span class="cnt">${cnt}건 · 퇴원·내신반·△ 처럼 반 상담표만 봐선 모를 것들</span></div>
    <div class="table-wrap"><div class="table-scroll"><table class="grid">
      <thead><tr><th>학생</th><th>반</th><th>상태</th><th>빠진 회차</th><th>왜 대상인가</th></tr></thead>
      <tbody>${body}</tbody></table></div>${more}</div>`;
}
const goArrow = `<span class="go">상세<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg></span>`;
function backLink(label, target){
  return `<div class="back-link" onclick="go('${target}')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>${esc(label)}</div>`;
}

/* ============================================================================
   9. 관리자 — 통합 대시보드
   ============================================================================ */
function renderAdminDashboard(){
  const semId = state.semId;
  crumbs([{label:'통합 대시보드'}]);

// 전체 합산
 let tot = { start:0, newCnt:0, transferIn:0, withdraw:0, transfer:0, active:0, net:0 };
  const CA_KEYS = ['start','newCnt','transferIn','withdraw','transfer','active'];
  const totCa = {};
  CA_KEYS.forEach(k=>{ totCa[k] = {chess:0, ace:0, total:0}; });
const cards = db.branches.map(b=>{
    const hc = headcountClean(b.id, semId);
    const rates = calcRates(rateRecordsOf(b.id, semId), b.id, semId);
tot.start+=hc.start; tot.newCnt+=hc.newCnt; tot.transferIn+=hc.transferIn; tot.withdraw+=hc.withdraw;
    tot.transfer+=hc.transfer; tot.active+=hc.active; tot.net+=hc.net;
    CA_KEYS.forEach(k=>{
      totCa[k].chess += hc.ca[k].chess;
      totCa[k].ace   += hc.ca[k].ace;
      totCa[k].total += hc.ca[k].total;
    });
    // 분원 퇴원율 = 퇴원 / (재원+퇴원)
    const wbase = hc.active + hc.withdraw;
    const withdrawRate = wbase>0 ? Math.round(hc.withdraw/wbase*100) : 0;
    return { b, hc, rates, withdrawRate };
  });
  const totWbase = tot.active + tot.withdraw;
  const totWithdrawRate = totWbase>0 ? Math.round(tot.withdraw/totWbase*100) : 0;

  let html = `
    <div class="page-head">
      <h2>통합 대시보드</h2>
      <div class="sub">6개 분원 통합 현황 · ${esc(db.semesters.find(s=>s.id===semId).name)}</div>
    </div>
<div class="kpi-row c7">
     ${kpiCard('전체 학기초 인원', tot.start, {unit:'명', ca:totCa.start})}
      ${kpiCard('전체 신규생', tot.newCnt, {unit:'명', ca:totCa.newCnt})}
      ${kpiCard('전체 전입', tot.transferIn, {unit:'명', ca:totCa.transferIn})}
      ${kpiCard('전체 퇴원생', tot.withdraw, {unit:'명', ca:totCa.withdraw})}
      ${kpiCard('전체 전출', tot.transfer, {unit:'명', ca:totCa.transfer})}
      ${kpiCard('전체 퇴원율', totWithdrawRate, {unit:'%'})}
      ${kpiCard('현 재원생', tot.active, {unit:'명', accent:true, ca:totCa.active})}
    </div>`+ xferReconBox() +`
    <div class="sect-head">
      <h3>분원별 현황</h3>
      <div class="sort-bar">
        ${branchSortBtn('active','재원생순')}
        ${branchSortBtn('new','신규순')}
        ${branchSortBtn('withdraw','퇴원순')}
        ${branchSortBtn('wrate','퇴원율순')}
        ${branchSortBtn('rate','상담률순')}
      </div>
    </div>
    <div class="card-grid g3">`;

  // 정렬
  const sortKey = state.branchSort;
  const val = c => sortKey==='active' ? c.hc.active
            : sortKey==='new' ? c.hc.newCnt
            : sortKey==='withdraw' ? c.hc.withdraw
            : sortKey==='wrate' ? c.withdrawRate
            : c.rates.totalRate; // rate
  cards.sort((a,b)=> val(b)-val(a));
  // 상담률순일 때만 최고/최저 강조 (데이터 있는 카드 기준)
  const rated = cards.filter(c=> c.hc.active>0);
  const bestId = (sortKey==='rate' && rated.length) ? rated[0].b.id : null;
  const worstId = (sortKey==='rate' && rated.length>1) ? rated[rated.length-1].b.id : null;

  html += cards.map(({b,hc,rates,withdrawRate}, i)=>{
    const hasData = hc.active>0 || hc.start>0;
    const rank = i+1;
    const rankCls = rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
    const cardCls = b.id===bestId?' best' : b.id===worstId?' worst' : '';
    const wrColor = withdrawRate>=15?'var(--neg)':withdrawRate>=8?'var(--warn)':'var(--ink-2)';
    return `<div class="card clickable${cardCls}" onclick="go('admin/branch/${b.id}')">
      <div class="rank-badge ${rankCls}">${rank}</div>
      <div class="card-top">
        <div>
          <div class="card-name">${esc(b.name)}
            ${b.id===bestId?'<span class="tag-best">최고</span>':b.id===worstId?'<span class="tag-worst">최저</span>':''}</div>
        <div class="card-sub">신규 <b style="color:var(--brand)">${hc.newCnt}</b> · 퇴원 <b style="color:${wrColor}">${hc.withdraw}</b> <span style="color:${wrColor}">(${withdrawRate}%)</span> · 상담률 <b style="color:${hasData?rateColor(rates.totalRate):'var(--ink-3)'}">${hasData?rates.totalRate+'%':'–'}</b></div>
          <div class="card-ca"><span class="ca-chess">CHESS ${hc.ca.active.chess}</span><span class="ca-ace">ACE ${hc.ca.active.ace}</span></div>
        </div>
        <div class="card-headcount">
          <div class="hc-num num">${hc.active}</div>
          <div class="hc-label">현재 재원생</div>
        </div>
      </div>
      <div class="mini-stats">
        <div class="mini-stat"><div class="v num">${hc.start}</div><div class="l">학기초</div></div>
        <div class="mini-stat"><div class="v num" style="color:var(--brand)">${hc.newCnt}</div><div class="l">신규</div></div>
        <div class="mini-stat"><div class="v num" style="color:${hc.withdraw>0?'var(--neg)':'var(--ink-2)'}">${hc.withdraw}</div><div class="l">퇴원</div></div>
      </div>
      ${hasData ? stageBars(rates) : `<div style="color:var(--ink-3);font-size:12.5px;padding:8px 0">아직 업로드된 데이터가 없습니다</div>`}
      <div class="card-foot">
        ${hasData?incompleteTag(rates.incompleteStudents):'<span></span>'}
        ${goArrow}
      </div>
    </div>`;
  }).join('');
  html += `</div>`;

  // ===== 전 분원 통합 담임 순위 =====
  const allT = allTeachers(semId);
  html += `
    <div class="sect-head">
      <h3>전 분원 담임 순위</h3>
      <div class="sort-bar">
        ${allTeacherSortBtn('rate_desc','상담률순')}
        ${allTeacherSortBtn('wrate_desc','퇴원율 높은순')}
        ${allTeacherSortBtn('withdraw_desc','퇴원수 많은순')}
        ${allTeacherSortBtn('students_desc','학생수순')}
      </div>
    </div>`;
  if(allT.length===0){
    html += emptyState('아직 데이터가 없습니다','각 분원이 명단을 업로드하면 전체 담임 순위가 표시됩니다.');
  } else {
    const k = state.allTeacherSort;
    if(k==='wrate_desc') allT.sort((a,b)=> b.withdrawRate-a.withdrawRate || b.withdrawCnt-a.withdrawCnt);
    else if(k==='withdraw_desc') allT.sort((a,b)=> b.withdrawCnt-a.withdrawCnt);
    else if(k==='students_desc') allT.sort((a,b)=> b.studentCount-a.studentCount);
    else allT.sort((a,b)=> b.rates.totalRate-a.rates.totalRate);
    html += `<div class="table-wrap"><div class="table-scroll">
      <table class="rank-table">
        <thead><tr>
          <th class="cc">순위</th><th>담임</th><th>분원</th>
          <th class="cc">반</th><th class="cc">학생</th>
          <th class="cc">퇴원</th><th class="rt">퇴원율</th><th class="rt">상담률</th>
        </tr></thead>
        <tbody>
        ${allT.map((t,i)=>{
          const rank=i+1, rk=rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
          const wrColor = t.withdrawRate>=15?'var(--neg)':t.withdrawRate>=8?'var(--warn)':'var(--ink-3)';
          return `<tr onclick="enterTeacher('${t.branchId}','${encodeURIComponent(t.teacher)}')">
            <td class="cc"><span class="rk ${rk}">${rank}</span></td>
            <td class="nm">${esc(t.teacher)}</td>
            <td><span class="branch-chip">${esc(t.branchName)}</span></td>
            <td class="cc">${t.classCount}</td>
            <td class="cc">${t.studentCount}</td>
            <td class="cc"><span class="wd-pill" style="color:${wrColor}">${t.withdrawCnt}</span></td>
            <td class="rt"><span class="wd-pill" style="color:${wrColor}">${t.withdrawRate}%</span></td>
            <td class="rt"><div class="cell-rate">
              <div class="mini-track"><div class="mini-fill" style="width:${t.rates.totalRate}%;background:${rateColor(t.rates.totalRate)}"></div></div>
              <span class="pct" style="color:${rateColor(t.rates.totalRate)}">${t.rates.totalRate}%</span>
            </div></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div></div>
    <div style="margin-top:10px;font-size:12px;color:var(--ink-3)">행을 클릭하면 해당 담임 상세로 이동합니다. 퇴원율 = 퇴원 ÷ (현재 재원 + 퇴원).</div>`;
  }

  el('content').innerHTML = html;
}
function branchSortBtn(key, label){
  return `<button class="sb-btn ${state.branchSort===key?'on':''}" onclick="setBranchSort('${key}')">${label}</button>`;
}
function setBranchSort(key){ state.branchSort=key; render(); }
function allTeacherSortBtn(key,label){
  return `<button class="sb-btn ${state.allTeacherSort===key?'on':''}" onclick="setAllTeacherSort('${key}')">${label}</button>`;
}
function setAllTeacherSort(key){ state.allTeacherSort=key; render(); }

/* ============================================================================
   10. 관리자 — 분원 상세 (담임별 현황)
   ============================================================================ */
function renderAdminBranchDetail(branchId){
  const b = getBranch(branchId);
  if(!b){ go('admin'); return; }
  const semId = state.semId;
  crumbs([{label:'통합 대시보드', go:'admin'},{label:b.name}]);

 const hc = headcountClean(branchId, semId);
  const brate = calcRates(rateRecordsOf(branchId, semId), branchId, semId);
  const teachers = teachersOf(branchId, semId);

  let html = `
    ${backLink('통합 대시보드', 'admin')}
    <div class="page-head">
      <h2>${esc(b.name)}</h2>
      <div class="sub">분원 상세 현황 · ${esc(db.semesters.find(s=>s.id===semId).name)}</div>
    </div>
<div class="kpi-row c6">
      ${kpiCard('학기초 인원', hc.start, {unit:'명'})}
      ${kpiCard('신규생', hc.newCnt, {unit:'명'})}
      ${kpiCard('전입', hc.transferIn, {unit:'명'})}
      ${kpiCard('퇴원생', hc.withdraw, {unit:'명'})}
      ${kpiCard('전출', hc.transfer, {unit:'명'})}
      ${kpiCard('현 재원생', hc.active, {unit:'명', accent:true})}
    </div>
    <div class="sect-head"><h3>전체 상담 진행률</h3></div>
    ${ratePanel(brate)}
    <div class="sect-head"><h3>담임별 현황</h3>
      ${teachers.length?teacherCardsSection(teachers, branchId, 'admin').sortBar:''}</div>`;

  if(teachers.length===0){
    html += emptyState('아직 데이터가 없습니다', '해당 분원이 전체명단을 업로드하면 담임별 현황이 표시됩니다.');
  } else {
    html += `<div class="card-grid g3">` + teacherCardsSection(teachers, branchId, 'admin').cards + `</div>`;
  }
  el('content').innerHTML = html;
}

/* 담임 카드 (관리자/분원 공용) — adminMode면 클릭 비활성(관리자는 담임상세 미진입 사양상 선택)
   사양: 관리자 분원상세 "담임 카드 클릭 → 담임 상세". 분원도 동일. 둘 다 진입 허용. */
function teacherCard(t, branchId, ctx, rank, mark){
  const r = t.rates;
  const onclick = ctx==='admin'
    ? `enterTeacher('${branchId}','${encodeURIComponent(t.teacher)}')`
    : `go('branch/teacher/${encodeURIComponent(t.teacher)}')`;
  const rankCls = rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
  const cardCls = mark==='best'?' best' : mark==='worst'?' worst' : '';
  const tag = mark==='best'?'<span class="tag-best">최고</span>' : mark==='worst'?'<span class="tag-worst">최저</span>' : '';
  return `<div class="card clickable${cardCls}" onclick="${onclick}">
    ${rank?`<div class="rank-badge ${rankCls}">${rank}</div>`:''}
    <div class="card-top">
      <div>
        <div class="card-name">${esc(t.teacher)} ${tag}</div>
        <div class="card-sub">학생 ${t.studentCount}명 · 반 ${t.classCount}개${t.withdrawCnt?` · 퇴원 <b style="color:${t.withdrawRate>=15?'var(--neg)':t.withdrawRate>=8?'var(--warn)':'var(--ink-2)'}">${t.withdrawCnt}명 (${t.withdrawRate}%)</b>`:''}</div>
      </div>
      <div class="card-rate">
        <div class="r num" style="color:${rateColor(r.totalRate)}">${r.totalRate}%</div>
        <div class="rl">전체 상담률</div>
      </div>
    </div>
    ${stageBars(r)}
    <div class="card-foot">
      ${incompleteTag(r.incompleteStudents)}
      ${goArrow}
    </div>
  </div>`;
}

/* 담임 카드 묶음 — 정렬 버튼 + 순위 + 최고/최저 강조 */
function teacherCardsSection(teachers, branchId, ctx){
  const sortBar = `<div class="sort-bar">
    ${teacherSortBtn('rate_desc','상담률 높은순')}
    ${teacherSortBtn('rate_asc','낮은순')}
    ${teacherSortBtn('incomplete','미완료 많은순')}
    ${teacherSortBtn('name','이름순')}
  </div>`;
  const key = state.teacherSort;
  const arr = [...teachers];
  if(key==='rate_desc') arr.sort((a,b)=> b.rates.totalRate-a.rates.totalRate);
  else if(key==='rate_asc') arr.sort((a,b)=> a.rates.totalRate-b.rates.totalRate);
  else if(key==='incomplete') arr.sort((a,b)=> b.rates.incompleteStudents-a.rates.incompleteStudents);
  else arr.sort((a,b)=> a.teacher.localeCompare(b.teacher,'ko'));
  // 최고/최저는 상담률 기준(정렬 무관하게 고정 표시)
  const byRate = [...teachers].sort((a,b)=> b.rates.totalRate-a.rates.totalRate);
  const bestT = byRate.length ? byRate[0].teacher : null;
  const worstT = byRate.length>1 ? byRate[byRate.length-1].teacher : null;
  const cards = arr.map((t,i)=>{
    const rank = (key==='rate_desc') ? i+1 : null; // 상담률 높은순일 때만 1,2,3 표시
    const mark = t.teacher===bestT?'best' : t.teacher===worstT?'worst' : null;
    return teacherCard(t, branchId, ctx, rank, mark);
  }).join('');
  return { sortBar, cards };
}
function teacherSortBtn(key,label){
  return `<button class="sb-btn ${state.teacherSort===key?'on':''}" onclick="setTeacherSort('${key}')">${label}</button>`;
}
function setTeacherSort(key){ state.teacherSort=key; render(); }

/* 관리자 분원상세에서 담임 진입 — 컨텍스트 분원 고정 후 라우트 이동 */
function enterTeacher(branchId, teacherEnc){
  state.viewBranchId = branchId;
  go('branch/teacher/'+teacherEnc);
}
function emptyState(t, s){
  return `<div class="empty"><div class="ei">○</div><div class="et">${esc(t)}</div><div class="es">${esc(s)}</div></div>`;
}
/* 전출-전입 매칭 경고 박스 (통합 대시보드용).
   전출했는데 도착분원에 전입 안 잡힌 건 / 전입인데 출발분원에 전출 없는 건을 빨강으로 경고. */
/* ── 전출입 매칭 현황 (학기를 넘나드는 이동도 회원코드로 짝지어 한 화면에) ── */
function semShort(id){ const m=String(id).match(/sem_(\d+)_(\w+)/); if(!m) return String(id); const yy=String(m[1]).slice(2); const s={spring:'봄',summer:'여름',fall:'가을',winter:'겨울'}[m[2]]||m[2]; return yy+s; }
function _mdShort(d){ const m=String(d||'').match(/\d{4}-(\d{1,2})-(\d{1,2})/); return m?(parseInt(m[1],10)+'/'+parseInt(m[2],10)):''; }
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
  const moves=xferReconMoves(); if(!moves.length) return '';
  const matched=moves.filter(m=>m.o&&m.i).length, mismatch=moves.length-matched;
  const bn=id=>{ const b=getBranch(id); return b?b.name.replace(/분원$/,''):'?'; };
  const cell=(o,isOut)=>{ if(!o) return '<span style="color:#b7791f;font-weight:800;font-size:12px">— 없음</span>';
    const bg=isOut?'#fdeef0':'#eef2fb', fg=isOut?'#b5405a':'#3a5a86';
    return '<span style="display:inline-flex;align-items:center;gap:7px"><span style="background:'+bg+';color:'+fg+';border-radius:6px;padding:2px 8px;font-size:11.5px;font-weight:800">'+esc(bn(o.from))+'→'+esc(bn(o.to))+'</span><span style="font-size:11px;color:var(--ink-3);font-weight:700">'+esc(semShort(o.sem))+' '+esc(_mdShort(o.date))+'</span></span>'; };
  const rows=moves.map(m=>{ const ok=m.o&&m.i; const who=m.o||m.i;
    const stt = ok?'<span style="background:#e8f6ec;color:var(--pos);font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:20px">✓ 짝맞음</span>'
      :'<span style="background:#fff3d6;color:#b7791f;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:20px">⚠ '+(m.i?'전출 없음':'전입 없음')+'</span>';
    return '<tr style="'+(ok?'':'background:#fffaf0')+'">'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa"><b>'+esc(who.name)+'</b> <span style="font-size:10.5px;color:var(--ink-3);font-family:monospace">'+esc(who.code)+'</span></td>'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa">'+cell(m.o,true)+'</td>'
      +'<td style="padding:9px 4px;border-bottom:1px solid #f4f1fa;color:var(--ink-3)">→</td>'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa">'+cell(m.i,false)+'</td>'
      +'<td style="padding:9px 12px;border-bottom:1px solid #f4f1fa;text-align:right">'+stt+'</td></tr>';
  }).join('');
  return '<style>details.xrecon>summary::-webkit-details-marker{display:none}</style>'
    +'<details class="xrecon" style="margin:14px 0;border:1px solid var(--line);border-radius:var(--radius-sm);background:#fff;overflow:hidden">'
    +'<summary style="list-style:none;cursor:pointer;padding:13px 16px;display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:800;color:var(--ink)">'
    +'<span>전출입 매칭 현황</span>'
    +'<span style="font-size:12px;font-weight:700;color:var(--ink-2)">전출 '+moves.filter(m=>m.o).length+' · 전입 '+moves.filter(m=>m.i).length+' · 짝맞음 '+matched+'</span>'
    +(mismatch>0?'<span style="font-size:12px;font-weight:800;color:var(--neg);background:var(--neg-soft);padding:2px 10px;border-radius:20px">⚠ 미매칭 '+mismatch+'</span>':'<span style="font-size:12px;font-weight:800;color:var(--pos)">✓ 모두 매칭</span>')
    +'<span style="margin-left:auto;font-size:11.5px;color:var(--ink-3);font-weight:700">펼치기 ▾</span>'
    +'</summary>'
    +'<div style="max-height:440px;overflow:auto;border-top:1px solid var(--line)">'
    +'<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left;padding:9px 12px;font-size:11px;color:var(--ink-3);font-weight:700;position:sticky;top:0;background:#faf8fe">학생</th><th style="text-align:left;padding:9px 12px;font-size:11px;color:var(--ink-3);font-weight:700;position:sticky;top:0;background:#faf8fe">전출(나간 곳)</th><th style="position:sticky;top:0;background:#faf8fe"></th><th style="text-align:left;padding:9px 12px;font-size:11px;color:var(--ink-3);font-weight:700;position:sticky;top:0;background:#faf8fe">전입(들어간 곳)</th><th style="text-align:right;padding:9px 12px;font-size:11px;color:var(--ink-3);font-weight:700;position:sticky;top:0;background:#faf8fe">상태</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'</details>';
}
function transferWarnBox(semId){
  const { matched, unmatchedOut, unmatchedIn } = transferMatch(semId);
  if(unmatchedOut.length===0 && unmatchedIn.length===0){
    if(matched.length===0) return '';  // 전출입 자체가 없으면 박스 안 띄움
    return `<div style="margin:14px 0;padding:12px 14px;border:1px solid var(--pos-soft);background:var(--pos-soft);border-radius:var(--radius-sm);font-size:12.5px;color:var(--pos)">
      ✓ 전출-전입 ${matched.length}건 모두 정상 매칭됨 (서수원 전출 = 장안 전입 식으로 양쪽 다 잡힘)</div>`;
  }
  const nameOf = bid => { const b=getBranch(bid); return b?b.name:'(분원?)'; };
  const stuOf = rec => { const s=getStudent(rec.studentId); return s?`${s.name}(${s.code})`:rec.studentId; };
  let rows = '';
  unmatchedOut.forEach(({out})=>{
    rows += `<div style="padding:4px 0">⚠ <b>${esc(nameOf(out.branchId))}</b>에서 <b>${esc(nameOf(out.transferTo))}</b>로 전출 처리한 <b>${esc(stuOf(out))}</b> — 도착 분원에 전입 기록이 없습니다.</div>`;
  });
  unmatchedIn.forEach(({in:i})=>{
    rows += `<div style="padding:4px 0">⚠ <b>${esc(nameOf(i.branchId))}</b>에 <b>${esc(nameOf(i.transferTo))}</b>에서 전입 처리한 <b>${esc(stuOf(i))}</b> — 출발 분원에 전출 기록이 없습니다.</div>`;
  });
  return `<div style="margin:14px 0;padding:14px 16px;border:1px solid var(--neg-soft);background:var(--neg-soft);border-radius:var(--radius-sm)">
    <div style="font-size:13px;font-weight:700;color:var(--neg);margin-bottom:6px">전출-전입 불일치 ${unmatchedOut.length+unmatchedIn.length}건 — 분원 간 확인 필요</div>
    <div style="font-size:12.5px;color:var(--ink-2);line-height:1.5">${rows}</div>
    ${matched.length?`<div style="margin-top:8px;font-size:12px;color:var(--pos)">✓ 정상 매칭 ${matched.length}건은 양쪽 다 잡혔습니다.</div>`:''}</div>`;
}
/* ============================================================================
   반배정표 — 현재 재원명단을 부(시간대)/반별로 배치. 신규·복귀는 연두.
   반이름 예: [IS2]SU1/MWF/IS2/J → 레벨 IS2 · 부(SU1+MWF) · 교실 J · (ACE는 끝자락에 학년)
   ============================================================================ */
function banParts(cn){ return String(cn||'').replace(/^\s*\[[^\]]*\]/,'').split('/').map(x=>x.trim()).filter(Boolean); }
const BAN_NOBU='부 미지정 · 반이름에서 시간대를 못 읽었습니다';
function banBu(cn){
  const parts=banParts(cn); const code=parts[0]||''; const dayseg=(parts[1]||'').toUpperCase();
  const day=/TT/.test(dayseg)?'TT':(/MWF/.test(dayseg)?'MWF':''); const mm=code.match(/(\d)/); const num=mm?parseInt(mm[1],10):0;
  if(!day||!num) return null;
  if(day==='MWF'){ const t={1:'2:30~4:10',2:'4:10~5:50',3:'5:50~7:50',4:'7:50~9:50'}[num]||''; return {order:num,label:num+'부 · 월수금 · '+t}; }
  const t={1:'3:30~6:30',2:'6:30~9:30'}[num]||''; return {order:10+num,label:'화목 · '+t};
}
function banLevel(cn){ const m=String(cn||'').match(/\[([^\]]+)\]/); return m?m[1].trim():String(cn||''); }
function banRoom(cn){ const body=String(cn||'').replace(/^\s*\[[^\]]*\]/,''); const segs=body.split('/'); const last=(segs.length?segs[segs.length-1]:'').trim(); return (/^[A-Za-z]{1,2}$/.test(last) && !/^(mw|wf|tt)$/i.test(last)) ? last : ''; }  // 강의실=알파벳 1~2글자만. 요일(MWF/TTH)·숫자·이상한 값은 빈칸
function banLevelLabel(cn){
  const lv=banLevel(cn);
  if(banIsChess(lv)) return lv;                       // CHESS: 레벨만 (예: DSA2(1), DSB1)
  const p=banParts(cn); const seg=p.length>=2?p[p.length-2]:'';
  if(seg && seg.toUpperCase().startsWith(lv.toUpperCase())) return seg;   // 이미 '레벨_학년'이면 그대로 (A2_M1)
  if(seg && /^[A-Za-z]?\d/.test(seg)) return lv+'_'+seg;                  // 학년코드면 레벨_코드 (PA1(4-6)_E6)
  return lv;
}
function banIsChess(lv){ return /^(IS|DS|LS|MS)/.test(String(lv||'').toUpperCase()); }
function banTeacher(t){ const m=String(t||'').match(/^([A-Za-z]+)/); return m?m[1]:String(t||''); }
function banSchoolGrade(st){ let s=String((st&&st.school)||'').replace('초등학교','초').replace('중학교','중').replace('고등학교','고'); if(s.startsWith('수원')&&s.length>3) s=s.slice(2); const g=String((st&&st.grade)||''); const gm=g.match(/(\d+)/); return s+(gm?gm[1]:''); }
/* 레벨 정렬 순서. 실제 레벨명이 LSA2·DSC1 처럼 글자가 더 붙어 있어서
   예전엔 indexOf가 전부 빗나갔고, CHESS 반이 죄다 '모르는 레벨'로 맨 뒤로 밀렸다.
   → 가장 긴 접두어부터 맞춘다 (LSA1 은 'LS'가 아니라 'LSA'로 잡힘). */
const BAN_LV_ORDER=['IS','DSA','DSB','DSC','DSD','DS','LSA','LSB','LSC','LSD','LS','MSA','MSB','MS','PA','A','MA','HA','HM','HB','B'];
function banLvRank(lv){
  const s=String(lv||'').toUpperCase();
  let oi=-1, pre='';
  BAN_LV_ORDER.forEach((p,i)=>{ if(s.startsWith(p) && p.length>pre.length){ pre=p; oi=i; } });
  const m=s.slice(pre.length).match(/^(\d+)/);
  return (oi<0?99:oi)*100 + (m?parseInt(m[1],10):0);
}
function banBranchId(){ if(session.role!=='admin') return session.branchId; return state.banBranch || (db.branches[0]&&db.branches[0].id); }
function banSetBranch(v){ state.banBranch=v; renderBanTable(); }
function renderBanTable(){
  const semId=state.semId; const brId=banBranchId();
  const brName=(getBranch(brId)||{}).name||'분원';
  crumbs([{label:'반배정표'}]);
  const recs=db.semesterRecords.filter(r=>r.branchId===brId && r.semesterId===semId && r.status==='active' && (r.kind||'regular')!=='exam');
  const buMap=new Map();
  recs.forEach(r=>{
    /* 부를 못 읽어도 버리지 않는다 — 예전엔 여기서 return 해버려서 그 반 학생 전원이
       반배정표에서 통째로 사라졌고, 총원만 조용히 줄었다. 이제 '부 미지정'으로 모아 보여준다. */
    const bu=banBu(r.className) || {order:999, label:BAN_NOBU};
    if(!buMap.has(bu.label)) buMap.set(bu.label,{order:bu.order, classes:new Map()});
    const grp=buMap.get(bu.label);
    if(!grp.classes.has(r.className)) grp.classes.set(r.className,{label:banLevelLabel(r.className),chess:banIsChess(banLevel(r.className)),teacher:banTeacher(r.teacher),room:banRoom(r.className),students:[]});
    const st=getStudent(r.studentId)||{};
    grp.classes.get(r.className).students.push({name:st.name||'?', sg:banSchoolGrade({...st, grade:(r.grade||st.grade)}), isNew:(r.origin==='new'||r.origin==='return')});
  });
  const bus=[...buMap.entries()].sort((a,b)=>a[1].order-b[1].order);
  const brSel = session.role==='admin' ? '<span style="font-size:12.5px;font-weight:800;color:var(--ink-3);margin-right:6px">분원</span><select onchange="banSetBranch(this.value)" style="font:inherit;font-weight:700;font-size:13px;border:1px solid var(--line);border-radius:9px;padding:6px 10px;background:#fff;cursor:pointer">'+db.branches.map(b=>'<option value="'+b.id+'" '+(b.id===brId?'selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>' : '';
  let gChess=0,gAce=0,gTot=0;
  let h='<div class="page-head" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><div><h2>'+esc(brName)+' 반배정표</h2><div class="sub">'+esc((db.semesters.find(s=>s.id===semId)||{}).name||'')+' · 현재 재원 기준 · 신규/복귀 연두</div></div><div style="flex:1"></div>'+brSel+'<button class="btn sm" style="border:1px solid var(--brand);color:var(--brand);background:#fff" onclick="downloadBanXlsx()">⬇ 엑셀</button></div>'+stuSearchPanelHTML()+'<div id="banArea">';
  if(!bus.length){ h+='<div style="padding:40px;text-align:center;color:var(--ink-3)">이 분원·학기에 배정된 반이 없어요. (반이름에 시간대/요일 정보가 있어야 부가 잡혀요)</div>'; }
  bus.forEach(([label,grp])=>{
    const classes=[...grp.classes.entries()].sort((a,b)=> (banLvRank(banLevel(a[0]))-banLvRank(banLevel(b[0]))) || String(a[1].label).localeCompare(String(b[1].label)));
    let bChess=0,bAce=0,bTot=0;
    const ROWS=Math.max(15, ...classes.map(c=>c[1].students.length));
    const lvBg=c2=>c2.chess?'#cfe0f5':'#e6d3f5', tcBg=c2=>c2.chess?'#e5eefb':'#f0e6fb', lvFg=c2=>c2.chess?'#1c4f8a':'#5a2a8a';
    h+='<div style="margin-bottom:22px"><div style="font-weight:800;font-size:13.5px;color:#2a2440;background:'+(label===BAN_NOBU?'#fde8e8':'#e7ecf3')+';padding:6px 12px;border-radius:6px;margin-bottom:6px">'+esc(label)+(label===BAN_NOBU?' — 반이름을 <b>[레벨]시간대/요일/…</b> 형식으로 고치면 제 자리로 들어갑니다':'')+'</div><div style="overflow:auto"><table style="border-collapse:collapse;font-size:11.5px;table-layout:fixed"><colgroup><col style="width:30px">'+classes.map(()=>'<col style="width:66px"><col style="width:46px">').join('')+'</colgroup><tbody>';
    h+='<tr><th style="border:1px solid #cfc9de;background:#f6f3fc;padding:3px 6px;font-size:11px;color:var(--brand)">레벨</th>'+classes.map(c=>'<th colspan="2" style="border:1px solid #cfc9de;background:'+lvBg(c[1])+';color:'+lvFg(c[1])+';padding:3px 4px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(c[1].label)+'</th>').join('')+'</tr>';
    h+='<tr><th style="border:1px solid #cfc9de;background:#f6f3fc;padding:3px 6px;font-size:11px;color:var(--brand)">담임</th>'+classes.map(c=>'<td colspan="2" style="border:1px solid #cfc9de;background:'+tcBg(c[1])+';text-align:center;font-weight:700;padding:3px 8px">'+esc(c[1].teacher)+'</td>').join('')+'</tr>';
    h+='<tr><th style="border:1px solid #cfc9de;background:#f6f3fc;padding:3px 6px;font-size:11px;color:var(--brand)">교실</th>'+classes.map(c=>'<td colspan="2" style="border:1px solid #cfc9de;background:#eef;text-align:center;font-weight:700;padding:3px 8px">'+esc(c[1].room)+'</td>').join('')+'</tr>';
    for(let i=0;i<ROWS;i++){
      h+='<tr><td style="border:1px solid #cfc9de;background:#eee;text-align:center;font-weight:700;color:#999">'+(i+1)+'</td>';
      classes.forEach(c=>{ const s=c[1].students[i];
        if(s){ const bg=s.isNew?'background:#c9f0c0;':''; h+='<td style="border:1px solid #cfc9de;padding:2px 5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+bg+'">'+esc(s.name)+'</td><td style="border:1px solid #cfc9de;padding:2px 4px;color:#666;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+bg+'">'+esc(s.sg)+'</td>'; }
        else h+='<td style="border:1px solid #cfc9de"></td><td style="border:1px solid #cfc9de"></td>';
      });
      h+='</tr>';
    }
    h+='<tr><td style="border:1px solid #cfc9de;background:#ddd;text-align:center;font-weight:800">계</td>'+classes.map(c=>{const n=c[1].students.length;bTot+=n;if(c[1].chess)bChess+=n;else bAce+=n;return '<td colspan="2" style="border:1px solid #cfc9de;background:#ddd;text-align:center;font-weight:800">'+n+'명</td>';}).join('')+'</tr>';
    h+='</tbody></table></div><div style="margin-top:5px;font-size:12px;font-weight:800;color:#2a2440">CHESS <span style="color:#c24a4a">'+bChess+'</span> · ACE <span style="color:#356fb2">'+bAce+'</span> · 총 '+bTot+'명</div></div>';
    gChess+=bChess; gAce+=bAce; gTot+=bTot;
  });
  h+='</div>';
  if(bus.length) h+='<div style="margin-top:8px;padding:12px 16px;background:#faf8ff;border:1px solid var(--line);border-radius:12px;font-weight:800;font-size:14px">전체 · CHESS <span style="color:#c24a4a">'+gChess+'</span>명 · ACE <span style="color:#356fb2">'+gAce+'</span>명 · <span style="color:var(--brand)">총 '+gTot+'명</span> <span style="font-weight:700;color:var(--ink-3)">· 이 학기 이 분원 재원 '+recs.length+'명</span></div>';
  el('content').innerHTML=h;
  state.stuSearchBranch = brId;   // 반배정표가 보는 분원 기준으로 검색
  renderStuSearch();
}
function downloadBanXlsx(){
  try{
    const tables=document.querySelectorAll('#banArea table');
    if(!tables.length){ toast&&toast('내보낼 표가 없어요','err'); return; }
    const wb=XLSX.utils.book_new();
    tables.forEach((t,i)=>{ const ws=XLSX.utils.table_to_sheet(t); XLSX.utils.book_append_sheet(wb, ws, (i+1)+'교시'); });
    const brName=(getBranch(banBranchId())||{}).name||'분원';
    XLSX.writeFile(wb, brName+'_반배정표.xlsx');
  }catch(e){ console.error(e); toast&&toast('엑셀 생성 실패','err'); }
}
/* ============================================================================
   11. 분원 — Dashboard (요약 + 담임별 현황). 업로드 버튼 없음(보는 화면)
   ============================================================================ */
function activeBranchId(){
  // admin이 분원상세에서 담임/반 진입 시 컨텍스트 분원, branch면 자기 분원
  return state.viewBranchId || (session.role==='branch' ? session.branchId : null);
}

function renderBranchDashboard(){
  const branchId = session.branchId;
  state.viewBranchId = branchId;
  const b = getBranch(branchId);
  const semId = state.semId;
  crumbs([{label:`${b.name} Dashboard`}]);

  const hc = headcountClean(branchId, semId);
  const rates = calcRates(rateRecordsOf(branchId, semId), branchId, semId);
  const teachers = teachersOf(branchId, semId);

  let html = `
    <div class="page-head">
      <h2>${esc(b.name)} Dashboard</h2>
      <div class="sub">${esc(db.semesters.find(s=>s.id===semId).name)} 운영 현황</div>
    </div>
<div class="kpi-row c6">
      ${kpiCard('학기초 인원', hc.start, {unit:'명', ca:hc.ca.start})}
      ${kpiCard('신규생', hc.newCnt, {unit:'명', ca:hc.ca.newCnt})}
      ${kpiCard('전입', hc.transferIn, {unit:'명', ca:hc.ca.transferIn})}
      ${kpiCard('퇴원생', hc.withdraw, {unit:'명', ca:hc.ca.withdraw})}
      ${kpiCard('전출', hc.transfer, {unit:'명', ca:hc.ca.transfer})}
      ${kpiCard('현 재원생', hc.active, {unit:'명', accent:true, ca:hc.ca.active})}
    </div>
    ${stuSearchPanelHTML()}
    <div class="sect-head"><h3>전체 상담률</h3>
    <span class="cnt">단계별 진행 현황</span></div>
    ${ratePanel(rates)}
    <div class="sect-head"><h3>담임별 현황</h3>
      ${teachers.length?teacherCardsSection(teachers, branchId, 'branch').sortBar:''}</div>`;

  if(teachers.length===0){
    html += emptyState('아직 데이터가 없습니다', '데이터관리 메뉴에서 전체명단과 상담이력을 업로드하면 현황이 표시됩니다.');
  } else {
    html += `<div class="card-grid g3">` + teacherCardsSection(teachers, branchId, 'branch').cards + `</div>`;
  }
  el('content').innerHTML = html;
  state.stuSearchBranch = branchId;
  renderStuSearch();
}

/* ============================================================================
   12. 담임 상세 — 담당 반 목록
   ============================================================================ */
function renderTeacherDetail(teacher){
  const branchId = activeBranchId();
  if(!branchId){ go(session.role==='admin'?'admin':'branch'); return; }
  const b = getBranch(branchId);
  const semId = state.semId;
  const isAdmin = session.role==='admin';

  // crumbs & back differ by role
  if(isAdmin){
    crumbs([{label:'통합 대시보드', go:'admin'},{label:b.name, go:'admin/branch/'+branchId},{label:teacher}]);
  } else {
    crumbs([{label:`${b.name} Dashboard`, go:'branch'},{label:teacher}]);
  }

const trecs = activeRecordsOf(branchId, semId).filter(r=>r.teacher===teacher);
  if(trecs.length===0){ el('content').innerHTML = emptyState('해당 담임 데이터가 없습니다',''); return; }
  const rates = calcRates(rateRecordsOfTeacher(branchId, semId, teacher), branchId, semId);
  const classes = classesOf(branchId, semId, teacher);
  const classCount = classes.length;

  const backTarget = isAdmin ? 'admin/branch/'+branchId : 'branch';
  const backLabel = isAdmin ? b.name : `${b.name} Dashboard`;

  let html = `
    ${backLink(backLabel, backTarget)}
    <div class="page-head">
      <h2>${esc(teacher)} <span style="font-size:14px;font-weight:500;color:var(--ink-3)">담임</span></h2>
      <div class="sub">${esc(b.name)} · 학생 ${trecs.length}명 · 반 ${classCount}개</div>
    </div>
    <div class="sect-head"><h3>담임 전체 상담 진행률</h3></div>
    ${ratePanel(rates)}
    <div class="sect-head"><h3>담당 반 목록</h3>
      <div class="sort-bar">
        ${classSortBtn('rate_desc','상담률 높은순')}
        ${classSortBtn('rate_asc','낮은순')}
        ${classSortBtn('name','반이름순')}
      </div></div>
    <div class="card-grid g4">`;

  // 반 정렬
  const ckey = state.classSort;
  const arr = [...classes];
  if(ckey==='rate_desc') arr.sort((a,b)=> b.rates.totalRate-a.rates.totalRate);
  else if(ckey==='rate_asc') arr.sort((a,b)=> a.rates.totalRate-b.rates.totalRate);
  else arr.sort((a,b)=> a.label.localeCompare(b.label,'ko'));
  const byRate = [...classes].sort((a,b)=> b.rates.totalRate-a.rates.totalRate);
  const bestC = byRate.length?byRate[0].className:null;
  const worstC = byRate.length>1?byRate[byRate.length-1].className:null;

  html += arr.map((cls,i)=>{
    const r = cls.rates;
    const rank = (ckey==='rate_desc')?i+1:null;
    const rankCls = rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
    const mark = cls.className===bestC?'best':cls.className===worstC?'worst':null;
    const cardCls = mark==='best'?' best':mark==='worst'?' worst':'';
    const tag = mark==='best'?'<span class="tag-best">최고</span>':mark==='worst'?'<span class="tag-worst">최저</span>':'';
    return `<div class="card clickable${cardCls}" onclick="go('branch/class/${encodeURIComponent(teacher)}/${encodeURIComponent(cls.className)}')">
      ${rank?`<div class="rank-badge ${rankCls}">${rank}</div>`:''}
      <div class="card-top">
        <div>
          <div class="card-name">${esc(cls.label)} ${tag}</div>
          <div class="card-sub">학생 ${cls.studentCount}명${cls.withdrawCount?`<span style="color:var(--warn)"> · 퇴원 ${cls.withdrawCount}명 포함</span>`:''}</div>
        </div>
        <div class="card-rate">
          <div class="r num" style="color:${rateColor(r.totalRate)}">${r.totalRate}%</div>
          <div class="rl">반 상담률</div>
        </div>
      </div>
      ${stageBars(r)}
      <div class="card-foot">${incompleteTag(r.incompleteStudents)}${goArrow}</div>
    </div>`;
  }).join('');
  html += `</div>`;

  // 이 담임의 내신반 (인원 집계엔 안 들어가지만 상담표 진입용)
  const examTrecs = examRecordsOf(branchId, semId).filter(r=>r.teacher===teacher);
  if(examTrecs.length>0){
    const examClassMap = new Map();
    examTrecs.forEach(r=>{ if(!examClassMap.has(r.className)) examClassMap.set(r.className,[]); examClassMap.get(r.className).push(r); });
    const examCards = [...examClassMap.entries()].map(([className, crecs])=>{
      const rs = calcRates(crecs, branchId, semId);
      return `<div class="card clickable" onclick="go('branch/class/${encodeURIComponent(teacher)}/${encodeURIComponent(className)}')">
        <div class="card-top">
          <div><div class="card-name">${esc(className)}</div>
            <div class="card-sub">학생 ${crecs.length}명 <span style="color:var(--warn)">(인원 미집계)</span>${examStageOf(crecs[0])?'':'<div style="color:var(--neg);font-weight:700;margin-top:2px">회차 미지정 — 상담률에 안 잡힘</div>'}</div></div>
          <div class="card-rate"><div class="r num" style="color:${rateColor(rs.totalRate)}">${rs.totalTarget?rs.totalRate+'%':'–'}</div>
            <div class="rl">${examStageOf(crecs[0]) ? '내신 '+examStageOf(crecs[0]) : '회차 미지정'}</div></div>
        </div>
        <div class="card-foot"><span class="incomplete-tag">내신반</span>${goArrow}</div>
      </div>`;
    }).join('');
    html += `<div class="sect-head"><h3>내신반</h3><span class="cnt">내신기간 MC 진행 · 정규 인원에는 포함되지 않음</span></div>
      <div class="card-grid g4">${examCards}</div>`;
  }
  html += incompletePanel(rateRecordsOfTeacher(branchId, semId, teacher), branchId, semId, teacher);
  el('content').innerHTML = html;
}
function classSortBtn(key,label){
  return `<button class="sb-btn ${state.classSort===key?'on':''}" onclick="setClassSort('${key}')">${label}</button>`;
}
function setClassSort(key){ state.classSort=key; render(); }

/* ============================================================================
   13. 반 상세 — 엑셀형 상담표
   ============================================================================ */
function renderClassDetail(teacher, className){
  const branchId = activeBranchId();
  if(!branchId){ go(session.role==='admin'?'admin':'branch'); return; }
  const b = getBranch(branchId);
  const semId = state.semId;
  const isAdmin = session.role==='admin';

  const recs = db.semesterRecords
    .filter(r=>r.branchId===branchId && r.semesterId===semId
      && r.teacher===teacher && r.className===className)
    .sort((a,b)=>{
      // 재원생 먼저, 그다음 퇴원생. 같은 상태면 이름순.
      const aw = a.status==='withdraw' ? 1 : 0;
      const bw = b.status==='withdraw' ? 1 : 0;
      if(aw!==bw) return aw-bw;
      return getStudent(a.studentId).name.localeCompare(getStudent(b.studentId).name,'ko');
    });
const isExamClass = recs.length>0 && (recs[0].kind||'regular')==='exam';
  if(recs.length===0){ el('content').innerHTML = emptyState('해당 반 데이터가 없습니다',''); return; }
  const rates = calcRates(recs, branchId, semId);
  const classLbl = recs[0].classLabel || classLabel(className) || className;

  const tBack = isAdmin ? 'admin/branch/'+branchId : 'branch';
  if(isAdmin){
    crumbs([{label:'통합', go:'admin'},{label:b.name, go:'admin/branch/'+branchId},
      {label:teacher, go:'branch/teacher/'+encodeURIComponent(teacher)},{label:classLbl}]);
  } else {
    crumbs([{label:`${b.name} Dashboard`, go:'branch'},
      {label:teacher, go:'branch/teacher/'+encodeURIComponent(teacher)},{label:classLbl}]);
  }

  // 표 행
  const rows = recs.map(rec=>{
    const stu = getStudent(rec.studentId);
    const originBadge = rec.origin==='new' ? '<span class="origin-badge new">신규</span>'
      : rec.origin==='return' ? '<span class="origin-badge return">복귀</span>' : '';
    const statusBadge = rec.status==='active'
      ? '<span class="status-badge active">재원</span>'
      : '<span class="status-badge withdraw">퇴원</span>';
    const _mvRec = (db.studentMovements||[]).find(m=>m.type==='classChange' && m.studentId===rec.studentId && m.branchId===branchId && m.semesterId===semId);
    let moveBadge='';
    if(_mvRec){ let _mi={}; try{_mi=JSON.parse(_mvRec.memo||'{}');}catch(e){}
      moveBadge=`<span class="origin-badge" style="background:#fff3d6;color:#b7791f;margin-left:4px" title="${esc((_mi.fromLabel||_mi.fromClass||'')+' → '+(_mi.toLabel||_mi.toClass||'')+' ('+(_mvRec.date||'')+')')}">🔀 반이동</span>`; }
    const isExam = (rec.kind||'regular')==='exam';
const cells = STAGES.map(stg=>{
      const isMc = (stg==='MC1'||stg==='MC2'||stg==='MC3');
      const exempt = isMc && isExempt(rec.studentId, branchId, semId, stg);

      if(!isTarget(rec, stg, semId)){
        // 정규반에서 면제된 MC = 내신반으로 넘김. 분원관리자는 클릭해서 해제 가능.
        if(exempt && !isExam){
          const clk = canEditExempt() ? `onclick="onToggleExempt('${rec.studentId}','${stg}')"` : '';
          return `<td class="cc"><span class="cc-mark exempt ${canEditExempt()?'editable':''}" title="내신반으로 이관됨(면제). ${canEditExempt()?'클릭하면 해제':''}" ${clk}>–</span></td>`;
        }
        let why;
        if(stg==='HC1'||stg==='HC2') why = isExam ? '내신반은 HC 대상 아님' : '대상 아님(기존생)';
        else if(isExam){
          const es = examStageOf(rec);
          why = es ? `이 내신반은 ${es} 회차만 봅니다` : '이 내신반은 회차를 알 수 없어 상담률에서 제외됩니다';
        }
        else if(examCovers(rec.studentId, branchId, semId, stg)){
          const ex=(db.semesterRecords||[]).find(x=> x.studentId===rec.studentId && x.branchId===branchId
            && x.semesterId===semId && (x.kind||'regular')==='exam' && examStageOf(x)===stg);
          why = ex ? `${(ex.classLabel||ex.className||'내신반')} 에서 진행하는 회차` : '내신반에서 진행하는 회차';
        }
        else why = '대상 아님(입학 전 회차)';
        /* 대상이 아니어도 상담을 한 기록이 있으면 숨기지 않는다.
           숨기면 '분명히 상담했는데 표에 없다'가 된다. 흐린 ○ 로 보여주되 상담률엔 안 넣는다. */
        const hasLog = (db.counselingHistories||[]).some(c=> c.studentId===rec.studentId
          && c.branchId===branchId && c.semesterId===semId && c.type===stg);
        if(hasLog){
          return `<td class="cc"><span class="cc-mark na-done"
            title="상담 기록 있음 — 이 회차는 상담률에 안 들어갑니다&#10;${why}&#10;클릭: 내용 보기"
            onclick="openCounseling('${rec.studentId}','${stg}','${esc(stu.name)}')">○</span></td>`;
        }
        return `<td class="cc"><span class="cc-mark na" title="${why}">–</span></td>`;
      }
      const dat = `data-sid="${rec.studentId}" data-stg="${stg}" data-nm="${esc(stu.name)}"`;
      // 사람이 '상담 아님'으로 표시한 건 — 상담률에서 빠진다
      if(csRejected(rec.studentId, branchId, semId, stg)){
        return `<td class="cc"><span class="cc-mark reject" ${dat} data-cs="reject"
          title="상담으로 인정하지 않음 — 상담률에서 빠집니다&#10;클릭: 내용 보기 · 우클릭: 다시 인정"
          onclick="openCounseling('${rec.studentId}','${stg}','${esc(stu.name)}')">△</span></td>`;
      }
      const done = isDone(rec.studentId, branchId, semId, stg);
      if(done){
        return `<td class="cc"><span class="cc-mark done" ${dat} data-cs="done"
          title="클릭: 상담 내용 보기 · 우클릭: 메뉴"
          onclick="openCounseling('${rec.studentId}','${stg}','${esc(stu.name)}')">○</span></td>`;
      }
      const hasMistag = db.counselingHistories.some(c=>
        c.studentId===rec.studentId && c.branchId===branchId &&
        c.semesterId===semId && c.type===stg && c.mistag);
      if(hasMistag){
        return `<td class="cc"><span class="cc-mark mistag" ${dat} data-cs="mistag"
          title="대괄호 회차 오기재 의심 — 내용 확인&#10;클릭: 내용 보기 · 우클릭: 메뉴"
          onclick="openCounseling('${rec.studentId}','${stg}','${esc(stu.name)}')">⚠</span></td>`;
      }
      // 미완료(✕). 정규반 MC면 분원관리자가 클릭해서 면제(–)로 바꿀 수 있음.
      // 퇴원생인데 회차가 아직 잡혀 있으면 왜 잡히는지 같이 알려준다.
      const wdWhy = (rec.status==='withdraw' && isMc)
        ? `&#10;퇴원생 — 퇴원한 달(${rec.withdrawDate||'날짜 없음'})까지의 회차는 상담 대상입니다`
        : '';
      if(isMc && !isExam && canEditExempt()){
        return `<td class="cc"><span class="cc-mark undone editable" title="미완료 — 클릭하면 내신반으로 이관(면제)${wdWhy}"
          onclick="onToggleExempt('${rec.studentId}','${stg}')">✕</span></td>`;
      }
      return `<td class="cc"><span class="cc-mark undone" title="미완료${wdWhy}">✕</span></td>`;
    }).join('');
    return `<tr>
      <td><div class="st-name">${esc(stu.name)}${originBadge}${moveBadge}</div></td>
      <td><div>${esc(stu.school)}</div><div class="st-meta">${esc(rec.grade||stu.grade)}학년</div></td>
      <td><span class="code-chip">${esc(stu.code)}</span></td>
      <td>${statusBadge}</td>
      <td style="color:var(--ink-2);font-size:12.5px">${esc(rec.note||'–')}</td>
      ${cells}
    </tr>`;
  }).join('');

  // 하단 진행률

  const footCells = STAGES.map(s=>{
    const st = rates.stages[s];
    return `<div class="tf-cell"><div class="tfl">${s}</div>
      <div class="tfv num" style="color:${rateColor(st.rate)}">${st.rate==null?'–':st.rate+'%'}</div></div>`;
  }).join('');
  const footTotal = `<div class="tf-cell total"><div class="tfl">반 총 상담률</div>
      <div class="tfv num">${rates.totalRate}%</div></div>`;

  const backTarget = 'branch/teacher/'+encodeURIComponent(teacher);
  let html = `
    ${backLink(teacher+' 담임', backTarget)}
    <div class="page-head">
      <h2>${esc(classLbl)} <span style="font-size:14px;font-weight:500;color:${isExamClass?'var(--warn)':'var(--ink-3)'}">${isExamClass?'내신반 상담표':'상담표'}</span></h2>
      <div class="sub">${esc(b.name)} · ${esc(teacher)} 담임 · 학생 ${recs.length}명</div>
      ${isExamClass ? examStagePicker(className, examStageOf(recs[0])) : ''}
    </div>
    <div class="table-wrap">
      <div class="table-scroll">
        <table class="grid">
          <thead><tr>
            <th>학생명</th><th>학교/학년</th><th>회원코드</th><th>상태</th><th>특이사항</th>
            <th class="cc">HC1</th><th class="cc">HC2</th><th class="cc">MC1</th><th class="cc">MC2</th><th class="cc">MC3</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="table-foot">${footCells}${footTotal}</div>
    </div>
    <div style="margin-top:14px;font-size:12px;color:var(--ink-3)">
      ○ 완료(클릭 시 상담 내용) · △ 상담 인정 안 함(상담률 제외) · ✕ 미완료 · ⚠ 회차 오기재 의심(대괄호 잘못 표기) · – 상담 대상 아님(기존생은 HC 제외)<br>
      부재중이거나 양식만 붙여넣은 상담은 <b>○ 를 우클릭</b>해서 △ 로 내릴 수 있습니다. 다음 업로드에서 그 내용이 바뀌면 자동으로 ○ 로 돌아옵니다.
    </div>`;
  el('content').innerHTML = html;
}
/* 면제 토글 권한 — 분원관리자만 */
function canEditExempt(){ return session && session.role==='branch'; }
/* 셀에서 면제 토글 클릭 */
function onToggleExempt(studentId, stage){
  if(!canEditExempt()){ toast('분원 관리자만 변경할 수 있습니다','err'); return; }
  const branchId = activeBranchId();
  toggleExemption(studentId, branchId, state.semId, stage);
  render();
}
/* ── 상담 셀 우클릭 메뉴 ─────────────────────────────────────────
   ○ 를 눌러 열어보고 '이건 상담이 아니다' 싶으면 그 자리에서 바로 △ 로 내린다. */
function ccMenuEl(){
  let e = document.getElementById('ccMenu');
  if(!e){ e = document.createElement('div'); e.id='ccMenu'; e.className='cc-menu'; document.body.appendChild(e); }
  return e;
}
function ccMenuClose(){ const e=document.getElementById('ccMenu'); if(e) e.classList.remove('on'); }
function ccMenuOpen(mark, x, y){
  const sid = mark.dataset.sid, stg = mark.dataset.stg, nm = mark.dataset.nm||'';
  const kind = mark.dataset.cs;
  const e = ccMenuEl();
  const rows = [
    `<button class="cc-mi" onclick="ccMenuClose();openCounseling('${sid}','${stg}','${nm}')">상담 내용 보기</button>`
  ];
  if(canCsJudge()){
    rows.push(kind==='reject'
      ? `<button class="cc-mi ok" onclick="ccMenuClose();onCsRestore('${sid}','${stg}')">다시 상담으로 인정</button>`
      : `<button class="cc-mi warn" onclick="ccMenuClose();onCsReject('${sid}','${stg}')">상담 인정 안 함</button>`);
  }
  e.innerHTML = `<div class="cc-mh">${nm} · ${stg}</div>` + rows.join('')
    + (canCsJudge() && kind!=='reject'
        ? '<div class="cc-mn">부재중이거나 양식만 붙여넣은 건 여기서 빼주세요.<br>상담률에 안 잡힙니다.</div>'
        : '');
  e.classList.add('on');
  const r = e.getBoundingClientRect();
  e.style.left = Math.max(8, Math.min(x, innerWidth  - r.width  - 8)) + 'px';
  e.style.top  = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
}
document.addEventListener('contextmenu', ev=>{
  const mark = ev.target.closest && ev.target.closest('.cc-mark[data-cs]');
  if(!mark) return;
  ev.preventDefault();
  ccMenuOpen(mark, ev.clientX, ev.clientY);
});
document.addEventListener('mousedown', ev=>{
  if(!(ev.target.closest && ev.target.closest('#ccMenu'))) ccMenuClose();
});
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape') ccMenuClose(); });
addEventListener('scroll', ccMenuClose, true);
addEventListener('resize', ccMenuClose);
/* 학생 시험 통과/미통과 상세 팝업 (상담표에서 학생명 클릭) */
function openStudentExams(code, name){
  const branchId = activeBranchId();
  const detail = passStudentDetail(code, branchId);
  openModal(`
    <div class="modal-head">
      <div><h3>${esc(name)} · STaRT 시험 결과</h3>
        <div class="mh-sub">시험구분별 통과 현황</div></div>
      <button class="modal-x" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body" style="max-height:60vh;overflow-y:auto">
      ${detail}
    </div>`);
}
/* ============================================================================
   14. 상담 내용 팝업
   ============================================================================ */
function openCounseling(studentId, stage, name){
  const branchId = activeBranchId();
  const list = historiesOf(studentId, branchId, state.semId, stage);
  const records = list.map(c=>`
    <div class="cs-record">
      <div class="cs-meta">
        <span class="cs-tag">${esc(c.type)}</span>
        <span class="cs-date num">${esc(c.date)}</span>
        <span class="cs-by">상담자 ${esc(c.counselor||'–')}</span>
      </div>
      <div class="cs-body">${esc(c.content)}</div>
    </div>`).join('') || `<div class="empty"><div class="et">상담 기록이 없습니다</div></div>`;
  openModal(`
    <div class="modal-head">
      <div><h3>${esc(name)} · ${esc(stage)} 상담 내용</h3>
        <div class="mh-sub">${list.length}건의 상담 기록</div></div>
      <button class="modal-x" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">${records}</div>
  `);
}
/* ============================================================================
   14-2. 신규·퇴원 명단 (관리자=요약+분원카드, 클릭→분원상세 / 분원=바로 상세)
   ============================================================================ */
/* 한 분원의 신규·퇴원 인원 집계 */
function rosterCount(branchId, semId){
  let newCnt=0, transferInCnt=0, wdCnt=0, transferOutCnt=0;
  recordsOf(branchId, semId).forEach(r=>{
    if((r.origin==='new' || r.origin==='return') && !r.transferIn) newCnt++;
    if(r.transferIn) transferInCnt++;
    if(!r.transfer && (r.status==='withdraw' || (r.status==='active' && r.withdrawDate))) wdCnt++;
    if(r.status==='withdraw' && r.transfer) transferOutCnt++;
  });
  return { newCnt, transferInCnt, wdCnt, transferOutCnt };
}
/* 한 분원의 신규 또는 퇴원 학생 행 목록 */
function rosterRows(branchId, semId, tab){
  const rows = [];
  recordsOf(branchId, semId).forEach(r=>{
    const s = getStudent(r.studentId);
    if(!s) return;
    // 4분류: new(순수신규)/transferIn(전입)/withdraw(순수퇴원)/transferOut(전출)
   if(tab==='new' && !((r.origin==='new' || r.origin==='return') && !r.transferIn)) return;
    if(tab==='transferIn' && !r.transferIn) return;
    if(tab==='withdraw' && !(!r.transfer && (r.status==='withdraw' || (r.status==='active' && r.withdrawDate)))) return;
    if(tab==='transferOut' && !(r.status==='withdraw' && r.transfer)) return;
    const isIn = (tab==='new' || tab==='transferIn');
    const mvType = isIn ? 'new' : 'withdraw';
    const mv = db.studentMovements.find(m=>m.studentId===r.studentId && m.branchId===branchId && m.semesterId===semId && m.type===mvType);
    const date = isIn ? (r.enrollDate || (mv&&mv.date) || '-')
                      : (r.withdrawDate || (mv&&mv.date) || '-');
rows.push({
      name:s.name, code:s.code, school:s.school||'', grade:r.grade||s.grade||'',
      classLabel:r.classLabel||r.className||'-', className:r.className||'', teacher:r.teacher||'-',
date, memo:(mv&&mv.memo)||'',
      recId:r.id, withdrawReason:r.withdrawReason||'', withdrawMemo:r.withdrawMemo||'', transferTo:r.transferTo||'',
    });
  });
  rows.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  return rows;
}

function renderRoster(){
  const isAdmin = session.role==='admin';
  const semId = state.semId;
  // 분원 계정은 곧장 자기 분원 상세로
  if(!isAdmin){ renderRosterDetail(session.branchId); return; }

  crumbs([{label:'신규·퇴원 명단'}]);

// 전체 요약 + 분원별 카드
  let totNew=0, totIn=0, totWd=0, totOut=0;
  const cards = db.branches.map(b=>{
    const c = rosterCount(b.id, semId);
    totNew+=c.newCnt; totIn+=c.transferInCnt; totWd+=c.wdCnt; totOut+=c.transferOutCnt;
    return { b, ...c };
  });

  let html = `
    <div class="page-head">
      <h2>신규·전입·퇴원·전출 명단</h2>
      <div class="sub">전 분원 · ${esc(db.semesters.find(s=>s.id===semId).name)}</div>
    </div>
    <div class="kpi-row c4">
      ${kpiCard('전체 신규생', totNew, {unit:'명', accent:true})}
      ${kpiCard('전체 전입', totIn, {unit:'명'})}
      ${kpiCard('전체 퇴원생', totWd, {unit:'명'})}
      ${kpiCard('전체 전출', totOut, {unit:'명'})}
    </div>
    <div class="sect-head"><h3>분원별 현황</h3><span class="cnt">카드를 클릭하면 명단 상세로 이동</span></div>
    <div class="card-grid g3">
    ${cards.map(({b,newCnt,transferInCnt,wdCnt,transferOutCnt})=>{
      const total = newCnt+transferInCnt+wdCnt+transferOutCnt;
      return `<div class="card clickable" onclick="go('roster/branch/${b.id}')">
        <div class="card-top">
          <div><div class="card-name">${esc(b.name)}</div>
            <div class="card-sub">${total>0?'클릭해서 명단 보기':'변동 없음'}</div></div>
        </div>
        <div class="roster-mini" style="grid-template-columns:repeat(4,1fr)">
          <div class="rm-box new"><div class="rm-num">${newCnt}</div><div class="rm-label">신규</div></div>
          <div class="rm-box" style="background:var(--pos-soft)"><div class="rm-num" style="color:var(--pos)">${transferInCnt}</div><div class="rm-label">전입</div></div>
          <div class="rm-box wd"><div class="rm-num">${wdCnt}</div><div class="rm-label">퇴원</div></div>
          <div class="rm-box" style="background:var(--warn-soft)"><div class="rm-num" style="color:var(--warn)">${transferOutCnt}</div><div class="rm-label">전출</div></div>
        </div>
        <div class="card-foot"><span></span>${goArrow}</div>
      </div>`;
    }).join('')}
    </div>`;
  el('content').innerHTML = html;
}

/* 분원별 신규·퇴원 명단 상세 (신규/퇴원 탭 + 표) */
function renderRosterDetail(branchId){
  const isAdmin = session.role==='admin';
  const b = getBranch(branchId);
  if(!b){ go('roster'); return; }
  const semId = state.semId;
  const tab = state.rosterTab || 'new';

  if(isAdmin){
    crumbs([{label:'신규·퇴원 명단', go:'roster'},{label:b.name}]);
  } else {
    crumbs([{label:'신규·퇴원 명단'}]);
  }

 const c = rosterCount(branchId, semId);
const isInTab = (tab==='new' || tab==='transferIn' || tab==='transferOut');
  let rows = rosterRows(branchId, semId, tab);

  // 담임 목록 (필터 드롭다운용)
  const teacherSet = [...new Set(rows.map(r=>r.teacher).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));

  // 필터 적용 — 담임은 리렌더로, 검색은 DOM에서(아래 표에 data속성)
  const fTeacher = state.rosterTeacher||'';
  const fQuery = (state.rosterQuery||'').trim().toLowerCase();
  if(fTeacher) rows = rows.filter(r=>r.teacher===fTeacher);

  let html = `
    ${isAdmin?backLink('신규·퇴원 명단','roster'):''}
    <div class="page-head">
      <h2>${esc(b.name)} 신규·퇴원 명단</h2>
      <div class="sub">${esc(db.semesters.find(s=>s.id===semId).name)}</div>
    </div>
  <div class="sort-bar" style="margin-bottom:12px">
      <button class="sb-btn ${tab==='new'?'on':''}" onclick="setRosterTab('new')">신규생 ${c.newCnt}</button>
      <button class="sb-btn ${tab==='transferIn'?'on':''}" onclick="setRosterTab('transferIn')">전입 ${c.transferInCnt}</button>
      <button class="sb-btn ${tab==='withdraw'?'on':''}" onclick="setRosterTab('withdraw')">퇴원생 ${c.wdCnt}</button>
      <button class="sb-btn ${tab==='transferOut'?'on':''}" onclick="setRosterTab('transferOut')">전출 ${c.transferOutCnt}</button>
    </div>
<div style="margin:0 0 12px;display:flex;gap:8px;align-items:center">
      <span style="font-size:12.5px;font-weight:600;background:#E6F1FB;color:#0C447C;border-radius:6px;padding:3px 10px">CHESS ${countChessAce(rows).chess}</span>
      <span style="font-size:12.5px;font-weight:600;background:#E1F5EE;color:#085041;border-radius:6px;padding:3px 10px">ACE ${countChessAce(rows).ace}</span>
      <span style="font-size:12.5px;color:var(--ink-3)">· 합 ${rows.length}</span>
      <button class="btn sm" style="margin-left:auto;flex:none;white-space:nowrap;border-color:var(--brand);color:var(--brand)" onclick="downloadRosterXlsx('${branchId}')">⬇ 엑셀 다운로드</button>
    </div>
    <div class="roster-filter">
      <select onchange="setRosterTeacher(this.value)">
        <option value="">담임 전체</option>
        ${teacherSet.map(t=>`<option value="${esc(t)}" ${fTeacher===t?'selected':''}>${esc(t)}</option>`).join('')}
      </select>
      <input placeholder="이름·회원코드 검색" value="${esc(state.rosterQuery||'')}" oninput="setRosterQuery(this.value)">
      ${(fTeacher||fQuery)?`<button class="rf-clear" onclick="clearRosterFilter()">필터 해제</button>`:''}
    </div>`;

  if(rows.length===0){
    const emptyMsg = {new:'신규생이 없습니다', transferIn:'전입생이 없습니다', withdraw:'퇴원생이 없습니다', transferOut:'전출생이 없습니다'}[tab] || '없습니다';
    html += emptyState(emptyMsg, '');
  } else {
    html += `<div class="table-wrap"><div class="table-scroll">
      <table class="rank-table" id="rosterTable">
        <thead><tr>
          <th>학생명</th><th>회원코드</th><th>반</th><th>담임</th>
          <th>학교/학년</th><th>${(tab==='new'||tab==='transferIn')?'입학일':'퇴원일'}</th>
          ${isInTab?`<th>메모</th>${tab==='new'?'<th style="width:120px">입학 관리</th>':''}${tab==='transferIn'?'<th style="width:180px">전입 관리</th>':''}${tab==='transferOut'?'<th style="width:180px">전출 관리</th>':''}`:'<th style="width:130px">사유</th><th style="min-width:200px">메모</th>'}
        </tr></thead>
        <tbody>
        ${rows.map(r=>{
          const memoShown = (r.memo && r.memo!=='수동 등록' && r.memo!=='퇴원 처리') ? r.memo : '';
          const _canW = !(session&&session.canEdit===false);
          // 전입 '출발분원' / 전출 '도착분원' 목록 — 자기 분원은 뺀다.
          // 자기 분원이 들어가면 '운정1→운정1' 같은 기록이 만들어지고,
          // 어드민 전출입 매칭은 (학생·출발·도착)이 양쪽 같아야 짝지어져서 영영 미매칭으로 남는다.
          // (퇴원·전출 모달은 이미 같은 방식으로 자기 분원을 제외하고 있음)
          const _brOpts = (sel)=>(db.branches||[]).filter(b=>b.id!==branchId).map(b=>`<option value="${b.id}" ${b.id===sel?'selected':''}>${esc(b.name)}</option>`).join('');
          let _act='';
          // 신규생 입학 취소 — 다음학기 대기명단이 비면 거기서 취소할 수 없어 여기에도 둔다
          if(tab==='new') _act = _canW
            ? `<td><button class="btn sm" style="border-color:var(--neg);color:var(--neg);flex:none;white-space:nowrap;padding:0 10px" onclick="cancelEnroll('${r.recId}')">입학 취소</button></td>`
            : `<td></td>`;
          else if(tab==='transferIn') _act = _canW
            ? `<td><div style="display:flex;gap:6px;align-items:center"><button class="btn sm" style="border-color:var(--brand);color:var(--brand);flex:none;white-space:nowrap;padding:0 8px" onclick="convertTransferInToNew('${r.recId}')">일반 신규로</button> <select class="wd-inline-sel" style="width:auto;flex:1;min-width:78px" onchange="setTransferBranch('${r.recId}',this.value)"><option value="">출발분원…</option>${_brOpts(r.transferTo)}</select></div></td>`
            : `<td style="color:var(--ink-3);font-size:12px">${r.transferTo?esc((getBranch(r.transferTo)||{}).name||''):''}</td>`;
          else if(tab==='transferOut') _act = _canW
            ? `<td><div style="display:flex;gap:6px;align-items:center"><button class="btn sm" style="border-color:var(--warn);color:var(--warn);flex:none;white-space:nowrap;padding:0 8px" onclick="cancelTransferOut('${r.recId}')">전출 취소</button> <select class="wd-inline-sel" style="width:auto;flex:1;min-width:78px" onchange="setTransferBranch('${r.recId}',this.value)"><option value="">도착분원…</option>${_brOpts(r.transferTo)}</select></div></td>`
            : `<td style="color:var(--ink-3);font-size:12px">${r.transferTo?esc((getBranch(r.transferTo)||{}).name||''):''}</td>`;
          const tail = isInTab
            ? `<td style="color:var(--ink-3);font-size:12px">${esc(memoShown)}</td>${_act}`
            : `<td>
                 <select class="wd-inline-sel" onchange="setWdReason('${r.recId}', this.value)">
                   <option value="">미분류</option>
                   ${WITHDRAW_REASONS.map(w=>`<option value="${w.code}" ${r.withdrawReason===w.code?'selected':''}>${esc(w.label)}</option>`).join('')}
                 </select>
               </td>
               <td>
                 <input class="wd-inline-memo" value="${esc(r.withdrawMemo)}" placeholder="메모"
                   onblur="setWdMemo('${r.recId}', this.value)"
                   onkeydown="if(event.key==='Enter')this.blur()">
               </td>`;
          return `<tr data-name="${esc(r.name)}" data-code="${esc(r.code)}">
          <td class="nm">${esc(r.name)}</td>
          <td><span class="code-chip">${esc(r.code)}</span></td>
         <td>${esc(r.classLabel)}</td>
          <td>${esc(r.teacher)}</td>
          <td style="color:var(--ink-3);font-size:12px">${esc(r.school)} ${esc(r.grade)}${r.grade?'학년':''}</td>
          ${(session&&session.canEdit===false)
            ? `<td class="num">${esc(r.date)}</td>`
            : `<td><input type="date" class="wd-inline-date" value="${/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')?r.date:''}" onchange="${(tab==='new'||tab==='transferIn')?'setEnrollDate':'setWdDate'}('${r.recId}',this.value)" style="font-size:12px;padding:2px 5px;border:1px solid var(--line);border-radius:6px"></td>`}
          ${tail}
        </tr>`;}).join('')}
        </tbody>
      </table>
    </div></div>
<div style="margin-top:10px;font-size:12px;color:var(--ink-3)">총 ${rows.length}명${fTeacher?` · ${esc(fTeacher)} 담임`:''} · 최근 순</div>`;
  }
  el('content').innerHTML = html;
  if(state.rosterQuery) setRosterQuery(state.rosterQuery);
}
/* 명단 표에서 퇴원 사유/메모 인라인 수정 — 리렌더 없이 즉시 저장 */
function setWdReason(recId, code){
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  rec.withdrawReason = code || null;
  saveDB().then(ok=>{ if(!ok) toast('저장 실패','err'); });
}
function setWdMemo(recId, val){
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const v = (val||'').trim();
  if((rec.withdrawMemo||'') === v) return;   // 변경 없으면 저장 스킵
  rec.withdrawMemo = v;
  saveDB().then(ok=>{ if(!ok) toast('저장 실패','err'); });
}
/* 명단에서 퇴원일 인라인 수정 (수정권한 계정) */
function setWdDate(recId, val){
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const m = String(val||'').match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if(!m){ toast('날짜 형식을 확인하세요','err'); return; }
  const d = `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  if((rec.withdrawDate||'') === d) return;
  rec.withdrawDate = d;
  const mv = db.studentMovements.find(x=>x.studentId===rec.studentId && x.branchId===rec.branchId && x.semesterId===rec.semesterId && x.type==='withdraw');
  if(mv) mv.date = d;   // 이동이력 날짜도 맞춤
  saveDB().then(ok=>{ toast(ok?'퇴원일 저장됨 ✓':'저장 실패', ok?'ok':'err'); });
}
/* 명단에서 입학일(신규·전입) 인라인 수정 (수정권한 계정) */
function setEnrollDate(recId, val){
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const m = String(val||'').match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if(!m){ toast('날짜 형식을 확인하세요','err'); return; }
  const d = `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  if((rec.enrollDate||'') === d) return;
  rec.enrollDate = d;
  const mv = db.studentMovements.find(x=>x.studentId===rec.studentId && x.branchId===rec.branchId && x.semesterId===rec.semesterId && (x.type==='new'||x.type==='return'));
  if(mv) mv.date = d;   // 신규/복귀 이동이력 날짜도 맞춤
  saveDB().then(ok=>{ toast(ok?'입학일 저장됨 ✓':'저장 실패', ok?'ok':'err'); });
}
function setRosterTab(tab){ state.rosterTab=tab; state.rosterTeacher=''; state.rosterQuery=''; render(); }
function setRosterTeacher(v){ state.rosterTeacher=v; render(); }
function clearRosterFilter(){ state.rosterTeacher=''; state.rosterQuery=''; render(); }
/* 검색은 전체 리렌더 없이 표 행만 즉시 필터(입력 포커스 유지) */
function setRosterQuery(v){
  state.rosterQuery=v;
  const q=(v||'').trim().toLowerCase();
  document.querySelectorAll('#rosterTable tbody tr').forEach(tr=>{
    const name=(tr.dataset.name||'').toLowerCase();
    const code=(tr.dataset.code||'').toLowerCase();
    tr.style.display = (!q || name.includes(q) || code.includes(q)) ? '' : 'none';
  });
}

/* ── 엑셀 다운로드 공용 ────────────────────────────────────────────── */
function saveXlsx(ws, filename, sheetName){
  if(typeof XLSX==='undefined'){ toast('엑셀 모듈 로드 실패 — 인터넷 연결을 확인하세요','err'); return; }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (sheetName||'Sheet1').slice(0,31));
  XLSX.writeFile(wb, filename);
  toast('엑셀을 다운로드했습니다','ok');
}
/* 신규·퇴원 명단 → 엑셀 (현재 탭·담임·검색 필터 그대로 반영) */
function downloadRosterXlsx(branchId){
  const semId = state.semId;
  const tab = state.rosterTab || 'new';
  let rows = rosterRows(branchId, semId, tab);
  const fTeacher = state.rosterTeacher||'';
  if(fTeacher) rows = rows.filter(r=>r.teacher===fTeacher);
  const fQuery = (state.rosterQuery||'').trim().toLowerCase();
  if(fQuery) rows = rows.filter(r=> (r.name||'').toLowerCase().includes(fQuery) || (r.code||'').toLowerCase().includes(fQuery));
  if(!rows.length){ toast('내보낼 명단이 없습니다','err'); return; }
  const isIn = (tab==='new' || tab==='transferIn');
  const dateLabel = isIn ? '입학일' : '퇴원일';
  const tabLabel = {new:'신규생', transferIn:'전입', withdraw:'퇴원생', transferOut:'전출'}[tab] || '명단';
  const header = ['학생명','회원코드','반','담임','학교','학년',dateLabel];
  if(tab==='new')            header.push('메모');
  else if(tab==='transferIn')header.push('출발분원','메모');
  else if(tab==='withdraw')  header.push('사유','메모');
  else if(tab==='transferOut')header.push('도착분원','메모');
  const aoa = [header];
  rows.forEach(r=>{
    const base = [r.name, r.code, r.classLabel, r.teacher, r.school, r.grade, r.date];
    if(tab==='new')            base.push(r.memo||'');
    else if(tab==='transferIn')base.push((getBranch(r.transferTo)||{}).name||'', r.memo||'');
    else if(tab==='withdraw'){ const wr=(WITHDRAW_REASONS.find(w=>w.code===r.withdrawReason)||{}).label||''; base.push(wr, r.withdrawMemo||''); }
    else if(tab==='transferOut')base.push((getBranch(r.transferTo)||{}).name||'', r.withdrawMemo||'');
    aoa.push(base);
  });
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = header.map((h,i)=> i===2?{wch:24}:(i===0?{wch:14}:(i===1?{wch:14}:{wch:12})));
  const b = getBranch(branchId)||{};
  const semNm = (db.semesters.find(s=>s.id===semId)||{}).name || '';
  saveXlsx(ws, `${b.name||'분원'}_${tabLabel}명단_${semNm}.xlsx`, tabLabel);
}
/* 인원마감표 → 엑셀 (화면에 보이는 표 그대로 내보내기 — 병합 헤더/CHESS·ACE 포함) */
function downloadClosingXlsx(branchId){
  const tbl = document.querySelector('#content table.rank-table');
  if(!tbl){ toast('표를 찾지 못했습니다','err'); return; }
  const ws = XLSX.utils.table_to_sheet(tbl);
  const b = getBranch(branchId)||{};
  const semNm = (db.semesters.find(s=>s.id===state.semId)||{}).name || '';
  const tabLabel = {teacher:'강사별', level:'레벨별', grade:'학년별', daily:'일별'}[state.closingTab||'teacher'] || '';
  saveXlsx(ws, `${b.name||'분원'}_인원마감표_${tabLabel}_${semNm}.xlsx`, '인원마감표');
}

/* ============================================================================
   14-3. 인원마감표 (강사별·레벨별 월별 퇴원현황)
   ============================================================================ */
/* 관리자: 분원 고르는 허브 */
function renderClosingHub(){
  const semId = state.semId;
  crumbs([{label:'인원마감표'}]);
  let html = `
    <div class="page-head">
      <h2>인원마감표</h2>
      <div class="sub">분원을 선택하면 강사별·레벨별 월별 퇴원현황을 봅니다 · ${esc(db.semesters.find(s=>s.id===semId).name)}</div>
    </div>
    <div class="card-grid g3">
    ${db.branches.map(b=>{
      const recs = recordsOf(b.id, semId);
      const active = recs.filter(r=>r.status!=='withdraw').length;
      const wd = recs.filter(r=>r.status==='withdraw').length;
      return `<div class="card clickable" onclick="go('closing/branch/${b.id}')">
        <div class="card-top">
          <div><div class="card-name">${esc(b.name)}</div>
            <div class="card-sub">재원 ${active} · 퇴원 ${wd}</div></div>
          ${goArrow}
        </div>
      </div>`;
    }).join('')}
    </div>`;
  el('content').innerHTML = html;
}

function closingTable(groups, months, firstColLabel, totalRecs, opts={}){
  const showCA = opts.showCA === true;          // 각 행마다 CHESS/ACE (강사별)
  const showCAFoot = opts.showCAFoot !== false; // 맨 밑 합계 CHESS/ACE (기본 켜짐)  // 기본 true (강사별). 끄려면 {showCA:false}
  const caCol = showCA || showCAFoot;   // 구분 열을 만들지 여부
  const monthNames = months.map(m=>m+'월');
  const COLSPAN_MONTH = 6;
  const curCnt = rr => rr.filter(x=>x.status==='active').length;   // 현재 재원(재원 상태) 수 — 대시보드와 동일 기준
  // 강사탭: 그 강사가 "현재 담임"인 학생만(= 학생 기록의 teacher가 이 강사). 다른 탭(레벨/학년): 그 그룹 전체.
  const curOf = g => showCA ? g.recs.filter(r=>r.teacher===g.name) : g.recs;
 
  // 한 그룹의 특정 레코드셋으로 월별 셀 HTML 생성 (split 없이 단순 — CHESS/ACE 행용)
  function cellsHtmlSimple(recs, extraCls){
    const r = monthlyClosing(recs, months);
    return r.cells.map(c=>{
      const trCell = c.transfer ? `<span style="color:var(--warn)">${c.transfer}</span>` : '-';
      const tiCell = c.transferIn ? `<span style="color:var(--pos)">${c.transferIn}</span>` : '-';
      return `<td class="num cc${extraCls}">${c.monthStart||'-'}</td>
        <td class="num cc${extraCls}">${c.newThis||'-'}</td>
        <td class="num cc${extraCls}">${tiCell}</td>
        <td class="num cc${extraCls}">${c.withdraw||'-'}</td>
        <td class="num cc${extraCls}">${trCell}</td>
        <td class="num cc${extraCls}"><span style="color:var(--ink-3)">${c.baseNew?c.rate.toFixed(1)+'%':'-'}</span></td>`;
    }).join('');
  }
 
  const bodyRows = groups.map((g, i)=>{
    // 합계행: 기존 로직 그대로 (split 정확 반영) + 반이동 월초 보정
    const r = monthlyClosing(g.baseRecs||g.recs, months, g.activeMonths, g.splits, movesFromEvents(g.moveEvents,'all'));
    const splitMonths = new Set((g.splits||[]).map(s=>s.month));
    const monthCells = r.cells.map(c=>{
      if(c.blank) return `<td class="num cc cell-na">-</td>`.repeat(6);
      const cls = splitMonths.has(c.month) ? ' cell-split' : '';
      const mvTxt = (c.startMoveIn||c.startMoveOut) ? moveNoteText(g.moveEvents, c.month, 'all') : '';
      const msAttr = mvTxt ? ` style="background:#ffe4a3;cursor:help;font-weight:800" title="${esc(mvTxt)}"` : '';
      const trCell = c.transfer ? `<span style="color:var(--warn)">${c.transfer}</span>` : '-';
      const tiCell = c.transferIn ? `<span style="color:var(--pos)">${c.transferIn}</span>` : '-';
      return `<td class="num cc${cls}"${msAttr}>${c.monthStart||'-'}${mvTxt?' <span style="color:#b7791f">*</span>':''}</td>
        <td class="num cc${cls}">${c.newThis||'-'}</td>
        <td class="num cc${cls}">${tiCell}</td>
        <td class="num cc${cls}">${c.withdraw||'-'}</td>
        <td class="num cc${cls}">${trCell}</td>
        <td class="num cc${cls}"><span style="color:${c.rate>=10?'var(--neg)':c.rate>=5?'var(--warn)':'var(--ink-2)'}">${c.baseNew?c.rate.toFixed(1)+'%':'-'}</span></td>`;
    }).join('');
 
    const rowspan = showCA ? 3 : 1;
    const totalRow = `<tr class="clos-main">
      <td class="cc" rowspan="${rowspan}">${i+1}</td>
      <td class="cc" rowspan="${rowspan}"><span class="nm">${esc(g.name)}</span></td>
     ${showCA?`<td class="cc clos-catag clos-sum">합계</td>`:(caCol?`<td class="cc"></td>`:'')}
     ${monthCells}
      <td class="num cc" style="font-weight:700">${r.totNew||'-'}</td>
      <td class="num cc" style="font-weight:700;color:${r.totTransferIn?'var(--pos)':'inherit'}">${r.totTransferIn||'-'}</td>
      <td class="num cc" style="font-weight:700">${r.totWithdraw||'-'}</td>
      <td class="num cc" style="font-weight:700;color:${r.totTransfer?'var(--warn)':'inherit'}">${r.totTransfer||'-'}</td>
      <td class="num cc"><span style="font-weight:700;color:${r.avgRate>=10?'var(--neg)':r.avgRate>=5?'var(--warn)':'var(--brand)'}">${r.avgRate?r.avgRate.toFixed(1)+'%':'-'}</span></td>
      ${(()=>{ const cm=curMoveNoteText(g.moveEvents,'all'); return `<td class="num cc" ${cm?`style="font-weight:800;color:#7a5be0;background:#ffe4a3;cursor:help" title="${esc(cm)}"`:`style="font-weight:800;color:#7a5be0;background:#faf8ff"`}>${curCnt(curOf(g))}${cm?' <span style="color:#b7791f">*</span>':''}</td>`; })()}
    </tr>`;

    if(!showCA) return totalRow;
 
    // CHESS / ACE 행 — 합계 줄과 동일하게 담임 변경(활성월·날짜쪼갬) + 반이동 반영
    const baseR = g.baseRecs||g.recs;
    const chessRecs = baseR.filter(r=>isChess(r.className));
    const aceRecs   = baseR.filter(r=>!isChess(r.className));
    const cR = monthlyClosing(chessRecs, months, g.activeMonths, g.splits, movesFromEvents(g.moveEvents,'chess'));
    const aR = monthlyClosing(aceRecs, months, g.activeMonths, g.splits, movesFromEvents(g.moveEvents,'ace'));
    const caCellsHtml = (mc, div)=> mc.cells.map(c=>{
      if(c.blank) return `<td class="num cc cell-na clos-ca-cell">-</td>`.repeat(6);
      const mvTxt = (c.startMoveIn||c.startMoveOut) ? moveNoteText(g.moveEvents, c.month, div) : '';
      const msAttr = mvTxt ? ` style="background:#ffe4a3;cursor:help;font-weight:800" title="${esc(mvTxt)}"` : '';
      const trCell = c.transfer ? `<span style="color:var(--warn)">${c.transfer}</span>` : '-';
      const tiCell = c.transferIn ? `<span style="color:var(--pos)">${c.transferIn}</span>` : '-';
      return `<td class="num cc clos-ca-cell"${msAttr}>${c.monthStart||'-'}${mvTxt?' <span style="color:#b7791f">*</span>':''}</td>
        <td class="num cc clos-ca-cell">${c.newThis||'-'}</td>
        <td class="num cc clos-ca-cell">${tiCell}</td>
        <td class="num cc clos-ca-cell">${c.withdraw||'-'}</td>
        <td class="num cc clos-ca-cell">${trCell}</td>
        <td class="num cc clos-ca-cell"><span style="color:var(--ink-3)">${c.baseNew?c.rate.toFixed(1)+'%':'-'}</span></td>`;
    }).join('');
    const caRow = (label, tagCls, mc, curCnt, div)=>`<tr class="clos-ca">
      <td class="cc clos-catag ${tagCls}">${label}</td>
     ${caCellsHtml(mc, div)}
      <td class="num cc clos-ca-cell">${mc.totNew||'-'}</td>
      <td class="num cc clos-ca-cell">${mc.totTransferIn||'-'}</td>
      <td class="num cc clos-ca-cell">${mc.totWithdraw||'-'}</td>
      <td class="num cc clos-ca-cell">${mc.totTransfer||'-'}</td>
      <td class="num cc clos-ca-cell">${mc.avgRate?mc.avgRate.toFixed(1)+'%':'-'}</td>
      ${(()=>{ const cm=curMoveNoteText(g.moveEvents,div); return `<td class="num cc clos-ca-cell" ${cm?`style="background:#ffe4a3;color:#7a5be0;font-weight:700;cursor:help" title="${esc(cm)}"`:`style="background:#faf8ff;color:#7a5be0;font-weight:700"`}>${curCnt||'-'}${cm?' <span style="color:#b7791f">*</span>':''}</td>`; })()}
    </tr>`;

    return totalRow
      + caRow('CHESS','clos-chess', cR, curCnt(curOf(g).filter(x=>isChess(x.className))), 'chess')
      + caRow('ACE','clos-ace', aR, curCnt(curOf(g).filter(x=>!isChess(x.className))), 'ace');
  }).join('');
 
  // 합계(맨 아래)
  const baseForTotal = totalRecs || groups.reduce((acc,g)=>acc.concat(g.recs),[]);
  const totR = monthlyClosing(baseForTotal, months);
  const totalCells = totR.cells.map(c=>{
    const trCell = c.transfer ? `<span style="color:var(--warn)">${c.transfer}</span>` : '-';
    const tiCell = c.transferIn ? `<span style="color:var(--pos)">${c.transferIn}</span>` : '-';
    return `<td class="num cc">${c.monthStart||'-'}</td><td class="num cc">${c.newThis||'-'}</td>
      <td class="num cc">${tiCell}</td>
      <td class="num cc">${c.withdraw||'-'}</td><td class="num cc">${trCell}</td>
      <td class="num cc">${c.baseNew?c.rate.toFixed(1)+'%':'-'}</td>`;
  }).join('');

  // 합계 CHESS/ACE
  const chessTotRecs = baseForTotal.filter(r=>isChess(r.className));
  const aceTotRecs   = baseForTotal.filter(r=>!isChess(r.className));
  function footCellsSimple(recs){
    const rr = monthlyClosing(recs, months);
    return rr.cells.map(c=>{
      const trCell = c.transfer ? `<span style="color:var(--warn)">${c.transfer}</span>` : '-';
      const tiCell = c.transferIn ? `<span style="color:var(--pos)">${c.transferIn}</span>` : '-';
      return `<td class="num cc">${c.monthStart||'-'}</td><td class="num cc">${c.newThis||'-'}</td>
        <td class="num cc">${tiCell}</td><td class="num cc">${c.withdraw||'-'}</td><td class="num cc">${trCell}</td>
        <td class="num cc">${c.baseNew?c.rate.toFixed(1)+'%':'-'}</td>`;
    }).join('');
  }
  const cTot = monthlyClosing(chessTotRecs, months);
  const aTot = monthlyClosing(aceTotRecs, months);
 
  const monthHeads = monthNames.map(mn=>`<th class="cc" colspan="6">${mn}</th>`).join('');
  const subHeads = months.map(()=>`<th class="cc">월초</th><th class="cc">신규</th><th class="cc">전입</th><th class="cc">퇴원</th><th class="cc">전출</th><th class="cc">퇴원율</th>`).join('');
  const caHead = caCol ? `<th class="cc" rowspan="2">구분</th>` : '';
  const caFootCell = showCA ? `<td class="cc"></td>` : '';
 
 return `<div class="table-wrap closing-wrap"><div class="table-scroll">
    <table class="rank-table closing-table${showCA?' closing-ca':''}">
      <thead>
        <tr><th class="cc" rowspan="2">#</th><th class="cc" rowspan="2">${firstColLabel}</th>${caHead}${monthHeads}
          <th class="cc" colspan="6">학기 계</th></tr>
        <tr>${subHeads}<th class="cc">총신규</th><th class="cc">총전입</th><th class="cc">총퇴원</th><th class="cc">총전출</th><th class="cc">평균퇴원율</th><th class="cc" style="background:#efeafb;color:#7a5be0">현재</th></tr>
      </thead>
      <tbody>${bodyRows}</tbody>
<tr class="closing-total">
          <td class="cc" ${caCol?'rowspan="3"':''}></td>
          <td class="cc nm" ${caCol?'rowspan="3"':''}>합계</td>
          ${caCol?`<td class="cc clos-catag clos-sum">합계</td>`:''}
          ${totalCells}
          <td class="num cc" style="font-weight:800">${totR.totNew}</td>
          <td class="num cc" style="font-weight:800;color:${totR.totTransferIn?'var(--pos)':'inherit'}">${totR.totTransferIn}</td>
          <td class="num cc" style="font-weight:800">${totR.totWithdraw}</td>
          <td class="num cc" style="font-weight:800;color:${totR.totTransfer?'var(--warn)':'inherit'}">${totR.totTransfer}</td>
          <td class="num cc" style="font-weight:800">${totR.avgRate.toFixed(1)}%</td>
          <td class="num cc" style="font-weight:900;color:#7a5be0;background:#f3f0fb">${curCnt(baseForTotal)}</td>
        </tr>
        ${showCAFoot?`
        <tr class="closing-total clos-ca">
          <td class="cc clos-catag clos-chess">CHESS</td>
          ${footCellsSimple(chessTotRecs)}
          <td class="num cc">${cTot.totNew||'-'}</td>
          <td class="num cc">${cTot.totTransferIn||'-'}</td>
          <td class="num cc">${cTot.totWithdraw||'-'}</td>
          <td class="num cc">${cTot.totTransfer||'-'}</td>
          <td class="num cc">${cTot.avgRate?cTot.avgRate.toFixed(1)+'%':'-'}</td>
          <td class="num cc" style="font-weight:800;color:#7a5be0;background:#f3f0fb">${curCnt(chessTotRecs)}</td>
        </tr>
        <tr class="closing-total clos-ca">
          <td class="cc clos-catag clos-ace">ACE</td>
          ${footCellsSimple(aceTotRecs)}
          <td class="num cc">${aTot.totNew||'-'}</td>
          <td class="num cc">${aTot.totTransferIn||'-'}</td>
          <td class="num cc">${aTot.totWithdraw||'-'}</td>
          <td class="num cc">${aTot.totTransfer||'-'}</td>
          <td class="num cc">${aTot.avgRate?aTot.avgRate.toFixed(1)+'%':'-'}</td>
          <td class="num cc" style="font-weight:800;color:#7a5be0;background:#f3f0fb">${curCnt(aceTotRecs)}</td>
        </tr>
        `:''}
      </tfoot>
    </table>
  </div></div>`;
}

function renderClosing(branchId){
  const isAdmin = session.role==='admin';
  const b = getBranch(branchId);
  if(!b){ go(isAdmin?'closing':'branch'); return; }
  const semId = state.semId;
  const months = semesterMonths(semId);
  const tab = state.closingTab || 'teacher';

  if(isAdmin) crumbs([{label:'인원마감표', go:'closing'},{label:b.name}]);
  else crumbs([{label:'인원마감표'}]);

  const recs = recordsOf(branchId, semId);
  const tabBtn = (key,label)=>`<button class="sb-btn ${tab===key?'on':''}" onclick="setClosingTab('${key}')">${label}</button>`;
  const tabBar = `<div class="sort-bar" style="margin-bottom:16px">
      ${tabBtn('teacher','강사별')}${tabBtn('level','레벨별')}${tabBtn('grade','학년별')}${tabBtn('daily','일별')}
    </div>`;
  const headHtml = `
    ${isAdmin?backLink('인원마감표','closing'):''}
    <div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div>
        <h2>${esc(b.name)} 인원마감표</h2>
        <div class="sub">${esc(db.semesters.find(s=>s.id===semId).name)} · 월별 퇴원현황 (월초+신규 / 퇴원 / 퇴원율)</div>
      </div>
      <button class="btn sm" style="flex:none;white-space:nowrap;border-color:var(--brand);color:var(--brand)" onclick="downloadClosingXlsx('${branchId}')">⬇ 엑셀 다운로드</button>
    </div>${tabBar}`;

  // 일별 탭은 별도 렌더
  if(tab==='daily'){ renderClosingDaily(branchId, headHtml); return; }

  // 탭별 그룹 구성
  let groups, firstCol, note='';
  if(tab==='teacher'){
    groups = teacherGroupsWithChanges(branchId, semId, recs, months);
    firstCol = '강사명';
  } else if(tab==='level'){
    const m = new Map();
    recs.forEach(r=>{ const lv=classLevel(r.className||'')||'기타'; if(!m.has(lv)) m.set(lv,[]); m.get(lv).push(r); });
    groups = [...m.entries()].map(([name,recs])=>({name,recs})).sort((a,b)=> a.name.localeCompare(b.name));
    firstCol = '레벨';
  } else { // grade
    const m = new Map();
    recs.forEach(r=>{ const s=getStudent(r.studentId); const gk=gradeKey(s)||'미상'; if(!m.has(gk)) m.set(gk,[]); m.get(gk).push(r); });
    groups = [...m.entries()].map(([name,recs])=>({name,recs}))
      .sort((a,b)=> gradeOrder(a.name)-gradeOrder(b.name));
    firstCol = '학년';
  }

  let html = headHtml + `
    ${closingTable(groups, months, firstCol, recs, {showCA: tab==='teacher'})}
    ${note?`<div class="closing-note">${esc(note)}</div>`:''}
    <div style="margin-top:12px;font-size:12px;color:var(--ink-3)">
      월초+신규 = 그 달 시작 인원 + 그 달 신규 · 퇴원율 = 퇴원 ÷ (월초+신규) · 평균퇴원율 = 월별 퇴원율의 평균 · 전출은 퇴원에서 제외됩니다.
    </div>`;
  el('content').innerHTML = html;
  el('content').style.maxWidth = 'none';   // 인원마감표는 화면 폭 전체 사용 (현재 열까지 스크롤 없이)
}

/* 담임 변경을 반영한 강사별 그룹 생성 (날짜 정확히 쪼개기).
   변경 없는 반: 현재 담임에 통째로 (모든 월 담당).
   변경된 반: 변경월은 둘 다 담당하되 그 달을 변경일 기준으로 날짜 쪼갬.
   - 변경 전 담임: 변경월 이전 달들 + 변경월의 (1일~변경일 전날) 구간
   - 변경 후 담임: 변경월의 (변경일~말일) 구간 + 변경월 이후 달들 */
function teacherGroupsWithChanges(branchId, semId, recs, months){
  const changes = (db.teacherChanges||[]).filter(c=>c.branchId===branchId && c.semesterId===semId);
  const changeByClass = new Map();
  changes.forEach(c=>{ changeByClass.set(c.className, c); });

  const groupMap = new Map();
  const ensure = (t)=>{ if(!groupMap.has(t)) groupMap.set(t, { name:t, recs:[], months:new Set(), splits:[], currentRecs:[] }); return groupMap.get(t); };

  const byClass = new Map();
  recs.forEach(r=>{ const k=r.className||'(미배정)'; if(!byClass.has(k)) byClass.set(k,[]); byClass.get(k).push(r); });

  byClass.forEach((classRecs, className)=>{
    const ch = changeByClass.get(className);
    if(!ch){
      const t = classRecs[0].teacher || '미배정';
      const g = ensure(t);
      classRecs.forEach(r=>{ g.recs.push(r); g.currentRecs.push(r); });   // 변경 없는 반 → 현재 담당도 이 강사
      months.forEach(m=> g.months.add(m));
      return;
    }
    const chMonth = monthOfDate(ch.date);
    const chDay = dayOfDate(ch.date) || 1;
    const beforeMonths = months.filter(m=> m < chMonth);
    const afterMonths  = months.filter(m=> m > chMonth);
    const hasChMonth = months.includes(chMonth);

    // 변경 전 담임: 이전 달들 (통째) + 변경월 앞부분(날짜 쪼갬)
    const gBefore = ensure(ch.fromTeacher||'미배정');
    classRecs.forEach(r=> gBefore.recs.push(r));
    beforeMonths.forEach(m=> gBefore.months.add(m));
    if(hasChMonth && chDay>1){
      gBefore.months.add(chMonth);
      gBefore.splits.push({ className, month:chMonth, cutDay:chDay, side:'before' });
    }

    // 변경 후 담임: 변경월 뒷부분(날짜 쪼갬) + 이후 달들(통째). 현재 담당 = 이 강사(변경 후)
    const gAfter = ensure(ch.toTeacher||'미배정');
    classRecs.forEach(r=>{ gAfter.recs.push(r); gAfter.currentRecs.push(r); });
    afterMonths.forEach(m=> gAfter.months.add(m));
    if(hasChMonth){
      gAfter.months.add(chMonth);
      gAfter.splits.push({ className, month:chMonth, cutDay:chDay, side:'after' });
    }
  });

  // ── 반 이동(class_move) 반영: 이동 학생은 이전 반(담임)의 '월초 계산'엔 이동월까지 포함,
  //    새 반(담임)의 월초 계산엔 이동월+1부터 포함. 표의 신규/퇴원/전출입 컬럼엔 안 뜨고, 월초만 변동.
  //    (현재 재원 수/명단은 학생의 현재 반=새 반 기준 그대로 — recs는 안 건드리고 baseRecs만 조정)
  // ── 반 이동(class_move) 반영: 이동 학생은 이전 반(담임)의 '월초 계산'엔 이동월까지 포함,
  //    새 반(담임)의 월초 계산엔 이동월 다음 달부터 포함. 표의 신규/퇴원/전출입 컬럼엔 안 뜨고, 월초만 변동.
  //    (현재 재원 수/명단은 학생의 현재 반=새 반 기준 그대로 — recs는 안 건드리고 baseRecs만 조정)
  const groups = [...groupMap.values()].map(g=>({ name:g.name, recs:g.recs, baseRecs:g.recs.slice(), activeMonths:g.months, splits:g.splits, currentRecs:g.currentRecs, moveEvents:[] }));
  const classMoves = (db.studentMovements||[]).filter(mv=> mv.type==='classChange' && mv.branchId===branchId && mv.semesterId===semId);
  if(classMoves.length){
    const byName = new Map(groups.map(g=>[g.name,g]));
    const ensureG = (t)=>{ let g=byName.get(t); if(!g){ g={ name:t, recs:[], baseRecs:[], activeMonths:new Set(months), splits:[], currentRecs:[], moveEvents:[] }; byName.set(t,g); groups.push(g);} return g; };
    const monthAfter = (mo)=>{ const i=months.indexOf(mo); return (i>=0 && i<months.length-1) ? months[i+1] : null; };
    classMoves.forEach(mv=>{
      let info={}; try{ info=JSON.parse(mv.memo||'{}'); }catch(e){ info={}; }
      const fromT=info.fromTeacher, toT=info.toTeacher; if(!fromT||!toT||fromT===toT) return;
      const rec = recs.find(r=> r.studentId===mv.studentId); if(!rec) return;   // 현재 명단(새 반)에 있는 그 학생
      const mMonth = monthOfDate(mv.date); if(!months.includes(mMonth)) return;
      const aff = monthAfter(mMonth);   // 월초가 바뀌는(하이라이트) 달 = 이동월 다음 달
      const gFrom = ensureG(fromT), gTo = ensureG(toT);
      const nm = getStudent(rec.studentId), nmT = nm&&nm.name?nm.name:'';
      const fl=info.fromLabel||info.fromClass||fromT, tl=info.toLabel||info.toClass||toT;
      const chess = isChess(rec.className);
      // 이전 반: 월초 계산엔 포함(이동월까지)
      if(!gFrom.baseRecs.some(r=>r.studentId===rec.studentId)) gFrom.baseRecs.push(rec);
      gFrom.moveEvents.push({ month:mMonth, affMonth:aff, dir:'out', studentId:rec.studentId, isChess:chess, name:nmT, from:fl, to:tl });
      // 새 반: 월초 계산에선 이동월까지 제외 (recs=현재 재원엔 그대로 남김)
      gTo.baseRecs = gTo.baseRecs.filter(r=> r.studentId!==rec.studentId);
      gTo.moveEvents.push({ month:mMonth, affMonth:aff, dir:'in', studentId:rec.studentId, isChess:chess, name:nmT, from:fl, to:tl });
    });
  }
  return groups.sort((a,b)=> b.recs.length - a.recs.length);
}
/* moveEvents → monthlyClosing용 {out,in} 맵 (div: 'all'|'chess'|'ace') */
function movesFromEvents(events, div){
  const out=new Map(), inn=new Map();
  (events||[]).forEach(e=>{ if(div==='chess'&&!e.isChess) return; if(div==='ace'&&e.isChess) return;
    const M = e.dir==='out'?out:inn; M.set(e.month,(M.get(e.month)||0)+1); });
  return {out, in:inn};
}
/* 특정 달 월초 셀의 반이동 툴팁 텍스트 (div 필터) */
function moveNoteText(events, affMonth, div){
  const list=(events||[]).filter(e=> e.affMonth===affMonth && !(div==='chess'&&!e.isChess) && !(div==='ace'&&e.isChess));
  if(!list.length) return '';
  return list.map(e=> e.dir==='out' ? `${e.name}: ${e.from}→${e.to} 이동, 1명 차감` : `${e.name}: ${e.from}→${e.to} 이동, 1명 증가`).join(' / ');
}
/* '현재' 열 반이동 툴팁 — 학기 마지막 달 이동(affMonth 없음)은 현재 재원에 반영 */
function curMoveNoteText(events, div){
  const list=(events||[]).filter(e=> e.affMonth==null && !(div==='chess'&&!e.isChess) && !(div==='ace'&&e.isChess));
  if(!list.length) return '';
  return list.map(e=> e.dir==='out' ? `${e.name}: ${e.from}→${e.to} 이동, 1명 차감` : `${e.name}: ${e.from}→${e.to} 이동, 1명 증가`).join(' / ');
}

/* 일별 퇴원율 집계 — 월 선택 + 날짜별 표 */
function renderClosingDaily(branchId, headHtml){
  const semId = state.semId;
  const months = semesterMonths(semId);
  const month = state.closingMonth || months[0];
  const m = String(semId).match(/sem_(\d+)_/);
  let year = m ? parseInt(m[1],10) : new Date().getFullYear();
  // 겨울학기 1,2월은 다음 해
  if(month<=2 && months.includes(12)) year = year; // sem id의 연도가 이미 보정돼 있음
  const recs = recordsOf(branchId, semId);
  const data = dailyClosing(recs, year, month);

  const monthBtns = months.map(mo=>`<button class="sb-btn ${month===mo?'on':''}" onclick="setClosingMonth(${mo})">${mo}월</button>`).join('');

 const rows = data.rows.map(r=>{
    const wk = ['일','월','화','수','목','금','토'][new Date(year, month-1, r.d).getDay()];
    const wdCell = r.wdToday
      ? `<span style="color:var(--neg)">${r.wdToday}</span>${r.trToday?`<span style="color:var(--warn);font-size:11px"> +${r.trToday}전출</span>`:''}`
      : (r.trToday?`<span style="color:var(--warn);font-size:11px">${r.trToday}전출</span>`:'-');
return `<tr>
      <td class="cc">${month}/${r.d}</td>
      <td class="cc" style="color:var(--ink-3)">${wk}</td>
      <td class="num cc">${r.newToday||'-'}</td>
      <td class="num cc">${r.newAcc||'-'}</td>
      <td class="num cc" style="font-weight:700">${r.base}</td>
      <td class="num cc">${r.wdToday?`<span style="color:var(--neg)">${r.wdToday}</span>`:'-'}</td>
      <td class="num cc">${r.trToday?`<span style="color:var(--warn)">${r.trToday}</span>`:'-'}</td>
      <td class="num cc">${r.wdAcc||'-'}</td>
      <td class="num cc">${r.wdToday?`<span style="color:${r.rate>=2?'var(--neg)':'var(--ink-2)'}">${r.rate.toFixed(2)}%</span>`:'-'}</td>
    </tr>`;
  }).join('');

  const monthWd = data.rows.reduce((a,c)=>a+c.wdToday,0);
  const monthTr = data.rows.reduce((a,c)=>a+(c.trToday||0),0);
  const monthNew = data.rows.reduce((a,c)=>a+c.newToday,0);
  const monthRate = data.startCount>0 ? (monthWd/(data.startCount+monthNew)*100) : 0;
// 이달 전입 + CHESS/ACE 집계
  const monthTiRecs = recs.filter(r=> r.transferIn && enrollMonth(r)===month );
  const monthTi = monthTiRecs.length;
  const monthNewRecs = recs.filter(r=> (r.origin==='new'||r.origin==='return') && !r.transferIn && enrollMonth(r)===month );
  const monthWdRecs  = recs.filter(r=> withdrawMonth(r)===month && !r.transfer );
  const monthTrRecs  = recs.filter(r=> withdrawMonth(r)===month && r.transfer );
  const startRecs    = recs.filter(r=> (enrollMonth(r)==null || enrollMonth(r)<month) && (withdrawMonth(r)==null || withdrawMonth(r)>=month) );
  const endRecs      = recs.filter(r=> (enrollMonth(r)==null || enrollMonth(r)<=month) && (withdrawMonth(r)==null || withdrawMonth(r)>month) );
  let html = headHtml + `
    <div class="sort-bar" style="margin-bottom:14px">${monthBtns}</div>
<div class="kpi-row c6">
      ${kpiCard('월초 인원', data.startCount, {unit:'명', ca:countChessAce(startRecs)})}
      ${kpiCard('이달 신입(누계)', monthNew, {unit:'명', accent:true, ca:countChessAce(monthNewRecs)})}
      ${kpiCard('이달 전입(누계)', monthTi, {unit:'명', ca:countChessAce(monthTiRecs)})}
      ${kpiCard('이달 퇴원(누계)', monthWd, {unit:'명', ca:countChessAce(monthWdRecs)})}
      ${kpiCard('이달 전출(누계)', monthTr, {unit:'명', ca:countChessAce(monthTrRecs)})}
      ${kpiCard('말일 현원', data.endCount, {unit:'명', ca:countChessAce(endRecs)})}
    </div>
  <div class="table-wrap closing-wrap"><div class="table-scroll">
      <table class="rank-table closing-table">
        <thead><tr>
          <th class="cc">날짜</th><th class="cc">요일</th>
          <th class="cc">신입</th><th class="cc">신입누계</th><th class="cc">기준학생수</th>
          <th class="cc">퇴원</th><th class="cc">전출</th><th class="cc">퇴원누계</th><th class="cc">퇴원율</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div></div>
    <div style="margin-top:12px;font-size:12px;color:var(--ink-3)">
      기준학생수 = 그날 신입까지 더한 인원 · 퇴원율 = 그날 퇴원 ÷ 기준학생수 · 전출은 퇴원에서 제외됩니다.
    </div>`;
  el('content').innerHTML = html;
}
function setClosingTab(tab){ state.closingTab=tab; render(); }
function setClosingMonth(mo){ state.closingMonth=mo; render(); }

/* ============================================================================
   15. 분원 — 데이터관리 (엑셀 업로드 전용)
   ============================================================================ */
function renderDataManagement(){
  const branchId = session.branchId;
  const b = getBranch(branchId);
  const semId = state.semId;
  crumbs([{label:'데이터관리'}]);

  const recs = recordsOf(branchId, semId);
  const histCount = db.counselingHistories.filter(c=>c.branchId===branchId && c.semesterId===semId).length;

  const addBanner = state.addSemesterMode ? `
    <div class="panel" style="margin-bottom:14px;border-color:var(--brand-soft);background:var(--brand-soft)">
      <div style="display:flex;align-items:center;gap:10px;padding:2px 4px">
        <div style="font-size:20px">📋</div>
        <div>
          <div style="font-weight:800;color:var(--brand)">새 학기 명단 업로드 대기 중</div>
          <div style="font-size:13px;color:var(--ink-2);margin-top:2px">아래 <b>전체명단 업로드</b>에 엑셀을 올리면, 반 시작일을 읽어 학기가 자동으로 인식·추가됩니다.</div>
        </div>
      </div>
    </div>` : '';

  const lockBanner = state.migrationMode ? `
    <div class="panel" style="margin-bottom:14px;border-color:#f4c4a0;background:#fff6ee">
      <div style="display:flex;align-items:center;gap:10px;padding:2px 4px;flex-wrap:wrap">
        <div style="font-size:20px">🔓</div>
        <div style="flex:1;min-width:200px"><div style="font-weight:800;color:#c26a1f">지난 학기 잠금 해제됨</div>
          <div style="font-size:13px;color:var(--ink-2);margin-top:2px">이 세션 동안 지난 학기도 삭제·명단 덮어쓰기가 가능해요. <b>새로고침하면 다시 잠깁니다.</b></div></div>
        <button class="btn" onclick="relockPast()">다시 잠그기</button>
      </div>
    </div>` : (isPastSemester(semId) ? `
    <div class="panel" style="margin-bottom:14px;border-color:var(--line);background:var(--surface-2)">
      <div style="display:flex;align-items:center;gap:10px;padding:2px 4px;flex-wrap:wrap">
        <div style="font-size:20px">🔒</div>
        <div style="flex:1;min-width:200px"><div style="font-weight:800">지난 학기 (마감됨)</div>
          <div style="font-size:13px;color:var(--ink-2);margin-top:2px">실수 방지를 위해 <b>삭제·전체명단 덮어쓰기</b>가 잠겨 있어요.${canUnlockPast()?' 명단을 다시 올리려면 잠금을 풀어주세요.':' <b>잠금 해제는 서수원분원 엄윤경 대리 계정에서만</b> 가능합니다.'}</div></div>
        ${canUnlockPast()?`<button class="btn" style="background:#fff;color:#c26a1f;border:1px solid #f4c4a0" onclick="unlockPast()">🔓 지난 학기 잠금 해제</button>`:''}
      </div>
    </div>` : '');

  el('content').innerHTML = `
    ${addBanner}${lockBanner}
    <div class="page-head">
      <h2>데이터관리</h2>
      <div class="sub">${esc(b.name)} · ${esc(db.semesters.find(s=>s.id===semId).name)} · 전체명단 ${recs.length}명 · 상담이력 ${histCount}건</div>
    </div>
    <div class="dm-grid">
      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--brand-soft);color:var(--brand)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/></svg>
          </div>
          <div><h3>전체명단 업로드</h3></div>
        </div>
        <div class="pd">학생 DB이자 학기별 반·담임 정보의 기준입니다. 정상 IMS에서 내려받은 전체명단 엑셀을 그대로 올리면 됩니다. 특이사항 열에 '신규생' 또는 '복학생'이 적힌 학생만 HC1·HC2 대상이 됩니다. 같은 학생을 다시 올리면 최신 반·담임 정보로 갱신됩니다.</div>
        <div class="dropzone" id="rosterZone">
          <div class="dz-i">＋</div>
          <div class="dz-t">엑셀 파일을 끌어다 놓거나 클릭</div>
          <div class="dz-s">.xlsx · .xls · .csv</div>
        </div>
        <input type="file" id="rosterFile" accept=".xlsx,.xls,.csv" hidden>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--pos-soft);color:var(--pos)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
          </div>
          <div><h3>신규생 일괄업로드</h3></div>
        </div>
        <div class="pd">학기 중 새로 온 학생만 추가합니다. <b>기존 명단은 그대로 두고 이 학생들만 '신규(HC 대상)'로 현재 학기에 추가</b>돼요. <b>전입생은 '전입여부' 열에 온 분원명(예: 서수원)만 적으면</b> 전입으로 처리되고 그 분원이 출신분원으로 자동 매칭됩니다. 일반 신규생은 그 칸을 비워두세요. 반시작일이 비어 있으면 오늘 날짜로 넣습니다.</div>
        <div style="margin-bottom:10px"><button class="btn" onclick="downloadNewTemplate()" style="height:34px;font-size:12.5px">엑셀 양식 다운로드</button></div>
        <div class="dropzone" id="newStuZone"><div class="dz-i">＋</div><div class="dz-t">신규생 엑셀을 끌어다 놓거나 클릭</div><div class="dz-s">.xlsx · .xls · .csv</div></div>
        <input type="file" id="newStuFile" accept=".xlsx,.xls,.csv" hidden>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--neg-soft);color:var(--neg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6"/></svg>
          </div>
          <div><h3>퇴원생 일괄업로드</h3></div>
        </div>
        <div class="pd">여러 명을 한 번에 퇴원 처리합니다. <b>회원코드(없으면 이름)로 이 분원·학기 명단에서 찾아 퇴원 처리</b>해요. 이미 퇴원 상태면 건너뛰고, 단건 퇴원과 똑같이 이력도 남겨 통계·되돌리기가 보존됩니다.</div>
        <div style="margin-bottom:10px"><button class="btn" onclick="downloadWithdrawTemplate()" style="height:34px;font-size:12.5px">엑셀 양식 다운로드</button></div>
        <div class="dropzone" id="wdZone"><div class="dz-i">－</div><div class="dz-t">퇴원생 엑셀을 끌어다 놓거나 클릭</div><div class="dz-s">.xlsx · .xls · .csv</div></div>
        <input type="file" id="wdFile" accept=".xlsx,.xls,.csv" hidden>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--pos-soft);color:var(--pos)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </div>
          <div><h3>상담이력 업로드</h3></div>
        </div>
        <div class="pd"><b>매달 누적 추가됩니다.</b> 새 파일을 올려도 기존 이력을 덮어쓰지 않고 쌓입니다. 같은 상담은 자동으로 중복 제외됩니다. 분류가 '상담'인 건만 반영하고, 내용의 [HC1]~[MC3] 태그로 완료 단계를 판정합니다.</div>
        <div class="dropzone" id="historyZone">
          <div class="dz-i">＋</div>
          <div class="dz-t">엑셀 파일을 끌어다 놓거나 클릭</div>
          <div class="dz-s">.xlsx · .xls · .csv · 누적 추가</div>
        </div>
        <input type="file" id="historyFile" accept=".xlsx,.xls,.csv" hidden>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><div class="pi" style="background:var(--brand-soft);color:var(--brand)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2zM12 11v6M9 14h6"/></svg></div>
        <div><h3>전체명단 업로드 내역</h3></div></div>
      <div class="pd">잘못 올린 전체명단 엑셀을 <b>업로드 단위로 삭제</b>합니다. 잘못된 파일(예: 상담이력 파일)을 전체명단에 올렸을 때 그 업로드만 골라 삭제하면 <b>그 전 상태(이전 업로드까지)만 남습니다.</b> 삭제하면 <b>그 업로드로 새로 추가된 학생·반배정은 제거</b>되고, <b>덮어써진 기존 학생의 반·담임은 원래대로 복구</b>됩니다.</div>
      ${renderRosterBatches(branchId, semId)}
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><div class="pi" style="background:var(--pos-soft);color:var(--pos)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
        <div><h3>상담이력 업로드 내역</h3></div></div>
      <div class="pd">업로드한 묶음별로 되돌릴 수 있습니다. 잘못 올린 묶음만 골라 삭제하면 그때 추가된 상담만 사라지고, 다른 업로드는 그대로 남습니다.</div>
      ${renderHistoryBatches(branchId, semId)}
    </div>

    <div class="panel" style="margin-top:16px;border-color:var(--neg-soft)">
      <div class="panel-head"><div class="pi" style="background:var(--neg-soft);color:var(--neg)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
        <div><h3>데이터 비우기</h3></div></div>
      <div class="pd">필요한 것만 골라서 비울 수 있습니다. 전체명단과 상담이력은 따로 지워집니다. 아래 '상담이력 업로드 내역'에서 잘못 올린 묶음만 골라 지울 수도 있습니다.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">
        <button class="btn" style="border-color:var(--neg-soft);color:var(--neg)" onclick="confirmClearHistory()">상담이력 전체 삭제</button>
        <button class="btn" style="border-color:var(--neg-soft);color:var(--neg)" onclick="confirmClearRoster()">전체명단 삭제</button>
      </div>
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line-2)">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">학생 개별 삭제</div>
        <div class="pd" style="margin-bottom:8px">특정 학생만 명단에서 제거합니다. 이름이나 회원코드로 검색해서 고르세요. (해당 학생의 상담이력도 함께 삭제됩니다)</div>
        <input id="delSearch" placeholder="예: 김태양" autocomplete="off" oninput="renderDelResults()" style="width:100%;height:38px;padding:0 11px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2)">
        <div id="delResults" class="wd-results" style="margin-top:8px"></div>
      </div>
    </div>`;

  wireDropzone('rosterZone','rosterFile', f=> importRoster(f, branchId, semId));
  wireDropzone('newStuZone','newStuFile', f=> importRoster(f, branchId, semId, {forceNew:true}));
  wireDropzone('wdZone','wdFile', f=> openConfirm('퇴원생 일괄 업로드 확인', `「${f.name}」\n이 파일의 학생들을 퇴원 처리합니다.\n계속할까요?`, ()=>{ closeModal(); importWithdrawals(f, branchId, semId); }, {yesLabel:'퇴원 처리', danger:false}));
  wireDropzone('historyZone','historyFile', f=> openConfirm('상담이력 업로드 확인', `「${f.name}」\n상담이력을 누적으로 추가합니다. (중복은 자동 제외)\n계속할까요?`, ()=>{ closeModal(); importHistory(f, branchId, semId); }, {yesLabel:'업로드', danger:false}));
}

/* 상담이력 업로드 묶음 목록 (최신순). 각 묶음에 현재 남아있는 건수 표시 + 삭제 */
function renderHistoryBatches(branchId, semId){
  const batches = (db.uploadBatches||[])
    .filter(x=>x.kind==='history' && x.branchId===branchId && x.semesterId===semId)
    .sort((a,b)=> (b.uploadedAt||'').localeCompare(a.uploadedAt||''));
  if(batches.length===0){
    return `<div style="padding:14px 2px;color:var(--ink-3);font-size:12.5px">아직 업로드한 상담이력이 없습니다.</div>`;
  }
  // 오래된 것이 1번이 되도록 번호 매김
  const order = new Map();
  [...batches].reverse().forEach((x,i)=> order.set(x.id, i+1));
  return `<div class="batch-list">` + batches.map(x=>{
    const live = db.counselingHistories.filter(c=>c.batchId===x.id).length;
    return `<div class="batch-item">
      <div class="batch-no">${order.get(x.id)}</div>
      <div class="batch-main">
        <div class="batch-name">${esc(x.fileName)}</div>
        <div class="batch-meta">${esc(x.uploadedAt||'')} · 현재 ${live}건 남음 (업로드 시 추가 ${x.added}, 중복 ${x.dup})</div>
      </div>
      <button class="btn sm" style="border-color:var(--neg-soft);color:var(--neg)"
        onclick="confirmDeleteBatch('${x.id}')">이 업로드 삭제</button>
    </div>`;
  }).join('') + `</div>`;
}

/* 특정 업로드 묶음만 삭제 — 그 batchId의 상담만 제거 */
function confirmDeleteBatch(batchId){
  if(isPastSemester(state.semId)){ lockedPastToast(); return; }
  const x = (db.uploadBatches||[]).find(b=>b.id===batchId);
  if(!x) return;
  const live = db.counselingHistories.filter(c=>c.batchId===batchId).length;
  openConfirm('이 업로드만 삭제',
    `${x.fileName} (${x.uploadedAt})\n이 업로드로 추가된 상담 ${live}건이 삭제됩니다. 다른 업로드 묶음은 그대로 유지됩니다.`,
    ()=>{
      db.counselingHistories = db.counselingHistories.filter(c=>c.batchId!==batchId);
      db.uploadBatches = db.uploadBatches.filter(b=>b.id!==batchId);
      saveDB(); closeModal(); toast(`${live}건 삭제 완료`,'ok'); render();
    });
}

/* 전체명단 업로드 묶음 목록 (최신순) — 되돌리기 버튼 */
function renderRosterBatches(branchId, semId){
  const batches = (db.uploadBatches||[])
    .filter(x=>x.kind==='roster' && x.branchId===branchId && x.semesterId===semId)
    .sort((a,b)=> (b.uploadedAt||'').localeCompare(a.uploadedAt||''));
  if(batches.length===0){
    return `<div style="padding:14px 2px;color:var(--ink-3);font-size:12.5px">아직 이 학기 전체명단 업로드 기록이 없습니다. (이 기능 적용 후 올린 파일부터 되돌릴 수 있어요)</div>`;
  }
  const order = new Map();
  [...batches].reverse().forEach((x,i)=> order.set(x.id, i+1));
  return `<div class="batch-list">` + batches.map((x,i)=>{
    const p = x.payload||{};
    const newCnt = (p.addedRecIds||[]).length;
    const updCnt = (p.updatedRecs||[]).length;
    const latest = (i===0);   // 가장 최근 업로드만 강조
    return `<div class="batch-item"${latest?' style="border-color:var(--brand-soft);background:var(--brand-soft)"':''}>
      <div class="batch-no">${order.get(x.id)}</div>
      <div class="batch-main">
        <div class="batch-name">${esc(x.fileName)}${latest?' <span style="font-size:11px;color:var(--brand);font-weight:800">· 최근</span>':''}</div>
        <div class="batch-meta">${esc(x.uploadedAt||'')} · 새로 추가 ${newCnt}명, 덮어쓴 기존 ${updCnt}명</div>
      </div>
      <button class="btn sm" style="border-color:var(--neg-soft);color:var(--neg)"
        onclick="confirmDeleteRosterBatch('${x.id}')">이 업로드 삭제</button>
    </div>`;
  }).join('') + `</div>`;
}

/* 특정 전체명단 업로드 되돌리기 — 그 업로드가 추가한 것 삭제 + 덮어쓴 것 원상복구 */
function confirmDeleteRosterBatch(batchId){
  if(isPastSemester(state.semId)){ lockedPastToast(); return; }
  const x = (db.uploadBatches||[]).find(b=>b.id===batchId);
  if(!x){ return; }
  const p = x.payload||{};
  const addRecs = new Set(p.addedRecIds||[]);
  const addMvs  = new Set(p.addedMvIds||[]);
  const addStus = new Set(p.addedStuIds||[]);
  const updRecs = p.updatedRecs||[];
  const newCnt = addRecs.size, updCnt = updRecs.length;
  openConfirm('이 업로드 삭제',
    `${x.fileName} (${x.uploadedAt})\n\n이 업로드만 삭제하고 그 전 상태(이전 업로드까지)로 되돌립니다.\n· 이 업로드로 새로 추가된 학생·반배정 ${newCnt}명 → 삭제\n· 이 업로드가 덮어쓴 기존 학생 ${updCnt}명 → 업로드 직전 반·담임으로 복구\n\n이 업로드 이후에 손댄 다른 변경(반이동·퇴원 등)이 있으면 함께 되돌아갈 수 있으니, 방금 잘못 올렸을 때 바로 쓰는 걸 권장합니다.`,
    ()=>{
      // 1) 덮어써진 기존 레코드 원상복구
      let restored=0;
      updRecs.forEach(before=>{
        const rec = db.semesterRecords.find(r=>r.id===before.id);
        if(rec){ Object.keys(rec).forEach(k=>{ if(!(k in before)) delete rec[k]; }); Object.assign(rec, before); restored++; }
      });
      // 2) 이 업로드가 추가한 레코드 삭제
      db.semesterRecords = db.semesterRecords.filter(r=>!addRecs.has(r.id));
      // 3) 이 업로드가 남긴 이동이력(신규/복귀) 삭제
      db.studentMovements = db.studentMovements.filter(m=>!addMvs.has(m.id));
      // 4) 이 업로드가 처음 만든 학생 중, 이제 '어디에서도' 참조되지 않는 학생만 삭제.
      //    ★ 세미스터 레코드뿐 아니라 상담이력·이동이력·면제 참조도 확인한다.
      //    (상담이 붙은 학생을 지워버리면 상담이 고아가 되고, 재업로드 시 같은 코드로
      //     새 id가 생겨 상담이 옛 id에 끊긴 채 남는 버그를 방지)
      let stuDel=0;
      if(addStus.size){
        const refRec = new Set(db.semesterRecords.map(r=>r.studentId));
        const refCns = new Set((db.counselingHistories||[]).map(c=>c.studentId));
        const refMov = new Set((db.studentMovements||[]).map(m=>m.studentId));
        const refExm = new Set((db.mcExemptions||[]).map(e=>e.studentId));
        db.students = db.students.filter(s=>{
          const referenced = refRec.has(s.id) || refCns.has(s.id) || refMov.has(s.id) || refExm.has(s.id);
          if(addStus.has(s.id) && !referenced){ stuDel++; return false; }
          return true;
        });
      }
      // 5) 묶음 제거
      db.uploadBatches = db.uploadBatches.filter(b=>b.id!==batchId);
      saveDB(); closeModal();
      toast(`삭제 완료 · 추가 ${newCnt}명 삭제, 기존 ${restored}명 복구`,'ok');
      render();
    }, {yesLabel:'삭제', danger:true});
}

/* 상담이력 전체 삭제 (전체명단은 유지) */
function confirmClearHistory(){
  const branchId=session.branchId, semId=state.semId;
  const cnt = db.counselingHistories.filter(c=>c.branchId===branchId && c.semesterId===semId).length;
  openConfirm('상담이력 전체 삭제',
    `이 분원·학기의 상담이력 ${cnt}건이 모두 삭제됩니다. 전체명단(학생·반·담임)은 그대로 유지됩니다.`,
    ()=>{
      db.counselingHistories = db.counselingHistories.filter(c=>!(c.branchId===branchId && c.semesterId===semId));
      db.uploadBatches = (db.uploadBatches||[]).filter(x=>!(x.kind==='history' && x.branchId===branchId && x.semesterId===semId));
      saveDB(); closeModal(); toast('상담이력 삭제 완료','ok'); render();
    });
}

/* 학생 개별 삭제 — 검색 결과 렌더 */
function renderDelResults(){
  const branchId=session.branchId, semId=state.semId;
  const q=(el('delSearch').value||'').trim().toLowerCase();
  const box=el('delResults');
  if(!q){ box.innerHTML=''; return; }
  const matches = recordsOf(branchId, semId).filter(r=>{
    const s=getStudent(r.studentId); if(!s) return false;
    return s.name.toLowerCase().includes(q) || (s.code||'').toLowerCase().includes(q);
  }).sort((a,b)=>{
    const sa=getStudent(a.studentId), sb=getStudent(b.studentId);
    return (sa?sa.name:'').localeCompare(sb?sb.name:'','ko');
  });
  if(matches.length===0){ box.innerHTML=`<div class="wd-empty">검색 결과가 없습니다</div>`; return; }
  box.innerHTML = matches.slice(0,30).map(r=>{
    const s=getStudent(r.studentId);
    const st = r.status==='withdraw' ? '<span class="status-badge withdraw">퇴원</span>' : '';
    return `<div class="wd-item" onclick="confirmDeleteOneStudent('${r.id}')">
      <div class="wd-main"><span class="wd-name">${esc(s.name)}</span><span class="code-chip">${esc(s.code)}</span> ${st}</div>
      <div class="wd-meta">${esc(r.classLabel||r.className)} · ${esc(r.teacher)} 담임</div>
    </div>`;
  }).join('');
}
function confirmDeleteOneStudent(recId){
  if(isPastSemester(state.semId)){ lockedPastToast(); return; }
  const rec=db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s=getStudent(rec.studentId);
  const histCnt = db.counselingHistories.filter(c=>c.studentId===rec.studentId && c.branchId===rec.branchId && c.semesterId===rec.semesterId).length;
  openConfirm('학생 삭제',
    `${s.name} (${s.code}) · ${rec.classLabel||rec.className}\n이 학생의 명단 기록${histCnt?`과 상담이력 ${histCnt}건`:''}이 삭제됩니다. 되돌릴 수 없습니다.`,
    ()=>{
      db.semesterRecords = db.semesterRecords.filter(r=>r.id!==recId);
      db.counselingHistories = db.counselingHistories.filter(c=>!(c.studentId===rec.studentId && c.branchId===rec.branchId && c.semesterId===rec.semesterId));
      db.studentMovements = (db.studentMovements||[]).filter(m=>!(m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId));
      saveDB(); closeModal(); toast(`${s.name} 삭제 완료`,'ok'); render();
    });
}

/* 전체명단 삭제 (상담이력은 유지) */
function confirmClearRoster(){
  const branchId=session.branchId, semId=state.semId;
  if(isPastSemester(semId)){ lockedPastToast(); return; }
  const cnt = recordsOf(branchId, semId).length;
  openConfirm('전체명단 삭제',
    `이 분원·학기의 학생 명단 ${cnt}명이 삭제됩니다. 상담이력 기록 자체는 남지만, 명단이 없으면 상담률은 계산되지 않습니다. 보통은 새 명단을 다시 업로드하기 직전에만 사용하세요.`,
    ()=>{
      db.semesterRecords = db.semesterRecords.filter(r=>!(r.branchId===branchId && r.semesterId===semId));
      db.studentMovements = (db.studentMovements||[]).filter(m=>!(m.branchId===branchId && m.semesterId===semId));
      saveDB(); closeModal(); toast('전체명단 삭제 완료','ok'); render();
    });
}

/* ============================================================================
   15-2. 분원 — 학생관리 (신규생 추가 / 퇴원 처리 / 이동 이력)
   ============================================================================ */
function renderStudentManagement(){
  const branchId = session.branchId;
  const b = getBranch(branchId);
  const semId = state.semId;
  crumbs([{label:'학생관리'}]);

  const recs = recordsOf(branchId, semId);
  const movements = db.studentMovements
    .filter(m=>m.branchId===branchId && m.semesterId===semId)
    .sort((a,b)=> (b.date||'').localeCompare(a.date||''));

  // 기존 반 목록 (className 고유값 기준, 담임도 함께). 드롭다운 선택용.
  const classMap = new Map();
  activeRecordsOf(branchId, semId).forEach(r=>{
    if(!classMap.has(r.className)){
      classMap.set(r.className, { className:r.className, label:r.classLabel||classLabel(r.className)||r.className, teacher:r.teacher });
    }
  });
  const classList = [...classMap.values()].sort((a,b)=> a.label.localeCompare(b.label,'ko'));

  el('content').innerHTML = `
    <div class="page-head">
      <h2>학생관리</h2>
      <div class="sub">${esc(b.name)} · ${esc(db.semesters.find(s=>s.id===semId).name)} · 신규생 추가와 퇴원 처리를 합니다</div>
    </div>

    ${stuSearchPanelHTML()}

    <div class="dm-grid">
      <!-- ===== 왼쪽 위: 신규생 추가 ===== -->
      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--brand-soft);color:var(--brand)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M19 8v6M22 11h-6"/></svg>
          </div>
          <div><h3>신규생 추가</h3></div>
        </div>
        <div class="pd">학기 중 입학한 학생을 수동 등록합니다. 신규생은 HC1·HC2 대상이며, MC는 입학일 기준으로 그 달부터의 회차만 대상이 됩니다. (예: 여름학기 7월 입학 → MC1 제외, MC2·MC3 대상)</div>
        <div class="form-row">
          <div class="field"><label>학생명</label><input id="nsName" placeholder="이름" oninput="onNsInput()"></div>
          <div class="field"><label>회원코드</label><input id="nsCode" placeholder="코드"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>학교</label><input id="nsSchool" placeholder="학교" oninput="onNsInput()"></div>
          <div class="field"><label>학년</label>
            <select id="nsGrade" onchange="onNsInput()">
              <option value="">학년 선택…</option>
              <option value="초등1">초등1</option>
              <option value="초등2">초등2</option>
              <option value="초등3">초등3</option>
              <option value="초등4">초등4</option>
              <option value="초등5">초등5</option>
              <option value="초등6">초등6</option>
              <option value="중등1">중등1</option>
              <option value="중등2">중등2</option>
              <option value="중등3">중등3</option>
            </select>
          </div>
        </div>
<div class="form-row">
          <div class="field full"><label>반 선택 (검색 가능 · 비워두면 '미배정'으로 등록 → 전체명단 올릴 때 실제 반으로 자동 배정)</label>
            <input id="nsClassSearch" placeholder="반 검색… (예: PA2, 월수금, 담임명)" autocomplete="off"
              oninput="renderNsClassResults()" onfocus="renderNsClassResults()">
            <div id="nsClassResults" class="wd-results" style="display:none"></div>
            <div id="nsClassPicked" class="wd-picked" style="display:none"></div>
            <select id="nsClassSelect" style="display:none">
              <option value="">기존 반에서 선택…</option>
              ${classList.map(c=>`<option value="${esc(c.className)}" data-teacher="${esc(c.teacher)}">${esc(c.label)} · ${esc(c.teacher)}</option>`).join('')}
              <option value="__new__">+ 새 반 직접 입력</option>
            </select>
          </div>
        </div>
        <div class="form-row" id="nsNewClassRow" style="display:none">
          <div class="field"><label>새 반명 (엑셀과 동일하게)</label><input id="nsClass" placeholder="예: [DSC2]SU1/MWF/DSC2/H" oninput="onNsInput()"></div>
          <div class="field"><label>담임명</label><input id="nsTeacher" placeholder="담임" oninput="onNsInput()"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>입학일 (등원일)</label><input id="nsDate" type="date" oninput="onNsInput()"></div>
          <div class="field"><label>메모 (선택)</label><input id="nsMemo" placeholder="예: 운정1에서 전입"></div>
        </div>
        <label class="wd-transfer" style="margin-bottom:10px"><input type="checkbox" id="nsTransferIn" onchange="document.getElementById('nsTransferFromRow').style.display=this.checked?'flex':'none'"> <span>전입 (다른 분원에서 옴) — 신규생과 분리 집계</span></label>
        <div class="form-row" id="nsTransferFromRow" style="display:none">
          <div class="field full"><label>어느 분원에서 왔나요?</label>
            <select id="nsTransferFrom">
              <option value="">전 분원 선택…</option>
              ${db.branches.filter(x=>x.id!==branchId).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn primary" style="width:100%" onclick="addNewStudent()">신규생 등록</button>
      </div>

      <!-- ===== 오른쪽 위: 신규생 문자 ===== -->
      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--brand-soft);color:var(--brand)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div><h3>신규생 안내 문자</h3></div>
        </div>
        <div class="pd">왼쪽에서 신규생 정보를 입력하면 문자가 실시간으로 채워집니다. 탭을 골라 복사하세요. 입력값은 저장되지 않습니다.</div>
        <div id="msgCardBody"></div>
      </div>

      <!-- ===== 왼쪽 아래: 퇴원 처리 ===== -->
      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--neg-soft);color:var(--neg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M17 11h6"/></svg>
          </div>
          <div><h3>퇴원 처리</h3></div>
        </div>
        <div class="pd">학생 상태를 재원→퇴원으로 변경합니다. 현재 재원생 수에서 제외되지만 과거 데이터와 상담이력은 보존됩니다.</div>
        <div class="field full" style="margin-bottom:8px">
          <label>학생 검색 (이름 또는 회원코드)</label>
          <input id="wdSearch" placeholder="예: 김태양" autocomplete="off" oninput="renderWdResults()">
        </div>
        <div id="wdResults" class="wd-results"></div>
        <input type="hidden" id="wdSelect" value="">
        <div id="wdPicked" class="wd-picked" style="display:none"></div>
        <div class="form-row" style="margin:10px 0">
          <div class="field"><label>퇴원일</label><input id="wdDate" type="date" value="${today()}"></div>
          <div class="field" id="wdReasonField">
        <label>퇴원 사유</label>
        <select id="wdReason" onchange="toggleWdReason()">
          <option value="">선택하세요</option>
          ${WITHDRAW_REASONS.map(r=>`<option value="${r.code}">${esc(r.label)}</option>`).join('')}
        </select>
      </div>
      <div class="field full"><label>메모 (선택)</label><input id="wdMemo" placeholder="상세 내용을 적어주세요"></div>
        </div>
<label class="wd-transfer"><input type="checkbox" id="wdTransfer" onchange="document.getElementById('wdTransferToRow').style.display=this.checked?'flex':'none'; toggleWdReason()"> <span>전출 (다른 분원으로 이동) — 퇴원율에 반영하지 않음</span></label>
        <div class="form-row" id="wdTransferToRow" style="display:none;margin-top:8px">
          <div class="field full"><label>어느 분원으로 가나요? (본사 전입 대조용)</label>
            <select id="wdTransferTo">
              <option value="">전출 분원 선택…</option>
              ${db.branches.filter(x=>x.id!==branchId).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn" style="width:100%;border-color:var(--neg-soft);color:var(--neg)" onclick="withdrawStudent()">퇴원 처리</button>
      </div>

      <!-- ===== 오른쪽 아래: 퇴원생 상태 변경 ===== -->
      <div class="panel">
        <div class="panel-head">
          <div class="pi" style="background:var(--warn-soft);color:var(--warn)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></svg>
          </div>
          <div><h3>퇴원생 상태 변경</h3></div>
        </div>
        <div class="pd" style="margin-bottom:10px">이미 퇴원·전출 처리한 학생의 상태를 바꿉니다. 아래 두 버튼은 <b>쓰는 상황이 다르니</b> 헷갈리지 않게 골라주세요.</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
          <div style="display:flex;gap:9px;align-items:flex-start;padding:10px 12px;border:1px solid var(--pos);border-radius:9px;background:var(--pos-soft)">
            <span style="flex-shrink:0;font-size:11.5px;font-weight:700;color:var(--pos);border:1px solid var(--pos);border-radius:6px;padding:2px 8px;background:var(--surface);white-space:nowrap">재원 복귀</span>
            <span style="font-size:12.5px;color:var(--ink-2);line-height:1.5"><b>잘못 퇴원시켰을 때</b> — 원래 안 나갔는데 실수로 처리한 경우. 퇴원 기록을 <b>삭제</b>하고 없던 일로 되돌립니다. <span style="color:var(--ink-3)">(통계에 퇴원·복귀 안 잡힘)</span></span>
          </div>
          <div style="display:flex;gap:9px;align-items:flex-start;padding:10px 12px;border:1px solid var(--warn);border-radius:9px;background:var(--warn-soft)">
            <span style="flex-shrink:0;font-size:11.5px;font-weight:700;color:var(--warn);border:1px solid var(--warn);border-radius:6px;padding:2px 8px;background:var(--surface);white-space:nowrap">재입회(복귀)</span>
            <span style="font-size:12.5px;color:var(--ink-2);line-height:1.5"><b>진짜 나갔다 다시 왔을 때</b> — 실제 퇴원 후 재등원한 경우. 퇴원 기록은 <b>남기고</b> 복귀를 추가합니다. <span style="color:var(--ink-3)">(마감표에 퇴원·복귀 둘 다 잡힘)</span></span>
          </div>
        </div>
        <div class="field full" style="margin-bottom:8px">
          <label>퇴원·전출 학생 검색 (이름 또는 회원코드)</label>
          <input id="wcSearch" placeholder="예: 김태양" autocomplete="off" oninput="renderWcResults()">
        </div>
        <div id="wcResults" class="wd-results"></div>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head">
        <div class="pi" style="background:var(--warn-soft);color:var(--warn)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11l-3 3-3-3"/></svg>
        </div>
        <div><h3>담임 변경</h3></div>
      </div>
      <div class="pd">반의 담임이 중간에 바뀐 경우 등록합니다. <b>변경일 이후</b>의 인원·퇴원은 새 담임 실적으로, 그 전은 이전 담임 실적으로 인원마감표에 반영됩니다.</div>
      <div class="form-row">
        <div class="field full"><label>반 선택</label>
          <select id="tcClass" onchange="onTcClassChange()">
            <option value="">반을 선택하세요…</option>
            ${classList.map(c=>`<option value="${esc(c.className)}" data-teacher="${esc(c.teacher)}">${esc(c.label)} · 현재담임 ${esc(c.teacher)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="field"><label>이전 담임 (수정 가능)</label><input id="tcFrom" placeholder="반 선택 시 자동 · 필요하면 직접 수정"></div>
        <div class="field"><label>새 담임</label><input id="tcTo" placeholder="새 담임명"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>변경일 (새 담임 수업 시작일)</label><input id="tcDate" type="date" value="${today()}"></div>
      </div>
      <button class="btn primary" style="width:100%" onclick="changeTeacher()">담임 변경 등록</button>
      ${(()=>{
        const changes = (db.teacherChanges||[]).filter(c=>c.branchId===branchId && c.semesterId===semId)
          .sort((a,b)=>(b.date||'').localeCompare(a.date||''));
        if(!changes.length) return '';
        return `<div style="margin-top:16px"><div style="font-size:12px;font-weight:700;color:var(--ink-2);margin-bottom:8px">변경 이력</div>
          ${changes.map(c=>{
            const cls = classMap.get(c.className);
            const label = cls?cls.label:c.className;
            return `<div class="tc-hist">
              <span>${esc(label)}</span>
              <span class="tc-flow">${esc(c.fromTeacher)} → <b>${esc(c.toTeacher)}</b></span>
              <span class="tc-date num">${esc(c.date)}</span>
              <button class="tc-del" onclick="deleteTeacherChange('${c.id}')">변경 취소</button>
            </div>`;
          }).join('')}
        </div>`;
      })()}
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head">
        <div class="pi" style="background:var(--brand-soft);color:var(--brand)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h11M4 7l3-3M4 7l3 3M20 17H9M20 17l-3-3M20 17l-3 3"/></svg>
        </div>
        <div><h3>반 이동 (학생 개별)</h3></div>
      </div>
      <div class="pd">학생 한 명을 다른 반으로 옮깁니다. <b>이동일 다음 달 월초</b>부터 새 반 담임 실적으로 반영되고(이전 담임은 −1, 새 담임은 +1), 상담(MC) 기록도 학생을 따라갑니다. <b>전체 인원수는 안 바뀝니다.</b> 인원마감표에선 이동으로 월초가 바뀐 칸이 <span style="background:#ffe4a3;padding:0 4px;border-radius:3px">색</span>으로 표시돼요.</div>
      <div class="form-row">
        <div class="field"><label>현재 반</label>
          <select id="mvFromClass" onchange="onMvFromClass()">
            <option value="">반 선택…</option>
            ${classList.map(c=>`<option value="${esc(c.className)}">${esc(c.label)} · ${esc(c.teacher)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>옮길 학생</label>
          <select id="mvStudent"><option value="">먼저 현재 반을 고르세요</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="field"><label>새 반</label>
          <select id="mvToClass">
            <option value="">반 선택…</option>
            ${classList.map(c=>`<option value="${esc(c.className)}">${esc(c.label)} · ${esc(c.teacher)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>이동일</label><input id="mvDate" type="date" value="${today()}"></div>
      </div>
      <button class="btn primary" style="width:100%" onclick="moveStudent()">반 이동 등록</button>
      ${(()=>{
        const moves=(db.studentMovements||[]).filter(m=>m.type==='classChange' && m.branchId===branchId && m.semesterId===semId).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
        if(!moves.length) return '';
        return `<div style="margin-top:16px"><div style="font-size:12px;font-weight:700;color:var(--ink-2);margin-bottom:8px">반 이동 이력</div>
          ${moves.map(m=>{ let info={}; try{info=JSON.parse(m.memo||'{}');}catch(e){}
            const s=getStudent(m.studentId);
            return `<div class="tc-hist">
              <span><b>${esc(s?s.name:'?')}</b></span>
              <span class="tc-flow">${esc(info.fromLabel||info.fromClass||'')} → <b>${esc(info.toLabel||info.toClass||'')}</b></span>
              <span class="tc-date num">${esc(m.date||'')}</span>
              <button class="tc-del" onclick="cancelClassMove('${m.id}')">이동 취소</button>
            </div>`;
          }).join('')}
        </div>`;
      })()}
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><div class="pi" style="background:var(--brand-soft);color:var(--brand)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
        <div><h3>수동 등록 학생 관리</h3></div></div>
      <div class="pd">학생관리에서 직접 추가한 신규생입니다. 잘못 입력한 이름·반·담임·입학일을 수정하거나 삭제할 수 있습니다.</div>
      ${renderManualStudents(branchId, semId)}
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><div class="pi" style="background:var(--surface-2);color:var(--ink-3)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg></div>
        <div><h3>학생 이동 이력</h3></div></div>
      <div class="log-list">
        ${movements.length ? movements.map(m=>{
          const s=getStudent(m.studentId);
          const label={new:'신규 등록',withdraw:'퇴원',return:'복귀',classChange:'반 이동'}[m.type]||m.type;
          const color={new:'var(--brand)',withdraw:'var(--neg)',return:'var(--warn)',classChange:'var(--ink-2)'}[m.type];
          return `<div class="log-item"><span class="lt">${esc(m.date||'')}</span>
            <span class="lb"><b style="color:${color}">${label}</b> · ${esc(s?s.name:'?')} ${m.memo?'· '+esc(m.memo):''}</span></div>`;
        }).join('') : '<div style="padding:14px;color:var(--ink-3);font-size:12.5px">이동 이력이 없습니다.</div>'}
      </div>
    </div>`;

  // 반 선택 드롭다운: '새 반 직접 입력' 고르면 입력칸 표시 + 문자 실시간 갱신
  const csel = el('nsClassSelect');
  if(csel){
    csel.onchange = ()=>{
      el('nsNewClassRow').style.display = csel.value==='__new__' ? 'flex' : 'none';
      renderMsgCard();  // 반 바뀌면 레벨·교재·담임 자동 반영 위해 카드 다시 그림
    };
  }
// 반 검색 결과 박스: 바깥 클릭 시 닫기
  document.addEventListener('click', (e)=>{
    const wrap = el('nsClassResults');
    const search = el('nsClassSearch');
    if(!wrap || !search) return;
    if(e.target!==search && !wrap.contains(e.target)) wrap.style.display='none';
  });
  // 문자 카드 최초 렌더
  renderMsgCard();
  // 현 재원생 검색 (입력했을 때만 결과 표시)
  state.stuSearchBranch = session.branchId;
  renderStuSearch();
}

/* 재사용 가능한 '현 재원생 검색' 위젯 HTML — 여러 화면에 동일 id로 삽입(한 번에 한 화면만 렌더되므로 안전) */
function stuSearchPanelHTML(){
  return `<div class="panel" style="margin-bottom:16px">
    <div class="panel-head">
      <div class="pi" style="background:var(--brand-soft);color:var(--brand)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      </div>
      <div><h3>현 재원생 검색</h3></div>
    </div>
    <input id="stuSearch" placeholder="이름·회원코드·학교·반·담임 검색 (예: 월수금 PA2)" autocomplete="off" oninput="renderStuSearch()"
      style="width:100%;height:38px;padding:0 11px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2)">
    <div id="stuSearchResults" style="margin-top:10px"></div>
  </div>`;
}
/* 현 재원생 검색 — 입력했을 때만 결과 표시. 대상 분원은 state.stuSearchBranch(없으면 세션 분원). */
function renderStuSearch(){
  const box = el('stuSearchResults'); if(!box) return;
  const q = (el('stuSearch') && el('stuSearch').value || '').trim().toLowerCase();
  if(!q){ box.innerHTML = `<div style="padding:10px 2px;color:var(--ink-3);font-size:12.5px">이름·회원코드·학교·반·담임을 입력하면 결과가 여기에 표시됩니다.</div>`; return; }
  const branchId = state.stuSearchBranch || session.branchId || (db.branches[0]&&db.branches[0].id);
  const semId = state.semId;
  let list = activeRecordsOf(branchId, semId)
    .filter(r=>(r.kind||'regular')!=='exam')
    .map(r=>({ r, s:getStudent(r.studentId)||{} }));
  const terms = q.split(/\s+/).filter(Boolean);
  list = list.filter(({r,s})=>{
    const hay = [s.name,s.code,s.school,s.grade,r.classLabel,r.className,r.teacher]
      .map(x=>String(x||'').toLowerCase()).join(' ');
    return terms.every(t=> hay.includes(t));
  });
  list.sort((a,b)=> String(a.r.teacher||'').localeCompare(String(b.r.teacher||''),'ko')
    || String(a.r.classLabel||a.r.className||'').localeCompare(String(b.r.classLabel||b.r.className||''),'ko')
    || String(a.s.name||'').localeCompare(String(b.s.name||''),'ko'));
  if(!list.length){ box.innerHTML = `<div style="padding:12px;color:var(--ink-3);font-size:12.5px">${q?'검색 결과가 없습니다.':'현재 재원생이 없습니다.'}</div>`; return; }
  const CAP = 400;
  const body = list.slice(0,CAP).map(({r,s})=>`<tr>
    <td style="padding:5px 8px;border-bottom:1px solid var(--line);font-weight:700;white-space:nowrap">${esc(s.name||'?')}</td>
    <td style="padding:5px 8px;border-bottom:1px solid var(--line);color:var(--ink-3);font-size:11.5px;white-space:nowrap">${esc(s.code||'')}</td>
    <td style="padding:5px 8px;border-bottom:1px solid var(--line);white-space:nowrap">${esc((s.school||'')+(s.grade?(' '+s.grade):''))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid var(--line)">${esc(classLabel(r.className)||r.classLabel||r.className||'')}</td>
    <td style="padding:5px 8px;border-bottom:1px solid var(--line);white-space:nowrap">${esc(r.teacher||'')}</td>
  </tr>`).join('');
  box.innerHTML = `<div style="font-size:12px;color:var(--ink-3);margin-bottom:6px">${list.length}명${list.length>CAP?` (상위 ${CAP}명 표시)`:''}</div>
    <div style="overflow:auto;max-height:440px;border:1px solid var(--line);border-radius:8px">
    <table style="border-collapse:collapse;width:100%;font-size:12.5px">
    <thead><tr style="position:sticky;top:0;background:var(--surface-2);z-index:1">
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--line)">이름</th>
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--line)">회원코드</th>
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--line)">학교/학년</th>
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--line)">반</th>
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--line)">담임</th>
    </tr></thead><tbody>${body}</tbody></table></div>`;
}

/* 수동 등록 학생 목록 (수정/삭제) — 학생관리에서 직접 추가한 신규생만 */
function renderManualStudents(branchId, semId){
  // 수동 등록 = '수동 등록' 메모가 있는 new 이동이력을 가진 학생
  const manualIds = new Set(db.studentMovements
    .filter(m=>m.branchId===branchId && m.semesterId===semId && (m.type==='new'||m.type==='return') && !/^명단 업로드/.test(m.memo||''))
    .map(m=>m.studentId));
  const recs = recordsOf(branchId, semId)
    .filter(r=> manualIds.has(r.studentId))
    .sort((a,b)=>{ const sa=getStudent(a.studentId),sb=getStudent(b.studentId);
      return (sa?sa.name:'').localeCompare(sb?sb.name:'','ko'); });
  if(recs.length===0){
    return `<div style="padding:14px 2px;color:var(--ink-3);font-size:12.5px">수동 등록한 학생이 없습니다. (전체명단 엑셀로 올린 학생은 명단을 다시 업로드해 수정하세요.)</div>`;
  }
  return `<div class="table-wrap" style="margin-top:12px"><div class="table-scroll">
    <table class="grid">
      <thead><tr><th>학생명</th><th>회원코드</th><th>반</th><th>담임</th><th>입학일</th><th>상태</th><th class="cc">관리</th></tr></thead>
      <tbody>
      ${recs.map(r=>{
        const s=getStudent(r.studentId);
        const st = r.status==='active'?'<span class="status-badge active">재원</span>':'<span class="status-badge withdraw">퇴원</span>';
        return `<tr>
          <td class="st-name">${esc(s.name)}</td>
          <td><span class="code-chip">${esc(s.code)}</span></td>
          <td>${esc(r.classLabel||r.className)}</td>
          <td>${esc(r.teacher)}</td>
          <td class="num">${esc(r.enrollDate||'–')}</td>
          <td>${st}</td>
          <td class="cc">
            <button class="btn sm" onclick="openEditStudent('${r.id}')">수정</button>
            <button class="btn sm" style="color:var(--neg);margin-left:4px" onclick="confirmDeleteStudent('${r.id}')">삭제</button>
          </td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </div></div>`;
}

/* 학생 정보 수정 모달 */
function openEditStudent(recId){
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s = getStudent(rec.studentId);
  openModal(`
    <div class="modal-head"><div><h3>학생 정보 수정</h3>
      <div class="mh-sub">${esc(s.code)}</div></div>
      <button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-row">
        <div class="field"><label>학생명</label><input id="edName" value="${esc(s.name)}"></div>
        <div class="field"><label>회원코드</label><input id="edCode" value="${esc(s.code)}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>학교</label><input id="edSchool" value="${esc(s.school||'')}"></div>
        <div class="field"><label>학년</label><input id="edGrade" value="${esc(s.grade||'')}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>반명</label><input id="edClass" value="${esc(rec.classLabel||rec.className||'')}"></div>
        <div class="field"><label>담임명</label><input id="edTeacher" value="${esc(rec.teacher||'')}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>입학일 (등원일)</label><input id="edDate" type="date" value="${esc(rec.enrollDate||'')}"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">취소</button>
      <button class="btn primary" id="edSave">저장</button>
    </div>`);
  el('edSave').onclick = ()=> saveEditStudent(recId);
}
function saveEditStudent(recId){
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s = getStudent(rec.studentId);
  const name=el('edName').value.trim(), code=el('edCode').value.trim();
  if(!name||!code){ toast('학생명과 회원코드는 필수입니다','err'); return; }
  // 회원코드 중복 체크(자기 자신 제외)
  if(code!==s.code && db.students.some(x=>x.code===code && x.id!==s.id)){
    toast('이미 사용 중인 회원코드입니다','err'); return; }
  s.name=name; s.code=code;
  s.school=el('edSchool').value.trim(); s.grade=el('edGrade').value.trim();
  const inClass=el('edClass').value.trim()||'미배정';
  rec.className=inClass;
  rec.classLabel=classLabel(inClass)||inClass;  // 원본 형식이면 깔끔한 라벨로 자동 변환
  rec.teacher=el('edTeacher').value.trim()||'미배정';
  rec.enrollDate=el('edDate').value;
  saveDB(); closeModal(); toast('수정 완료','ok'); render();
}
/* 수동 등록 학생 삭제 — 학기레코드 + 이동이력 제거 (상담이력은 보존) */
function confirmDeleteStudent(recId){
  if(isPastSemester(state.semId)){ lockedPastToast(); return; }
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s = getStudent(rec.studentId);
  openConfirm('학생 삭제',
    `${s.name} (${s.code}) 학생을 이번 학기 명단에서 삭제합니다. 잘못 등록한 학생을 지울 때 사용하세요.`,
    ()=>{
      db.semesterRecords = db.semesterRecords.filter(r=>r.id!==recId);
      db.studentMovements = db.studentMovements.filter(m=>!(m.studentId===rec.studentId && m.semesterId===rec.semesterId && m.branchId===rec.branchId));
      saveDB(); closeModal(); toast('삭제 완료','ok'); render();
    });
}

function wireDropzone(zoneId, inputId, cb){
  const zone = el(zoneId), input = el(inputId);
  if(!zone) return;
  zone.onclick = ()=> input.click();
  input.onchange = ()=>{ if(input.files[0]) cb(input.files[0]); input.value=''; };
  ['dragover','dragenter'].forEach(ev=> zone.addEventListener(ev, e=>{ e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev=> zone.addEventListener(ev, e=>{ e.preventDefault(); zone.classList.remove('drag'); }));
  zone.addEventListener('drop', e=>{ const f=e.dataTransfer.files[0]; if(f) cb(f); });
}

/* ============================================================================
   16. 파일 파싱 & 임포트 (엑셀 .xlsx/.xls + CSV 공용)
   ============================================================================ */

/* CSV 텍스트 → 2차원 배열 (엑셀 없는 .csv 폴백용) */
function parseCSV(text){
  const rows=[]; let row=[], cur='', q=false;
  text = text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){
      if(ch==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; }
      else cur+=ch;
    } else {
      if(ch==='"') q=true;
      else if(ch===','){ row.push(cur); cur=''; }
      else if(ch==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else cur+=ch;
    }
  }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=> r.some(c=> String(c).trim()!==''));
}

/* 파일(엑셀 또는 CSV) → 2차원 배열(문자열). 첫 행이 헤더. */
function readTable(file, cb){
  const name = (file.name||'').toLowerCase();
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
  const r = new FileReader();
  r.onerror = ()=> toast('파일을 읽지 못했습니다','err');
  if(isExcel){
    if(typeof XLSX==='undefined'){ toast('엑셀 모듈 로드 실패 — 인터넷 연결을 확인하세요','err'); return; }
    r.onload = ()=>{
      try{
        // cellDates:true + raw:true → 날짜 셀을 실제 Date로 받음(형식이 '05월 15일'처럼 연도가 없어도 정확)
        const wb = XLSX.read(new Uint8Array(r.result), {type:'array', cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        // 빈 셀도 ''로 채워서 열 위치 보존
        const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:'', raw:true, blankrows:false});
        cb(rows.map(row=> row.map(c=>{
          if(c==null) return '';
          // 날짜 셀은 시간대 오차 없이 UTC 기준 YYYY-MM-DD로 통일
          if(c instanceof Date && !isNaN(c)) return `${c.getUTCFullYear()}-${String(c.getUTCMonth()+1).padStart(2,'0')}-${String(c.getUTCDate()).padStart(2,'0')}`;
          return String(c);
        })));
      }catch(e){ console.error(e); toast('엑셀을 해석하지 못했습니다','err'); }
    };
    r.readAsArrayBuffer(file);
  } else {
    r.onload = ()=> cb(parseCSV(r.result));
    r.readAsText(file,'UTF-8');
  }
}

/* 파일 → 모든 시트의 2차원 배열 배열. 시트가 나눠진 엑셀(예: CHESS/ACE 분리) 지원.
   반환: [[시트1 rows], [시트2 rows], ...]. CSV는 시트 1개로 취급. */
function readTableSheets(file, cb){
  const name = (file.name||'').toLowerCase();
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
  const r = new FileReader();
  r.onerror = ()=> toast('파일을 읽지 못했습니다','err');
  if(isExcel){
    if(typeof XLSX==='undefined'){ toast('엑셀 모듈 로드 실패 — 인터넷 연결을 확인하세요','err'); return; }
    r.onload = ()=>{
      try{
        const wb = XLSX.read(new Uint8Array(r.result), {type:'array', cellDates:true});
        const sheets = wb.SheetNames.map(nm=>{
          const ws = wb.Sheets[nm];
          const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:'', raw:true, blankrows:false});
          return rows.map(row=> row.map(c=>{
            if(c==null) return '';
            if(c instanceof Date && !isNaN(c)) return `${c.getUTCFullYear()}-${String(c.getUTCMonth()+1).padStart(2,'0')}-${String(c.getUTCDate()).padStart(2,'0')}`;
            return String(c);
          }));
        }).filter(s=> s && s.length);
        cb(sheets);
      }catch(e){ console.error(e); toast('엑셀을 해석하지 못했습니다','err'); }
    };
    r.readAsArrayBuffer(file);
  } else {
    r.onload = ()=> cb([parseCSV(r.result)]);
    r.readAsText(file,'UTF-8');
  }
}

/* 반 이름이 실제 수업반인지 (대괄호로 시작하면 수업반).
   "[A2(1-3)]..." 처럼 대괄호 안에 괄호가 있어도 인식. 셔틀비 등 대괄호 없으면 제외 */
function isRealClass(raw){
  return /^\s*\[/.test(String(raw||''));
}
/* 반 종류 판별: 대괄호로 시작 → 정규반(regular), 대괄호 없이 "내신" 포함 → 내신반(exam), 그 외 → null(제외) */
function classKind(raw){
  const s = String(raw||'').trim();
  if(/^\[/.test(s)) return 'regular';
  if(s.includes('내신')) return 'exam';
  return null;
}
/* 반 이름에서 레벨 코드만 추출 (괄호 안 내용은 무시).
   "[PA1]SU3/..." → "PA1",  "[A2(1-3)]SM4/..." → "A2" */
function classLevel(raw){
  const m = String(raw||'').match(/^\s*\[([A-Za-z]+[0-9]*)/);  // 대괄호 직후 영문+숫자 = 레벨
  return m ? m[1] : '';
}
/* 학생의 '학년' 칸에서 표준 학년키 추출 → '초1'~'초6','중1'~'중3' (없으면 '') .
   "초등6","초6","6학년","중등2","중2" 등 다양한 표기 흡수. */
function gradeKey(s){
  const g = String((s&&s.grade)||'').replace(/\s/g,'');
  if(!g) return '';
  // 중등 먼저
  let m = g.match(/중(?:등)?\s*([1-3])/);
  if(m) return '중'+m[1];
  m = g.match(/초(?:등)?\s*([1-6])/);
  if(m) return '초'+m[1];
  // 숫자만 있는 경우는 판단 불가(초/중 모름) → 빈값
  return '';
}
/* 학년키 → 초등/중등 구분 (학년 기준: 초1~5=초등, 초6~중3=중등) */
function gradeBand(key){
  if(/^초[1-5]$/.test(key)) return '초등';
  if(/^초6$/.test(key) || /^중[1-3]$/.test(key)) return '중등';
  return '기타';
}
/* 정렬용 학년 순서 */
function gradeOrder(key){
  const map={'초1':1,'초2':2,'초3':3,'초4':4,'초5':5,'초6':6,'중1':7,'중2':8,'중3':9};
  return map[key]||99;
}
/* 화면 표시용 깔끔한 라벨 생성.
   "[PA1]SU3/MWF/PA1(1)_E6/G" → "월수금 3부 · PA1(1)_E6"
   시간대가 없는 반(체스 등)은 "월수금 · 반이름", 요일도 없으면 반이름만.
   반 구분은 항상 전체 이름(className)으로 하므로 라벨이 겹쳐도 데이터는 안전. */
function classLabel(raw){
  const s = String(raw||'');
  const level = classLevel(s);
  const body = s.replace(/^\[[^\]]*\]/,'');
  const parts = body.split('/').map(x=>x.trim()).filter(Boolean);
  // 반 코어 이름: (구형식) 레벨로 시작하는 조각 우선 → 없으면 (신형식) 레벨(개월수)_학년 조립
  let core = parts.find(p=> level && p.toUpperCase().startsWith(level.toUpperCase()));
  if(!core) core = banLevelLabel(s);   // 신형식: CHESS="DSB1", ACE="PA1(4-6)_E6"
  if(!core) core = level || s;
  // 요일 (MWF=월수금, TTH=화목)
  const dayPart = parts.find(p=> /^(MWF|TTH|TTHS|MTWTF|MW|WF|MWTF)$/i.test(p));
  const dayMap = {MWF:'월수금', TTH:'화목', MW:'월수', WF:'수금', MWTF:'월화수금', MTWTF:'매일'};
  const day = dayPart ? (dayMap[dayPart.toUpperCase()] || dayPart) : '';
  // 시간대 (SU1, SP2 등 학기약자+숫자 → n부). 체스반 등은 없을 수 있음.
  const timePart = parts.find(p=> /^[A-Z]{2}\d+$/i.test(p));
  const time = timePart ? (timePart.match(/\d+$/)[0]+'부') : '';
  // 앞부분: "요일 시간부" (있는 것만). 예: "월수금 3부", "화목", "3부"
  const front = [day, time].filter(Boolean).join(' ');
  // 최종: "월수금 3부 · PA1(1)_E6"
  return [front, core].filter(Boolean).join(' · ');
}
// 반시작일들의 최빈값으로 학기 자동 판별
function detectSemesterFromRows(rows, idx){
  if(idx.startdate<0) return null;
  const tally = {};
  rows.forEach(r=>{
    const raw = String(r[idx.startdate]||'').trim();
    const dm = raw.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    if(!dm) return;
    const d = new Date(parseInt(dm[1],10), parseInt(dm[2],10)-1, parseInt(dm[3],10));
    if(isNaN(d)) return;
    const sem = semesterOfDate(d);
    if(!tally[sem.id]) tally[sem.id] = { sem, count:0 };
    tally[sem.id].count++;
  });
  const arr = Object.values(tally);
  if(!arr.length) return null;
  arr.sort((a,b)=> b.count - a.count);
  return arr[0].sem; // 최빈 학기
}

// 학기가 db.semesters에 없으면 추가 + semRank 정렬. 학기 id 반환.
function ensureSemester(sem){
  if(!db.semesters.some(s=>s.id===sem.id)){
    db.semesters.push({ id:sem.id, name:sem.name });
    db.semesters.sort((a,b)=> semRank(b.id) - semRank(a.id)); // 최신순(내림차순)
  }
  return sem.id;
}
// note에서 전출/전입 대상 분원 id 추출. "장안 전출", "서수원전입" 등. 긴 이름 우선(수원 vs 서수원).
function branchIdFromNote(note){
  if(!note) return null;
  const cands = db.branches
    .map(b=>({ id:b.id, key:b.name.replace(/분원$/,'') }))  // '장안분원'→'장안'
    .sort((a,b)=> b.key.length - a.key.length);              // 긴 것부터
  for(const c of cands){ if(note.includes(c.key)) return c.id; }
  return null;
}
// 학기말 날짜 — 가을=11/30, 겨울=2/말, 봄=5/31, 여름=8/31
function semEndDate(semId){
  const m=String(semId).match(/sem_(\d+)_(\w+)/); if(!m) return today();
  let y=parseInt(m[1],10);
  const endMap={winter:[2,28],spring:[5,31],summer:[8,31],fall:[11,30]};
  const key=m[2]; const [mo,day]=endMap[key]||[12,31];
  if(key==='winter') y+=1; // 겨울은 익년 2월
  const realDay = new Date(y,mo,0).getDate(); // 2월 말일 보정(윤년)
  return `${y}-${String(mo).padStart(2,'0')}-${String(Math.min(day,realDay)).padStart(2,'0')}`;
}
// 전출일 없을 때 쓸 학기 기준일 (해당 학기 첫 달 1일)
function semDefaultDate(semId){
  const m=String(semId).match(/sem_(\d+)_(\w+)/); if(!m) return today();
  const y=parseInt(m[1],10), mo={winter:12,spring:3,summer:6,fall:9}[m[2]]||3;
  return `${y}-${String(mo).padStart(2,'0')}-01`;
}
// AD열 퇴원일 파싱 — Date객체/문자열/엑셀날짜 처리
function parseWithdrawDate(v){
  if(!v) return '';
  if(v instanceof Date && !isNaN(v)) return `${v.getUTCFullYear()}-${String(v.getUTCMonth()+1).padStart(2,'0')}-${String(v.getUTCDate()).padStart(2,'0')}`;
  const s=String(v).trim().replace(/\s+/g,'');
  let dm=s.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);       // YYYY-M-D
  if(dm) return `${dm[1]}-${dm[2].padStart(2,'0')}-${dm[3].padStart(2,'0')}`;
  dm=s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);        // M/D/YY(YY)
  if(dm){ let y=dm[3]; if(y.length===2) y='20'+y; return `${y}-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}`; }
  return '';
}
// "5월말일퇴원"→2026-05-31, "3월중도퇴원"→2026-03-15. 월 못 찾으면 학기기준일.
function withdrawDateFromLabel(label, semId){
  const mm = String(label).match(/(\d{1,2})\s*월/);
  if(!mm) return semDefaultDate(semId);
  const month = parseInt(mm[1],10);
  const sm = String(semId).match(/sem_(\d+)_(\w+)/);
  let year = sm ? parseInt(sm[1],10) : new Date().getFullYear();
  if(sm && sm[2]==='winter' && (month===1||month===2)) year += 1;
  const isMid = /중도/.test(label);
  const day = isMid ? 15 : new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
const ROSTER_HDR = {
  name:['이름','학생명','성명'],
  code:['회원코드','코드','학생코드'],
  school:['학교'],
  grade:['학년'],
  cls:['반 이름','반이름','반명','반','클래스'],
  teacher:['담임선생님','담임명','담임','선생님'],
  note:['특이사항','비고','메모','신규생'],
  startdate:['등록일','등록일자','반 시작일','반시작일','시작일'],
  transferin:['전입여부','전입'],
  transfersrc:['전입출신분원','전입분원','전입전분원','출신분원','이전분원','전입출신'],
  withdraw:['퇴원생','퇴원','퇴원여부'],
  withdrawdate:['퇴원일'],
  withdrawreason:['퇴원사유','사유']
};
function importRoster(file, branchId, semId, opts){
  opts = opts || {};   // opts.forceNew : 신규생 일괄업로드 (모든 행을 '신규'로)
  readTableSheets(file, sheets=>{
    // 시트마다 헤더를 찾아 데이터행을 모음 → CHESS/ACE 분리 시트도 합쳐서 처리
    let headerRow=null, idx=null, sheetsUsed=0; const dataRows=[];
    for(const sh of (sheets||[])){
      let hi=-1, cand=null;
      for(let i=0; i<Math.min(3, sh.length); i++){
        const c = mapHeader(sh[i].map(h=>String(h).trim()), ROSTER_HDR);
        if(c.name>=0 && c.code>=0){ hi=i; cand=c; break; }
      }
      if(hi<0) continue;                 // 명단 헤더 없는 시트는 건너뜀
      sheetsUsed++;
      if(!headerRow){ headerRow=sh[hi]; idx=cand; }  // 첫 유효시트 헤더를 대표로(열 구성 동일)
      for(let i=hi+1; i<sh.length; i++) dataRows.push(sh[i]);
    }
    if(!headerRow){ toast('이름·회원코드 열을 찾지 못했습니다','err'); return; }
    if(!dataRows.length){ toast('데이터가 없습니다','err'); return; }
    const rows = [headerRow, ...dataRows];   // 기존 처리 로직과 호환 (rows[0]=헤더)
    // 확인 팝업 — 파일명 + 예상 인원 미리보기 (고유 회원코드 기준, 셔틀/예시행 제외)
    const seenCodes = new Set();
    dataRows.forEach(r=>{
      const n=String(r[idx.name]||'').trim(), cd=String(r[idx.code]||'').trim();
      if(!n || !cd || /\(예시\)|\(지우세요\)|지우세요|←|예시행/.test(n)) return;
      let cls = idx.cls>=0 ? String(r[idx.cls]||'').trim() : '';
      cls = cls.replace(/^[★☆*※•·∘◦‣▪○●#@♡♥◆■□▶▷◀◁\s]+(?=\[)/,'');
      if(!/^\[/.test(cls)) return;   // 대괄호 [레벨]로 시작하는 재원생만 카운트
      seenCodes.add(cd);
    });
    const cnt = seenCodes.size;
    const label = opts.forceNew ? '신규생 일괄' : '전체명단';
    const sheetNote = sheetsUsed>1 ? `\n(시트 ${sheetsUsed}개를 합쳐서 올립니다)` : '';
    openConfirm(`${label} 업로드 확인`,
      `「${file.name}」\n약 ${cnt}명을 ${label}(으)로 올립니다.${sheetNote}\n\n기존 학생은 최신 반·담임으로 갱신되고, 새 학생은 추가됩니다.\n이대로 진행할까요?`,
      ()=>{ closeModal(); doImportRoster(rows, idx, file, branchId, semId, opts); },
      {yesLabel:'업로드', danger:false});
  });
}
/* 학기 시간순 순위 (전역 학년 갱신 가드용) — 최신 학기일수록 큰 값 */
function semRank(id){
  const m=String(id||'').match(/sem_(\d{4})_(spring|summer|fall|winter)/);
  if(!m) return 0;
  const o={spring:1,summer:2,fall:3,winter:4}[m[2]]||0;
  return parseInt(m[1],10)*10 + o;
}
async function doImportRoster(rows, idx, file, branchId, semId, opts){
    opts = opts || {};
    // ★ 반시작일 최빈값으로 학기 자동 판별 → semId 덮어쓰기 + 학기 자동 생성
    const autoSem = detectSemesterFromRows(rows.slice(1), idx);
    if(autoSem){ semId = ensureSemester(autoSem); }
    let added=0, updated=0, excluded=0, examAdded=0;
    let adoptedTmp=0;   // 레벨테스트 임시코드 → 진짜 회원코드로 붙인 학생 수
    // ★ 업로드 되돌리기용 추적 — 이 업로드가 새로 만든/덮어쓴 것을 기록
    const addedRecIds=new Set(), addedStuIds=new Set(), addedMvIds=[], updBefore=new Map();
    rows.slice(1).forEach(r=>{
      const name=String(r[idx.name]||'').trim();
      const code=String(r[idx.code]||'').trim();
      if(!name||!code) return;
      if(/\(예시\)|\(지우세요\)|지우세요|←|예시행/.test(name)) return;  // 양식 예시/안내행 건너뜀
      let rawClass = idx.cls>=0 ? String(r[idx.cls]||'').trim() : '';
      rawClass = rawClass.replace(/^[★☆*※•·∘◦‣▪○●#@♡♥◆■□▶▷◀◁\s]+(?=\[)/,'');  // 반 이름 앞 별표(★)·샵(#) 등 장식문자 제거 → 정상 [반]으로 인식·병합
      let kind = classKind(rawClass);     // 'regular'(=[레벨] 시작) | 'exam'(내신) | null
      let unassigned = false;
      // ★ 재원생 기준 = 반명이 대괄호 [레벨]로 시작하는 반만.
      //   몰입/·문법/·셔틀·미배정·빈칸 등 대괄호로 시작하지 않는 행은 전부 제외.
      if(!kind){ excluded++; return; }
      const classFull = rawClass;
      const classLbl = kind==='exam' ? rawClass : (unassigned ? '미배정' : classLabel(rawClass));  // 내신반/미배정은 이름 그대로 표시
      const note = idx.note>=0 ? String(r[idx.note]||'').trim() : '';
      // '복귀' 글자 있으면 복귀, 없고 '신규'만 있으면 신규. 둘 다 섞여 있어도 복귀 우선.
      // (복귀생도 신규로 카운트되지만, 특이사항/배지엔 '복귀'로 구분 표시됨)
// 퇴원생 열 — 값 있으면 퇴원/전출. 단 'ACE이관'은 반이동이라 재원 유지(퇴원 아님).
      const wdRawFull = idx.withdraw>=0 ? String(r[idx.withdraw]||'').trim() : '';
      const isAceMove = /ACE이관|이관/.test(wdRawFull);   // 반이동 → 퇴원 아님
      const wdRaw = isAceMove ? '' : wdRawFull;            // 이관은 퇴원처리 제외
      const hasWd = !!wdRaw;
      const isTransferOut = /전출/.test(wdRaw) || /전출/.test(note);
      const tiCol = idx.transferin>=0 ? String(r[idx.transferin]||'').trim() : '';
      // 전입여부 칸: 비어있지 않으면 전입(단, X/N/없음/0 등 '아님' 표기는 제외).
      // 칸에 분원명(예: 서수원)을 적으면 그게 곧 출신분원이 됨.
      const tiIsNo = /^(x|n|없음|없|아니오|아님|no|false|0|-|\.)$/i.test(tiCol);
      const isTransferIn  = /전입/.test(note) || (!!tiCol && !tiIsNo);
      const srcCol = idx.transfersrc>=0 ? String(r[idx.transfersrc]||'').trim() : '';
      const transferBranch = (isTransferOut||isTransferIn)
        ? (branchIdFromNote(tiCol)||branchIdFromNote(srcCol)||branchIdFromNote(wdRaw)||branchIdFromNote(note))
        : null;
     let wdDate = '';
      if(hasWd){
        if(/졸업/.test(wdRaw)){
          wdDate = semEndDate(semId);   // 중3졸업 → 학기말
        } else {
          const rawWdDate = idx.withdrawdate>=0 ? r[idx.withdrawdate] : '';
          wdDate = parseWithdrawDate(rawWdDate) || withdrawDateFromLabel(wdRaw, semId);
        }
      }
      const origin = opts.forceNew ? 'new' : (/복귀/.test(note)?'return' : ((/신규/.test(note)||isTransferIn)?'new' : 'start'));
      const targetType = (origin==='new'||origin==='return')?'HCMC':'MC';
      const teacher = String(r[idx.teacher]||'').trim() || '미배정';
      const school = idx.school>=0 ? String(r[idx.school]||'').trim() : '';
      const grade  = idx.grade>=0 ? String(r[idx.grade]||'').trim() : '';
      let enrollDate = '';
      if(origin==='new' || origin==='return'){
        const rawDate = idx.startdate>=0 ? String(r[idx.startdate]||'').trim() : '';
        const dm = rawDate.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
        if(dm) enrollDate = `${dm[1]}-${dm[2].padStart(2,'0')}-${dm[3].padStart(2,'0')}`;
      }
      if(opts.forceNew && !enrollDate) enrollDate = today();   // 신규생 일괄: 날짜 없으면 오늘
      // 학생 DB upsert (회원코드 기준)
      let stu = db.students.find(s=>s.code===code);
      if(!stu){
        /* 레벨테스트에서 먼저 등록돼 '임시-…' 코드로 들어와 있는 학생인지 본다.
           (예약 시점엔 회원코드가 없어서 임시코드가 붙는다)
           이름이 같은 임시 학생이 딱 한 명일 때만 진짜 회원코드를 붙인다 —
           동명이인이면 손대지 않고 새 학생으로 둔다. */
        let cand = db.students.filter(x=> /^임시-/.test(x.code||'') && x.name===name);
        if(school && cand.length>1){
          const bySchool = cand.filter(x=> (x.school||'')===school);
          if(bySchool.length) cand = bySchool;
        }
        if(cand.length===1){ stu=cand[0]; stu.code=code; if(school) stu.school=school; adoptedTmp++; }
      }
      if(!stu){ stu={id:uid('st'),code,name,school,grade}; db.students.push(stu); addedStuIds.add(stu.id); }
      else {
        stu.name=name; if(school)stu.school=school;
        // 전역 학년은 '최신(또는 동급) 학기' 업로드만 갱신 → 과거 학기 명단을 나중에 올려도 안 덮임.
        if(grade){
          const myRank=semRank(semId);
          const maxRank=Math.max(0,...db.semesterRecords.filter(x=>x.studentId===stu.id).map(x=>semRank(x.semesterId)));
          if(myRank>=maxRank) stu.grade=grade;
        }
      }
      // 학기레코드 upsert — ★ kind까지 일치해야 같은 레코드 (정규/내신 별개 공존)
      let rec = db.semesterRecords.find(x=>x.studentId===stu.id && x.branchId===branchId && x.semesterId===semId && (x.kind||'regular')===kind);
      // 복귀(return)면서 퇴원기록 있고 재입학이 나중이면 = 퇴원 후 재입학. 재원 유지하되 퇴원일 보존(마감표 카운트용).
      const reEnrollAfterWd = (origin==='return') && hasWd && enrollDate && wdDate && (enrollDate > wdDate);
      const willWithdraw = (hasWd || isTransferOut) && !reEnrollAfterWd;
      const finalWdDate = isTransferOut ? (wdDate||enrollDate||semDefaultDate(semId)) : (wdDate||'');
      if(!rec){
        rec={id:uid('rec'),studentId:stu.id,branchId,semesterId:semId,
          className:classFull,classLabel:classLbl,teacher,note,targetType, grade,
          status: willWithdraw?'withdraw':'active', origin, enrollDate, kind,
          transfer: isTransferOut, transferIn: isTransferIn,
          transferTo: transferBranch,
          withdrawDate: willWithdraw ? (finalWdDate||semDefaultDate(semId)) : (reEnrollAfterWd ? finalWdDate : '')};
        db.semesterRecords.push(rec);
        addedRecIds.add(rec.id);
        if(kind==='exam'){ examAdded++; }
        else {
          added++;
          if(origin==='new'){ const mv={id:uid('mv'),studentId:stu.id,branchId,semesterId:semId,type:'new',date:enrollDate||today(),memo:isTransferIn?'명단 업로드(전입)':'명단 업로드'}; db.studentMovements.push(mv); addedMvIds.push(mv.id); }
          if(origin==='return'){ const mv={id:uid('mv'),studentId:stu.id,branchId,semesterId:semId,type:'return',date:enrollDate||today(),memo:'명단 업로드'}; db.studentMovements.push(mv); addedMvIds.push(mv.id); }
        }
      } else {
        // 덮어쓰기 전 원본 스냅샷 1회 저장(되돌리기용). 이번 업로드가 새로 만든 rec은 제외.
        if(!addedRecIds.has(rec.id) && !updBefore.has(rec.id)) updBefore.set(rec.id, JSON.parse(JSON.stringify(rec)));
        rec.className=classFull; rec.classLabel=classLbl; rec.teacher=teacher;
        if(grade) rec.grade=grade;   // ★ 학년은 이 학기 명단값으로 저장(학기별 독립 → 다른 학기 업로드에 안 덮임)
        if(note) rec.note=note; rec.targetType=targetType;
        if(enrollDate) rec.enrollDate=enrollDate;
        rec.transferIn = isTransferIn;
        if(isTransferOut){
          rec.status='withdraw'; rec.transfer=true; rec.transferTo=transferBranch;
          rec.withdrawDate = finalWdDate||rec.withdrawDate||semDefaultDate(semId);
        } else if(hasWd){
          rec.status='withdraw'; rec.transfer=false; rec.transferTo=null;
          rec.withdrawDate = finalWdDate||rec.withdrawDate||semDefaultDate(semId);
        } else if(rec.status==='withdraw' && !rec.transfer){
          rec.status='active'; rec.withdrawDate='';
        }
        updated++;
      }
    });
    // ★ 이 업로드를 '되돌리기' 가능한 묶음으로 기록 (뭔가 바뀐 게 있을 때만)
    if(added+updated+examAdded > 0){
      db.uploadBatches.push({
        id: uid('batch'), branchId, semesterId: semId, kind:'roster',
        fileName: file.name || '전체명단', uploadedAt: nowStamp(),
        added: added+examAdded, dup: updated, skip: excluded,
        payload:{
          addedRecIds:[...addedRecIds],
          addedStuIds:[...addedStuIds],
          addedMvIds,
          updatedRecs:[...updBefore.values()]
        }
      });
    }
    showSaving(`전체명단 저장 중… (잠시만요)`);
    const ok = await saveDB();
    hideSaving();
   if(ok){
      const semName = (db.semesters.find(s=>s.id===semId)||{}).name || semId;
      state.semId = semId; // 판별된 학기로 자동 전환
      state.addSemesterMode = false; // 배너 해제
      toast(`✅ ${semName}에 저장 · 정규 신규 ${added}, 갱신 ${updated}${examAdded?`, 내신반 ${examAdded}`:''}${excluded?`, 제외 ${excluded}`:''}${adoptedTmp?`, 회원코드 연결 ${adoptedTmp}`:''}`,'ok');
    } else {
      toast('❌ 저장 실패 — 다시 업로드해 주세요','err');
    }
    buildShell();
    render();
}

/* ── 퇴원생 엑셀 일괄 업로드 ─────────────────────────────────────────────
   열: 이름 / 회원코드(권장) / 퇴원일 / 퇴원사유 / 메모 / 전출분원
   - 회원코드가 있으면 그것으로, 없으면 이름으로 이 분원·학기 명단에서 매칭
   - 이미 퇴원 상태면 건너뜀, 동명이인(코드 없음)은 안전하게 건너뜀
   - 단건 '퇴원 처리'와 동일하게 studentMovements 이력도 남김 (되돌리기·통계 보존) */
function importWithdrawals(file, branchId, semId){
  readTable(file, async rows=>{
    if(rows.length<2){ toast('데이터가 없습니다','err'); return; }
    const HDR = {
      name:['이름','학생명','성명'],
      code:['회원코드','코드','학생코드'],
      date:['퇴원일','날짜'],
      reason:['퇴원사유','사유'],
      memo:['메모','비고','상세'],
      transfer:['전출분원','전출','전출대상']
    };
    let idx=null;
    for(let i=0;i<Math.min(3,rows.length-1);i++){
      const cand = mapHeader(rows[i].map(h=>String(h).trim()), HDR);
      if(cand.name>=0 || cand.code>=0){ idx=cand; rows=rows.slice(i); break; }
    }
    if(!idx){ toast('이름 또는 회원코드 열을 찾지 못했습니다','err'); return; }

    const recs = recordsOf(branchId, semId);
    let done=0, updated=0, notfound=0, ambiguous=0;
    const notFoundList=[], ambiguousList=[];

    rows.slice(1).forEach(r=>{
      const name = idx.name>=0 ? String(r[idx.name]||'').trim() : '';
      const code = idx.code>=0 ? String(r[idx.code]||'').trim() : '';
      if(!name && !code) return;

      // 매칭: 회원코드 우선(정확), 없으면 이름
      let cands = code
        ? recs.filter(x=>{ const s=getStudent(x.studentId); return s && (s.code||'')===code; })
        : recs.filter(x=>{ const s=getStudent(x.studentId); return s && s.name===name; });
      // 같은 학생의 정규/내신 레코드가 함께 잡히면 정규·재원 우선
      if(cands.length>1){
        const pref = cands.filter(x=> x.status==='active' && (x.kind||'regular')==='regular');
        if(pref.length) cands = pref;
      }
      if(cands.length===0){ notfound++; notFoundList.push(name||code); return; }
      if(cands.length>1){ ambiguous++; ambiguousList.push(name||code); return; } // 동명이인 → 코드 필요
      const rec = cands[0];
      const wasWithdraw = (rec.status==='withdraw');   // 이미 퇴원 → 날짜·사유만 갱신(재업로드 정정)

      // 사유: 라벨('개인 사유')·코드('personal') 모두 허용, 없으면 개인 사유
      const reasonRaw = idx.reason>=0 ? String(r[idx.reason]||'').trim() : '';
      const rf = WITHDRAW_REASONS.find(w=> w.code===reasonRaw || w.label===reasonRaw);
      const reasonCode = rf ? rf.code : (reasonRaw ? 'other' : 'personal');
      // 전출분원 값이 있으면 전출로 처리
      const transRaw = idx.transfer>=0 ? String(r[idx.transfer]||'').trim() : '';
      const toBranch = transRaw ? branchIdFromNote(transRaw) : null;
      const isTransfer = !!toBranch;
      const wdDate = parseWithdrawDate(idx.date>=0 ? r[idx.date] : '') || today();
      const memo = idx.memo>=0 ? String(r[idx.memo]||'').trim() : '';

      rec.status='withdraw';
      rec.withdrawDate=wdDate;
      rec.transfer=isTransfer;
      rec.transferTo=toBranch||null;
      rec.withdrawReason = isTransfer ? null : reasonCode;
      rec.withdrawMemo = memo;
      const toName = toBranch ? (getBranch(toBranch)?.name||'') : '';
      const mvMemo = (isTransfer?`[전출→${toName}] `:`[${wdReasonLabel(reasonCode)}] `)+(memo||'퇴원 처리');
      // 이미 있던 퇴원 이력이면 새로 쌓지 말고 날짜·메모만 갱신(정정), 없으면 새로 추가
      const mvOld = db.studentMovements.find(m=> m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId && m.type==='withdraw');
      if(mvOld){ mvOld.date=wdDate; mvOld.memo=mvMemo; }
      else db.studentMovements.push({id:uid('mv'),studentId:rec.studentId,branchId:rec.branchId,semesterId:rec.semesterId,type:'withdraw',date:wdDate,memo:mvMemo});
      if(wasWithdraw) updated++; else done++;
    });

    showSaving('퇴원 일괄 처리 저장 중… (잠시만요)');
    const ok = await saveDB();
    hideSaving();
    if(ok){
      let msg = `✅ 퇴원 처리 ${done}명`;
      if(updated) msg += ` · 날짜·사유 갱신 ${updated}`;
      if(notfound) msg += ` · 못찾음 ${notfound}`;
      if(ambiguous) msg += ` · 동명이인 ${ambiguous}(회원코드 필요)`;
      toast(msg,'ok');
      if(notFoundList.length) console.warn('[퇴원 일괄] 명단에서 못 찾음:', notFoundList.join(', '));
      if(ambiguousList.length) console.warn('[퇴원 일괄] 동명이인 — 회원코드로 다시 올려주세요:', ambiguousList.join(', '));
    } else {
      toast('❌ 저장 실패 — 다시 시도해 주세요','err');
    }
    render();
  });
}

/* 퇴원생 일괄 업로드용 엑셀 양식 다운로드
   (퇴원사유·전출분원 드롭다운이 들어간 정적 파일을 내려줌 — SheetJS 무료판은 드롭다운 생성 불가) */
function downloadWithdrawTemplate(){
  fetch('withdraw_template.xlsx')
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.blob(); })
    .then(blob=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '퇴원생_일괄업로드_양식.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 1500);
      toast('양식을 다운로드했습니다','ok');
    })
    .catch(err=>{ console.error(err); toast('양식 파일을 찾지 못했습니다','err'); });
}

/* 신규생 일괄 업로드용 엑셀 양식 — 즉석 생성(XLSX). 열: 학생명·회원코드·학교·학년·반이름·담임·등록일·전입여부
   전입여부: 전입생이면 O(또는 전입/Y), 아니면 비움 */
function downloadNewTemplate(){
  try{
    const headers = ['학생명','회원코드','학교','학년','반 이름','담임선생님','반시작일','전입여부'];
    const example = ['홍길동(예시)','','정상중','중2','[DSA1] 김선생반','김선생', today(), ''];
    const guide   = ['← 예시행: 실제 입력 시 지우세요','회원코드 있으면 정확','','','반 이름 그대로','','비우면 오늘 날짜','전입생만 · 온 분원명(예:서수원)'];
    const ws = XLSX.utils.aoa_to_sheet([headers, example, guide]);
    ws['!cols'] = [{wch:16},{wch:14},{wch:10},{wch:8},{wch:22},{wch:14},{wch:12},{wch:20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '신규생');
    XLSX.writeFile(wb, '신규생_일괄업로드_양식.xlsx');
    toast('양식을 다운로드했습니다','ok');
  }catch(e){ console.error(e); toast('양식 생성 실패 — 새로고침 후 다시 시도','err'); }
}

function importHistory(file, branchId, semId){
  readTable(file, async rows=>{
    if(rows.length<2){ toast('데이터가 없습니다','err'); return; }
    const HDR_MAP = {
      code:['회원코드','코드'],
      name:['이름','학생명'],
      category:['분류','구분'],
      content:['내용','상담내용','상담'],
      date:['날짜','상담일','일자'],
      status:['상태'],
      counselor:['상담자','담임','작성자']
    };
    // 병합 제목행("상담이력")·빈 행을 건너뛰고 진짜 헤더행 찾기 — 최대 6행까지 탐색.
    // 진짜 헤더 = '내용' 열 + (회원코드/이름/날짜 중 하나) 이상. 제목행은 셀 하나("상담이력")뿐이라 자동 배제됨.
    let headRow = -1, idx = null;
    for(let i=0; i<Math.min(6, rows.length-1); i++){
      const cand = mapHeader(rows[i].map(h=>String(h).trim()), HDR_MAP);
      if(cand.content>=0 && (cand.code>=0 || cand.name>=0 || cand.date>=0)){ headRow = i; idx = cand; break; }
    }
    if(headRow<0){ toast('내용 열을 찾지 못했습니다','err'); return; }
    rows = rows.slice(headRow);
    // 이번 업로드를 하나의 배치로 기록
    const batchId = uid('batch');
    let added=0, dup=0, skip=0, notCounsel=0, prevSem=0, misTagCnt=0, noStu=0, noTag=0;
    rows.slice(1).forEach(r=>{
      // 분류가 '상담'인 건만 반영 (수납/기타/성적 등 제외)
      if(idx.category>=0){
        const cat=String(r[idx.category]||'').trim();
        if(cat && cat!=='상담'){ notCounsel++; return; }
      }
      const code=String(r[idx.code]||'').trim();
      const content=String(r[idx.content]||'').replace(/\\n/g,'\n').trim();
      const date=normDate(String(r[idx.date]||'').trim());
      if(!content){ return; }
      // 학생 매칭 — 회원코드/이름으로 후보를 모으되,
      // '이 분원·이 학기에 실제 재원레코드가 있는 학생'을 우선 연결한다.
      // (같은 학생이 중복 레코드로 여러 id를 갖고 있어도 상담이 엉뚱한 id로 붙지 않게)
      const nm = String(r[idx.name]||'').trim();
      let cands = db.students.filter(s=> code && s.code===code);
      if(cands.length===0 && nm) cands = db.students.filter(s=> s.name===nm);
      const stu = cands.find(s=> db.semesterRecords.some(x=>
                    x.studentId===s.id && x.branchId===branchId && x.semesterId===semId))
                || cands.find(s=> db.semesterRecords.some(x=>x.studentId===s.id && x.branchId===branchId))
                || cands[0];
      if(!stu){ skip++; noStu++; return; }
      // 태그로 단계 판정 — 대괄호 안의 모든 단계를 추출.
      // [MC2] 단일은 물론 [HC2+MC2], [HC2/MC2], [HC2,MC2], [HC2 MC2] 같은 복합표기도 각각 인정.
      const tags = [];
      const bracketRe = /\[([^\]]+)\]/g;   // 대괄호 안 내용 통째로
      let bm;
      while((bm = bracketRe.exec(content)) !== null){
        const inner = bm[1].toUpperCase();
        (inner.match(/HC1|HC2|MC1|MC2|MC3/g) || []).forEach(t=> tags.push(t));
      }
      const uniqTags = [...new Set(tags)];
      if(uniqTags.length===0){ skip++; noTag++; return; } // 단계 태그 없는 상담은 완료율과 무관 → 미반영
      uniqTags.forEach(type=>{
        // ★ 회차-월 판정: 이전학기 상담이면 현재 학기 집계에서 제외
        const recForStu = db.semesterRecords.find(x=>x.studentId===stu.id && x.branchId===branchId && x.semesterId===semId);
        const timing = stageTimingCheck(type, date, semId, recForStu && recForStu.enrollDate);
        if(timing==='prev'){ prevSem++; return; }  // 이전 학기 상담 → 현재 학기에 미반영
        const isMistag = (timing==='mistag');      // 오기재 의심 → 저장하되 완료 집계 제외

        // 같은 학생·같은 학기·같은 단계의 기존 상담을 찾음
        const prev = db.counselingHistories.find(c=>
          c.studentId===stu.id && c.branchId===branchId &&
          c.semesterId===semId && c.type===type);
        if(prev){
          // 내용·날짜가 같아도 완료판정(mistag)이 달라졌으면 갱신해서 표시를 교정한다.
          // (예전에 오기재로 잘못 저장된 ⚠/✕를 같은 파일 재업로드로 바로잡을 수 있게)
          const sameText   = (prev.content===content && prev.date===date);
          const sameVerdict = (!!prev.mistag === isMistag);
          if(sameText && sameVerdict){ dup++; return; } // 진짜 변화 없음(중복)
          // 내용이 바뀌었거나 완료판정이 바뀌었으면 최신 상태로 교체(갱신)
          prev.content = content;
          prev.date = date;
          prev.counselor = String(r[idx.counselor]||'').trim();
          prev.batchId = batchId;
          prev.mistag = isMistag;
          if(isMistag) misTagCnt++;
          added++;  // 갱신도 반영 건수로 카운트
          return;
        }
        // 기존에 없던 단계면 새로 추가
        db.counselingHistories.push({id:uid('ch'),studentId:stu.id,branchId,semesterId:semId,
          date,type,content,counselor:String(r[idx.counselor]||'').trim(), batchId, mistag:isMistag});
        if(isMistag) misTagCnt++;
        added++;
      });
    });
    // 실제로 추가된 게 있을 때만 배치 기록 (전부 중복이면 묶음 안 남김)
    if(added>0){
      db.uploadBatches.push({
        id:batchId, branchId, semesterId:semId, kind:'history',
        fileName:file.name||'상담이력', uploadedAt:nowStamp(),
        added, dup, skip
      });
    }
    showSaving(`상담이력 저장 중… (${added}건, 잠시만요)`);
    const ok = await saveDB();
    hideSaving();
    let extra = '';
    if(prevSem>0) extra += `, 이전학기 제외 ${prevSem}`;
    if(misTagCnt>0) extra += `, 오기재 의심 ${misTagCnt}`;
    if(noTag>0) extra += `, 단계태그없음 ${noTag}`;
    if(notCounsel>0) extra += `, 상담아님 ${notCounsel}`;
    if(ok){
      // '미매칭'은 명단에 없는 학생만 카운트(noStu). 태그없음은 별도 표기.
      toast(`✅ 저장 완료 · 추가 ${added}, 중복 ${dup}, 미매칭 ${noStu}${extra}`,'ok');
    } else {
      toast('❌ 저장 실패 — 다시 업로드해 주세요 (서버에 저장되지 않았습니다)','err');
    }
    render();
  });
}

/* "YYYY-MM-DD HH:MM" 형태의 업로드 시각 */
function nowStamp(){
  const d=new Date(), p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function mapHeader(header, spec){
  const idx={};
  for(const key in spec){
    idx[key] = header.findIndex(h=> spec[key].some(a=> h===a || h.includes(a)));
  }
  return idx;
}
function today(){ const d=new Date(); return d.toISOString().slice(0,10); }
/* "2026.05.31 21:45", "2026-5-3", "2026/12/03" 등 → "YYYY-MM-DD" */
function normDate(s){
  if(!s) return today();
  s=String(s).replace(/[./]/g,'-');
  const m=s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  return s.trim();
}

/* ----- 신규/퇴원 수동 ----- */
function addNewStudent(){
  const branchId=session.branchId, semId=state.semId;
  const name=el('nsName').value.trim(), code=el('nsCode').value.trim();
  if(!name||!code){ toast('학생명과 회원코드는 필수입니다','err'); return; }
  const enrollDate=el('nsDate').value;  // "2026-07-15" (캘린더 선택값)
  if(!enrollDate){ toast('입학일을 선택하세요','err'); return; }
  // ★ 다음학기 신규생 방지: 입학일이 지금 보고 있는 학기가 아니면 등록 막기
  {
    const p=enrollDate.split('-').map(n=>parseInt(n,10));
    const enrollSem = semesterOfDate(new Date(p[0], (p[1]||1)-1, p[2]||1));
    if(enrollSem && enrollSem.id !== semId){
      const curName=(db.semesters.find(s=>s.id===semId)||{}).name||semId;
      const exists=db.semesters.some(s=>s.id===enrollSem.id);
      openConfirm('학기가 다릅니다',
        `이 학생의 입학일(${enrollDate})은 "${enrollSem.name}" 신규생입니다.\n지금은 "${curName}" 창이에요.\n\n"${enrollSem.name}" 학기로 바꿔서 등록해 주세요.`
        + (exists ? ' (좌측 상단 학기 선택에서 전환)' : `\n\n※ "${enrollSem.name}"가 아직 없으면 학기 선택의 "＋ 다음 학기 추가"로 먼저 만든 뒤 등록하세요.`),
        ()=>closeModal(), {yesLabel:'확인', danger:false});
      return;
    }
  }
  if(db.semesterRecords.some(r=>{const s=getStudent(r.studentId);return s&&s.code===code&&r.branchId===branchId&&r.semesterId===semId;})){
    toast('이미 등록된 회원코드입니다','err'); return; }

  // 반 결정: 드롭다운에서 기존 반 선택 or 새 반 직접 입력
  const csel = el('nsClassSelect');
  const pick = csel ? csel.value : '';
  let className, classLbl, teacher;
  if(pick && pick!=='__new__'){
    // 기존 반 선택 → 그 반의 정확한 className/라벨/담임 사용
    const ref = activeRecordsOf(branchId, semId).find(r=>r.className===pick);
    className = pick;
    classLbl = (ref && ref.classLabel) || classLabel(pick) || pick;
    teacher = (ref && ref.teacher) || '미배정';
  } else if(pick==='__new__'){
    const inClass = el('nsClass').value.trim();
    if(!inClass){ toast('새 반명을 입력하세요','err'); return; }
    className = inClass;
    classLbl = classLabel(inClass) || inClass;
    teacher = el('nsTeacher').value.trim() || '미배정';
  } else {
    // 반 미선택 → '미배정'으로 등록. 나중에 전체명단 업로드 시 실제 반으로 자동 덮어씀.
    className='미배정'; classLbl='미배정'; teacher='미배정';
  }

  let stu=db.students.find(s=>s.code===code);
  if(!stu){ stu={id:uid('st'),code,name,school:el('nsSchool').value.trim(),grade:el('nsGrade').value.trim()};
    db.students.push(stu); }
const isTransferIn = el('nsTransferIn') ? el('nsTransferIn').checked : false;
  const fromBranchId = isTransferIn && el('nsTransferFrom') ? el('nsTransferFrom').value : '';
  const fromBranchName = fromBranchId ? (getBranch(fromBranchId)?.name||'') : '';
  db.semesterRecords.push({id:uid('rec'),studentId:stu.id,branchId,semesterId:semId,
    className,classLabel:classLbl,teacher,
    note:isTransferIn?'전입':'신규생',targetType:'HCMC',status:'active',origin:'new',transferIn:isTransferIn,transferTo:fromBranchId||null,enrollDate});
  const nsMemo = (el('nsMemo')?el('nsMemo').value.trim():'')
    || (isTransferIn?(fromBranchName?`${fromBranchName}에서 전입`:'전입 (수동 등록)'):'수동 등록');
  db.studentMovements.push({id:uid('mv'),studentId:stu.id,branchId,semesterId:semId,type:'new',date:enrollDate,memo:nsMemo});
// 등록한 학생 정보를 문자 카드에 복원하기 위해 저장 (리렌더 후에도 문자 유지)
  msgState.locked = readNsForm();
  saveDB(); toast(`${name} ${isTransferIn?'전입':'신규생'} 등록 완료 — 오른쪽에서 안내 문자를 복사하세요`,'ok'); render();
}

/* 퇴원 처리 — 이름/코드 검색 결과 렌더 (동명이인 구분 위해 코드·반·담임 표시) */
function renderWdResults(){
  const branchId=session.branchId, semId=state.semId;
  const q = (el('wdSearch').value||'').trim().toLowerCase();
  const box = el('wdResults');
  if(!q){ box.innerHTML=''; return; }
  const matches = activeRecordsOf(branchId, semId).filter(r=>{
    const s=getStudent(r.studentId); if(!s) return false;
    return s.name.toLowerCase().includes(q) || (s.code||'').toLowerCase().includes(q);
  }).sort((a,b)=>{
    const sa=getStudent(a.studentId), sb=getStudent(b.studentId);
    return (sa?sa.name:'').localeCompare(sb?sb.name:'','ko');
  });
  if(matches.length===0){
    box.innerHTML = `<div class="wd-empty">검색 결과가 없습니다</div>`; return;
  }
  box.innerHTML = matches.slice(0,30).map(r=>{
    const s=getStudent(r.studentId);
    return `<div class="wd-item" onclick="pickWdStudent('${r.id}')">
      <div class="wd-main">
        <span class="wd-name">${esc(s.name)}</span>
        <span class="code-chip">${esc(s.code)}</span>
      </div>
      <div class="wd-meta">${esc(r.classLabel||r.className)} · ${esc(r.teacher)} 담임 · ${esc(s.school||'')} ${esc(s.grade||'')}${s.grade?'학년':''}</div>
    </div>`;
  }).join('');
}
/* 검색 결과에서 학생 선택 → 확정 표시 */
function pickWdStudent(recId){
  const rec=db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s=getStudent(rec.studentId);
  el('wdSelect').value = recId;
  el('wdResults').innerHTML = '';
  el('wdSearch').value = s.name;
  const picked = el('wdPicked');
  picked.style.display='block';
  picked.innerHTML = `<div class="wd-picked-card">
    <div>
      <div class="wd-picked-name">선택됨: <b>${esc(s.name)}</b> <span class="code-chip">${esc(s.code)}</span></div>
      <div class="wd-meta">${esc(rec.classLabel||rec.className)} · ${esc(rec.teacher)} 담임</div>
    </div>
    <button class="btn sm" onclick="clearWdPick()">취소</button>
  </div>`;
}
function clearWdPick(){
  el('wdSelect').value='';
  el('wdPicked').style.display='none';
  el('wdPicked').innerHTML='';
  el('wdSearch').value='';
  el('wdResults').innerHTML='';
}
function toggleWdReason(){
  const isTransfer = el('wdTransfer') ? el('wdTransfer').checked : false;
  const f = el('wdReasonField');
  if(f) f.style.display = isTransfer ? 'none' : '';
}
function withdrawStudent(){
  const recId=el('wdSelect').value;
  if(!recId){ toast('학생을 검색해서 선택하세요','err'); return; }
  const rec=db.semesterRecords.find(r=>r.id===recId);
  if(!rec){ toast('학생을 다시 선택하세요','err'); return; }
  const wdDate = el('wdDate').value || today();
  const isTransfer = el('wdTransfer') ? el('wdTransfer').checked : false;
  const toBranchId = isTransfer && el('wdTransferTo') ? el('wdTransferTo').value : '';
  if(isTransfer && !toBranchId){ toast('전출 대상 분원을 선택하세요','err'); return; }

  const reason = (!isTransfer && el('wdReason')) ? el('wdReason').value : '';
  if(!isTransfer && !reason){ toast('퇴원 사유를 선택하세요','err'); return; }

  const toBranchName = toBranchId ? (getBranch(toBranchId)?.name||'') : '';
  rec.status='withdraw';
  rec.withdrawDate=wdDate;
  rec.transfer=isTransfer;
  rec.transferTo=toBranchId||null;
rec.withdrawReason = isTransfer ? null : reason;

  const memo = el('wdMemo').value.trim();
  rec.withdrawMemo = memo;
  const stu=getStudent(rec.studentId);
  db.studentMovements.push({id:uid('mv'),studentId:rec.studentId,branchId:rec.branchId,semesterId:rec.semesterId,
    type:'withdraw',date:wdDate,
    memo:(isTransfer?`[전출→${toBranchName}] `:`[${wdReasonLabel(reason)}] `)+(memo||'퇴원 처리')});
  saveDB(); toast(`${stu.name} ${isTransfer?`${toBranchName}로 전출`:'퇴원'} 처리 완료`,'ok'); render();
}

/* 퇴원·전출 학생 검색 (상태 변경용) */
function renderWcResults(){
  const branchId=session.branchId, semId=state.semId;
  const q = (el('wcSearch').value||'').trim().toLowerCase();
  const box = el('wcResults');
  if(!q){ box.innerHTML=''; return; }
  const matches = recordsOf(branchId, semId).filter(r=>{
    if(r.status!=='withdraw') return false;  // 퇴원·전출 학생만
    const s=getStudent(r.studentId); if(!s) return false;
    return s.name.toLowerCase().includes(q) || (s.code||'').toLowerCase().includes(q);
  }).sort((a,b)=>{
    const sa=getStudent(a.studentId), sb=getStudent(b.studentId);
    return (sa?sa.name:'').localeCompare(sb?sb.name:'','ko');
  });
  if(matches.length===0){ box.innerHTML=`<div class="wd-empty">퇴원·전출 학생 중 검색 결과가 없습니다</div>`; return; }
  box.innerHTML = matches.slice(0,30).map(r=>{
    const s=getStudent(r.studentId);
    const badge = r.transfer
      ? '<span class="status-badge" style="background:var(--warn-soft);color:var(--warn)">전출</span>'
      : '<span class="status-badge withdraw">퇴원</span>';
    return `<div class="wd-item" style="cursor:default">
      <div class="wd-main"><span class="wd-name">${esc(s.name)}</span><span class="code-chip">${esc(s.code)}</span> ${badge}</div>
      <div class="wd-meta">${esc(r.classLabel||r.className)} · ${esc(r.teacher)} 담임 · ${esc(r.withdrawDate||'')}</div>
<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        ${r.transfer
          ? `<button class="btn sm" style="border-color:var(--neg-soft);color:var(--neg)" onclick="convertWithdrawType('${r.id}',false)">→ 일반 퇴원으로</button>`
          : `<button class="btn sm" style="border-color:var(--warn-soft);color:var(--warn)" onclick="convertWithdrawType('${r.id}',true)">→ 전출로</button>`}
        <button class="btn sm" onclick="openEditWithdrawReason('${r.id}')">사유 수정</button>
        <button class="btn sm" style="border-color:var(--pos-soft);color:var(--pos)" onclick="restoreStudent('${r.id}')">재원 복귀</button>
        <button class="btn sm" style="border-color:var(--warn-soft);color:var(--warn)" onclick="reEnrollStudent('${r.id}')">재입회(복귀)</button>
      </div>
    </div>`;
  }).join('');
}
/* 전출 ↔ 일반 퇴원 전환. 전출로 바꿀 땐 목적지 분원을 골라야 함(본사 매칭용). */
function convertWithdrawType(recId, toTransfer){
  const rec=db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s=getStudent(rec.studentId);

  // 일반 퇴원으로 되돌리는 건 분원 선택 불필요 — 바로 확인
  if(!toTransfer){
    openConfirm('퇴원 종류 변경',
      `${s.name} (${s.code})을 일반 퇴원으로 변경합니다.\n\n일반 퇴원은 퇴원율에 반영됩니다.`,
      ()=>{
        rec.transfer = false;
        rec.transferTo = null;
        const mv = db.studentMovements.find(m=>m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId && m.type==='withdraw');
        if(mv){ mv.memo = (mv.memo||'').replace(/^\[전출[^\]]*\]\s*/,'') || '퇴원 처리'; }
        showSaving('변경 중…');
        saveDB().then(ok=>{ hideSaving(); closeModal();
          toast(ok?`${s.name} 일반 퇴원으로 변경됨`:'저장 실패','ok'); render(); });
      }, {yesLabel:'변경', danger:false});
    return;
  }

  // 전출로 바꿀 땐 목적지 분원 드롭다운이 든 모달
  const branchId = rec.branchId;
  openModal(`
    <div class="modal-head"><div><h3>전출로 변경</h3>
      <div class="mh-sub">${esc(s.name)} (${esc(s.code)})</div></div>
      <button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--ink-2);line-height:1.6;margin-bottom:12px">전출은 퇴원율 계산에서 제외됩니다. 어느 분원으로 가는지 선택하면 본사에서 전입과 대조할 수 있습니다.</p>
      <div class="field full"><label>전출 대상 분원</label>
        <select id="ctTransferTo">
          <option value="">전출 분원 선택…</option>
          ${db.branches.filter(x=>x.id!==branchId).map(x=>`<option value="${x.id}" ${rec.transferTo===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">취소</button>
      <button class="btn primary" id="ctSave">전출로 변경</button>
    </div>`);
  el('ctSave').onclick = ()=>{
    const toBranchId = el('ctTransferTo').value;
    if(!toBranchId){ toast('전출 대상 분원을 선택하세요','err'); return; }
    const toBranchName = getBranch(toBranchId)?.name||'';
    rec.transfer = true;
    rec.transferTo = toBranchId;
    const mv = db.studentMovements.find(m=>m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId && m.type==='withdraw');
    if(mv){ mv.memo = `[전출→${toBranchName}] ` + (mv.memo||'').replace(/^\[전출[^\]]*\]\s*/,''); }
    showSaving('변경 중…');
    saveDB().then(ok=>{ hideSaving(); closeModal();
      toast(ok?`${s.name} ${toBranchName}로 전출 변경됨`:'저장 실패','ok'); render(); });
  };
}
/* 재원 복귀 — 잘못 퇴원시킨 학생 되돌리기 */
function restoreStudent(recId){
  const rec=db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s=getStudent(rec.studentId);
  openConfirm('재원 복귀',
    `${s.name} (${s.code})을 다시 재원 상태로 되돌립니다.\n\n퇴원·전출 기록이 취소되고 현재 재원생에 다시 포함됩니다.`,
    ()=>{
      rec.status = 'active';
      rec.withdrawDate = null;
      rec.transfer = false;
      // 퇴원 이동이력 제거
      db.studentMovements = db.studentMovements.filter(m=>!(m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId && m.type==='withdraw'));
      showSaving('복귀 중…');
      saveDB().then(ok=>{ hideSaving(); closeModal();
        toast(ok?`${s.name} 재원 복귀 완료`:'저장 실패','ok'); render(); });
    }, {yesLabel:'재원 복귀', danger:false});
}
/* 재입회(복귀) — 실제 퇴원했다가 다시 등록. 퇴원 기록은 남기고 복귀로 표시(마감표에 퇴원·복귀 둘 다 잡힘) */
function reEnrollStudent(recId){
  const rec=db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s=getStudent(rec.studentId);
  const wd = rec.withdrawDate || '(기록 없음)';
  openPrompt('재입회(복귀) 처리',
    `${s.name} (${s.code})\n${wd} 퇴원 기록은 그대로 남기고, 복귀(재입회)로 처리합니다.`,
    '',
    (val)=>{
      const m=String(val||'').match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
      if(!m){ toast('복귀 날짜를 선택하세요','err'); return; }
      const enrollDate=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
      if(rec.withdrawDate && enrollDate <= rec.withdrawDate){ toast('복귀일은 퇴원일보다 뒤여야 합니다','err'); return; }
      rec.status='active';           // 현재 재원생으로
      rec.origin='return';           // 복귀 배지 + 마감표 복귀(신규성) 카운트
      rec.transfer=false; rec.transferIn=false;
      rec.enrollDate=enrollDate;     // 복귀일 (마감표 복귀 월 배치)
      // rec.withdrawDate 는 그대로 보존 → 퇴원도 마감표에 계속 잡힘
      rec.targetType='HCMC';
      // 복귀 이동이력 추가(기존 퇴원 이력은 유지)
      db.studentMovements.push({id:uid('mv'),studentId:rec.studentId,branchId:rec.branchId,semesterId:rec.semesterId,type:'return',date:enrollDate,memo:'재입회(복귀) 처리'});
      showSaving('재입회 처리 중…');
      saveDB().then(ok=>{ hideSaving(); closeModal();
        toast(ok?`${s.name} 재입회(복귀) 처리 완료`:'저장 실패','ok'); render(); });
    },
    { inputType:'date', label:'복귀(재입회) 날짜', hint:'실제로 다시 등원한 날짜를 선택하세요. 퇴원일보다 뒤여야 합니다.', okLabel:'복귀 처리' });
}
/* 전입 → 일반 신규 전환 — '전입' 표시를 취소하고 순수 신규로. 출발분원 정보 제거, 집계도 전입→신규로 이동 */
/* 신규생 입학 취소 —
   이 학기 등록 기록을 지우고, 레벨테스트 예약이 있으면 '미등록'으로 처리한다.
   (대기자가 0명이면 대기명단 화면이 아예 안 떠서 취소할 데가 없어 여기에 둔다) */
function cancelEnroll(recId){
  const rec=db.semesterRecords.find(r=>r.id===recId); if(!rec) return;
  const s=getStudent(rec.studentId)||{};
  const semNm=(db.semesters.find(x=>x.id===rec.semesterId)||{}).name || rec.semesterId;
  const cls=rec.classLabel||rec.className||'미배정';
  openModal(`
    <div class="modal-head"><div><h3>입학 취소</h3></div>
      <button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="font-size:14.5px;font-weight:800;color:var(--ink)">${esc(s.name||'')} <span style="font-size:12px;font-weight:600;color:var(--ink-3)">${esc(s.code||'')}</span></div>
      <div style="font-size:12.5px;color:var(--ink-3);margin-top:2px">${esc(semNm)} · ${esc(cls)}</div>
      <div style="margin-top:14px;background:#FDECF1;border-left:3px solid #C0504D;border-radius:0 10px 10px 0;padding:12px 14px;font-size:13px;color:#8D3550;line-height:1.75">
        <b>수업을 한 번도 듣지 않고 취소한 학생만</b> 이 버튼을 쓰세요.<br>
        <b>하루라도 수업을 들었다면</b> 여기가 아니라 <b>학생관리 → 퇴원 처리</b>로 진행해야 합니다.<br>
        여기서 취소하면 등록 기록 자체가 지워져서 <b>퇴원 통계에 안 잡힙니다.</b>
      </div>
      <div style="margin-top:12px;font-size:12.5px;color:var(--ink-2);line-height:1.9">
        · <b>${esc(cls)}</b> 반에서 빠지고 신규생 명단에서 사라집니다.<br>
        · 레벨테스트 예약이 있으면 <b>미등록</b>(사유: 입학 취소)으로 바뀝니다.
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">닫기</button>
      <button class="btn" id="cancelEnrollYes" style="background:var(--neg);color:#fff;border-color:var(--neg)">입학 취소</button>
    </div>`);
  el('cancelEnrollYes').onclick = ()=>{
    const brId=rec.branchId, semId=rec.semesterId;
    db.semesterRecords = db.semesterRecords.filter(x=>x.id!==recId);
    db.studentMovements = db.studentMovements.filter(m=>
      !(m.studentId===rec.studentId && m.branchId===brId && m.semesterId===semId && m.type==='new'));
    showSaving('입학 취소 중…');
    saveDB().then(async ok=>{
      if(ok) await ltMarkNotEnrolled(brId, semId, s);
      hideSaving(); closeModal();
      toast(ok?`${s.name||''} 입학 취소 완료`:'저장 실패', ok?'ok':'err'); render();
    });
  };
}

/* 레벨테스트 예약을 '미등록'으로 — 예약이 없으면 조용히 넘어간다.
   대기 학기는 지우지 않는다. 그래야 전형 현황에서 '이 학기 미등록'으로 잡힌다. */
async function ltMarkNotEnrolled(brId, semId, stu){
  try{
    let q=sb.from('level_test_reservations')
      .update({ enrolled:'not_enrolled', wait_semester:semId, not_enrolled_reason:'입학 취소' })
      .eq('branch_id', brId).eq('enrolled','enrolled');
    q = (stu && stu.code) ? q.eq('student_code', stu.code) : q.eq('student_name', (stu&&stu.name)||'');
    const { error }=await q;
    if(error) throw error;
  }catch(e){ console.warn('레벨테스트 예약 미등록 처리 건너뜀', e); }
}
function convertTransferInToNew(recId){
  const rec=db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s=getStudent(rec.studentId);
  const from = rec.transferTo ? (getBranch(rec.transferTo)?.name||'') : '';
  openConfirm('일반 신규로 전환',
    `${s.name} (${s.code})\n\n'전입${from?` (${from}에서)`:''}' 표시를 취소하고 일반 신규생으로 바꿉니다.\n출발분원 정보가 지워지고, 전입 집계에서 신규 집계로 옮겨집니다.`,
    ()=>{
      rec.transferIn=false;
      rec.transferTo=null;
      if(rec.origin!=='return') rec.origin='new';   // 신규 유지
      if(rec.note==='전입') rec.note='신규생';
      // 이동이력 메모의 '전입' 흔적 정리
      const mv=db.studentMovements.find(m=>m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId && m.type==='new');
      if(mv && /전입/.test(mv.memo||'')) mv.memo='신규 등록';
      showSaving('전환 중…');
      saveDB().then(ok=>{ hideSaving(); closeModal();
        toast(ok?`${s.name} 일반 신규로 전환 완료`:'저장 실패','ok'); render(); });
    }, {yesLabel:'일반 신규로 전환', danger:false});
}
/* 전입 출발분원 / 전출 도착분원 변경 */
function setTransferBranch(recId, bid){
  const rec=db.semesterRecords.find(r=>r.id===recId); if(!rec) return;
  rec.transferTo = bid || null;
  showSaving('분원 저장…');
  saveDB().then(ok=>{ hideSaving(); toast(ok?'분원 변경됨 ✓':'저장 실패', ok?'ok':'err'); render(); });
}
/* 전출 취소 → 일반 퇴원 (전출 표시 제거, 퇴원율에 반영) */
function cancelTransferOut(recId){
  const rec=db.semesterRecords.find(r=>r.id===recId); if(!rec) return;
  const s=getStudent(rec.studentId);
  openConfirm('전출 취소 → 일반 퇴원',
    `${s.name} (${s.code})\n\n전출 표시를 취소하고 일반 퇴원으로 바꿉니다. 도착분원 정보가 지워지고, 퇴원율에 반영됩니다.`,
    ()=>{
      rec.transfer=false; rec.transferTo=null;
      showSaving('변경 중…');
      saveDB().then(ok=>{ hideSaving(); closeModal();
        toast(ok?`${s.name} 일반 퇴원으로 변경`:'저장 실패','ok'); render(); });
    }, {yesLabel:'일반 퇴원으로', danger:false});
}
/* 퇴원/전출 사유 수정 — 이동이력 메모에서 [전출→분원] 표시는 보존하고 사유 부분만 교체 */
function openEditWithdrawReason(recId){
  const rec = db.semesterRecords.find(r=>r.id===recId);
  if(!rec) return;
  const s = getStudent(rec.studentId);
  const mv = db.studentMovements.find(m=>m.studentId===rec.studentId && m.branchId===rec.branchId && m.semesterId===rec.semesterId && m.type==='withdraw');
  // 현재 메모에서 [전출→…] 접두사 떼고 순수 사유만 뽑음
  const rawMemo = (mv && mv.memo) || '';
  const prefixMatch = rawMemo.match(/^(\[전출[^\]]*\]\s*)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  let curReason = rawMemo.replace(/^\[전출[^\]]*\]\s*/,'');
  if(curReason==='퇴원 처리') curReason = '';  // 기본 메모면 빈칸으로 보여줌

  openModal(`
    <div class="modal-head"><div><h3>퇴원 사유 수정</h3>
      <div class="mh-sub">${esc(s.name)} (${esc(s.code)})${rec.transfer?' · 전출':''}</div></div>
      <button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="field full"><label>퇴원${rec.transfer?'/전출':''} 사유</label>
        <input id="ewReason" placeholder="예: 타지역 이사" value="${esc(curReason)}">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">취소</button>
      <button class="btn primary" id="ewSave">저장</button>
    </div>`);
  el('ewSave').onclick = ()=>{
    const reason = el('ewReason').value.trim() || '퇴원 처리';
    if(mv){
      mv.memo = prefix + reason;
    } else {
      // 이동이력이 없으면 새로 만들어줌
      db.studentMovements.push({id:uid('mv'),studentId:rec.studentId,branchId:rec.branchId,semesterId:rec.semesterId,
        type:'withdraw',date:rec.withdrawDate||today(),memo:prefix+reason});
    }
    showSaving('사유 수정 중…');
    saveDB().then(ok=>{ hideSaving(); closeModal();
      toast(ok?`${s.name} 사유 수정됨`:'저장 실패','ok'); render(); });
  };
}
/* 담임 변경 — 반 선택 시 현재 담임 자동 표시 */
function onTcClassChange(){
  const sel = el('tcClass');
  const opt = sel.options[sel.selectedIndex];
  el('tcFrom').value = opt ? (opt.dataset.teacher||'') : '';
}
/* 반 이동 — 현재 반 선택 시 그 반 재원 학생 목록 채움 */
function onMvFromClass(){
  const branchId = activeBranchId()||session.branchId, semId = state.semId;
  const cn = el('mvFromClass').value;
  const sel = el('mvStudent'); if(!sel) return;
  if(!cn){ sel.innerHTML='<option value="">먼저 현재 반을 고르세요</option>'; return; }
  const recs = activeRecordsOf(branchId, semId).filter(r=>r.className===cn)
    .sort((a,b)=>{const sa=getStudent(a.studentId),sb=getStudent(b.studentId);return String(sa?sa.name:'').localeCompare(String(sb?sb.name:''),'ko');});
  sel.innerHTML = '<option value="">학생 선택…</option>' + recs.map(r=>{ const s=getStudent(r.studentId); return `<option value="${esc(r.studentId)}">${esc(s?s.name:'?')}${s&&s.code?' ('+esc(s.code)+')':''}</option>`; }).join('');
}
/* 반 이동 등록 — 학생 1명을 새 반으로 (반이름·라벨·담임 갱신 + 이동 이력) */
function moveStudent(){
  const branchId = activeBranchId()||session.branchId, semId = state.semId;
  const fromCn=el('mvFromClass').value, studentId=el('mvStudent').value, toCn=el('mvToClass').value, date=el('mvDate').value||today();
  if(!fromCn||!studentId){ toast('옮길 학생을 선택하세요','err'); return; }
  if(!toCn){ toast('새 반을 선택하세요','err'); return; }
  if(fromCn===toCn){ toast('현재 반과 새 반이 같습니다','err'); return; }
  const rec = activeRecordsOf(branchId,semId).find(r=>r.studentId===studentId && r.className===fromCn);
  if(!rec){ toast('학생 기록을 찾을 수 없습니다','err'); return; }
  const target = activeRecordsOf(branchId,semId).find(r=>r.className===toCn)
    || db.semesterRecords.find(r=>r.branchId===branchId&&r.semesterId===semId&&r.className===toCn);
  const toLabel = target ? (target.classLabel||toCn) : toCn;
  const toTeacher = target ? (target.teacher||'') : '';
  const fromLabel = rec.classLabel||fromCn, fromTeacher = rec.teacher||'';
  db.studentMovements.push({ id:uid('mv'), studentId, branchId, semesterId:semId, type:'classChange', date,
    memo:JSON.stringify({fromClass:fromCn,fromLabel,toClass:toCn,toLabel,fromTeacher,toTeacher}) });
  rec.className=toCn; rec.classLabel=toLabel; rec.teacher=toTeacher;   // MC/상담기록은 studentId 기준이라 자동으로 따라옴
  showSaving('반 이동 저장 중…');
  saveDB().then(ok=>{ hideSaving(); toast(ok?`반 이동 완료 · ${fromLabel} → ${toLabel}`:'저장 실패, 다시 시도하세요', ok?'ok':'err'); render(); });
}
/* 반 이동 취소 — 이력 삭제 + 학생을 이전 반으로 되돌림 */
function cancelClassMove(id){
  const mv=(db.studentMovements||[]).find(m=>m.id===id); if(!mv) return;
  let info={}; try{info=JSON.parse(mv.memo||'{}');}catch(e){}
  openConfirm('반 이동 취소',
    `「${info.fromLabel||''} → ${info.toLabel||''}」 이동을 취소하고 이전 반으로 되돌릴까요?`,
    ()=>{
      const rec=db.semesterRecords.find(r=>r.studentId===mv.studentId && r.branchId===mv.branchId && r.semesterId===mv.semesterId && r.status==='active');
      if(rec && info.fromClass){ rec.className=info.fromClass; rec.classLabel=info.fromLabel||info.fromClass; if(info.fromTeacher) rec.teacher=info.fromTeacher; }
      db.studentMovements=db.studentMovements.filter(m=>m.id!==id);
      showSaving('되돌리는 중…');
      saveDB().then(ok=>{ hideSaving(); toast(ok?'반 이동 취소됨':'저장 실패',ok?'ok':'err'); render(); });
    });
}
/* 담임 변경 등록 — 반 학생들 담임 교체 + 변경 이력 저장 */
function changeTeacher(){
  const branchId = session.branchId, semId = state.semId;
  const className = el('tcClass').value;
  const toTeacher = el('tcTo').value.trim();
  const date = el('tcDate').value || today();
  if(!className){ toast('반을 선택하세요','err'); return; }
  if(!toTeacher){ toast('새 담임명을 입력하세요','err'); return; }
  const fromTeacher = el('tcFrom').value.trim();
  if(fromTeacher===toTeacher){ toast('현재 담임과 새 담임이 같습니다','err'); return; }
  // 변경 이력 저장
  db.teacherChanges.push({ id:uid('tc'), branchId, semesterId:semId, className,
    fromTeacher, toTeacher, date });
  // 해당 반 모든 레코드(재원·퇴원 포함)의 현재 담임을 새 담임으로 갱신
  // (인원마감표는 teacherChanges 이력으로 월별 실적을 쪼개므로, 현재 담임은 최신값으로 둠)
  recordsOf(branchId, semId).forEach(r=>{
    if(r.className===className) r.teacher = toTeacher;
  });
  showSaving('담임 변경 저장 중…');
  saveDB().then(ok=>{
    hideSaving();
    toast(ok?`담임 변경 완료 · ${fromTeacher} → ${toTeacher}`:'저장 실패, 다시 시도하세요', ok?'ok':'err');
    render();
  });
}
function deleteTeacherChange(id){
  const ch = db.teacherChanges.find(c=>c.id===id);
  if(!ch) return;
  const cls = (db.semesterRecords||[]).find(r=>r.className===ch.className && r.branchId===ch.branchId && r.semesterId===ch.semesterId);
  const label = cls ? (cls.classLabel||ch.className) : ch.className;
  openConfirm('담임 변경 취소',
    `「${label}」의 담임 변경(${ch.fromTeacher} → ${ch.toTeacher})을 취소할까요?\n\n이 반의 담임이 이전 담임(${ch.fromTeacher})으로 되돌아갑니다.`,
    ()=>{
      // 이 반 학생들 담임을 변경 전으로 원복
      (db.semesterRecords||[]).forEach(r=>{
        if(r.className===ch.className && r.branchId===ch.branchId && r.semesterId===ch.semesterId){
          r.teacher = ch.fromTeacher;
        }
      });
      db.teacherChanges = db.teacherChanges.filter(c=>c.id!==id);
      showSaving('변경 취소 중…');
      saveDB().then(ok=>{ hideSaving(); closeModal();
        toast(ok?`담임 변경 취소됨 · ${ch.toTeacher} → ${ch.fromTeacher}`:'저장 실패, 다시 시도하세요', ok?'ok':'err');
        render();
      });
    }, {yesLabel:'변경 취소'});
}

/* ============================================================================
   17. 관리자 — 분원 계정 관리
   ============================================================================ */
function renderAccounts(){
  crumbs([{label:'분원 계정 관리'}]);
  const branchUsers = db.users.filter(u=>u.role==='branch');
  el('content').innerHTML = `
    <div class="page-head"><h2>분원 계정 관리</h2>
      <div class="sub">분원 계정을 생성하면 해당 계정은 자기 분원 데이터만 보고 업로드할 수 있습니다.</div></div>
    ${myAccountCard()}
    <div class="panel" style="margin-bottom:16px">
      <h3 style="font-size:14.5px;font-weight:650;margin-bottom:14px">새 분원 계정 생성</h3>
      <div class="acct-add">
        <div class="field"><label>분원</label>
          <select id="acBranch">
            <option value="">분원 선택…</option>
            ${db.branches.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}
            <option value="__new__">+ 새 분원 추가</option>
          </select></div>
        <div class="field" id="acNewBranchWrap" style="display:none"><label>새 분원명</label>
          <input id="acNewBranch" placeholder="예: 광교분원"></div>
        <div class="field"><label>아이디</label><input id="acUser" placeholder="영문 아이디"></div>
        <div class="field"><label>비밀번호</label><input id="acPw" placeholder="비밀번호"></div>
        <button class="btn primary" onclick="createBranchAccount()">계정 생성</button>
      </div>
    </div>
    <div class="table-wrap">
      <div class="table-scroll"><table class="grid">
        <thead><tr><th>분원</th><th>아이디</th><th>학생 수</th><th class="cc">관리</th></tr></thead>
        <tbody>
          ${branchUsers.map(u=>{
            const b=getBranch(u.branchId);
            const cnt=db.semesterRecords.filter(r=>r.branchId===u.branchId && r.semesterId===state.semId && r.status==='active').length;
            return `<tr>
              <td><b>${esc(b?b.name:'(분원없음)')}</b></td>
              <td><span class="code-chip">${esc(u.username)}</span></td>
              <td class="num">${cnt}명</td>
              <td class="cc">
                <div style="display:flex;gap:6px;justify-content:center">
                  <button class="btn sm" onclick="resetAccountPassword('${u.id}')">비번 초기화</button>
                  <button class="btn sm" style="color:var(--neg)" onclick="deleteAccount('${u.id}')">삭제</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>`;
  el('acBranch').onchange = e=>{
    el('acNewBranchWrap').style.display = e.target.value==='__new__'?'block':'none';
  };
}
function createBranchAccount(){
  const bsel=el('acBranch').value;
  const user=el('acUser').value.trim(), pw=el('acPw').value.trim();
  if(!bsel){ toast('분원을 선택하세요','err'); return; }
  if(!user||!pw){ toast('아이디와 비밀번호를 입력하세요','err'); return; }
  if(db.users.some(u=>u.username===user)){ toast('이미 존재하는 아이디입니다','err'); return; }
  let branchId=bsel;
  if(bsel==='__new__'){
    const nm=el('acNewBranch').value.trim();
    if(!nm){ toast('새 분원명을 입력하세요','err'); return; }
    branchId=uid('br'); db.branches.push({id:branchId,name:nm});
  }
  const nid=uid('u');
  const nu={id:nid,username:user,role:'branch',branchId};
  if(pwColumnExists()) nu.password=pw;   // 2단계 SQL 전이면 칼럼이 NOT NULL 일 수 있다
  db.users.push(nu);
  saveDB().then(()=>setUserPwSafe(nid,pw)).then(()=>{ toast('분원 계정 생성 완료','ok'); render(); })
    .catch(e=>{ console.error(e); toast('비밀번호 저장 실패: '+((e&&e.message)||''),'err'); render(); });
}
function deleteAccount(uid){
  const u=db.users.find(x=>x.id===uid);
  openConfirm('계정 삭제', `${u.username} 계정을 삭제할까요? 분원 데이터(학생·상담이력)는 보존됩니다.`, ()=>{
    db.users=db.users.filter(x=>x.id!==uid); saveDB(); closeModal(); toast('계정 삭제됨','ok'); render();
  });
}
/* ============================================================================
   17-2. 분원 — 선생님 계정 관리 (전체명단 담임 드롭다운으로 생성)
   ============================================================================ */
function renderTeacherAccounts(){
  const branchId = session.branchId;
  const b = getBranch(branchId);
  const semId = state.semId;
  crumbs([{label:'선생님·조교 계정'}]);
 
  // 이 분원 이번 학기 전체명단에 등록된 담임 이름 목록 (선생님 계정 드롭다운용)
  const teacherNames = [...new Set(
    activeRecordsOf(branchId, semId).map(r=>r.teacher).filter(t=>t && t!=='미배정')
  )].sort((a,b)=>a.localeCompare(b,'ko'));
 
  const teacherUsers = db.users.filter(u=>u.role==='teacher' && u.branchId===branchId);
  const assistantUsers = db.users.filter(u=>u.role==='assistant' && u.branchId===branchId);
 
  el('content').innerHTML = `
    <div class="page-head"><h2>계정 관리</h2>
      <div class="sub">${esc(b.name)} · 선생님은 자기 반 상담 현황을, 조교는 STaRT 외출관리만 볼 수 있습니다.</div></div>

    ${myAccountCard()}
 
    <!-- ===== 선생님 계정 ===== -->
    <div class="panel" style="margin-bottom:16px">
      <h3 style="font-size:14.5px;font-weight:650;margin-bottom:14px">새 선생님 계정 생성</h3>
      <div class="acct-add">
        <div class="field"><label>담임 선생님</label>
          <select id="tcAcctName">
            <option value="">전체명단에서 선택…</option>
            ${teacherNames.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}
          </select></div>
        <div class="field"><label>아이디</label><input id="tcAcctUser" placeholder="영문 아이디"></div>
        <div class="field"><label>비밀번호</label><input id="tcAcctPw" placeholder="비밀번호"></div>
        <button class="btn primary" onclick="createTeacherAccount()">계정 생성</button>
      </div>
      ${teacherNames.length===0?`<div class="pd" style="margin-top:10px;color:var(--neg)">이번 학기 전체명단이 업로드되어야 담임 목록이 나옵니다. 먼저 데이터관리에서 명단을 올려주세요.</div>`:''}
    </div>
    <div class="table-wrap" style="margin-bottom:24px">
      <div class="table-scroll"><table class="grid">
        <thead><tr><th>담임</th><th>담당 반</th><th>아이디</th><th class="cc">관리</th></tr></thead>
        <tbody>
          ${teacherUsers.length===0?`<tr><td colspan="4" style="padding:16px;color:var(--ink-3);text-align:center">아직 만든 선생님 계정이 없습니다.</td></tr>`:
          teacherUsers.map(u=>{
            const clsCnt = new Set(activeRecordsOf(branchId, semId).filter(r=>r.teacher===u.teacherName).map(r=>r.className)).size;
            return `<tr>
              <td><b>${esc(u.teacherName||'(미지정)')}</b></td>
              <td>${clsCnt}개 반</td>
             <td><span class="code-chip">${esc(u.username)}</span></td>
              <td class="cc">
                <button class="btn sm" onclick="resetAccountPassword('${u.id}')">비번 초기화</button>
                <button class="btn sm" style="color:var(--neg)" onclick="deleteAccount('${u.id}')">삭제</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>
 
    <!-- ===== 조교 계정 ===== -->
    <div class="panel" style="margin-bottom:16px">
      <h3 style="font-size:14.5px;font-weight:650;margin-bottom:4px">새 조교 계정 생성</h3>
      <div class="pd" style="margin-bottom:14px">조교 계정으로 로그인하면 <b>STaRT 외출관리 화면만</b> 보입니다. (다른 메뉴는 보이지 않습니다)</div>
      <div class="acct-add">
        <div class="field"><label>조교 이름</label><input id="asAcctName" placeholder="예: 김조교"></div>
        <div class="field"><label>아이디</label><input id="asAcctUser" placeholder="영문 아이디"></div>
        <div class="field"><label>비밀번호</label><input id="asAcctPw" placeholder="비밀번호"></div>
        <button class="btn primary" onclick="createAssistantAccount()">계정 생성</button>
      </div>
    </div>
    <div class="table-wrap">
      <div class="table-scroll"><table class="grid">
        <thead><tr><th>조교</th><th>아이디</th><th class="cc">관리</th></tr></thead>
        <tbody>
         ${assistantUsers.length===0?`<tr><td colspan="3" style="padding:16px;color:var(--ink-3);text-align:center">아직 만든 조교 계정이 없습니다.</td></tr>`:
          assistantUsers.map(u=>`<tr>
              <td><b>${esc(u.teacherName||'(이름없음)')}</b></td>
              <td><span class="code-chip">${esc(u.username)}</span></td>
              <td class="cc">
                <button class="btn sm" onclick="resetAccountPassword('${u.id}')">비번 초기화</button>
                <button class="btn sm" style="color:var(--neg)" onclick="deleteAccount('${u.id}')">삭제</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}
 
/* ============================================================================
   [B] 조교 계정 생성 — createTeacherAccount 근처에 추가
   ============================================================================ */
function createAssistantAccount(){
  const branchId = session.branchId;
  const name = el('asAcctName').value.trim();
  const user = el('asAcctUser').value.trim(), pw = el('asAcctPw').value.trim();
  if(!name){ toast('조교 이름을 입력하세요','err'); return; }
  if(!user||!pw){ toast('아이디와 비밀번호를 입력하세요','err'); return; }
  if(db.users.some(u=>u.username===user)){ toast('이미 존재하는 아이디입니다','err'); return; }
  const nid=uid('u');
  const nu={ id:nid, username:user, role:'assistant', branchId, teacherName:name };
  if(pwColumnExists()) nu.password=pw;
  db.users.push(nu);
  saveDB().then(()=>setUserPwSafe(nid,pw)).then(()=>{ toast(`${name} 조교 계정 생성 완료`,'ok'); render(); })
    .catch(e=>{ console.error(e); toast('비밀번호 저장 실패: '+((e&&e.message)||''),'err'); render(); });
}
 
 
/* ============================================================================
   [C] STaRT 기록 표 — 삭제 버튼 추가. start_module.js의 startRenderLog 교체
   ============================================================================ */
function startRenderLog(){
  const body = el('stLogBody'); if(!body) return;
  el('stLogCount').textContent = startState.logRows.length+'명';
  body.innerHTML = startState.logRows.map(r=>{
    const elapsed = r.returnedAt ? Math.round((new Date(r.returnedAt)-new Date(r.leftAt))/1000) : null;
    const over = elapsed!=null && elapsed > r.limitSec;
    return `<tr>
      <td class="st-name">${esc(r.name)}</td>
      <td>${esc(r.cls||'—')}</td>
      <td>${esc(r.teacher||'—')}</td>
      <td class="num">${startHM(r.leftAt)}</td>
      <td class="num">${r.returnedAt?startHM(r.returnedAt):'—'}</td>
      <td class="num">${elapsed!=null?startDur(elapsed):'—'}</td>
      <td style="font-weight:700;color:${over?'var(--neg)':'var(--pos)'}">${over?'초과':'정상'}</td>
      <td class="cc"><button class="btn sm" style="color:var(--neg)" onclick="startDeleteLog('${r.id}')">삭제</button></td>
    </tr>`;
  }).join('');
}
 
/* ============================================================================
   [D] STaRT 기록 삭제 — start_module.js 아무 데나(함수 밖) 추가
   ============================================================================ */
async function startDeleteLog(id){
  const r = startState.logRows.find(x=>x.id===id);
  if(!r) return;
  if(!confirm(`${r.name} 학생의 이 기록을 삭제할까요?`)) return;
  const { error } = await sb.from('start_sessions').delete().eq('id', id);
  if(error){ console.error(error); toast('삭제 실패','err'); return; }
  startState.logRows = startState.logRows.filter(x=>x.id!==id);
  startRenderLog();
  toast('기록 삭제됨','ok');
}
function createTeacherAccount(){
  const branchId = session.branchId;
  const tname = el('tcAcctName').value;
  const user = el('tcAcctUser').value.trim(), pw = el('tcAcctPw').value.trim();
  if(!tname){ toast('담임 선생님을 선택하세요','err'); return; }
  if(!user||!pw){ toast('아이디와 비밀번호를 입력하세요','err'); return; }
  if(db.users.some(u=>u.username===user)){ toast('이미 존재하는 아이디입니다','err'); return; }
  const nid=uid('u');
  const nu={ id:nid, username:user, role:'teacher', branchId, teacherName:tname };
  if(pwColumnExists()) nu.password=pw;
  db.users.push(nu);
  saveDB().then(()=>setUserPwSafe(nid,pw)).then(()=>{ toast(`${tname} 선생님 계정 생성 완료`,'ok'); render(); })
    .catch(e=>{ console.error(e); toast('비밀번호 저장 실패: '+((e&&e.message)||''),'err'); render(); });
}

/* ============================================================================
   17-3. 선생님 — 내 반 현황 (담임 대시보드: 자기 반만)
   ============================================================================ */
function renderTeacherHome(){
  const branchId = session.branchId;
  const teacher = session.teacherName;
  const b = getBranch(branchId);
  const semId = state.semId;
  state.viewBranchId = branchId;  // 반 상세에서 activeBranchId가 이 분원을 보도록
  crumbs([{label:`${b?b.name:''} 내 반 현황`}]);

  if(!teacher){
    el('content').innerHTML = emptyState('담당 담임이 연결되지 않았습니다','분원 관리자에게 계정 설정을 요청하세요.');
    return;
  }

const trecs = activeRecordsOf(branchId, semId).filter(r=>r.teacher===teacher);
  const examTrecs = examRecordsOf(branchId, semId).filter(r=>r.teacher===teacher);
  if(trecs.length===0){
    el('content').innerHTML = `
      <div class="page-head"><h2>${esc(teacher)} 선생님</h2>
        <div class="sub">${esc(b?b.name:'')} · ${esc(db.semesters.find(s=>s.id===semId)?.name||'')}</div></div>
      ${emptyState('이번 학기 담당 반이 없습니다','전체명단이 업로드되면 담당 반이 표시됩니다.')}`;
    return;
  }

const rates = calcRates(rateRecordsOfTeacher(branchId, semId, teacher), branchId, semId);
  const classes = classesOf(branchId, semId, teacher);

  let html = `
    <div class="page-head">
      <h2>${esc(teacher)} <span style="font-size:14px;font-weight:500;color:var(--ink-3)">선생님</span></h2>
      <div class="sub">${esc(b?b.name:'')} · 학생 ${trecs.length}명 · 반 ${classes.length}개 · ${esc(db.semesters.find(s=>s.id===semId)?.name||'')}</div>
    </div>
    <div class="sect-head"><h3>전체 상담 진행률</h3></div>
    ${ratePanel(rates)}
    <div class="sect-head"><h3>담당 반 목록</h3>
      <div class="sort-bar">
        ${classSortBtn('rate_desc','상담률 높은순')}
        ${classSortBtn('rate_asc','낮은순')}
        ${classSortBtn('name','반이름순')}
      </div></div>
    <div class="card-grid g4">`;

  const ckey = state.classSort;
  const arr = [...classes];
  if(ckey==='rate_desc') arr.sort((a,b)=> b.rates.totalRate-a.rates.totalRate);
  else if(ckey==='rate_asc') arr.sort((a,b)=> a.rates.totalRate-b.rates.totalRate);
  else arr.sort((a,b)=> a.label.localeCompare(b.label,'ko'));
  const byRate = [...classes].sort((a,b)=> b.rates.totalRate-a.rates.totalRate);
  const bestC = byRate.length?byRate[0].className:null;
  const worstC = byRate.length>1?byRate[byRate.length-1].className:null;

  html += arr.map((cls,i)=>{
    const r = cls.rates;
    const rank = (ckey==='rate_desc')?i+1:null;
    const rankCls = rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
    const mark = cls.className===bestC?'best':cls.className===worstC?'worst':null;
    const cardCls = mark==='best'?' best':mark==='worst'?' worst':'';
    const tag = mark==='best'?'<span class="tag-best">최고</span>':mark==='worst'?'<span class="tag-worst">최저</span>':'';
    return `<div class="card clickable${cardCls}" onclick="go('branch/class/${encodeURIComponent(teacher)}/${encodeURIComponent(cls.className)}')">
      ${rank?`<div class="rank-badge ${rankCls}">${rank}</div>`:''}
      <div class="card-top">
        <div>
          <div class="card-name">${esc(cls.label)} ${tag}</div>
          <div class="card-sub">학생 ${cls.studentCount}명${cls.withdrawCount?`<span style="color:var(--warn)"> · 퇴원 ${cls.withdrawCount}명 포함</span>`:''}</div>
        </div>
        <div class="card-rate">
          <div class="r num" style="color:${rateColor(r.totalRate)}">${r.totalRate}%</div>
          <div class="rl">반 상담률</div>
        </div>
      </div>
      ${stageBars(r)}
      <div class="card-foot">${incompleteTag(r.incompleteStudents)}${goArrow}</div>
    </div>`;
  }).join('');
  html += `</div>`;

  // 내신반 (이 선생님이 내신담임인 반)
  if(examTrecs.length>0){
    const examClassMap = new Map();
    examTrecs.forEach(r=>{ if(!examClassMap.has(r.className)) examClassMap.set(r.className,[]); examClassMap.get(r.className).push(r); });
    const examCards = [...examClassMap.entries()].map(([className, crecs])=>{
      const rates = calcRates(crecs, branchId, semId);
      return `<div class="card clickable" onclick="go('branch/class/${encodeURIComponent(teacher)}/${encodeURIComponent(className)}')">
        <div class="card-top">
          <div><div class="card-name">${esc(className)}</div>
            <div class="card-sub">학생 ${crecs.length}명 <span style="color:var(--warn)">(내신반)</span>${examStageOf(crecs[0])?'':'<div style="color:var(--neg);font-weight:700;margin-top:2px">회차 미지정 — 상담률에 안 잡힘</div>'}</div></div>
          <div class="card-rate"><div class="r num" style="color:${rateColor(rates.totalRate)}">${rates.totalTarget?rates.totalRate+'%':'–'}</div>
            <div class="rl">${examStageOf(crecs[0]) ? '내신 '+examStageOf(crecs[0]) : '회차 미지정'}</div></div>
        </div>
        <div class="card-foot"><span class="incomplete-tag">내신반</span>${goArrow}</div>
      </div>`;
    }).join('');
    html += `<div class="sect-head"><h3>내신반</h3></div><div class="card-grid g4">${examCards}</div>`;
  }
  html += incompletePanel(rateRecordsOfTeacher(branchId, semId, teacher), branchId, semId, teacher);
  el('content').innerHTML = html;
}
/* ============================================================================
   17-4. 분원 — 세그먼트 공지 입력 (회차별 4섹션)
   ============================================================================ */
const WITHDRAW_REASONS = [
  { code:'academy',   label:'타학원 이동' },
  { code:'personal',  label:'개인 사유' },
  { code:'burden',    label:'학습 부담' },
  { code:'teacher',   label:'담임 불만' },
  { code:'peer',      label:'교우 관계' },
  { code:'schedule',  label:'스케줄' },
  { code:'moving',    label:'이사' },
  { code:'graduate',  label:'졸업' },
  { code:'closed',    label:'폐강' },
  { code:'other',     label:'기타' },
];
function wdReasonLabel(code){
  const f = WITHDRAW_REASONS.find(r=>r.code===code);
  return f ? f.label : '';
}
   const SEG_STAGES = ['MC1','MC2','MC3'];
const SEG_SECTIONS = [
  { key:'sec1', label:'중요상담', ph:'그 회차 상담의 핵심 메시지 (예: 몰입 상담 강조, 톤 지침 등)' },
  { key:'sec2', label:'레벨 학습 목표 및 학습내용 안내', ph:'CHESS/ACE 레벨별 학습목표·교재·시험 안내' },
  { key:'sec3', label:'학부모 의견 & 학생 적응 상황', ph:'담임이 학부모와 나눌 대화 포인트' },
  { key:'sec4', label:'공지사항', ph:'평가일, 방학, 행정 공지 등' },
];

function renderSegmentEdit(){
  const branchId = session.branchId;
  const b = getBranch(branchId);
  const semId = state.semId;
  const stage = state.segStage || 'MC1';
  crumbs([{label:'세그먼트 공지'}]);

  // 현재 분원·학기·회차의 세그먼트 찾기 (없으면 새로 만들 준비)
  const seg = (db.segments||[]).find(s=>s.branchId===branchId && s.semesterId===semId && s.stage===stage);

  const stageBtn = (st)=>`<button class="sb-btn ${stage===st?'on':''}" onclick="setSegStage('${st}')">${st}</button>`;

  el('content').innerHTML = `
    <div class="page-head">
      <h2>세그먼트 공지</h2>
      <div class="sub">${esc(b.name)} · ${esc(db.semesters.find(s=>s.id===semId).name)} · 세그먼트를 회차별로 입력하면, 담임 계정에서 바로 확인할 수 있습니다.
    </div>
    <div class="sort-bar" style="margin-bottom:16px">
      ${SEG_STAGES.map(stageBtn).join('')}
    </div>
    <div class="panel">
      <h3 style="font-size:14.5px;font-weight:700;margin-bottom:4px">${esc(db.semesters.find(s=>s.id===semId).name)} ${stage} Segment</h3>
      <div class="pd" style="margin-bottom:14px">${seg&&seg.updatedAt?`마지막 저장: ${esc(seg.updatedAt)}`:'아직 저장된 내용이 없습니다.'}</div>
      ${SEG_SECTIONS.map((sec,i)=>`
        <div class="field full" style="margin-bottom:14px">
          <label style="font-weight:700">${i+1}. ${esc(sec.label)}</label>
          <textarea id="seg_${sec.key}" rows="5" placeholder="${esc(sec.ph)}"
            style="width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2);font-family:inherit;font-size:13.5px;line-height:1.6;resize:vertical">${esc(seg?seg[sec.key]||'':'')}</textarea>
        </div>`).join('')}
      <button class="btn primary" style="width:100%" onclick="saveSegment()">${stage} 세그먼트 저장</button>
    </div>`;
}
function renderSegmentView(){
  const branchId = session.branchId;
  const semId = state.semId;
  const stage = state.segStage || 'MC1';
  crumbs([{label:'세그먼트'}]);

  const sem = db.semesters.find(s=>s.id===semId);
  const seg = (db.segments||[]).find(s=>s.branchId===branchId && s.semesterId===semId && s.stage===stage);

  const stageBtn = (st)=>`<button class="sb-btn ${stage===st?'on':''}" onclick="setSegStage('${st}')">${st}</button>`;

  const body = seg
    ? SEG_SECTIONS.map((sec,i)=>{
        const val = (seg[sec.key]||'').trim();
        return `
        <div class="seg-block">
          <div class="seg-label"><span class="seg-num">${i+1}</span>${esc(sec.label)}</div>
          ${val ? `<div class="seg-readonly">${esc(val)}</div>`
                : `<div class="seg-empty">내용이 없습니다.</div>`}
        </div>`;
      }).join('')
    : `<div class="seg-empty" style="text-align:center;padding:36px 0">아직 등록된 ${stage} 세그먼트가 없습니다.</div>`;

  el('content').innerHTML = `
    <div class="page-head">
      <h2>세그먼트</h2>
      <div class="sub">${esc(sem?sem.name:'')} · 회차별 상담 가이드입니다. 상담 전 확인해 주세요.</div>
    </div>
    <div class="sort-bar" style="margin-bottom:16px">
      ${SEG_STAGES.map(stageBtn).join('')}
    </div>
    <div class="panel">
      <h3 style="font-size:14.5px;font-weight:700;margin-bottom:4px">${esc(sem?sem.name:'')} ${stage} Segment</h3>
      <div class="pd" style="margin-bottom:18px">${seg&&seg.updatedAt?`최종 수정: ${esc(seg.updatedAt)}`:'—'}</div>
      ${body}
    </div>`;
}
function setSegStage(st){ state.segStage = st; render(); }
function saveSegment(){
  const branchId = session.branchId, semId = state.semId;
  const stage = state.segStage || 'MC1';
  let seg = (db.segments||[]).find(s=>s.branchId===branchId && s.semesterId===semId && s.stage===stage);
  const vals = {};
  SEG_SECTIONS.forEach(sec=>{ vals[sec.key] = el('seg_'+sec.key).value.trim(); });
  if(seg){
    Object.assign(seg, vals); seg.updatedAt = nowStamp();
  } else {
    seg = { id:uid('seg'), branchId, semesterId:semId, stage, ...vals, updatedAt:nowStamp() };
    (db.segments||(db.segments=[])).push(seg);
  }
  showSaving('세그먼트 저장 중…');
  saveDB().then(ok=>{
    hideSaving();
    toast(ok?`${stage} 세그먼트 저장 완료`:'저장 실패, 다시 시도하세요', ok?'ok':'err');
    render();
  });
}
/* ============================================================================
   18. 모달 유틸
   ============================================================================ */
function openModal(html){ el('modalBox').innerHTML=html; el('modalOverlay').classList.add('open'); }
function closeModal(){ el('modalOverlay').classList.remove('open'); }
el('modalOverlay').addEventListener('click', e=>{ if(e.target===el('modalOverlay')) closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

function openConfirm(title, msg, onYes, opts={}){
  const danger = opts.danger!==false; // 삭제류 기본 빨강
  const yesLabel = opts.yesLabel || '삭제';
  openModal(`
    <div class="modal-head"><div><h3>${esc(title)}</h3></div>
      <button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body"><p style="font-size:13.5px;color:var(--ink-2);line-height:1.65;white-space:pre-line">${esc(msg)}</p></div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">취소</button>
      <button class="btn ${danger?'':'primary'}" id="confirmYes"
        ${danger?'style="background:var(--neg);color:#fff;border-color:var(--neg)"':''}>${esc(yesLabel)}</button>
    </div>`);
  el('confirmYes').onclick = onYes;
}
function confirmReset(){
  openConfirm('전체 데이터 초기화','업로드한 전체명단·상담이력과 신규/퇴원 기록이 모두 삭제되고 빈 상태로 돌아갑니다. 분원 계정은 유지됩니다. 되돌릴 수 없습니다.',async ()=>{
    await resetDB(); closeModal(); toast('초기화 완료','ok');
    const cur=currentSemester(); state.semId = db.semesters.some(s=>s.id===cur.id)?cur.id:(db.semesters[0]&&db.semesters[0].id); buildShell(); go('data');
  }, {yesLabel:'전체 초기화'});
}

 async function init(){
  el('loginBtn').onclick = doLogin;
  el('logoutBtn').onclick = logout;
  ['loginId','loginPw'].forEach(id=> el(id).addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); }));

  // 임베드 모드(통합앱 iframe): 로그인창 대신 로딩 표시 + 부모에서 세션 받아 자동 로그인
  const EMBED = new URLSearchParams(location.search).has('embed') && window.parent !== window;
  if(EMBED){
    el('loginView').style.display = 'none';
    showEmbedLoading();
    window.addEventListener('message', onEmbedMessage);
    window.parent.postMessage({ type:'jls-embed-ready' }, '*');
    try{
      await loadDB();
      _embedDbReady = true;
      loadSession();
      if(session){ hideEmbedLoading(); enterApp(); return; }
      tryEmbedEnter();
    }catch(e){
      console.error(e); hideEmbedLoading();
      el('loginErr').textContent = '서버 연결에 실패했습니다. 새로고침하세요.';
      showLogin();
    }
    return;
  }

  /* 로그인 전에는 서버에서 아무것도 안 받아온다 */
  const lb = el('loginBtn');
  loadSession();
  if(!session){ showLogin(); return; }
  lb.disabled = true; lb.textContent = '서버 연결 중…';
  try{
    await loadDB();
    lb.disabled = false; lb.textContent = '로그인';
    if(db.users.some(u=>u.id===session.userId)) enterApp();
    else { clearSession(); showLogin(); }
  }catch(e){
    console.error(e);
    lb.disabled = false; lb.textContent = '로그인';
    el('loginErr').textContent = '서버 연결에 실패했습니다. 새로고침하거나 인터넷 연결을 확인하세요.';
    showLogin();
  }
}
/* 임베드 자동 로그인 — 통합앱(부모)이 postMessage로 세션을 넘겨줌 */
let _embedUser = null, _embedDbReady = false;
function onEmbedMessage(e){ const d=e.data; if(d && d.type==='jls-embed-session'){ _embedUser=d; tryEmbedEnter(); } }
function tryEmbedEnter(){
  if(!_embedDbReady || !_embedUser) return;
  const u = db.users.find(x=> x.id===_embedUser.userId || x.username===_embedUser.username);
  if(u){ setSession({ userId:u.id, username:u.username, role:u.role, branchId:u.branchId, teacherName:u.teacherName||null }); hideEmbedLoading(); enterApp(); }
  else { hideEmbedLoading(); showLogin(); }
}
function showEmbedLoading(){
  let d = document.getElementById('embedLoading');
  if(!d){
    d = document.createElement('div'); d.id = 'embedLoading';
    d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#f7f5fb;z-index:99999';
    d.innerHTML = '<div style="width:34px;height:34px;border:3px solid #e3ddf2;border-top-color:#8b6ee8;border-radius:50%;animation:iwspin .7s linear infinite"></div>';
    if(!document.getElementById('iwspinStyle')){ const st=document.createElement('style'); st.id='iwspinStyle'; st.textContent='@keyframes iwspin{to{transform:rotate(360deg)}}'; document.head.appendChild(st); }
    document.body.appendChild(d);
  }
  d.style.display = 'flex';
}
function hideEmbedLoading(){ const d = document.getElementById('embedLoading'); if(d) d.style.display = 'none'; }
/* ============================================================================
   부트스트랩 실행 (반드시 파일 맨 끝, 단 한 번)
   ============================================================================ */
init();
/* ============================================================================
   ★ 신규생 안내 문자 생성 (4종: 신규등록 / Q앱 / 차량쌤 / 담임쌤)
   ============================================================================ */

/* Chess(체스) 레벨 → 교재 자동 매핑. 분원마다 문법책 다를 수 있어 수정 가능(입력칸).
   DSD1부터는 "문법책 + (레벨)포트폴리오" 형태. */
const CHESS_BOOKS = {
  DSA1:'Vocabulary Mentor Joy Start 1',
  DSA2:'Vocabulary Mentor Joy Start 2',
  DSB1:'Very Easy Writing 1',
  DSB2:'Grammar Mentor Joy Pre',
  DSC1:'Grammar Mentor Joy Early Start 1',
  DSC2:'Grammar Mentor Joy Early Start 2',
  DSD1:'Grammar Mentor Joy Start 1',
  DSD2:'Grammar Mentor Joy Start 2',
  LSA1:'Grammar Mentor Joy 1',
  LSA2:'Grammar Mentor Joy 2',
  LSB1:'Grammar Mentor Joy 3',
  LSB2:'Grammar Mentor Joy 4',
  LSC1:'Grammar Joy Plus 1',
  LSC2:'Grammar Joy Plus 2',
  LSD1:'제대로 영작문1',
  LSD2:'Grammar Joy Plus 3',
  MSA1:'제대로 영작문2',
  MSA2:'Grammar Joy Plus 4',
  MSB1:'제대로 영작문3',
  MSB2:'제대로 영작문4',
};
/* DSD1부터 포트폴리오 추가 — 레벨 순서상 DSD1 이상이면 포트폴리오 붙음 */
const CHESS_PORTFOLIO_FROM = ['DSD1','DSD2','LSA1','LSA2','LSB1','LSB2','LSC1','LSC2','LSD1','LSD2','MSA1','MSA2','MSB1','MSB2'];
/* 레벨코드로 체스 교재 문자열 생성. 매핑에 있으면 자동, 없으면 빈 문자열(=에이스 등은 수기). */
function chessBookFor(level){
  const lv = String(level||'').toUpperCase();
  const book = CHESS_BOOKS[lv];
  if(!book) return '';
  if(CHESS_PORTFOLIO_FROM.includes(lv)) return `${book} + ${lv} 포트폴리오`;
  return book;
}

/* 신규생 문자 상태 — 폼 입력값 + 문자카드 부가입력값을 모아두는 메모리(저장 안 함) */
const msgState = {
  tab:'enroll',          // enroll | qapp | bus | homeroom
  busRide:'round',       // round | go | come | none(담임용 X)
  bagGiven:false,        // 가방 받음 → 신규등록 문자에서 문구 삭제
  busOn:false,           // 차량 탑승(신규등록 문자용)
  bookStatus:'전달완료',  // 담임쌤 교재 상태 드롭다운
  bookBuy:'구매예정',     // 담임쌤 교재구매: 구매예정 | 프린트
  fields:{},             // 부가 입력칸 값 보존 (탭 전환·차량 토글 때 안 날아가게)
};
/* 부가 입력칸 값 보존 — 카드 다시 그릴 때 저장→복원 */
const MSG_FIELD_IDS=['msgClassTime','msgFee','msgRoom','msgBusStop','msgPhone','msgBook','msgBookStatus','msgBookStatusCustom'];
function captureMsgFields(){ MSG_FIELD_IDS.forEach(id=>{ const e=el(id); if(e) msgState.fields[id]=e.value; }); }
function restoreMsgFields(){
  MSG_FIELD_IDS.forEach(id=>{ const e=el(id); if(e && msgState.fields[id]!=null && msgState.fields[id]!=='') e.value=msgState.fields[id]; });
  const sel=el('msgBookStatus'), custom=el('msgBookStatusCustom');
  if(sel&&custom) custom.disabled=(sel.value!=='__custom__');
}

/* 현재 분원명에 "JLS" 붙인 제목용 분원명 (예: 서수원 → 서수원JLS) */
function branchTagName(){
  const b = getBranch(session.branchId);
  let nm = b ? b.name : '';
  nm = nm.replace(/분원$/,'').replace(/JLS/gi,'').trim();  // "서수원분원"/"서수원" → "서수원"
  return nm + 'JLS';
}
function branchPlainName(){
  const b = getBranch(session.branchId);
  return b ? b.name : '';
}

/* 신규생 추가 폼에서 현재 입력값 읽어오기 (실시간) */
function readNsForm(){
  // 등록 직후 잠긴 값이 있으면 그걸 우선 사용 (폼은 비워졌어도 문자엔 방금 등록한 학생 유지)
  if(msgState.locked) return msgState.locked;
  const csel = el('nsClassSelect');
  const pick = csel ? csel.value : '';
  let className='', classLbl='', teacher='', level='';
  const branchId = session.branchId, semId = state.semId;
  if(pick && pick!=='__new__'){
    const ref = activeRecordsOf(branchId, semId).find(r=>r.className===pick);
    className = pick;
    classLbl = (ref && ref.classLabel) || classLabel(pick) || pick;
    teacher = (ref && ref.teacher) || '';
    level = classLevel(pick);
  } else if(pick==='__new__'){
    className = (el('nsClass')?el('nsClass').value.trim():'') ;
    classLbl = classLabel(className) || className;
    teacher = (el('nsTeacher')?el('nsTeacher').value.trim():'');
    level = classLevel(className);
  }
  const semName = (db.semesters.find(s=>s.id===semId)||{}).name || '';
  // "2026년 여름학기" → "여름학기"만
  const semShort = semName.replace(/^\d+년\s*/,'');
  return {
    name: el('nsName')?el('nsName').value.trim():'',
    school: el('nsSchool')?el('nsSchool').value.trim():'',
    grade: el('nsGrade')?el('nsGrade').value.trim():'',
    date: el('nsDate')?el('nsDate').value:'',
    className, classLbl, teacher, level,
    semShort,
    isReturn: false,  // 수동 신규는 기본 신규생 (복귀 구분 필요시 추후)
  };
}
/* "2026-06-01" → "6/1(월)" 형태 */
function fmtKDate(iso){
  if(!iso) return '';
  const m = String(iso).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(!m) return iso;
  const d = new Date(parseInt(m[1]),parseInt(m[2])-1,parseInt(m[3]));
  const wk = ['일','월','화','수','목','금','토'][d.getDay()];
  return `${parseInt(m[2])}/${parseInt(m[3])}(${wk})`;
}
/* 반 라벨에서 "월수금 1부" 부분만 (· 앞부분) */
function classTimeLabel(classLbl){
  if(!classLbl) return '';
  const parts = classLbl.split('·');
  return parts[0] ? parts[0].trim() : '';
}

/* ===== 문자 4종 본문 생성 ===== */
function buildEnrollMsg(f){
  const fee = el('msgFee')?el('msgFee').value.trim():'';
  const room = el('msgRoom')?el('msgRoom').value.trim():'';
  const timeRaw = el('msgClassTime')?el('msgClassTime').value.trim():'';
  const timeLine = [classTimeLabel(f.classLbl), timeRaw].filter(Boolean).join(' ');
 const bagLine = msgState.bagGiven ? '' : '\n▶ 가방 배부 : 수업 첫날 배부예정입니다.';
  const busLine = msgState.busOn ? '\n▶ 차량 안내 : 이번주 중으로 안내 예정입니다.' : '';
  return `[ ${branchTagName()} - ${f.semShort} 신규 등록 및 입학 안내 ]

안녕하세요? ${f.name||'ㅇㅇㅇ'}학생 학부모님.
${fmtKDate(f.date)||'(등원일)'}부터 시작하는 ${f.semShort} 등록 확정 및 준비사항 안내드립니다. 
# 수업정보 안내
▶ 수업시간 : ${timeLine}
▶ 레벨 : ${f.level||''}
▶ 수강료 : ${fee}
▶ 담임선생님: ${f.teacher||''}
▶ 강의실: ${room}

 
# 학기 시작 전 진행되어야 하는 사항
1. 정상어학원 사이트 가입
- 홈페이지에 학부모님이 먼저 가입해주세요.(www.gojls.com)
- 학부모님 가입 후 자녀추가하여 등록해 주세요. 학부모님 아이디로 로그인 하면 교재구매, 수강료 결제 가능합니다. 
- 학생 아이디는 과제시 필요합니다.
2. 교재 구매
- 정상어학원 홈페이지에서만 구매가능하며 집으로 배송됩니다.  
- 학부모 아이디로 로그인 후 '반 교재' 탭에서 배정된 교재 전부를 구매해 주시면 됩니다.

▶ 수강료 결제 
- 현장 결제 : 카드사 교육비 할인 카드는 현장결제시 적용됩니다.
- 온라인 결제 : www.gojls.com 정상어학원 사이트에서 학부모 아이디로 로그인 후 교육비 결제 가능 합니다. ${bagLine}${busLine}

▶ 담임선생님 인사 : 최대한 빠르게 연락드릴 예정입니다.
추가 문의사항은 학원으로 연락주시면 자세히 안내드리겠습니다. 
감사합니다.`;
}

function buildQappMsg(f){
  return `[ ${branchTagName()} - 학습관리Q(큐) 앱 설치 ]

안녕하세요? ${f.name||'(학생명)'}학생&학부모님. 
${branchPlainName()} 정상어학원입니다.

초등부 단어시험, 문법 시험,CHAT / 중등부 단어시험, 문법 시험 결과를 '학습관리Q(큐)' 앱을 통해 확인하실 수 있는 서비스가 제공됩니다

■ 학습관리Q(큐) 앱 소개
학습관리Q(큐)는 영어 학습의 핵심인 단어와 문법 학습 현황을 학부모님과 학생이 더욱 쉽게 확인할 수 있는 앱 서비스입니다.
* 학생 및 학부모님 모두 꼭 설치하셔서 사용해 주세요.

■ 설치 방법
1) 플레이스토어에 '학습관리 Q'검색
2) 다운로드 후 휴대폰 인증하여 로그인

■ 앱 기능
1) 학생의 학기별 단어 시험과 문법 시험 결과 확인 (개별/누적 현황)
2) 단어 시험 또는 문법 시험의 재시험 예약 및 알림 (미응시 포함)
3) 학기말평가, 영어능력평가, 수능모의고사, DT 결과 제공
정상어학원은 더 편리하고 세밀한 관리로 학생들의 영어 학습을 정상으로 이끌어갑니다. 
기타 문의사항은 학원으로 연락 부탁드립니다.
감사합니다.`;
}

function buildBusMsg(f){
  const stop = el('msgBusStop')?el('msgBusStop').value.trim():'';
  const phone = el('msgPhone')?el('msgPhone').value.trim():'';
  const timeRaw = el('msgClassTime')?el('msgClassTime').value.trim():'';
  const timeLine = [classTimeLabel(f.classLbl), timeRaw].filter(Boolean).join(' ');
  const schoolGrade = [f.school, f.grade].filter(Boolean).join(' ');
  const who = f.isReturn ? '복귀생' : '신규생';
  let note = `${fmtKDate(f.date)||'(등원일)'}부터 등원하는 ${who}입니다.`;
  if(msgState.busRide==='go') note += ' 등원만 탑승합니다.';
  else if(msgState.busRide==='come') note += ' 하원만 탑승합니다.';
  return `※ 차량 전달 
${f.name||'(학생명)'}(${schoolGrade}) 
▶탑승장소: ${stop}
▶시간 : ${timeLine}
▶학부모님 : ${phone}
▶등원일 : ${fmtKDate(f.date)}
▶특이사항: ${note}`;
}

function buildHomeroomMsg(f){
  const stop = el('msgBusStop')?el('msgBusStop').value.trim():'';
  const bookInput = el('msgBook')?el('msgBook').value.trim():'';
  const bookStatusSel = el('msgBookStatus')?el('msgBookStatus').value:'전달완료';
  const bookStatusCustom = el('msgBookStatusCustom')?el('msgBookStatusCustom').value.trim():'';
  const status = (bookStatusSel==='__custom__') ? bookStatusCustom : bookStatusSel;
  const bookLine = bookInput ? `${bookInput} ${status}` : status;
  const schoolGrade = [f.school, f.grade].filter(Boolean).join(' ');
  const who = f.isReturn ? '복귀생' : '신규생';
  // 차량 줄
  let busLine;
  if(msgState.busRide==='none') busLine = 'X';
  else {
    const rideTxt = {round:'왕복', go:'등원만', come:'하원만'}[msgState.busRide]||'왕복';
    busLine = stop ? `${rideTxt} / ${stop}` : rideTxt;
  }
  const lvl = f.level ? `${classTimeLabel(f.classLbl)} ${f.level}`.trim() : (f.classLbl||'');
  const buy = msgState.bookBuy || '구매예정';
  const line4 = (buy==='프린트') ? '4.교재:프린트' : `4.교재구매:${buy}`;
  return `[${who}]
1.${f.name||'(학생명)'}(${schoolGrade})
2.${lvl}
3.등원일:${fmtKDate(f.date)}
${line4}
5.차량:${busLine}
6.HC:전화 부탁드립니다.
7.가방:${msgState.bagGiven?'O':'X'}
8.문법책/지내수: ${bookLine}
${f.teacher||'ㅇㅇㅇ'}선생님 신규 등록하였습니다. 전화 부탁드립니다.감사합니다.`;
}

/* 현재 탭의 문자 본문 생성 */
function buildCurrentMsg(){
  const f = msgState.locked ? msgState.locked : readNsForm();
  if(msgState.tab==='enroll') return buildEnrollMsg(f);
  if(msgState.tab==='qapp') return buildQappMsg(f);
  if(msgState.tab==='bus') return buildBusMsg(f);
  if(msgState.tab==='homeroom') return buildHomeroomMsg(f);
  return '';
}

/* 탭별 부가입력 필드 HTML */
function msgExtraFields(){
  const tab = msgState.tab;
  const lvl = classLevel((el('nsClassSelect')&&el('nsClassSelect').value)||'') || '';
  if(tab==='enroll'){
    return `
      <div class="form-row">
        <div class="field"><label>수업시간 (반명 뒤 시간)</label><input id="msgClassTime" placeholder="예: 14:30~16:10" oninput="refreshMsg()"></div>
        <div class="field"><label>수강료</label><input id="msgFee" placeholder="예: 250,000원" oninput="refreshMsg()"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>강의실</label><input id="msgRoom" placeholder="예: 201호" oninput="refreshMsg()"></div>
        <div class="field"></div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin:4px 0 10px">
        <label class="msg-chk"><input type="checkbox" id="msgBag" onchange="msgState.bagGiven=this.checked;refreshMsg()"> 가방 받음 (체크 시 문구 삭제)</label>
        <label class="msg-chk"><input type="checkbox" id="msgBusOn" onchange="msgState.busOn=this.checked;refreshMsg()"> 차량 탑승 (체크 시 안내 문구 추가)</label>
      </div>`;
  }
  if(tab==='qapp'){
    return `<div class="msg-note">학생명·분원명만 자동으로 들어갑니다. 추가 입력 없음.</div>`;
  }
  if(tab==='bus'){
    return `
      <div class="form-row">
        <div class="field"><label>탑승장소</label><input id="msgBusStop" placeholder="예: 가온초 정문" oninput="refreshMsg()"></div>
        <div class="field"><label>학부모님 전화번호</label><input id="msgPhone" placeholder="예: 01012345678" oninput="refreshMsg()"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>수업시간</label><input id="msgClassTime" placeholder="예: 14:30~16:10" oninput="refreshMsg()"></div>
        <div class="field full" style="align-self:flex-end">
          <label>탑승 구분</label>
          <div class="seg-toggle">
            ${['round','go','come'].map(k=>{
              const lbl={round:'왕복',go:'등원만',come:'하원만'}[k];
              return `<button type="button" class="seg-btn ${msgState.busRide===k?'on':''}" onclick="setBusRide('${k}')">${lbl}</button>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  }
  if(tab==='homeroom'){
    const autoBook = chessBookFor(lvl);
    return `
      <div class="form-row">
        <div class="field full"><label>문법책 (체스는 레벨 선택 시 자동 · 에이스는 직접 입력 · 분원 다르면 수정)</label>
          <input id="msgBook" placeholder="문법 교재명" value="${esc(autoBook)}" oninput="refreshMsg()"></div>
      </div>
      <div class="form-row">
        <div class="field full"><label>교재구매</label>
          <div class="seg-toggle">
            ${['구매예정','프린트'].map(k=>`<button type="button" class="seg-btn ${(msgState.bookBuy||'구매예정')===k?'on':''}" onclick="setBookBuy('${k}')">${k}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="field"><label>교재 전달 상태</label>
          <select id="msgBookStatus" onchange="onBookStatusChange()">
            <option value="전달완료">전달완료</option>
            <option value="수업 첫날 배부예정">수업 첫날 배부예정</option>
            <option value="OT날 배부예정">OT날 배부예정</option>
            <option value="담임선생님께 배부예정">담임선생님께 배부예정</option>
            <option value="__custom__">직접 입력…</option>
          </select></div>
        <div class="field"><label>직접 입력</label><input id="msgBookStatusCustom" placeholder="상태 직접 입력" oninput="refreshMsg()" disabled></div>
      </div>
      <div class="form-row">
        <div class="field"><label>탑승장소 (차량 탈 때만)</label><input id="msgBusStop" placeholder="예: 가온초 정문" oninput="refreshMsg()"></div>
        <div class="field full" style="align-self:flex-end">
          <label>차량</label>
          <div class="seg-toggle">
            ${['round','go','come','none'].map(k=>{
              const lbl={round:'왕복',go:'등원만',come:'하원만',none:'안 탐(X)'}[k];
              return `<button type="button" class="seg-btn ${msgState.busRide===k?'on':''}" onclick="setBusRide('${k}')">${lbl}</button>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div style="margin:4px 0 10px">
        <label class="msg-chk"><input type="checkbox" id="msgBagHr" ${msgState.bagGiven?'checked':''} onchange="msgState.bagGiven=this.checked;refreshMsg()"> 가방 받음 (O / 미체크 시 X)</label>
      </div>`;
  }
  return '';
}
function onBookStatusChange(){
  const sel = el('msgBookStatus');
  const custom = el('msgBookStatusCustom');
  if(sel && custom){
    custom.disabled = (sel.value!=='__custom__');
    if(sel.value!=='__custom__') custom.value='';
  }
  refreshMsg();
}
function setBusRide(k){ msgState.busRide=k; renderMsgCard(); }
function setBookBuy(k){ msgState.bookBuy=k; renderMsgCard(); }

/* 문자 카드 전체 렌더 (탭 + 부가입력 + 미리보기) */
function renderMsgCard(){
  const box = el('msgCardBody');
  if(!box) return;
  captureMsgFields();   // 다시 그리기 전에 현재 입력값 보존
  const tabs = [
    {k:'enroll', l:'신규등록'},
    {k:'qapp', l:'Q앱 설치'},
    {k:'bus', l:'차량쌤'},
    {k:'homeroom', l:'담임쌤'},
  ];
  box.innerHTML = `
    <div class="msg-tabs">
      ${tabs.map(t=>`<button type="button" class="msg-tab ${msgState.tab===t.k?'on':''}" onclick="setMsgTab('${t.k}')">${t.l}</button>`).join('')}
    </div>
    <div class="msg-extra">${msgExtraFields()}</div>
    <div class="msg-preview-wrap">
      <div class="msg-preview-head">
        <span>문자 미리보기</span>
        <button type="button" class="btn sm primary" onclick="copyMsg()">📋 복사</button>
      </div>
      <textarea id="msgPreview" class="msg-preview" rows="16" readonly></textarea>
    </div>
<div class="msg-hint">왼쪽 신규생 정보를 입력하면 실시간으로 반영됩니다. 문법 교재가 분원과 다르면 직접 수정하세요.</div>`;
  restoreMsgFields();   // 재생성된 칸에 보존한 값 복원
// DOM 다 그려진 뒤 미리보기 채움
  const pv = el('msgPreview');
  if(msgState.locked){
    // 방금 등록한 학생 문자를 유지 (locked 값으로 미리보기 표시)
    if(pv) pv.value = buildCurrentMsg();
  } else {
    refreshMsg();
  }
}
function setMsgTab(k){ msgState.tab=k; renderMsgCard(); }
/* 미리보기만 갱신 (부가입력 칸 포커스 유지 — 전체 리렌더 안 함) */
function refreshMsg(){
  // 미리보기만 갱신 — 잠금(방금 등록한 학생)은 유지. 오른쪽 문자카드 컨트롤이 호출해도 학생정보 안 날아감.
  const pv = el('msgPreview');
  if(pv) pv.value = buildCurrentMsg();
}
/* 왼쪽 신규생 폼에 새로 입력 시작하면 잠금 해제(다음 학생 문자로 전환) 후 갱신 */
function onNsInput(){
  msgState.locked = null;
  refreshMsg();
}
function copyMsg(){
  const txt = buildCurrentMsg();
  navigator.clipboard.writeText(txt).then(
    ()=> toast('문자가 복사되었습니다','ok'),
    ()=>{
      // 폴백
      const ta=el('msgPreview'); ta.removeAttribute('readonly'); ta.select();
      try{ document.execCommand('copy'); toast('문자가 복사되었습니다','ok'); }
      catch(e){ toast('복사 실패 — 직접 선택해 복사하세요','err'); }
      ta.setAttribute('readonly','');
    }
  );
}
/* 반 검색 결과 렌더 — 타이핑 즉시 필터링 (레벨·반명·담임 다 검색) */
function renderNsClassResults(){
  const search = el('nsClassSearch');
  const box = el('nsClassResults');
  const sel = el('nsClassSelect');
  if(!search || !box || !sel) return;
  const q = search.value.trim().toLowerCase();
  // 숨은 select의 option들을 후보로 사용 (className=value, 라벨=textContent)
  const opts = [];
  for(const opt of sel.options){
    if(opt.value==='' || opt.value==='__new__') continue;
    opts.push({ className:opt.value, label:opt.textContent.trim() });
  }
  // 검색어로 필터 (라벨에 레벨·반명·담임 다 들어있어서 한 번에 걸림)
  const filtered = q ? opts.filter(o=> o.label.toLowerCase().includes(q)) : opts;
  let rows = filtered.slice(0,40).map(o=>
    `<div class="wd-item" onclick="pickNsClass('${esc(o.className).replace(/'/g,"\\'")}')">
      <div class="wd-main"><span class="wd-name">${esc(o.label)}</span></div>
    </div>`).join('');
  // 맨 아래 '새 반 직접 입력' 항상 노출
  rows += `<div class="wd-item" onclick="pickNsClass('__new__')" style="border-top:1px solid var(--line)">
      <div class="wd-main"><span class="wd-name" style="color:var(--brand)">＋ 새 반 직접 입력</span></div>
    </div>`;
  box.innerHTML = filtered.length===0 && q
    ? `<div class="wd-empty">검색 결과 없음</div>` + rows
    : rows;
  box.style.display = 'block';
}
/* 검색 결과에서 반 선택 → 숨은 select 값 맞추고 확정 표시 */
function pickNsClass(className){
  const sel = el('nsClassSelect');
  const search = el('nsClassSearch');
  const box = el('nsClassResults');
  const picked = el('nsClassPicked');
  if(!sel) return;
  sel.value = className;
  if(box) box.style.display = 'none';
  if(className==='__new__'){
    if(search) search.value = '';
    el('nsNewClassRow').style.display = 'flex';
    if(picked) picked.style.display = 'none';
  } else {
    el('nsNewClassRow').style.display = 'none';
    // 고른 반 라벨 찾아서 확정 표시
    let label = '';
    for(const opt of sel.options){ if(opt.value===className){ label=opt.textContent.trim(); break; } }
    if(search) search.value = '';
    if(picked){
      picked.style.display = 'block';
      picked.innerHTML = `<div class="wd-picked-card">
        <div><div class="wd-picked-name">선택된 반: <b>${esc(label)}</b></div></div>
        <button class="btn sm" onclick="clearNsClass()">변경</button>
      </div>`;
    }
  }
  renderMsgCard();
}
/* 반 선택 취소 → 다시 검색 가능하게 */
function clearNsClass(){
  const sel = el('nsClassSelect');
  if(sel) sel.value = '';
  const picked = el('nsClassPicked');
  if(picked){ picked.style.display='none'; picked.innerHTML=''; }
  el('nsNewClassRow').style.display = 'none';
  const search = el('nsClassSearch');
  if(search){ search.value=''; search.focus(); }
  renderMsgCard();
}
let startState = {
  active: [],
  logRows: [],
  viewDate: null,
  channel: null,
  ticker: null,
  muted: false,
};

let startMode = 'outing';
/* ========================================================================
   STaRT 시험 통과율 — 파싱 · 집계
   ======================================================================== */
const QAPP_GUBUNS = ['CHAT','성과','활용','문법인증'];
const QAPP_OVERRIDE_GUBUNS = ['활용','문법인증'];  // 담임 오버라이드 대상

function qNorm(v){ return v==null ? '' : String(v).trim(); }

/* 현재 분원·학기의 퇴원생 회원코드 집합 */
function withdrawnCodes(branchId, semId){
  const set = new Set();
  (db.semesterRecords||[]).forEach(r=>{
    if(r.branchId===branchId && r.semesterId===semId && r.status==='withdraw'){
      const stu = db.students.find(s=>s.id===r.studentId);
      if(stu && stu.code) set.add(stu.code);
    }
  });
  return set;
}
// 담임명 매칭용 키 — 한글 이름만 추출 (John김지순→김지순, 홍정복/Rachel→홍정복)
function teacherKey(name){
  const ko = (String(name||'').match(/[가-힣]+/g)||[]).join('');
  return ko || normTeacher(name);
}
/* 담임 이름 정규화 — 같은 한글이름이면 영어이름 있는 쪽으로 통일 */
function normTeacher(t){
  if(!t) return t;
  return String(t).split('/')[0].trim();  // "강라현/Sonya" → "강라현"
}
/* 반+구분에 대해 실제 담임 결정: 활용·문법이면 오버라이드 우선 */
function resolveQTeacher(branchId, semId, classLabel, gubun, fileTeacher){
  if(QAPP_OVERRIDE_GUBUNS.includes(gubun)){
    const ov = (db.teacherOverrides||[]).find(o=>
      o.branchId===branchId && o.semesterId===semId &&
      o.classLabel===classLabel && o.gubun===gubun);
    if(ov && ov.teacher) return ov.teacher;
  }
  return fileTeacher;
}

/* 현재 분원·학기의 유효 성적 (퇴원생 제외) */
function activeScores(branchId, semId){
  const wd = withdrawnCodes(branchId, semId);
  const validClasses = qappValidClasses(branchId, semId);
  const validCodes = new Set((db.students||[]).map(s=>s.code));
  return (db.qappScores||[]).filter(s=>
    s.branchId===branchId && s.semesterId===semId &&
    s.studentCode && !wd.has(s.studentCode) &&
    validClasses.has(classKey(s.classLabel)) &&
    validCodes.has(s.studentCode));   // 홈페이지 명단에 있는 학생만
}

/* 홈페이지 semesterRecords의 className = 큐앱 classLabel. 여기 있는 반만 정규반 */
function classKey(name){
  // 맨 끝 "/X" (담당교사 코드) 제거 + 공백 정리해서 매칭 키 생성
  return String(name||'').replace(/\s+/g,'').replace(/\/[^/]*$/,'');
}
function qappValidClasses(branchId, semId){
  const set = new Set();
  (db.semesterRecords||[]).forEach(r=>{
    if(r.branchId===branchId && r.semesterId===semId && r.className){
      set.add(classKey(r.className));
    }
  });
  return set;
}

/* 반 단위 역산: 반 -> Set("구분|회차") = 그 반이 봐야 할 시험 목록 */
function classExamSets(scores){
  const map = {};  // classLabel -> Set
  scores.forEach(s=>{
    (map[s.classLabel] || (map[s.classLabel]=new Set())).add(s.gubun+'|'+s.hoi);
  });
  return map;
}

/* 학생 x (구분+회차)별 최종 상태 분류
   반환: 'pass'(첫통과) | 'repass'(재시험통과) | 'fail'(미통과) | 'noshow'(미응시)
   + 예약여부 */
function classifyExam(recs){
  if(!recs || recs.length===0) return {cat:'noshow', reserved:false};
  const passFirst  = recs.some(r=> r.eungsi==='응시' && r.tonggwa==='통과');
  const passRetest = recs.some(r=> r.eungsi==='재시험' && r.tonggwa==='통과');
  const reserved   = recs.some(r=> qNorm(r.yeyak));
  if(passFirst)  return {cat:'pass',   reserved};
  if(passRetest) return {cat:'repass', reserved};
  const allNoshow = recs.every(r=> r.eungsi==='미응시');
  if(allNoshow)  return {cat:'noshow', reserved};
  return {cat:'fail', reserved};
}

/* 빈 집계 버킷 */
function emptyAgg(){
  return {total:0, pass:0, repass:0, fail:0, noshow:0, fail_rv:0, noshow_rv:0};
}
function passRate(a){
  return a.total ? Math.round((a.pass+a.repass)*100/a.total) : 0;
}
/* 학생코드 → 입학일 (semesterRecords에서). 없으면 null(=학기초부터) */
function enrollDateOf(branchId, semId){
  const map = {};  // code -> enrollDate
  (db.semesterRecords||[]).forEach(r=>{
    if(r.branchId===branchId && r.semesterId===semId && r.enrollDate){
      const stu = db.students.find(s=>s.id===r.studentId);
      if(stu && stu.code) map[stu.code] = r.enrollDate;
    }
  });
  return map;
}
/* 한글이름 → 대표 표시명(영어 있는 형태 우선) */
function teacherDisplayMap(branchId, semId){
  const map = {};  // 한글 → 대표 전체이름
  (db.qappScores||[]).forEach(s=>{
    if(s.branchId!==branchId || s.semesterId!==semId || !s.teacher) return;
    const key = normTeacher(s.teacher);
    // 영어이름 있는 형태(/뒤가 '-'나 빈값 아님)를 우선 저장
    const hasEng = s.teacher.includes('/') && !/\/\s*-?\s*$/.test(s.teacher);
    if(!map[key] || (hasEng && !map[key].includes('/'))) map[key] = s.teacher;
    else if(!map[key]) map[key] = s.teacher;
  });
  return map;
}
/* 핵심 집계 엔진.
   groupBy: 'branch' | 'teacher' | 'class' | 'lesson' | 'student'
   filter:  {gubun, classLabel} 로 범위 좁히기 (옵션)
   반환: { [groupKey]: { [gubun]: aggBucket }, ... } + 메타 */
function aggregateScores(branchId, semId, opts={}){
  let scores = activeScores(branchId, semId);
  if(opts.teacherKey){ scores = scores.filter(s=>teacherKey(s.teacher)===opts.teacherKey); }
  const classSets = classExamSets(scores);
  const enrollMap = enrollDateOf(branchId, semId);
  const tDisplay = teacherDisplayMap(branchId, semId);
  // 반+구분+회차 -> 그 시험이 치러진 날짜 (누군가 응시한 날)
  const examDateMap = {};  // classLabel|gubun|hoi -> examDate
  scores.forEach(s=>{
    const k = s.classLabel+'|'+s.gubun+'|'+s.hoi;
    if(s.examDate && (!examDateMap[k] || s.examDate<examDateMap[k])) examDateMap[k]=s.examDate;
  });

  // (학생코드, 구분, 회차) -> 그 학생의 그 시험 기록들
  const byStuExam = {};
  scores.forEach(s=>{
    const k = s.studentCode+'|'+s.gubun+'|'+s.hoi;
    (byStuExam[k] || (byStuExam[k]=[])).push(s);
  });

  // 반별 학생 목록
  const classStudents = {};   // classLabel -> Set(code)
  const stuMeta = {};         // code -> {name, classLabel, teacherByGubun}
  scores.forEach(s=>{
    (classStudents[s.classLabel] || (classStudents[s.classLabel]=new Set())).add(s.studentCode);
    if(!stuMeta[s.studentCode]) stuMeta[s.studentCode] = {name:s.studentName, classLabel:s.classLabel, fileTeacher:s.teacher};
  });

  const result = {};  // groupKey -> gubun -> agg
  const meta = {};    // groupKey -> {label, ...}
  const groupBy = opts.groupBy || 'branch';

  // 회차 라벨 저장 (lesson 뷰용)
  const lessonLabel = {};  // "구분|회차" -> lesson

  Object.entries(classSets).forEach(([classLabel, examSet])=>{
    // 필터: 특정 반만
    if(opts.classLabel && classLabel!==opts.classLabel) return;
    const students = classStudents[classLabel] || new Set();

    examSet.forEach(examKey=>{
      const [gubun, hoi] = examKey.split('|');
      // 필터: 특정 구분만
      if(opts.gubun && gubun!==opts.gubun) return;

      students.forEach(code=>{
        const recs = byStuExam[code+'|'+gubun+'|'+hoi];
        // 미응시(기록 없음)인데, 그 시험이 이 학생 입학일보다 전에 치러졌으면 → 없는 시험 (제외)
        if(!recs){
          const enroll = enrollMap[code];
          const examDate = examDateMap[classLabel+'|'+gubun+'|'+hoi];
          if(enroll && examDate && examDate < enroll) return;  // 입학 전 시험은 건너뜀
        }
        const {cat, reserved} = classifyExam(recs);
        if(recs && recs[0] && recs[0].lesson) lessonLabel[gubun+'|'+hoi] = recs[0].lesson;

        // 그룹 키 결정
        let gkey, glabel;
        if(groupBy==='branch'){ gkey='ALL'; glabel='분원 전체'; }
        else if(groupBy==='teacher'){
          const rawT = resolveQTeacher(branchId, semId, classLabel, gubun, stuMeta[code]?.fileTeacher||'');
          gkey = normTeacher(rawT);   // 한글이름으로 통합
          glabel = gkey;              // 표시명은 아래에서 대표명으로 교체
        }
        else if(groupBy==='class'){ gkey=classLabel; glabel=classLabel; }
        else if(groupBy==='lesson'){ gkey=gubun+'|'+hoi; glabel=hoi+'회'; }
        else if(groupBy==='student'){ gkey=code; glabel=stuMeta[code]?.name||code; }

        if(!result[gkey]){ result[gkey]={}; QAPP_GUBUNS.forEach(g=>result[gkey][g]=emptyAgg()); meta[gkey]={label: groupBy==='teacher' ? (tDisplay[gkey]||glabel) : glabel}; }
        const a = result[gkey][gubun];
        a.total++;
        a[cat]++;
        if((cat==='fail'||cat==='noshow') && reserved) a[cat+'_rv']++;
      });
    });
  });

  return {result, meta, lessonLabel};
}
/* 학생별 집계 — 역산 없이, 실제 응시 기록만. (반 꼬임 유령 방지) */
function aggregateStudents(branchId, semId, opts={}){
  let scores = activeScores(branchId, semId);
  if(opts.teacherKey){ scores = scores.filter(s=>teacherKey(s.teacher)===opts.teacherKey); }
  // 학생 x (구분+회차)로 묶어서 최종 상태 분류
  const byStuExam = {};
  scores.forEach(s=>{
    const k = s.studentCode+'|'+s.gubun+'|'+s.hoi;
    (byStuExam[k]||(byStuExam[k]=[])).push(s);
  });
  const result = {}, meta = {};
  const seen = new Set();
  Object.keys(byStuExam).forEach(k=>{
    const [code,gubun,hoi] = k.split('|');
    const recs = byStuExam[k];
    const {cat, reserved} = classifyExam(recs);
    if(!result[code]){ result[code]={}; QAPP_GUBUNS.forEach(g=>result[code][g]=emptyAgg()); meta[code]={label:recs[0].studentName||code}; }
    const a = result[code][gubun];
    a.total++; a[cat]++;
    if((cat==='fail'||cat==='noshow') && reserved) a[cat+'_rv']++;
  });
  return {result, meta};
}
/* ========================================================================
   STaRT 시험 통과율 — 화면
   ======================================================================== */
function passState(){
  if(!state.pass) state.pass = {view:'branch', gubun:'', classLabel:''};
  return state.pass;
}
function setPassView(v){ const p=passState(); p.view=v; p.gubun=''; p.classLabel=''; render(); }
function setPassGubun(g){ const p=passState(); p.gubun=g; p.view='class'; render(); }  // 도넛 클릭 → 그 구분 반별로
function setPassGubunFilter(g){ const p=passState(); p.gubun=g; p.classLabel=''; render(); }  // 필터 칩
function passOpenClass(clsEnc){ const p=passState(); p.classLabel=decodeURIComponent(clsEnc); p.view='lesson'; render(); }
function passOpenLessonStudents(clsEnc, g, h){ const p=passState(); p.classLabel=decodeURIComponent(clsEnc); p.lessonGubun=g; p.lessonHoi=h; p.view='lessonStudent'; render(); }

function passDonut(a, size){
  const rate = passRate(a);
  const passPct = a.total?Math.round((a.pass+a.repass)*100/a.total):0;
  const failPct = a.total?Math.round(a.fail*100/a.total):0;
  const noPct   = a.total?Math.round(a.noshow*100/a.total):0;
  const bad = rate < 75;
  const cPass='#B8A6F0', cFail=bad?'#EE93B0':'#F5B4CB', cNo='#D9D3E8';
  const track=bad?'#FBEEF3':'#F3F0F9';
  const center=bad?'#B05478':'#5B4B8A';
  return `<div style="position:relative;width:${size}px;height:${size}px;flex:none">
    <svg viewBox="0 0 42 42" style="width:${size}px;height:${size}px;transform:rotate(-90deg)">
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="${track}" stroke-width="4.5"/>
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="${cPass}" stroke-width="4.5" stroke-dasharray="${passPct} 100"/>
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="${cFail}" stroke-width="4.5" stroke-dasharray="${failPct} 100" stroke-dashoffset="-${passPct}"/>
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="${cNo}" stroke-width="4.5" stroke-dasharray="${noPct} 100" stroke-dashoffset="-${passPct+failPct}"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <span style="font-size:${Math.round(size*0.22)}px;font-weight:700;color:${center};line-height:1">${rate}%</span>
      ${size>=80?`<span style="font-size:9.5px;color:#A99FC4;margin-top:2px">통과</span>`:''}
    </div>
  </div>`;
}

function passBigCard(gubun, a){
  const bad = passRate(a) < 75;
  const border = bad?'#F7DCE6':'#ECE7F5';
  const pct = v=> a.total?Math.round(v*100/a.total):0;
  const legend = (label,val,pctv,color,strong)=>`
    <div style="display:flex;align-items:center;gap:8px;font-size:12px">
      <span style="width:9px;height:9px;border-radius:50%;background:${color};flex:none"></span>
      <span style="color:${strong?'#B05478':'#6B5D9E'};flex:1;${strong?'font-weight:700':''}">${label}</span>
      <span style="color:${strong?'#B05478':'#3D3560'};font-weight:700">${val}</span>
      <span style="color:#A99FC4;width:34px;text-align:right">${pctv}%</span>
    </div>`;
  return `<div onclick="setPassGubun('${gubun}')" style="cursor:pointer;background:var(--surface-2);border:0.5px solid ${border};border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:20px">
    ${passDonut(a,104)}
    <div style="flex:1;min-width:0">
      <div style="font-size:16px;font-weight:700;color:#3D3560;margin-bottom:1px">${esc(gubun)}</div>
      <div style="font-size:11px;color:#A99FC4;margin-bottom:13px">총 ${a.total} 시험</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${legend('통과', a.pass+a.repass, pct(a.pass+a.repass), '#B8A6F0', false)}
        ${legend('미통과', a.fail, pct(a.fail), bad?'#EE93B0':'#F5B4CB', bad)}
        ${legend('미응시', a.noshow, pct(a.noshow), '#D9D3E8', false)}
      </div>
      ${(a.fail_rv||a.noshow_rv)?`<div style="margin-top:9px;padding-top:9px;border-top:0.5px solid #EEEBF6;font-size:10.5px;color:#A99FC4">예약: 미통과 ${a.fail_rv} · 미응시 ${a.noshow_rv}</div>`:''}
    </div>
  </div>`;
}

function passListRow(label, a, onclick, sub){
  const bad = passRate(a) < 75;
  return `<div ${onclick?`onclick="${onclick}"`:''} style="display:flex;align-items:center;gap:16px;padding:13px 4px;border-bottom:0.5px solid #EEEBF6;${onclick?'cursor:pointer':''}">
    <div style="flex:none">${passDonut(a,52)}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13.5px;font-weight:700;color:#2E2748">${esc(label)}</div>
      ${sub?`<div style="font-size:11px;color:#A99FC4;margin-top:1px">${esc(sub)}</div>`:''}
    </div>
    <div style="font-size:11.5px;color:${bad?'#B05478':'#8A7CB8'};text-align:right;white-space:nowrap">
      미통과 <b style="color:${bad?'#993556':'#4B2FB8'}">${a.fail}</b> · 미응시 <b style="color:#4B2FB8">${a.noshow}</b>
    </div>
  </div>`;
}
/* 반별 행 — 담임 지정 버튼 포함 */
function passRowWithOverride(classLabel, a){
  const bad = passRate(a) < 75;
  const enc = encodeURIComponent(classLabel);
  return `<div style="display:flex;align-items:center;gap:16px;padding:13px 4px;border-bottom:0.5px solid #EEEBF6">
    <div onclick="passOpenClass('${enc}')" style="flex:none;cursor:pointer">${passDonut(a,52)}</div>
    <div onclick="passOpenClass('${enc}')" style="flex:1;min-width:0;cursor:pointer">
      <div style="font-size:13.5px;font-weight:700;color:#2E2748">${esc(classLabel)}</div>
      <div style="font-size:11px;color:#A99FC4;margin-top:1px">클릭 → 회차별</div>
    </div>
    <div style="font-size:11.5px;color:${bad?'#B05478':'#8A7CB8'};text-align:right;white-space:nowrap">
      미통과 <b style="color:${bad?'#993556':'#4B2FB8'}">${a.fail}</b> · 미응시 <b style="color:#4B2FB8">${a.noshow}</b>
    </div>
    <button class="btn sm" onclick="openTeacherOverride('${enc}')" style="flex:none">담임 지정</button>
  </div>`;
}
/* 담임 행 — 클릭하면 반 목록 + 시험구분별 상세 펼침 */
function passTeacherRow(teacher, sortAgg, byGubun, branchId){
  if(!state.passOpenTeachers) state.passOpenTeachers = {};
  if(!state.passTeacherClass) state.passTeacherClass = {};
  const open = !!state.passOpenTeachers[teacher];
  const bad = passRate(sortAgg) < 75;
  const semId = state.semId;

  const teacherKey = normTeacher(teacher);
  const classes = [...new Set(activeScores(branchId, semId)
    .filter(s=> normTeacher(resolveQTeacher(branchId, semId, s.classLabel, s.gubun, s.teacher))===teacherKey)
    .map(s=>s.classLabel))];

  const head = `<div onclick="togglePassTeacher('${encodeURIComponent(teacher)}')" style="display:flex;align-items:center;gap:16px;padding:13px 4px;cursor:pointer;${open?'':'border-bottom:0.5px solid #EEEBF6'}">
    <div style="flex:none">${passDonut(sortAgg,52)}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13.5px;font-weight:700;color:#2E2748">${esc(teacher)}</div>
      <div style="font-size:11px;color:#A99FC4;margin-top:1px">담임 · 반 ${classes.length}개 ${open?'▲':'▼'}</div>
    </div>
    <div style="font-size:11.5px;color:${bad?'#B05478':'#8A7CB8'};text-align:right;white-space:nowrap">
      미통과 <b style="color:${bad?'#993556':'#4B2FB8'}">${sortAgg.fail}</b> · 미응시 <b style="color:#4B2FB8">${sortAgg.noshow}</b>
    </div>
  </div>`;

  if(!open) return head;

  // 선택된 반 (없으면 전체)
  const selClass = state.passTeacherClass[teacher] || '';
  const shortName = c=>{ const m=c.match(/\[([^\]]+)\]/); return m?m[1]:c; };

  // 반 태그 (클릭 필터) — "전체" + 각 반
  const tag = (label, cls, active)=>`<span onclick="event.stopPropagation();selectPassTeacherClass('${encodeURIComponent(teacher)}','${encodeURIComponent(cls)}')" style="font-size:11.5px;padding:4px 11px;border-radius:8px;cursor:pointer;${active?'background:#7C5CFF;color:#fff':'background:#F1ECFC;color:#5B4B8A'}">${esc(label)}</span>`;
  const tags = tag('전체','',!selClass) + classes.map(c=>tag(shortName(c), c, selClass===c)).join('');

  // 표 데이터: 선택 반이 있으면 그 반만 재집계, 없으면 담임 전체(byGubun)
  let showGubun = byGubun;
  if(selClass){
    const {result} = aggregateScores(branchId, semId, {groupBy:'class', classLabel:selClass});
    showGubun = result[selClass] || {};
  }

  const gLabel = g=> g==='모범인증'?'문법인증':g;
  const rowsHtml = QAPP_GUBUNS.map(g=>{
    const a = showGubun[g];
    if(!a || !a.total) return '';
    const gbad = passRate(a)<75;
    return `<tr style="border-top:0.5px solid #EEEBF6">
      <td style="padding:6px 0;color:${gbad?'#B05478':'#3D3560'};font-weight:700;text-align:left">${esc(gLabel(g))}</td>
      <td style="text-align:center">${a.total}</td>
      <td style="text-align:center;color:#7C5CD9">${a.pass+a.repass}</td>
      <td style="text-align:center;color:${gbad?'#993556':'#B05478'};${gbad?'font-weight:700':''}">${a.fail}</td>
      <td style="text-align:center;color:#A99FC4">${a.noshow}</td>
    </tr>`;
  }).join('');

  const panel = `<div style="padding:4px 4px 16px;background:#FAF8FE;border-radius:0 0 12px 12px;margin-bottom:6px;border-bottom:0.5px solid #EEEBF6">
    <div style="padding:0 12px 12px">
      <div style="font-size:11px;color:#A99FC4;margin-bottom:6px">반 선택 (담당 ${classes.length}개)</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">${tags}</div>
      <div style="font-size:11px;color:#A99FC4;margin-bottom:6px">${selClass?esc(shortName(selClass))+' 반':'전체'} · 시험구분별</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse;table-layout:fixed">
        <tr style="color:#A99FC4;font-size:10.5px">
          <td style="padding:2px 0;width:28%;text-align:left">구분</td>
          <td style="text-align:center;width:18%">총</td>
          <td style="text-align:center;width:18%">통과</td>
          <td style="text-align:center;width:18%">미통과</td>
          <td style="text-align:center;width:18%">미응시</td>
        </tr>
        ${rowsHtml||'<tr><td colspan="5" style="padding:12px;text-align:center;color:#A99FC4">데이터 없음</td></tr>'}
      </table>
    </div>
  </div>`;

  return head + panel;
}
function selectPassTeacherClass(tEnc, cEnc){
  const t = decodeURIComponent(tEnc), c = decodeURIComponent(cEnc);
  if(!state.passTeacherClass) state.passTeacherClass = {};
  state.passTeacherClass[t] = c;
  render();
}
function togglePassTeacher(tEnc){
  const t = decodeURIComponent(tEnc);
  if(!state.passOpenTeachers) state.passOpenTeachers = {};
  state.passOpenTeachers[t] = !state.passOpenTeachers[t];
  render();
}
/* 특정 반·구분·회차의 학생별 상태 */
function passLessonStudents(branchId, semId, classLabel, gubun, hoi){
  const scores = activeScores(branchId, semId).filter(s=>s.classLabel===classLabel);
  const codes = [...new Set(scores.map(s=>s.studentCode))];
  const nameOf = {};
  (db.qappScores||[]).forEach(s=>{ if(s.studentCode && !nameOf[s.studentCode]) nameOf[s.studentCode]=s.studentName; });
  return codes.map(code=>{
    const recs = (db.qappScores||[]).filter(s=>s.branchId===branchId && s.semesterId===semId && s.classLabel===classLabel && s.studentCode===code && s.gubun===gubun && s.hoi===hoi)
      .sort((a,b)=> (a.examDate||'').localeCompare(b.examDate||''));  // 시간순
    const {cat, reserved} = classifyExam(recs);
    return {code, name:nameOf[code]||code, cat, reserved, attempts:recs};
  }).sort((a,b)=>{
    const order={fail:0,noshow:1,repass:2,pass:3};
    return order[a.cat]-order[b.cat];
  });
}
/* 응시 이력 중 예약일시 추출 (가장 최근 것) */
function passReserveInfo(attempts){
  const withRv = attempts.filter(a=> a.yeyak && String(a.yeyak).trim());
  if(!withRv.length) return '';
  const raw = String(withRv[withRv.length-1].yeyak).trim();
  // "2026-07-14 / 20:00" → "07-14 20:00"
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})\s*\/?\s*(\d{1,2}:\d{2})/);
  if(m) return `${m[2]}-${m[3]} ${m[4]}`;
  return raw;
}
function passStudentStatusRow(s){
  const badge = {
    pass:   ['통과','#EEF1FE','#4B2FB8'],
    repass: ['재시험 통과','#F0ECFA','#7C5CD9'],
    fail:   ['미통과','#FBEAF0','#B05478'],
    noshow: ['미응시','#F1EFE8','#8A857A'],
  }[s.cat];
  // 응시 이력별 점수
  const tries = s.attempts.filter(a=> a.eungsi==='응시' || a.eungsi==='재시험');
  let scoreLine = '';
  if(tries.length){
    scoreLine = tries.map((a,i)=>{
      const label = a.eungsi==='재시험' ? `재시험` : '1차';
      const pass = a.tonggwa==='통과';
      return `<span style="color:${pass?'#4B2FB8':'#B05478'}">${tries.length>1?label+' ':''}${a.jumsu}/${a.baejeom}</span>`;
    }).join(' <span style="color:#CFC7E0">·</span> ');
  } else {
    scoreLine = `<span style="color:#A99FC4">미응시</span>`;
  }
 const stu = db.students.find(x=>x.code===s.code);
  const schoolInfo = stu ? `${stu.school||''} ${stu.grade||''}`.trim() : '';
  const reserve = (s.cat==='fail'||s.cat==='noshow') ? passReserveInfo(s.attempts) : '';
  return `<div class="pass-student-row" style="display:flex;align-items:center;gap:10px;padding:12px 4px;border-bottom:0.5px solid #EEEBF6">
    <div class="pss-name" style="width:76px;flex:none;font-size:13.5px;font-weight:700;color:#2E2748;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</div>
    <div class="pss-school" style="width:140px;flex:none;font-size:11px;color:#A99FC4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(schoolInfo)}</div>
    <div class="pss-score" style="flex:1;font-size:12px">${scoreLine}</div>
    ${reserve?`<span style="font-size:10.5px;color:#7C5CD9;background:#F1ECFC;padding:3px 8px;border-radius:6px;white-space:nowrap;flex:none">예약 ${esc(reserve)}</span>`:''}
    <span style="font-size:11.5px;font-weight:700;color:${badge[2]};background:${badge[1]};padding:4px 11px;border-radius:8px;white-space:nowrap;flex:none">${badge[0]}</span>
  </div>`;
}
/* 학생별 행 (전체 시험 집계 + 클릭하면 상세) */
function passStudentRow(code, name, a, branchId){
  const open = state.passOpenStudent===code;
  const total=a.total, pass=a.pass+a.repass, fail=a.fail, noshow=a.noshow;
  const stu = db.students.find(x=>x.code===code);
  const school = stu?`${stu.school||''} ${stu.grade||''}`.trim():'';
  const bad = passRate(a)<75;
  const head = `<div onclick="togglePassStudent('${code}')" style="display:flex;align-items:center;gap:12px;padding:13px 4px;cursor:pointer;${open?'':'border-bottom:0.5px solid #EEEBF6'}">
    <div style="flex:none">${passDonut(a,46)}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13.5px;font-weight:700;color:#2E2748">${esc(name)} ${open?'▲':'▼'}</div>
      <div style="font-size:11px;color:#A99FC4">${esc(school)}</div>
    </div>
    <div style="font-size:11.5px;color:#8A7CB8;text-align:right;white-space:nowrap">
      총 <b style="color:#4B2FB8">${total}</b> · 통과 <b style="color:#4B2FB8">${pass}</b> · 미통과 <b style="color:${bad?'#993556':'#B05478'}">${fail}</b> · 미응시 <b style="color:#8A857A">${noshow}</b>
    </div>
  </div>`;
 if(!open) return head;
  return head + passStudentDetail(code, branchId);
}
function togglePassStudent(code){
  const y = window.scrollY;
  state.passOpenStudent = state.passOpenStudent===code ? null : code;
  render();
  requestAnimationFrame(()=>window.scrollTo(0, y));
}

/* 학생 상세: 시험구분별 묶어서 회차순, 교재·레슨·점수·통과여부 */
function passStudentDetail(code, branchId){
  branchId = branchId || session.branchId;
  const semId = state.semId;
  const scores = activeScores(branchId, semId).filter(s=>s.studentCode===code);
  // (구분, 회차)별 묶기
  const byKey = {};
  scores.forEach(s=>{ (byKey[s.gubun+'|'+s.hoi] || (byKey[s.gubun+'|'+s.hoi]=[])).push(s); });
  const gLabel=g=> g==='모범인증'?'문법인증':g;
  const gOrder={'CHAT':0,'성과':1,'활용':2,'모범인증':3};

  const keys = Object.keys(byKey).sort((a,b)=>{
    const [ga,ha]=a.split('|'), [gb,hb]=b.split('|');
    if(ga!==gb) return (gOrder[ga]??9)-(gOrder[gb]??9);
    return (parseInt(ha)||0)-(parseInt(hb)||0);
  });

  const rows = keys.map((k,i)=>{
    const [g,h]=k.split('|');
    const recs = byKey[k].sort((x,y)=>(x.examDate||'').localeCompare(y.examDate||''));
    const first = recs[0];
    const {cat} = classifyExam(recs);
    const badge = {pass:['통과','#4B2FB8'],repass:['재시험 통과','#7C5CD9'],fail:['미통과','#B05478'],noshow:['미응시','#8A857A']}[cat];
    // 응시 점수들
    const tries = recs.filter(r=>r.eungsi==='응시'||r.eungsi==='재시험');
    const scoreStr = tries.length
      ? tries.map(r=>`${r.eungsi==='재시험'?'재 ':''}${r.jumsu}/${r.baejeom}`).join(' · ')
      : '미응시';
    return `<tr style="border-top:0.5px solid #EEEBF6">
      <td style="padding:8px 4px;font-size:11px;color:#B8A6F0;font-weight:700;text-align:center;width:26px">${i+1}</td>
      <td style="padding:8px 6px;font-size:11.5px;font-weight:700;color:#3D3560;white-space:nowrap">${esc(gLabel(g))} ${esc(h)}회</td>
      <td style="padding:8px 6px;font-size:11px;color:#8A7CB8">${esc(first.textbook||'')}${first.lesson?` · ${esc(first.lesson)}`:''}</td>
      <td style="padding:8px 6px;font-size:11.5px;color:#3D3560;text-align:right;white-space:nowrap">${esc(scoreStr)}</td>
      <td style="padding:8px 6px;text-align:right;white-space:nowrap"><span style="font-size:10.5px;font-weight:700;color:${badge[1]}">${badge[0]}</span></td>
    </tr>`;
  }).join('');

  return `<div style="padding:6px 4px 16px;background:#FAF8FE;border-radius:0 0 12px 12px;margin-bottom:6px;border-bottom:0.5px solid #EEEBF6">
    <table style="width:100%;border-collapse:collapse">${rows}</table>
  </div>`;
}
/* 여러 gubun 버킷을 하나로 합산 */
function sumAggs(byGubun){
  const out = emptyAgg();
  QAPP_GUBUNS.forEach(g=>{
    const a=byGubun[g]; if(!a) return;
    out.total+=a.total; out.pass+=a.pass; out.repass+=a.repass;
    out.fail+=a.fail; out.noshow+=a.noshow; out.fail_rv+=a.fail_rv; out.noshow_rv+=a.noshow_rv;
  });
  return out;
}
/* 반의 활용·문법 담임 지정 팝업 */
function openTeacherOverride(clsEnc){
  const classLabel = decodeURIComponent(clsEnc);
  const branchId = session.branchId, semId = state.semId;
  const cur = {};
  QAPP_OVERRIDE_GUBUNS.forEach(g=>{
    const ov = (db.teacherOverrides||[]).find(o=>o.branchId===branchId && o.semesterId===semId && o.classLabel===classLabel && o.gubun===g);
    cur[g] = ov ? ov.teacher : '';
  });
  // 파일 기준 기본 담임 (참고 표시용)
  const fileTeacher = (db.qappScores||[]).find(s=>s.branchId===branchId && s.semesterId===semId && s.classLabel===classLabel)?.teacher || '';

  openModal(`
    <div class="modal-head"><div><h3>담임 지정</h3></div>
      <button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="pd" style="margin-bottom:14px">${esc(classLabel)}<br>
        <span style="color:var(--ink-3)">파일 기준 담임: ${esc(fileTeacher.split('/')[0]||'-')} · CHAT·성과는 항상 이 담임입니다.</span></div>
      ${QAPP_OVERRIDE_GUBUNS.map(g=>`
        <div class="field" style="margin-bottom:12px">
          <label>${g==='모범인증'?'문법인증':esc(g)} 담임</label>
          <input id="ov_${g}" value="${esc(cur[g])}" placeholder="비우면 파일 기준 담임 사용">
        </div>`).join('')}
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">취소</button>
      <button class="btn primary" id="ovSave">저장</button>
    </div>`);
  el('ovSave').onclick = ()=> saveTeacherOverride(classLabel);
}

function saveTeacherOverride(classLabel){
  const branchId = session.branchId, semId = state.semId;
  QAPP_OVERRIDE_GUBUNS.forEach(g=>{
    const val = (el('ov_'+g)?.value||'').trim();
    let ov = (db.teacherOverrides||[]).find(o=>o.branchId===branchId && o.semesterId===semId && o.classLabel===classLabel && o.gubun===g);
    if(val){
      if(ov){ ov.teacher = val; }
      else { (db.teacherOverrides||(db.teacherOverrides=[])).push({id:uid('ov'),branchId,semesterId:semId,classLabel,gubun:g,teacher:val}); }
    } else if(ov){
      // 비우면 오버라이드 제거
      db.teacherOverrides = db.teacherOverrides.filter(o=>o.id!==ov.id);
    }
  });
  showSaving('담임 저장 중…');
  saveDB().then(ok=>{ hideSaving(); toast(ok?'담임이 저장되었습니다':'저장 실패, 다시 시도하세요', ok?'ok':'err'); closeModal(); render(); });
}
function renderPassrateHub(){
  const semId = state.semId;
  crumbs([{label:'STaRT 시험 통과율'}]);
  const gLabel = g=> g==='모범인증'?'문법인증':g;

  const cards = (db.branches||[]).map(b=>{
    const {result} = aggregateScores(b.id, semId, {groupBy:'branch'});
    const agg = result['ALL'];
    const hasData = agg && QAPP_GUBUNS.some(g=>agg[g]&&agg[g].total);
    if(!hasData){
      return `<div style="background:var(--surface-2);border:0.5px solid #ECE7F5;border-radius:16px;padding:16px 18px;opacity:0.65">
        <div style="font-size:15px;font-weight:700;color:#2E2748;margin-bottom:2px">${esc(b.name)}</div>
        <div style="font-size:11px;color:#A99FC4;margin-bottom:14px">아직 성적 미업로드</div>
        <div style="display:flex;align-items:center;justify-content:center;height:100px;color:#C4BBDE;font-size:12px">성적 데이터가 없습니다</div>
      </div>`;
    }
    const GCOLOR = {
      'CHAT':    { bg:'linear-gradient(135deg,#F3EEFF,#EAE2FB)', label:'#7C6BB0', sub:'#B4A6E0', num:'#6B4FD6', pass:'#8A7CB8' },
      '성과':    { bg:'linear-gradient(135deg,#E8F6EF,#DDF0E6)', label:'#2E8B6B', sub:'#9BD3BC', num:'#1F9268', pass:'#6BAF97' },
      '활용':    { bg:'linear-gradient(135deg,#E9F1FC,#DEEBFA)', label:'#3D7BC0', sub:'#A4C4E8', num:'#2E6FBE', pass:'#7B9DC8' },
      '문법인증':{ bg:'linear-gradient(135deg,#FDEFF3,#FBE3EC)', label:'#C2567E', sub:'#E9AFC5', num:'#C2567E', pass:'#C88BA3' },
    };
    const cell = g=>{
      const a = agg[g]||emptyAgg();
      const rate = passRate(a);
      const c = GCOLOR[g] || GCOLOR['CHAT'];
      if(!a.total) return `<div style="background:#F5F2FC;border-radius:12px;padding:11px 13px"><div style="font-size:11px;color:#C4BBDE;margin-bottom:4px">${gLabel(g)}</div><div style="font-size:21px;font-weight:700;color:#D6CEEC">–</div></div>`;
      const passed = a.pass + a.repass;
      return `<div style="background:${c.bg};border-radius:12px;padding:11px 13px">
        <div style="font-size:11px;color:${c.label};margin-bottom:4px;font-weight:500">${gLabel(g)} <span style="color:${c.sub};font-weight:400">· 총 ${a.total.toLocaleString()}</span></div>
        <div style="display:flex;align-items:baseline;gap:6px">
          <span style="font-size:21px;font-weight:700;color:${c.num}">${rate}<span style="font-size:12px">%</span></span>
          <span style="font-size:11px;color:${c.pass}">통과 ${passed.toLocaleString()}</span>
        </div>
      </div>`;
    };
    return `<div onclick="go('passrate-hub/branch/${b.id}')" style="background:var(--surface-2);border:1px solid #ECE7F5;border-radius:18px;padding:18px 20px;cursor:pointer;transition:.18s;box-shadow:0 2px 12px rgba(124,92,255,.05)" onmouseover="this.style.borderColor='#C9B9F5';this.style.boxShadow='0 6px 20px rgba(124,92,255,.12)'" onmouseout="this.style.borderColor='#ECE7F5';this.style.boxShadow='0 2px 12px rgba(124,92,255,.05)'">
      <div style="font-size:15.5px;font-weight:700;color:#3D2E6B;margin-bottom:2px">${esc(b.name)}</div>
      <div style="font-size:11px;color:#B4A6D8;margin-bottom:14px">클릭해서 상세 보기</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${cell('CHAT')}${cell('성과')}${cell('활용')}${cell('문법인증')}
      </div>
      <div style="text-align:right;margin-top:12px;font-size:11.5px;color:#7C5CD9">상세 ›</div>
    </div>`;
  }).join('');

  el('content').innerHTML = `
    <div class="page-head"><h2>STaRT 시험 통과율</h2>
      <div class="sub">전 분원 · ${esc(db.semesters.find(s=>s.id===semId).name)} · 카드를 클릭하면 상세로 이동</div></div>
    <div style="font-size:14px;font-weight:700;color:#3D3560;margin-bottom:12px">분원별 현황</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${cards}</div>`;
}
function renderPassrate(viewBranchId){
  const isAdminView = session.role==='admin' && viewBranchId;
  const isTeacherView = session.role==='teacher';
  const tKey = isTeacherView ? teacherKey(session.teacherName) : null;
  const branchId = isAdminView ? viewBranchId : session.branchId, semId = state.semId;
  const p = passState();
  // 담임은 '내 통과율(myteacher)' + '학생별'만
  if(isTeacherView && p.view!=='myteacher' && p.view!=='student'){ p.view='myteacher'; }
  crumbs([{label:'STaRT 시험 통과율'}]);
  const scoreCount = activeScores(branchId, semId).length;

  const branchName = getBranch(branchId)?.name || '';
  const uploadZone = (isAdminView || isTeacherView) ? `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#F6F3FC;border-radius:12px;margin-bottom:18px">
      <span style="font-size:15px">👁</span>
      <span style="font-size:12px;color:#8478A8"><b style="color:#5B4B8A">${esc(branchName)}</b> · 조회 전용 · 성적 업로드는 해당 분원 계정에서 합니다</span>
      <span onclick="setPassView('branch');go('passrate-hub')" style="margin-left:auto;font-size:11.5px;color:#7C5CD9;cursor:pointer;white-space:nowrap">← 분원 목록</span>
    </div>` : `
    <label style="display:block;cursor:pointer;margin-bottom:20px">
      <div style="border:1px dashed var(--line);border-radius:14px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;background:var(--surface-2)">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:20px">📊</span>
          <div>
            <div style="font-size:13.5px;font-weight:700;color:#3D3560">Q앱 성적 엑셀 업로드</div>
            <div style="font-size:11.5px;color:#A99FC4">날짜순 누적 · 중복 자동 제거 · 퇴원생 자동 제외</div>
          </div>
        </div>
        <div style="font-size:11.5px;color:#A99FC4">현재 ${scoreCount.toLocaleString()}건 누적</div>
      </div>
      <input type="file" accept=".xlsx,.xls,.csv" style="display:none"
        onchange="if(this.files[0]){importQappScores(this.files[0]); this.value='';}">
    </label>`;

  if(scoreCount===0){
    el('content').innerHTML = `
      <div class="page-head"><h2>STaRT 시험 통과율</h2>
        <div class="sub">Q앱 성적 엑셀을 올리면 시험구분별 통과율을 분석합니다.</div></div>
      ${uploadZone}
      ${emptyState('아직 성적 데이터가 없습니다','큐앱에서 성적 조회 엑셀을 다운받아 업로드하세요. 날짜순으로 누적됩니다.')}`;
    return;
  }

  const gLabel = g=> g==='모범인증'?'문법인증':g;

  // 메인 탭
  const mainTab = (v,label)=>`<span onclick="setPassView('${v}')" style="font-size:12.5px;padding:6px 14px;border-radius:999px;cursor:pointer;${p.view===v?'background:#7C5CFF;color:#fff':'border:0.5px solid var(--line);color:#6B5D9E'}">${label}</span>`;

  // 시험구분 필터 칩 (담임별/반별/학생별에서만)
  const filterChips = ()=>{
    const chip = (g,label)=>`<span onclick="setPassGubunFilter('${g}')" style="font-size:11.5px;padding:5px 12px;border-radius:999px;cursor:pointer;${p.gubun===g?'background:#B8A6F0;color:#fff':'border:0.5px solid var(--line);color:#8A7CB8'}">${label}</span>`;
    return `<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
      ${chip('','전체')}
      ${QAPP_GUBUNS.map(g=>chip(g,gLabel(g))).join('')}
    </div>`;
  };

  let body='';

  // ===== 분원 전체 =====
  if(p.view==='branch'){
    const {result} = aggregateScores(branchId, semId, {groupBy:'branch'});
    const agg = result['ALL']||{};
    body = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${QAPP_GUBUNS.map(g=> agg[g]&&agg[g].total ? passBigCard(g, agg[g]) : '').join('')}
    </div>
    <div style="margin-top:14px;font-size:11.5px;color:#A99FC4;text-align:center">시험구분 카드를 클릭하면 그 시험 기준으로 반별을 볼 수 있습니다.</div>`;
  }

  // ===== 담임별 =====
  else if(p.view==='teacher'){
    const {result, meta} = aggregateScores(branchId, semId, {groupBy:'teacher'});
    const rows = Object.keys(result).map(k=>{
      const a = p.gubun ? result[k][p.gubun] : sumAggs(result[k]);
      return {k, a, byGubun:result[k], label:meta[k].label};
    }).filter(x=>x.a && x.a.total).sort((x,y)=>passRate(x.a)-passRate(y.a));
    body = `<div style="background:var(--surface-2);border:0.5px solid #ECE7F5;border-radius:16px;padding:6px 18px">
      ${rows.map(x=>passTeacherRow(x.label, x.a, x.byGubun, branchId)).join('')||emptyRow()}
    </div>`;
  }

  // ===== 반별 =====
  else if(p.view==='class'){
    const {result, meta} = aggregateScores(branchId, semId, {groupBy:'class', gubun:p.gubun, teacherKey:tKey});
    const rows = Object.keys(result).map(k=>({k, a: p.gubun?result[k][p.gubun]:sumAggs(result[k]), label:meta[k].label}))
      .filter(x=>x.a && x.a.total).sort((x,y)=>passRate(x.a)-passRate(y.a));
    body = `<div style="background:var(--surface-2);border:0.5px solid #ECE7F5;border-radius:16px;padding:6px 18px">
      ${rows.map(x=>passListRow(x.label,x.a,`passOpenClass('${encodeURIComponent(x.label)}')`,'')).join('')||emptyRow()}
    </div>`;
  }

  // ===== 반 → 회차별 =====
  else if(p.view==='lesson'){
    const {result, lessonLabel} = aggregateScores(branchId, semId, {groupBy:'lesson', classLabel:p.classLabel, gubun:p.gubun, teacherKey:tKey});
    const rows = Object.keys(result).map(k=>{const [g,h]=k.split('|');return {k,g,h,a:result[k][g],lesson:lessonLabel[k]};})
      .filter(x=>x.a&&x.a.total).sort((x,y)=> x.g===y.g?(parseInt(x.h)||0)-(parseInt(y.h)||0):x.g.localeCompare(y.g));
    body = `<div style="margin-bottom:14px;font-size:12.5px;color:#6B5D9E"><span onclick="setPassView('class')" style="cursor:pointer;color:#7C5CFF">← 반별</span> · <b>${esc(p.classLabel)}</b>${p.gubun?` · ${esc(gLabel(p.gubun))}`:''} · 회차별</div>
    <div style="background:var(--surface-2);border:0.5px solid #ECE7F5;border-radius:16px;padding:6px 18px">
     ${rows.map(x=>passListRow(`${gLabel(x.g)} ${x.h}회`,x.a,`passOpenLessonStudents('${encodeURIComponent(p.classLabel)}','${x.g}','${x.h}')`,`총 ${x.a.total}명 · 미통과 ${x.a.fail} · 미응시 ${x.a.noshow}${x.lesson?' · '+x.lesson:''}`)).join('')||emptyRow()}
    </div>`;
  }

  // ===== 회차 → 학생별 =====
  else if(p.view==='lessonStudent'){
    const students = passLessonStudents(branchId, semId, p.classLabel, p.lessonGubun, p.lessonHoi);
    body = `<div style="margin-bottom:14px;font-size:12.5px;color:#6B5D9E"><span onclick="passOpenClass('${encodeURIComponent(p.classLabel)}')" style="cursor:pointer;color:#7C5CFF">← 회차별</span> · <b>${esc(p.classLabel)}</b> · ${esc(gLabel(p.lessonGubun))} ${esc(p.lessonHoi)}회 · 학생별</div>
    <div style="background:var(--surface-2);border:0.5px solid #ECE7F5;border-radius:16px;padding:6px 18px">
      ${students.map(s=>passStudentStatusRow(s)).join('')||emptyRow()}
    </div>`;
  }

  // ===== 학생별 (전체) =====
  else if(p.view==='student'){
    const {result, meta} = aggregateStudents(branchId, semId, {teacherKey:tKey});
    const rows = Object.keys(result).map(k=>({k, a: sumAggs(result[k]), byGubun:result[k], label:meta[k].label}))
      .filter(x=>x.a && x.a.total).sort((x,y)=>(y.a.fail+y.a.noshow)-(x.a.fail+x.a.noshow));
   const q = (state.passStudentSearch||'').trim();
    const filtered = q ? rows.filter(x=>x.label.includes(q)) : rows;
    body = `<div style="margin-bottom:14px">
      <input id="passStuSearch" value="${esc(q)}" placeholder="학생 이름 검색"
        oninput="state.passStudentSearch=this.value; window._pssPos=this.selectionStart; clearTimeout(window._pss); window._pss=setTimeout(render,300)"
        style="width:100%;padding:10px 14px;border:1px solid var(--line);border-radius:10px;font-size:14px">
    </div>
    <div style="background:var(--surface-2);border:0.5px solid #ECE7F5;border-radius:16px;padding:6px 18px">
      ${filtered.map(x=>passStudentRow(x.k, x.label, x.a, branchId)).join('')||emptyRow()}
    </div>`;
 }

  // ===== 담임 전용: 내 통과율 (passTeacherRow 강제 펼침) =====
  else if(p.view==='myteacher'){
    // 자기 담임 걸 강제로 열어둠
    const myName = session.teacherName;
    state.passOpenTeachers = state.passOpenTeachers || {};
    state.passOpenTeachers[myName] = true;
    const {result, meta} = aggregateScores(branchId, semId, {groupBy:'teacher', teacherKey:tKey});
    // 내 키에 해당하는 result 찾기
    const myK = Object.keys(result).find(k=>teacherKey(meta[k].label)===tKey) || Object.keys(result)[0];
    if(myK){
      const sortAgg = sumAggs(result[myK]);
      body = `<div style="background:var(--surface-2);border:0.5px solid #ECE7F5;border-radius:16px;padding:6px 18px">
        ${passTeacherRow(meta[myK].label, sortAgg, result[myK], branchId)}
      </div>`;
    } else {
      body = emptyState('아직 성적 데이터가 없습니다','담당 반의 Q앱 성적이 업로드되면 통과율이 표시됩니다.');
    }
  }

  el('content').innerHTML = `
    <div class="page-head"><h2>STaRT 시험 통과율</h2>
      <div class="sub">${esc(db.semesters.find(s=>s.id===semId).name)} · Q앱 성적 기준</div></div>
    ${uploadZone}
   <div style="display:flex;gap:6px;margin-bottom:18px">
      ${isTeacherView ? mainTab('myteacher','내 통과율') : mainTab('branch','분원 전체')}
      ${isTeacherView ? '' : mainTab('teacher','담임별')}
      ${isTeacherView ? '' : mainTab('class','반별')}
      ${mainTab('student', isTeacherView?'내 학생':'학생별')}
    </div>
  ${body}`;

  // 검색창 포커스 복원
  if(p.view==='student'){
    const inp = el('passStuSearch');
    if(inp && document.activeElement!==inp && (state.passStudentSearch||'')!==''){
      inp.focus();
      const pos = window._pssPos ?? inp.value.length;
      try{ inp.setSelectionRange(pos,pos); }catch(e){}
    }
  }
}

function emptyRow(){ return '<div style="padding:20px;text-align:center;color:#A99FC4">데이터 없음</div>'; }
/* ========================================================================
   STaRT 시험 통과율 — 업로드 파서
   ======================================================================== */
function importQappScores(file){
  readTable(file, async rows=>{
    if(rows.length<2){ toast('데이터가 없습니다','err'); return; }
    const HDR = {
      code:['학생코드','회원코드','코드'],
      name:['학생이름','이름','학생명'],
      cls:['수강반','반'],
      teacher:['담임선생님','담임','선생님'],
      hoi:['회차'],
      gubun:['시험구분'],
      lesson:['단원명','단원','레슨'],
      book:['교재명','교재'],
      date:['시험일자','시험일','일자'],
      baejeom:['배점'],
      jumsu:['점수'],
      eungsi:['응시'],
      tonggwa:['통과'],
      yeyak:['예약일/시간','예약','예약일'],
    };
    let idx=null;
    for(let i=0;i<Math.min(3,rows.length-1);i++){
      const cand = mapHeader(rows[i].map(h=>String(h).trim()), HDR);
      if(cand.code>=0 && cand.gubun>=0 && cand.tonggwa>=0){ idx=cand; rows=rows.slice(i); break; }
    }
    if(!idx){ toast('학생코드·시험구분·통과 열을 찾지 못했습니다','err'); return; }

    const branchId = session.branchId, semId = state.semId;
    const existing = new Set((db.qappScores||[])
      .filter(s=>s.branchId===branchId && s.semesterId===semId)
      .map(s=>s.fingerprint));

    let added=0, dup=0, noCode=0;
    const g = (r,k)=> idx[k]>=0 ? String(r[idx[k]]??'').trim() : '';

    rows.slice(1).forEach(r=>{
      const code = g(r,'code');
      if(!code){ noCode++; return; }
      const gubun = g(r,'gubun');
      if(!QAPP_GUBUNS.includes(gubun)) return;

      const rec = {
        studentCode: code,
        studentName: g(r,'name'),
        classLabel:  g(r,'cls'),
        gubun,
        hoi:      g(r,'hoi'),
        lesson:   g(r,'lesson'),
        textbook: g(r,'book'),
        teacher:  g(r,'teacher'),
        jumsu:    parseFloat(g(r,'jumsu'))||0,
        baejeom:  parseFloat(g(r,'baejeom'))||0,
        eungsi:   g(r,'eungsi'),
        tonggwa:  g(r,'tonggwa'),
        yeyak:    g(r,'yeyak'),
        examDate: g(r,'date'),
      };
      const fp = [code,gubun,rec.hoi,rec.examDate,rec.jumsu,rec.eungsi,rec.tonggwa].join('~');
      if(existing.has(fp)){ dup++; return; }
      existing.add(fp);
      rec.id = uid('qs');
      rec.branchId = branchId;
      rec.semesterId = semId;
      rec.fingerprint = fp;
      (db.qappScores || (db.qappScores=[])).push(rec);
      added++;
    });

    showSaving('성적 저장 중… (잠시만요)');
    const ok = await saveDB();
    hideSaving();
    if(ok) toast(`✅ 성적 ${added}건 추가${dup?`, 중복 ${dup}`:''}${noCode?`, 코드없음(퇴원) ${noCode}`:''}`,'ok');
    else toast('❌ 저장 실패 — 다시 업로드해 주세요','err');
    render();
  });
}
/* ---- 메인 렌더 ---- */
async function renderStart(){
  crumbs([{label:'STaRT 외출·시험 관리'}]);
  if(!startState.viewDate) startState.viewDate = startTodayStr();
 
  el('content').innerHTML = `
    <div class="page-head" style="display:flex;align-items:flex-end;justify-content:space-between">
      <div>
        <h2>STaRT 외출·시험 관리</h2>
        <div class="sub">${esc(getBranch(session.branchId)?.name||'')} · 시험 10분 · 외출 15분 · 실시간 공유</div>
      </div>
      <button class="btn sm" id="stLogBtn">📋 기록 보기</button>
    </div>
 
    <div class="panel" style="margin-bottom:16px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="st-modetog" id="stModeTog">
          <button type="button" data-mode="exam" class="st-mode-btn"><i class="ti ti-pencil"></i> 시험</button>
          <button type="button" data-mode="outing" class="st-mode-btn active"><i class="ti ti-walk"></i> 외출</button>
        </div>
        <select id="stMin" onchange="startOnMinChange()" class="st-inp" style="width:110px">
          <option value="__auto__" selected>기본 시간</option>
          <option value="10">10분</option><option value="15">15분</option>
          <option value="20">20분</option><option value="30">30분</option>
          <option value="__custom__">직접 입력</option>
        </select>
        <input id="stMinCustom" type="number" min="1" max="180" placeholder="분" class="st-inp" style="width:80px;display:none">
        <div style="position:relative;flex:1;min-width:240px">
          <input id="stInput" placeholder="이름 또는 회원코드 입력 후 Enter" autocomplete="off" class="st-inp" style="width:100%">
          <div id="stAc" class="wd-results" style="display:none;position:absolute;top:44px;left:0;right:0;z-index:50;max-height:300px;overflow-y:auto"></div>
        </div>
        <button class="btn primary" id="stAddBtn">등록</button>
        <button class="btn" id="stMuteBtn" title="소리">🔊</button>
        <button class="btn" id="stPermBtn">알림 허용</button>
      </div>
      <div id="stPermHint" style="margin-top:8px;font-size:12px;color:var(--warn);display:none">
        다른 창을 봐도 알림을 받으려면 <b>알림 허용</b>을 눌러주세요. (컴퓨터마다 한 번씩)
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--ink-3)">
        키보드 — 이름 입력 후 <b>↑↓</b> 학생 선택 · <b>Enter</b> 등록 · <b>←→</b> 시험/외출 전환
      </div>
    </div>
 
    <div class="st-columns">
      <div class="st-col st-col-exam">
        <div class="st-col-head"><i class="ti ti-pencil"></i><span>시험</span><span id="stExamCount" class="st-col-cnt">0</span></div>
        <div id="stExamOver" class="st-list st-over-zone"></div>
        <div id="stExamNormal" class="st-list"></div>
        <div id="stExamEmpty" class="st-empty">진행 중인 시험이 없습니다</div>
      </div>
      <div class="st-col st-col-outing">
        <div class="st-col-head"><i class="ti ti-walk"></i><span>외출</span><span id="stOutCount" class="st-col-cnt">0</span></div>
        <div id="stOutOver" class="st-list st-over-zone"></div>
        <div id="stOutNormal" class="st-list"></div>
        <div id="stOutEmpty" class="st-empty">외출 중인 학생이 없습니다</div>
      </div>
    </div>`;
 
  startInjectStyles();
  startBindUI();
  await startLoadSessions(startState.viewDate);
  startSubscribe();
  startStartTicker();
  startRefreshPermHint();
  el('stInput').focus();
}
 
/* ---- 카드(줄) 렌더 ---- */
function startRenderCards(){
  const zones={ examOver:el('stExamOver'), examNormal:el('stExamNormal'),
                outOver:el('stOutOver'), outNormal:el('stOutNormal') };
  if(!zones.examNormal) return;
  const now=new Date();
  const b={examOver:[],examNormal:[],outOver:[],outNormal:[]};
  startState.active.forEach(a=>{
    const elapsed=Math.floor((now-new Date(a.leftAt))/1000);
    const over=elapsed>=a.limitSec;
    const key=(a.kind==='exam'?'exam':'out')+(over?'Over':'Normal');
    b[key].push(a);
  });
  Object.keys(zones).forEach(k=> zones[k].innerHTML=b[k].map(startRowHTML).join(''));
  const exam=b.examOver.length+b.examNormal.length;
  const out=b.outOver.length+b.outNormal.length;
  el('stExamCount').textContent=exam;
  el('stOutCount').textContent=out;
  el('stExamEmpty').style.display=exam?'none':'block';
  el('stOutEmpty').style.display=out?'none':'block';
  startTick();
}
function startRowHTML(a){
  const meta=[a.cls,a.teacher].filter(Boolean).join(' · ');
  return `<div class="st-row" data-id="${a.id}">
    <div class="st-row-info">
      <div class="st-row-name">${esc(a.name)}<span class="st-row-badge">초과</span></div>
      <div class="st-row-meta">${esc(meta||'—')} · 시작 ${startHM(a.leftAt)}</div>
    </div>
    <div class="st-row-timer">00:00</div>
    <div class="st-row-acts">
     <button class="st-mini ret" onclick="startReturn('${a.id}')" title="${a.kind==='exam'?'시험완료':'복귀'}"><i class="ti ti-check"></i></button>
      <button class="st-mini can" onclick="startCancel('${a.id}')" title="취소"><i class="ti ti-x"></i></button>
    </div>
  </div>`;
}
function startStartTicker(){ if(startState.ticker) clearInterval(startState.ticker); startState.ticker=setInterval(startTick,1000); }
function startTick(){
  const now=new Date(); let reflow=false;
  startState.active.forEach(a=>{
    const elapsed=Math.floor((now-new Date(a.leftAt))/1000);
    const remain=a.limitSec-elapsed;
    const isOver=remain<=0;
    if(a._over!==isOver){ a._over=isOver; reflow=true; }
    const row=document.querySelector(`.st-row[data-id="${a.id}"]`);
    if(!row) return;
    const t=row.querySelector('.st-row-timer');
    if(remain>0){
      t.textContent=startDur(remain);
      t.style.color=remain<=180?'var(--warn)':'var(--pos)';
      row.classList.remove('over');
    } else {
      t.textContent='+'+startDur(elapsed-a.limitSec);
      t.style.color='#fff';
      row.classList.add('over');
      if(!a.alarmed && !a.alarmCleared){ a.alarmed=true; startFireAlarm(a); }
    }
  });
  if(reflow) startRenderCards();
}
 
/* ---- 기록 팝업 ---- */
function startOpenLogModal(){
  const rows=startState.logRows;
  const body=rows.length? rows.map(r=>{
    const el2=r.returnedAt?Math.round((new Date(r.returnedAt)-new Date(r.leftAt))/1000):null;
    const over=el2!=null&&el2>r.limitSec;
    const k=r.kind==='exam'?'시험':'외출';
    return `<tr><td>${k}</td><td>${esc(r.name)}</td><td>${esc(r.cls||'—')}</td><td>${esc(r.teacher||'—')}</td>
      <td class="num">${startHM(r.leftAt)}</td><td class="num">${r.returnedAt?startHM(r.returnedAt):'—'}</td>
      <td class="num">${el2!=null?startDur(el2):'—'}</td>
      <td style="font-weight:700;color:${over?'var(--neg)':'var(--pos)'}">${over?'초과':'정상'}</td>
      <td class="cc"><button class="btn sm" style="color:var(--neg)" onclick="startDeleteLog('${r.id}')">삭제</button></td></tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--ink-3)">기록이 없습니다</td></tr>`;
 
  openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h3 style="font-size:16px;font-weight:800">기록 <span style="color:var(--ink-3);font-weight:500">${rows.length}명</span></h3>
      <div style="display:flex;gap:10px;align-items:center">
        <input type="date" id="stDate" value="${startState.viewDate}" class="st-inp" style="height:34px">
        <button class="btn sm" id="stCsvBtn">CSV</button>
      </div>
    </div>
    <div class="table-wrap"><div class="table-scroll" style="max-height:60vh">
      <table class="grid">
        <thead><tr><th>구분</th><th>이름</th><th>반</th><th>담임</th><th>시작</th><th>복귀</th><th>소요</th><th>결과</th><th></th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div></div>`, {wide:true});
 
  const d=el('stDate'); if(d) d.onchange=()=>{ startState.viewDate=d.value; startLoadSessions(startState.viewDate).then(()=>startOpenLogModal()); };
  const c=el('stCsvBtn'); if(c) c.onclick=startDownloadCSV;
}
 
/* ---- 이벤트 바인딩 ---- */
function startBindUI(){
  const input=el('stInput');
  input.addEventListener('input', startOnInput);
  input.addEventListener('keydown', startOnKeydown);
  el('stAddBtn').onclick=()=>{
    const m=startFindStudents(input.value);
    if(m.length===1) startAdd(m[0]);
    else if(m.length>1){ startOnInput(); toast('여러 명 검색됨 — ↑↓로 선택'); }
    else toast('일치하는 학생이 없습니다','err');
  };
  el('stMuteBtn').onclick=()=>{ startState.muted=!startState.muted; el('stMuteBtn').textContent=startState.muted?'🔇':'🔊'; };
  el('stPermBtn').onclick=startAskPerm;
  el('stLogBtn').onclick=startOpenLogModal;
  el('stModeTog').querySelectorAll('.st-mode-btn').forEach(btn=> btn.onclick=()=>startSetMode(btn.dataset.mode));
  document.addEventListener('click', startDocClick);
}
function startSetMode(mode){
  startMode=mode;
  const tog=el('stModeTog'); if(!tog) return;
  tog.querySelectorAll('.st-mode-btn').forEach(b=> b.classList.toggle('active', b.dataset.mode===mode));
}
function startDocClick(e){
  const ac=el('stAc'), input=el('stInput'); if(!ac||!input) return;
  if(e.target!==input && !ac.contains(e.target)) ac.style.display='none';
}
function startOnInput(){
  const q=el('stInput').value, box=el('stAc');
  if(!q.trim()){ box.style.display='none'; startAcList=[]; startAcSel=-1; return; }
  startAcList=startFindStudents(q); startAcSel=-1;
  if(!startAcList.length){ box.innerHTML=`<div class="wd-empty">일치하는 학생이 없습니다</div>`; box.style.display='block'; return; }
  box.innerHTML=startAcList.map((s,i)=>{
    const info=startStudentInfo(s);
    const meta=[info.cls,info.teacher,info.code].filter(Boolean).join(' · ');
    return `<div class="wd-item" data-i="${i}"><div class="wd-main"><span class="wd-name">${esc(s.name)}</span></div><div class="wd-meta">${esc(meta)}</div></div>`;
  }).join('');
  box.querySelectorAll('.wd-item').forEach(it=> it.onclick=()=> startAdd(startAcList[parseInt(it.dataset.i,10)]));
  box.style.display='block';
}
function startOnKeydown(e){
  const box=el('stAc');
  const open = box.style.display==='block' && startAcList.length>0;
  if(e.key==='ArrowDown'){ if(open){ e.preventDefault(); startAcSel=Math.min(startAcSel+1,startAcList.length-1); startUpdateAcSel(); } return; }
  if(e.key==='ArrowUp'){ if(open){ e.preventDefault(); startAcSel=Math.max(startAcSel-1,0); startUpdateAcSel(); } return; }
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    // 입력창이 비어있을 때만 시험/외출 전환 (글자 있으면 커서 이동 방해 안 함)
    if(!el('stInput').value){ e.preventDefault(); startSetMode(startMode==='exam'?'outing':'exam'); }
    return;
  }
  if(e.key==='Enter'){
    e.preventDefault();
    if(open && startAcSel>=0){ startAdd(startAcList[startAcSel]); return; }
    const m=startFindStudents(el('stInput').value);
    if(m.length===1) startAdd(m[0]);
    else if(m.length>1) startOnInput();
    else toast('일치하는 학생이 없습니다','err');
    return;
  }
  if(e.key==='Escape'){ box.style.display='none'; }
}
function startUpdateAcSel(){
  el('stAc').querySelectorAll('.wd-item').forEach((it,i)=>{
    it.classList.toggle('sel', i===startAcSel);
    if(i===startAcSel) it.scrollIntoView({block:'nearest'});
  });
}
 
/* ---- 스타일 ---- */
function startInjectStyles(){
  const old=document.getElementById('stV3Style'); if(old) old.remove();
  if(document.getElementById('stV4Style')) return;
  const st=document.createElement('style'); st.id='stV4Style';
  st.textContent=`
    .st-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .st-col{border-radius:14px;padding:12px}
    .st-col-exam{background:#F4F8FD;border:1px solid #D3E4F5}
    .st-col-outing{background:#F3FAF6;border:1px solid #C9E9DC}
    .st-col-head{display:flex;align-items:center;gap:8px;padding:2px 4px 12px;margin-bottom:12px;font-size:16px;font-weight:800;border-bottom:1px solid rgba(0,0,0,.06)}
    .st-col-exam .st-col-head{color:#0C447C}.st-col-exam .st-col-head i{color:#185FA5}
    .st-col-outing .st-col-head{color:#085041}.st-col-outing .st-col-head i{color:#0F6E56}
    .st-col-cnt{margin-left:auto;font-size:13px;font-weight:700;border-radius:999px;padding:2px 10px}
    .st-col-exam .st-col-cnt{background:#E6F1FB;color:#185FA5}
    .st-col-outing .st-col-cnt{background:#E1F5EE;color:#0F6E56}
    .st-list{display:flex;flex-direction:column;gap:8px}
    .st-over-zone{margin-bottom:0}
    .st-over-zone:not(:empty){margin-bottom:8px}
    .st-empty{text-align:center;color:var(--ink-3);font-size:13px;padding:24px 0}
    .st-row{display:flex;align-items:center;gap:12px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:9px 12px}
    .st-row-info{flex:1;min-width:0}
    .st-row-name{font-size:16px;font-weight:700;color:var(--ink-1);display:flex;align-items:center;gap:6px}
    .st-row-badge{display:none;font-size:11px;font-weight:800;color:#fff;background:var(--neg);border-radius:5px;padding:1px 7px}
    .st-row-meta{font-size:12px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .st-row-timer{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--pos);letter-spacing:-.5px;min-width:64px;text-align:right}
    .st-row-acts{display:flex;gap:6px}
    .st-mini{height:32px;padding:0 12px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap}
    .st-mini.ret{background:var(--brand);color:#fff}
    .st-mini.can{background:var(--surface-1);color:var(--ink-3);border:1px solid var(--line)}
    .st-row.over{background:#FCEEEE;border-color:var(--neg);animation:stFlash .9s infinite}
    .st-row.over .st-row-badge{display:inline-block}
    @keyframes stFlash{0%,100%{background:#FCEEEE}50%{background:#f7dede}}
    .st-inp{height:40px;padding:0 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2);font-size:15px}
    .st-modetog{display:inline-flex;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);overflow:hidden;height:40px}
    .st-mode-btn{border:none;background:transparent;padding:0 16px;font-size:15px;font-weight:700;color:var(--ink-3);cursor:pointer;display:flex;align-items:center;gap:6px}
    .st-mode-btn.active{background:var(--brand);color:#fff}
    #stOverlay{position:fixed;inset:0;z-index:9999;background:#1a1416;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;animation:stOvIn .25s ease-out}
    @keyframes stOvIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
    #stOverlay::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:#c0392b}
    .st-ov-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(192,57,43,.15);border:1px solid rgba(192,57,43,.5);border-radius:999px;padding:7px 18px;margin-bottom:28px;font-size:14px;font-weight:500;color:#e8a0a0;letter-spacing:2px}
    .st-ov-names{display:flex;flex-direction:column;gap:14px;margin-bottom:28px}
    .st-ov-row{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}
    .st-ov-name{font-size:52px;font-weight:500;color:#fff;line-height:1;letter-spacing:-1px}
    .st-ov-over{font-size:15px;font-weight:500;color:#1a1416;background:#e74c3c;border-radius:8px;padding:5px 12px}
    .st-ov-sub{font-size:16px;color:rgba(255,255,255,.6);margin-bottom:32px}
    .st-ov-btn{background:#fff;color:#1a1416;border:none;border-radius:12px;font-size:17px;font-weight:500;padding:14px 48px;cursor:pointer}
    .st-ov-btn:hover{opacity:.9}
    @media(max-width:900px){.st-columns{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
}
/* ============================================================================
   STaRT 헬퍼 함수 (복구) — app.js 아무 데나(함수 밖) 붙여넣기
   ============================================================================ */

/* 반 원본(class_name)에서 레벨코드만: "[PA2]SU3/MWF/..." -> "PA2" */
function startLevelOf(raw){
  const m = String(raw||'').match(/^\s*\[([A-Za-z]+[0-9]*)/);
  return m ? m[1] : '';
}
/* class_label의 · 앞부분 (예: "월수금 3부") */
function startTimeLabelOf(label){
  if(!label) return '';
  const p = String(label).split('·');
  return p[0] ? p[0].trim() : '';
}
/* 현재 학기 이 분원의 학생 → {level, timeLabel, teacher} 매핑 */
function startRecMap(){
  const branchId = session.branchId, semId = state.semId;
  const map = new Map();
  db.semesterRecords
    .filter(r=>r.branchId===branchId && r.semesterId===semId)
    .forEach(r=>{
      const prev = map.get(r.studentId);
      if(prev && prev.status==='active' && r.status!=='active') return;
      map.set(r.studentId, {
        level: startLevelOf(r.className),
        timeLabel: startTimeLabelOf(r.classLabel),
        teacher: r.teacher||'',
        status: r.status,
      });
    });
  return map;
}
/* 학생 검색 (이름/회원코드) — 이 분원 명단 안에서만 */
function startFindStudents(query){
  const q = query.trim().toLowerCase();
  if(!q) return [];
  const branchId = session.branchId, semId = state.semId;
  const myStudentIds = new Set(
    db.semesterRecords.filter(r=>r.branchId===branchId && r.semesterId===semId).map(r=>r.studentId)
  );
  return db.students
    .filter(s=> myStudentIds.has(s.id) &&
      ((s.name||'').toLowerCase().includes(q) || (s.code||'').toLowerCase().includes(q)))
    .slice(0,8);
}
function startStudentInfo(stu){
  const rec = startRecMap().get(stu.id) || {};
  const cls = [rec.timeLabel, rec.level].filter(Boolean).join(' ');
  return { id:stu.id, code:stu.code, name:stu.name, cls, teacher:rec.teacher||'' };
}

/* ---- 시간 헬퍼 ---- */
function startPad(n){ return String(n).padStart(2,'0'); }
function startTodayStr(){ const d=new Date(); return `${d.getFullYear()}-${startPad(d.getMonth()+1)}-${startPad(d.getDate())}`; }
function startHM(iso){ const d=new Date(iso); return `${startPad(d.getHours())}:${startPad(d.getMinutes())}`; }
function startDur(sec){ const neg=sec<0; sec=Math.abs(sec); return (neg?'-':'')+startPad(Math.floor(sec/60))+':'+startPad(sec%60); }
 function startAskPerm(){
  if(!('Notification' in window)){ toast('이 브라우저는 알림을 지원하지 않습니다','err'); return; }
  Notification.requestPermission().then(p=>{
    startRefreshPermHint();
    if(p==='granted') toast('알림이 허용되었습니다','ok');
    else toast('알림이 차단됨 — 주소창 자물쇠 아이콘에서 허용하세요','err');
  });
}
function startRefreshPermHint(){
  const hint=el('stPermHint'); if(!hint) return;
  hint.style.display = (('Notification' in window)&&Notification.permission==='default')?'block':'none';
} 
/* ---- 데이터 로드 ---- */
async function startLoadSessions(dateStr){
  if(!sb){ try{ initSupabase(); }catch(e){ console.error(e); return; } }
  const { data, error } = await sb.from('start_sessions').select('*')
    .eq('branch_id', session.branchId).eq('date', dateStr)
    .order('left_at', { ascending:false });
  if(error){ console.error(error); toast('기록 로드 실패','err'); return; }
  const rows=(data||[]).map(startFromRow);
  startState.active = rows.filter(r=>r.status==='out');
  startState.logRows = rows.filter(r=>r.status==='returned');
  startRenderCards(); startSyncOverlay();
}
function startFromRow(r){
  return { id:r.id, studentId:r.student_id, name:r.name, cls:r.cls, teacher:r.teacher,
    leftAt:r.left_at, returnedAt:r.returned_at, limitSec:r.limit_sec, status:r.status,
    date:r.date, kind:r.kind||'outing', alarmCleared:!!r.alarm_cleared, alarmed:false, _over:false };
}
 
/* ---- 기본 시간(모드별) ---- */
function startLimitSec(){
  const sel=el('stMin');
  if(!sel) return startMode==='exam'?600:900;
  if(sel.value==='__auto__') return startMode==='exam'?600:900;
  if(sel.value==='__custom__'){ const m=parseInt(el('stMinCustom').value,10); return (m>0?m:(startMode==='exam'?10:15))*60; }
  return parseInt(sel.value,10)*60;
}
function startOnMinChange(){
  const sel=el('stMin'), cust=el('stMinCustom');
  cust.style.display=(sel.value==='__custom__')?'inline-block':'none';
  if(sel.value==='__custom__') cust.focus();
}
 
/* ---- 등록 ---- */
async function startAdd(stu){
  const info=startStudentInfo(stu);
  if(startState.active.some(a=>a.studentId===stu.id)){ toast(`${info.name} 학생은 이미 진행 중입니다`,'err'); return; }
  const limitSec=startLimitSec();
  const row={ branch_id:session.branchId, date:startTodayStr(), student_id:stu.id,
    name:info.name, cls:info.cls, teacher:info.teacher, left_at:new Date().toISOString(),
    returned_at:null, limit_sec:limitSec, status:'out', kind:startMode, alarm_cleared:false, by_user:session.username };
  const { data, error } = await sb.from('start_sessions').insert(row).select().single();
  if(error){ console.error(error); toast('등록 실패 — 다시 시도하세요','err'); return; }
  if(!startState.active.some(a=>a.id===data.id)){ startState.active.unshift(startFromRow(data)); startRenderCards(); }
  el('stInput').value=''; el('stAc').style.display='none'; el('stInput').focus();
  startUnlockAudio();
}
async function startReturn(id){
  const a=startState.active.find(x=>x.id===id); if(!a) return;
  const ret=new Date().toISOString();
  const { error } = await sb.from('start_sessions').update({ status:'returned', returned_at:ret }).eq('id', id);
  if(error){ console.error(error); toast('처리 실패','err'); return; }
  a.returnedAt=ret; a.status='returned';
  startState.active=startState.active.filter(x=>x.id!==id);
  startState.logRows.unshift(a);
  startRenderCards(); startSyncOverlay();
}
async function startCancel(id){
  const { error } = await sb.from('start_sessions').delete().eq('id', id);
  if(error){ console.error(error); toast('취소 실패','err'); return; }
  startState.active=startState.active.filter(x=>x.id!==id);
  startRenderCards(); startSyncOverlay();
}
async function startDeleteLog(id){
  const r=startState.logRows.find(x=>x.id===id); if(!r) return;
  if(!confirm(`${r.name} 학생의 이 기록을 삭제할까요?`)) return;
  const { error } = await sb.from('start_sessions').delete().eq('id', id);
  if(error){ console.error(error); toast('삭제 실패','err'); return; }
  startState.logRows=startState.logRows.filter(x=>x.id!==id);
  toast('기록 삭제됨','ok');
  if(document.getElementById('modalOverlay') && document.getElementById('modalOverlay').style.display!=='none') startOpenLogModal();
}
 
/* ---- 경고 공유: 한 명이 확인하면 모두 꺼짐 ---- */
async function startClearAlarm(){
  const now=new Date();
  const overIds=startState.active.filter(a=>{ const e=Math.floor((now-new Date(a.leftAt))/1000); return e>=a.limitSec; }).map(a=>a.id);
  startCloseOverlay();
  if(!overIds.length) return;
  const { error } = await sb.from('start_sessions').update({ alarm_cleared:true }).in('id', overIds);
  if(error){ console.error(error); return; }
  overIds.forEach(id=>{ const a=startState.active.find(x=>x.id===id); if(a) a.alarmCleared=true; });
}
 
/* ---- 실시간 ---- */
function startSubscribe(){
  if(startState.channel) sb.removeChannel(startState.channel);
  startState.channel=sb.channel('start_'+session.branchId)
    .on('postgres_changes', { event:'*', schema:'public', table:'start_sessions', filter:`branch_id=eq.${session.branchId}` },
      payload=>startHandleRealtime(payload))
    .subscribe();
}
function startHandleRealtime(payload){
  if(payload.eventType==='DELETE'){
    const oldId=payload.old && payload.old.id; if(!oldId) return;
    startState.active=startState.active.filter(a=>a.id!==oldId);
    startState.logRows=startState.logRows.filter(l=>l.id!==oldId);
    startRenderCards(); startSyncOverlay();
    if(document.getElementById('modalOverlay') && document.getElementById('modalOverlay').style.display!=='none') startOpenLogModal();
    return;
  }
  const row=payload.new;
  if(!row || row.date!==startState.viewDate) return;
  if(payload.eventType==='INSERT'){
    const r=startFromRow(payload.new);
    if(r.status==='out' && !startState.active.some(a=>a.id===r.id)){ startState.active.unshift(r); startRenderCards(); startSyncOverlay(); }
  } else if(payload.eventType==='UPDATE'){
    const r=startFromRow(payload.new);
    if(r.status==='returned'){
      startState.active=startState.active.filter(a=>a.id!==r.id);
      if(!startState.logRows.some(l=>l.id===r.id)) startState.logRows.unshift(r);
      startRenderCards(); startSyncOverlay(); return;
    }
    const cur=startState.active.find(a=>a.id===r.id);
    if(cur){ cur.alarmCleared=r.alarmCleared; startSyncOverlay(); }
  }
}
 
/* ---- 초과 알림 ---- */
function startFireAlarm(a){
  startBeep();
  startSystemNotify(a.name, a.limitSec);
  startShowOverlay();
}
function startSystemNotify(name, limitSec){
  if(!('Notification' in window) || Notification.permission!=='granted') return;
  try{
    const n=new Notification('STaRT 시간 초과', {
      body:`${name} 학생이 ${Math.round(limitSec/60)}분을 넘겼습니다. 복귀 확인이 필요합니다.`,
      tag:'start-'+name+'-'+Date.now(), requireInteraction:true });
    n.onclick=()=>{ window.focus(); n.close(); };
  }catch(e){ console.warn(e); }
}
let startAudioCtx=null;
function startUnlockAudio(){ if(startAudioCtx && startAudioCtx.state==='suspended') startAudioCtx.resume(); }
function startBeep(){
  if(startState.muted) return;
  try{
    startAudioCtx=startAudioCtx||new (window.AudioContext||window.webkitAudioContext)();
    let t=startAudioCtx.currentTime;
    for(let i=0;i<3;i++){
      const o=startAudioCtx.createOscillator(),g=startAudioCtx.createGain();
      o.connect(g);g.connect(startAudioCtx.destination);
      o.type='square';o.frequency.value=i%2?660:880;
      g.gain.setValueAtTime(0.001,t);g.gain.exponentialRampToValueAtTime(0.25,t+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.3);
      o.start(t);o.stop(t+0.32);t+=0.34;
    }
  }catch(e){}
}
 
/* ---- 오버레이 ---- */
function startShowOverlay(){
  let ov=document.getElementById('stOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='stOverlay';
    ov.innerHTML=`<div class="st-ov-inner">
      <div class="st-ov-tag"><i class="ti ti-clock-exclamation" style="font-size:18px"></i>시간 초과</div>
      <div class="st-ov-names" id="stOvNames"></div>
      <div class="st-ov-sub">복귀 확인이 필요합니다</div>
      <button class="st-ov-btn" onclick="startClearAlarm()">확인했습니다</button>
    </div>`;
    document.body.appendChild(ov);
  }
  startUpdateOverlay();
  ov.style.display='flex';
}
function startUpdateOverlay(){
  const box=document.getElementById('stOvNames'); if(!box) return;
  const now=new Date();
  const over=startState.active.filter(a=>{ const e=Math.floor((now-new Date(a.leftAt))/1000); return e>=a.limitSec && !a.alarmCleared; });
  if(!over.length){ startCloseOverlay(); return; }
  box.innerHTML=over.map(a=>{
    const e=Math.floor((now-new Date(a.leftAt))/1000);
    const k=a.kind==='exam'?'시험':'외출';
    return `<div class="st-ov-row"><span class="st-ov-name">${esc(a.name)}</span><span class="st-ov-over">${k} +${startDur(e-a.limitSec)}</span></div>`;
  }).join('');
}
function startCloseOverlay(){ const ov=document.getElementById('stOverlay'); if(ov) ov.style.display='none'; }
function startSyncOverlay(){
  const now=new Date();
  const anyOver=startState.active.some(a=>{ const e=Math.floor((now-new Date(a.leftAt))/1000); return e>=a.limitSec && !a.alarmCleared; });
  if(anyOver) startShowOverlay(); else startCloseOverlay();
}
 
/* ---- CSV ---- */
function startDownloadCSV(){
  if(!startState.logRows.length){ toast('기록이 없습니다','err'); return; }
  const rows=[['구분','이름','반','담임','시작','복귀','소요(분:초)','제한(분)','결과']];
  startState.logRows.slice().reverse().forEach(r=>{
    const elp=r.returnedAt?Math.round((new Date(r.returnedAt)-new Date(r.leftAt))/1000):null;
    const over=elp!=null && elp>r.limitSec;
    rows.push([r.kind==='exam'?'시험':'외출', r.name, r.cls||'', r.teacher||'', startHM(r.leftAt),
      r.returnedAt?startHM(r.returnedAt):'', elp!=null?startDur(elp):'', Math.round(r.limitSec/60), over?'초과':'정상']);
  });
  const csv='\uFEFF'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`STaRT_${getBranch(session.branchId)?.name||session.branchId}_${startState.viewDate}.csv`;
  a.click();
}
function startRowHTML(a){
  const meta=[a.cls,a.teacher].filter(Boolean).join(' · ');
  const doneLabel = a.kind==='exam' ? '시험완료' : '복귀';
  return `<div class="st-row" data-id="${a.id}">
    <div class="st-row-info">
      <div class="st-row-name">${esc(a.name)}<span class="st-row-badge">초과</span></div>
      <div class="st-row-meta">${esc(meta||'—')} · 시작 ${startHM(a.leftAt)}</div>
    </div>
    <div class="st-row-timer">00:00</div>
    <div class="st-row-acts">
      <button class="st-mini ret" onclick="startReturn('${a.id}')">${doneLabel}</button>
      <button class="st-mini can" onclick="startCancel('${a.id}')">취소</button>
    </div>
  </div>`;
}
 
function startOnKeydown(e){
  const box=el('stAc');
  const open = box && box.style.display==='block' && startAcList.length>0;
  if(e.key==='ArrowDown'){
    if(open){ e.preventDefault(); startAcSel=Math.min(startAcSel+1,startAcList.length-1); startUpdateAcSel(); }
    return;
  }
  if(e.key==='ArrowUp'){
    if(open){ e.preventDefault(); startAcSel=Math.max(startAcSel-1,0); startUpdateAcSel(); }
    return;
  }
  if(e.key==='ArrowLeft' || e.key==='ArrowRight'){
    if(!el('stInput').value){ e.preventDefault(); startSetMode(startMode==='exam'?'outing':'exam'); }
    return;
  }
  if(e.key==='Enter'){
    e.preventDefault();
    if(open && startAcSel>=0){ startAdd(startAcList[startAcSel]); return; }
    const m=startFindStudents(el('stInput').value);
    if(m.length===1) startAdd(m[0]);
    else if(m.length>1) startOnInput();
    else toast('일치하는 학생이 없습니다','err');
    return;
  }
  if(e.key==='Escape'){ if(box) box.style.display='none'; }
}
 
function startOpenLogModal(){
  const rows=startState.logRows;
  const body=rows.length? rows.map(r=>{
    const el2=r.returnedAt?Math.round((new Date(r.returnedAt)-new Date(r.leftAt))/1000):null;
    const over=el2!=null&&el2>r.limitSec;
    const k=r.kind==='exam'?'시험':'외출';
    const kc=r.kind==='exam'?'#185FA5':'#0F6E56';
    return `<tr>
      <td><span style="font-size:11px;font-weight:800;color:${kc}">${k}</span></td>
      <td style="font-weight:700">${esc(r.name)}</td>
      <td style="color:var(--ink-2)">${esc(r.cls||'—')}</td>
      <td style="color:var(--ink-2)">${esc(r.teacher||'—')}</td>
      <td class="num">${startHM(r.leftAt)}</td>
      <td class="num">${r.returnedAt?startHM(r.returnedAt):'—'}</td>
      <td class="num">${el2!=null?startDur(el2):'—'}</td>
      <td style="font-weight:700;color:${over?'var(--neg)':'var(--pos)'}">${over?'초과':'정상'}</td>
      <td class="cc"><button class="btn sm" style="color:var(--neg)" onclick="startDeleteLog('${r.id}')">삭제</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--ink-3)">이 날짜의 기록이 없습니다</td></tr>`;

  openModal(`
    <div class="modal-head">
      <div>
        <h3>STaRT 기록</h3>
        <p style="font-size:12.5px;color:var(--ink-3);margin-top:2px">${startState.viewDate} · 총 ${rows.length}명</p>
      </div>
      <button class="modal-x" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-bottom:14px">
        <input type="date" id="stDate" value="${startState.viewDate}" class="st-inp" style="height:36px">
        <button class="btn sm" id="stCsvBtn">📥 CSV 내려받기</button>
      </div>
      <table class="grid" style="width:100%">
        <thead><tr>
          <th>구분</th><th>이름</th><th>반</th><th>담임</th><th>시작</th><th>복귀</th><th>소요</th><th>결과</th><th></th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`);

  const mb=document.getElementById('modalBox');
  if(mb){ mb.style.maxWidth='min(1080px,94vw)'; mb.style.width='min(1080px,94vw)'; }

  const d=el('stDate'); if(d) d.onchange=()=>{ startState.viewDate=d.value; startLoadSessions(startState.viewDate).then(()=>startOpenLogModal()); };
  const c=el('stCsvBtn'); if(c) c.onclick=startDownloadCSV;
}
 
function startInjectStyles(){
  const old3=document.getElementById('stV3Style'); if(old3) old3.remove();
  const old4=document.getElementById('stV4Style'); if(old4) old4.remove();
  if(document.getElementById('stV5Style')) return;
  const st=document.createElement('style'); st.id='stV5Style';
  st.textContent=`
    .st-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .st-col{border-radius:14px;padding:12px}
    .st-col-exam{background:#F4F8FD;border:1px solid #D3E4F5}
    .st-col-outing{background:#F3FAF6;border:1px solid #C9E9DC}
    .st-col-head{display:flex;align-items:center;gap:8px;padding:2px 4px 12px;margin-bottom:12px;font-size:16px;font-weight:800;border-bottom:1px solid rgba(0,0,0,.06)}
    .st-col-exam .st-col-head{color:#0C447C}.st-col-exam .st-col-head i{color:#185FA5}
    .st-col-outing .st-col-head{color:#085041}.st-col-outing .st-col-head i{color:#0F6E56}
    .st-col-cnt{margin-left:auto;font-size:13px;font-weight:700;border-radius:999px;padding:2px 10px}
    .st-col-exam .st-col-cnt{background:#E6F1FB;color:#185FA5}
    .st-col-outing .st-col-cnt{background:#E1F5EE;color:#0F6E56}
    .st-list{display:flex;flex-direction:column;gap:8px}
    .st-over-zone:not(:empty){margin-bottom:8px}
    .st-empty{text-align:center;color:var(--ink-3);font-size:13px;padding:24px 0}
    .st-row{display:flex;align-items:center;gap:12px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:9px 12px}
    .st-row-info{flex:1;min-width:0}
    .st-row-name{font-size:16px;font-weight:700;color:var(--ink-1);display:flex;align-items:center;gap:6px}
    .st-row-badge{display:none;font-size:11px;font-weight:800;color:#fff;background:var(--neg);border-radius:5px;padding:1px 7px}
    .st-row-meta{font-size:12px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .st-row-timer{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--pos);letter-spacing:-.5px;min-width:64px;text-align:right}
    .st-row-acts{display:flex;gap:6px;flex-shrink:0}
    .st-mini{height:34px;padding:0 14px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap}
    .st-mini.ret{background:var(--brand);color:#fff}
    .st-mini.can{background:var(--surface-1);color:var(--ink-3);border:1px solid var(--line)}
    .st-row.over{background:#FCEEEE;border-color:var(--neg);animation:stFlash .9s infinite}
    .st-row.over .st-row-badge{display:inline-block}
    @keyframes stFlash{0%,100%{background:#FCEEEE}50%{background:#f7dede}}
    .st-inp{height:40px;padding:0 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2);font-size:15px}
    .st-modetog{display:inline-flex;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);overflow:hidden;height:40px}
    .st-mode-btn{border:none;background:transparent;padding:0 16px;font-size:15px;font-weight:700;color:var(--ink-3);cursor:pointer;display:flex;align-items:center;gap:6px}
    .st-mode-btn.active{background:var(--brand);color:#fff}
    .wd-item.sel{background:var(--surface-1);outline:2px solid var(--brand);outline-offset:-2px}
    #stOverlay{position:fixed;inset:0;z-index:9999;background:#1a1416;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;animation:stOvIn .25s ease-out}
    @keyframes stOvIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
    #stOverlay::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:#c0392b}
    .st-ov-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(192,57,43,.15);border:1px solid rgba(192,57,43,.5);border-radius:999px;padding:7px 18px;margin-bottom:28px;font-size:14px;font-weight:500;color:#e8a0a0;letter-spacing:2px}
    .st-ov-names{display:flex;flex-direction:column;gap:14px;margin-bottom:28px}
    .st-ov-row{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}
    .st-ov-name{font-size:52px;font-weight:500;color:#fff;line-height:1;letter-spacing:-1px}
    .st-ov-over{font-size:15px;font-weight:500;color:#1a1416;background:#e74c3c;border-radius:8px;padding:5px 12px}
    .st-ov-sub{font-size:16px;color:rgba(255,255,255,.6);margin-bottom:32px}
    .st-ov-btn{background:#fff;color:#1a1416;border:none;border-radius:12px;font-size:17px;font-weight:500;padding:14px 48px;cursor:pointer}
    .st-ov-btn:hover{opacity:.9}
    @media(max-width:900px){.st-columns{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
}
/* ============================================================================
   STaRT 전체 키보드 내비게이션 — 아래 3개를 app.js에서 찾아 교체 + 1개 추가
     · startBindUI      (교체)
     · startOnKeydown   (교체)
     · startSetMode     (교체)
     · startFocusStep   (추가 — 함수 밖 아무 데나)
   ----------------------------------------------------------------------------
   동작:
   ←→ : 상단 컨트롤 이동 (시험/외출 → 기본시간 → 이름 → 등록 → 소리 → 알림허용)
   ↑↓ : 시간 드롭다운 열기·선택 / 이름칸에서 자동완성 학생 선택
   Enter : 현재 위치 실행
   ============================================================================ */

/* 상단 컨트롤 이동 순서 */
function startFocusSteps(){
  // 실제 존재하는 것만 순서대로
  return ['stModeExam','stModeOuting','stMin','stInput','stAddBtn','stMuteBtn','stPermBtn']
    .map(id=>document.getElementById(id)).filter(Boolean);
}
function startFocusStep(dir){
  const steps=startFocusSteps();
  if(!steps.length) return;
  const active=document.activeElement;
  let idx=steps.indexOf(active);
  if(idx<0) idx = dir>0 ? -1 : 0;
  idx = Math.min(steps.length-1, Math.max(0, idx+dir));
  const t=steps[idx];
  if(t){ t.focus(); if(t.tagName==='INPUT'&&t.type!=='number') t.select && t.select(); }
}

function startSetMode(mode){
  startMode=mode;
  const tog=el('stModeTog'); if(!tog) return;
  tog.querySelectorAll('.st-mode-btn').forEach(b=> b.classList.toggle('active', b.dataset.mode===mode));
}

function startBindUI(){
  const input=el('stInput');
  input.addEventListener('input', startOnInput);

  // 모드 버튼에 id 부여 (키보드 이동 대상)
  const tog=el('stModeTog');
  const modeBtns=tog.querySelectorAll('.st-mode-btn');
  modeBtns.forEach(btn=>{
    btn.id = btn.dataset.mode==='exam' ? 'stModeExam' : 'stModeOuting';
    btn.tabIndex=0;
    btn.onclick=()=>{ startSetMode(btn.dataset.mode); btn.focus(); };
  });

  el('stAddBtn').onclick=()=>{
    const m=startFindStudents(input.value);
    if(m.length===1) startAdd(m[0]);
    else if(m.length>1){ startOnInput(); toast('여러 명 검색됨 — ↑↓로 선택'); }
    else toast('일치하는 학생이 없습니다','err');
  };
  el('stMuteBtn').onclick=()=>{ startState.muted=!startState.muted; el('stMuteBtn').textContent=startState.muted?'🔇':'🔊'; };
  el('stPermBtn').onclick=startAskPerm;
  el('stLogBtn').onclick=startOpenLogModal;

  // 전역 키다운 (상단 영역에서 ←→ 이동)
  document.addEventListener('keydown', startGlobalKey, true);
  input.addEventListener('keydown', startOnKeydown);
  document.addEventListener('click', startDocClick);
}

/* 상단 컨트롤 위에서 방향키 처리 (input은 startOnKeydown이 먼저 잡음) */
function startGlobalKey(e){
  if(!document.getElementById('stModeTog')) return;
  const active=document.activeElement;
  if(!startFocusSteps().includes(active)) return;
  if(active && active.id==='stInput') return;

  if(active.id==='stMin' && (e.key==='ArrowUp'||e.key==='ArrowDown')) return;

  if(e.key==='ArrowRight'){ e.preventDefault(); e.stopPropagation(); startFocusStep(1); return; }
  if(e.key==='ArrowLeft'){ e.preventDefault(); e.stopPropagation(); startFocusStep(-1); return; }

  if(e.key==='Enter'||e.key===' '){
    if(active.classList && active.classList.contains('st-mode-btn')){
      e.preventDefault(); startSetMode(active.dataset.mode); return;
    }
    if(active.tagName==='BUTTON'){ e.preventDefault(); active.click(); }
  }
}

/* 이름 입력칸 전용 키 처리 */
function startOnKeydown(e){
  const box=el('stAc');
  const open = box && box.style.display==='block' && startAcList.length>0;

  // 자동완성 목록이 떠 있으면 ↑↓ = 학생 선택
  if(e.key==='ArrowDown'){
    if(open){ e.preventDefault(); startAcSel=Math.min(startAcSel+1,startAcList.length-1); startUpdateAcSel(); }
    return;
  }
  if(e.key==='ArrowUp'){
    if(open){ e.preventDefault(); startAcSel=Math.max(startAcSel-1,0); startUpdateAcSel(); }
    return;
  }
  // ←→ = 칸 이동 (이름칸도 무조건 이동)
  if(e.key==='ArrowLeft'){ e.preventDefault(); if(box) box.style.display='none'; startFocusStep(-1); return; }
  if(e.key==='ArrowRight'){ e.preventDefault(); if(box) box.style.display='none'; startFocusStep(1); return; }

  if(e.key==='Enter'){
    e.preventDefault();
    if(open && startAcSel>=0){ startAdd(startAcList[startAcSel]); return; }
    const m=startFindStudents(el('stInput').value);
    if(m.length===1) startAdd(m[0]);
    else if(m.length>1) startOnInput();
    else toast('일치하는 학생이 없습니다','err');
    return;
  }
  if(e.key==='Escape'){ if(box) box.style.display='none'; }
}
/* ============================================================================
   CHESS / ACE 판정 — app.js 아무 데나(함수 밖) 붙여넣기
   반 이름(className)에서 레벨 코드를 뽑아 CHESS인지 ACE인지 판정.
   예: "[IS2]SU1/MWF/IS2/J" → 레벨 "IS" → CHESS
       "[LSA1]SP1/MWF/E"    → 레벨 "LSA" → CHESS
       "[A1]SU2/TTH"        → 레벨 "A"  → ACE
       "[HM2]..."           → 레벨 "HM" → ACE
   ============================================================================ */

/* CHESS 레벨 목록 (이 알파벳으로 시작하면 CHESS, 나머지는 ACE) */
const CHESS_LEVELS = ['IS','DSA','DSB','DSC','DSD','LSA','LSB','LSC','LSD','MSA','MSB'];

/* 반 이름에서 레벨 알파벳만 추출: "[LSA1]SP1/..." → "LSA" */
function levelAlphaOf(className){
  const m = String(className||'').match(/^\s*\[([A-Za-z]+)/);  // 대괄호 안 알파벳만 (숫자 앞까지)
  return m ? m[1].toUpperCase() : '';
}

/* CHESS 여부 판정 → true=CHESS, false=ACE */
function isChess(className){
  const alpha = levelAlphaOf(className);
  if(!alpha) return false;  // 레벨 못 읽으면 일단 ACE로
  return CHESS_LEVELS.includes(alpha);
}

/* 구분 라벨 반환: 'CHESS' | 'ACE' */
function chessAceOf(className){
  return isChess(className) ? 'CHESS' : 'ACE';
}

/* 레코드 배열을 받아 {chess, ace, total} 개수로 집계 */
function countChessAce(records){
  let chess=0, ace=0;
  records.forEach(r=>{
    if(isChess(r.className)) chess++; else ace++;
  });
  return { chess, ace, total: chess+ace };
}
