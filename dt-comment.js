/* DT 코멘트 — 성적표 코멘트(IMS)에 담임이 복사해 붙여넣는 레벨 이동 안내문.
   원본: 'DT 코멘트 엑셀'(CHESS·ACE 시트). 엑셀에서는 학기·레벨을 사람이 매번 손으로 고쳐 복붙했다.
   그래서 오타가 생겼다(DSA1 칸 윗줄이 'IS2 → DSA2' 로 적혀 있던 것 등).
   여기서는 본문(학습목표·특징)만 고정해 두고, 맨 윗줄(학기·레벨)과 문법교재 줄만 그때그때 만들어 끼운다.
   문법교재는 분원마다 다를 수 있어 분원별로 따로 저장한다(표: dt_comment_grammar, sql/dt_comment_grammar.sql).
   grader.html 의 'DT 답안입력' 반 선택 옆 [DT 코멘트] 버튼에서만 열린다. */
(function(){
'use strict';
/* CHESS 레벨 순서 — 다음 레벨 = 한 칸 위. 점프·스테이 학생은 창에서 다른 레벨을 직접 고른다 */
const LEVELS=["IS1", "IS2", "DSA1", "DSA2", "DSB1", "DSB2", "DSC1", "DSC2", "DSD1", "DSD2", "LSA1", "LSA2", "LSB1", "LSB2", "LSC1", "LSC2", "LSD1", "LSD2", "MSA1", "MSA2", "MSB1", "MSB2"];
/* 레벨별 기본 문법교재(본사 확정표 2026-11). 코멘트의 '다음 레벨' 기준이다. */
const GR_DEFAULT={
 "DSA1": "Vocabulary Mentor Joy Start 1",
 "DSA2": "Vocabulary Mentor Joy Start 1",
 "DSB1": "Vocabulary Mentor Joy Start 2",
 "DSB2": "Grammar Mentor Joy Pre",
 "DSC1": "Grammar Mentor Joy Early Start 1",
 "DSC2": "Grammar Mentor Joy Early Start 2",
 "DSD1": "Grammar Mentor Joy Start 1",
 "DSD2": "Grammar Mentor Joy Start 2",
 "LSA1": "Grammar Mentor Joy 1",
 "LSA2": "Grammar Mentor Joy 2",
 "LSB1": "Grammar Mentor Joy 3",
 "LSB2": "Grammar Mentor Joy 4",
 "LSC1": "Grammar Joy Plus 1",
 "LSC2": "제대로 영작문1",
 "LSD1": "Grammar Mentor Joy Plus 2",
 "LSD2": "제대로 영작문2",
 "MSA1": "Grammar Mentor Joy Plus 3",
 "MSA2": "제대로 영작문3",
 "MSB1": "Grammar Mentor Joy Plus 4",
 "MSB2": "제대로 영작문4"
};
const GR_CHOICES=[
 "Vocabulary Mentor Joy Start 1",
 "Vocabulary Mentor Joy Start 2",
 "Grammar Mentor Joy Pre",
 "Grammar Mentor Joy Early Start 1",
 "Grammar Mentor Joy Early Start 2",
 "Grammar Mentor Joy Start 1",
 "Grammar Mentor Joy Start 2",
 "Grammar Mentor Joy 1",
 "Grammar Mentor Joy 2",
 "Grammar Mentor Joy 3",
 "Grammar Mentor Joy 4",
 "Grammar Joy Plus 1",
 "제대로 영작문1",
 "Grammar Mentor Joy Plus 2",
 "제대로 영작문2",
 "Grammar Mentor Joy Plus 3",
 "제대로 영작문3",
 "Grammar Mentor Joy Plus 4",
 "제대로 영작문4"
];
/* 다음 레벨별 본문. {GRAMMAR} 자리에 문법교재가 들어간다. IS2 는 문법수업 없음. */
const TPL={
 "IS2": "■ IS2 의 학습 목표\n듣기 및 단어와 표현 중심의 학습\n파닉스(Phonics) 단모음, 장모음 및 이중자음 학습\n파닉스의 이해와 활용을 돕는 Story Book\nTPR(Total Physical Response)로 익히는 다양한 표현학습",
 "DSA1": "■ DSA1 의 학습 목표\n파닉스(Phonics) 확장 (다양한 이중모음 및 특수 규칙)\n창의적인 이야기를 주제(Theme)별로 익히는 Story Book\n주제별로 익히는 육하원칙 (5WH 1H Question) 과 대화문의 기초 연습\n\n※ DSA1 의 특징\n1. 받아쓰기 시험 (Dictation) : 주 1회 실시 (틀린 문제는 오답 정리 습관 들이기; 재시험 없음)",
 "DSA2": "■ DSA2 의 학습 목표\n파닉스(Phonics) 확장 및 완성\n창의적인 이야기를 주제(Theme)별로 익히는 Story Book\n주제별로 익히는 육하원칙 (5WH 1H Question) 과 대화문의 기초 연습\n\n※ DSA2 의 특징\n1. 받아쓰기 시험 (Dictation) : 주 1회 실시 (틀린 문제는 오답 정리 습관 들이기; 재시험 없음)",
 "DSB1": "■ DSB1 의 학습 목표\nStory Book 자연스럽게 읽기 (억양, 강세, 끊어 읽기)\n대화문(Dialogue)로 문장 만들기 시작\n바른 문장쓰기 (문장과 구조에 맞는 구두점 쓰기, 인용문)\n\n※ DSB1 의 특징\n1. 단어 시험 (Vocabulary Test) : 주 1회 실시\n   (통과 기준 = 90% 득점, 총 20문항 중 18문항 정답까지 통과 ; 재시험 관리 시작)\n2. 문법 수업 : {GRAMMAR}",
 "DSB2": "■ DSB2 의 학습 목표\nStory Book 자연스럽게 읽기 (억양, 강세, 끊어 읽기)\n대화문(Dialogue)로 문장 만들기\n바른 문장쓰기 (문장과 구조에 맞는 구두점 쓰기, 인용문)\n\n※ DSB2 의 특징\n1. 단어 시험 (Vocabulary Test) : 주 1회 실시\n   (통과 기준 = 90% 득점, 총 20문항 중 18문항 정답까지 통과 ; 재시험 관리)\n2. 문법 수업 : {GRAMMAR}",
 "DSC1": "■ DSC1 의 학습 목표\n주제별 대화, 완전한 문장의 다양한 표현학습\n창의적인 이야기 읽기와 내용 이해와 주제문 요약하기\nComprehension Question Writing을 통한 문장구조학습\n\n※ DSC1 의 특징\n1. 문법수업 : {GRAMMAR}",
 "DSC2": "■ DSC2 의 학습 목표\n주제별 대화, 완전한 문장의 다양한 표현학습\n창의적인 이야기 읽기와 내용 이해와 주제문 요약하기\nComprehension Question Writing을 통한 문장구조학습\n\n※ DSC2 의 특징\n1. 문법수업 : {GRAMMAR}",
 "DSD1": "■ DSD1 의 학습 목표\n자신감 있게 읽고 말하기 / 내용 이해, 요약 및 평가 / 문장구조학습\n\n※ DSD1 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화)\n2. Comprehension Questions Writing과 Guided Writing (글쓰기)\n3. 문법수업 : {GRAMMAR}",
 "DSD2": "■ DSD2 의 학습 목표\n자신감 있게 읽고 말하기 / 내용 이해, 요약 및 평가 / 문장구조학습\n\n※ DSD2 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화)\n2. Comprehension Questions Writing과 Guided Writing (글쓰기)\n3. 문법수업 : {GRAMMAR}",
 "LSA1": "■ LSA1 의 학습 목표\n자신감 읽게 읽고 / 다양한 읽기 능력 학습 학습 (발췌독, 추론하기) / 토론과 발표\n\n※ LSA1 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화)\n2. Comprehension Questions Writing과 Guided Writing (글쓰기)\n3. Pattern Practice를 통한 핵심 문장 응용 (120개)\n4. 문법수업: {GRAMMAR}",
 "LSA2": "■ LSA2 의 학습 목표\n자신감 읽게 읽고 / 다양한 읽기 능력 학습 학습 (발췌독, 추론하기) / 토론과 발표\n\n※ LSA2 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화)\n2. Comprehension Questions Writing과 Guided Writing (글쓰기)\n3. Pattern Practice를 통한 핵심 문장 응용 (120개)\n4. 문법수업 : {GRAMMAR}",
 "LSB1": "■ LSB1 의 학습 목표\n유창하게 읽기 / Speed Reading (속독연습) / 다양한 읽기 능력 학습 (발췌독, 내용추론하기) / 토론과 발표\n\n※ LSB1 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화)\n2. Comprehension Questions Writing과 Guided Writing (글쓰기)\n3. Pattern Practice를 통한 핵심 문장 응용 (160개)\n4. 문법수업: {GRAMMAR}",
 "LSB2": "■ LSB2 의 학습 목표\n유창하게 읽기 / Speed Reading (속독연습) / 다양한 Reading Skills 학습 (발췌독, 내용추론하기) / 토론과 발표\n\n※ LSB2 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화)\n2. Comprehension Questions Writing과 Guided Writing (글쓰기)\n3. Pattern Practice를 통한 핵심 문장 응용 (160개)\n4. 문법수업 : {GRAMMAR}",
 "LSC1": "■ LSC1 의 학습 목표\n다양한 읽기 능력 확장 / 문학 이해 능력 / Group 토론, 요약하여 쓰기\n\n※ LSC1 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화; 인물과 플롯의 이해, 개요와 요약정리)\n2. Paragraph Writing : 온-오프라인 에세이 쓰기/교정/첨삭/완성하기\n3. 문법수업 : {GRAMMAR}",
 "LSC2": "■ LSC2 의 학습 목표\n다양한 읽기 능력 확장 / 문학 이해 능력 / Group 토론, 요약하여 쓰기\n\n※ LSC2 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화; 인물과 플롯의 이해, 개요와 요약정리)\n2. Paragraph Writing : 온-오프라인 에세이 쓰기/교정/첨삭/완성하기\n3. 문법수업 : {GRAMMAR}",
 "LSD1": "■ LSD1 의 학습 목표\n베스트셀러, 고전문학 등 다양한 스토리북 읽기 / 다양한 읽기 능력 확장 / 문학 이해 능력 / 자기주도적 조사 및 발표 / Group 토론, 요약하여 쓰기\n\n※ LSD1 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화; 인물과 플롯의 이해, 개요와 요약정리)\n2. Paragraph Writing : 온-오프라인 에세이 쓰기/교정/첨삭/완성하기\n3. 문법수업 : {GRAMMAR}",
 "LSD2": "■ LSD2 의 학습 목표\n베스트셀러, 고전문학 등 다양한 스토리북 읽기 / 다양한 읽기 능력 확장 / 문학 이해 능력 / 자기주도적 조사 및 발표 / Group 토론, 요약하여 쓰기\n\n※ LSD2 의 특징\n1. Writing Portfolio Book 추가 (쓰기 강화; 인물과 플롯의 이해, 개요와 요약정리)\n2. Paragraph Writing : 온-오프라인 에세이 쓰기/교정/첨삭/완성하기\n3. 문법수업 : {GRAMMAR}",
 "MSA1": "■ MSA1 의 학습 목표\nListening: 토플 Lecture Listening, Story 핵심 Plot Listening, Story 배경지식 Listening\nReading: Newbery 문학상 수상작을 통해, 다양한 문제를 활용한 Reading Skills 확인, 챕터별 요약 및 4 paragraph essay writing\nWriting & Book Project: 책의 주제와 내용을 바탕으로, 조사와 토론을 거쳐 설명문 에세이 작성 및 발표\nVocab: 단어 및 핵심 영어구문 테스트 (영영단어, 문장내 단어활용)\n\n※ MSA1 의 특징\n1. Writing Portfolio\n- Chapter Summary\n- Informative Essay Writing\n- Presentation\n\n2. 문법수업 : {GRAMMAR}",
 "MSA2": "■ MSA2 의 학습 목표\nListening: 토플 Lecture Listening, Story 핵심 Plot Listening, Story 배경지식 Listening\nReading: Newbery 문학상 수상작을 통해, 다양한 문제를 활용한 Reading Skills 확인, 챕터별 요약 및 4 paragraph essay writing\nWriting & Book Project- Informative Essay & Presentation: 책의 주제와 내용을 바탕으로, 조사와 토론을 거쳐 설명문 에세이 작성 및 발표\nVocab: 단어 및 핵심 영어구문 테스트 (영영단어, 문장내 단어활용)\n※ MSA2 의 특징\n1. Writing Portfolio\n- Chapter Summary\n- Informative Essay Writing\n- Presentation\n2. 문법수업: {GRAMMAR}",
 "MSB1": "■ MSB1 의 학습 목표\nListening: Listening Comprehension on Novel-Related background knowledge (문학 작품과 관련된 배경지식을 기초로 한 듣기 이해)\nReading: Newbery 문학상 수상작을 통해, 다양한 문제를 활용한 Reading Skills 확인, 챕터별 요약 및 5 paragraph essay writing\nWriting & Book Project: 책의 주제와 내용을 바탕으로, 조사와 토론을 거쳐 주장문 에세이 작성 및 발표\nVocab: 단어 및 핵심 영어구문 테스트 (영영단어, 문장내 단어활용)\n※ MSB1 의 특징\n1. Writing Portfolio\n- Chapter Summary\n- Persuasive Essay Writing\n- Presentation\n2. 문법수업: {GRAMMAR}",
 "MSB2": "■ MSB2 의 학습 목표\nListening: Listening Comprehension on Novel-Related background knowledge (문학 작품과 관련된 배경지식을 기초로 한 듣기 이해)\nReading: Newbery 문학상 수상작을 통해, 다양한 문제를 활용한 Reading Skills 확인, 챕터별 요약 및 5 paragraph essay writing\nWriting & Book Project: 책의 주제와 내용을 바탕으로, 조사와 토론을 거쳐 주장문 에세이 작성 및 발표\nVocab: 단어 및 핵심 영어구문 테스트 (영영단어, 문장내 단어활용)\n* CHESS Master Presentation Ceremony 진행 (학생 별 주제 발표회 / 수료식 및 시상)\n※ MSB2 의 특징\n1. Writing Portfolio\n- Chapter Summary\n- Persuasive Essay Writing\n- Presentation\n2. 문법수업: {GRAMMAR}"
};
/* CHESS → ACE 로 가는 학생용(ACE 반별 안내). 본문은 엑셀 그대로, 맨 윗줄만 학기에 맞춰 만든다. */
const ACE=[
 {
  "label": "B 반",
  "name": "Bridge",
  "body": "■수업시간 : 월수금 3부 17:50~19:50 (120')\n\n■교재\n- 독해/듣기 : Total English Map Starter Basic A1~A3\n- 문법 : Total English Map Starter Grammar Workbook A1\n- 활용 : Travel & Communication (Foundation)\n\n■단어시험 : 일일 40개 시험"
 },
 {
  "label": "HB 반",
  "name": "High Bridge",
  "body": "■수업시간 : 월수금 3부 17:50~19:50 (120')\n\n■교재\n- 독해/듣기 : Total English Map Starter Inter A1~A3\n- 문법 : Grammar Map Starter A-2 + Total English Map Starter Grammar Workbook A-1\n- 활용 : Art & Architecture (Foundation)\n\n■단어시험 : 일일 40개 시험"
 },
 {
  "label": "PA1 반 (월수금)",
  "name": "Pre Ace1",
  "body": "■수업시간 : 월수금 3부 17:50~19:50 (120')\n\n■교재\n- 독해/듣기 : NEW Total English Map Basic A1~A3\n- 문법 : Grammar Map Basic A1\n- 활용 : Careers & Inspiring People (Foundation)\n\n■단어시험: 일일 40개 시험"
 },
 {
  "label": "PA1 반 (화목)",
  "name": "Pre Ace1",
  "body": "■수업시간: 화목 1부 15:30~18:30(180')\n\n■교재\n- 독해/듣기 : NEW Total English Map Basic A1~A3\n- 문법 : Grammar Map Basic A1 + Work Book (기본편)\n- 활용 : Careers & Inspiring People (Foundation)\n\n■단어시험: 화요일: 독해단어 40개 + 활용단어 40개시험 / 목요일: 독해단어 40개"
 },
 {
  "label": "PA2 반 (월수금)",
  "name": "Pre Ace2",
  "body": "■수업시간 : 월수금 3부 17:50~19:50 (120')\n\n■교재\n- 독해/듣기 : NEW Total English Map Inter B1~B3\n- 문법 : NEW Grammar Map Basic A + New Grammar Map Basic A Work Book (기본편)\n- 활용 : Science & Technology (Explorer)\n\n■단어시험: 일일 40개 시험"
 },
 {
  "label": "PA2 반 (화목)",
  "name": "Pre Ace2",
  "body": "■수업시간 : 화목 1부 15:30~18:30(180')\n\n■교재\n- 독해/듣기 : NEW Total English Map Inter B1~B3\n- 문법 : NEW Grammar Map Basic A + New Grammar Map Basic A Work Book (기본편)\n- 활용 : Science & Technology (Explorer)\n\n■단어시험: 화요일: 독해단어 40개 + 활용단어 50개시험 / 목요일: 독해단어 40개"
 },
 /* 2026-11-12 A1반 추가(운영자 — 월수금·화목 둘 다). 본문은 운영자가 준 문구 그대로(단어시험 줄의 띄어쓰기까지). */
 {
  "label": "A1 반 (월수금)",
  "name": "Ace1",
  "body": "■수업시간 : 월수금 3부 17:50~19:50 (120')\n\n■교재\n- 독해 : Reading Map Basic B-1\n- 듣기 : Listening Map Basic B-1\n- 문법 : (NEW)GRAMMAR MAP Pre Intermediate A-1\n- 활용 : The World of Art Explorer\n\n■단어시험: 단어 시험 50개 + 금요일 활용 단어시험 60개+ 단어시험 50"
 },
 {
  "label": "A1 반 (화목)",
  "name": "Ace1",
  "body": "■수업시간: 화목 1부 15:30~18:30(180')\n\n■교재\n- 독해 : Reading Map Basic B-1\n- 듣기 : Listening Map Basic B-1\n- 문법 : (NEW)GRAMMAR MAP Pre Intermediate A-1\n- 활용 : The World of Art Explorer\n\n■단어시험: 화요일: 단어 50개 + 활용단어 60개시험 / 목요일: 단어 40개"
 }
];

let OVR={};          // 'branchId|LEVEL' -> 분원이 고른 문법교재
let TABLE_OK=true;   // dt_comment_grammar 표가 있는지 (없으면 저장을 막고 알린다)
let TXT={};          // 'branchId|CHESS|DSB1' / 'branchId|ACE|PA1 반 (월수금)' -> 분원이 고쳐 저장한 코멘트 본문(맨 윗줄 제외)
let TEXT_OK=true;    // dt_comment_text 표가 있는지 (없으면 저장을 막고 알린다)
let ST={cls:null,tab:'chess',next:'',ace:0,pending:null,edit:null};

const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yy=n=>String(n).slice(-2);

/* 학기 표기: 엑셀 그대로 '26년 가을' / 겨울만 '26-27년 겨울'. id 는 sem_2026_fall 꼴(겨울 1·2월은 직전 해). */
function parseSem(id){const m=String(id||'').match(/sem_(\d+)_(\w+)/);return m?{y:+m[1],k:m[2]}:null;}
function semLabel(id){
  const s=parseSem(id);if(!s)return String(id||'');
  const n={spring:'봄',summer:'여름',fall:'가을',winter:'겨울'}[s.k]||s.k;
  return s.k==='winter'?`${yy(s.y)}-${yy(s.y+1)}년 ${n}`:`${yy(s.y)}년 ${n}`;
}
function nextSemId(id){
  const s=parseSem(id);if(!s)return id;
  const ord=['spring','summer','fall','winter'];const i=ord.indexOf(s.k);
  if(i<0)return id;
  if(s.k==='winter')return `sem_${s.y+1}_spring`;
  return `sem_${s.y}_${ord[i+1]}`;
}
function nextLevel(lv){const i=LEVELS.indexOf(lv);return i>=0&&i<LEVELS.length-1?LEVELS[i+1]:'';}
/* 문법교재 칸에 이 값이 저장돼 있으면 '문법수업' 줄을 코멘트에서 통째로 뺀다(분원이 그 레벨에 문법수업을 안 할 때).
   새 표 칸 없이 기존 book 칸에 넣는다 — 표를 고치지 않아도 되도록. */
const GR_NONE='__none';
function grammarFor(branch,lv){return OVR[branch+'|'+lv]||GR_DEFAULT[lv]||'';}

/* CHESS 코멘트 만들기 — 맨 윗줄 + (엑셀 본문, 문법교재만 교체) */
function chessText(cur,next,branch,pending){
  const ov=TXT[branch+'|CHESS|'+next];   // 분원이 고쳐 저장한 본문이 있으면 그것을 쓴다
  const tpl=ov!=null?ov:TPL[next];if(!tpl)return '';
  const book=pending!=null?pending:grammarFor(branch,next);
  let body=tpl;
  if(book===GR_NONE){
    /* 문법수업 줄 삭제. 예전엔 지울 방법이 없어서 안 하는 분원도 교재 이름이 코멘트에 그대로 나갔다. */
    body=body.replace(/\n?[^\n]*\{GRAMMAR\}[^\n]*/,'');   // '문법수업' '문법 수업' '문법수업:' 표기가 레벨마다 달라서 {GRAMMAR} 가 든 줄 전체를 뺀다
    return `${semLabel(SEM)} ${cur} → ${semLabel(nextSemId(SEM))} ${next}\n\n`+body.replace(/\s+$/,'');
  }
  if(ov==null&&body.indexOf('{GRAMMAR}')<0){
    /* 엑셀 본문에 문법수업 줄이 없던 레벨(DSA1·DSA2)은 새 표에 문법교재가 생겼으므로 마지막 번호 다음 줄로 덧붙인다 */
    if(book){const nums=[...body.matchAll(/^\s*(\d+)\.\s/gm)].map(m=>+m[1]);body+='\n'+((nums.length?Math.max.apply(null,nums):0)+1)+'. 문법수업 : {GRAMMAR}';}
  }
  body=body.replace('{GRAMMAR}',book);
  const head=`${semLabel(SEM)} ${cur} → ${semLabel(nextSemId(SEM))} ${next}`;
  return head+'\n\n'+body;
}
function aceText(i,branch){
  const a=ACE[i];if(!a)return '';
  const ov=branch!=null?TXT[branch+'|ACE|'+a.label]:null;
  /* 반 이름이 이미 'Ace'로 시작하면(Ace1) 앞에 'ACE '를 또 붙이지 않는다 — 운영자 문구가 '26-27년 겨울 Ace1'이다('ACE Ace1'로 겹쳐 보였음) */
  const lead=/^Ace/i.test(a.name)?'':'ACE ';
  return `${semLabel(SEM)} CHESS → ${semLabel(nextSemId(SEM))} ${lead}${a.name}\n\n${ov!=null?ov:a.body}`;
}

async function loadOvr(){
  try{
    const {data,error}=await sb.from('dt_comment_grammar').select('*');
    if(error){TABLE_OK=false;return;}
    TABLE_OK=true;OVR={};(data||[]).forEach(r=>{OVR[r.branch_id+'|'+r.level_code]=r.book;});
  }catch(e){TABLE_OK=false;}
  try{
    const {data,error}=await sb.from('dt_comment_text').select('*');
    if(error){TEXT_OK=false;return;}
    TEXT_OK=true;TXT={};(data||[]).forEach(r=>{TXT[r.branch_id+'|'+r.text_key]=r.body;});
  }catch(e){TEXT_OK=false;}
}

function canEdit(){return !isTeacherRO();}   // 담임은 복사만. 본사·분원 계정은 문법교재를 고를 수 있다

function ensureMask(){
  let m=document.getElementById('dtcMask');
  if(!m){
    m=document.createElement('div');m.id='dtcMask';
    m.style.cssText='position:fixed;inset:0;background:rgba(40,35,70,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:4vh 16px;overflow:auto';
    m.addEventListener('mousedown',e=>{if(e.target===m)close();});
    document.body.appendChild(m);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('dtcMask'))close();});
  }
  return m;
}
function close(){const m=document.getElementById('dtcMask');if(m)m.remove();}

