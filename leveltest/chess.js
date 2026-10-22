const CHESS_CONFIG = {
  /* I1은 탕정분원 신규 CHESS에서만 고를 수 있다(다른 분원 드롭다운엔 아예 안 뜸) —
     그래도 여기 새 키로만 추가하는 거라 다른 분원 D1~L4 설정은 한 글자도 안 바뀐다. */
  I1: { type: "I_BASIC", speakingMode: "D1", hasGrammar: false, hasWriting: false, hasSpeaking: true },
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
  D1: ["bl","fr","o","u","3","2","3","1","3","2","1","3","1","1","oy","ow","2","2","4","3","2","3","3","5","2","2","1","2","3","2","3","4","6"],
  D2: ["i,e","3","3","oi","ea","1","3","2","1","3","2","1","1","1","2","2","2","3","2","1","2","1","1","3","1","1","1","2","1","1","3","2","1"],
  D3: ["1","2","3","3","2","4","2","1","1","4","1","3","3","1","4","3","1","3","2","3","4","2","1","4","2","2","1","3","3","2","4","a little","many"],
  D4: ["3","3","3","4","2","4","4","2","1","2","2","4","4","4","3","3","3","2","4","4","3","3","1","3","2","1","2","2","4","4","3","4","4"],

  L1: ["2","3","1","1","2","4","1","4","2","3","3","1","3","4","3","1","3","4","1","1","2","2","4","2","2","1","4","3","1","4","1","2","4"],
  L2: ["3","3","1","1","4","1","2","3","2","3","1","4","3","3","1","1","2","1","2","2","1","3","4","3","4","1","4","3","2","1","2","3","4"],
  L3: ["3","4","3","1","2","2","4","2","1","2","1","3","4","2","3","2","3","4","1","4","1","3","4","3","2","1","3","2","2","2","1","4","2"],
  L4: ["2","4","3","4","2","2","2","1","2","4","3","2","1","3","3","3","4","1","1","3","3","2","3","2","3","1","4","4","2","4","3","1","2"]
};

/* 정답으로 같이 인정하는 다른 표기. D1 1·2번은 시험지가 "__ __ ack / __ __ og"에서 빈칸(bl, fr)만
   채우라는 문제인데 정답표에 단어 전체(black, frog)가 적혀 있어서, 시험지대로 bl·fr을 입력하면
   틀렸다고 나왔다. 정답은 bl·fr로 바로잡고, 단어 전체를 입력해 온 것도 예전처럼 맞게 인정한다.
   { 시험: { 문항인덱스(0부터): [인정할 다른 답] } } */
const CHESS_ANSWER_ALT = {
  D1: { 0: ["black"], 1: ["frog"] }
};
function chessAltFor(examName, idx) {
  const m = CHESS_ANSWER_ALT[String(examName || "").toUpperCase()];
  const alts = (m && m[idx]) || [];
  /* 탕정분원 새 시험지의 주관식 칸은 "1"이라고만 써도 정답 처리 — chessIsSubjV2/isChessV2는
     아래쪽에 있지만 함수 선언이라 호이스팅돼서 여기서 먼저 불러도 된다. */
  if ((String(examName || "").toUpperCase() === "I1" || isChessV2()) && chessIsSubjV2(examName, idx)) {
    return [...alts, "1"];
  }
  return alts;
}
function chessAnswerMatches(user, correct, alts) {
  const u = normalizeChessAnswer(user);
  return u === normalizeChessAnswer(correct) || (alts || []).some(a => u === normalizeChessAnswer(a));
}

/* ============================================================================
   CHESS 신규 시험지(I1 신설 + D1~L4 정답 전면 교체) — 탕정분원(아산탕정분원, br_22jcktj) 전용.
   다른 분원은 이 블록을 아예 안 타고 위의 CHESS_ANSWER_KEY·CHESS_LEVEL_RULES·CHESS_CONFIG를
   그대로 쓴다 — 그래서 다른 분원 D1~L4는 한 줄도 안 바뀐다.
   브랜치 판정은 leveltest/integration.js가 셋업하는 window.__LT_ENTRY.branch(쿼리 ?branch=)를 본다.
   ============================================================================ */
const CHESS_V2_BRANCH_ID = "br_22jcktj";
function isChessV2() {
  try {
    /* 저장된 성적표를 나중에 열람할 때(?view=)는 "지금 보는 사람이 어느 분원이냐"가 아니라
       "그 성적표가 채점될 때 어느 버전으로 채점됐냐"가 맞아야 한다 — 안 그러면 과거에
       v1으로 본 시험이 나중에 분원 설정이 바뀌거나 다른 맥락에서 열람될 때 v2 정답/레벨표로
       잘못 다시 그려질 수 있다("과거 응시자 성적표는 절대 바뀌면 안 됩니다"). 그래서
       채점이 끝나 dataVersion이 찍힌 뒤에는 그 값을 우선한다 — 응시 중(아직 안 채점)에는
       현재 분원(window.__LT_ENTRY.branch)으로 판단한다. */
    if (LAST_CHESS_SESSION && LAST_CHESS_SESSION.dataVersion) {
      return LAST_CHESS_SESSION.dataVersion === "v2";
    }
    return !!(window.__LT_ENTRY && window.__LT_ENTRY.branch === CHESS_V2_BRANCH_ID);
  } catch (e) {
    return false;
  }
}
/* CHESS_ANSWER_KEY 등 "분원 공용" 테이블을 조회할 때 쓰는 실제 키.
   I1은 완전 신규라 겹칠 게 없어서 그대로 "I1"을 쓰고, D1~L4는 탕정분원일 때만
   "D1__V2" 같은 별도 키로 돌려서 기존 D1~L4(다른 분원용) 데이터는 그대로 둔다. */
function chessDataKey(examName) {
  const k = String(examName || "").toUpperCase();
  if (k === "I1") return "I1";
  return isChessV2() ? (k + "__V2") : k;
}

/* 새 정답 — CHESS Placement Test 2026 개편안 원본 PDF/해설지에서 추출, 목업(chess-pt-mockup)에서
   실제 데이터로 검증 완료. 순서: I1 → D1 → D2 → D3 → D4 → L1 → L2 → L3 → L4, 전부 33문항. */
const CHESS_ANSWER_KEY_I1 = ["2","1","3","a","u","i,e","2","3","cr","bl","3","3","2","4","2","2","3","3","4","4","1","4","2","2","3","4","1","2","4","1","1","1","3"];
const CHESS_ANSWER_KEY_V2 = {
  D1: ["1","4","1","3","3","4","1","2","3","1","2","2","2","3","1","1","1","2","4","3","2","3","4","2","4","1","3","2","3","4","1","4","3"],
  D2: ["i,e","2","1","1","3","4","3","2","1","3","2","4","3","1","2","3","1","1","2","3","4","1","2","3","2","1","4","2","1","2","1","3","4"],
  D3: ["1","2","3","3","4","2","2","1","2","4","3","1","3","4","4","2","3","2","3","4","2","1","4","2","2","1","1","3","3","2","4","are","was"],
  D4: ["3","3","3","4","2","4","2","1","2","3","1","3","4","2","2","3","2","4","4","3","3","1","3","2","2","4","3","4","4","3","4","4","I have a science test tomorrow."],
  L1: ["4","3","1","2","4","1","3","4","3","2","4","1","3","2","4","1","3","2","4","2","3","1","2","4","1","3","4","2","3","1","4","2","3"],
  L2: ["2","1","3","2","4","1","2","3","4","3","1","2","1","2","4","3","3","1","4","3","4","2","1","3","2","1","4","2","3","2","4","1","3"],
  L3: ["2","4","3","2","4","1","3","1","4","2","3","4","3","2","1","4","3","2","3","1","4","2","1","3","2","3","4","2","3","1","1","4","2"],
  L4: ["2","4","3","2","4","1","3","3","1","4","1","4","2","1","3","4","2","2","4","4","3","2","3","1","2","1","4","2","3","1","2","3","4"]
};
Object.keys(CHESS_ANSWER_KEY_V2).forEach(k => { CHESS_ANSWER_KEY_V2[k + "__V2"] = CHESS_ANSWER_KEY_V2[k]; delete CHESS_ANSWER_KEY_V2[k]; });

/* 주관식(서술형 단답) 문항 — 정답을 그대로 적어도 되지만, 채점하는 사람이 그냥 "1"이라고만
   적어도 정답 처리한다(운영자 요청). 목업에서 노란 테두리로 강조해서 보여주기로 한 칸들
   그대로(0부터 세는 인덱스). D1·L1~L4는 주관식 문항이 없다. */
const CHESS_SUBJ_V2 = { D2: [0], D3: [31, 32], D4: [32], I1: [3, 4, 5, 8, 9] };
function chessIsSubjV2(examName, idx) {
  const t = String(examName || "").toUpperCase();
  return (CHESS_SUBJ_V2[t] || []).includes(idx);
}

/* ============================================================================
   라이팅(Writing) Type1~5 문항별 채점 — 탕정분원 신규 CHESS 전용(L1~L4).
   운영자가 실제 Writing Type1~5 PDF/채점표/피드백 문장뱅크(최부장님 샘플)를 보고
   목업에서 전부 검증한 데이터를 그대로 옮겼다. 다른 분원은 L-시리즈 쓰기 루브릭이
   예전 그대로(buildChessRubricInputs의 generalRows writingHtml)라 영향 없다.
   ============================================================================ */
const PART_ABILITY = {
  1:["철자 규칙"], 2:["낱말 철자","문장 구조화","텍스트 이해"], 3:["문장 구조화","문장 생산","텍스트 이해"],
  4:["텍스트 이해","문단 구성"], 5:["담화 구성"],
};
const TYPE_TITLE = {1:"단어 쓰기",2:"문장 배열",3:"질문에 답하기",4:"문단 쓰기",5:"에세이 쓰기"};
/* 최부장님 샘플의 CLOSE_P 그대로 — 학부모용 피드백 맨 끝에 붙는 마무리 격려 한 줄.
   수행률(맞은 비율) 구간별로 다른 뱅크에서 고른다: 70%↑=up · 40~69%=mid · 40%미만=down */
