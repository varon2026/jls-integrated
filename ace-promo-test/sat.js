// SAT report renderer

function renderSatReport(memberCode, name, school, grade, testDate, title, examData, evaluation, assignedLevel) {
  const results = evaluation.results || [];
  const total = evaluation.total || 0;
  const areaStats = evaluation.areaStats || {};
  const competencies = evaluation.competencies || {};

  const lc = areaStats.LC || { earned: 0, possible: 0, rate: 0, correct: [], wrong: [] };
  const rc = areaStats.RC || { earned: 0, possible: 0, rate: 0, correct: [], wrong: [] };
  const levelText = assignedLevel || "미배정";

  const topComp = getTopFive(competencies) || [];

  const correctCount = results.filter(q => q.correct).length;
  const wrongCount = results.filter(q => !q.correct).length;
  const answeredCount = results.filter(q => String(q.userAnswer || "").trim() !== "").length;
  const answerRate = results.length ? Math.round((correctCount / results.length) * 100) : 0;

  function aggregateTypes(rows) {
    const map = {};

    rows.forEach(q => {
      const key = q.type || "미분류";
      if (!map[key]) {
        map[key] = { label: key, earned: 0, possible: 0, rate: 0 };
      }
      map[key].possible += q.score || 0;
      if (q.correct) map[key].earned += q.score || 0;
    });

    return Object.values(map)
      .map(item => ({
        ...item,
        rate: item.possible ? Math.round((item.earned / item.possible) * 100) : 0
      }))
      .sort((a, b) => (b.possible - a.possible) || (a.label > b.label ? 1 : -1));
  }

  function splitByRate(list) {
    return {
      positive: list.filter(item => item.rate > 0),
      zero: list.filter(item => item.rate === 0)
    };
  }

  const lcTypes = aggregateTypes(results.filter(q => q.area === "LC"));
  const rcTypes = aggregateTypes(results.filter(q => q.area === "RC"));
  const allTypes = aggregateTypes(results);

  const compSplit = splitByRate(topComp);
  const lcTypeSplit = splitByRate(lcTypes);
  const rcTypeSplit = splitByRate(rcTypes);

  const strongTypeList = allTypes
    .filter(item => item.possible > 0 && item.rate >= 80)
    .sort((a, b) => (b.rate - a.rate) || (b.possible - a.possible))
    .slice(0, 3);

  const weakTypeList = allTypes
    .filter(item => item.possible > 0 && item.rate < 80)
    .sort((a, b) => (a.rate - b.rate) || (b.possible - a.possible))
    .slice(0, 3);

  function getTopRows(list, emptyLabel) {
    if (!list.length) {
      return `<tr><td colspan="3">${emptyLabel}</td></tr>`;
    }
    return list.map(item => `
      <tr>
        <td class="left">${esc(item.label)}</td>
        <td>${item.earned} / ${item.possible}</td>
        <td>${item.rate}%</td>
      </tr>
    `).join("");
  }

  function buildTypeCards(list, emptyLabel) {
    if (!list.length) {
      return `
        <div class="chart-card sat-mini-card sat-empty-card">
          <div class="chart-title">${emptyLabel}</div>
          <div class="summary-line" style="text-align:center; margin-top:6px;">표시할 분석 데이터가 없습니다.</div>
        </div>
      `;
    }

    return list.map(item => `
      <div class="chart-card sat-mini-card">
        <div class="chart-title sat-mini-title">${esc(item.label)}</div>
        <div class="chart-sub">${item.earned} / ${item.possible}</div>
        ${donutSvg(item.rate, "", 72, 9, "#12a9ef")}
      </div>
    `).join("");
  }

  function buildZeroRateTable(title, list, emptyLabel) {
    return `
      <div class="card" style="margin-top:10px;">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">${title}</div>
        <table class="meta-table type-table">
          <tr><th>항목</th><th>획득</th><th>정답률</th></tr>
          ${getTopRows(list, emptyLabel)}
        </table>
      </div>
    `;
  }

  function getAreaDiagnosis() {
    const diff = Math.abs(lc.rate - rc.rate);

    if (lc.rate < 20 && rc.rate < 20) {
      return "Listening과 Reading 모두 전반적인 보완이 필요한 단계입니다.";
    }
    if (diff < 10) {
      return "Listening과 Reading의 성취도 차이가 크지 않아, 전 영역의 균형 있는 보완이 필요합니다.";
    }
    if (lc.rate > rc.rate) {
      return "Reading보다 Listening에서 상대적으로 높은 성취를 보였으며, 독해 영역 보완이 우선입니다.";
    }
    return "Listening보다 Reading에서 상대적으로 높은 성취를 보였으며, 듣기 영역 보완이 우선입니다.";
  }

  function getScoreComment() {
    if (total === 0) {
      return "문항 응답 또는 정답 입력이 충분하지 않아 현재 결과는 진단 참고용으로 해석하는 것이 적절합니다.";
    }

    if (total >= 90) {
      if (!weakTypeList.length) {
        return "수능형 문항에 대한 전반적인 적응력이 안정적으로 형성되어 있으며, 현재는 뚜렷한 취약 유형 없이 우수한 성취를 보이고 있습니다.";
      }
      return "수능형 문항에 대한 전반적인 적응력이 형성되어 있으며, 상위권 완성을 위해 일부 유형에 대한 정교한 보완이 필요한 단계입니다.";
    }

    if (total >= 70) {
      return "수능형 문항에 대한 기본 적응은 형성되어 있으며, 영역별 정답률과 유형별 편차를 중심으로 정확도를 높여야 하는 단계입니다.";
    }

    if (total >= 40) {
      return "수능형 문항에 대한 적응이 진행 중이며, 취약 유형을 중심으로 반복 훈련하여 문제 해결 안정성을 높여야 하는 단계입니다.";
    }

    return "수능형 문항에 대한 전반적인 적응 훈련이 우선적으로 필요하며, 영역별 기초 해결력부터 단계적으로 보완해야 하는 단계입니다.";
  }

  function getStudyDirection() {
    if (total >= 90 && !weakTypeList.length) {
      return [
        "현재는 뚜렷한 보완 영역 없이 전반적으로 안정적인 성취를 보이고 있습니다.",
        "고난도 문항에 대한 실전 적용력과 시간 관리 능력을 더욱 정교하게 다듬는 학습이 효과적입니다.",
        "정답 유지뿐 아니라 풀이 속도와 선택 근거의 명확성을 함께 점검하는 방식으로 완성도를 높일 수 있습니다."
      ];
    }

    if (!weakTypeList.length) {
      return [
        "전반적인 성취를 유지하면서 Listening과 Reading의 균형을 안정적으로 관리하는 학습이 필요합니다.",
        "실수 가능성이 있는 문항 유형을 점검하며 정확도와 속도를 함께 관리하는 것이 효과적입니다.",
        "정답 여부뿐 아니라 풀이 근거를 분명히 설명하는 훈련을 통해 실전 안정성을 높일 수 있습니다."
      ];
    }

    const weakNames = weakTypeList.map(item => esc(item.label)).join(", ");
    const diff = Math.abs(lc.rate - rc.rate);
    let firstLine = "";

    if (lc.rate < 20 && rc.rate < 20) {
      firstLine = "Listening과 Reading 전 영역의 기초 적응 훈련이 우선적으로 필요합니다.";
    } else if (diff < 10) {
      firstLine = "특정 영역보다 전반적인 유형 적응력과 문제 해결 안정성을 함께 보완해야 합니다.";
    } else if (lc.rate < rc.rate) {
      firstLine = "Listening 영역의 정답률 회복을 우선 과제로 두고 학습을 진행하는 것이 효과적입니다.";
    } else {
      firstLine = "Reading 영역의 정답률 회복을 우선 과제로 두고 학습을 진행하는 것이 효과적입니다.";
    }

    return [
      firstLine,
      `${weakNames} 유형을 중심으로 반복 훈련하여 취약 유형 적응력을 높여야 합니다.`,
      "정답 여부 확인에 그치지 않고, 풀이 근거와 선택 과정을 설명하는 방식으로 문제 해결력을 함께 점검해야 합니다."
    ];
  }

  const introText = `
    <div class="intro-box" style="margin-top:16px;">
      정상어학원은 단순한 지식 확인을 넘어,<br>
      학생의 사고력과 문제 해결 과정을 분석하는 정밀 평가를 실시합니다.<br><br>
      수능형 문항을 기반으로 실제 시험에서 요구되는 핵심 사고력과<br>
      유형별 대응 능력을 종합적으로 진단합니다.<br><br>
      이를 통해 학생 개개인의 학습 상태를 객관적으로 파악하고,<br>
      수능 1등급을 향한 전략적인 학습 로드맵을 제시합니다.
    </div>
  `;

  const studyLines = getStudyDirection()
    .map((line, idx) => `${idx + 1}. ${line}`)
    .join("<br>");

  const summaryBody = `
    <div class="fill-grid-2 align-stretch">
      <div class="hero-card sat-summary-card">
        <div class="hero-title">SAT SUMMARY</div>
        <div class="hero-value">${total}<span style="font-size:18px; color:#64748b;"> / 100</span></div>

        <div class="grid-2 sat-kpi-grid" style="margin-top:12px;">
          <div class="kpi">
            <div class="kpi-label">현재 레벨</div>
            <div class="kpi-value" style="font-size:20px;">${levelText}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">정답률</div>
            <div class="kpi-value" style="font-size:20px;">${answerRate}%</div>
          </div>
        </div>

        <div class="grid-2 sat-kpi-grid" style="margin-top:8px;">
          <div class="kpi">
            <div class="kpi-label">Listening</div>
            <div class="kpi-value" style="font-size:20px;">${lc.rate}%</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Reading</div>
            <div class="kpi-value" style="font-size:20px;">${rc.rate}%</div>
          </div>
        </div>

        <div class="grid-2 sat-kpi-grid" style="margin-top:8px;">
          <div class="kpi">
            <div class="kpi-label">정답 수</div>
            <div class="kpi-value" style="font-size:20px;">${correctCount}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">오답 수</div>
            <div class="kpi-value" style="font-size:20px;">${wrongCount}</div>
          </div>
        </div>

        <div class="comment-box" style="margin-top:10px;">
          <strong>수능형 총평</strong><br>
          ${getScoreComment()}<br>
          ${getAreaDiagnosis()}
        </div>
      </div>

      <div class="roadmap-panel sat-roadmap-panel">
        <div class="hero-title">JLS ACE Roadmap</div>
        <div class="grid-2" style="gap:8px;">
          <div class="kpi">
            <div class="kpi-label">Level</div>
            <div class="kpi-value" style="font-size:18px;">${levelText}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">학습 시점</div>
            <div class="kpi-value" style="font-size:16px;">${getRoadmapStamp(testDate)}</div>
          </div>
        </div>
 <div style="height:55px;"></div>
<div class="sat-roadmap-wrap">
  ${buildRoadmapBars(grade, levelText, testDate)}
</div>
              </div>
    </div>

    <div class="card" style="margin-top:12px;">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">영역별 성취도</div>
      <div class="fill-grid-2 align-stretch">
        <div class="chart-card">
          <div class="chart-title">Listening Achievement</div>
          <div class="chart-sub">${lc.earned} / ${lc.possible}</div>
          ${donutSvg(lc.rate, "", 88, 10, "#12a9ef")}
          <div class="summary-line" style="margin-top:8px; text-align:center;">
            수능형 듣기 문항에 대한 이해 및 대응 능력
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Reading Achievement</div>
          <div class="chart-sub">${rc.earned} / ${rc.possible}</div>
          ${donutSvg(rc.rate, "", 88, 10, "#12a9ef")}
          <div class="summary-line" style="margin-top:8px; text-align:center;">
            수능형 독해 문항에 대한 추론 및 해결 능력
          </div>
        </div>
      </div>
    </div>

    <div class="fill-grid-2" style="margin-top:12px;">
      <div class="card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">강점 유형 TOP 3</div>
        <table class="meta-table type-table">
          <tr><th>유형</th><th>획득</th><th>정답률</th></tr>
          ${getTopRows(strongTypeList, "현재 뚜렷한 강점 유형 없음")}
        </table>
      </div>
      <div class="card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">보완 필요 유형 TOP 3</div>
        <table class="meta-table type-table">
          <tr><th>유형</th><th>획득</th><th>정답률</th></tr>
          ${getTopRows(weakTypeList, "현재 뚜렷한 보완 필요 유형 없음")}
        </table>
      </div>
    </div>

    <div class="fill-grid-2" style="margin-top:12px;">
      <div class="card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">필수역량 요약</div>
        <table class="meta-table type-table">
          <tr><th>필수역량</th><th>획득</th><th>정답률</th></tr>
          ${getTopRows(topComp, "표시할 필수역량 없음")}
        </table>
      </div>
      <div class="card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">다음 학습 방향</div>
     <div class="summary-line" style="line-height:1.7; font-size:13px !important;">${studyLines}</div>
      </div>
    </div>
  `;

  const analysisPage1 = `
    <div class="card">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">필수역량 분석</div>
      <div class="sat-card-grid sat-comp-grid">
        ${buildTypeCards(compSplit.positive.slice(0, 5), "표시할 필수역량 없음")}
      </div>
      ${buildZeroRateTable("0% 필수역량 모음", compSplit.zero, "0% 필수역량 없음")}
    </div>

    <div class="card" style="margin-top:12px;">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">문제유형 분석 - LC</div>
      <div class="sat-card-grid sat-type-grid">
        ${buildTypeCards(lcTypeSplit.positive.slice(0, 10), "표시할 LC 유형 없음")}
      </div>
      ${buildZeroRateTable("0% 유형 모음 - LC", lcTypeSplit.zero, "0% LC 유형 없음")}
    </div>
  `;

  const analysisPage2 = `
    <div class="card">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">문제유형 분석 - RC</div>
      <div class="sat-card-grid sat-type-grid">
        ${buildTypeCards(rcTypeSplit.positive.slice(0, 10), "표시할 RC 유형 없음")}
      </div>
      ${buildZeroRateTable("0% 유형 모음 - RC", rcTypeSplit.zero, "0% RC 유형 없음")}
    </div>

    <div class="fill-grid-2" style="margin-top:12px;">
      <div class="card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">LC 유형 전체 분석</div>
        <table class="meta-table type-table">
          <tr><th>유형</th><th>획득</th><th>정답률</th></tr>
          ${getTopRows(lcTypes, "표시할 LC 유형 없음")}
        </table>
      </div>
      <div class="card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">RC 유형 전체 분석</div>
        <table class="meta-table type-table">
          <tr><th>유형</th><th>획득</th><th>정답률</th></tr>
          ${getTopRows(rcTypes, "표시할 RC 유형 없음")}
        </table>
      </div>
    </div>
  `;

  const lcRows = results.filter(q => q.area === "LC");
  const rcRows = results.filter(q => q.area === "RC");

  const lcDetailRows = lcRows.length ? lcRows.map(q => `
    <tr>
      <td>${q.no}</td>
      <td>${q.area}</td>
      <td class="left">${esc(q.type)}</td>
      <td class="left">${esc(q.competency)}</td>
      <td>${q.score}</td>
      <td class="${q.correct ? "status-ok" : "status-no"}">${q.correct ? "O" : "X"}</td>
    </tr>
  `).join("") : `<tr><td colspan="6">표시할 LC 문항 없음</td></tr>`;

  const rcDetailRows = rcRows.length ? rcRows.map(q => `
    <tr>
      <td>${q.no}</td>
      <td>${q.area}</td>
      <td class="left">${esc(q.type)}</td>
      <td class="left">${esc(q.competency)}</td>
      <td>${q.score}</td>
      <td class="${q.correct ? "status-ok" : "status-no"}">${q.correct ? "O" : "X"}</td>
    </tr>
  `).join("") : `<tr><td colspan="6">표시할 RC 문항 없음</td></tr>`;

  const detailBody = `
    <div class="card">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">문항별 상세 분석 - LC</div>
      <div class="table-wrap">
        <table class="detail-table">
          <thead>
            <tr><th>No.</th><th>영역</th><th>유형</th><th>필수역량</th><th>배점</th><th>정오표</th></tr>
          </thead>
          <tbody>${lcDetailRows}</tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:12px;">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">문항별 상세 분석 - RC</div>
      <div class="table-wrap">
        <table class="detail-table">
          <thead>
            <tr><th>No.</th><th>영역</th><th>유형</th><th>필수역량</th><th>배점</th><th>정오표</th></tr>
          </thead>
          <tbody>${rcDetailRows}</tbody>
        </table>
      </div>
    </div>
  `;

  return buildCoverPage(memberCode, name, school, grade, testDate, title, introText) +
    pageTemplate("SAT Achievement Ⅰ", "수능형 종합 진단 / 레벨 / 영역별 성취도", summaryBody) +
    pageTemplate("SAT Achievement Ⅱ", "필수역량 / LC 문제유형 분석", analysisPage1) +
    pageTemplate("SAT Achievement Ⅲ", "RC 문제유형 분석 / 유형 전체 분석", analysisPage2) +
    pageTemplate("SAT Achievement Ⅳ", "문항별 상세 분석", detailBody);
}