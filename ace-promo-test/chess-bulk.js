/* =========================
   CHESS / ACE BULK ENTRY
   전체 파일 통째로 사용
========================= */

let CHESS_BULK_ROWS = [];
let CHESS_BULK_SELECTED_ID = null;
let CHESS_BULK_RESULTS = [];

/* -------------------------
   시험지 스키마
------------------------- */
const BULK_EXAM_SCHEMAS = {
  CHESS_D1: { type: "CHESS", label: "CHESS D1", obj: 33, vocab: 0, trans: 0, grammar: 0 },
  CHESS_D2: { type: "CHESS", label: "CHESS D2", obj: 33, vocab: 0, trans: 0, grammar: 0 },
  CHESS_D3: { type: "CHESS", label: "CHESS D3", obj: 33, vocab: 0, trans: 0, grammar: 10 },
  CHESS_D4: { type: "CHESS", label: "CHESS D4", obj: 33, vocab: 0, trans: 0, grammar: 10 },
  CHESS_L1: { type: "CHESS", label: "CHESS L1", obj: 33, vocab: 0, trans: 0, grammar: 10 },
  CHESS_L2: { type: "CHESS", label: "CHESS L2", obj: 33, vocab: 0, trans: 0, grammar: 10 },
  CHESS_L3: { type: "CHESS", label: "CHESS L3", obj: 33, vocab: 0, trans: 0, grammar: 10 },
  CHESS_L4: { type: "CHESS", label: "CHESS L4", obj: 33, vocab: 0, trans: 0, grammar: 10 },

  ACE_E6:    { type: "ACE", label: "ACE E6",       obj: 40, vocab: 40, trans: 15, grammar: 0 },
  ACE_M1_G:  { type: "ACE", label: "ACE M1 일반형", obj: 40, vocab: 40, trans: 15, grammar: 0 },
  ACE_M1_S:  { type: "ACE", label: "ACE M1 수능형", obj: 45, vocab: 40, trans: 15, grammar: 0 },
  ACE_M2_G:  { type: "ACE", label: "ACE M2 일반형", obj: 40, vocab: 0,  trans: 0,  grammar: 0 },
  ACE_M2_S:  { type: "ACE", label: "ACE M2 수능형", obj: 45, vocab: 0,  trans: 0,  grammar: 0 },
  ACE_M3_G1: { type: "ACE", label: "ACE M3 고1형",  obj: 45, vocab: 0,  trans: 0,  grammar: 0 },
  ACE_M3_G2: { type: "ACE", label: "ACE M3 고2형",  obj: 45, vocab: 0,  trans: 0,  grammar: 0 }
};

const BULK_EXAM_OPTIONS = [
  { label: "CHESS D1", value: "CHESS_D1" },
  { label: "CHESS D2", value: "CHESS_D2" },
  { label: "CHESS D3", value: "CHESS_D3" },
  { label: "CHESS D4", value: "CHESS_D4" },
  { label: "CHESS L1", value: "CHESS_L1" },
  { label: "CHESS L2", value: "CHESS_L2" },
  { label: "CHESS L3", value: "CHESS_L3" },
  { label: "CHESS L4", value: "CHESS_L4" },

  { label: "ACE E6", value: "ACE_E6" },
  { label: "ACE M1 일반형", value: "ACE_M1_G" },
  { label: "ACE M1 수능형", value: "ACE_M1_S" },
  { label: "ACE M2 일반형", value: "ACE_M2_G" },
  { label: "ACE M2 수능형", value: "ACE_M2_S" },
  { label: "ACE M3 고1형", value: "ACE_M3_G1" },
  { label: "ACE M3 고2형", value: "ACE_M3_G2" }
];

/* -------------------------
   유틸
------------------------- */
function bulkGetSchema(examKey) {
  return BULK_EXAM_SCHEMAS[String(examKey || "").trim()] || null;
}

function bulkGetSelectedRow() {
  return CHESS_BULK_ROWS.find(r => r.id === CHESS_BULK_SELECTED_ID) || null;
}

