// General + Vocabulary/Translation report renderer

function renderGeneralReport(memberCode, name, school, grade, testDate, title, examData, evaluation, assignedLevel, reportGrade = grade) {
  const { results, total, areaStats, competencies, types } = evaluation;
  const lc = areaStats.LC || { earned: 0, possible: 0, rate: 0, correct: [], wrong: [] };
  const rc = areaStats.RC || { earned: 0, possible: 0, rate: 0, correct: [], wrong: [] };

  const gradeStats = computePaperGradeStats(results);
  const levelText = getDisplayLevel(assignedLevel);
  const topComp = getTopFive(competencies);
  const topTypes = getTopFive(types);

  const introText = `
    <div class="intro-box" style="margin-top:16px;">
      정상어학원은 학생들의 듣기와 독해 능력을 확인하는 지필 평가뿐만 아니라,<br>
      중등 1학년부터 고등 수준의 문법 지식을 활용하여 문장을 정확하게 해석할 수 있는지 점검하는 해석 테스트와,<br>
      초등부터 고등까지의 어휘 수준을 평가하기 위한 어휘 테스트를 함께 실시합니다.<br><br>
      이를 바탕으로, 학생의 영어 학습의 강점과 약점을 파악하여 수능 1등급을 향한 뚜렷한 학습 로드맵을 제시합니다.
    </div>
  `;

  const whyBody = `
    <div class="fill-grid-dense">
      <div class="intro-box" style="margin-bottom:12px;">
        <strong>Why? 수능 500</strong><br>
        수능 500 프로젝트란,<br>
        중3까지 수능 모의고사 1등급(최소 고2, 최대 고3)을 목표로 수능 영어 학습을 끝내기 위한 정상어학원의 중등 영어 학습 프로그램입니다.<br>
        학기 중 내신 대비 기간과 각종 수행 평가 준비, 행사 참여 등으로 중학생에게 주어지는 영어 학습에 전념하는 순공(순수 공부) 시간은 대략 500일 정도입니다.<br>
        수능 500 프로젝트는 중3에 끝내는 수능을 목표로, 수능에 집중할 수 있는 500일 기준으로 그 기간 내 학습 효율을 높이고 수능 1등급에 필요한 기본기를 탄탄히 하는 학습관리 프로그램입니다.
      </div>
    </div>
  `;

  const summaryBody = `
    <div class="fill-grid-2 align-stretch">
      <div class="hero-card achv1-card">
        <div class="hero-title">Achievement Ⅰ</div>
        <div class="hero-value">${total}<span style="font-size:18px; color:#64748b;"> / 100</span></div>

        <div class="achv1-grid">
          <div class="achv1-half">
            <div class="achv1-name">Listening</div>
            ${donutSvg(lc.rate, "", 96, 12, "#13a6ee")}
            <div class="achv1-score"><span class="big">${lc.earned}</span><span class="small">/ 40</span></div>
            <div class="achv1-copy">중1-예비고1 수준의 다양한 유형의<br>듣기 이해도 점검</div>
          </div>

          <div class="achv1-half">
            <div class="achv1-name">Reading</div>
            ${donutSvg(rc.rate, "", 96, 12, "#13a6ee")}
            <div class="achv1-score"><span class="big">${rc.earned}</span><span class="small">/ 60</span></div>
            <div class="achv1-copy">중1-예비고1 수준의 다양한 유형의<br>독해 이해도 점검</div>
          </div>
        </div>
      </div>

      <div class="roadmap-panel">
        <div class="hero-title">JLS ACE Roadmap</div>
        <div class="grid-2" style="gap:10px;">
          <div class="kpi">
            <div class="kpi-label">Level</div>
            <div class="kpi-value" style="font-size:20px;">${levelText}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">학습 시점</div>
            <div class="kpi-value" style="font-size:16px;">${getRoadmapStamp(testDate)}</div>
          </div>
        </div>
        ${buildRoadmapBars(reportGrade, levelText, testDate, title)}
      </div>
    </div>
  `;

  const achv2Block = `
    <div class="fill-grid-3 achv2-block">
      <div class="chart-card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">Achievement Ⅱ</div>
        <table class="meta-table">
          <tr><th>Grade</th><th>Listening</th></tr>
          ${gradeStats.labels.map(label => `
            <tr>
              <td class="label">${label}</td>
              <td>${gradeStats.listening[label].earned} / ${gradeStats.listening[label].possible} (${gradeStats.listening[label].rate}%)</td>
            </tr>
          `).join("")}
          <tr><td class="label">Total</td><td>${lc.earned} / 40 (${lc.rate}%)</td></tr>
        </table>
        ${radarSvg(gradeStats.labels.map(label => ({ label, rate: gradeStats.listening[label].rate })), "Listening")}
      </div>

      <div class="chart-card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">Achievement Ⅱ</div>
        <table class="meta-table">
          <tr><th>Grade</th><th>Reading</th></tr>
          ${gradeStats.labels.map(label => `
            <tr>
              <td class="label">${label}</td>
              <td>${gradeStats.reading[label].earned} / ${gradeStats.reading[label].possible} (${gradeStats.reading[label].rate}%)</td>
            </tr>
          `).join("")}
          <tr><td class="label">Total</td><td>${rc.earned} / 60 (${rc.rate}%)</td></tr>
        </table>
        ${radarSvg(gradeStats.labels.map(label => ({ label, rate: gradeStats.reading[label].rate })), "Reading")}
      </div>

      <div class="chart-card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">Achievement Ⅱ</div>
        <table class="meta-table">
          <tr><th>Grade</th><th>Total</th></tr>
          ${gradeStats.labels.map(label => `
            <tr>
              <td class="label">${label}</td>
              <td>${gradeStats.total[label].earned} / ${gradeStats.total[label].possible} (${gradeStats.total[label].rate}%)</td>
            </tr>
          `).join("")}
          <tr><td class="label">Total</td><td>${total} / 100 (${percent(total, 100)}%)</td></tr>
        </table>
        ${radarSvg(gradeStats.labels.map(label => ({ label, rate: gradeStats.total[label].rate })), "Total")}
      </div>
    </div>
  `;

  const detailLeftRows = results.slice(0, 20).map(q => `
    <tr>
      <td>${q.no}</td>
      <td>${q.area}</td>
      <td class="left">${esc(q.type)}</td>
      <td>${q.score}</td>
      <td>${getPaperGradeLabel(q.no)}</td>
      <td class="${q.correct ? "status-ok" : "status-no"}">${q.correct ? "O" : "X"}</td>
    </tr>
  `).join("");

  const detailRightRows = results.slice(20).map(q => `
    <tr>
      <td>${q.no}</td>
      <td>${q.area}</td>
      <td class="left">${esc(q.type)}</td>
      <td>${q.score}</td>
      <td>${getPaperGradeLabel(q.no)}</td>
      <td class="${q.correct ? "status-ok" : "status-no"}">${q.correct ? "O" : "X"}</td>
    </tr>
  `).join("");

  const detailBody = `
    <div class="detail-split">
      <div class="table-wrap">
        <table class="detail-table detail-table-general">
          <thead>
            <tr><th>No.</th><th>영역</th><th>유형</th><th>배점</th><th>Grade</th><th>정오표</th></tr>
          </thead>
          <tbody>${detailLeftRows}</tbody>
        </table>
      </div>

      <div class="table-wrap">
        <table class="detail-table detail-table-general">
          <thead>
            <tr><th>No.</th><th>영역</th><th>유형</th><th>배점</th><th>Grade</th><th>정오표</th></tr>
          </thead>
          <tbody>${detailRightRows}</tbody>
        </table>
      </div>
    </div>

    <div class="compact-cards" style="margin-top:10px;">
      <div class="mini-stat"><div class="kpi-label">LC 정답</div><div class="n">${lc.correct.length}</div></div>
      <div class="mini-stat"><div class="kpi-label">RC 정답</div><div class="n">${rc.correct.length}</div></div>
      <div class="mini-stat"><div class="kpi-label">총 오답</div><div class="n">${results.filter(q => !q.correct).length}</div></div>
      <div class="mini-stat"><div class="kpi-label">정답률</div><div class="n">${percent(total, 100)}%</div></div>
    </div>
  `;

  const part1Cards = (topComp.length ? topComp : [{ label:"데이터 준비중", earned:0, possible:0, rate:0 }]).map(item => `
    <div class="chart-card">
      <div class="chart-title general-mini-title">${esc(item.label)}</div>
      <div class="chart-sub">${item.earned} / ${item.possible}</div>
      ${donutSvg(item.rate, "Achievement", 68, 9, "#12a9ef")}
    </div>
  `).join("");

  const part2Cards = (topTypes.length ? topTypes : [{ label:"데이터 준비중", earned:0, possible:0, rate:0 }]).map(item => `
    <div class="chart-card">
      <div class="chart-title general-mini-title">${esc(item.label)}</div>
      <div class="chart-sub">${item.earned} / ${item.possible}</div>
      ${donutSvg(item.rate, "Achievement", 68, 9, "#12a9ef")}
    </div>
  `).join("");

  const partBody = `
    <div class="card part1-card">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">Part 1. Competency</div>
      <div class="part1-grid general-part-grid">${part1Cards}</div>
    </div>

    <div class="card" style="margin-top:10px;">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">Part 2. Type</div>
      <div class="part1-grid general-part-grid">${part2Cards}</div>
    </div>
  `;

  return buildCoverPage(memberCode, name, school, grade, testDate, title, introText) +
    pageTemplate("Achievement Ⅰ · Ⅱ", "영역 요약 / 로드맵 / 영역 성취 분석", whyBody + summaryBody + achv2Block) +
    pageTemplate("Achievement Ⅲ · Part Analysis", "문항별 상세 분석 / 필수역량 · 문제유형 그래프", detailBody + partBody);
}

