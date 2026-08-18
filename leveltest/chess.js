const CHESS_CONFIG = {
  D1: { type: "D_BASIC", speakingMode: "D1", hasGrammar: false, hasWriting: false, hasSpeaking: true },
  D2: { type: "D_BASIC", speakingMode: "D2", hasGrammar: false, hasWriting: false, hasSpeaking: true },
  D3: { type: "D_GRAMMAR", speakingMode: "GENERAL", hasGrammar: true, hasWriting: false, hasSpeaking: true },
  D4: { type: "D_GRAMMAR", speakingMode: "GENERAL", hasGrammar: true, hasWriting: false, hasSpeaking: true },
  L1: { type: "L_SUMMARY", speakingMode: "GENERAL", hasGrammar: true, hasWriting: true, hasSpeaking: true },
  L2: { type: "L_SUMMARY", speakingMode: "GENERAL", hasGrammar: true, hasWriting: true, hasSpeaking: true },
  L3: { type: "L_PARAGRAPH", speakingMode: "GENERAL", hasGrammar: true, hasWriting: true, hasSpeaking: true },
  L4: { type: "L_PARAGRAPH", speakingMode: "GENERAL", hasGrammar: true, hasWriting: true, hasSpeaking: true }
};

const CHESS_LEVEL_RULES = {
  D1: [
    { min: 30, max: 55, level: "IS" },
    { min: 56, max: 85, level: "DSA" },
    { min: 86, max: 95, level: "DSB" },
    { min: 96, max: 100, level: "interview" }
  ],
  D2: [
    { min: 30, max: 35, level: "IS" },
    { min: 36, max: 60, level: "DSA" },
    { min: 61, max: 85, level: "DSB" },
    { min: 86, max: 95, level: "DSC" },
    { min: 96, max: 100, level: "interview" }
  ],
  D3: [
    { min: 30, max: 35, level: "DSB" },
    { min: 36, max: 55, level: "DSC" },
    { min: 56, max: 75, level: "DSD" },
    { min: 76, max: 100, level: "interview" }
  ],
  D4: [
    { min: 30, max: 50, level: "DSC" },
    { min: 51, max: 70, level: "DSD" },
    { min: 71, max: 90, level: "LSA" },
    { min: 91, max: 100, level: "interview" }
  ],
  L1: [
    { min: 25, max: 30, level: "DSD" },
    { min: 31, max: 60, level: "LSA" },
    { min: 61, max: 90, level: "LSB" },
    { min: 91, max: 100, level: "interview" }
  ],
  L2: [
    { min: 30, max: 40, level: "LSA" },
    { min: 41, max: 65, level: "LSB" },
    { min: 66, max: 85, level: "LSC" },
    { min: 86, max: 100, level: "interview" }
  ],
  L3: [
    { min: 30, max: 40, level: "LSB" },
    { min: 41, max: 65, level: "LSC" },
    { min: 66, max: 85, level: "LSD" },
    { min: 86, max: 100, level: "interview" }
  ],
  L4: [
    { min: 30, max: 45, level: "LSC" },
    { min: 46, max: 75, level: "LSD" },
    { min: 76, max: 85, level: "MSA" },
    { min: 86, max: 100, level: "interview" }
  ]
};

const CHESS_ANSWER_KEY = {
  D1: ["black","frog","o","u","3","2","3","1","3","2","1","3","1","1","oy","ow","2","2","4","3","2","3","3","5","2","2","1","2","3","2","3","4","6"],
  D2: ["i,e","3","3","oi","ea","1","3","2","1","3","2","1","1","1","2","2","2","3","2","1","2","1","1","3","1","1","1","2","1","1","3","2","1"],
  D3: ["1","2","3","3","2","4","2","1","1","4","1","3","3","1","4","3","1","3","2","3","4","2","1","4","2","2","1","3","3","2","4","a little","many"],
  D4: ["3","3","3","4","2","4","4","2","1","2","2","4","4","4","3","3","3","2","4","4","3","3","1","3","2","1","2","2","4","4","3","4","4"],

  L1: ["2","3","1","1","2","4","1","4","2","3","3","1","3","4","3","1","3","4","1","1","2","2","4","2","2","1","4","3","1","4","1","2","4"],
  L2: ["3","3","1","1","4","1","2","3","2","3","1","4","3","3","1","1","2","1","2","2","1","3","4","3","4","1","4","3","2","1","2","3","4"],
  L3: ["3","4","3","1","2","2","4","2","1","2","1","3","4","2","3","2","3","4","1","4","1","3","4","3","2","1","3","2","2","2","1","4","2"],
  L4: ["2","4","3","4","2","2","2","1","2","4","3","2","1","3","3","3","4","1","1","3","3","2","3","2","3","1","4","4","2","4","3","1","2"]
};

const CHESS_GRAMMAR_KEY = {
  D: [
    "studies",
    "doesn't drink",
    "Did / read",
    "to talk",
    "What",
    "How often",
    "better",
    "were",
    "Is / having or eating",
    "Aren't / going to"
  ],
  L: [
    "harder",
    "plans",
    "much",
    "shocking",
    "sad",
    "drums or There is",
    "says",
    "will ->did or in 2014제거",
    "It is / to use",
    "able to read"
  ]
};
const CHESS_GRAMMAR_LABELS = {
  D: [
    "일반동사 현재시제 사용",
    "일반동사 부정문",
    "일반동사 과거시제 의문문",
    "To 부정사 명사적용법 (목적어의 쓰임)",
    "의문대명사 what의 쓰임",
    "의문부사 how의 쓰임",
    "불규칙 비교급의 형태",
    "과거 be동사 수일치",
    "현재진행형 의문문",
    "미래시제의 표현"
  ],
  L: [
    "비교급과 최상급의 형태",
    "To 부정사 명사적 용법 (목적어의 쓰임)",
    "수량형용사 many / much",
    "감정형용사의 형태와 의미",
    "형용사와 부사의 역할",
    "셀 수 있는 명사의 표현",
    "현재시제 일반동사 단순형 표현",
    "미래시제 일치",
    "to부정사의 가주어, 진주어 쓰임",
    "Can의 유사표현"
  ]
};
let LAST_CHESS_SESSION = null;
let CURRENT_CHESS_EXAM_KEY = "";

function getChessLevel(score, testType) {
  const s = Number(score);
  const t = String(testType || "").trim().toUpperCase();

  if (Number.isNaN(s)) return "미배정";

  const rules = CHESS_LEVEL_RULES[t];
  if (!rules) return "미배정";

  for (const rule of rules) {
    if (s >= rule.min && s <= rule.max) return rule.level;
  }

  return "미배정";
}

function normalizeChessAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,]/g, "");
}
/* CHESS 답안 입력 즉시 정오답 색칠 (정답 비교는 normalizeChessAnswer 기준) */
function markChessAns(input, correctVal) {
  const v = (input.value || "").trim();
  if (v === "" || correctVal == null || correctVal === "") {
    input.style.background = ""; input.style.borderColor = ""; input.style.color = "";
    return;
  }
  const ok = normalizeChessAnswer(v) === normalizeChessAnswer(correctVal);
  input.style.background = ok ? "#e4f6ee" : "#fdecec";
  input.style.borderColor = ok ? "#22a06b" : "#e5484d";
  input.style.color = ok ? "#1a7a4f" : "#c2373b";
}
/* 저장된(미리 채워진) CHESS 답안도 열 때 색칠 */
function markAllChess() {
  document.querySelectorAll('input[id^="chess-q-"]').forEach(el => markChessAns(el, el.dataset ? el.dataset.ans : null));
  if (typeof markAns === "function") document.querySelectorAll('input[id^="chess-g-"]').forEach(el => markAns(el, "1"));
}

function getChessMeta(examName) {
  const t = String(examName || "").toUpperCase();
  return {
    isDType: /^D[1-4]$/.test(t),
    isLType: /^L[1-4]$/.test(t),
    hasGrammar: t === "D3" || t === "D4" || /^L[1-4]$/.test(t),
    grammarType: (t === "D3" || t === "D4") ? "D" : (/^L[1-4]$/.test(t) ? "L" : null)
  };
}

function getChessQuestionCount(examName) {
  const list = CHESS_ANSWER_KEY[String(examName || "").toUpperCase()];
  return Array.isArray(list) ? list.length : 0;
}

function buildChessAnswerInputs(examName) {
  const count = getChessQuestionCount(examName);
  if (!count) return `<p class="muted">답안 데이터가 없습니다.</p>`;
  const key = CHESS_ANSWER_KEY[String(examName || "").toUpperCase()] || [];
  const hasGrammar = getChessMeta(examName).hasGrammar;

  return `
    <div class="answer-list">
      ${Array.from({ length: count }).map((_, i) => `
        <div class="answer-row simple">
          <div class="question-no">${i + 1}</div>
          <input
            id="chess-q-${i + 1}"
            type="text"
            class="answer-input"
            autocomplete="off"
            data-ans="${esc(key[i] == null ? "" : key[i])}"
            oninput="markChessAns(this, this.dataset.ans)"
            onkeydown="moveLinear(event,'chess-q',${i + 1},${count},'${hasGrammar ? "chess-g-1" : ""}')"
          >
          <div class="answer-meta">답안</div>
        </div>
      `).join("")}
    </div>
  `;
}

