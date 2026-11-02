/* ============================================================================
   레벨테스트 통합 레이어 (원본 코드는 그대로 두고 이 파일만 얹음)
   - 진입: 예약에서 넘어온 학생정보 자동입력 (?code&name&school&grade&date&rid&branch)
   - 저장: 채점 결과 → Supabase(level_test_results) + 예약(level_test_reservations) 업데이트
   - 열람: ?view=<resultId> → 저장된 성적표 읽기전용 렌더
   - 답지 직통: ?answerFor=<examName> → 반·시험지 선택 없이 그 시험 답지 팝업만 바로 띄움
     (ace-e5-grading.html의 "E6 답지"/"단어·해석 답지" 버튼이 새 탭에서 이 주소로 연다 —
     운영자: "레벨테스트에서 답지볼때랑 똑같은 팝업이 떴으면 좋겠음")
   ※ 원본의 LAST_REPORT_SESSION / LAST_CHESS_SESSION / render* 는 같은 전역이라 이름으로 접근 가능
   ============================================================================ */
(function () {
  var SUPABASE_URL = 'https://hplndiuoohantbalixwu.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_xO8KB46SzMx8KeuEE-OVSw_su22mv9X';
  var sb = null;
  function getSb() { if (!sb && window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); return sb; }

  var qs = new URLSearchParams(location.search);
  var P = {
    rid: qs.get('rid'), code: qs.get('code'), name: qs.get('name'),
    school: qs.get('school'), grade: qs.get('grade'), date: qs.get('date'),
    branch: qs.get('branch'), viewId: qs.get('view'), answerFor: qs.get('answerFor')
  };
  window.__LT_ENTRY = P;
  /* 2026-11-02 — 어드민 "성적표 보기"(?view=)로 열람할 때 원본 행을 기억해둔다 —
     저장(saveResult)할 때 이 행을 업데이트하려고. URL엔 rid/code/branch 등이 안
     실려 있어서(renderViewMode 참고) 이게 없으면 저장할 때 그 값들을 전부 null로
     밀어써버린다. */
  var VIEWED_ROW = null;

  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function toast(msg, ok) {
    var t = document.getElementById('__lt_toast');
    if (!t) { t = document.createElement('div'); t.id = '__lt_toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:99999;' +
      'background:' + (ok ? '#2a2440' : '#c0392b') + ';color:#fff;padding:13px 24px;border-radius:12px;' +
      'font-weight:700;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25)';
    clearTimeout(t.__tm); t.__tm = setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------- 현재 채점 세션 읽기 (CHESS or 일반/수능) ---------- */
  function currentPayload() {
    if (typeof LAST_CHESS_SESSION !== 'undefined' && LAST_CHESS_SESSION && typeof LAST_CHESS_SESSION.totalScore !== 'undefined') {
      var c = LAST_CHESS_SESSION;
      return {
        report_type: 'chess',
        exam_key: c.examName || null, exam_title: c.examName || null,
        assigned_level: c.assignedLevel || null, total_score: num(c.totalScore),
        result_json: c, testDate: c.testDate
      };
    }
    if (typeof LAST_REPORT_SESSION !== 'undefined' && LAST_REPORT_SESSION) {
      var d = LAST_REPORT_SESSION;
      var isSat = (typeof isSatExamKey === 'function') && isSatExamKey(d.title);
      return {
        report_type: isSat ? 'sat' : 'general',
        exam_key: d.examKey || null, exam_title: d.title || null,
        assigned_level: d.assignedLevel || null,
        total_score: num(d.evaluation && d.evaluation.total),
        result_json: d, testDate: d.testDate
      };
    }
    return null;
  }

  /* ---------- 저장 ----------
     2026-11-02 — 운영자: "성적표 보기 눌렀는데 성적수정하는버튼이 아예안보여" — 어드민
     "성적표 보기"(열람)에서도 레벨 수정·결과 저장이 되게 해달라는 요청(아래
     injectSaveBtn의 P.viewId 가드도 같이 뺐다). 열람 중엔 VIEWED_ROW에 원본 행이
     있으니, 그때는 새로 insert하지 않고 그 행을 update한다 — 안 그러면 URL에 없는
     reservation_id·branch_id·student_code 등이 전부 null로 찍힌 "복사본" 행이
     하나 더 생기고, 원본은 안 바뀐 채로 남는다. */
  async function saveResult() {
    var s = getSb();
    if (!s) { toast('저장소 연결 실패'); return; }
    var pl = currentPayload();
    if (!pl) { toast('저장할 채점 결과가 없어요'); return; }
    var v = VIEWED_ROW; // 열람 중이면 원본 행, 아니면 null
    var row = {
      reservation_id: P.rid || (v && v.reservation_id) || null,
      branch_id: P.branch || (v && v.branch_id) || null,
      student_code: P.code || (v && v.student_code) || null,
      student_name: P.name || (v && v.student_name) || null,
      school: P.school || (v && v.school) || null,
      grade: P.grade || (v && v.grade) || null,
      test_date: pl.testDate || P.date || (v && v.test_date) || null,
      exam_key: pl.exam_key, exam_title: pl.exam_title, report_type: pl.report_type,
      assigned_level: pl.assigned_level, total_score: pl.total_score, result_json: pl.result_json
    };
    try {
      var res = v
        ? await s.from('level_test_results').update(row).eq('id', v.id).select()
        : await s.from('level_test_results').insert(row).select();
      if (res.error) throw res.error;
      var resultId = v ? v.id : (res.data && res.data[0] && res.data[0].id);
      var ridForReservation = P.rid || (v && v.reservation_id);
      if (ridForReservation) {
        await s.from('level_test_reservations').update({
          status: 'attended', test_level: pl.assigned_level, test_score: pl.total_score
        }).eq('id', ridForReservation);
      }
      toast('결과가 저장됐어요 ✓', true);
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'lt-saved', resultId: resultId, rid: ridForReservation }, '*');
    } catch (e) { console.error('저장 실패', e); toast('저장 실패: ' + (e.message || e)); }
  }
  window.ltSaveResult = saveResult;

  /* ---------- 성적표 → 채점결과(레벨 수정) 로 점프: 답안 안 날아감 ---------- */
  function goEditLevel() {
    if (typeof LAST_CHESS_SESSION !== 'undefined' && LAST_CHESS_SESSION && typeof LAST_CHESS_SESSION.totalScore !== 'undefined') {
      if (typeof renderChessReview === 'function') renderChessReview(LAST_CHESS_SESSION);
      return;
    }
    if (typeof LAST_REPORT_SESSION !== 'undefined' && LAST_REPORT_SESSION) {
      var d = LAST_REPORT_SESSION;
      if (typeof renderAnswerReview === 'function')
        renderAnswerReview(d.memberCode, d.name, d.school, d.grade, d.testDate, d.title, d.examKey, d.evaluation, d.vtEvaluation, d.assignedLevel, d.reportGrade);
    }
  }
  window.ltEditLevel = goEditLevel;

  /* ---------- 성적표 화면에 "레벨 수정" + "결과 저장" 버튼 주입 ----------
     2026-11-02 — 예전엔 열람모드(?view=, 어드민 "성적표 보기")에 이 버튼을 아예
     안 띄웠는데, 운영자가 나중에 실수 발견하면 그 자리에서 바로 고치고 싶다고
     해서 열람모드에서도 띄운다. 저장은 위 saveResult()가 VIEWED_ROW로 "새로
     추가"가 아니라 "원본 행 업데이트"를 하게 같이 고쳤다. */
  function injectSaveBtn() {
    var appEl = document.getElementById('app'); if (!appEl) return;
    var btns = appEl.querySelectorAll('button');
    var printBtn = null;
    for (var i = 0; i < btns.length; i++) {
      var oc = btns[i].getAttribute('onclick') || '';
      if (oc.indexOf('print()') >= 0) { printBtn = btns[i]; break; }
    }
    if (!printBtn) return;
    var bar = printBtn.parentElement;
    // 레벨 수정 버튼 (성적표 → 채점결과로, 답안 유지)
    if (!bar.querySelector('.lt-edit-btn')) {
      var e = document.createElement('button');
      e.className = 'lt-edit-btn secondary';
      e.textContent = '레벨 수정';
      e.style.cssText = 'background:#fff;color:#8b6ee8;border:1px solid #ece8f5;font-weight:800';
      e.addEventListener('click', goEditLevel);
      bar.insertBefore(e, printBtn);
    }
    // 결과 저장 버튼
    if (!bar.querySelector('.lt-save-btn')) {
      var b = document.createElement('button');
      b.className = 'lt-save-btn';
      b.textContent = '결과 저장';
      b.style.cssText = 'background:#2fa878;color:#fff;border:none;font-weight:800';
      b.addEventListener('click', saveResult);
      bar.insertBefore(b, printBtn);
    }
  }

  /* ---------- 진입 프리필 ---------- */
  function mapGrade(g) {
    g = String(g || '').trim();
    if (/^중\s*\d/.test(g)) return g.replace(/^중\s*/, '중등');
    return g; // 초등1..6 은 그대로 매칭
  }
  function prefill() {
    var set = function (id, v) { var el = document.getElementById(id); if (el && v != null && v !== '') el.value = v; };
    set('memberCode', P.code); set('studentName', P.name); set('schoolName', P.school);
    if (P.date) set('testDate', P.date);
    if (P.grade) {
      var g = document.getElementById('grade');
      if (g) {
        g.value = mapGrade(P.grade);
        if (typeof syncExamOptions === 'function') syncExamOptions();
        if (typeof updatePaperButtons === 'function') updatePaperButtons();
      }
    }
  }

  /* ---------- 열람모드 ----------
     2026-11-02 — 운영자: "성적표 보기 눌렀는데 성적수정하는버튼이 아예안보여" — 원래는
     여기서 "답안입력으로 돌아가기"·"처음으로" 버튼까지 지워서 읽기전용으로 만들었는데,
     나중에 열람하다 실수를 발견하면 그 자리에서 바로 고치고 싶다는 요청이라 더 이상
     안 지운다(이 함수도 그래서 뺐다). 레벨 수정·결과 저장 버튼은 injectSaveBtn이
     그대로 주입한다. */
  async function renderViewMode() {
    var appEl = document.getElementById('app');
    var s = getSb();
    if (!s) { if (appEl) appEl.innerHTML = '<p style="padding:50px;text-align:center;color:#64748b">저장소 연결 실패</p>'; return; }
    try {
      var res = await s.from('level_test_results').select('*').eq('id', P.viewId).single();
      if (res.error) throw res.error;
      VIEWED_ROW = res.data; // saveResult()가 "새로 추가" 대신 이 행을 업데이트하는 데 쓴다
      var rj = res.data.result_json || {};
      /* 2026-11-02 — 운영자: "성적표 보기 누르면 옛날버전 성적표가 나와" — 통합관리
         어드민 화면(응시자 상세 표)에서 "성적" 점수를 눌러 여는 길(leveltest/index.html?view=)
         은 URL에 ?branch=가 안 붙는다. buildCoverPage(common.js)가 새 표지를 쓸지는
         window.__LT_ENTRY.branch로만 판단하는데, 이 길로 들어오면 그게 비어 있어서
         탕정분원 결과인데도 옛날 표지로 떨어졌다. 저장된 행 자체에 branch_id가 있으니
         (saveResult 참고) 그 값으로 덮어써서 "열람"도 "응시"와 같은 분원 판정을 받게
         한다 — CHESS 쪽은 이미 dataVersion으로 같은 문제를 풀어놔서 영향 없음. */
      if (res.data.branch_id) window.__LT_ENTRY.branch = res.data.branch_id;
      /* 2026-11-02 — 운영자: "학교 수정하면 바로 입력이 다 된 성적표라도 바뀌게끔",
         "지금 현재 학생정보 입력칸에 적힌 학년기준으로 성적표에도 그렇게 학년 나오게".
         result_json엔 채점 당시 스냅샷(학교·학년)이 그대로 박혀 있어서, 나중에
         학생정보(students 표)에서 학교·학년을 고쳐도 이미 만든 성적표엔 안 보였다.
         열람할 때마다 students 표에서 지금 학교·학년을 다시 가져와 덮어쓴다.
         회원코드가 있으면(임시-로 시작하지 않으면) 코드로 정확히 한 명을 찾고,
         없으면 이름으로 찾되 — 동명이인이 둘 이상이면 엉뚱한 학생 정보가 붙을
         위험이 있어서 그럴 땐 안 건드리고 저장된 값 그대로 둔다. */
      try {
        var liveStu = null;
        if (res.data.student_code && res.data.student_code.indexOf('임시-') !== 0) {
          var byCode = await s.from('students').select('school,grade').eq('code', res.data.student_code).maybeSingle();
          if (!byCode.error && byCode.data) liveStu = byCode.data;
        } else {
          var byName = await s.from('students').select('school,grade').eq('name', rj.name || res.data.student_name);
          if (!byName.error && byName.data && byName.data.length === 1) liveStu = byName.data[0];
        }
        if (liveStu) {
          if (liveStu.school) rj.school = liveStu.school;
          if (liveStu.grade) rj.grade = liveStu.grade;
        }
      } catch (e) { console.error('학생 최신 학교/학년 조회 실패(저장된 값 그대로 둠)', e); }
      if (res.data.report_type === 'chess') {
        LAST_CHESS_SESSION = rj;
        if (typeof renderChessReport === 'function') renderChessReport();
      } else {
        LAST_REPORT_SESSION = rj;
        if (typeof renderReportScreen === 'function') {
          renderReportScreen(rj.memberCode, rj.name, rj.school, rj.grade, rj.testDate, rj.title, rj.examKey, rj.evaluation, rj.vtEvaluation, rj.assignedLevel, rj.reportGrade);
        }
      }
    } catch (e) { console.error('열람 실패', e); if (appEl) appEl.innerHTML = '<p style="padding:50px;text-align:center;color:#64748b">성적표를 불러오지 못했어요.</p>'; }
  }

  /* ---------- 답지 직통 (?answerFor=) — openSelectedAnswer()의 분기와 같은 로직,
     #examName 드롭다운 없이 title만으로 바로 연다 ---------- */
  function showAnswerDirect(title) {
    if (title.indexOf('Writing Type') === 0) {
      window.open('./PDF/Writing_AnswerKey.pdf', '_blank');
      return;
    }
    var chessTests = ['I1', 'D1', 'D2', 'D3', 'D4', 'L1', 'L2', 'L3', 'L4'];
    if (chessTests.indexOf(title) >= 0) {
      if (typeof showChessAnswerSheet === 'function') {
        window.CURRENT_CHESS_EXAM_KEY = title;
        showChessAnswerSheet();
      }
      return;
    }
    if (title === 'Voca & Translation') {
      if (typeof openAnswerModal === 'function') openAnswerModal(title);
      return;
    }
    if (typeof openAceAnswerModalPretty === 'function') openAceAnswerModalPretty(title);
  }

  /* ---------- 부팅 ---------- */
  function boot() {
    // 성적표가 그려질 때마다 저장버튼 주입 감시
    var appEl = document.getElementById('app');
    if (appEl) { var mo = new MutationObserver(function () { injectSaveBtn(); }); mo.observe(appEl, { childList: true, subtree: true }); }
    if (P.viewId) { renderViewMode(); return; }
    if (P.answerFor) { showAnswerDirect(P.answerFor); return; }
    prefill();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();