function render(){
  const cls=ST.cls;if(!cls)return;
  const m=ensureMask();
  const cur=cls.levelCode;
  const brName=(typeof BRANCHES==='object'&&BRANCHES[cls.branchId])||cls.branchName||'';
  const tabBtn=(k,t)=>`<button class="ghost mini" style="${ST.tab===k?'background:var(--brand);color:#fff;border-color:var(--brand)':''};padding:8px 16px;font-size:13px" onclick="DTC.tab('${k}')">${t}</button>`;
  let panel='';
  if(ST.tab==='chess'){
    const next=ST.next;
    const opts=LEVELS.filter(l=>l!=='IS1').map(l=>`<option value="${l}" ${l===next?'selected':''}>${l}${l===nextLevel(cur)?' (기본)':''}</option>`).join('');
    let text='';
    if(!next) text='';
    else text=chessText(cur,next,cls.branchId,ST.pending);
    const grNote=(next&&GR_DEFAULT[next]!=null&&canEdit())?grammarEditor(cls,next):'';
    panel=`
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0 10px">
        <span style="font-size:13px;font-weight:800;color:var(--ink2)">${E(cur)} → 다음 레벨</span>
        <select onchange="DTC.setNext(this.value)" style="font:inherit;font-weight:800;font-size:14px;border:1px solid var(--line);border-radius:9px;padding:7px 10px;background:#fff;cursor:pointer">${opts}</select>
        <span style="font-size:12px;color:var(--ink3)">점프·스테이 학생은 진행 레벨을 확인해서 골라주세요</span>
      </div>
      ${next?previewBlock(text,'CHESS|'+next,true)
      :`<div style="padding:18px;background:var(--warn-s);color:var(--warn);border-radius:12px;font-weight:700;font-size:13.5px">${E(cur)} 다음 레벨이 정해져 있지 않아요. 위에서 레벨을 골라주세요.</div>`}
      ${grNote}`;
  }else{
    const opts=ACE.map((a,i)=>`<option value="${i}" ${i===ST.ace?'selected':''}>${E(a.label)} · ACE ${E(a.name)}</option>`).join('');
    panel=`
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0 10px">
        <span style="font-size:13px;font-weight:800;color:var(--ink2)">CHESS → ACE 배정 반</span>
        <select onchange="DTC.setAce(+this.value)" style="font:inherit;font-weight:800;font-size:14px;border:1px solid var(--line);border-radius:9px;padding:7px 10px;background:#fff;cursor:pointer">${opts}</select>
        <span style="font-size:12px;color:var(--ink3)">5학년 이관 결과에서 학생이 배정된 반을 골라주세요</span>
      </div>
      ${previewBlock(aceText(ST.ace,cls.branchId),'ACE|'+(ACE[ST.ace]||{}).label,false)}`;
  }
  m.innerHTML=`<div style="background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(60,50,110,.3);width:min(760px,100%);padding:22px 26px">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:18px;font-weight:800">DT 코멘트</div>
      <div style="font-size:13px;color:var(--ink3);font-weight:700">${E(cur)}${cls.className?' · '+E(String(cls.className).replace(/^\s*\[[^\]\/]*\]?\s*/,'')):''}${brName?' · '+E(brName):''}</div>
      <div style="flex:1"></div>
      <button class="ghost mini" onclick="DTC.close()">✕ 닫기</button>
    </div>
    <div style="font-size:12.5px;color:var(--ink3);margin-top:4px">${E(semLabel(SEM))} → ${E(semLabel(nextSemId(SEM)))} · 복사해서 IMS 성적표 Comment 칸에 붙여넣으세요</div>
    <div style="display:flex;gap:8px;margin-top:14px">${tabBtn('chess','CHESS 코멘트')}${tabBtn('ace','ACE 코멘트')}</div>
    ${panel}
  </div>`;
}