const CLOSE_P = {
  up:["이번 평가에서 보여 준 수준이 아주 인상적이에요. 아이의 강점을 자주 언급해 주시면 좋아요.","글쓰기의 기초다지가 탄탄하게 갖춰져 있어요. 지금 수준을 유지하며 나아가 주겠어요.","쓰기에 대한 자신감이 이미 만들어져 있어요. 폭넓은 활동으로 이어 가 주겠어요.","수행의 안정성이 돋보이는 결과예요. 좋은 흐름을 함께 이어 가 주세요.","관찰된 능력을 바탕으로 앞의 학습을 설계하면 아이가 큰 재미를 느낄 거예요."],
  mid:["지금 수준을 정확히 확인하는 데 이 평가가 좋은 기준이 되었어요. 그 기준선에서 함께 나아가 주겠어요.","잘되는 영역과 보완할 영역이 분명히 드러나서, 앞으로의 학습 방향을 잡기에 좋은 결과예요.","평가 결과를 바탕으로 아이에게 맞는 학습 계획을 세워 나가면 충분합니다.","이번 결과는 시작점으로서 아주 의미가 있어요. 이 기준에서 함께 발전시켜 가 주세요.","관찰된 수행을 바탕으로 맞춤 학습을 이어 가 주겠어요. 좋은 출발이에요."],
  down:["이번 평가는 아이의 현재 수준을 정확히 파악하는 데 목적이 있었어요. 결과를 바탕으로 맞는 학습을 시작하겠어요.","수준 파악이 정확히 이루어졌으니, 아이에게 맞는 시작점에서 학습을 이어 가면 충분합니다.","이 결과는 부족함이 아니라 출발점을 알려 준 자료예요. 맞는 수준에서 즐겁게 시작해 주세요.","현재 수준에 맞는 학습부터 시작하면 아이가 자연스럽게 흥미를 갖게 될 거예요.","평가 목적은 판정이 아니라 파악이었어요. 파악된 정보로 좋은 시작을 설계하겠어요."],
};
/* 최부장님 샘플(writing-score-report_sample.html)의 EXPERT 뱅크를 그대로 포팅 — 문장 축약 없이 변형 전부 유지.
   stP/gwP(학부모용)는 지금 화면엔 안 쓰지만, 나중에 학부모 모드 넣을 때 다시 베껴올 필요 없도록 같이 둠. */
const EXPERT = {
  "1-0":{
    stP:["낱말의 소리를 글자로 정확히 연결하는 힘이 자라고 있어요.","알파벳 순서와 대소문자 짝을 정확히 알고, 소리대로 쓰는 철자 감각이 눈에 띄어요.","소리를 들으면 바로 글자가 떠오르는 소리-철자 연결이 잘 되어 있어요.","모르는 단어도 소리를 분석해 스스로 철자를 만들어 내려는 태도가 돋보여요.","한 글자 한 글자를 성실하게 쓰려는 자세가 철자 정확도로 이어졌어요.","받침 소리까지 놓치지 않고 글자로 옮기는 세심함이 눈에 띄어요."],
    gwP:["이중자음(ch)이나 magic e처럼 규칙이 있는 철자는 소리 내어 읽으며 익히면 훨씬 익숙해져요.","매일 5분 받아쓰기로 소리-철자 연결을 탄탄히 다져 주면 좋아요.","규칙 철자는 단어 카드로 놀이하듯 반복하면 자연스럽게 익혀요.","틀린 철자는 그 단어를 직접 소리 내어 세 번 읽고 세 번 써 보게 해 주세요.","짧은 단어부터 성공 경험을 쌓아 가면 긴 단어에도 자신감이 붙어요.","쓴 단어를 소리 내어 읽으며 스스로 고치는 점검 습관을 길러 주세요."],
    stT:["소리-철자 대응 및 파닉스 규칙 적용이 정확함","소리 구조 분석에 기반한 철자 산출이 안정적"],
    gwT:["규칙 철자의 자동화를 위한 반복 산출 연습 병행 필요","받아쓰기 기반 철자 자동화 강화 필요"]
  },
  "2-0":{
    stP:["낱말 속 소리를 정확히 철자로 옮기는 힘이 자라고 있어요.","짧은 단어부터 이중모음 단어까지, 소리대로 쓰는 철자력이 눈에 띄어요.","힌트 없이도 단어의 철자를 스스로 완성하는 밑천이 생겼어요.","단어의 소리 구조를 먼저 분석하고 쓰는 좋은 쓰기 전략을 갖고 있어요.","모음과 자음을 구분해 듣고 쓰는 소리 인식이 정확해요."],
    gwP:["소리 내어 읽고 받아쓰는 짧은 습관이 철자 자동화에 큰 도움이 돼요.","틀린 철자를 모아 '나만의 단어장'으로 다시 써 보면 확실히 익혀요.","글자를 세어 보며 철자를 자가 점검하는 습관을 길러 주세요.","매주 몇 개씩 새 단어를 받아쓰기 목록에 더해 가면 좋아요.","단어를 보고 한 번에 쓰기보다, 소리로 떠올려 쓰는 연습을 도와 주세요."],
    stT:["소리 구조 분석에 기반한 철자 산출이 안정적","청각적 분석 기반 철자 산출 능력이 형성됨"],
    gwT:["받아쓰기 기반 철자 자동화 강화 필요","철자 자가 검토 단계 도입 필요"]
  },
  "2-1":{
    stP:["어순 감각이 안정적이라 단어를 문장으로 자연스럽게 조립해요.","평서문과 의문문의 구조 차이를 이해하고 있어요.","단어 카드를 문장으로 완성하는 어순 논리가 뚜렷해요.","질문문과 말하는 문장을 구분해 배열하는 눈이 생겼어요.","문장 틀을 크게 잡고 단어를 끼워 넣는 전략을 쓰고 있어요."],
    gwP:["첫 글자 대문자와 마침표·물음표까지 챙기는 마무리 습관을 함께 길러 주겠어요.","쓴 문장을 소리 내어 읽으며 문장부호를 스스로 점검하는 연습을 도와 주세요.","문장을 쓴 뒤 '처음 글자는 대문자? 끝에 점이나 물음표?' 두 가지만 확인하는 습관을 들여 주세요.","배열한 문장을 따박따박 받아쓰면 문장 감각이 몸에 배어요.","완성한 문장에 자기 단어를 하나 더 붙여 확장해 보게 해 주세요."],
    stT:["어순 및 문장부호 운용이 정확함","문형별 구조를 구분해 배열함"],
    gwT:["문장부호 자가 검토 단계를 거치는 습관 형성 필요","문장 완성 후 자가 점검 루틴 필요"]
  },
  "2-2":{
    stP:["짧은 글을 읽고 질문에 맞는 정보를 정확히 찾아내요.","글 속에서 근거를 찾아 답하는 독해 전략이 자라고 있어요.","질문의 유형(누가·언제·어디)을 파악하고 글에서 해당하는 부분을 찾아요.","글을 두 번 읽으며 근거 문장을 표시하는 습관이 보여요.","필요한 정보를 골라내는 눈이 빠르고 정확해요."],
    gwP:["찾은 내용을 주어-동사가 이어진 완전한 문장으로 옮기는 연습이 필요해요.","답한 문장을 소리 내어 읽으며 스스로 확인하는 습관을 길러 주세요.","찾은 내용을 그대로 쓰지 말고 주어를 붙여 문장으로 만들어 보게 해 주세요.","답을 쓰기 전 질문을 한 번 소리 내어 읽는 습관을 들여 주세요.","글에서 찾은 문장을 자기 말로 바꿔 쓰는 연습을 함께해 주세요."],
    stT:["텍스트에서 요구 정보를 정확히 추출함","질문 유형별 근거 탐색 전략을 활용함"],
    gwT:["어구 나열을 완전문으로 확장하는 산출 연습 필요","정보 재구성 후 완전문 산출 단계 강화 필요"]
  },
  "3-0":{
    stP:["문장 구조를 이해해 단어를 바르게 배열할 수 있어요.","문장을 크게 읽으며 어순을 확인하는 힘이 자라고 있어요.","주어-동사 뼈대를 먼저 찾고 배열하는 전략을 쓰고 있어요.","긴 문장도 끊어 읽으며 어순을 짚어 내요.","문장 조각들을 매끄럽게 이어 붙이는 감각이 생겼어요."],
    gwP:["대문자·마침표·물음표까지 한 번에 점검하는 검토 습관을 길러 주세요.","바르게 배열한 문장을 받아쓰기로 다시 써 보면 문장 감각이 단단해져요.","문장 끝표지(마침표·물음표)를 먼저 확인하고 배열을 시작하게 해 주세요.","완성한 문장을 세 번 읽어 보며 스스로 고쳐 쓰게 해 주세요.","배열 문장에 자기 내용을 덧붙여 새 문장을 만들어 보게 해 주세요."],
    stT:["어순 및 문장부호 운용이 정확함","문장 구조 인식 기반 배열이 안정적"],
    gwT:["문장부호 자가 검토 습관 형성 필요","배열 후 자가 교정 단계 도입 필요"]
  },
  "3-1":{
    stP:["질문의 시제에 맞춰 문장을 만들어 내는 생산력이 좋아요.","자기 경험을 완전한 문장으로 표현하는 힘이 자라고 있어요.","묻는 말의 시제를 곧바로 알아채고 문장을 고쳐 만들어요.","자기 이야기를 문장으로 풀어 내는 표현력이 풍부해요.","정해진 답이 아니라 자기 생각으로 답하는 적극성이 돋보여요."],
    gwP:["이유를 덧붙이는 연결 표현(because, so)을 더 자주 써 보게 해 주세요.","한 문장을 두 문장으로 확장해 쓰는 연습으로 표현의 폭을 넓혀 주세요.","답할 때 '언제·어디서' 같은 정보를 하나 더 넣어 보게 해 주세요.","집에서도 오늘 한 일을 영어 한 문장으로 써 보는 습관을 함께해 주세요.","질문을 듣고 먼저 시제를 확인한 뒤 답하는 순서를 함께 연습해 주세요."],
    stT:["시제 일치를 지킨 완전한 문장 생산이 가능함","자발적 담화 산출 능력이 나타남"],
    gwT:["연결 표현(because/so) 활용 확장 연습 필요","문장 확장(정보 추가) 연습 필요"]
  },
  "3-2":{
    stP:["글을 읽고 질문에 맞는 완전한 문장으로 답하는 힘이 좋아요.","글의 시제를 그대로 살려 답하는 세심함이 돋보여요.","글 속 근거를 골라 자기 문장으로 재구성해요.","질문 의도를 정확히 파악하고 거기에 맞춰 답해요.","긴 글에서도 핵심 문장을 찾아내는 눈이 있어요."],
    gwP:["답을 쓸 때 주어(She/He)를 잊지 않도록 문두 확인 습관을 길러 주세요.","글에서 찾은 내용을 자기 말로 다시 배열해 쓰는 연습을 도와 주세요.","답을 쓴 뒤 주어와 동사가 빠지지 않았는지 함께 확인해 주세요.","근거 문장을 표시한 뒤 답을 쓰는 두 단계 습관을 길러 주세요.","답 문장을 소리 내어 읽고 자연스러운지 스스로 평가하게 해 주세요."],
    stT:["주어를 갖춘 완전문으로 산출함","근거 기반 문장 재구성 능력이 나타남"],
    gwT:["주어 확인 후 산출하는 검토 습관 형성 필요","산출 문장의 완결성 자가 점검 필요"]
  },
  "4-0":{
    stP:["글을 읽고 주어를 갖춘 완전한 문장으로 답해요.","What/Why 같은 질문 유형에 맞는 답 구조를 이해하고 있어요.","질문 유형에 따라 답의 형태가 달라진다는 것을 알고 있어요.","글의 내용을 자기 문장으로 정확히 옮겨 와요.","왜(Why) 질문에 이유를 담아 성실하게 답해요."],
    gwP:["질문의 시제를 그대로 살려 답하는 연습을 더해 주면 좋겠어요.","답 앞뒤에 한 문장씩 붙여 두 문장으로 말하는 확장 연습을 도와 주세요.","질문을 읽고 시제를 먼저 짚은 뒤 답하는 순서를 함께해 주세요.","답에 'because'를 붙여 이유까지 완성하는 연습을 해 주세요.","답한 문장 두 개를 이어 한 단락으로 만들어 보는 연습을 도와 주세요."],
    stT:["질문 유형에 맞는 완전문 산출 및 시제 운용이 정확함","질문 의도에 부합하는 답변 구조화 능력이 안정적"],
    gwT:["질문 시제 일치 검토 습관 형성 필요","답변 확장(이유·덧붙임) 연습 필요"]
  },
  "4-1":{
    stP:["주제 하나로 문장을 일관되게 이어 가는 문단 구성력이 좋아요.","연결어를 활용해 문장 사이를 자연스럽게 잇고 있어요.","처음-중간-끝 흐름이 있는 글을 스스로 완성해요.","생각을 순서대로 펼치는 글의 뼈대가 잡혀 있어요.","문장 길이와 시작을 다양하게 바꿔 쓰려는 노력이 보여요."],
    gwP:["누구와, 언제, 어디서처럼 구체적인 내용을 더해 문장을 채우는 연습을 해 주세요.","쓴 문장마다 마침표를 스스로 확인하는 마무리 점검 습관을 길러 주세요.","first, next, finally를 써 넣으며 순서 글을 쓰는 연습을 함께해 주세요.","주제 문장 하나를 정하고 그에 맞는 문장만 고르게 하는 연습을 도와 주세요.","쓴 글을 읽어 주며 어디가 어색한지 함께 찾아 보세요."],
    stT:["주제 일관성과 연결어 활용이 안정적","문단 단위 담화 전개 능력이 형성됨"],
    gwT:["구체적 예시 추가를 통한 문장 확장 연습 필요","완결 문장 비율 제고를 위한 자가 점검 필요"]
  },
  "5-0":{
    stP:["서론-본론-결론의 틀을 갖춘 글을 완성해요.","주장과 근거를 구분해 배열하는 담화 구성력이 자라고 있어요.","자기 주장을 명확히 내세우고 근거로 뒷받침해요.","글 전체를 설계한 뒤 쓰는 계획적인 쓰기 태도가 보여요.","독자를 설득하려는 의식이 글에 담겨 있어요."],
    gwP:["근거마다 구체적인 예시나 자기 경험을 한 문장씩 덧붙이는 연습을 도와 주세요.","결론이 서론의 주장을 다시 짚도록 마무리 문장을 함께 다듬어 주세요.","쓰기 전에 서론·본론·결론 짜임을 한 줄로 메모하는 계획 습관을 길러 주세요.","근거를 두 개 이상 준비한 뒤 쓰기 시작하게 해 주세요.","쓴 글을 소리 내어 읽으며 주장이 분명히 전달되는지 함께 확인해 주세요."],
    stT:["3단 구성과 근거 제시가 모두 갖춰짐","주장-근거 구조화 능력이 안정적"],
    gwT:["근거별 구체화(예시·경험) 및 결론 환수 연습 필요","사전 개요(planning) 단계 도입 필요"]
  },
};
/* 원본의 pick()/chessHashSeed() 그대로 — 같은 학생·같은 영역이면 항상 같은 변형이 나오지만(새로고침해도 안 바뀜),
   영역이나 채점 결과가 다르면 다른 변형이 나와 매번 똑같은 문장만 반복되지 않음 */