function buildChessGrammarInputs(examName) {
 const meta = getChessMeta(examName);
  if (!meta.hasGrammar) return "";

  const answerKey = CHESS_GRAMMAR_KEY[meta.grammarType] || [];
  const title = meta.grammarType === "D" ? "서술형 문법 (D3/D4)" : "서술형 문법 (L type)";

  return `
    <div class="chess-section">
      <h3>${title}</h3>
      <p class="muted">서술형은 맞으면 1, 틀리면 0 입력</p>

      <div class="answer-list">
        ${answerKey.map((ans, i) => `
          <div class="answer-row">
            <div class="question-no">${i + 1}</div>
            <div class="answer-meta left">${ans}</div>
            <input
              id="chess-g-${i + 1}"
              type="text"
              maxlength="1"
              class="answer-input"
              inputmode="numeric"
              oninput="onlyBinary(this)"
              onkeydown="moveLinear(event,'chess-g',${i + 1},${answerKey.length},'')"
              placeholder="0/1"
            >
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function buildChessRubricInputs(examName) {
  const meta = getChessMeta(examName);

  const cleanKey = String(examName || "")
    .toUpperCase()
    .match(/[DL][1-4]/)?.[0] || "";

  const phonicsRow = `
    <div class="answer-row">
      <div class="question-no">P</div>
      <div class="answer-meta left">Phonics 파닉스</div>
      <select id="chess-speak-phonics" class="answer-input">
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
      </select>
    </div>
  `;

  const d1Rows = `
    <div class="answer-row">
      <div class="question-no">L</div>
      <div class="answer-meta left">Listening 청취력</div>
      <select id="chess-speak-listening" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">V</div>
      <div class="answer-meta left">Vocabulary 어휘력</div>
      <select id="chess-speak-vocabulary" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">C</div>
      <div class="answer-meta left">Speaking - Complexity 회화 문장 수준</div>
      <select id="chess-speak-complexity" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    ${phonicsRow}
  `;

  const d2Rows = `
    <div class="answer-row">
      <div class="question-no">L</div>
      <div class="answer-meta left">Listening 청취력</div>
      <select id="chess-speak-listening" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">V</div>
      <div class="answer-meta left">Vocabulary 어휘력</div>
      <select id="chess-speak-vocabulary" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">C</div>
      <div class="answer-meta left">Speaking - Complexity 회화 문장 수준</div>
      <select id="chess-speak-complexity" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    ${phonicsRow}

    <div class="answer-row">
      <div class="question-no">RF</div>
      <div class="answer-meta left">Reading Fluency 유창성</div>
      <select id="chess-read-fluency" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">RC</div>
      <div class="answer-meta left">Reading – Complexity 문장 수준</div>
      <select id="chess-read-complexity" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">R</div>
      <div class="answer-meta left">Comprehension 이해력</div>
      <select id="chess-read-comprehension" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>
  `;

  const generalRows = `
    <div class="answer-row">
      <div class="question-no">L</div>
      <div class="answer-meta left">Listening 청취력</div>
      <select id="chess-speak-listening" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">V</div>
      <div class="answer-meta left">Vocabulary 어휘력</div>
      <select id="chess-speak-vocabulary" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">C</div>
      <div class="answer-meta left">Speaking - Complexity 회화 문장 수준</div>
      <select id="chess-speak-complexity" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">RF</div>
      <div class="answer-meta left">Reading Fluency 유창성</div>
      <select id="chess-read-fluency" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">RC</div>
      <div class="answer-meta left">Reading – Complexity 문장 수준</div>
      <select id="chess-read-complexity" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>

    <div class="answer-row">
      <div class="question-no">R</div>
      <div class="answer-meta left">Comprehension 이해력</div>
      <select id="chess-read-comprehension" class="answer-input">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>
  `;

  let speakingRows = generalRows;
  if (cleanKey === "D1") speakingRows = d1Rows;
  if (cleanKey === "D2") speakingRows = d2Rows;

  const speakingHtml = `
    <div class="chess-section">
      <h3>Speaking / Reading 평가</h3>
      <div class="answer-list">
        ${speakingRows}
      </div>
    </div>
  `;

  if (!meta.isLType) return speakingHtml;

let writingHtml = "";

if (meta.isLType) {
  const isL34 = cleanKey === "L3" || cleanKey === "L4";

  if (isL34) {
    writingHtml = `
      <div class="chess-section">
        <h3>Writing 평가</h3>
        <div class="answer-list">
          <div class="answer-row">
            <div class="question-no">T</div>
            <div class="answer-meta left">Task Completion</div>
            <select id="chess-write-task" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>

          <div class="answer-row">
            <div class="question-no">TS</div>
            <div class="answer-meta left">Topic Sentence</div>
            <select id="chess-write-topic" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>

          <div class="answer-row">
            <div class="question-no">SD</div>
            <div class="answer-meta left">Supporting Details</div>
            <select id="chess-write-details" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>

          <div class="answer-row">
            <div class="question-no">O</div>
            <div class="answer-meta left">Organization</div>
            <select id="chess-write-organization" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>

          <div class="answer-row">
            <div class="question-no">G</div>
            <div class="answer-meta left">Mechanics and Grammar</div>
            <select id="chess-write-grammar" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>
        </div>
      </div>
    `;
  } else {
    writingHtml = `
      <div class="chess-section">
        <h3>Writing 평가</h3>
        <div class="answer-list">
          <div class="answer-row">
            <div class="question-no">T</div>
            <div class="answer-meta left">Task Completion</div>
            <select id="chess-write-task" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>

          <div class="answer-row">
            <div class="question-no">IO</div>
            <div class="answer-meta left">Ideas and Organization</div>
            <select id="chess-write-topic" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>

          <div class="answer-row">
            <div class="question-no">P</div>
            <div class="answer-meta left">Paraphrasing</div>
            <select id="chess-write-details" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>

          <div class="answer-row">
            <div class="question-no">G</div>
            <div class="answer-meta left">Mechanics and Grammar</div>
            <select id="chess-write-grammar" class="answer-input">
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
}

return speakingHtml + writingHtml;
}
function showChessAnswerSheet() {
  const examKey = String(
    CURRENT_CHESS_EXAM_KEY ||
    LAST_CHESS_SESSION?.examName ||
    ""
  ).trim().toUpperCase();

  if (!examKey) {
    alert("시험 키가 없습니다.");
    return;
  }

  const key = CHESS_ANSWER_KEY[examKey];

  if (!Array.isArray(key) || !key.length) {
    alert("답안 데이터 없음");
    return;
  }

  const groups = [];
  for (let i = 0; i < key.length; i += 5) {
    groups.push(key.slice(i, i + 5));
  }

  const grammarType =
    (examKey === "D3" || examKey === "D4") ? "D" :
    (/^L[1-4]$/.test(examKey) ? "L" : null);

  const grammarAnswers = grammarType ? (CHESS_GRAMMAR_KEY[grammarType] || []) : [];

  const html = `
    <div class="answer-sheet-wrap">
      <div class="answer-head">
        <div>
          <div class="answer-label">CHESS ANSWER SHEET</div>
          <h2>${examKey} 답지</h2>
          <p>객관식${grammarAnswers.length ? " / 서술형 문법" : ""} 정답표</p>
        </div>
        <button type="button" class="answer-close-btn" onclick="closeAnswerModal()">닫기</button>
      </div>

      <div class="answer-section-title">객관식 답지</div>
      <div class="answer-group-grid">
        ${groups.map((group, gi) => `
          <div class="answer-group-card">
            <div class="answer-group-title">${gi * 5 + 1} ~ ${gi * 5 + group.length}</div>
            <div class="answer-chip-grid">
              ${group.map((ans, i) => `
                <div class="answer-chip">
                  <div class="answer-chip-no">${gi * 5 + i + 1}</div>
                  <div class="answer-chip-val">${ans}</div>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>

      ${grammarAnswers.length ? `
        <div class="answer-section-title" style="margin-top:24px;">
          서술형 문법 (${grammarType === "D" ? "D3/D4" : "L type"})
        </div>

        <div style="display:grid; gap:12px;">
          ${grammarAnswers.map((ans, i) => `
            <div style="
              background:#fff;
              border:1px solid #dbe7f3;
              border-radius:16px;
              padding:14px 16px;
              box-shadow:0 6px 16px rgba(15,23,42,0.04);
            ">
              <div style="
                font-size:13px;
                font-weight:800;
                color:#6b7c93;
                margin-bottom:6px;
              ">${i + 1}번</div>

              <div style="
                font-size:17px;
                font-weight:800;
                color:#1f5d96;
                line-height:1.55;
                white-space:pre-wrap;
              ">${ans}</div>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;

  openAnswerModalContent(html);
}
function renderChessInput(student) {
  const { memberCode, name, school, grade, testDate, examName } = student;
CURRENT_CHESS_EXAM_KEY = String(examName || "")
  .toUpperCase()
  .match(/[DL][1-4]/)?.[0] || "";
  const cleanKey = String(examName || "")
  .toUpperCase()
  .match(/[DL][1-4]/)?.[0] || "";

CURRENT_CHESS_EXAM_KEY = cleanKey;

const config = CHESS_CONFIG[cleanKey];

  if (!config) {
    alert("CHESS 시험 설정이 없습니다.");
    return;
  }

  LAST_CHESS_SESSION = { memberCode, name, school, grade, testDate, examName };

  app.innerHTML = `
    <h1>${examName}</h1>
    <p class="muted" style="margin-bottom:12px;">
      <strong>${name}</strong> · ${school} · ${grade} · ${formatDate(testDate)} · ${examName}
    </p>

   <div class="top-bar no-print sticky-actions">
  <button class="secondary" onclick="renderHome()">처음으로</button>
  <button onclick="checkChessExam()">채점하기</button>
</div>

    <div class="chess-section">
      <h3>답안 입력</h3>
      <p class="muted">답안을 그대로 입력하면 자동 채점됩니다.</p>
      ${buildChessAnswerInputs(examName)}
    </div>

    ${buildChessGrammarInputs(examName)}
    ${buildChessRubricInputs(examName)}
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("chess-q-1")?.focus();
  markAllChess();
}

function collectChessAnswers(examName) {
  const count = getChessQuestionCount(examName);
  return Array.from({ length: count }).map((_, i) =>
    document.getElementById(`chess-q-${i + 1}`)?.value || ""
  );
}

function evaluateChessObjective(examName, userAnswers) {
  const key = CHESS_ANSWER_KEY[String(examName || "").toUpperCase()] || [];
  const results = key.map((correctAnswer, idx) => {
    const user = userAnswers[idx] || "";
    const correct = normalizeChessAnswer(user) === normalizeChessAnswer(correctAnswer);
    return {
      no: idx + 1,
      user,
      answer: correctAnswer,
      correct,
      earned: correct ? 1 : 0
    };
  });

  const totalCorrect = results.filter(r => r.correct).length;
  const totalCount = results.length;
  const rate = totalCount ? Math.round((totalCorrect / totalCount) * 100) : 0;

  return {
    results,
    totalCorrect,
    totalCount,
    rate
  };
}

function evaluateChessGrammar(examName) {
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
    const raw = document.getElementById(`chess-g-${idx + 1}`)?.value || "0";
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
    totalScore: results.reduce((a, b) => a + b.earned, 0)
  };
}

function collectChessRubrics(examName) {
  const meta = getChessMeta(examName);

  const rubrics = {
speaking: {
  listening: document.getElementById("chess-speak-listening")?.value || "",
  vocabulary: document.getElementById("chess-speak-vocabulary")?.value || "",
  complexity: document.getElementById("chess-speak-complexity")?.value || "",
  phonics: document.getElementById("chess-speak-phonics")?.value || "",
  readFluency: document.getElementById("chess-read-fluency")?.value || "",
  readComplexity: document.getElementById("chess-read-complexity")?.value || "",
  readComprehension: document.getElementById("chess-read-comprehension")?.value || ""
},
    writing: null
  };

  if (meta.isLType) {
    rubrics.writing = {
      task: document.getElementById("chess-write-task")?.value || "",
      topic: document.getElementById("chess-write-topic")?.value || "",
      details: document.getElementById("chess-write-details")?.value || "",
      organization: document.getElementById("chess-write-organization")?.value || "",
      grammar: document.getElementById("chess-write-grammar")?.value || ""
    };
  }

  return rubrics;
}

function checkChessExam() {
  if (!LAST_CHESS_SESSION) {
    alert("학생 정보가 없습니다.");
    return;
  }

  const { examName } = LAST_CHESS_SESSION;

  const userAnswers = collectChessAnswers(examName);
  const objective = evaluateChessObjective(examName, userAnswers);
  const grammar = evaluateChessGrammar(examName);
  const rubrics = collectChessRubrics(examName);

  const totalScore = objective.rate;
  const assignedLevel = getChessLevel(totalScore, examName);

  const chessEvaluation = {
    ...LAST_CHESS_SESSION,
    examName,
    totalScore,
    assignedLevel,
    objective,
    grammar,
    rubrics
  };

  LAST_CHESS_SESSION = chessEvaluation;
  renderChessReview(chessEvaluation);
}

function renderChessReview(data) {
  const {
    memberCode, name, school, grade, testDate, examName,
    totalScore, assignedLevel, objective, grammar
  } = data;

  const answerRows = objective.results.map(r => `
    <div class="review-row ${r.correct ? "correct" : "wrong"}">
      <div class="review-no">${r.no}번</div>
      <div class="review-state">${r.correct ? "정답" : "오답"}</div>
      <div class="review-answer">내 답: ${esc(r.user || "-")}</div>
      <div class="review-correct-answer">정답: ${esc(r.answer)}</div>
    </div>
  `).join("");

  const grammarSection = grammar.results.length ? `
    <div class="chess-section">
      <h3>서술형 문법 확인</h3>
      <div class="review-grid compact-review-grid">
        ${grammar.results.map(r => `
          <div class="review-row ${r.binary === 1 ? "correct" : "wrong"}">
            <div class="review-no">${r.no}번</div>
            <div class="review-state">${r.binary === 1 ? "정답" : "오답"}</div>
            <div class="review-answer">입력: ${r.binary}</div>
            <div class="review-correct-answer">정답 기준: ${esc(r.guide)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

   const chessLevelOpts = getLevelOptions("", examName);
  const chessLevelSelect = chessLevelOpts.map(lv =>
    `<option value="${lv}" ${lv === assignedLevel ? "selected" : ""}>${lv}</option>`
  ).join("");

  app.innerHTML = `
    <div class="top-bar no-print sticky-actions">
      <button class="secondary" onclick="renderChessInput({
        memberCode: '${escapeJs(memberCode)}',
        name: '${escapeJs(name)}',
        school: '${escapeJs(school)}',
        grade: '${escapeJs(grade)}',
        testDate: '${escapeJs(testDate)}',
        examName: '${escapeJs(examName)}'
      })">답안입력으로 돌아가기</button>
      <button onclick="renderChessReport()">성적표 보기</button>
      <button class="secondary" onclick="renderHome()">처음으로</button>
    </div>

    <div class="top-bar no-print" style="margin-top:8px; gap:10px; align-items:center;">
      <span style="font-weight:700; color:#1f5d96;">자동 배정 레벨: <strong>${esc(assignedLevel)}</strong></span>
      <span style="color:#64748b;">→ 직접 변경:</span>
      <select onchange="overrideChessLevel(this.value)" style="font-size:15px; font-weight:700; padding:6px 12px; border-radius:10px; border:1.5px solid #1f5d96; color:#1f5d96;">
        ${chessLevelSelect}
      </select>
    </div>

    <h1>채점 결과 확인</h1>

    <p class="muted" style="margin-bottom:16px;">
      <strong>${name}</strong> · ${school} · ${grade} · ${formatDate(testDate)} · ${examName}
    </p>

    <div class="chess-summary-box kpi-style">
  <div class="kpi">
    <div class="kpi-label">총점</div>
    <div class="kpi-value">${totalScore}<span>/100</span></div>
  </div>

  <div class="kpi">
    <div class="kpi-label">레벨</div>
    <div class="kpi-value">${assignedLevel}</div>
  </div>

  <div class="kpi">
    <div class="kpi-label">객관식</div>
    <div class="kpi-value">${objective.totalCorrect}<span>/${objective.totalCount}</span></div>
  </div>

  ${grammar.results.length ? `
  <div class="kpi">
    <div class="kpi-label">서술형</div>
    <div class="kpi-value">${grammar.totalCorrect}<span>/${grammar.totalCount}</span></div>
  </div>
  ` : ""}
</div>

    <div class="chess-section">
      <h3>객관식 / 단답형 확인</h3>
      <div class="review-grid compact-review-grid">
        ${answerRows}
      </div>
    </div>

    ${grammarSection}
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}
function overrideChessLevel(newLevel) {
  if (!LAST_CHESS_SESSION) return;
  LAST_CHESS_SESSION.assignedLevel = newLevel;
}

function renderChessReport() {
  if (!LAST_CHESS_SESSION || typeof LAST_CHESS_SESSION.totalScore === "undefined") {
    alert("채점 결과가 없습니다.");
    return;
  }

  const data = LAST_CHESS_SESSION;
  const {
    name, school, grade, testDate, examName,
    totalScore, assignedLevel, objective, grammar, rubrics
  } = data;

  const cleanKey = String(examName || "")
    .toUpperCase()
    .match(/[DL][1-4]/)?.[0] || "";

  function getProfile() {
    if (cleanKey === "D1") {
      return {
        test01Title: "TEST01 이해 능력 평가 득점 현황(영역별)",
        test01Rows: [
          { label: "Listening Comprehension", base: 49 },
          { label: "Reading Comprehension", base: 51 }
        ],
        speaking: [
          {
            key: "listening",
            title: "Listening 청취력",
            grades: {
              A: "대부분 질문에 대해 잘 알아듣고 이해합니다.",
              B: "대부분 질문을 알아듣지만 가끔 확인이 필요합니다.",
              C: "질문을 잘 이해하지 못해 추가 설명이 필요합니다.",
              D: "질문을 거의 알아듣지 못합니다."
            }
          },
          {
            key: "vocabulary",
            title: "Vocabulary 어휘 수준",
            grades: {
              A: "풍부한 어휘를 알고 있으며 적절히 잘 사용합니다.",
              B: "어휘는 잘 알고 있으나 상황에 맞지 않게 사용하는 경우가 있습니다.",
              C: "어휘를 어느 정도 알고 있으나 제한된 수준입니다.",
              D: "어휘력이 부족해 표현하기 힘듭니다."
            }
          },
          {
            key: "complexity",
            title: "Complexity 문장 수준",
            grades: {
              A: "질문에 대하여 다양하고 완전한 문장으로 대답합니다.",
              B: "문장으로 대답하려 시도하나 문장이 불완전합니다.",
              C: "단어로 답하거나 짧고 간단하게 대답합니다.",
              D: "전혀 대답하지 못합니다."
            }
          },
          {
            key: "phonics",
            title: "Phonics 파닉스",
            grades: {
              A: "Phonics 규칙을 알고 문장을 유창하게 읽습니다.",
              B: "잘 읽지만 몇몇 단어 발음에 오류가 있습니다.",
              C: "읽으려 하나 Phonics가 부족하여 읽기에 어려움이 있습니다.",
              D: "Phonics 학습의 시작 단계입니다."
            }
          }
        ],
        showGrammar: false,
        writingType: null
      };
    }

    if (cleanKey === "D2") {
      return {
        test01Title: "TEST01 이해 능력 평가 득점 현황(영역별)",
        test01Rows: [
          { label: "Listening Comprehension", base: 46 },
          { label: "Reading Comprehension", base: 36 },
          { label: "Vocabulary in Context", base: 18 }
        ],
        speaking: [
          {
            key: "listening",
            title: "Listening 청취력",
            grades: {
              A: "일상적 회화에 대한 질문을 잘 알아 듣고 이해합니다.",
              B: "일상적 회화에 대해 대부분 알아 들으나 가끔 확인을 필요로 합니다.",
              C: "일상적 회화에 대해 빈번하게 이해하지 못한 질문이 있어서 추가적인 설명이 필요합니다.",
              D: "질문을 전혀 알아듣지 못합니다."
            }
          },
          {
            key: "vocabulary",
            title: "Vocabulary 어휘력",
            grades: {
              A: "일상적 회화에 풍부한 어휘를 바탕으로 적절하게 잘 사용하여 대답합니다.",
              B: "일상적 회화에 어휘를 잘 알고 있지만 부적절하게 사용하는 경우가 있습니다.",
              C: "기본적 어휘를 갖추고 있지만 사용에 제한이 있습니다.",
              D: "일상적 회화에 어휘가 많이 부족하여 생각을 표현하기 힘듭니다."
            }
          },
          {
            key: "complexity",
            title: "Complexity 회화 문장 수준",
            grades: {
              A: "일상적 회화에서 복잡한 문장구조를 갖춘 문장으로 완벽하게 대답합니다.",
              B: "일상적 회화에 완전한 문장으로 이야기합니다.",
              C: "문장으로 대답하려고 시도하나 불완전한 문장으로 대답합니다.",
              D: "질문에 전혀 대답하지 못합니다."
            }
          },
          {
            key: "phonics",
            title: "Phonics 파닉스",
            grades: {
              A: "Phonics 규칙을 알고 문장을 유창하게 읽습니다.",
              B: "잘 읽지만 몇몇 단어 발음에 오류가 있습니다.",
              C: "읽으려 하나 Phonics가 부족하여 읽기에 어려움이 있습니다.",
              D: "Phonics 학습의 시작 단계입니다."
            }
          },
          {
            key: "readFluency",
            title: "Reading Fluency 유창성",
            grades: {
              A: "주어진 읽기 자료를 적절한 속도로 유창하게 읽습니다.",
              B: "주어진 읽기 자료를 대체적으로 잘 읽지만 일부 단어들의 발음이 틀립니다.",
              C: "주어진 읽기 자료를 읽는 속도가 조금 느리며 억양, 강세, 끊어 읽기가 부족합니다.",
              D: "주어진 읽기 자료를 읽는데 모르는 단어가 많아서 읽기 어려워 합니다."
            }
          },
          {
            key: "readComplexity",
            title: "Complexity 읽기 문장 수준",
            grades: {
              A: "질문에 복잡한 구조로 이루어진 다양하고 완전한 문장으로 대답할 수 있습니다.",
              B: "질문에 대한 대답을 완전한 문장으로 이야기하지만 문법적 실수가 있습니다.",
              C: "질문에 대해 단어로 대답하거나 짧게 대답합니다.",
              D: "질문에 대해 전혀 대답하지 못합니다."
            }
          },
          {
            key: "readComprehension",
            title: "Comprehension 이해력",
            grades: {
              A: "주어진 읽기 자료에 대한 질문을 정확한 문장으로 대답합니다.",
              B: "주어진 읽기 자료에 대한 질문을 대답하지만 답의 내용이 부족합니다.",
              C: "주어진 읽기 자료에 대한 질문을 대답하지만 답의 내용이 오류가 있습니다.",
              D: "주어진 읽기 자료에 대한 질문을 대답하지 못합니다."
            }
          }
        ],
        showGrammar: false,
        writingType: null
      };
    }

    const commonSpeaking = [
      {
        key: "listening",
        title: "Listening 청취력",
        grades: {
          A: "일상적 회화에 대한 질문을 잘 알아 듣고 이해합니다.",
          B: "일상적 회화에 대해 대부분 알아 들으나 가끔 확인을 필요로 합니다.",
          C: "일상적 회화에 대해 빈번하게 이해하지 못한 질문이 있어서 추가적인 설명이 필요합니다.",
          D: "질문을 전혀 알아듣지 못합니다."
        }
      },
      {
        key: "vocabulary",
        title: "Vocabulary 어휘력",
        grades: {
          A: "일상적 회화에 풍부한 어휘를 바탕으로 적절하게 잘 사용하여 대답합니다.",
          B: "일상적 회화에 어휘를 잘 알고 있지만 부적절하게 사용하는 경우가 있습니다.",
          C: "기본적 어휘를 갖추고 있지만 사용에 제한이 있습니다.",
          D: "일상적 회화에 어휘가 많이 부족하여 생각을 표현하기 힘듭니다."
        }
      },
      {
        key: "complexity",
        title: "Complexity 회화 문장 수준",
        grades: {
          A: "일상적 회화에서 복잡한 문장구조를 갖춘 문장으로 완벽하게 대답합니다.",
          B: "일상적 회화에 완전한 문장으로 이야기합니다.",
          C: "문장으로 대답하려고 시도하나 불완전한 문장으로 대답합니다.",
          D: "질문에 대해 단어로 대답하거나 짧게 대답합니다."
        }
      },
      {
        key: "readFluency",
        title: "Reading Fluency 유창성",
        grades: {
          A: "주어진 읽기 자료를 적절한 속도로 유창하게 읽습니다.",
          B: "주어진 읽기 자료를 대체적으로 잘 읽지만 일부 단어들의 발음이 틀립니다.",
          C: "주어진 읽기 자료를 읽는 속도가 조금 느리며 단어의 억양, 강세, 끊어 읽기가 부족합니다.",
          D: "주어진 읽기 자료를 읽는데 모르는 단어가 많아서 읽기 어려워 합니다."
        }
      },
      {
        key: "readComplexity",
        title: "Reading – Complexity 문장 수준",
        grades: {
          A: "질문에 복잡한 구조로 이루어진 다양하고 완전한 문장으로 대답할 수 있습니다.",
          B: "질문에 대한 대답을 완전한 문장으로 이야기합니다.",
          C: "문장으로 대답하려고 시도하나 불완전한 문장으로 대답합니다.",
          D: "질문에 대해 단어로 대답하거나 짧게 대답합니다."
        }
      },
      {
        key: "readComprehension",
        title: "Comprehension 이해력",
        grades: {
          A: "주어진 읽기 자료에 대한 질문을 정확한 문장으로 대답합니다.",
          B: "주어진 읽기 자료에 대한 질문을 대답하지만 답의 내용이 부족합니다.",
          C: "주어진 읽기 자료에 대한 질문을 대답하지만 답의 내용이 오류가 있습니다.",
          D: "주어진 읽기 자료에 대한 질문을 대답하지 못합니다."
        }
      }
    ];

    if (cleanKey === "D3" || cleanKey === "D4") {
      return {
        test01Title: "TEST01 이해 능력 평가 득점 현황(영역별)",
        test01Rows: [
          { label: "Listening Comprehension", base: 40 },
          { label: "Reading Comprehension", base: 60 }
        ],
        speaking: commonSpeaking,
        showGrammar: true,
        writingType: null
      };
    }

    if (cleanKey === "L1" || cleanKey === "L2") {
      return {
        test01Title: "TEST01 이해 능력 평가 득점 현황(영역별)",
        test01Rows: [
          { label: "Listening Comprehension", base: 46 },
          { label: "Reading Comprehension", base: 54 }
        ],
        speaking: commonSpeaking,
        showGrammar: true,
        writingType: "SUMMARY"
      };
    }

    return {
      test01Title: "TEST01 이해 능력 평가 득점 현황(영역별)",
      test01Rows: [
        { label: "Listening Comprehension", base: 46 },
        { label: "Reading Comprehension", base: 54 }
      ],
      speaking: commonSpeaking,
      showGrammar: true,
      writingType: "PARAGRAPH"
    };
  }

  function getWritingItems(type) {
    if (type === "SUMMARY") {
      return [
        {
          key: "task",
          title: "Task Completion 글의 완성도",
          grades: {
            A: "주어진 글을 보고 5~7개의 문장으로 구성하여 요약할 수 있습니다.",
            B: "주어진 글을 보고 3~4개의 문장으로 구성하여 요약할 수 있습니다.",
            C: "주어진 글을 보고 1~2개의 문장으로 구성하여 요약할 수 있습니다.",
            D: "주어진 글을 요약하지 못합니다."
          }
        },
        {
          key: "topic",
          title: "Ideas and Organization 계획과 구조",
          grades: {
            A: "내용의 중요한 구성을 명확하게 파악하고, 흐름대로 잘 요약합니다.",
            B: "중요한 부분은 파악했지만 전반적인 흐름이 약합니다.",
            C: "중요한 부분 파악은 했으나 충분한 내용이 포함되지 않았습니다.",
            D: "스토리의 주요 내용이 포함되지 않거나 관련 없는 내용으로 구성됩니다."
          }
        },
        {
          key: "details",
          title: "Paraphrasing 의역하기",
          grades: {
            A: "다양한 문장 구성력으로 전체적으로 글을 잘 요약하였습니다.",
            B: "요약 시 유의어들을 활용합니다.",
            C: "전반적으로 제시문의 문장들을 그대로 사용합니다.",
            D: "의역이 거의 이루어지지 않습니다."
          }
        },
        {
          key: "grammar",
          title: "Mechanics and Grammar 문법",
          grades: {
            A: "문법적으로 틀린 부분이 없습니다.",
            B: "문법적으로 틀린 부분이 1, 2개 있습니다.",
            C: "문법적으로 틀린 부분이 3~5개 있습니다.",
            D: "문법적으로 틀린 부분이 6개 이상 있습니다."
          }
        }
      ];
    }

    if (type === "PARAGRAPH") {
      return [
        {
          key: "task",
          title: "Task Completion 글의 완성도",
          grades: {
            A: "주어진 미션에 대해 10~12개의 문장으로 구성하여 글을 작성할 수 있습니다.",
            B: "주어진 미션에 대해 6~9개의 문장으로 구성하여 글을 작성할 수 있습니다.",
            C: "주어진 미션에 대해 5개 이하 문장으로 구성하여 글을 작성할 수 있습니다.",
            D: "주어진 미션을 거의 수행하지 못합니다."
          }
        },
        {
          key: "topic",
          title: "Topic Sentence 글의 주제문",
          grades: {
            A: "글쓰기에서 주제가 명확하게 제시되어 있습니다.",
            B: "주제가 제시되어 있긴 하지만 명확하지 않습니다.",
            C: "주제가 제시되어 있지 않고 관련 없는 내용이 있습니다.",
            D: "주제문이 전혀 없습니다."
          }
        },
        {
          key: "details",
          title: "Supporting Details 글의 세부문장",
          grades: {
            A: "전체적으로 주제와 관련된 세부설명과 예시들이 잘 전개되어 있습니다.",
            B: "대부분의 세부 설명이 글의 주제와 관련된 내용으로 전개되어 있습니다.",
            C: "대부분의 세부 설명이 모호하고 글의 주제와 관련이 없습니다.",
            D: "세부 설명이 거의 없습니다."
          }
        },
        {
          key: "organization",
          title: "Organization 문단 구조",
          grades: {
            A: "단락의 각 구성요소들이 논리적으로 잘 전개되어 있습니다.",
            B: "일부분이 빠져 있거나 논리적으로 전개되어 있지 않습니다.",
            C: "주요 구성요소들의 상당 부분이 놓쳐져 있습니다.",
            D: "문단 구조가 거의 보이지 않습니다."
          }
        },
        {
          key: "grammar",
          title: "Mechanics and Grammar 문법",
          grades: {
            A: "문법적으로 틀린 부분이 없습니다.",
            B: "문법적으로 틀린 부분이 1, 2개 있습니다.",
            C: "문법적으로 틀린 부분이 3~5개 있습니다.",
            D: "문법적으로 틀린 부분이 6개 이상 있습니다."
          }
        }
      ];
    }

    return [];
  }

  function renderCriteriaCard(title, score, grades) {
  return `
    <div class="chess-report-card">
      <div class="chess-report-card-title chess-report-card-title--top">${title}</div>

      <div class="chess-report-card-inner chess-report-card-inner--fixed">
        <div class="chess-report-card-left chess-report-card-left--fixed">
          <div class="chess-report-grade-box chess-report-grade-box--fixed">
            <div class="chess-report-grade-label">SCORE</div>
            <div class="chess-report-grade-value">${score || "-"}</div>
          </div>
        </div>

        <div class="chess-report-card-right chess-report-card-right--fixed">
          <table class="chess-report-criteria-table chess-report-criteria-table--fixed">
            <tbody>
              ${["A", "B", "C", "D"].map(g => `
                <tr>
                  <td class="chess-report-criteria-grade">${g}</td>
                  <td class="chess-report-criteria-desc">${grades[g] || ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

  const profile = getProfile();

  let test01RowsHtml = "";
  if (profile.test01Rows.length === 3) {
    const listen = Math.round(totalScore * 0.46);
    const read = Math.round(totalScore * 0.36);
    const vocab = totalScore - listen - read;
    const earned = [listen, read, vocab];

    test01RowsHtml = profile.test01Rows.map((row, idx) => {
      const score = earned[idx];
      const rate = ((score / row.base) * 100).toFixed(1);
      return `
        <tr>
          <td>${row.label}</td>
          <td class="center">${row.base}</td>
          <td class="center">${score}</td>
          <td class="center">${rate}%</td>
        </tr>
      `;
    }).join("");
  } else {
    const firstBase = profile.test01Rows[0].base;
    const firstScore = Math.round(totalScore * (firstBase / 100));
    const secondScore = totalScore - firstScore;

    const earned = [firstScore, secondScore];

    test01RowsHtml = profile.test01Rows.map((row, idx) => {
      const score = earned[idx];
      const rate = ((score / row.base) * 100).toFixed(1);
      return `
        <tr>
          <td>${row.label}</td>
          <td class="center">${row.base}</td>
          <td class="center">${score}</td>
          <td class="center">${rate}%</td>
        </tr>
      `;
    }).join("");
  }

  const speakingCards = profile.speaking.map(item => {
    const score = rubrics?.speaking?.[item.key] || "";
    return renderCriteriaCard(item.title, score, item.grades);
  }).join("");

  const writingItems = getWritingItems(profile.writingType);
  const writingCards = writingItems.map(item => {
    const score = rubrics?.writing?.[item.key] || "";
    return renderCriteriaCard(item.title, score, item.grades);
  }).join("");
const grammarLabels = CHESS_GRAMMAR_LABELS[
  getChessMeta(examName).grammarType
] || [];
  const grammarSection = profile.showGrammar && grammar?.results?.length ? `
  <div class="chess-report-combined-section">
    <div class="chess-report-section-title">TEST03. Grammar in Writing</div>
    <div class="chess-report-subcopy">
      체스 문법 수업은 일정 기간 이상 언어 노출이 이루어진 학생들을 대상으로 정확한 의사소통을 위해
      문법의 활용과 쓰임을 확인하는 평가입니다.
    </div>
    <table class="chess-report-table">
      <thead>
        <tr>
          <th>번호</th>
          <th>유형</th>
          <th>배점</th>
          <th>득점</th>
        </tr>
      </thead>
      <tbody>
       ${grammar.results.map(r => `
  <tr>
    <td class="center">${r.no}</td>
    <td>${esc(grammarLabels[r.no - 1] || "")}</td>
    <td class="center">10</td>
    <td class="center">${r.earned}</td>
  </tr>
`).join("")}
        <tr class="total-row">
          <td colspan="3" class="center">총점</td>
          <td class="center">${grammar.totalScore}</td>
        </tr>
      </tbody>
    </table>
  </div>
` : "";

const writingSection = writingCards ? `
  <div class="chess-report-combined-section">
    <div class="chess-report-section-title">
      ${profile.writingType === "SUMMARY" ? "TEST04. Summary Writing" : "TEST04. Paragraph Writing"}
    </div>
    ${writingCards}
  </div>
` : "";

  app.innerHTML = `
    <div class="top-bar no-print sticky-actions">
      <button class="secondary" onclick="renderChessReview(LAST_CHESS_SESSION)">채점결과로 돌아가기</button>
      <button onclick="window.print()">인쇄</button>
      <button class="secondary" onclick="document.body.classList.remove('bulk-mode'); renderHome()">처음으로</button>
    </div>

<div class="chess-report-root">
  <div class="chess-report-page chess-report-cover">
    <div class="chess-report-cover-inner">
 <img src="jls-logo.png" class="chess-report-logo">
      <div class="chess-report-cover-kicker">JLS Placement Test</div>
      <div class="chess-report-cover-title">Evaluation Sheet</div>
      <div class="chess-report-cover-subtitle">CHESS Placement Report</div>

      <div class="chess-report-cover-card">
        <div class="chess-report-cover-row">
          <span>NAME</span>
          <strong>${esc(name)}</strong>
        </div>
        <div class="chess-report-cover-row">
          <span>SCHOOL / GRADE</span>
          <strong>${esc(school)} / ${esc(grade)}</strong>
        </div>
        <div class="chess-report-cover-row">
          <span>TEST TYPE</span>
          <strong>${esc(examName)}</strong>
        </div>
        <div class="chess-report-cover-row">
          <span>TEST DATE</span>
          <strong>${esc(formatDate(testDate))}</strong>
        </div>
      </div>
    </div>
  </div>

          <div class="chess-report-page">
        <div class="chess-report-title-wrap">
          <div>

<div class="chess-report-intro">
  정상어학원은 어휘나 문법에 대한 암기능력을 확인하는 지필평가가 아닌 문법 지식을 문장으로 작성할 수 있는 <br>
<strong>Writing 능력</strong>, <strong>Speaking 능력</strong>, <strong>Reading, Listening 이해 능력</strong>을 
종합적으로 평가하는 테스트를 실시합니다.<br>
  신규테스트는 총 9종의 테스트 중 학생별 수준에 따라 응시 내용이 달라집니다.
</div>
            <div class="chess-report-kicker">JLS Placement Test</div>
            <div class="chess-report-title">Evaluation Sheet</div>
          </div>
          <div class="chess-report-brand">JLS</div>
        </div>

        <div class="chess-report-info-box">
          <div class="chess-report-info-grid">
            <div class="chess-report-info-cell">
              <div class="chess-report-info-label">NAME</div>
              <div class="chess-report-info-value">${esc(name)}</div>
            </div>
            <div class="chess-report-info-cell">
              <div class="chess-report-info-label">SCHOOL / GRADE</div>
              <div class="chess-report-info-value">${esc(school)} / ${esc(grade)}</div>
            </div>
            <div class="chess-report-info-cell">
              <div class="chess-report-info-label">TEST TYPE</div>
              <div class="chess-report-info-value">${esc(examName)}</div>
            </div>
            <div class="chess-report-info-cell">
              <div class="chess-report-info-label">TEST DATE</div>
              <div class="chess-report-info-value">${esc(formatDate(testDate))}</div>
            </div>
          </div>
        </div>

        <div class="chess-report-summary-grid">
          <div>
            <div class="chess-report-section-title">TOTAL SCORE AND LEVEL</div>
            <div class="chess-report-score-box">
              <div class="chess-report-score-part">
                <div class="chess-report-score-label">SCORE</div>
                <div class="chess-report-score-value">${totalScore}</div>
              </div>
              <div class="chess-report-score-part">
                <div class="chess-report-score-label">LEVEL</div>
                <div class="chess-report-score-value">${esc(assignedLevel)}</div>
              </div>
            </div>
          </div>

          <div>
            <div class="chess-report-section-title">${profile.test01Title}</div>
            <table class="chess-report-table">
              <thead>
                <tr>
                  <th>영역</th>
                  <th>배점</th>
                  <th>점수</th>
                  <th>성취율</th>
                </tr>
              </thead>
              <tbody>
                ${test01RowsHtml}
                <tr class="total-row">
                  <td>Total</td>
                  <td class="center">100</td>
                  <td class="center">${totalScore}</td>
                  <td class="center">${Number(totalScore).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

<div class="chess-report-section-title">TEST02 표현 능력 평가 득점 현황 (Speaking / Reading)</div>
<div class="chess-report-test02-grid">
  ${speakingCards}
</div>

${grammarSection}
${writingSection}

      </div>
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleMainButtons() {
  const examEl = document.getElementById("examName");
  const selectedExam = examEl?.value;

  const pdfBtn = document.getElementById("downloadQuestionBtn");
  const answerBtn = document.getElementById("viewAnswerBtn");

  const chessTests = ["D1","D2","D3","D4","L1","L2","L3","L4"];

  // 버튼 항상 활성화
  pdfBtn.disabled = false;
  answerBtn.disabled = false;

  // PDF 버튼
  pdfBtn.onclick = () => {
    if (chessTests.includes(selectedExam)) {
      openChessPaper(selectedExam);
    } else {
      alert("해당 시험지는 PDF 없음");
    }
  };

  // 답지 버튼
  answerBtn.onclick = () => {
    if (chessTests.includes(selectedExam)) {
      CURRENT_CHESS_EXAM_KEY = selectedExam;
      showChessAnswerSheet();
    } else {
      alert("체스 시험만 답지 지원");
    }
  };
}
function buildAnswerGroups(answers, size = 5) {
  const groups = [];
  for (let i = 0; i < answers.length; i += size) {
    groups.push({
      start: i + 1,
      end: Math.min(i + size, answers.length),
      items: answers.slice(i, i + size)
    });
  }
  return groups;
}

function renderChoiceGroups(groups) {
  return groups.map(group => `
    <div class="answer-group-card">
      <div class="answer-group-title">${group.start} ~ ${group.end}</div>
      <div class="answer-chip-grid">
        ${group.items.map((ans, idx) => `
          <div class="answer-chip">
            <div class="answer-chip-no">${group.start + idx}</div>
            <div class="answer-chip-val">${ans}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}