function renderVTReport(memberCode, name, school, grade, testDate, title, evaluation) {
  const { vocabGroups, vocabTotal, transResults } = evaluation;

  const vocabRows = vocabGroups.map(g => `
    <tr>
      <td>${g.label}</td>
      <td>${g.earned} / ${g.possible} ( ${g.rate.toFixed(1)}% )</td>
      <td style="font-size:24px; color:#12a9ef; font-weight:800;">${g.letter}</td>
      <td class="left">${g.comment}</td>
    </tr>
  `).join("");

  const transRows = transResults.map(item => `
    <tr>
      <td>${item.no}</td>
      <td>${item.grade}</td>
      <td>${item.earned} / ${item.max} ( ${item.rate.toFixed(1)}% )</td>
      <td class="left">${esc(item.type)}</td>
    </tr>
  `).join("");

  const body = `
    <div class="card vt-vocab-card">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">Part 1. Vocabulary</div>
      <div class="table-wrap">
        <table class="detail-table">
          <thead>
            <tr>
              <th>Grade</th>
              <th>Listening</th>
              <th>정오표</th>
              <th>코멘트</th>
            </tr>
          </thead>
          <tbody>
            ${vocabRows}
            <tr>
              <td>Total</td>
              <td>${vocabTotal.earned} / ${vocabTotal.possible} ( ${vocabTotal.rate.toFixed(1)}% )</td>
              <td>-</td>
              <td class="left"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card vt-summary-card" style="margin-top:12px;">
      <div class="page-label" style="display:inline-block; margin-bottom:10px;">Part 2. Translation</div>
      <div class="table-wrap" style="margin-top:10px;">
        <table class="detail-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Grade</th>
              <th>Achievement</th>
              <th>유형</th>
            </tr>
          </thead>
          <tbody>${transRows}</tbody>
        </table>
      </div>
    </div>
  `;

  return pageTemplate("Voca & Translation Ⅰ", "Vocabulary / Translation Summary", body);
}