function chessHashSeed(c, key, name){
  let s = c.total*7 + c.B*3 + c.C*5 + c.marked*17;
  const salt = (name || "") + "|" + (key || "");
  for(let i=0;i<salt.length;i++) s = (s*31 + salt.charCodeAt(i)) % 100003;
  return i => (s + i*7919) % 9973;
}
function chessPick(arr, c, key, name){
  const h = chessHashSeed(c, key || "", name);
  return arr[h(arr.length) % arr.length];
}

/* 최부장님 Writing Answer Key(채점표) 원문 그대로 — 문항 설명 + PART별 채점기준 + 유의사항 */
const WRITING_DATA = {
  1:{ parts:[
    { label:"정답 쓰기 1~10", note:"3번은 순서대로 이어 쓰기 · 6·7번은 네모 칸 2개 채우기 · 글씨가 4선을 벗어나도 알아볼 수 있으면 감점 없음",
      rubric:{A:"철자·대소문자 모두 정확",B:"철자 1개 오류 또는 대소문자만 혼동",C:"철자 2개 이상 오류 · 다른 단어 · 미응답"},
      items:[
        {w:"b",d:"대문자 B → 소문자로 쓰기 (대소문자 매칭)",g:"A",s:"대소문자 바꿔 쓰기",sd:"대문자를 소문자로, 소문자를 대문자로 바꿔 쓸 수 있어요."},
        {w:"G",d:"소문자 g → 대문자로 쓰기 (대소문자 매칭)",g:"A",s:"대소문자 바꿔 쓰기",sd:"대문자를 소문자로, 소문자를 대문자로 바꿔 쓸 수 있어요."},
        {w:"Ll",d:"알파벳 짝꿍 순서대로 이어 쓰기 — Jj, Kk 다음 (Ll이 정답)",g:"B",s:"알파벳 순서 이어 쓰기",sd:"알파벳 순서를 알고, 대·소문자 짝꿍을 순서대로 써요."},
        {w:"fish",d:"그림 보고 단어 쓰기 — 물고기",g:"A",s:"그림 보고 단어 쓰기",sd:"그림을 보고 낱말의 철자를 스스로 완성해요."},
        {w:"cat",d:"그림 보고 단어 쓰기 — 고양이",g:"A",s:"그림 보고 단어 쓰기",sd:"그림을 보고 낱말의 철자를 스스로 완성해요."},
        {w:"pen",d:"빠진 철자 채우기 — p + e, n",g:"A",s:"빠진 철자 채우기",sd:"단어에서 빠진 글자를 소리에 맞춰 스스로 채워요."},
        {w:"cup",d:"빠진 철자 채우기 — 앞의 c, u를 스스로 채움",g:"A",s:"빠진 철자 채우기",sd:"단어에서 빠진 글자를 소리에 맞춰 스스로 채워요."},
        {w:"chick",d:"이중자음 ch 쓰기 — ch를 써야 A, 다른 철자면 C",g:"A",s:"이중자음(ch) 규칙 쓰기",sd:"두 글자가 만나 한 소리를 내는 철자 규칙(ch)을 알고 단어로 써요."},
        {w:"cake",d:"Magic e · a, e — a와 끝의 e를 모두 쓰면 A, 하나만 맞으면 B",g:"B",s:"Magic e(a_e) 규칙 쓰기",sd:"모음 뒤에 붙는 e가 모음 소리를 바꾸는 규칙을 알고 단어로 써요."},
        {w:"boat",d:"이중모음 oa 쓰기 — oa를 써야 A, 다른 철자면 C",g:"A",s:"이중모음(oa) 규칙 쓰기",sd:"모음 두 글자가 만나 한 소리를 내는 철자 규칙(oa)을 알고 써요."},
      ]}
  ], judge:(c)=>{ if(c.total>=8) return {result:"한 단계 위 · Type2 수준",why:"A "+c.total+"개 — 8개 이상"}; if(c.total>=4) return {result:"Type1 수준 (적정)",why:"A "+c.total+"개 — 4~7개"}; return {result:"한 단계 아래 · phonics 기초",why:"A "+c.total+"개 — 3개 이하"}; } },

  2:{ parts:[
    { label:"PART 1 · 단어 쓰기 (1~5 · 난이도 상승)", note:"3번은 ch, 5번은 oa를 써야 A",
      rubric:{A:"철자·대소문자 모두 정확",B:"철자 1개 오류(4번은 a·e 중 하나만 맞음)",C:"철자 2개 이상 · 다른 단어 · 미응답"},
      items:[
        {w:"cup",d:"끝 글자 p 제시 · 단모음",g:"A",s:"빠진 철자 채우기",sd:"단어에서 빠진 글자를 소리에 맞춰 스스로 채워요."},
        {w:"cat",d:"힌트 없음 · CVC",g:"A",s:"힌트 없이 단어 쓰기",sd:"힌트 없이 낱말의 철자를 스스로 완성해요."},
        {w:"chick",d:"이중자음 ch",g:"B",s:"이중자음(ch) 규칙 쓰기",sd:"두 글자가 만나 한 소리를 내는 철자 규칙(ch)을 알고 써요."},
        {w:"cake",d:"Magic e · a, e",g:"A",s:"Magic e(a_e) 규칙 쓰기",sd:"모음 뒤에 붙는 e가 모음 소리를 바꾸는 규칙을 알고 써요."},
        {w:"boat",d:"이중모음 oa",g:"A",s:"이중모음(oa) 규칙 쓰기",sd:"모음 두 글자가 만나 한 소리를 내는 철자 규칙(oa)을 알고 써요."},
      ]},
    { label:"PART 2 · 문장 배열 (6~10)", note:"7·9·10번은 물음표까지 맞아야 A",
      rubric:{A:"어순 + 첫 단어 대문자 + 마침표·물음표 정확",B:"어순은 맞지만 대문자·문장부호만 틀림",C:"어순 오류 · 미응답"},
      items:[
        {w:"This is a cat.",d:"평서문 배열",g:"A",s:"평서문 배열하기",sd:"단어 순서를 바르게 배열하고 대문자·마침표까지 완성해요."},
        {w:"Is this your bag?",d:"의문문 배열 · 물음표 포함",g:"B",s:"의문문 배열하기",sd:"질문 문장을 바르게 배열하고 물음표까지 완성해요."},
        {w:"My sister is a student.",d:"평서문 배열",g:"A",s:"평서문 배열하기",sd:"단어 순서를 바르게 배열하고 대문자·마침표까지 완성해요."},
        {w:"Do you like pizza?",d:"의문문 배열 · 물음표 포함",g:"A",s:"의문문 배열하기",sd:"질문 문장을 바르게 배열하고 물음표까지 완성해요."},
        {w:"Can you swim?",d:"의문문 배열 · 물음표 포함",g:"A",s:"의문문 배열하기",sd:"질문 문장을 바르게 배열하고 물음표까지 완성해요."},
      ]},
    { label:"PART 3 · 읽고 답하기 「Tom's Farm」 (11~15)", note:"12번 Amy, 13번 near the river만 써도 A로 인정",
      rubric:{A:"글에서 맞는 어구를 찾아 철자까지 정확",B:"일부만 씀(예: the cows만) 또는 철자 1~2개 오류",C:"질문과 맞지 않는 어구 · 미응답"},
      items:[
        {w:"He feeds the cows and the chickens.",d:"What — 소들이 먹는 것",g:"A",s:"글 읽고 답하기 — What",sd:"짧은 글을 읽고 '무엇을'에 해당하는 내용을 찾아 답해요."},
        {w:"His sister (Amy) helps him.",d:"Who — 누가 돕는지",g:"A",s:"글 읽고 답하기 — Who",sd:"짧은 글을 읽고 '누가'에 해당하는 내용을 찾아 답해요."},
        {w:"He lives on a small farm (near the river).",d:"Where — 사는 곳",g:"C",s:"글 읽고 답하기 — Where",sd:"짧은 글을 읽고 '어디에' 해당하는 내용을 찾아 답해요."},
        {w:"He gets up at six o'clock.",d:"When — 기상 시간",g:"A",s:"글 읽고 답하기 — When",sd:"짧은 글을 읽고 '언제'에 해당하는 내용을 찾아 답해요."},
        {w:"He likes it because it is quiet and beautiful.",d:"Why — 이유 (because)",g:"B",s:"글 읽고 답하기 — Why",sd:"짧은 글을 읽고 '왜'에 해당하는 이유를 찾아 답해요."},
      ]},
  ], judge:(c)=>{ if(c.total>=12) return {result:"한 단계 위 · Type3 수준",why:"A "+c.total+"개 — 12개 이상"}; if(c.total>=6) return {result:"Type2 수준 (적정)",why:"A "+c.total+"개 — 6~11개"}; return {result:"한 단계 아래 · Type1 수준",why:"A "+c.total+"개 — 5개 이하"}; } },

  3:{ parts:[
    { label:"PART 1 · 문장 배열 (1~5)", note:"2·4·5번은 물음표까지 맞아야 A",
      rubric:{A:"어순 + 첫 단어 대문자 + 마침표·물음표 정확",B:"어순은 맞지만 대문자·문장부호만 틀림",C:"어순 오류 · 미응답"},
      items:[
        {w:"This is a cat.",d:"평서문 배열",g:"A",s:"평서문 배열하기",sd:"단어 순서를 바르게 배열하고 대문자·마침표까지 완성해요."},
        {w:"Is this your bag?",d:"의문문 배열",g:"A",s:"의문문 배열하기",sd:"질문 문장을 바르게 배열하고 물음표까지 완성해요."},
        {w:"My sister is a student.",d:"평서문 배열",g:"A",s:"평서문 배열하기",sd:"단어 순서를 바르게 배열하고 대문자·마침표까지 완성해요."},
        {w:"Do you like pizza?",d:"의문문 배열",g:"A",s:"의문문 배열하기",sd:"질문 문장을 바르게 배열하고 물음표까지 완성해요."},
        {w:"Can you swim?",d:"의문문 배열",g:"B",s:"의문문 배열하기",sd:"질문 문장을 바르게 배열하고 물음표까지 완성해요."},
      ]},
    { label:"PART 2 · 질문에 답하기 (6~10)", note:"내용이 달라도 질문에 맞으면 A",
      rubric:{A:"완전한 문장 · 시제 정확 · 9·10번은 이유까지",B:"시제·주어·철자 오류 1~2개 또는 이유 누락",C:"단어만 씀 · 질문과 무관 · 미응답"},
      items:[
        {w:"My name is Mina.",d:"My name is ~ — 자기소개",g:"A",s:"자기소개 문장 쓰기",sd:"질문에 맞는 완전한 문장으로 자신을 소개해요."},
        {w:"I visited my grandparents last weekend.",d:"과거시제 — 주말에 한 일",g:"A",s:"지난 일 말하기 (과거시제)",sd:"지난 일을 과거 시제로 바르게 써요."},
        {w:"I am going to learn how to ski.",d:"be going to — 미래 계획",g:"A",s:"앞으로의 계획 말하기",sd:"앞으로 할 일을 미래 표현으로 바르게 써요."},
        {w:"I have never ridden a horse. I want to try it because it looks fun.",d:"have never + because — 경험·이유",g:"B",s:"경험과 이유 말하기",sd:"해 본 적 없는 일을 표현하고, 그 이유까지 덧붙여 써요."},
        {w:"I would fly because I could travel anywhere.",d:"would + 이유 — 가정문 답변",g:"A",s:"상상과 이유 말하기",sd:"'만약 ~라면' 질문에 자기 생각과 이유를 들어 답해요."},
      ]},
    { label:"PART 3 · 읽고 답하기 「Mia's First Garden」 (11~15)", note:"12번은 had never had, 14번은 so (that) ~ would — because she wanted them to grow도 A · 15번은 두 질문 모두 답해야 A",
      rubric:{A:"글과 맞고 She/He로 시작하는 완전한 문장",B:"어구만 씀 또는 시제·대명사 오류",C:"글과 다른 내용 · 미응답"},
      items:[
        {w:"She lived in a tall apartment building in the city.",d:"Where — 살았던 곳",g:"A",s:"글 읽고 답하기 — Where",sd:"짧은 글을 읽고 '어디에' 해당하는 내용을 완전한 문장으로 써요."},
        {w:"She had never had a garden because there was no yard.",d:"Why · 과거완료",g:"A",s:"글 읽고 답하기 — Why",sd:"'왜'에 해당하는 이유를 글에서 찾아 완전한 문장으로 써요."},
        {w:"He gave her a small box of seeds.",d:"What — 할아버지가 준 것",g:"A",s:"글 읽고 답하기 — What",sd:"'무엇을'에 해당하는 내용을 완전한 문장으로 써요."},
        {w:"She watered them so they would grow big and strong.",d:"Why · so ~ would",g:"C",s:"글 읽고 답하기 — Why",sd:"행동의 이유를 글에서 찾아 완전한 문장으로 써요."},
        {w:"She was so excited. She ran to show her grandfather.",d:"How + What — 기분과 행동 두 가지",g:"A",s:"글 읽고 답하기 — How + What",sd:"기분과 행동, 두 가지를 모두 문장으로 써요."},
      ]},
  ], judge:(c)=>{ if(c.total>=12) return {result:"한 단계 위 · Type4 수준",why:"A "+c.total+"개 — 12개 이상"}; if(c.total>=6) return {result:"Type3 수준 (적정)",why:"A "+c.total+"개 — 6~11개"}; return {result:"한 단계 아래 · Type2 수준",why:"A "+c.total+"개 — 5개 이하"}; } },

  4:{ parts:[
    { label:"PART 1 · 읽고 답하기 「Mia's First Garden」 (1~5)", note:"She/He로 시작하는 완전한 문장 · 질문의 시제 사용 여부를 봅니다",
      rubric:{A:"글과 맞고 She/He로 시작하는 완전한 문장 · 질문의 시제 사용",B:"어구만 씀 또는 시제·대명사 오류",C:"글과 다른 내용 · 미응답"},
      items:[
        {w:"She lived in a tall apartment building in the city.",d:"Where — 살았던 곳",g:"A",s:"글 읽고 답하기 — Where",sd:"'어디에' 해당하는 내용을 주어(She)를 갖춘 완전한 문장으로 써요."},
        {w:"She had never had a garden because there was no yard.",d:"Why · 과거완료",g:"A",s:"글 읽고 답하기 — Why",sd:"이유를 글에서 찾고, 질문에 맞는 시제로 써요."},
        {w:"He gave her a small box of seeds.",d:"What — 받은 것",g:"A",s:"글 읽고 답하기 — What",sd:"'무엇을' 해당하는 내용을 완전한 문장으로 써요."},
        {w:"She watered them so they would grow big and strong.",d:"Why · so ~ would",g:"A",s:"글 읽고 답하기 — Why",sd:"행동의 이유를 글에서 찾아 써요."},
        {w:"She was so excited. She ran to show her grandfather.",d:"How + What — 두 질문 모두",g:"B",s:"글 읽고 답하기 — How + What",sd:"기분과 행동, 두 가지를 모두 문장으로 써요."},
      ]},
    { label:"PART 2 · 문단 쓰기 평가 관점 (①~④)", note:"모범답안 「My Favorite Thing」 10문장 · 연결어 first, then, because — 「My Day」도 같은 기준으로 판정",
      rubric:{A:"각 관점의 A 기준 충족",B:"일부 충족",C:"기준 미달"},
      items:[
        {w:"① 주제에 맞는 내용",d:"A: 전체가 주제에 맞음 / B: 일부가 벗어남 / C: 주제와 무관",g:"A",s:"주제에 맞는 내용 쓰기",sd:"글 전체가 하나의 주제에 맞게 이어지는지 봐요."},
        {w:"② 문장 수 (10개 정도)",d:"A: 9~11개 / B: 6~8개 / C: 5개 이하",g:"A",s:"문장 수",sd:"10문장 정도의 길이를 갖추어 썼는지 봐요."},
        {w:"③ 연결어 사용",d:"A: 2개 이상 (first, because…) / B: 1개 / C: 없음",g:"B",s:"연결어 사용",sd:"first, because 같은 연결어로 문장을 자연스럽게 이었는지 봐요."},
        {w:"④ 문장이 완결됨",d:"A: 대문자 시작·마침표 끝 모두 지킴 / B: 대부분 지킴 / C: 절반 이상 미완결",g:"A",s:"문장 완결성",sd:"대문자로 시작해 마침표로 끝나는 완전한 문장을 지켰는지 봐요."},
      ]},
  ], judge:(c)=>{ const p1=c.partA[0]||0,p2=c.partA[1]||0; if(p1>=4&&p2>=3) return {result:"한 단계 위 · Type5 수준",why:"PART1 A "+p1+"개(4↑) + PART2 A "+p2+"개(3↑)"}; if(p1<=2||p2===0) return {result:"한 단계 아래 · Type3 수준",why:"PART1 A "+p1+"개(2↓) 또는 PART2 A "+p2+"개(0)"}; return {result:"Type4 수준 (적정)",why:"PART1 A "+p1+"개 · PART2 A "+p2+"개"}; } },

  5:{ parts:[
    { label:"평가 관점 (①~④)", note:"모범답안 「School Uniforms · 찬성」 12문장 — 「My Most Memorable Day」도 같은 기준 · 반대 입장 글도 이유 2개만 갖추면 A",
      rubric:{A:"각 관점의 A 기준 충족",B:"일부 충족",C:"기준 미달"},
      items:[
        {w:"① 구조 (intro-body-conclusion)",d:"A: 3구간 모두 갖춤 / B: 2구간만 / C: 구분 없음",g:"A",s:"글의 구조",sd:"서론–본론–결론 3부분이 구분되는지 봐요."},
        {w:"② 문장 수 (12개 안팎)",d:"A: 10~14개 / B: 7~9개 / C: 6개 이하",g:"A",s:"문장 수",sd:"12문장 안팎의 길이를 갖추었는지 봐요."},
        {w:"③ 내용 (이유·근거)",d:"A: 이유 2개 이상, 구체적 / B: 이유 1개만 / C: 근거 없음",g:"B",s:"이유·근거 제시",sd:"자기 주장에 대해 이유를 2개 이상 들고 구체적으로 설명하는지 봐요."},
        {w:"④ 문장이 완결됨",d:"A: 대부분 완결된 문장 / B: 일부 미완결 / C: 절반 이상 불완전",g:"A",s:"문장 완결성",sd:"대부분의 문장이 완전하게 끝맺었는지 봐요."},
      ]},
  ], judge:(c)=>{ if(c.total>=3) return {result:"한 단계 위 · 심화 에세이 수준",why:"관점 A "+c.total+"개 — 3개 이상"}; if(c.total>=1) return {result:"Type5 수준 (적정)",why:"관점 A "+c.total+"개 — 1~2개"}; return {result:"한 단계 아래 · Type4 수준",why:"관점 A "+c.total+"개 — 0개"}; } },
};
const TYPE_PARTS = {1:[10],2:[5,5,5],3:[5,5,5],4:[5,4],5:[4]};
const TYPE_DESC = {
  1:"Type1 · 단어 쓰기 · 10문항 (1파트)",
  2:"Type2 · 문장 배열 · 15문항 (3파트)",
  3:"Type3 · 질문에 답하기 · 15문항 (3파트)",
  4:"Type4 · 문단 쓰기 · 9문항 (2파트)",
  5:"Type5 · 에세이 쓰기 · 관점 4개 (1파트)",
};

