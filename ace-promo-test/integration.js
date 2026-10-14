/* ============================================================================
   레벨테스트 통합 레이어 (원본 코드는 그대로 두고 이 파일만 얹음)
   - 진입: 예약에서 넘어온 학생정보 자동입력 (?code&name&school&grade&date&rid&branch)
   - 저장: 채점 결과 → Supabase(level_test_results) + 예약(level_test_reservations) 업데이트
   - 열람: ?view=<resultId> → 저장된 성적표 읽기전용 렌더
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
    branch: qs.get('branch'), viewId: qs.get('view')
  };
  window.__LT_ENTRY = P;

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

  /* ---------- 저장 ---------- */
  async function saveResult() {
    var s = getSb();
    if (!s) { toast('저장소 연결 실패'); return; }
    var pl = currentPayload();
    if (!pl) { toast('저장할 채점 결과가 없어요'); return; }
    var row = {
      reservation_id: P.rid || null, branch_id: P.branch || null,
      student_code: P.code || null, student_name: P.name || null,
      school: P.school || null, grade: P.grade || null,
      test_date: pl.testDate || P.date || null,
      exam_key: pl.exam_key, exam_title: pl.exam_title, report_type: pl.report_type,
      assigned_level: pl.assigned_level, total_score: pl.total_score, result_json: pl.result_json
    };
    try {
      var res = await s.from('level_test_results').insert(row).select();
      if (res.error) throw res.error;
      if (P.rid) {
        await s.from('level_test_reservations').update({
          status: 'attended', test_level: pl.assigned_level, test_score: pl.total_score
        }).eq('id', P.rid);
      }
      toast('결과가 저장됐어요 ✓', true);
      var rid2 = res.data && res.data[0] && res.data[0].id;
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'lt-saved', resultId: rid2, rid: P.rid }, '*');
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

  /* ---------- 성적표 화면에 "레벨 수정" + "결과 저장" 버튼 주입 ---------- */
  function injectSaveBtn() {
    if (P.viewId) return; // 열람모드(어드민)엔 편집·저장 버튼 없음
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

  /* ---------- 열람모드 (읽기전용) ---------- */
  function stripInputButtons() {
    var appEl = document.getElementById('app'); if (!appEl) return;
    var btns = appEl.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var oc = btns[i].getAttribute('onclick') || ''; var t = (btns[i].textContent || '').trim();
      if (/restoreExamInput|goBack|renderChessInput/.test(oc) || t === '답안입력으로 돌아가기' || t === '처음으로') btns[i].remove();
    }
  }
  async function renderViewMode() {
    var appEl = document.getElementById('app');
    var s = getSb();
    if (!s) { if (appEl) appEl.innerHTML = '<p style="padding:50px;text-align:center;color:#64748b">저장소 연결 실패</p>'; return; }
    try {
      var res = await s.from('level_test_results').select('*').eq('id', P.viewId).single();
      if (res.error) throw res.error;
      var rj = res.data.result_json || {};
      if (res.data.report_type === 'chess') {
        LAST_CHESS_SESSION = rj;
        if (typeof renderChessReport === 'function') renderChessReport();
      } else {
        LAST_REPORT_SESSION = rj;
        if (typeof renderReportScreen === 'function') {
          renderReportScreen(rj.memberCode, rj.name, rj.school, rj.grade, rj.testDate, rj.title, rj.examKey, rj.evaluation, rj.vtEvaluation, rj.assignedLevel, rj.reportGrade);
        }
      }
      setTimeout(stripInputButtons, 40);
    } catch (e) { console.error('열람 실패', e); if (appEl) appEl.innerHTML = '<p style="padding:50px;text-align:center;color:#64748b">성적표를 불러오지 못했어요.</p>'; }
  }

  /* ---------- 부팅 ---------- */
  function boot() {
    // 성적표가 그려질 때마다 저장버튼 주입 감시
    var appEl = document.getElementById('app');
    if (appEl) { var mo = new MutationObserver(function () { injectSaveBtn(); }); mo.observe(appEl, { childList: true, subtree: true }); }
    if (P.viewId) { renderViewMode(); return; }
    prefill();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();