function bulkMakeId() {
  return `bulk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyBulkRow() {
  return {
    id: bulkMakeId(),
    name: "",
    memberCode: "",
    school: "",
    grade: "",
    testDate: new Date().toISOString().slice(0, 10),
    examKey: "",
    obj: [],
    vocab: [],
    trans: [],
    grammar: [],

    chessRubrics: {
      listening: "",
      vocabulary: "",
      complexity: "",
      phonics: "",
      readFluency: "",
      readComplexity: "",
      readComprehension: ""
    },
    chessWriting: {
      task: "",
      topic: "",
      details: "",
      organization: "",
      grammar: ""
    }
  };
}

function bulkResetArraysByExam(row, examKey) {
  const schema = bulkGetSchema(examKey);
  if (!schema) {
    row.obj = [];
    row.vocab = [];
    row.trans = [];
    row.grammar = [];
    return;
  }

  row.obj = Array.from({ length: schema.obj || 0 }, () => "");
  row.vocab = Array.from({ length: schema.vocab || 0 }, () => "");
  row.trans = Array.from({ length: schema.trans || 0 }, () => "");
  row.grammar = Array.from({ length: schema.grammar || 0 }, () => "");

  row.chessRubrics = {
    listening: "",
    vocabulary: "",
    complexity: "",
    phonics: "",
    readFluency: "",
    readComplexity: "",
    readComprehension: ""
  };

  row.chessWriting = {
    task: "",
    topic: "",
    details: "",
    organization: "",
    grammar: ""
  };
}

function splitBulkPasteValues(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .split(/[\t\n,]+/)
    .map(v => v.trim())
    .filter(v => v !== "");
}

function bulkExamKeyToChessExamName(examKey) {
  return String(examKey || "").replace("CHESS_", "");
}

function bulkGetChessExtraConfig(examKey) {
  const clean = bulkExamKeyToChessExamName(examKey);

  if (clean === "D1") {
    return {
      rubrics: ["listening", "vocabulary", "complexity", "phonics"],
      writing: []
    };
  }
  if (clean === "D2") {
    return {
      rubrics: ["listening", "vocabulary", "complexity", "phonics", "readFluency", "readComplexity", "readComprehension"],
      writing: []
    };
  }
  if (clean === "D3" || clean === "D4") {
    return {
      rubrics: ["listening", "vocabulary", "complexity", "readFluency", "readComplexity", "readComprehension"],
      writing: []
    };
  }
  if (clean === "L1" || clean === "L2") {
    return {
      rubrics: ["listening", "vocabulary", "complexity", "readFluency", "readComplexity", "readComprehension"],
      writing: ["task", "topic", "details", "grammar"]
    };
  }
  if (clean === "L3" || clean === "L4") {
    return {
      rubrics: ["listening", "vocabulary", "complexity", "readFluency", "readComplexity", "readComprehension"],
      writing: ["task", "topic", "details", "organization", "grammar"]
    };
  }

  return { rubrics: [], writing: [] };
}

function bulkRubricLabel(key) {
  const map = {
    listening: "Listening",
    vocabulary: "Vocabulary",
    complexity: "Complexity",
    phonics: "Phonics",
    readFluency: "Reading Fluency",
    readComplexity: "Reading Complexity",
    readComprehension: "Comprehension"
  };
  return map[key] || key;
}

function bulkWritingLabel(key) {
  const map = {
    task: "Task Completion",
    topic: "Topic / Ideas",
    details: "Supporting Details / Paraphrasing",
    organization: "Organization",
    grammar: "Mechanics / Grammar"
  };
  return map[key] || key;
}

/* -------------------------
   메인 렌더
------------------------- */
function renderChessBulkMode() {
  app.classList.add("bulk-app");

  app.style.setProperty("width", "calc(100vw - 40px)", "important");
  app.style.setProperty("max-width", "calc(100vw - 40px)", "important");
  app.style.setProperty("margin", "20px auto", "important");

  if (!CHESS_BULK_ROWS.length) {
    CHESS_BULK_ROWS = Array.from({ length: 3 }, () => createEmptyBulkRow());
    CHESS_BULK_SELECTED_ID = CHESS_BULK_ROWS[0].id;
  }

 app.innerHTML = `
  <div class="bulk-page-wide">
    <h1>단체 입력</h1>

    <p class="muted" style="margin-bottom:14px;">
  학생 명단은 엑셀에서 이름, 회원코드, 학교, 학년 4열을 그대로 복사해서 한 번에 넣고,
  선택한 학생의 시험지 유형에 맞는 답안을 오른쪽에서 바로 입력하면 됨.
</p>

    <div class="top-bar no-print sticky-actions">
      <button class="secondary" type="button" onclick="renderHome()">처음으로</button>
      <button type="button" onclick="bulkAddRow()">학생 추가</button>
      <button type="button" class="secondary" onclick="bulkDeleteSelectedRow()">선택 학생 삭제</button>
      <button type="button" onclick="bulkEvaluateAll()">전체 채점</button>
    </div>

    <div class="bulk-roster-card">
      <div class="bulk-table-title">학생 명단 붙여넣기</div>

      <div class="bulk-roster-controls">
        <div class="bulk-roster-field">
          <label>공통 시험일</label>
          <input type="date" id="bulkCommonDate" value="${new Date().toISOString().slice(0, 10)}">
        </div>

        <div class="bulk-roster-field">
          <label>공통 시험지</label>
          <select id="bulkCommonExam">
            <option value="">선택 안 함</option>
            ${BULK_EXAM_OPTIONS.map(opt => `
              <option value="${opt.value}">${opt.label}</option>
            `).join("")}
          </select>
        </div>

        <div class="bulk-roster-actions">
          <button type="button" onclick="bulkApplyCommonSettings()">공통값 적용</button>
        </div>
      </div>

      <textarea
        id="bulkRosterPaste"
        class="bulk-roster-textarea"
        placeholder="엑셀에서 이름 / 회원코드 / 학교 / 학년 4열을 복사해서 여기 붙여넣기&#10;예: 홍길동[TAB]12345[TAB]서수원초[TAB]초등5"
      ></textarea>

      <div class="bulk-roster-submit">
        <button type="button" onclick="bulkPasteRoster()">명단 붙여넣기 적용</button>
      </div>
    </div>

    <div class="bulk-layout">
      <div class="bulk-table-card">
        <div class="bulk-table-title">학생 목록</div>
        <div class="bulk-table-wrap">
          <table class="bulk-table">
            <thead>
              <tr>
                <th>선택</th>
                <th>이름</th>
                <th>회원코드</th>
                <th>학교</th>
                <th>학년</th>
                <th>시험일</th>
                <th>시험지</th>
              </tr>
            </thead>
            <tbody>
              ${CHESS_BULK_ROWS.map(row => renderBulkRow(row)).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="bulk-detail-card">
        ${renderBulkDetailPanel()}
      </div>
    </div>

    <div class="bulk-result-card">
      ${renderBulkResultPanel()}
    </div>
  </div>
  `;
}

function renderBulkRow(row) {
  return `
    <tr class="${row.id === CHESS_BULK_SELECTED_ID ? "is-selected" : ""}">
      <td class="bulk-cell-center">
        <input
          type="radio"
          name="bulkSelectedRow"
          ${row.id === CHESS_BULK_SELECTED_ID ? "checked" : ""}
          onclick="bulkSelectRow('${row.id}')"
        >
      </td>
      <td><input type="text" value="${esc(row.name || "")}" oninput="bulkUpdateField('${row.id}','name',this.value)"></td>
      <td><input type="text" value="${esc(row.memberCode || "")}" oninput="bulkUpdateField('${row.id}','memberCode',this.value)"></td>
      <td><input type="text" value="${esc(row.school || "")}" oninput="bulkUpdateField('${row.id}','school',this.value)"></td>
      <td><input type="text" value="${esc(row.grade || "")}" oninput="bulkUpdateField('${row.id}','grade',this.value)"></td>
      <td><input type="date" value="${esc(row.testDate || "")}" oninput="bulkUpdateField('${row.id}','testDate',this.value)"></td>
      <td>
        <select onchange="bulkChangeExam('${row.id}',this.value)">
          <option value="">선택</option>
          ${BULK_EXAM_OPTIONS.map(opt => `
            <option value="${opt.value}" ${row.examKey === opt.value ? "selected" : ""}>${opt.label}</option>
          `).join("")}
        </select>
      </td>
    </tr>
  `;
}

function renderBulkDetailPanel() {
  const row = bulkGetSelectedRow();

  if (!row) {
    return `<div class="bulk-empty">선택된 학생이 없습니다.</div>`;
  }

  const schema = bulkGetSchema(row.examKey);

  return `
    <div class="bulk-detail-head">
      <div>
        <div class="bulk-detail-kicker">선택 학생 상세 입력</div>
        <div class="bulk-detail-name">${esc(row.name || "이름 미입력")}</div>
      </div>
      <div class="bulk-detail-meta">${esc(schema?.label || "시험지 미선택")}</div>
    </div>

    ${renderDynamicInputs(row)}
  `;
}

/* -------------------------
   상세 입력 렌더
------------------------- */
function renderPasteBox(rowId, fieldName, count, title) {
  return `
    <div class="bulk-paste-box">
      <div class="bulk-paste-head">
        <strong>${title} 붙여넣기</strong>
        <span>${count}개까지 입력</span>
      </div>
      <textarea
        class="bulk-paste-textarea"
        placeholder="엑셀에서 복사해서 여기 붙여넣기&#10;가로/세로 둘 다 가능"
        id="paste-${rowId}-${fieldName}"
      ></textarea>
      <div class="bulk-paste-actions">
        <button
          type="button"
          onclick="bulkApplyPasteValues('${rowId}','${fieldName}',${count},document.getElementById('paste-${rowId}-${fieldName}').value)"
        >
          붙여넣기 적용
        </button>
      </div>
    </div>
  `;
}

function renderDynamicInputs(row) {
  const schema = bulkGetSchema(row.examKey);
  if (!schema) return `<p class="muted">시험지를 먼저 선택해.</p>`;

  const chessExtra = schema.type === "CHESS" ? bulkGetChessExtraConfig(row.examKey) : { rubrics: [], writing: [] };

  return `
    <div class="bulk-dynamic-section">
      <h3>객관식 (${schema.obj})</h3>
      <div class="bulk-grid">
        ${Array.from({ length: schema.obj }, (_, i) => `
          <label class="bulk-mini-field">
            <span>${i + 1}</span>
            <input type="text" value="${esc(row.obj?.[i] || "")}" oninput="updateObj('${row.id}', ${i}, this.value)">
          </label>
        `).join("")}
      </div>
    </div>

    ${schema.vocab ? `
      <div class="bulk-dynamic-section">
        <h3>Voca (${schema.vocab})</h3>
        <div class="bulk-grid">
          ${Array.from({ length: schema.vocab }, (_, i) => `
            <label class="bulk-mini-field">
              <span>${i + 1}</span>
              <input type="text" value="${esc(row.vocab?.[i] || "")}" oninput="updateVocab('${row.id}', ${i}, this.value)">
            </label>
          `).join("")}
        </div>
      </div>
    ` : ""}

    ${schema.trans ? `
      <div class="bulk-dynamic-section">
        <h3>해석 (${schema.trans})</h3>
        <div class="bulk-grid">
          ${Array.from({ length: schema.trans }, (_, i) => `
            <label class="bulk-mini-field">
              <span>${i + 1}</span>
              <input type="text" value="${esc(row.trans?.[i] || "")}" oninput="updateTrans('${row.id}', ${i}, this.value)">
            </label>
          `).join("")}
        </div>
      </div>
    ` : ""}

    ${schema.grammar ? `
      <div class="bulk-dynamic-section">
        <h3>Grammar (${schema.grammar})</h3>
        <div class="bulk-grid grammar-grid">
          ${Array.from({ length: schema.grammar }, (_, i) => `
            <label class="bulk-mini-field">
              <span>G${i + 1}</span>
              <input
                type="text"
                maxlength="1"
                value="${esc(row.grammar?.[i] || "")}"
                oninput="this.value=this.value.replace(/[^01]/g,''); updateGrammar('${row.id}', ${i}, this.value)"
              >
            </label>
          `).join("")}
        </div>
      </div>
    ` : ""}

    ${schema.type === "CHESS" && chessExtra.rubrics.length ? `
      <div class="bulk-dynamic-section">
        <h3>Speaking / Reading 평가</h3>
        <div class="bulk-chip-grid">
          ${chessExtra.rubrics.map(key => `
            <label class="bulk-chip">
              <span>${bulkRubricLabel(key)}</span>
              <select onchange="bulkUpdateChessRubric('${row.id}','${key}',this.value)">
                <option value="">선택</option>
                ${["A", "B", "C", "D"].map(v => `
                  <option value="${v}" ${row.chessRubrics[key] === v ? "selected" : ""}>${v}</option>
                `).join("")}
              </select>
            </label>
          `).join("")}
        </div>
      </div>
    ` : ""}

    ${schema.type === "CHESS" && chessExtra.writing.length ? `
      <div class="bulk-dynamic-section">
        <h3>Writing 평가</h3>
        <div class="bulk-chip-grid">
          ${chessExtra.writing.map(key => `
            <label class="bulk-chip">
              <span>${bulkWritingLabel(key)}</span>
              <select onchange="bulkUpdateChessWriting('${row.id}','${key}',this.value)">
                <option value="">선택</option>
                ${["A", "B", "C", "D"].map(v => `
                  <option value="${v}" ${row.chessWriting[key] === v ? "selected" : ""}>${v}</option>
                `).join("")}
              </select>
            </label>
          `).join("")}
        </div>
      </div>
    ` : ""}
  `;
}

/* -------------------------
   입력 업데이트
------------------------- */
function bulkSelectRow(id) {
  CHESS_BULK_SELECTED_ID = id;
  renderChessBulkMode();
}

function bulkAddRow() {
  const row = createEmptyBulkRow();
  CHESS_BULK_ROWS.push(row);
  CHESS_BULK_SELECTED_ID = row.id;
  renderChessBulkMode();
}

function bulkDeleteSelectedRow() {
  if (!CHESS_BULK_SELECTED_ID) return;
  CHESS_BULK_ROWS = CHESS_BULK_ROWS.filter(r => r.id !== CHESS_BULK_SELECTED_ID);
  CHESS_BULK_SELECTED_ID = CHESS_BULK_ROWS[0]?.id || null;
  renderChessBulkMode();
}

function bulkUpdateField(id, key, value) {
  const row = CHESS_BULK_ROWS.find(r => r.id === id);
  if (!row) return;
  row[key] = value;
}

function bulkChangeExam(id, examKey) {
  const row = CHESS_BULK_ROWS.find(r => r.id === id);
  if (!row) return;

  row.examKey = examKey;
  bulkResetArraysByExam(row, examKey);
  CHESS_BULK_SELECTED_ID = id;
  renderChessBulkMode();
}

function updateObj(rowId, index, value) {
  const row = CHESS_BULK_ROWS.find(r => r.id === rowId);
  if (!row) return;
  row.obj[index] = value;
}

function updateVocab(rowId, index, value) {
  const row = CHESS_BULK_ROWS.find(r => r.id === rowId);
  if (!row) return;
  row.vocab[index] = value;
}

function updateTrans(rowId, index, value) {
  const row = CHESS_BULK_ROWS.find(r => r.id === rowId);
  if (!row) return;
  row.trans[index] = value;
}

function updateGrammar(rowId, index, value) {
  const row = CHESS_BULK_ROWS.find(r => r.id === rowId);
  if (!row) return;
  row.grammar[index] = value;
}

function bulkUpdateChessRubric(rowId, key, value) {
  const row = CHESS_BULK_ROWS.find(r => r.id === rowId);
  if (!row) return;
  row.chessRubrics[key] = value;
}

function bulkUpdateChessWriting(rowId, key, value) {
  const row = CHESS_BULK_ROWS.find(r => r.id === rowId);
  if (!row) return;
  row.chessWriting[key] = value;
}

function bulkApplyPasteValues(rowId, fieldName, expectedLength, text) {
  const row = CHESS_BULK_ROWS.find(r => r.id === rowId);
  if (!row) return;

  const values = splitBulkPasteValues(text);
  row[fieldName] = Array.from({ length: expectedLength }, (_, i) => values[i] || "");
  renderChessBulkMode();
}

/* -------------------------
   CHESS 벌크 채점
------------------------- */
function evaluateChessGrammarFromBulk(examName, grammarInputs = []) {
  const meta = getChessMeta(examName);
  if (!meta.hasGrammar) {
    return {
      results: [],
      totalCorrect: 0,
      totalCount: 0,
      totalScore: 0
    };
  }

  const key = CHESS_GRAMMAR_KEY[meta.grammarType] || [];

  const results = key.map((answerText, idx) => {
    const raw = String(grammarInputs[idx] ?? "0");
    const binary = raw === "1" ? 1 : 0;

    return {
      no: idx + 1,
      guide: answerText,
      binary,
      earned: binary === 1 ? 10 : 0
    };
  });

  return {
    results,
    totalCorrect: results.filter(r => r.binary === 1).length,
    totalCount: results.length,
    totalScore: results.reduce((sum, r) => sum + r.earned, 0)
  };
}

function buildBulkChessResult(row) {
  const examName = bulkExamKeyToChessExamName(row.examKey);
  const objective = evaluateChessObjective(examName, row.obj || []);
  const grammar = evaluateChessGrammarFromBulk(examName, row.grammar || []);
  const totalScore = objective.rate;
  const assignedLevel = getChessLevel(totalScore, examName);

  return {
    _bulkId: row.id,
    resultType: "CHESS",
    memberCode: row.memberCode || "",
    name: row.name || "",
    school: row.school || "",
    grade: row.grade || "",
    testDate: row.testDate || "",
    examName,
    totalScore,
    assignedLevel,
    objective,
    grammar,
    rubrics: {
      speaking: {
        listening: row.chessRubrics.listening || "",
        vocabulary: row.chessRubrics.vocabulary || "",
        complexity: row.chessRubrics.complexity || "",
        phonics: row.chessRubrics.phonics || "",
        readFluency: row.chessRubrics.readFluency || "",
        readComplexity: row.chessRubrics.readComplexity || "",
        readComprehension: row.chessRubrics.readComprehension || ""
      },
      writing: {
        task: row.chessWriting.task || "",
        topic: row.chessWriting.topic || "",
        details: row.chessWriting.details || "",
        organization: row.chessWriting.organization || "",
        grammar: row.chessWriting.grammar || ""
      }
    }
  };
}

function buildBulkAceResult(row) {
  const schema = bulkGetSchema(row.examKey);

  // examKey → EXAMS 키 변환
  const examsKeyMap = {
    ACE_E6:    "E6",
    ACE_M1_G:  "M1,M2(일반형)",
    ACE_M1_S:  "M1(수능형)",
    ACE_M2_G:  "M1,M2(일반형)",
    ACE_M2_S:  "M2(수능형)",
    ACE_M3_G1: "M3(고1형)",
    ACE_M3_G2: "M3(고2형)"
  };

  // examKey → getAssignedLevel에 넘길 title 변환
  const titleMap = {
    ACE_E6:    "E6",
    ACE_M1_G:  "M1(일반형)",
    ACE_M1_S:  "M1(수능형)",
    ACE_M2_G:  "M2(일반형)",
    ACE_M2_S:  "M2(수능형)",
    ACE_M3_G1: "M3(고1형)",
    ACE_M3_G2: "M3(고2형)"
  };

  const examsKey = examsKeyMap[row.examKey];
  const title    = titleMap[row.examKey] || "";
  const examData = (typeof EXAMS !== "undefined" && examsKey) ? EXAMS[examsKey] : null;

  let totalScore    = "-";
  let assignedLevel = "-";

  if (examData && Array.isArray(row.obj) && row.obj.length > 0) {
    let earned = 0;
    examData.forEach((q, idx) => {
      const user = String(row.obj[idx] ?? "").trim();
      if (user === String(q.ans)) earned += q.score;
    });
    const possible = examData.reduce((sum, q) => sum + q.score, 0);
    totalScore = possible > 0 ? Math.round(earned / possible * 100) : 0;

    const reportGrade = (typeof getReportGradeForExam === "function")
      ? getReportGradeForExam(row.grade, title)
      : row.grade;

    assignedLevel = (typeof getAssignedLevel === "function")
      ? getAssignedLevel(reportGrade, title, totalScore, row.testDate)
      : "-";
  }

  return {
    _bulkId: row.id,
    resultType: "ACE",
    memberCode: row.memberCode || "",
    name: row.name || "",
    school: row.school || "",
    grade: row.grade || "",
    testDate: row.testDate || "",
    examKey: row.examKey || "",
    examName: schema?.label || row.examKey || "",
    totalScore,
    assignedLevel,
    obj: Array.isArray(row.obj) ? [...row.obj] : [],
    vocab: Array.isArray(row.vocab) ? [...row.vocab] : [],
    trans: Array.isArray(row.trans) ? [...row.trans] : []
  };
}


function openBulkAceResultReport(bulkId) {
  const target = CHESS_BULK_RESULTS.find(item => item._bulkId === bulkId);
  if (!target) return;

  const aceTitleMap = {
    ACE_E6: "E6",
    ACE_M1_G: "M1(일반형)",
    ACE_M1_S: "M1(수능형)",
    ACE_M2_G: "M2(일반형)",
    ACE_M2_S: "M2(수능형)",
    ACE_M3_G1: "M3(고1형)",
    ACE_M3_G2: "M3(고2형)"
  };

  const title = aceTitleMap[target.examKey] || target.examName || "";
  let examKey = title; 
  if (title === "M1(일반형)" || title === "M2(일반형)") {
    examKey = "M1,M2(일반형)";
  }

  renderExamPage(
    target.memberCode || "",
    target.name || "",
    target.school || "",
    target.grade || "",
    target.testDate || "",
    title,
    examKey
  );

   setTimeout(() => {
    (target.obj || []).forEach((val, idx) => {
      const el = document.getElementById(`q-${idx + 1}`);
      if (el) el.value = val;
    });

    (target.vocab || []).forEach((val, idx) => {
      const el = document.getElementById(`vocab-${idx + 1}`);
      if (el) el.value = val;
    });

    (target.trans || []).forEach((val, idx) => {
      const el = document.getElementById(`trans-score-${idx + 1}`);
      if (el) el.value = val;
    });

    checkExam(
      target.memberCode || "",
      target.name || "",
      target.school || "",
      target.grade || "",
      target.testDate || "",
      title,
      examKey
    );

    // 드롭다운에서 변경한 레벨이 있으면 LAST_REPORT_SESSION에 반영
    if (LAST_REPORT_SESSION && target.assignedLevel && target.assignedLevel !== "-") {
      LAST_REPORT_SESSION.assignedLevel = target.assignedLevel;
    }
  }, 0);
}


function bulkEvaluateAll() {
  const validRows = CHESS_BULK_ROWS.filter(row =>
    String(row.name || "").trim() ||
    String(row.memberCode || "").trim() ||
    String(row.examKey || "").trim()
  );

  if (!validRows.length) {
    alert("입력된 학생이 없습니다.");
    return;
  }

  const noExam = validRows.find(row => !row.examKey);
  if (noExam) {
    alert("시험지 선택 안 된 학생이 있습니다.");
    return;
  }

  CHESS_BULK_RESULTS = validRows.map(row => {
    const schema = bulkGetSchema(row.examKey);
    if (!schema) return null;
    return schema.type === "CHESS" ? buildBulkChessResult(row) : buildBulkAceResult(row);
  }).filter(Boolean);

  renderChessBulkMode();
}

function renderBulkResultPanel() {
  if (!CHESS_BULK_RESULTS.length) {
    return `<div class="bulk-result-empty">아직 채점 결과가 없습니다.</div>`;
  }

  return `
   <div class="bulk-result-head">
  <div class="bulk-table-title">채점 결과</div>
  <div style="display:flex; gap:10px; align-items:center;">
    <div class="muted">${CHESS_BULK_RESULTS.length}명</div>
    <button type="button" onclick="printAllBulkReports()">전체 성적표 출력</button>
  </div>
</div>

    <div class="bulk-result-list">
      ${CHESS_BULK_RESULTS.map((item, idx) => `
        <div class="bulk-result-row">
          <div class="bulk-result-main">
            <strong>${idx + 1}. ${esc(item.name || "(이름 없음)")}</strong>
            <span>${esc(item.examName || "-")}</span>
            <span>${esc(item.school || "-")}</span>
            <span>${esc(item.grade || "-")}</span>
          </div>

                    <div class="bulk-result-side">
            <span class="bulk-badge">총점 ${esc(String(item.totalScore))}</span>
            <span class="bulk-badge">레벨
              <select onchange="bulkOverrideLevel('${item._bulkId}', this.value)"
                style="font-size:13px; font-weight:700; border:none; background:transparent; color:inherit; cursor:pointer;">
                ${getLevelOptions(item.grade, item.examName).map(lv =>
                  `<option value="${lv}" ${lv === item.assignedLevel ? "selected" : ""}>${lv}</option>`
                ).join("")}
              </select>
            </span>
            <button type="button" onclick="openBulkResultReport('${item._bulkId}')">성적표</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function openBulkResultReport(bulkId) {
  const target = CHESS_BULK_RESULTS.find(item => item._bulkId === bulkId);
  if (!target) return;

  if (target.resultType === "CHESS") {
    LAST_CHESS_SESSION = target;

    // 체스 성적표 렌더
    renderChessReport();

    // 렌더 후 빈 page 제거
    setTimeout(() => {
      document.querySelectorAll(".page").forEach(page => {
        const text = page.innerText.replace(/\s/g, "");
        const hasImg = page.querySelector("img, svg, canvas, table");
        const hasCard = page.querySelector(".report-card, .chess-section, .card");

        if (!text && !hasImg && !hasCard) {
          page.remove();
        }
      });

      // 마지막 페이지 강제 넘김 제거
      const pages = document.querySelectorAll(".page");
      pages.forEach((page, idx) => {
        if (idx === pages.length - 1) {
          page.style.breakAfter = "auto";
          page.style.pageBreakAfter = "auto";
        }
      });
    }, 50);

    return;
  }

  openBulkAceResultReport(bulkId);
}

function parseBulkRosterText(text) {
  const lines = String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  return lines.map(line => {
    const cols = line.split("\t").map(v => v.trim());
    return {
      name: cols[0] || "",
      memberCode: cols[1] || "",
      school: cols[2] || "",
      grade: cols[3] || ""
    };
  }).filter(row => row.name || row.memberCode || row.school || row.grade);
}

function bulkPasteRoster() {
  const textarea = document.getElementById("bulkRosterPaste");
  if (!textarea) return;

  const rows = parseBulkRosterText(textarea.value);
  if (!rows.length) {
    alert("붙여넣은 명단이 없습니다.");
    return;
  }

  const commonDate = document.getElementById("bulkCommonDate")?.value || new Date().toISOString().slice(0, 10);
  const commonExamKey = document.getElementById("bulkCommonExam")?.value || "";

  CHESS_BULK_ROWS = rows.map(item => {
    const row = createEmptyBulkRow();
    row.name = item.name;
    row.memberCode = item.memberCode;
    row.school = item.school;
    row.grade = item.grade;
    row.testDate = commonDate;
    row.examKey = commonExamKey;

    if (commonExamKey) {
      bulkResetArraysByExam(row, commonExamKey);
    }

    return row;
  });

  CHESS_BULK_SELECTED_ID = CHESS_BULK_ROWS[0]?.id || null;
  CHESS_BULK_RESULTS = [];
  renderChessBulkMode();
}

function bulkApplyCommonSettings() {
  const commonDate = document.getElementById("bulkCommonDate")?.value || "";
  const commonExamKey = document.getElementById("bulkCommonExam")?.value || "";

  if (!CHESS_BULK_ROWS.length) {
    alert("적용할 학생 목록이 없습니다.");
    return;
  }

  CHESS_BULK_ROWS.forEach(row => {
    if (commonDate) row.testDate = commonDate;

    if (commonExamKey) {
      row.examKey = commonExamKey;
      bulkResetArraysByExam(row, commonExamKey);
    }
  });

  renderChessBulkMode();
}
async function printAllBulkReports() {
  if (!CHESS_BULK_RESULTS.length) {
    alert("출력할 성적표가 없습니다.");
    return;
  }

  const originalChessSession = LAST_CHESS_SESSION;
  const reportHtmlList = [];

  for (let i = 0; i < CHESS_BULK_RESULTS.length; i++) {
    const item = CHESS_BULK_RESULTS[i];

    if (item.resultType === "CHESS") {
      LAST_CHESS_SESSION = item;
      renderChessReport();

      const root = document.querySelector(".chess-report-root");
      if (root) {
        reportHtmlList.push(`
          <div class="bulk-print-one-report">
            ${root.outerHTML}
          </div>
        `);
      }
    }

    if (item.resultType === "ACE") {
      await bulkRenderAceReportForPrint(item);

      const reportArea = document.querySelector("#reportArea");
      if (reportArea) {
        reportHtmlList.push(`
          <div class="bulk-print-one-report">
            ${reportArea.outerHTML}
          </div>
        `);
      }
    }
  }

  LAST_CHESS_SESSION = originalChessSession;

  app.classList.remove("bulk-app");
  app.removeAttribute("style");

  app.innerHTML = `
    <div class="top-bar no-print sticky-actions">
      <button class="secondary" onclick="renderChessBulkMode()">단체입력으로 돌아가기</button>
      <button onclick="window.print()">전체 인쇄</button>
    </div>

    <div class="bulk-all-print-root">
      ${reportHtmlList.join("")}
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}


function bulkRenderAceReportForPrint(target) {
  return new Promise(resolve => {
    const aceTitleMap = {
      ACE_E6: "E6",
      ACE_M1_G: "M1(일반형)",
      ACE_M1_S: "M1(수능형)",
      ACE_M2_G: "M2(일반형)",
      ACE_M2_S: "M2(수능형)",
      ACE_M3_G1: "M3(고1형)",
      ACE_M3_G2: "M3(고2형)"
    };

    const title = aceTitleMap[target.examKey] || target.examName || "";
    let examKey = title;

    if (title === "M1(일반형)" || title === "M2(일반형)") {
      examKey = "M1,M2(일반형)";
    }

    renderExamPage(
      target.memberCode || "",
      target.name || "",
      target.school || "",
      target.grade || "",
      target.testDate || "",
      title,
      examKey
    );

    setTimeout(() => {
      (target.obj || []).forEach((val, idx) => {
        const el = document.getElementById(`q-${idx + 1}`);
        if (el) el.value = val;
      });

      (target.vocab || []).forEach((val, idx) => {
        const el = document.getElementById(`vocab-${idx + 1}`);
        if (el) el.value = val;
      });

           (target.trans || []).forEach((val, idx) => {
        const el = document.getElementById(`trans-score-${idx + 1}`);
        if (el) el.value = val;
      });


           checkExam(
        target.memberCode || "",
        target.name || "",
        target.school || "",
        target.grade || "",
        target.testDate || "",
        title,
        examKey
      );

      // 드롭다운에서 변경한 레벨이 있으면 LAST_REPORT_SESSION에 반영
      if (LAST_REPORT_SESSION && target.assignedLevel && target.assignedLevel !== "-") {
        LAST_REPORT_SESSION.assignedLevel = target.assignedLevel;
      }


      setTimeout(() => {
        goToFinalReport(
          target.memberCode || "",
          target.name || "",
          target.school || "",
          target.grade || "",
          target.testDate || "",
          title,
          examKey
        );

        setTimeout(resolve, 100);
      }, 100);
    }, 0);
  });
}
function bulkOverrideLevel(bulkId, newLevel) {
  const target = CHESS_BULK_RESULTS.find(item => item._bulkId === bulkId);
  if (!target) return;
  target.assignedLevel = newLevel;
}