/* 코멘트 미리보기 + (본사·분원 계정만) 수정/저장.
   맨 윗줄(학기·레벨)은 자동이라 고치지 않고, 그 아래 본문만 분원별로 고쳐 저장한다.
   예전엔 본문이 코드에 박혀 있어 문구가 바뀔 때마다 코드를 고쳐야 했다. */
function defaultBodyOf(key){
  if(key.indexOf('CHESS|')===0){
    /* 엑셀 본문에 문법수업 줄이 없던 레벨(DSA1·DSA2)은 지금 화면에 보이는 것과 같게 줄을 붙여서 고치기 시작한다 */
    const lv=key.slice(6);let t=TPL[lv]||'';
    if(t&&t.indexOf('{GRAMMAR}')<0&&grammarFor(ST.cls.branchId,lv)){const nums=[...t.matchAll(/^\s*(\d+)\.\s/gm)].map(m=>+m[1]);t+='\n'+((nums.length?Math.max.apply(null,nums):0)+1)+'. 문법수업 : {GRAMMAR}';}
    return t;
  }
  const a=ACE.find(x=>'ACE|'+x.label===key);return a?a.body:'';
}
function previewBlock(text,key,isChess){
  const cls=ST.cls,tk=cls.branchId+'|'+key,ov=TXT[tk];
  const tag=ov!=null?'<span style="font-size:12px;font-weight:800;color:var(--brand)">이 분원 수정본 사용 중</span>':'';
  if(ST.edit&&ST.edit.key===key){
    const head=String(text).split('\n\n')[0];
    return `<div style="font-size:13.5px;font-weight:700;color:var(--ink2);padding:10px 14px;background:#f3f1fa;border-radius:10px 10px 0 0;border:1px solid var(--line);border-bottom:0">${E(head)} <span style="font-weight:600;color:var(--ink3);font-size:12px">← 맨 윗줄은 학기·레벨에 맞춰 자동으로 들어가요</span></div>
      <textarea id="dtcEdit" oninput="DTC.draft(this.value)" style="width:100%;box-sizing:border-box;min-height:300px;font:inherit;font-size:14px;line-height:1.65;border:1px solid var(--brand);border-radius:0 0 12px 12px;padding:14px 16px;resize:vertical">${E(ST.edit.draft)}</textarea>
      <div style="font-size:12px;color:var(--ink3);margin-top:6px;line-height:1.6">${isChess?'문법교재가 들어갈 자리는 <b>{GRAMMAR}</b> 라고 적어두세요. 아래 [문법교재] 드롭다운에서 고른 교재가 그 자리에 들어가요. ':''}${TEXT_OK?'저장하면 이 분원 담임 선생님이 복사하는 코멘트가 바로 바뀌어요.':'<b style="color:var(--warn)">저장 표가 아직 없어요 — sql/dt_comment_text.sql 을 Supabase에서 한 번 실행해주세요. (지금은 저장이 안 돼요)</b>'}</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="ghost" onclick="DTC.cancelEdit()">취소</button><button class="btn" onclick="DTC.saveText()">💾 저장</button></div>`;
  }
  const ed=canEdit()?`<button class="ghost mini" onclick="DTC.startEdit()">✏️ 수정</button>${ov!=null?'<button class="ghost mini" onclick="DTC.resetText()">기본 문구로</button>':''}`:'';
  return `<pre id="dtcText" style="white-space:pre-wrap;word-break:keep-all;background:#faf8ff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:0;font:inherit;font-size:14px;line-height:1.65;max-height:48vh;overflow:auto;user-select:all">${E(text)}</pre>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px"><div style="display:flex;align-items:center;gap:8px;flex:1">${ed}${tag}</div><button class="btn" onclick="DTC.copy()">📋 코멘트 복사하기</button></div>`;
}
function guardEdit(){
  if(!ST.edit)return true;
  const key=ST.edit.key,cur=TXT[ST.cls.branchId+'|'+key],base=cur!=null?cur:defaultBodyOf(key);
  if(ST.edit.draft!==base&&!confirm('고치던 코멘트가 저장되지 않았어요. 버리고 넘어갈까요?'))return false;
  ST.edit=null;return true;
}
function curKey(){return ST.tab==='ace'?'ACE|'+(ACE[ST.ace]||{}).label:'CHESS|'+ST.next;}
function startEdit(){
  if(!canEdit()||!ST.cls)return;
  const key=curKey(),ov=TXT[ST.cls.branchId+'|'+key];
  ST.edit={key,draft:ov!=null?ov:defaultBodyOf(key)};render();
}
async function saveText(){
  const cls=ST.cls;if(!canEdit()||!cls||!ST.edit)return;
  const key=ST.edit.key,body=ST.edit.draft.replace(/\s+$/,'');
  if(!body.trim()){toast('내용이 비어 있어요. 기본 문구로 되돌리려면 [기본 문구로]를 눌러주세요',false);return;}
  if(!TEXT_OK){toast('sql/dt_comment_text.sql 을 먼저 실행해주세요',false);return;}
  const {error}=await sb.from('dt_comment_text').upsert({branch_id:cls.branchId,text_key:key,body,updated_by:(typeof CURUSER!=='undefined'&&CURUSER)||(typeof TEACHER!=='undefined'&&TEACHER)||'',updated_at:new Date().toISOString()},{onConflict:'branch_id,text_key'});
  if(error){toast('저장 실패: '+error.message,false);return;}
  TXT[cls.branchId+'|'+key]=body;ST.edit=null;
  toast('코멘트가 저장됐어요 ✓ 이제 이 분원 담임 코멘트에 바로 반영돼요');render();
}
async function resetText(){
  const cls=ST.cls;if(!canEdit()||!cls)return;
  const key=curKey();
  if(!confirm('이 분원에서 고친 문구를 지우고 기본 문구로 되돌릴까요?'))return;
  const {error}=await sb.from('dt_comment_text').delete().eq('branch_id',cls.branchId).eq('text_key',key);
  if(error){toast('되돌리기 실패: '+error.message,false);return;}
  delete TXT[cls.branchId+'|'+key];ST.edit=null;toast('기본 문구로 되돌렸어요 ✓');render();
}