/* ---------- 라이팅 Type 선택 + 문항별 채점 입력화면(V2 전용) ---------- */
/* L1~L4 레벨이 올라갈수록 더 어려운 Type을 본다고 보고 임의로 매핑했다 — 실제로
   "1차 인터뷰에서 정한 Type"을 넘겨받는 경로가 아직 없어서(이 화면엔 그 정보가
   안 들어온다), 선생님이 직접 맞는 Type으로 바꿀 수 있게 버튼을 다 열어 둔다.
   이 매핑이 틀렸으면 아래 한 줄만 고치면 된다. */
function chessWritingDefaultType(examKey) {
  const m = { I1: 1, D1: 1, D2: 2, D3: 2, D4: 3, L1: 3, L2: 4, L3: 4, L4: 5 };
  return m[String(examKey || "").toUpperCase()] || 2;
}
let CHESS_WRITING_TYPE = null;

function buildChessWritingSection(examKey, savedType, savedGrades) {
  CHESS_WRITING_TYPE = savedType || chessWritingDefaultType(examKey);
  const typeBtns = [1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="chess-wtype-btn${n === CHESS_WRITING_TYPE ? " active" : ""}" onclick="chessPickWritingType(${n})">Type${n} · ${esc(TYPE_TITLE[n])}</button>`
  ).join("");
  return `
    <div class="chess-section">
      <h3>Writing 평가 — Type 선택 (1차 인터뷰에서 정한 Type으로 바꿔서 채점하세요)</h3>
      <p class="muted" id="chess-wtype-desc">${esc(TYPE_DESC[CHESS_WRITING_TYPE])}</p>
      <div class="chess-wtype-row" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">${typeBtns}</div>
      <div id="chess-writing-items"></div>
      <p class="muted" id="chess-writing-counts" style="margin-top:10px; font-weight:700;"></p>
    </div>
  `;
}
function chessPickWritingType(n) {
  CHESS_WRITING_TYPE = n;
  document.querySelectorAll(".chess-wtype-btn").forEach((b, i) => b.classList.toggle("active", i + 1 === n));
  const descEl = document.getElementById("chess-wtype-desc");
  if (descEl) descEl.textContent = TYPE_DESC[n];
  renderChessWritingItems(n);
}
function renderChessWritingItems(n, savedGrades) {
  const mount = document.getElementById("chess-writing-items");
  if (!mount) return;
  let serial = 0, html = "";
  WRITING_DATA[n].parts.forEach(part => {
    let rows = "";
    part.items.forEach(it => {
      serial++;
      const g = (savedGrades && savedGrades[serial - 1]) || "";
      rows += `<tr class="wr-item" data-grade="${g}">
        <td class="no">${serial}</td>
        <td class="content"><span class="word">${esc(it.w)}</span><span class="desc">${esc(it.d)}</span></td>
        <td><div class="wr-opts">
          ${["A", "B", "C"].map(gr => `<button type="button" class="wr-opt ${gr}${g === gr ? " sel" : ""}" onclick="chessPickWritingGrade(this,'${gr}')">${gr}</button>`).join("")}
        </div></td>
      </tr>`;
    });
    html += `<div class="wr-part">
      <div class="wr-banner">채점 영역 — ${esc(part.label)}</div>
      <div class="wr-crit3">
        <div class="cell cA"><b>A 스스로 해냄</b>${esc(part.rubric.A)}</div>
        <div class="cell cB"><b>B 부분적으로 함</b>${esc(part.rubric.B)}</div>
        <div class="cell cC"><b>C 못함</b>${esc(part.rubric.C)}</div>
      </div>
      ${part.note ? `<div class="wr-part-note">※ ${esc(part.note)}</div>` : ""}
      <table class="wr-item-table"><tbody>${rows}</tbody></table>
    </div>`;
  });
  mount.innerHTML = html;
  chessUpdateWritingCounts();
}
function chessPickWritingGrade(btn, g) {
  const item = btn.closest(".wr-item");
  item.setAttribute("data-grade", g);
  item.querySelectorAll(".wr-opt").forEach(o => o.classList.remove("sel"));
  btn.classList.add("sel");
  chessUpdateWritingCounts();
}
function chessWritingCountsFromGrades(n, gradesArr) {
  const c = { A: 0, B: 0, C: 0, total: 0, marked: 0, partA: [], byGrade: { A: [], B: [], C: [] } };
  let idx = 0;
  (TYPE_PARTS[n] || []).forEach(len => {
    let pa = 0;
    for (let i = 0; i < len; i++) {
      const v = gradesArr[idx] || "";
      const no = String(idx + 1);
      idx++;
      if (v) { c[v]++; c.marked++; c.byGrade[v].push(no); if (v === "A") { c.total++; pa++; } }
    }
    c.partA.push(pa);
  });
  return c;
}
function collectChessWritingGrades() {
  const items = Array.from(document.querySelectorAll("#chess-writing-items .wr-item"));
  const grades = items.map(el => el.getAttribute("data-grade") || "");
  return { type: CHESS_WRITING_TYPE, grades };
}
function chessUpdateWritingCounts() {
  const el = document.getElementById("chess-writing-counts");
  if (!el) return;
  const { grades } = collectChessWritingGrades();
  const c = chessWritingCountsFromGrades(CHESS_WRITING_TYPE, grades);
  el.textContent = c.marked ? `A ${c.A} · B ${c.B} · C ${c.C}` : "문항마다 A/B/C를 표시하면 집계가 나와요.";
}

/* ---------- 성적표 Writing 영역(V2) — 문항별 실제 채점 결과 그대로 보여준다.
   feedbackLinesHTML 원본 포팅. STUDENT_NAME(목업 전역) 대신 studentName 인자를 쓴다. ---------- */
function chessWritingFeedbackHTML(n, c, mode, studentName){
  const P = mode==='parent';
  const ab = PART_ABILITY[n];
  let best=-1,bestR=-1,worst=-1,worstR=2;
  TYPE_PARTS[n].forEach((len,i)=>{
    const a=c.partA[i], r=a/len;
    if(r>bestR){bestR=r;best=i;}
    if(len-a>0 && r<worstR){worstR=r;worst=i;}
  });
  const evid = c.byGrade.C.concat(c.byGrade.B).slice(0,3);
  const evidTxt = (!P && evid.length) ? " ("+evid.join(",")+"번)" : "";
  const total = TYPE_PARTS[n].reduce((a,b)=>a+b,0);
  const pct = Math.round(c.total/c.marked*100);
  const seedKey = "t"+n;

  if(P){
    const title = TYPE_TITLE[n];
    let l1 = chessPick([
      studentName+" 학생은 이번 '"+title+"' 평가에서 총 "+total+"문항 중 "+c.total+"문항을 혼자 힘으로 완성했어요.",
      studentName+" 학생은 이번 '"+title+"' 평가에 참여해 "+total+"문항 가운데 "+c.total+"문항에서 좋은 결과를 보여 주었어요.",
      studentName+" 학생은 이번 '"+title+"' 평가에서 "+total+"문항 중 "+c.total+"문항을 스스로 해내는 모습을 보여 주었어요.",
      studentName+" 학생의 이번 '"+title+"' 평가에서 보여 준 노력이 "+total+"문항 중 "+c.total+"문항의 좋은 결과로 이어졌어요.",
      studentName+" 학생은 이번 '"+title+"' 평가 "+total+"문항 중 "+c.total+"문항에서 자기 힘으로 문제를 풀어 냈어요.",
      studentName+" 학생의 이번 '"+title+"' 평가 결과는 "+total+"문항 중 "+c.total+"문항을 혼자 완성할 수 있을 만큼 준비가 되어 있음을 보여 주었어요."
    ], c, "s1");
    if(c.B || c.C) l1 += " (B "+c.B+"개 · C "+c.C+"개)";
    l1 = "<span class=\"ln\">"+l1+"</span>";

    let l2 = (TYPE_PARTS[n].length > 1 && best>=0 && bestR>0)
      ? "<span class=\"ln\"><b>강점</b> '"+ab[best]+"' — "+chessPick(EXPERT[n+"-"+best].stP, c, seedKey+"stP"+best)+"</span>" : "";

    let l3;
    if(worst>=0){
      const lead = chessPick([
        "한편 '"+ab[worst]+"' 부분은 이 평가에서 드러난 발전 지점이에요. ",
        "한편 '"+ab[worst]+"' 부분에서 조금만 더 나아지면 좋겠어요. ",
        "앞으로 '"+ab[worst]+"' 부분을 함께 발전시켜 보면 좋겠어요. ",
        "'"+ab[worst]+"' 부분은 지금 채워 나가면 가장 효과가 큰 영역이에요. ",
        "앞으로 '"+ab[worst]+"' 부분에 조금 더 힘을 실어 주면 좋겠어요. "
      ], c, "w1");
      l3 = "<span class=\"ln\"><b>보완</b> "+lead+chessPick(EXPERT[n+"-"+worst].gwP, c, seedKey+"gwP"+worst)+"</span>";
    }else{
      l3 = "<span class=\"ln\">"+chessPick(["모든 영역에서 골고루 좋은 모습을 보여 주었어요!","어떤 영역에서도 흔들림 없는 수행을 보여 주었어요.","전 영역에서 안정적으로 자기 힘을 발휘했어요!"], c, "n1")+"</span>";
    }

    const ratio = c.marked ? c.total/c.marked : 0;
    const closeCls = ratio >= 0.7 ? "up" : (ratio >= 0.4 ? "mid" : "down");
    const l4 = "<span class=\"ln\">"+chessPick(CLOSE_P[closeCls], c, "close")+"</span>";

    return [l1,l2,l3,l4].filter(Boolean).join("");
  }

  let l1 = "<span class=\"ln\">수행률 "+pct+"% — 총 "+total+"문항 중 <b>A</b> "+c.total+" <b>B</b> "+c.B+" <b>C</b> "+c.C+"</span>";
  let l2 = (TYPE_PARTS[n].length > 1 && best>=0 && bestR>0)
    ? "<span class=\"ln\"><b>강점</b> '"+ab[best]+"' — "+chessPick(EXPERT[n+"-"+best].stT, c, seedKey+"stT"+best)+"</span>" : "";
  let l3 = (worst>=0)
    ? "<span class=\"ln\"><b>보완</b> '"+ab[worst]+"'"+evidTxt+" — "+chessPick(EXPERT[n+"-"+worst].gwT, c, seedKey+"gwT"+worst)+"</span>"
    : "<span class=\"ln\">"+chessPick(["전 영역에서 안정적인 수행을 보였습니다.","전 영역에 걸쳐 일관된 수행 수준이 확인되었습니다."], c, "nT")+"</span>";
  return [l1,l2,l3].filter(Boolean).join("");
}

function chessRenderReportItemRowV2(serial, it, grade) {
  return `<div class="chess-report-item-row">
    <div class="chess-report-item-no">${serial}</div>
    <div><div class="chess-report-item-word">${esc(it.s || it.w)}</div><div class="chess-report-item-desc">${esc(it.sd || it.d)}</div></div>
    <div class="chess-report-item-grades">
      ${["A", "B", "C"].map(g => `<div class="chess-report-item-dot${grade === g ? " sel " + g : ""}">${g}</div>`).join("")}
    </div>
  </div>`;
}
/* PART 카드 — SCORE 박스(파트 대표 등급) 없음. 파트 하나를 등급 하나로 평균 내지 않는다
   (레벨 판정은 Type 전체 A개수로만 한다) — 목업 그대로.
   compact(I1 + Writing Type2·3 전용)면 문항을 2열로 배치해서 세로를 더 줄인다 —
   TEST02를 한 줄로 눕혀도 여전히 1페이지 아래가 많이 비어서(운영자 스크린샷,
   2026-10-24: "그러면 저렇게 큰 빈공간이 생기면 테스트 3를 한번 꾸역꾸역
   넣어볼 생각을 했어야지"), 글자를 더 줄이는 대신(가독성 떨어짐) 문항 15개를
   가로로 펼쳐서 세로 길이를 줄이는 쪽을 택했다. */
function chessRenderWritingPartCardHTMLV2(part, itemRows, compact) {
  return `<div class="chess-report-card chess-writing-part-card">
    <div class="chess-report-card-title chess-report-card-title--top">${esc(part.label)}</div>
    <table class="chess-report-criteria-table chess-report-criteria-table--fixed chess-writing-rubric">
      <tbody>
        <tr><td class="chess-report-criteria-grade">A</td><td class="chess-report-criteria-desc">${esc(part.rubric.A)}</td></tr>
        <tr><td class="chess-report-criteria-grade">B</td><td class="chess-report-criteria-desc">${esc(part.rubric.B)}</td></tr>
        <tr><td class="chess-report-criteria-grade">C</td><td class="chess-report-criteria-desc">${esc(part.rubric.C)}</td></tr>
      </tbody>
    </table>
    <div style="margin-top:8px" class="${compact ? "chess-items-2col" : ""}">${itemRows}</div>
  </div>`;
}
/* 성적표의 Writing 섹션(V2) — rubrics.writing = {type, grades(실제 채점값 배열)} 을 받아서
   문항별 실제 결과 그대로 그린다(목업처럼 데이터에 박힌 데모 등급이 아니라 진짜 채점값). */
function renderChessReportWritingV2(writingState, studentName, compact) {
  const n = writingState && writingState.type;
  const grades = (writingState && writingState.grades) || [];
  if (!n || !WRITING_DATA[n]) return "";
  const c = chessWritingCountsFromGrades(n, grades);

  let serial = 0;
  const cards = WRITING_DATA[n].parts.map(part => {
    const itemRows = part.items.map(it => {
      const g = grades[serial] || "";
      const row = chessRenderReportItemRowV2(serial + 1, it, g);
      serial++;
      return row;
    }).join("");
    return chessRenderWritingPartCardHTMLV2(part, itemRows, compact);
  }).join("");

  return `
    <div class="chess-report-combined-section">
      <div class="chess-report-section-title">TEST03. Writing · ${esc(TYPE_DESC[n])}</div>
      ${cards}
      <div class="chess-report-feedback-box">
        <div class="chess-report-feedback-title">Overall Feedback</div>
        <div class="lt-count-box" style="margin-bottom:14px">
          <div class="c cA"><b>${c.A}</b><span>A</span></div>
          <div class="c cB"><b>${c.B}</b><span>B</span></div>
          <div class="c cC"><b>${c.C}</b><span>C</span></div>
        </div>
        <div class="chess-report-subcopy" style="margin-bottom:0">${chessWritingFeedbackHTML(n, c, "parent", studentName).replace(/<span class="ln">/g, '<span class="ln" style="display:block;margin-bottom:4px">')}</div>
      </div>
    </div>`;
}

/* 성적표가 실제로 몇 페이지에 걸치는지는 여기서 짐작하지 않는다(Speaking 카드 수 같은
   고정 기준으론 L4처럼 카드는 많아도 Writing이 짧은 시험지가 억지로 새 페이지로 밀려
   페이지가 거의 통째로 비는 문제가 생겼다 — 운영자 요청: "여백이 많으면 최대한
   한장으로 끝낼수있게"). 대신 인쇄용 압축 CSS를 그대로 화면에 적용해서 진짜 렌더링
   높이를 재고, A4 한 페이지(7mm 여백) 분량과 비교해서 그때그때 판단한다.

   "TEST03이 전부 들어가냐 아니냐"로만 보지 않는다 — 그렇게 하면 TEST02 뒤에
   자리가 많이 남아도 하나도 못 쓰고 TEST03 전체를 새 페이지로 보내버렸다
   (운영자 지적: "테스트 3을 줄였으면 저 위쪽 빈공간에 넣어야지"). 대신 제목+파트1을
   한 덩어리로, 그다음 파트들과 Overall Feedback 박스를 각각 하나의 덩어리로 보고
   순서대로 "자리가 되는 데까지" 채우다가, 안 들어가는 첫 덩어리부터만 다음 페이지로
   넘긴다. 자세한 내용은 아래 try 블록 안 주석. */
function chessMeasurePrintBreaks() {
  const page = document.querySelector(".chess-report-page:not(.chess-report-cover)");
  const writingSection = document.querySelector(".chess-report-combined-section:has(.chess-writing-rubric)");
  if (!page || !writingSection) return;

  let printCssText = "";
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    if (!rules) continue;
    for (const rule of rules) {
      if (rule.media && /print/i.test(rule.conditionText || rule.media.mediaText || "")) {
        for (const inner of rule.cssRules) printCssText += inner.cssText + "\n";
      }
    }
  }
  const styleEl = document.createElement("style");
  styleEl.textContent = printCssText + `
    html, body { width: 210mm !important; }
    .chess-report-page { min-height: auto !important; padding: 7mm 7mm 8mm !important; box-sizing: border-box; width: 210mm !important; }
  `;
  document.head.appendChild(styleEl);

  try {
    /* pageTop(.chess-report-page 테두리 맨 위)부터 재니까 그 안의 위쪽 패딩(7mm)은
       이미 측정값에 포함돼 있다 — A4 인쇄 가능 영역(297-7-7=283mm)에서 밑에 남길
       여백(8mm)만 한 번 더 빼면 된다. 처음엔 위쪽 패딩을 두 번 빼서(283-7-8=268mm)
       기준이 57px(≈15mm)이나 더 좁았다 — 실제로 들어갈 공간이 있는데도 다음 페이지로
       넘겨버린 원인(운영자 지적: "빈공간에 다 들어갈수있음에도 불구하고 넘기고있네"). */
    const PAGE_BUDGET_PX = (297 - 7 - 7 - 8) * (96 / 25.4);

    const pageTop = page.getBoundingClientRect().top;
    const parts = Array.from(writingSection.querySelectorAll(".chess-writing-part-card"));
    const feedbackBox = writingSection.querySelector(".chess-report-feedback-box");
    const titleEl = writingSection.querySelector(".chess-report-section-title");

    /* 이전 판정을 지우고 "안 끊긴 원래 모양"부터 다시 잰다 — 끊김 클래스는 실제
       인쇄(페이지 나눔) 때만 효과가 있어서, 이렇게 평범하게 쌓인 화면에서 재는
       동안은 어차피 위치에 영향이 없다. */
    writingSection.classList.remove("force-break");
    parts.forEach(p => p.classList.remove("chess-part-break"));
    if (feedbackBox) feedbackBox.classList.remove("chess-part-break");

    const test02Grid = document.querySelector(".chess-report-test02-grid");
    const afterTest02 = test02Grid
      ? (test02Grid.getBoundingClientRect().bottom - pageTop)
      : (writingSection.getBoundingClientRect().top - pageTop);
    const y = el => el.getBoundingClientRect().top - pageTop;
    const yb = el => el.getBoundingClientRect().bottom - pageTop;

    /* TEST03을 "전부 들어가냐 아니냐" 하나로만 보지 않는다 — 그러면 TEST02 뒤에
       자리가 많이 남아도 그 자리를 하나도 못 쓰고 TEST03 전체를 새 페이지로
       보내버렸다(운영자 지적: "테스트 3을 줄였으면 저 위쪽 빈공간에 넣어야지").
       대신 제목+파트1을 한 덩어리로, 그 뒤 파트·피드백 박스는 하나씩 순서대로
       "지금까지 채운 만큼 + 이 덩어리"가 한 페이지 분량을 넘는지 봐서, 넘는
       첫 덩어리부터만 다음 페이지로 보낸다 — 들어가는 데까지는 채우는 방식.
       제목이 파트1 없이 혼자 이쪽 페이지에 남는 "고아 줄"을 막으려고 제목은
       항상 파트1과 한 덩어리로 묶는다. */
    const chunks = [];
    if (parts.length) {
      chunks.push({ el: parts[0], top: y(titleEl), bottom: yb(parts[0]) });
      for (let i = 1; i < parts.length; i++) chunks.push({ el: parts[i], top: y(parts[i]), bottom: yb(parts[i]) });
    }
    if (feedbackBox) chunks.push({ el: feedbackBox, top: y(feedbackBox), bottom: yb(feedbackBox) });

    let cursor = afterTest02;
    let sectionForced = false;
    chunks.forEach((chunk, i) => {
      const height = chunk.bottom - chunk.top;
      const gap = Math.max(0, i === 0 ? (chunk.top - afterTest02) : (chunk.top - chunks[i - 1].bottom));
      if (cursor + gap + height > PAGE_BUDGET_PX) {
        if (i === 0) {
          sectionForced = true; // 제목+파트1조차 안 들어가면 TEST03 전체를 새 페이지로
        } else {
          chunk.el.classList.add("chess-part-break"); // 이 덩어리부터만 새 페이지로
        }
        cursor = height; // 새 페이지에서 이 덩어리로 다시 시작
      } else {
        cursor += gap + height;
      }
    });
    writingSection.classList.toggle("force-break", sectionForced);
  } finally {
    styleEl.remove();
  }
}

/* 성적표가 그려지자마자(renderChessReport 끝에서) chessMeasurePrintBreaks()를 한 번
   불러두지만, 그 시점엔 Pretendard 웹폰트가 아직 안 끝나 있을 수 있다(jsdelivr에서
   받아오는 중) — 그 상태로 재면 대체 폰트로 더 넓게/길게 잡혀서 실제로는 한 페이지에
   들어갈 내용도 "안 들어간다"고 잘못 판단해 억지로 다음 페이지로 넘겼다(운영자 지적:
   "빈공간에 다 들어갈수있음에도 불구하고 넘기고있네", 2026-10-24). 그래서 인쇄 버튼을
   누르는 "진짜 인쇄하는 순간"에 폰트가 다 뜬 뒤(document.fonts.ready) 한 번 더 재서
   확정한다. Ctrl+P로 바로 인쇄할 때도 같은 걸 타게 beforeprint에도 걸어 둔다. */
async function chessPrintReport() {
  if (document.querySelector(".chess-writing-rubric")) {
    try { await document.fonts.ready; } catch (e) {}
    chessMeasurePrintBreaks();
  }
  window.print();
}
window.addEventListener("beforeprint", () => {
  if (document.querySelector(".chess-writing-rubric")) chessMeasurePrintBreaks();
});

/* 새 레벨 배정표 — "분원공유용_CHESS New PT 배정기준표_202402.xlsx"의 성적처리(반배정)기준표
   시트 그대로. 점수 구간이 아니라 "이 점수 이상이면 이 레벨" 식 커트라인 누적 방식
   (CLAUDE.md 학원 업무 흐름의 레벨 표기 — IS1·IS2·DSA1·DSA2…와 동일한 코드 체계). */
const CHESS_LEVEL_TABLE_V2 = {
  I1: [[0, "미배정"], [40, "IS1"], [55, "IS2"], [91, "DSA1"]],
  D1: [[0, "미배정"], [55, "DSA1"], [67, "DSA2"], [79, "DSB1"]],
  D2: [[0, "미배정"], [55, "DSB1"], [67, "DSB2"], [79, "DSC1"]],
  D3: [[0, "미배정"], [55, "DSC1"], [67, "DSC2"], [79, "DSD1"]],
  D4: [[0, "미배정"], [55, "DSD1"], [67, "DSD2"], [79, "LSA1"]],
  L1: [[0, "미배정"], [55, "LSA1"], [67, "LSA2"], [79, "LSB1"]],
  L2: [[0, "미배정"], [55, "LSB1"], [67, "LSB2"], [79, "LSC1"]],
  L3: [[0, "미배정"], [55, "LSC1"], [67, "LSC2"], [79, "LSD1"]],
  L4: [[0, "미배정"], [61, "LSD1"], [76, "LSD2"], [91, "MSA1"]]
};
/* 레벨 수정 드롭다운용 전체 레벨 순서(CLAUDE.md 학원 업무 흐름 그대로) + 자동배정 앞뒤로
   2단계씩 보여주는 슬라이딩 윈도 — 탕정 CHESS 전용(기존 CHESS는 getLevelOptions의
   10단계 목록을 그대로 쓴다, 안 건드림). */
const CHESS_V2_GLOBAL_LEVELS = [
  "IS1","IS2","DSA1","DSA2","DSB1","DSB2","DSC1","DSC2","DSD1","DSD2",
  "LSA1","LSA2","LSB1","LSB2","LSC1","LSC2","LSD1","LSD2","MSA1","MSA2","MSB1","MSB2"
];
function chessV2LevelOptions(autoLevel) {
  if (autoLevel === "미배정") return ["미배정"];
  const idx = CHESS_V2_GLOBAL_LEVELS.indexOf(autoLevel);
  if (idx === -1) return [autoLevel];
  const start = Math.max(0, idx - 2);
  const end = Math.min(CHESS_V2_GLOBAL_LEVELS.length, idx + 2);
  return CHESS_V2_GLOBAL_LEVELS.slice(start, end);
}
/* I1·D1~L4 공통 "정답 조회" 창구. 기존 CHESS_ANSWER_KEY[examName] 직접 참조를
   전부 이걸로 바꿔서, 탕정분원일 때만 새 정답(CHESS_ANSWER_KEY_I1/_V2)을 돌려주고
   다른 분원은 예전처럼 CHESS_ANSWER_KEY(원본, 안 건드림)를 그대로 받는다. */
function chessAnswerKeyFor(examName) {
  const t = String(examName || "").toUpperCase();
  if (t === "I1") return CHESS_ANSWER_KEY_I1;
  if (isChessV2()) return CHESS_ANSWER_KEY_V2[t + "__V2"] || CHESS_ANSWER_KEY[t];
  return CHESS_ANSWER_KEY[t];
}
function getChessLevelV2(score, examName) {
  const table = CHESS_LEVEL_TABLE_V2[String(examName || "").toUpperCase()];
  if (!table) return "미배정";
  let lv = table[0][1];
  for (const [min, label] of table) { if (score >= min) lv = label; }
  return lv;
}

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

  /* I1은 신규라 기존 등급표에 아예 없고, 탕정분원이면 D1~L4도 새 등급표를 쓴다.
     다른 분원은 이 if를 안 타므로 기존 CHESS_LEVEL_RULES 그대로. */
  if (t === "I1" || isChessV2()) return getChessLevelV2(s, t);

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
/* CHESS 답안 입력 즉시 정오답 색칠 (정답 비교는 normalizeChessAnswer 기준)
   paintCell(common.js)은 !important로 색을 강제 지정 */
function markChessAns(input, correctVal, altVal) {
  const v = (input.value || "").trim();
  if (v === "" || correctVal == null || correctVal === "") return paintCell(input, "");
  const alts = altVal ? String(altVal).split("|") : [];
  paintCell(input, chessAnswerMatches(v, correctVal, alts) ? "ok" : "no");
}
/* 저장된(미리 채워진) CHESS 답안도 열 때 색칠 */
function markAllChess() {
  document.querySelectorAll('input[id^="chess-q-"]').forEach(el => markChessAns(el, el.dataset ? el.dataset.ans : null, el.dataset ? el.dataset.alt : ""));
  if (typeof markAns === "function") document.querySelectorAll('input[id^="chess-g-"]').forEach(el => markAns(el, "1"));
}

function getChessMeta(examName) {
  const t = String(examName || "").toUpperCase();
  /* 새 시험지는 서술형 문법 10문항이 없어졌다(CLAUDE.md "지금 하는 일" 참고) — 탕정분원일
     때만 hasGrammar를 꺼서 입력화면·채점·성적표에서 그 섹션이 통째로 안 보이게 한다.
     다른 분원은 이 조건이 false라 예전 그대로 서술형 문법이 나온다. */
  const grammarOff = t === "I1" || isChessV2();
  return {
    isDType: /^D[1-4]$/.test(t),
    isLType: /^L[1-4]$/.test(t),
    hasGrammar: !grammarOff && (t === "D3" || t === "D4" || /^L[1-4]$/.test(t)),
    grammarType: (t === "D3" || t === "D4") ? "D" : (/^L[1-4]$/.test(t) ? "L" : null)
  };
}

function getChessQuestionCount(examName) {
  const list = chessAnswerKeyFor(examName);
  return Array.isArray(list) ? list.length : 0;
}

function buildChessAnswerInputs(examName) {
  const count = getChessQuestionCount(examName);
  if (!count) return `<p class="muted">답안 데이터가 없습니다.</p>`;
  const key = chessAnswerKeyFor(examName) || [];
  const hasGrammar = getChessMeta(examName).hasGrammar;
  const v2Active = String(examName || "").toUpperCase() === "I1" || isChessV2();
  const hasAnySubj = v2Active && Array.from({ length: count }).some((_, i) => chessIsSubjV2(examName, i));

  return `
    ${hasAnySubj ? `
    <p class="muted" style="background:#fff8e1; border:1px solid #f5d365; border-radius:10px; padding:8px 12px; margin-bottom:10px;">
      💡 노란 테두리 칸(주관식)은 정답을 그대로 입력해도, 그냥 "1"이라고만 입력해도 정답으로 인정돼요.
    </p>` : ""}
    <div class="answer-list">
      ${Array.from({ length: count }).map((_, i) => `
        <div class="answer-row simple${v2Active && chessIsSubjV2(examName, i) ? " chess-subj" : ""}">
          <div class="question-no">${i + 1}</div>
          <input
            id="chess-q-${i + 1}"
            type="text"
            class="answer-input"
            autocomplete="off"
            data-ans="${esc(key[i] == null ? "" : key[i])}"
            data-alt="${esc(chessAltFor(examName, i).join("|"))}"
            oninput="markChessAns(this, this.dataset.ans, this.dataset.alt)"
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
    .match(/[IDL][1-4]/)?.[0] || "";

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
  if (cleanKey === "D1" || cleanKey === "I1") speakingRows = d1Rows;
  if (cleanKey === "D2") speakingRows = d2Rows;

  const speakingHtml = `
    <div class="chess-section">
      <h3>Speaking / Reading 평가</h3>
      <div class="answer-list">
        ${speakingRows}
      </div>
    </div>
  `;

  /* 탕정분원 신규 시험지는 I1~L4 전부 Writing이 있다("I1~L4까지 싹다 라이팅" — 운영자 확인).
     예전 체스는 D1~D4엔 Writing이 없어서(hasWriting:false) 여기서 바로 return 했는데,
     V2는 그 early return을 건너뛰고 전부 Writing 섹션을 붙인다. 다른 분원은 이 조건이
     false라 D1~D4는 예전처럼 Writing 없이 그대로. */
  if (!meta.isLType && !isChessV2()) return speakingHtml;

let writingHtml = "";

if (isChessV2()) {
  writingHtml = buildChessWritingSection(cleanKey, null, null);
} else if (meta.isLType) {
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

  const key = chessAnswerKeyFor(examKey);

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
  .match(/[IDL][1-4]/)?.[0] || "";
  const cleanKey = String(examName || "")
  .toUpperCase()
  .match(/[IDL][1-4]/)?.[0] || "";

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
  /* buildChessWritingSection은 문항 표가 들어갈 빈 mount(#chess-writing-items)만
     HTML 문자열로 돌려준다 — 그 안쪽 내용은 실제로 DOM에 붙은 뒤에야(여기서) 채울 수 있다. */
  if (document.getElementById("chess-writing-items")) renderChessWritingItems(CHESS_WRITING_TYPE);
}

function collectChessAnswers(examName) {
  const count = getChessQuestionCount(examName);
  return Array.from({ length: count }).map((_, i) =>
    document.getElementById(`chess-q-${i + 1}`)?.value || ""
  );
}

function evaluateChessObjective(examName, userAnswers) {
  const key = chessAnswerKeyFor(examName) || [];
  const results = key.map((correctAnswer, idx) => {
    const user = userAnswers[idx] || "";
    const correct = chessAnswerMatches(user, correctAnswer, chessAltFor(examName, idx));
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

  if (isChessV2()) {
    rubrics.writing = collectChessWritingGrades();
  } else if (meta.isLType) {
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
  /* dataVersion을 찍기 전에 레벨부터 계산 — 이 시점의 isChessV2()는 아직 dataVersion이
     없으니 branch 기준으로 정확히 판단한다(위 isChessV2 주석 참고). */
  const assignedLevel = getChessLevel(totalScore, examName);
  const dataVersion = (String(examName || "").toUpperCase() === "I1" || isChessV2()) ? "v2" : "v1";

  const chessEvaluation = {
    ...LAST_CHESS_SESSION,
    examName,
    totalScore,
    assignedLevel,
    objective,
    grammar,
    rubrics,
    dataVersion
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

   const chessLevelOpts = (examName.toUpperCase() === "I1" || isChessV2())
     ? chessV2LevelOptions(assignedLevel)
     : getLevelOptions("", examName);
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
    .match(/[IDL][1-4]/)?.[0] || "";

  function getProfile() {
    if (cleanKey === "I1") {
      /* I1은 신규 시험지라 TEST01 영역이 D1(듣기/읽기 2영역)과 다르게 3영역으로 나뉜다
         — 분원공유용 CHESS New PT 배정기준표 원본 그대로(Phonics 15 / Vocabulary & Expression
         12 / TPR 6 = 33점). 말하기 루브릭(Speaking)은 D1과 같은 4개 항목을 그대로 쓴다. */
      return {
        test01Title: "TEST01 이해 능력 평가 득점 현황(영역별)",
        test01Rows: [
          { label: "Phonics", base: 15 },
          { label: "Vocabulary & Expression", base: 12 },
          { label: "TPR", base: 6 }
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
  {
    /* 영역별(TEST01) 점수를 totalScore에서 역산할 때, 각 영역의 실제 배점(base) 비율대로
       나눈다 — 마지막 영역만 나머지로 채워서 합이 totalScore와 정확히 맞게 한다.
       예전엔 영역이 3개일 때만 46%/36%를 하드코딩해서, 그 숫자가 우연히 D2의 배점(46/36/18)과
       같아 D2는 멀쩡해 보였지만 다른 3영역 시험지(I1: 15/12/6)엔 그대로 쓰면 틀린 값이 나왔다.
       D1(2영역)·D2(3영역) 전부 기존과 똑같은 결과가 나오는 걸 확인했고, 영역 수와
       무관하게 일반화한 것이라 분원 구분 없이 적용해도 안전하다. */
    /* totalScore는 0~100 "맞은 비율"이고 row.base는 그 영역의 실제 배점(원점수)이다.
       D1(49+51=100)·D2(46+36+18=100)는 배점 합이 우연히 100이라 totalScore를 그대로
       나머지 계산에 썼어도 맞았지만, I1(15+12+6=33)처럼 배점 합이 100이 아닌 시험지는
       나머지를 totalScore가 아니라 "배점 합(totalBase)" 기준으로 채워야 한다. */
    const totalBase = profile.test01Rows.reduce((a, row) => a + row.base, 0);
    const earned = profile.test01Rows.map((row, idx) => {
      if (idx === profile.test01Rows.length - 1) return null; // 마지막은 나머지로 뒤에서 채움
      return Math.round((totalScore / 100) * row.base);
    });
    const usedSum = earned.reduce((a, b) => a + (b || 0), 0);
    earned[earned.length - 1] = totalBase - usedSum;

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

/* rubrics.writing.type이 있으면(숫자 1~5) 탕정분원 신규 Writing(문항별 실채점) 데이터,
   없으면 기존 분원들이 쓰는 홀리스틱 A~D 루브릭 — 값의 "모양"으로 구분해서 isChessV2()를
   다시 안 물어봐도 안전하다. */
/* TEST03을 새 페이지에서 시작할지는 "Speaking 카드 6개 이상이면 무조건"처럼 고정
   기준으로 정하지 않는다 — L4(Type5·4문항)처럼 Speaking 카드는 많아도(6개) Writing이
   짧으면 TEST02 뒤에 그냥 이어 붙어도 한 페이지에 다 들어가는데, 고정 기준으론
   그런 경우까지 억지로 새 페이지로 밀어서 페이지 전체가 거의 비어버렸다(운영자
   스크린샷, 2026-10-24: "여백이 많으면 최대한 한장으로 끝낼수있게"). 실제 인쇄용
   압축 CSS를 그대로 적용해서 진짜 렌더링 높이를 재고 판단한다 — chessMeasurePrintBreaks()
   가 이 함수가 app.innerHTML에 다 그려진 뒤에 실행된다. */
/* I1에서 Writing Type2·3(15문항·3파트, 긴 쪽)를 고르면 TEST02(카드 4개뿐이라
   원래도 2x2로 하면 페이지 절반이 빈다)를 한 줄로 눕히고, Writing 문항도 2열로
   펼쳐서 세로를 더 줄인다 — 운영자 요청: "테스트2번 네모칸을 한줄로" +
   "빈공간이 생기면 테스트 3를 꾸역꾸역 넣어볼 생각을 했어야지"(2026-10-24).
   I1 전용이고, Type1(기본값)·Type4·Type5를 고르면 원래 레이아웃 그대로다. */
const i1LongWriting = cleanKey === "I1" && (rubrics?.writing?.type === 2 || rubrics?.writing?.type === 3);
const writingSection = rubrics?.writing?.type
  ? renderChessReportWritingV2(rubrics.writing, name, i1LongWriting)
  : writingCards ? `
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
      <button onclick="chessPrintReport()">인쇄</button>
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
<div class="chess-report-test02-grid${i1LongWriting ? " chess-test02-oneline" : ""}">
  ${speakingCards}
</div>

${grammarSection}
${writingSection}

      </div>
    </div>
  `;

  if (rubrics?.writing?.type) chessMeasurePrintBreaks();
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