/* 관리자(본사·분원 계정) 전용: 코멘트 밑 문법교재 선택 — 분원마다 레벨별 문법교재가 다를 수 있다 */
function grammarEditor(cls,next){
  const saved=OVR[cls.branchId+'|'+next];
  const effective=ST.pending!=null?ST.pending:(saved||GR_DEFAULT[next]||'');
  const list=GR_CHOICES.slice();if(effective&&effective!==GR_NONE&&list.indexOf(effective)<0)list.push(effective);
  const brName=(typeof BRANCHES==='object'&&BRANCHES[cls.branchId])||cls.branchName||'';
  const opts=list.map(b=>`<option value="${E(b)}" ${b===effective?'selected':''}>${E(b)}${b===GR_DEFAULT[next]?' (기본)':''}</option>`).join('')+`<option value="${GR_NONE}" ${effective===GR_NONE?'selected':''}>문법수업 안 함 (이 줄 빼기)</option><option value="__custom">직접 입력…</option>`;
  const changed=ST.pending!=null&&ST.pending!==(saved||GR_DEFAULT[next]||'');
  return `<div style="margin-top:18px;padding:14px 16px;border:1px dashed var(--brand);border-radius:12px;background:#fcfbff">
    <div style="font-size:13px;font-weight:800;color:var(--ink2)">문법교재 · ${E(next)} · ${E(brName)}${saved?(saved===GR_NONE?' <span style="color:var(--brand)">(이 분원: 문법수업 안 함)</span>':' <span style="color:var(--brand)">(이 분원 설정 사용 중)</span>'):''}</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">
      <select onchange="DTC.pickGrammar(this.value)" style="font:inherit;font-weight:700;font-size:13.5px;border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:#fff;cursor:pointer;min-width:260px">${opts}</select>
      <button class="btn mini" ${changed?'':'disabled'} onclick="DTC.saveGrammar()" style="padding:8px 14px;${changed?'':'opacity:.45;cursor:default'}">저장</button>
      ${saved?`<button class="ghost mini" onclick="DTC.resetGrammar()">기본값으로</button>`:''}
    </div>
    <div style="font-size:12px;color:var(--ink3);margin-top:6px">${TABLE_OK?'저장하면 이 분원 담임 선생님이 복사하는 코멘트가 바로 바뀌어요. 위 코멘트는 선택한 교재로 미리 보여줘요.':'<b style="color:var(--warn)">저장 표가 아직 없어요 — sql/dt_comment_grammar.sql 을 Supabase에서 한 번 실행해주세요. (지금은 미리보기만 돼요)</b>'}</div>
  </div>`;
}

async function copy(){
  const el=document.getElementById('dtcText');if(!el)return;
  const t=el.textContent;
  try{await navigator.clipboard.writeText(t);}
  catch(e){const ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(_){}ta.remove();}
  toast('코멘트가 복사됐어요 ✓ IMS 성적표 Comment 칸에 붙여넣으세요');
}
async function saveGrammar(){
  const cls=ST.cls,lv=ST.next,book=ST.pending;
  if(!canEdit()||!cls||!lv||book==null)return;
  if(!TABLE_OK){toast('sql/dt_comment_grammar.sql 을 먼저 실행해주세요',false);return;}
  const {error}=await sb.from('dt_comment_grammar').upsert({branch_id:cls.branchId,level_code:lv,book,updated_by:(typeof CURUSER!=='undefined'&&CURUSER)||(typeof TEACHER!=='undefined'&&TEACHER)||'',updated_at:new Date().toISOString()},{onConflict:'branch_id,level_code'});
  if(error){toast('저장 실패: '+error.message,false);return;}
  OVR[cls.branchId+'|'+lv]=book;ST.pending=null;
  toast('문법교재가 저장됐어요 ✓ 이제 이 분원 담임 코멘트에 바로 반영돼요');
  render();
}
async function resetGrammar(){
  const cls=ST.cls,lv=ST.next;if(!canEdit()||!cls||!lv)return;
  if(!confirm(`${lv} 문법교재를 기본값(${GR_DEFAULT[lv]||''})으로 되돌릴까요?`))return;
  const {error}=await sb.from('dt_comment_grammar').delete().eq('branch_id',cls.branchId).eq('level_code',lv);
  if(error){toast('되돌리기 실패: '+error.message,false);return;}
  delete OVR[cls.branchId+'|'+lv];ST.pending=null;toast('기본값으로 되돌렸어요 ✓');render();
}

window.DTC={
  close,copy,saveGrammar,resetGrammar,startEdit,saveText,resetText,
  draft:v=>{if(ST.edit)ST.edit.draft=v;},
  cancelEdit:()=>{if(guardEdit())render();},
  tab:k=>{if(!guardEdit())return render();ST.tab=k;render();},
  setNext:v=>{if(!guardEdit())return render();ST.next=v;ST.pending=null;render();},
  setAce:i=>{if(!guardEdit())return render();ST.ace=i;render();},
  pickGrammar:v=>{
    if(v==='__custom'){const t=prompt('문법교재 이름을 입력하세요');if(!t||!t.trim()){render();return;}v=t.trim();}
    ST.pending=v;render();
  },
  /* 테스트용: 학기·분원·레벨만 넣어 코멘트 글을 뽑는다 */
  _text:chessText,_ace:aceText,_txt:()=>TXT,_setTxt:(k,v)=>{TXT[k]=v;},_semLabel:semLabel,_nextSem:nextSemId,_levels:LEVELS,_tpl:TPL,_gdef:GR_DEFAULT,_ovr:()=>OVR
};
/* 'DT 답안입력' 반 선택 옆 버튼이 부른다 */
window.openDtComment=async function(){
  const cls=(typeof curClassObj==='function')?curClassObj():null;
  if(!cls){toast('반을 먼저 선택해주세요',false);return;}
  ST={cls,tab:'chess',next:nextLevel(cls.levelCode)||'',ace:0,pending:null,edit:null};
  await loadOvr();
  render();
};
})();
