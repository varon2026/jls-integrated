// Shared app logic extracted from the original single-file HTML
// This file intentionally keeps the remaining shared constants, rendering flow, and event logic.

const EXAMS = {"E6": [{"no": 1, "ans": "5", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "관계/직업/장소 파악하기"}, {"no": 2, "ans": "5", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 3, "ans": "3", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 4, "ans": "3", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "목적/의도/이유 추론하기"}, {"no": 5, "ans": "3", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 6, "ans": "5", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "숫자 정보 파악하기"}, {"no": 7, "ans": "4", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "목적/의도/이유 추론하기"}, {"no": 8, "ans": "2", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 9, "ans": "2", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "그림 정보 파악하기"}, {"no": 10, "ans": "3", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "관계/직업/장소 파악하기"}, {"no": 11, "ans": "3", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 12, "ans": "3", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "숫자 정보 파악하기"}, {"no": 13, "ans": "1", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "적절한 응답 / 상황에 적절한 말 고르기"}, {"no": 14, "ans": "2", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "심정 파악하기"}, {"no": 15, "ans": "5", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 16, "ans": "5", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "내용 파악하기"}, {"no": 17, "ans": "3", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "내용 파악하기"}, {"no": 18, "ans": "3", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "내용 파악하기"}, {"no": 19, "ans": "3", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "주제 파악하기"}, {"no": 20, "ans": "4", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "주제 파악하기"}, {"no": 21, "ans": "2", "score": 3, "area": "RC", "competency": "문법과 어휘", "type": "어휘"}, {"no": 22, "ans": "3", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 종류"}, {"no": 23, "ans": "3", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "단어가 들어갈 빈칸 추론"}, {"no": 24, "ans": "5", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 25, "ans": "2", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 26, "ans": "3", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "문장삽입"}, {"no": 27, "ans": "5", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "지시어 찾기"}, {"no": 28, "ans": "1", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 29, "ans": "1", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 요지"}, {"no": 30, "ans": "5", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "문맥상 적합한 빈칸 추론"}, {"no": 31, "ans": "3", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "글쓴이의 심정"}, {"no": 32, "ans": "3", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 33, "ans": "5", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 목적"}, {"no": 34, "ans": "1", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 35, "ans": "1", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "글의 순서"}, {"no": 36, "ans": "5", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 37, "ans": "3", "score": 3, "area": "RC", "competency": "맥락 파악하기", "type": "글의 분위기 파악"}, {"no": 38, "ans": "1", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 39, "ans": "3", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 목적"}, {"no": 40, "ans": "3", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의  목적"}], "M1,M2(일반형)": [{"no": 1, "ans": "3", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 2, "ans": "5", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "숫자 정보 파악하기"}, {"no": 3, "ans": "4", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "목적/의도/이유 추론하기"}, {"no": 4, "ans": "2", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 5, "ans": "2", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "그림 정보 파악하기"}, {"no": 6, "ans": "3", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "관계/직업/장소 파악하기"}, {"no": 7, "ans": "3", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 8, "ans": "3", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "숫자 정보 파악하기"}, {"no": 9, "ans": "1", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "적절한 응답 / 상황에 적절한 말 고르기"}, {"no": 10, "ans": "2", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "심정 파악하기"}, {"no": 11, "ans": "5", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "세부 정보 파악하기"}, {"no": 12, "ans": "5", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "내용 파악하기"}, {"no": 13, "ans": "5", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "관계/직업/장소 파악하기"}, {"no": 14, "ans": "2", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "숫자 정보 파악하기"}, {"no": 15, "ans": "2", "score": 2, "area": "LC", "competency": "세부 내용 파악하기", "type": "부탁한 일 파악하기"}, {"no": 16, "ans": "5", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "요지 파악하기"}, {"no": 17, "ans": "1", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "적절한 응답 / 상황에 적절한 말 고르기"}, {"no": 18, "ans": "1", "score": 2, "area": "LC", "competency": "논리적 관계 파악하기", "type": "적절한 응답 / 상황에 적절한 말 고르기"}, {"no": 19, "ans": "4", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "주제 파악하기"}, {"no": 20, "ans": "5", "score": 2, "area": "LC", "competency": "중심 내용 파악하기", "type": "주제 파악하기"}, {"no": 21, "ans": "2", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 22, "ans": "3", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "문장삽입"}, {"no": 23, "ans": "5", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "지시어 찾기"}, {"no": 24, "ans": "1", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 25, "ans": "1", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 요지"}, {"no": 26, "ans": "5", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "문맥상 적합한 빈칸 추론"}, {"no": 27, "ans": "3", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "글쓴이의 심정"}, {"no": 28, "ans": "3", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 29, "ans": "5", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 목적"}, {"no": 30, "ans": "1", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 31, "ans": "1", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "글의 순서"}, {"no": 32, "ans": "5", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 33, "ans": "1", "score": 3, "area": "RC", "competency": "간접 말하기 , 쓰기", "type": "문단 요약하기"}, {"no": 34, "ans": "2", "score": 3, "area": "RC", "competency": "세부 내용 파악하기", "type": "내용 일치/불일치"}, {"no": 35, "ans": "4", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 제목"}, {"no": 36, "ans": "4", "score": 3, "area": "RC", "competency": "논리적 관계 파악하기", "type": "단어가 들어갈 빈칸 추론"}, {"no": 37, "ans": "1", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 제목"}, {"no": 38, "ans": "2", "score": 3, "area": "RC", "competency": "간접 말하기 , 쓰기", "type": "문단 요약하기"}, {"no": 39, "ans": "1", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 제목"}, {"no": 40, "ans": "4", "score": 3, "area": "RC", "competency": "중심 내용 파악하기", "type": "글의 주제"}], "M1(수능형)": [{"no": 1, "ans": "4", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 2, "ans": "1", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 3, "ans": "4", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "목적"}, {"no": 4, "ans": "5", "score": 3, "area": "LC", "competency": "대의 파악력", "type": "주제"}, {"no": 5, "ans": "3", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "관계"}, {"no": 6, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 일치"}, {"no": 7, "ans": "3", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 부탁"}, {"no": 8, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 이유"}, {"no": 9, "ans": "2", "score": 3, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 계산"}, {"no": 10, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 11, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "특정정보파악 - 이유"}, {"no": 12, "ans": "2", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "도표"}, {"no": 13, "ans": "2", "score": 2, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 14, "ans": "2", "score": 2, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 15, "ans": "2", "score": 3, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 16, "ans": "1", "score": 2, "area": "LC", "competency": "대의 파악력", "type": "주제"}, {"no": 17, "ans": "3", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 18, "ans": "2", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 요지"}, {"no": 19, "ans": "1", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "종합적이해 - 심경"}, {"no": 20, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주제"}, {"no": 21, "ans": "1", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주제"}, {"no": 22, "ans": "2", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 23, "ans": "4", "score": 3, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 24, "ans": "3", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 25, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 26, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 27, "ans": "4", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 28, "ans": "2", "score": 3, "area": "RC", "competency": "어법", "type": "틀린 문법 판단"}, {"no": 29, "ans": "5", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "지칭추론"}, {"no": 30, "ans": "1", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "어휘추론"}, {"no": 31, "ans": "3", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 32, "ans": "2", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 33, "ans": "4", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 34, "ans": "2", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "연결어추론"}, {"no": 35, "ans": "3", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "무관한 문장 고르기"}, {"no": 36, "ans": "4", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 37, "ans": "5", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 38, "ans": "3", "score": 3, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 39, "ans": "5", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 40, "ans": "1", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "요약문 완성"}, {"no": 41, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 42, "ans": "1", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 43, "ans": "2", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 44, "ans": "5", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "지칭추론"}, {"no": 45, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}], "M2(수능형)": [{"no": 1, "ans": "4", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 2, "ans": "4", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 3, "ans": "1", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "목적"}, {"no": 4, "ans": "3", "score": 2, "area": "LC", "competency": "대의 파악력", "type": "의견"}, {"no": 5, "ans": "2", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "관계"}, {"no": 6, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 일치"}, {"no": 7, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 할 일"}, {"no": 8, "ans": "1", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 이유"}, {"no": 9, "ans": "2", "score": 3, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 계산"}, {"no": 10, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 11, "ans": "3", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "특정정보파악 - 이유"}, {"no": 12, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "도표"}, {"no": 13, "ans": "1", "score": 2, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 14, "ans": "1", "score": 3, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 15, "ans": "2", "score": 3, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 16, "ans": "2", "score": 2, "area": "LC", "competency": "대의 파악력", "type": "주제"}, {"no": 17, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 18, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "종합적이해 - 목적"}, {"no": 19, "ans": "2", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "종합적이해 - 심경"}, {"no": 20, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 요지"}, {"no": 21, "ans": "4", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주장"}, {"no": 22, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주제"}, {"no": 23, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 24, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 25, "ans": "3", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 26, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 27, "ans": "4", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 28, "ans": "3", "score": 3, "area": "RC", "competency": "어법", "type": "틀린 문법 판단"}, {"no": 29, "ans": "1", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "어휘추론"}, {"no": 30, "ans": "3", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "지칭추론"}, {"no": 31, "ans": "2", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 32, "ans": "4", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 33, "ans": "1", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 34, "ans": "5", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 35, "ans": "4", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "무관한 문장 고르기"}, {"no": 36, "ans": "3", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 37, "ans": "2", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 38, "ans": "2", "score": 3, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 39, "ans": "5", "score": 3, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 40, "ans": "1", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "요약문 완성"}, {"no": 41, "ans": "3", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 42, "ans": "2", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 43, "ans": "3", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 44, "ans": "4", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "지칭추론"}, {"no": 45, "ans": "3", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}], "M3(고1형)": [{"no": 1, "ans": "2", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 2, "ans": "1", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 3, "ans": "3", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "목적"}, {"no": 4, "ans": "5", "score": 2, "area": "LC", "competency": "대의 파악력", "type": "의견"}, {"no": 5, "ans": "4", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "관계"}, {"no": 6, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 일치"}, {"no": 7, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 부탁"}, {"no": 8, "ans": "1", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 이유"}, {"no": 9, "ans": "2", "score": 3, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 계산"}, {"no": 10, "ans": "3", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 11, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "특정정보파악 - 이유"}, {"no": 12, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "도표"}, {"no": 13, "ans": "1", "score": 3, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 14, "ans": "2", "score": 3, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 15, "ans": "5", "score": 2, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 16, "ans": "2", "score": 2, "area": "LC", "competency": "대의 파악력", "type": "주제"}, {"no": 17, "ans": "3", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 18, "ans": "1", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "종합적이해 - 목적"}, {"no": 19, "ans": "1", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "종합적이해 - 심경"}, {"no": 20, "ans": "3", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주장"}, {"no": 21, "ans": "1", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "함축의미 추론"}, {"no": 22, "ans": "2", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 요지"}, {"no": 23, "ans": "4", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주제"}, {"no": 24, "ans": "1", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 25, "ans": "3", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 26, "ans": "3", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 27, "ans": "3", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 28, "ans": "4", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 29, "ans": "3", "score": 3, "area": "RC", "competency": "어법", "type": "틀린 문법 판단"}, {"no": 30, "ans": "3", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "어휘추론"}, {"no": 31, "ans": "1", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 32, "ans": "4", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 33, "ans": "2", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 34, "ans": "5", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 35, "ans": "2", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "무관한 문장 고르기"}, {"no": 36, "ans": "5", "score": 3, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 37, "ans": "4", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 38, "ans": "5", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 39, "ans": "4", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 40, "ans": "2", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "요약문 완성"}, {"no": 41, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 42, "ans": "4", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "어휘추론"}, {"no": 43, "ans": "2", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 44, "ans": "3", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "지칭추론"}, {"no": 45, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}], "M3(고2형)": [{"no": 1, "ans": "2", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 2, "ans": "3", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "응답"}, {"no": 3, "ans": "2", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "목적"}, {"no": 4, "ans": "3", "score": 2, "area": "LC", "competency": "대의 파악력", "type": "의견"}, {"no": 5, "ans": "5", "score": 2, "area": "LC", "competency": "추론적 이해력", "type": "관계"}, {"no": 6, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 일치"}, {"no": 7, "ans": "1", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 부탁"}, {"no": 8, "ans": "2", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 이유"}, {"no": 9, "ans": "4", "score": 3, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 계산"}, {"no": 10, "ans": "5", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 11, "ans": "4", "score": 3, "area": "LC", "competency": "사실적 이해력", "type": "특정정보파악 - 이유"}, {"no": 12, "ans": "4", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "도표"}, {"no": 13, "ans": "4", "score": 2, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 14, "ans": "2", "score": 3, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 15, "ans": "2", "score": 2, "area": "LC", "competency": "간접 말하기 능력", "type": "대화/담화의 완성"}, {"no": 16, "ans": "2", "score": 2, "area": "LC", "competency": "대의 파악력", "type": "주제"}, {"no": 17, "ans": "3", "score": 2, "area": "LC", "competency": "사실적 이해력", "type": "세부내용파악 - 언급"}, {"no": 18, "ans": "4", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "종합적이해 - 목적"}, {"no": 19, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "종합적이해 - 심경"}, {"no": 20, "ans": "3", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주장"}, {"no": 21, "ans": "4", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "함축의미 추론"}, {"no": 22, "ans": "1", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 요지"}, {"no": 23, "ans": "5", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 주제"}, {"no": 24, "ans": "5", "score": 3, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 25, "ans": "4", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 26, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 27, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 28, "ans": "5", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}, {"no": 29, "ans": "4", "score": 3, "area": "RC", "competency": "어법", "type": "틀린 문법 판단"}, {"no": 30, "ans": "3", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "어휘추론"}, {"no": 31, "ans": "5", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 32, "ans": "1", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 33, "ans": "1", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 34, "ans": "2", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "빈칸추론"}, {"no": 35, "ans": "3", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "무관한 문장 고르기"}, {"no": 36, "ans": "3", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 37, "ans": "4", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 38, "ans": "2", "score": 3, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 39, "ans": "3", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "주어진 문장 넣기"}, {"no": 40, "ans": "2", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "요약문 완성"}, {"no": 41, "ans": "4", "score": 2, "area": "RC", "competency": "대의 파악력", "type": "내용의이해 - 제목"}, {"no": 42, "ans": "5", "score": 3, "area": "RC", "competency": "추론적 이해력", "type": "어휘추론"}, {"no": 43, "ans": "4", "score": 2, "area": "RC", "competency": "간접 쓰기 능력", "type": "글의 순서"}, {"no": 44, "ans": "2", "score": 2, "area": "RC", "competency": "추론적 이해력", "type": "지칭추론"}, {"no": 45, "ans": "4", "score": 2, "area": "RC", "competency": "사실적 이해력", "type": "내용일치 불일치 판단"}]};

const VOCAB_ITEMS = [
  { no: 1,  word: "family",         gradeGroup: "초3~4" },
  { no: 2,  word: "dirty",          gradeGroup: "초3~4" },
  { no: 3,  word: "sad",            gradeGroup: "초3~4" },
  { no: 4,  word: "run",            gradeGroup: "초3~4" },
  { no: 5,  word: "sea",            gradeGroup: "초3~4" },

  { no: 6,  word: "travel",         gradeGroup: "초5~6" },
  { no: 7,  word: "vegetable",      gradeGroup: "초5~6" },
  { no: 8,  word: "adventure",      gradeGroup: "초5~6" },
  { no: 9,  word: "headache",       gradeGroup: "초5~6" },
  { no: 10, word: "important",      gradeGroup: "초5~6" },

  { no: 11, word: "afraid",         gradeGroup: "중1" },
  { no: 12, word: "address",        gradeGroup: "중1" },
  { no: 13, word: "quiet",          gradeGroup: "중1" },
  { no: 14, word: "honesty",        gradeGroup: "중1" },
  { no: 15, word: "introduce",      gradeGroup: "중1" },

  { no: 16, word: "recommend",      gradeGroup: "중2" },
  { no: 17, word: "congratulate",   gradeGroup: "중2" },
  { no: 18, word: "forget",         gradeGroup: "중2" },
  { no: 19, word: "talent",         gradeGroup: "중2" },
  { no: 20, word: "professional",   gradeGroup: "중2" },

  { no: 21, word: "several",        gradeGroup: "중3" },
  { no: 22, word: "necessary",      gradeGroup: "중3" },
  { no: 23, word: "convenient",     gradeGroup: "중3" },
  { no: 24, word: "provide",        gradeGroup: "중3" },
  { no: 25, word: "describe",       gradeGroup: "중3" },

  { no: 26, word: "appropriate",    gradeGroup: "고1" },
  { no: 27, word: "outcome",        gradeGroup: "고1" },
  { no: 28, word: "convert",        gradeGroup: "고1" },
  { no: 29, word: "recognize",      gradeGroup: "고1" },
  { no: 30, word: "immediately",    gradeGroup: "고1" },

  { no: 31, word: "fulfill",        gradeGroup: "고2" },
  { no: 32, word: "empathy",        gradeGroup: "고2" },
  { no: 33, word: "relevance",      gradeGroup: "고2" },
  { no: 34, word: "obedient",       gradeGroup: "고2" },
  { no: 35, word: "interference",   gradeGroup: "고2" },

  { no: 36, word: "constraint",     gradeGroup: "고3" },
  { no: 37, word: "contentious",    gradeGroup: "고3" },
  { no: 38, word: "innate",         gradeGroup: "고3" },
  { no: 39, word: "irreconcilable", gradeGroup: "고3" },
  { no: 40, word: "prescriptive",   gradeGroup: "고3" }
];

const TRANS_ITEMS = [
  { no: 1,  grade: "중1", max: 6, type: "유도부사 there is~ / there are", sentence: "There is a big meal, music, and dancing." },
  { no: 2,  grade: "중1", max: 6, type: "명령문, 재귀대명사, be 동사 미래 시제의 의문문", sentence: "Ask yourself, “Will I be proud of my job?”" },
  { no: 3,  grade: "중1", max: 6, type: "조동사 can (능력), 접속사 when", sentence: "Dogs can smell when you are sad and need a friend." },
  { no: 4,  grade: "중1", max: 6, type: "동명사 (주어), 조동사 must (강한 추측)", sentence: "Finding a parking space must be a headache for drivers." },

  { no: 5,  grade: "중2", max: 6, type: "현재 완료 시제 (완료) / 현재진행시제", sentence: "He has already won nine Olympic gold medals and is still competing today." },
  { no: 6,  grade: "중2", max: 6, type: "수동태, 일반 동사의 현재 시제", sentence: "Drones are normally controlled by a human on the ground and have various uses." },
  { no: 7,  grade: "중2", max: 6, type: "5형식 문장 (준동사 help에 따른 목적격 보어의 형태)", sentence: "These games help you think faster and make fewer mistakes." },
  { no: 8,  grade: "중2", max: 6, type: "접속사 that", sentence: "Emoji lovers argue that the pictures actually improve our writing." },

  { no: 9,  grade: "중3", max: 7, type: "관계대명사 what", sentence: "We are constantly shown unrealistic images of what it means to be beautiful." },
  { no: 10, grade: "중3", max: 7, type: "It ~ that 강조구문", sentence: "It is this twist that keeps people coming back to this movie again and again." },
  { no: 11, grade: "중3", max: 7, type: "5형식 수동태 문장", sentence: "Shoppers were asked to list ten items they were likely to purchase." },
  { no: 12, grade: "중3", max: 7, type: "관계부사", sentence: "This successful flight paved the way for a future where any ordinary person will be able to travel to space." },

  { no: 13, grade: "고등", max: 8, type: "고등 이상", sentence: "When you are stressed out, you may not even realize all of the ways in which your mind and body are affected." },
  { no: 14, grade: "고등", max: 8, type: "고등 이상", sentence: "Her friends and family have done everything imaginable to help her prepare, from simulating interviews to buying an appropriate outfit and making sure her hair and makeup were done perfectly." },
  { no: 15, grade: "고등", max: 8, type: "고등 이상", sentence: "Among the qualities that made their effects so believable were carefully constructed models and an insistence that their effects be created “in camera.”" }
];

/* moved to separate file */


let LAST_EXAM_SESSION = null;
let LAST_VT_SESSION = null;
let LAST_REPORT_SESSION = null;

const VOCAB_ANSWER_KEY = [
  { no: 1,  word: "family",         meaning: "가족" },
  { no: 2,  word: "dirty",          meaning: "더러운" },
  { no: 3,  word: "sad",            meaning: "슬픈" },
  { no: 4,  word: "run",            meaning: "달리다, 뛰다" },
  { no: 5,  word: "sea",            meaning: "바다" },

  { no: 6,  word: "travel",         meaning: "여행하다, 여행" },
  { no: 7,  word: "vegetable",      meaning: "야채, 채소" },
  { no: 8,  word: "adventure",      meaning: "모험, 모험하다" },
  { no: 9,  word: "headache",       meaning: "두통" },
  { no: 10, word: "important",      meaning: "중요한" },

  { no: 11, word: "afraid",         meaning: "무서워하는" },
  { no: 12, word: "address",        meaning: "주소" },
  { no: 13, word: "quiet",          meaning: "조용한" },
  { no: 14, word: "honesty",        meaning: "정직" },
  { no: 15, word: "introduce",      meaning: "소개하다" },

  { no: 16, word: "recommend",      meaning: "추천하다" },
  { no: 17, word: "congratulate",   meaning: "축하하다" },
  { no: 18, word: "forget",         meaning: "잊다" },
  { no: 19, word: "talent",         meaning: "재능, 재주" },
  { no: 20, word: "professional",   meaning: "전문적인, 프로의" },

  { no: 21, word: "several",        meaning: "몇 명의, 수 개의" },
  { no: 22, word: "necessary",      meaning: "필요한" },
  { no: 23, word: "convenient",     meaning: "편리한" },
  { no: 24, word: "provide",        meaning: "공급하다" },
  { no: 25, word: "describe",       meaning: "묘사하다" },

  { no: 26, word: "appropriate",    meaning: "적합한, 알맞은" },
  { no: 27, word: "outcome",        meaning: "결과" },
  { no: 28, word: "convert",        meaning: "바꿀" },
  { no: 29, word: "recognize",      meaning: "인식하다" },
  { no: 30, word: "immediately",    meaning: "즉시" },

  { no: 31, word: "fulfill",        meaning: "충족시키다" },
  { no: 32, word: "empathy",        meaning: "공감" },
  { no: 33, word: "relevance",      meaning: "적합성, 타당성, 관련성" },
  { no: 34, word: "obedient",       meaning: "순종적인" },
  { no: 35, word: "interference",   meaning: "간섭" },

  { no: 36, word: "constraint",     meaning: "압박" },
  { no: 37, word: "contentious",    meaning: "논쟁적인" },
  { no: 38, word: "innate",         meaning: "타고난" },
  { no: 39, word: "irreconcilable", meaning: "화해할 수 없는" },
  { no: 40, word: "prescriptive",   meaning: "지시의" }
];
const TRANS_ANSWER_KEY = [
  {
    no: 1,
    grade: "M1",
    original: "There is a big meal, music, and dancing.",
    points: [
      { score: 2, text: "푸짐한 식사,음악,그리고 춤추기가" },
      { score: 4, text: "있다" }
    ]
  },
  {
    no: 2,
    grade: "M1",
    original: "Ask yourself, “Will I be proud of my job?”",
    points: [
      { score: 1, text: "당신 자신에게" },
      { score: 2, text: "물어라" },
      { score: 1, text: "내가 내 직업을" },
      { score: 2, text: "자랑스럽게 할까?" }
    ]
  },
  {
    no: 3,
    grade: "M1",
    original: "Dogs can smell when you are sad and need a friend.",
    points: [
      { score: 1, text: "개들은" },
      { score: 1, text: "당신이 슬프고 친구가 필요할" },
      { score: 2, text: "때의" },
      { score: 2, text: "냄새를 맡을 수 있다" }
    ]
  },
  {
    no: 4,
    grade: "M1",
    original: "Finding a parking space must be a headache for drivers.",
    points: [
      { score: 2, text: "주차 공간을 찾는 것은" },
      { score: 1, text: "운전자들에게" },
      { score: 1, text: "골칫거리임에" },
      { score: 2, text: "틀림없다" }
    ]
  },
  {
    no: 5,
    grade: "M2",
    original: "He has already won nine Olympic gold medals and is still competing today.",
    points: [
      { score: 3, text: "그는 이미 9개의 올림픽 금메달을 따냈고" },
      { score: 1, text: "지금도(=현재도)" },
      { score: 2, text: "여전히 경기에 참가하고 있다" }
    ]
  },
  {
    no: 6,
    grade: "M2",
    original: "Drones are normally controlled by a human on the ground and have various uses.",
    points: [
      { score: 1, text: "드론들은" },
      { score: 1, text: "보통 땅에 있는" },
      { score: 1, text: "사람에 의해" },
      { score: 2, text: "조종되며" },
      { score: 1, text: "다양한 용도를 가지고 있다" }
    ]
  },
  {
    no: 7,
    grade: "M2",
    original: "These games help you think faster and make fewer mistakes.",
    points: [
      { score: 1, text: "이 게임들은" },
      { score: 2, text: "당신이 더 빠르게 생각하고" },
      { score: 3, text: "더 적은 실수를 하도록 돕는다" }
    ]
  },
  {
    no: 8,
    grade: "M2",
    original: "Emoji lovers argue that the pictures actually improve our writing.",
    points: [
      { score: 1, text: "이모지를 사랑하는 사람들은" },
      { score: 1, text: "그 그림들이" },
      { score: 1, text: "실제로 우리의 글을" },
      { score: 3, text: "향상시킨다고 주장한다" }
    ]
  },
  {
    no: 9,
    grade: "M3",
    original: "We are constantly shown unrealistic images of what it means to be beautiful.",
    points: [
      { score: 1, text: "우리는 아름답다는 것이" },
      { score: 3, text: "의미하는 것에 관한" },
      { score: 1, text: "비현실적인 이미지들에" },
      { score: 2, text: "지속적으로 노출이 된다" }
    ]
  },
  {
    no: 10,
    grade: "M3",
    original: "It is this twist that keeps people coming back to this movie again and again.",
    points: [
      { score: 1, text: "사람들을 계속해서" },
      { score: 2, text: "이 영화로 몇 번이고 되돌아오게 만드는 것은" },
      { score: 4, text: "바로 이 반전이다" }
    ]
  },
  {
    no: 11,
    grade: "M3",
    original: "Shoppers were asked to list ten items they were likely to purchase.",
    points: [
      { score: 1, text: "쇼핑객들은" },
      { score: 2, text: "그들이 구입할 것 같은" },
      { score: 1, text: "10개의 물품들을" },
      { score: 3, text: "작성하도록 요청 받았다" }
    ]
  },
  {
    no: 12,
    grade: "M3",
    original: "This successful flight paved the way for a future where any ordinary person will be able to travel to space.",
    points: [
      { score: 1, text: "이 성공적인 비행은" },
      { score: 1, text: "어떤 평범한 사람이라도" },
      { score: 4, text: "우주로 여행갈 수 있는 미래를 위한" },
      { score: 1, text: "길을 닦아 주었다" }
    ]
  },
  {
    no: 13,
    grade: "고등",
    original: "When you are stressed out, you may not even realize all of the ways in which your mind and body are affected.",
    points: [
      { score: 1, text: "당신이 스트레스를 받을 때" },
      { score: 3, text: "당신의 마음과 신체가 영향을 받는" },
      { score: 3, text: "모든 방식에 대해" },
      { score: 1, text: "당신은 알지 못할 수 있다" }
    ]
  },
  {
    no: 14,
    grade: "고등",
    original: "Her friends and family have done everything imaginable to help her prepare, from simulating interviews to buying an appropriate outfit and making sure her hair and makeup were done perfectly.",
    points: [
      { score: 3, text: "그녀의 친구들과 가족은 그녀가 준비하는 것을 도우려고, 면접 모의훈련을 하는 것부터" },
      { score: 3, text: "적절한 옷을 사고 그녀의 머리와 화장이 완벽하게 되었는지를 확인하는 것까지" },
      { score: 2, text: "상상할 수 있는 모든 것을 했다" }
    ]
  },
  {
    no: 15,
    grade: "고등",
    original: "Among the qualities that made their effects so believable were carefully constructed models and an insistence that their effects be created “in camera.”",
    points: [
      { score: 3, text: "신중하게 만들어진 모형과" },
      { score: 3, text: "그들의 효과가 카메라 내에서 만들어져야 한다는 고집이" },
      { score: 2, text: "그들의 효과를 아주 그럴듯하게 만든 특성들 중에 있었다" }
    ]
  }
];

const PAPER_FILE_MAP = {
  "E6": "PDF/[JLS Academic Achievement Assessment] E6.pdf",
  "M(일반형)": "PDF/[JLS Academic Achievement Assessment] M1.pdf",
  "M1(수능형)": "PDF/ACE 신규모집 M1(고1수능) 문제지_중1.pdf",
  "M2(수능형)": "PDF/ACE 신규모집 M2(고1수능) 문제지_중2.pdf",
  "M3(고1형)": "PDF/ACE 신규모집 M3(고1수능) 문제지_중3.pdf",
  "M3(고2형)": "PDF/ACE 신규모집 M3(고2수능) 문제지_중3.pdf",
  "Voca & Translation": "PDF/[JLS Academic Achievement Assessment] Voca & Translation_0116.pdf"
};
const CHESS_INTERVIEW_MAP = {
  D1: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Complexity", desc: "회화 문장 수준" },
      { key: "P", label: "Phonics", desc: "파닉스" }
    ],
    writing: []
  },

  D2: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Speaking - Complexity", desc: "화화 문장 수준" },
      { key: "P", label: "Phonics", desc: "파닉스" },
      { key: "RF", label: "Reading Fluency", desc: "유창성" },
      { key: "RC", label: "Reading - Complexity", desc: "문장 수준" },
      { key: "R", label: "Comprehension", desc: "이해력" }
    ],
    writing: []
  },

  D3: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Speaking - Complexity", desc: "화화 문장 수준" },
      { key: "RF", label: "Reading Fluency", desc: "유창성" },
      { key: "RC", label: "Reading - Complexity", desc: "문장 수준" },
      { key: "R", label: "Comprehension", desc: "이해력" }
    ],
    writing: []
  },

  D4: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Speaking - Complexity", desc: "화화 문장 수준" },
      { key: "RF", label: "Reading Fluency", desc: "유창성" },
      { key: "RC", label: "Reading - Complexity", desc: "문장 수준" },
      { key: "R", label: "Comprehension", desc: "이해력" }
    ],
    writing: []
  },

  L1: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Speaking - Complexity", desc: "화화 문장 수준" },
      { key: "RF", label: "Reading Fluency", desc: "유창성" },
      { key: "RC", label: "Reading - Complexity", desc: "문장 수준" },
      { key: "R", label: "Comprehension", desc: "이해력" }
    ],
    writing: [
      { key: "WT", label: "Task Completion", desc: "과제 수행" },
      { key: "WI", label: "Ideas and Organization", desc: "아이디어와 구성" },
      { key: "WP", label: "Paraphrasing", desc: "바꿔쓰기" },
      { key: "WG", label: "Mechanics and Grammar", desc: "문법 및 표현" }
    ]
  },

  L2: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Speaking - Complexity", desc: "화화 문장 수준" },
      { key: "RF", label: "Reading Fluency", desc: "유창성" },
      { key: "RC", label: "Reading - Complexity", desc: "문장 수준" },
      { key: "R", label: "Comprehension", desc: "이해력" }
    ],
    writing: [
      { key: "WT", label: "Task Completion", desc: "과제 수행" },
      { key: "WI", label: "Ideas and Organization", desc: "아이디어와 구성" },
      { key: "WP", label: "Paraphrasing", desc: "바꿔쓰기" },
      { key: "WG", label: "Mechanics and Grammar", desc: "문법 및 표현" }
    ]
  },

  L3: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Speaking - Complexity", desc: "화화 문장 수준" },
      { key: "RF", label: "Reading Fluency", desc: "유창성" },
      { key: "RC", label: "Reading - Complexity", desc: "문장 수준" },
      { key: "R", label: "Comprehension", desc: "이해력" }
    ],
    writing: [
      { key: "WT", label: "Task Completion", desc: "과제 수행" },
      { key: "WTS", label: "Topic Sentence", desc: "주제문" },
      { key: "WSD", label: "Supporting Details", desc: "세부 내용" },
      { key: "WO", label: "Organization", desc: "구성" },
      { key: "WG", label: "Mechanics and Grammar", desc: "문법 및 표현" }
    ]
  },

  L4: {
    speaking: [
      { key: "L", label: "Listening", desc: "청취력" },
      { key: "V", label: "Vocabulary", desc: "어휘력" },
      { key: "C", label: "Speaking - Complexity", desc: "화화 문장 수준" },
      { key: "RF", label: "Reading Fluency", desc: "유창성" },
      { key: "RC", label: "Reading - Complexity", desc: "문장 수준" },
      { key: "R", label: "Comprehension", desc: "이해력" }
    ],
    writing: [
      { key: "WT", label: "Task Completion", desc: "과제 수행" },
      { key: "WTS", label: "Topic Sentence", desc: "주제문" },
      { key: "WSD", label: "Supporting Details", desc: "세부 내용" },
      { key: "WO", label: "Organization", desc: "구성" },
      { key: "WG", label: "Mechanics and Grammar", desc: "문법 및 표현" }
    ]
  }
};
function esc(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeJs(text) {
  return String(text ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function normalize(text) {
  return String(text ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
function normalizeKor(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, '').replace(/[.,]/g, '');
}
function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function formatDate(dateText) {
  return dateText || todayIso();
}
function isSatExamKey(examKey) {
  return /수능형|고1형|고2형/.test(examKey || '');
}
function getDisplayLevel(assignedLevel) {
  return assignedLevel || "미배정";
}
function openSelectedPaper() {
  const examEl = document.getElementById("examName");
  const title = examEl?.value || "";

  const PAPER_FILE_MAP = {
    "E6": "PDF/[JLS Academic Achievement Assessment] E6.pdf",
    "M1(일반형)": "PDF/[JLS Academic Achievement Assessment] M1.pdf",
    "M2(일반형)": "PDF/[JLS Academic Achievement Assessment] M1.pdf",
    "M1(수능형)": "PDF/ACE 신규모집 M1(고1수능) 문제지_중1.pdf",
    "M2(수능형)": "PDF/ACE 신규모집 M2(고1수능) 문제지_중2.pdf",
    "M3(고1형)": "PDF/ACE 신규모집 M3(고1수능) 문제지_중3.pdf",
    "M3(고2형)": "PDF/ACE 신규모집 M3(고2수능) 문제지_중3.pdf",
    "Voca & Translation": "PDF/[JLS Academic Achievement Assessment] Voca & Translation_0116.pdf"
  };

  const CHESS_PAPER_MAP = {
    D1: "./PDF/D1.pdf",
    D2: "./PDF/D2.pdf",
    D3: "./PDF/D3.pdf",
    D4: "./PDF/D4.pdf",
    L1: "./PDF/L1.pdf",
    L2: "./PDF/L2.pdf",
    L3: "./PDF/L3.pdf",
    L4: "./PDF/L4.pdf"
  };

  const file = PAPER_FILE_MAP[title] || CHESS_PAPER_MAP[title];

  if (!file) {
    alert("PDF 연결 안됨");
    return;
  }

  window.open(file, "_blank");
}
function buildAnswerGroups(items, size = 5) {
  const groups = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

function renderChoiceGroups(groups) {
  const bgList = [
    "linear-gradient(180deg,#f7fbff 0%,#eef6ff 100%)",
    "linear-gradient(180deg,#fbfbff 0%,#f2f4ff 100%)",
    "linear-gradient(180deg,#f9fcfb 0%,#eef9f3 100%)",
    "linear-gradient(180deg,#fffaf7 0%,#fff2ea 100%)"
  ];

  return groups.map((group, idx) => {
    const start = idx * 5 + 1;
    const end = start + group.length - 1;

    const itemsHtml = group.map((ans, i) => {
      const no = start + i;
      return `
        <div style="
          background:rgba(255,255,255,0.96);
          border:1px solid #d9e6f3;
          border-radius:18px;
          min-height:82px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;
          gap:6px;
        ">
          <div style="
            font-size:14px;
            font-weight:700;
            color:#6b7c93;
          ">${no}번</div>
          <div style="
            font-size:30px;
            font-weight:900;
            color:#1f5d96;
            line-height:1;
          ">${ans}</div>
        </div>
      `;
    }).join("");

    return `
      <section style="
        border-radius:22px;
        padding:18px;
        border:1px solid #dbe6f2;
        box-shadow:0 8px 20px rgba(15,23,42,0.05);
        background:${bgList[idx % 4]};
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:14px;
        ">
          <div style="
            font-size:20px;
            font-weight:900;
            color:#1f5d96;
          ">${start} - ${end}</div>
          <div style="
            font-size:13px;
            font-weight:700;
            color:#6b7c93;
            background:rgba(255,255,255,0.85);
            border:1px solid #dde8f5;
            border-radius:999px;
            padding:6px 10px;
          ">${group.length}문항</div>
        </div>
        <div style="
          display:grid;
          grid-template-columns:repeat(5, minmax(0, 1fr));
          gap:10px;
        ">
          ${itemsHtml}
        </div>
      </section>
    `;
  }).join("");
}

function renderVocabGroups(groups) {
  const bgList = [
    "linear-gradient(180deg,#f7fbff 0%,#eef6ff 100%)",
    "linear-gradient(180deg,#fbfbff 0%,#f2f4ff 100%)",
    "linear-gradient(180deg,#f9fcfb 0%,#eef9f3 100%)",
    "linear-gradient(180deg,#fffaf7 0%,#fff2ea 100%)"
  ];

  return groups.map((group, idx) => {
    const start = idx * 5 + 1;
    const end = start + group.length - 1;

    const itemsHtml = group.map(item => {
      return `
        <div style="
          background:rgba(255,255,255,0.96);
          border:1px solid #d9e6f3;
          border-radius:18px;
          padding:14px 12px;
          min-height:108px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          gap:8px;
        ">
          <div style="
            font-size:13px;
            font-weight:800;
            color:#6b7c93;
          ">${item.no}번</div>
          <div style="
            font-size:20px;
            font-weight:900;
            color:#1f5d96;
            line-height:1.2;
          ">${esc(item.word)}</div>
          <div style="
            font-size:15px;
            font-weight:700;
            color:#475569;
            line-height:1.35;
          ">${esc(item.meaning)}</div>
        </div>
      `;
    }).join("");

    return `
      <section style="
        border-radius:22px;
        padding:18px;
        border:1px solid #dbe6f2;
        box-shadow:0 8px 20px rgba(15,23,42,0.05);
        background:${bgList[idx % 4]};
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:14px;
        ">
          <div style="
            font-size:20px;
            font-weight:900;
            color:#1f5d96;
          ">${start} - ${end}</div>
          <div style="
            font-size:13px;
            font-weight:700;
            color:#6b7c93;
            background:rgba(255,255,255,0.85);
            border:1px solid #dde8f5;
            border-radius:999px;
            padding:6px 10px;
          ">${group.length}문항</div>
        </div>
        <div style="
          display:grid;
          grid-template-columns:repeat(2, minmax(0, 1fr));
          gap:12px;
        ">
          ${itemsHtml}
        </div>
      </section>
    `;
  }).join("");
}

function renderTransCards(items) {
  return items.map(item => {
const totalScore = (item.points || []).reduce((sum, p) => sum + p.score, 0);
    const pointHtml = (item.points || []).map(p => `
      <div style="
        display:flex;
        gap:10px;
        align-items:flex-start;
        padding:10px 12px;
        background:#ffffff;
        border:1px solid #dbe6f2;
        border-radius:14px;
      ">
        <div style="
          min-width:44px;
          height:30px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:999px;
          background:#eaf4ff;
          color:#1f5d96;
          font-size:13px;
          font-weight:900;
        ">${p.score}점</div>
        <div style="
          font-size:15px;
          line-height:1.5;
          color:#334155;
          font-weight:700;
        ">${esc(p.text)}</div>
      </div>
    `).join("");

return `
  <section style="
    border-radius:22px;
    padding:18px;
    border:1px solid #dbe6f2;
    background:linear-gradient(180deg,#fff 0%,#f8fbff 100%);
    box-shadow:0 8px 20px rgba(15,23,42,0.05);
  ">
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:12px;
    ">
      <div style="
        font-size:20px;
        font-weight:900;
        color:#1f5d96;
        display:flex;
        align-items:center;
        gap:8px;
      ">
        ${item.no}번

        <span style="
          margin-left:6px;
          padding:4px 10px;
          border-radius:999px;
          background:#eaf4ff;
          color:#1f5d96;
          font-size:13px;
          font-weight:900;
        ">
          총 ${totalScore}점
        </span>
      </div>

      <div style="
        font-size:13px;
        font-weight:800;
        color:#6b7c93;
        background:#f8fafc;
        border:1px solid #dde8f5;
        border-radius:999px;
        padding:6px 10px;
      ">${esc(item.grade)}</div>
    </div>

    <div style="
      margin-bottom:12px;
      padding:12px 14px;
      background:#eef6ff;
      border:1px solid #d8e8f7;
      border-radius:16px;
      color:#1e293b;
      font-size:15px;
      line-height:1.55;
      font-weight:700;
    ">
      ${esc(item.original)}
    </div>

        <div style="
      display:grid;
      gap:10px;
    ">
      ${pointHtml}
    </div>
  </section>
    `;
  }).join("");
}
function openAceAnswerModalPretty(title) {
  let examData = EXAMS[title];
  if (!examData && (title === "M1(일반형)" || title === "M2(일반형)")) {
    examData = EXAMS["M1,M2(일반형)"];
  }

  if (!examData || !examData.length) {
    openAnswerModal();
    return;
  }

  const answers = examData.map(q => q.ans);

  const modalHtml = `
    <div class="answer-sheet-wrap">
      <div class="answer-head">
        <div>
          <div class="answer-label">ANSWER SHEET</div>
          <h2>${title} 답지</h2>
          <p>객관식 정답표</p>
        </div>
        <button type="button" class="answer-close-btn" onclick="closeAnswerModal()">닫기</button>
      </div>

      <div class="answer-section-title">객관식 답지</div>

      <div class="answer-group-grid">
        ${renderChoiceGroups(buildAnswerGroups(answers))}
      </div>
    </div>
  `;

  openAnswerModalContent(modalHtml);
}
function openSelectedAnswer() {
  const examEl = document.getElementById("examName");
  const title = examEl?.value || "";

  const chessTests = ["D1","D2","D3","D4","L1","L2","L3","L4"];

  if (chessTests.includes(title)) {
    CURRENT_CHESS_EXAM_KEY = title;
    showChessAnswerSheet();
    return;
  }

 if (title === "Voca & Translation") {
  openAnswerModal();
  return;
}

 openAceAnswerModalPretty(title);
}
function openAnswerModal() {
  const examEl = document.getElementById("examName");
  if (!examEl) return;

  const title = examEl.value;

  const chessTests = ["D1","D2","D3","D4","L1","L2","L3","L4"];

  let examData = EXAMS[title];
  if (!examData && (title === "M1(일반형)" || title === "M2(일반형)")) {
    examData = EXAMS["M1,M2(일반형)"];
  }
if (title === "Voca & Translation") {
  const vocabData = typeof VOCAB_ANSWER_KEY !== "undefined" ? VOCAB_ANSWER_KEY : [];
  const transData = typeof TRANS_ANSWER_KEY !== "undefined" ? TRANS_ANSWER_KEY : [];

  if (!vocabData.length && !transData.length) {
    alert("단어/해석 답안 데이터가 없습니다.");
    return;
  }

  const getVocabText = (item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    return item.answer || item.ans || item.word || item.text || item.english || item.eng || "";
  };

 const vocabRows = vocabData.map((item, i) => `
  <div class="answer-chip" style="
    border-radius:18px;
    background:#fff;
    padding:14px 12px;
    border:1px solid #d9e6f3;
    min-height:108px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:8px;
  ">
    <div class="answer-chip-no" style="
      font-size:13px;
      font-weight:800;
      color:#6b7c93;
    ">${item.no || i + 1}번</div>

    <div class="answer-chip-val" style="
      font-size:20px;
      font-weight:900;
      color:#1f5d96;
      line-height:1.2;
    ">${esc(item.word || "")}</div>

    <div style="
      font-size:15px;
      font-weight:700;
      color:#475569;
      line-height:1.35;
    ">${esc(item.meaning || "")}</div>
  </div>
`).join("");

  const transRows = transData.map((item, i) => {
    const original = typeof item === "string"
      ? item
      : (item?.original || item?.sentence || item?.text || "");

    const points = Array.isArray(item?.points)
      ? item.points.map(p => `
          <div style="
            padding:10px 12px;
            background:#f8fbff;
            border:1px solid #dbe7f3;
            border-radius:12px;
            font-size:14px;
            color:#334155;
            line-height:1.5;
            font-weight:700;
          ">
            ${typeof p === "string"
              ? esc(p)
              : `${p.score ? `<strong style="color:#1f5d96;">[${p.score}점]</strong> ` : ""}${esc(p.text || "")}`
            }
          </div>
        `).join("")
      : "";

    return `
      <section style="
        border:1px solid #dbe7f3;
        border-radius:18px;
        padding:16px;
        background:#fff;
        box-shadow:0 8px 20px rgba(15,23,42,0.04);
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:12px;
          font-weight:900;
          color:#1f5d96;
          font-size:18px;
        ">
          <span>${i + 1}</span>
        </div>

        <div style="
          margin-bottom:12px;
          padding:12px 14px;
          background:#eef6ff;
          border:1px solid #d8e8f7;
          border-radius:16px;
          color:#1e293b;
          font-size:15px;
          line-height:1.55;
          font-weight:700;
        ">
          ${esc(original)}
        </div>

        <div style="
          display:grid;
          gap:10px;
        ">
          ${points}
        </div>
      </section>
    `;
  }).join("");

  const html = `
    <div class="answer-sheet-wrap">
      <div class="answer-head">
        <div>
          <div class="answer-label">ANSWER SHEET</div>
          <h2>Voca & Translation 답지</h2>
          <p>단어 / 해석 정답표</p>
        </div>
        <button type="button" class="answer-close-btn" onclick="closeAnswerModal()">닫기</button>
      </div>

      ${vocabData.length ? `
        <div class="answer-section-title">Vocabulary Test</div>
        <div class="answer-chip-grid" style="
          display:grid;
          grid-template-columns:repeat(2, minmax(0, 1fr));
          gap:14px;
        ">
          ${vocabRows}
        </div>
      ` : ""}

      ${transData.length ? `
        <div class="answer-section-title" style="margin-top:24px;">Translation Test</div>
        <div style="
          display:grid;
          gap:16px;
        ">
          ${transRows}
        </div>
      ` : ""}
    </div>
  `;

  openAnswerModalContent(html);
  return;
}
const modalGrade = LAST_EXAM_SESSION?.grade || "";
const shouldIncludeVT =
  title === "Voca & Translation" ||
  modalGrade === "초등6" ||
  modalGrade === "중등1";

const vocabData =
  shouldIncludeVT && typeof VOCAB_ANSWER_KEY !== "undefined"
    ? VOCAB_ANSWER_KEY
    : [];

const transData =
  shouldIncludeVT && typeof TRANS_ANSWER_KEY !== "undefined"
    ? TRANS_ANSWER_KEY
    : [];

  const isChess = chessTests.includes(title);

  if (!isChess && !examData && !vocabData.length && !transData.length) {
    alert("답안 데이터 없음");
    return;
  }

  let contentHtml = "";

  if (isChess) {
    const answers = CHESS_ANSWER_KEY[title];

    if (!answers || !answers.length) {
      alert("답안 데이터 없음");
      return;
    }

    contentHtml += `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin:4px 0 10px;
      ">
        <h3 style="
          margin:0;
          font-size:22px;
          font-weight:900;
          color:#1f5d96;
        ">객관식 답지</h3>
      </div>
      <div style="
        display:grid;
        grid-template-columns:repeat(2, minmax(0, 1fr));
        gap:16px;
      ">
        ${renderChoiceGroups(buildAnswerGroups(answers))}
      </div>
    `;
  }

  if (examData && !isChess) {
    const answers = examData.map(q => q.ans);
    contentHtml += `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin:4px 0 10px;
      ">
        <h3 style="
          margin:0;
          font-size:22px;
          font-weight:900;
          color:#1f5d96;
        ">객관식 답지</h3>
      </div>
      <div style="
        display:grid;
        grid-template-columns:repeat(2, minmax(0, 1fr));
        gap:16px;
      ">
        ${renderChoiceGroups(buildAnswerGroups(answers))}
      </div>
    `;
  }

  if (vocabData.length) {
    contentHtml += `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin:${examData ? "28px" : "4px"} 0 10px;
      ">
        <h3 style="
          margin:0;
          font-size:22px;
          font-weight:900;
          color:#1f5d96;
        ">Voca 답지</h3>
      </div>
      <div style="
        display:grid;
        grid-template-columns:repeat(2, minmax(0, 1fr));
        gap:16px;
      ">
        ${renderVocabGroups(buildAnswerGroups(vocabData))}
      </div>
    `;
  }

  if (transData.length) {
    contentHtml += `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin:${(examData || vocabData.length) ? "28px" : "4px"} 0 10px;
      ">
        <h3 style="
          margin:0;
          font-size:22px;
          font-weight:900;
          color:#1f5d96;
        ">Translation 채점 기준</h3>
      </div>
      <div style="
        display:grid;
        grid-template-columns:1fr;
        gap:16px;
      ">
        ${renderTransCards(transData)}
      </div>
    `;
  }

  const oldModal = document.querySelector(".answer-modal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.className = "answer-modal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.zIndex = "9999";

  modal.innerHTML = `
    <div class="answer-overlay" onclick="closeAnswerModal()"></div>
    <div class="answer-box">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:16px;
        margin-bottom:18px;
        padding-bottom:18px;
        border-bottom:1px solid #e5edf6;
      ">
        <div>
          <div style="
            font-size:12px;
            font-weight:800;
            letter-spacing:.12em;
            color:#7b8ba1;
            margin-bottom:6px;
          ">ANSWER SHEET</div>
          <div style="
            font-size:32px;
            font-weight:900;
            color:#1f5d96;
            line-height:1.1;
            margin-bottom:6px;
          ">${esc(title)} 답지</div>
          <div style="
            font-size:15px;
            color:#64748b;
            font-weight:600;
          ">정답 및 채점 기준</div>
        </div>
        <button type="button" onclick="closeAnswerModal()" style="
          min-width:84px;
          height:44px;
          border-radius:14px;
          background:#1f5d96;
          color:#fff;
          font-size:15px;
          font-weight:800;
          border:none;
          cursor:pointer;
        ">닫기</button>
      </div>

      <div style="display:grid; gap:0;">
        ${contentHtml}
      </div>
    </div>
  `;

  setTimeout(() => {
    const overlay = modal.querySelector(".answer-overlay");
    const box = modal.querySelector(".answer-box");

    if (overlay) {
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(15,23,42,0.42)";
      overlay.style.backdropFilter = "blur(6px)";
    }

    if (box) {
      box.style.position = "relative";
      box.style.width = "980px";
      box.style.maxWidth = "92%";
      box.style.maxHeight = "86vh";
      box.style.overflowY = "auto";
      box.style.margin = "36px auto";
      box.style.background = "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)";
      box.style.borderRadius = "28px";
      box.style.padding = "26px";
      box.style.boxShadow = "0 24px 80px rgba(15,23,42,0.22)";
      box.style.zIndex = "2";
      box.style.border = "1px solid #dbe7f3";
    }
  }, 0);

  document.body.appendChild(modal);
}

function closeAnswerModal() {
  const modal = document.querySelector(".answer-modal");
  if (modal) modal.remove();
}
function pageTemplate(title, subtitle, body) {
  return `
    <section class="page">
      <div class="page-head">
        <div>
          <div class="page-label">${title}</div>
          <div class="report-subtitle">${subtitle}</div>
        </div>
        <div class="badge">ACE Academic Assessment Report</div>
      </div>
      ${body}
    </section>
  `;
}
function openAnswerModalContent(contentHtml) {
  const oldModal = document.querySelector(".answer-modal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.className = "answer-modal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.zIndex = "9999";

  modal.innerHTML = `
    <div class="answer-overlay" onclick="closeAnswerModal()"></div>
    <div class="answer-box">${contentHtml}</div>
  `;

  document.body.appendChild(modal);

  const overlay = modal.querySelector(".answer-overlay");
  const box = modal.querySelector(".answer-box");

  if (overlay) {
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(15,23,42,0.42)";
    overlay.style.backdropFilter = "blur(6px)";
  }

  if (box) {
    box.style.position = "relative";
    box.style.width = "980px";
    box.style.maxWidth = "92%";
    box.style.maxHeight = "86vh";
    box.style.overflowY = "auto";
    box.style.margin = "36px auto";
    box.style.background = "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)";
    box.style.borderRadius = "28px";
    box.style.padding = "26px";
    box.style.boxShadow = "0 24px 80px rgba(15,23,42,0.22)";
    box.style.zIndex = "2";
    box.style.border = "1px solid #dbe7f3";
    box.style.boxSizing = "border-box";
  }

  const wrap = modal.querySelector(".answer-sheet-wrap");
  if (wrap) {
    wrap.style.display = "grid";
    wrap.style.gap = "18px";
  }

  const head = modal.querySelector(".answer-head");
  if (head) {
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "flex-start";
    head.style.gap = "16px";
    head.style.marginBottom = "6px";
    head.style.paddingBottom = "18px";
    head.style.borderBottom = "1px solid #e5edf6";
  }

  const label = modal.querySelector(".answer-label");
  if (label) {
    label.style.fontSize = "12px";
    label.style.fontWeight = "800";
    label.style.letterSpacing = ".12em";
    label.style.color = "#7b8ba1";
    label.style.marginBottom = "6px";
  }

  const title = modal.querySelector(".answer-head h2");
  if (title) {
    title.style.margin = "0 0 6px";
    title.style.fontSize = "32px";
    title.style.fontWeight = "900";
    title.style.color = "#1f5d96";
    title.style.lineHeight = "1.1";
  }

  const desc = modal.querySelector(".answer-head p");
  if (desc) {
    desc.style.margin = "0";
    desc.style.fontSize = "15px";
    desc.style.color = "#64748b";
    desc.style.fontWeight = "600";
  }

  const closeBtn = modal.querySelector(".answer-close-btn");
  if (closeBtn) {
    closeBtn.style.minWidth = "84px";
    closeBtn.style.height = "44px";
    closeBtn.style.borderRadius = "14px";
    closeBtn.style.background = "#1f5d96";
    closeBtn.style.color = "#fff";
    closeBtn.style.fontSize = "15px";
    closeBtn.style.fontWeight = "800";
    closeBtn.style.border = "none";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.boxShadow = "0 10px 24px rgba(31,93,150,0.24)";
  }

  const sectionTitles = modal.querySelectorAll(".answer-section-title");
  sectionTitles.forEach(el => {
    el.style.fontSize = "18px";
    el.style.fontWeight = "900";
    el.style.color = "#1e3a5f";
    el.style.margin = "8px 0 2px";
  });

  const groupGrid = modal.querySelector(".answer-group-grid");
  if (groupGrid) {
    groupGrid.style.display = "grid";
    groupGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    groupGrid.style.gap = "16px";
  }

  const cards = modal.querySelectorAll(".answer-group-card");
  cards.forEach(card => {
    card.style.border = "1px solid #dbe7f3";
    card.style.borderRadius = "20px";
    card.style.padding = "18px";
    card.style.background = "#ffffff";
    card.style.boxShadow = "0 10px 24px rgba(15,23,42,0.05)";
  });

  const cardTitles = modal.querySelectorAll(".answer-group-title");
  cardTitles.forEach(el => {
    el.style.fontSize = "16px";
    el.style.fontWeight = "900";
    el.style.color = "#1f5d96";
    el.style.marginBottom = "12px";
  });

  const rows = modal.querySelectorAll(".answer-chip-grid");
  rows.forEach(el => {
    el.style.display = "grid";
    el.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr))";
    el.style.gap = "10px";
  });

  const chips = modal.querySelectorAll(".answer-chip");
  chips.forEach(chip => {
    chip.style.borderRadius = "14px";
    chip.style.background = "#f4f8fc";
    chip.style.padding = "12px 8px";
    chip.style.textAlign = "center";
    chip.style.border = "1px solid #e5edf6";
  });

  const nos = modal.querySelectorAll(".answer-chip-no");
  nos.forEach(el => {
    el.style.fontSize = "12px";
    el.style.color = "#7b8ba1";
    el.style.fontWeight = "700";
    el.style.marginBottom = "4px";
  });

  const vals = modal.querySelectorAll(".answer-chip-val");
  vals.forEach(el => {
    el.style.fontSize = "20px";
    el.style.fontWeight = "900";
    el.style.color = "#0f172a";
  });

  const handleResize = () => {
    const groupGrid = modal.querySelector(".answer-group-grid");
    if (!groupGrid) return;
    if (window.innerWidth < 760) {
      groupGrid.style.gridTemplateColumns = "1fr";
    } else {
      groupGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    }
  };

  handleResize();
  window.addEventListener("resize", handleResize, { passive: true });

  modal._cleanupResize = handleResize;
}
function moveToNextFocusable(current) {
  const container = current.closest('.wrap, #reportArea, .page, .answer-list, .report-page') || document;
  const selectors = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';
  const nodes = Array.from(container.querySelectorAll(selectors)).filter(el => el.offsetParent !== null);
  const idx = nodes.indexOf(current);
  if (idx >= 0 && idx < nodes.length - 1) nodes[idx + 1].focus();
}

document.addEventListener('keydown', function (e) {
  const t = e.target;
  if (e.key !== 'Enter' || e.shiftKey || !t) return;
  if (!(t.matches('input, select, textarea'))) return;
  if (t.tagName === 'TEXTAREA') return;

  const id = t.id || '';

  if (id.startsWith('q-')) {
    e.preventDefault();
    const n = Number(id.split('-')[1]);
    const last = document.querySelectorAll('[id^="q-"]').length;
    if (n < last) document.getElementById(`q-${n + 1}`)?.focus();
    else if (document.getElementById('vocab-1')) document.getElementById('vocab-1')?.focus();
    return;
  }

  if (id.startsWith('vocab-')) {
    e.preventDefault();
    const n = Number(id.split('-')[1]);
    const last = document.querySelectorAll('[id^="vocab-"]').length;
    if (n < last) document.getElementById(`vocab-${n + 1}`)?.focus();
    else if (document.getElementById('trans-score-1')) document.getElementById('trans-score-1')?.focus();
    return;
  }

  if (id.startsWith('trans-score-')) {
    e.preventDefault();
    const n = Number(id.split('-')[2]);
    const last = document.querySelectorAll('[id^="trans-score-"]').length;
    if (n < last) document.getElementById(`trans-score-${n + 1}`)?.focus();
    return;
  }

  if (id.startsWith('g-')) {
    e.preventDefault();
    const n = Number(id.split('-')[1]);
    if (n < 20) document.getElementById(`g-${n + 1}`)?.focus();
    else document.getElementById('subj-21-a')?.focus();
    return;
  }

  if (id === 'subj-21-a') {
    e.preventDefault();
    document.getElementById('subj-22-a')?.focus();
    return;
  }

  const m = id.match(/^subj-(\d+)-([ab])$/);
  if (m) {
    e.preventDefault();
    const qNo = Number(m[1]);
    const part = m[2];
    if (part === 'a') document.getElementById(`subj-${qNo}-b`)?.focus();
    else if (qNo < 25) document.getElementById(`subj-${qNo + 1}-a`)?.focus();
    return;
  }

  e.preventDefault();
  moveToNextFocusable(t);
});

/* 입력 즉시 정오답 색칠 (DT/AT 채점과 동일) — 정답=초록 / 오답=빨강 / 빈칸=색 없음
   correctVal: 정답값(객관식은 data-ans, VOCA는 "1"). 없으면 색 안 칠함 */
/* CSS에 !important 규칙이 많아 인라인도 important로 강제 지정해야 색이 먹음 */
function paintCell(input, state) {   // state: "ok" | "no" | ""(비움)
  const s = input.style;
  if (!state) { s.removeProperty("background-color"); s.removeProperty("border-color"); s.removeProperty("color"); return; }
  const ok = state === "ok";
  s.setProperty("background-color", ok ? "#e4f6ee" : "#fdecec", "important");
  s.setProperty("border-color",     ok ? "#22a06b" : "#e5484d", "important");
  s.setProperty("color",            ok ? "#1a7a4f" : "#c2373b", "important");
}
function markAns(input, correctVal) {
  const v = (input.value || "").trim();
  if (v === "" || correctVal == null || correctVal === "") return paintCell(input, "");
  paintCell(input, String(v) === String(correctVal) ? "ok" : "no");
}
/* 저장된(미리 채워진) 답안도 열 때 색칠 */
function markAllAns() {
  document.querySelectorAll('input[id^="q-"]').forEach(el => markAns(el, el.dataset ? el.dataset.ans : null));
  document.querySelectorAll('input[id^="vocab-"]').forEach(el => markAns(el, "1"));
}
function onlyChoice(input) {
  input.value = input.value.replace(/[^1-5]/g, "");
  markAns(input, input.dataset ? input.dataset.ans : null);
}
function onlyBinary(input) {
  input.value = input.value.replace(/[^10○oOxX]/g, "");
  if (input.value === "○" || /^[oO]$/.test(input.value)) input.value = "1";
  if (/^[xX]$/.test(input.value)) input.value = "0";
  if (input.value.length > 1) input.value = input.value.slice(-1);
  markAns(input, "1");   // VOCA: 1=정답(초록) / 0=오답(빨강) / 빈칸=색없음(채점은 0점)
}
function _focusSel(id) { const el = document.getElementById(id); if (el) { el.focus(); if (el.select) el.select(); } }
/* 답안칸이 여러 열(그리드)로 배치되므로, 같은 줄에 몇 칸인지 계산해서 ↑↓가 '줄 단위'로 움직이게 함 */
function _gridCols(el) {
  try {
    const row = el.closest(".answer-row");
    const list = row && row.parentElement;
    if (!list) return 1;
    const rows = [...list.children].filter(c => c.offsetParent !== null || c.offsetTop != null);
    if (!rows.length) return 1;
    const top0 = rows[0].offsetTop;
    let c = 0;
    for (const r of rows) { if (r.offsetTop === top0) c++; else break; }
    return Math.max(1, c);
  } catch (_) { return 1; }
}
function moveLinear(e, prefix, idx, last, fallbackId) {
  // 상하좌우 + 엔터 (←→ = 한 칸, ↑↓ = 한 줄(열 개수만큼), Enter = 다음 칸)
  const k = e.key;
  if (k === "Enter" || k === "ArrowRight") {
    e.preventDefault();
    if (idx < last) _focusSel(`${prefix}-${idx + 1}`);
    else if (fallbackId) _focusSel(fallbackId);
  } else if (k === "ArrowLeft") {
    e.preventDefault();
    if (idx > 1) _focusSel(`${prefix}-${idx - 1}`);
  } else if (k === "ArrowDown") {
    e.preventDefault();
    const cols = _gridCols(e.target);
    const t = idx + cols;
    if (t <= last) _focusSel(`${prefix}-${t}`);
    else if (fallbackId) _focusSel(fallbackId);
  } else if (k === "ArrowUp") {
    e.preventDefault();
    const cols = _gridCols(e.target);
    const t = idx - cols;
    if (t >= 1) _focusSel(`${prefix}-${t}`);
  }
}
function focusNext(e, nextId) {
  if (e.key === "Enter" || e.key === "ArrowDown") {
    e.preventDefault();
    document.getElementById(nextId)?.focus();
  }
}
function moveScoreSelect(e, idx, last) {
  if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    if (idx < last) _focusSel(`trans-score-${idx + 1}`);
  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    if (idx > 1) _focusSel(`trans-score-${idx - 1}`);
    else _focusSel('vocab-40');
  }
}
function moveSubjective(e, qNo, part) {
  if (e.key === "Enter" || e.key === "ArrowDown") {
    e.preventDefault();
    if (qNo === 21) return document.getElementById("subj-22-a")?.focus();
    if (part === "a") return document.getElementById(`subj-${qNo}-b`)?.focus();
    if (qNo < 25) return document.getElementById(`subj-${qNo + 1}-a`)?.focus();
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (part === "b") return document.getElementById(`subj-${qNo}-a`)?.focus();
    if (qNo === 22) return document.getElementById("subj-21-a")?.focus();
    if (qNo > 22) return document.getElementById(`subj-${qNo - 1}-b`)?.focus();
  }
}

function getTermInfo(testDate) {
  const d = new Date(testDate);
  const y = d.getFullYear() || new Date().getFullYear();
  const m = (d.getMonth() + 1) || 1;
  if (m === 12 || m <= 2) return { year: y, term: '1st' };
  if (m >= 3 && m <= 5) return { year: y, term: '2nd' };
  if (m >= 6 && m <= 8) return { year: y, term: '3rd' };
  return { year: y, term: '4th' };
}
function getRoadmapStamp(testDate) {
  const info = getTermInfo(testDate);
  return `${info.year}  ${info.term}`;
}
function getRoadmapGradePrefix(grade) {
  const map = {
    "초등6": "초6",
    "중등1": "중1",
    "중등2": "중2",
    "중등3": "중3"
  };
  return map[grade] || "";
}
function getRoadmapTimelineLabels(grade, currentLevel, testDate) {
  if (typeof LEVEL_STEPS === "undefined" || typeof ROADMAP_TABLE === "undefined") return [];
  const steps = LEVEL_STEPS[grade] || [];
  if (!steps.length) return [];
  const prefix = getRoadmapGradePrefix(grade);
  const term = getTermInfo(testDate).term;
  const effectiveLevel = steps.includes(currentLevel) ? currentLevel : steps[0];
  const rowKey = `${prefix}${effectiveLevel}${term}`;
  const row = ROADMAP_TABLE[rowKey] || {};
  return steps.map(step => {
    if (step === 'HM1' || step === 'HM2' || step === 'HM3') return '수능500';
    return row[step] || '';
  });
}
function buildRoadmapBars(grade, currentLevel = "", testDate = todayIso(), title = "") {
  if (typeof LEVEL_STEPS === "undefined") return "";

  const roadmapGrade = getReportGradeForExam(grade, title);
  const steps = LEVEL_STEPS[roadmapGrade] || [];
  if (!steps.length) return "";

  const activeIndex = steps.indexOf(currentLevel);
  const labels = getRoadmapTimelineLabels(roadmapGrade, currentLevel, testDate);

  return `
    <div class="roadmap-bars">
      ${steps.map((step, idx) => {
        const h = 34 + idx * 24;
        return `<div class="roadmap-bar-wrap"><div class="roadmap-bar ${activeIndex >= 0 && idx <= activeIndex ? 'active' : ''}" style="height:${h}px;"><span>${step}</span></div><div class="roadmap-label">${labels[idx] || ''}</div></div>`;
      }).join('')}
    </div>
  `;
}
function buildRoadmap(grade) {
  if (typeof LEVEL_STEPS === "undefined") return "";
  const steps = LEVEL_STEPS[grade] || [];
  return `<div class="roadmap">${steps.map(s => `<div class="step">${s}</div>`).join('')}</div>`;
}

function renderHome() {
  app.classList.remove("bulk-app");

  app.style.removeProperty("width");
  app.style.removeProperty("max-width");
  app.style.removeProperty("margin");

app.innerHTML = `
 <div style="width:100%; padding:30px 0 36px;margin:0 0 30px;">
  <div style="display:flex; justify-content:center; align-items:center;">
    <img src="./jls-level-test-logo.png?v=99" alt="JLS LEVEL TEST" style="width:420px; max-width:90%; height:auto; display:block;">
  </div>
</div>

  <div class="hero-card" style="max-width:640px; margin:0 auto;">
      <div class="grid-2">
        <div class="form-group">
          <label>회원코드</label>
          <input id="memberCode" type="text" placeholder="">
        </div>
        <div class="form-group">
          <label>시험 본 날짜</label>
          <input id="testDate" type="date" value="${todayIso()}">
        </div>
      </div>

      <div class="form-group">
        <label>학생명</label>
        <input id="studentName" type="text">
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>학교</label>
          <input id="schoolName" type="text">
        </div>

        <div class="form-group">
          <label>학년</label>
          <select id="grade" onchange="syncExamOptions(); updatePaperButtons();">
            <option value="">선택</option>
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

      <div class="form-group">
        <label>시험지명</label>
        <select id="examName" onchange="updatePaperButtons();">
          <option value="">학년 선택 후 표시</option>
        </select>

<div class="paper-actions" style="display:flex; gap:12px; margin-top:12px; flex-wrap:wrap; justify-content:center;">
  <button id="downloadQuestionBtn" type="button" class="paper-btn blue" onclick="openSelectedPaper()">시험지 PDF 다운로드</button>
  <button id="viewAnswerBtn" type="button" class="paper-btn pink" onclick="openSelectedAnswer()">답지 보기</button>
  <button id="bulkInputBtn" type="button" class="paper-btn yellow" onclick="renderChessBulkMode()">단체 입력</button>
</div>

      <div class="top-bar" style="margin-top:18px; justify-content:center;">
  <button id="startBtn" type="button" class="next-btn" onclick="goNext(); return false;">다음</button>
</div>
  `;

  syncExamOptions();
}
function getExamOptionsByGrade(grade) {
  const g = String(grade || "").replace(/\s/g, "");

  if (g === "초등1" || g === "초등2" || g === "초등3" || g === "초등4" || g === "초등5") {
    return [
      { value: "D1", label: "D1" },
      { value: "D2", label: "D2" },
      { value: "D3", label: "D3" },
      { value: "D4", label: "D4" },
      { value: "L1", label: "L1" },
      { value: "L2", label: "L2" },
      { value: "L3", label: "L3" },
      { value: "L4", label: "L4" }
    ];
  }

  if (g === "초등6") {
    return [
      { value: "E6", label: "E6" },
      { value: "Voca & Translation", label: "Voca & Translation" }
    ];
  }

  if (g === "중등1") {
    return [
      { value: "M1(일반형)", label: "M1(일반형)" },
      { value: "M1(수능형)", label: "M1(수능형)" },
      { value: "Voca & Translation", label: "Voca & Translation" }
    ];
  }

  if (g === "중등2") {
    return [
      { value: "M2(일반형)", label: "M2(일반형)" },
      { value: "M2(수능형)", label: "M2(수능형)" }
    ];
  }

  if (g === "중등3") {
    return [
      { value: "M3(고1형)", label: "M3(고1형)" },
      { value: "M3(고2형)", label: "M3(고2형)" }
    ];
  }

  return [];
}
function syncExamOptions() {
  const grade = document.getElementById("grade")?.value || "";
  const examName = document.getElementById("examName");
  if (!examName) return;

  const list = getExamOptionsByGrade(grade);

  examName.innerHTML = list.length
    ? list.map(item => `<option value="${item.value}">${item.label}</option>`).join("")
    : '<option value="">학년 선택 후 표시</option>';
}
function getStudent() {
  const memberCode = document.getElementById("memberCode")?.value.trim();
  const name = document.getElementById("studentName")?.value.trim();
  const school = document.getElementById("schoolName")?.value.trim();
  const grade = document.getElementById("grade")?.value;
  const testDate = document.getElementById("testDate")?.value || todayIso();

  let examName = document.getElementById("examName")?.value || "";
  if (!examName && grade === "초등6") examName = "E6";
  if (!examName && grade === "중등1") examName = "M1(일반형)";
  if (!examName && grade === "중등2") examName = "M2(일반형)";
  if (!examName && grade === "중등3") examName = "M3(고1형)";

  return { memberCode, name, school, grade, testDate, examName };
}

function goNext() {
  const { memberCode, name, school, grade, testDate, examName } = getStudent();

  if (!name || !school || !grade || !testDate || !examName) {
    alert("이름/학교/학년/시험 본 날짜/시험지명을 입력하세요.");
    return;
  }
  const chessTests = ["D1", "D2", "D3", "D4", "L1", "L2", "L3", "L4"];

  if (chessTests.includes(examName)) {
    if (typeof renderChessInput !== "function") {
      alert("chess.js가 연결되지 않았습니다.");
      return;
    }

    renderChessInput({
      memberCode,
      name,
      school,
      grade,
      testDate,
      examName
    });
    return;
  }
  if ((grade === "초등6" || grade === "중등1") && examName === "Voca & Translation") {
    renderVTExamPage(memberCode, name, school, grade, testDate, examName);
    return;
  }

  if (grade === "초등6") {
    renderExamPage(memberCode, name, school, grade, testDate, examName, "E6");
    return;
  }

  if (grade === "중등1") {
    renderExamPage(memberCode, name, school, grade, testDate, examName, examName === "M1(수능형)" ? "M1(수능형)" : "M1,M2(일반형)");
    return;
  }

  if (grade === "중등2") {
    renderExamPage(memberCode, name, school, grade, testDate, examName, examName === "M2(수능형)" ? "M2(수능형)" : "M1,M2(일반형)");
    return;
  }

  if (grade === "중등3") {
    renderExamPage(memberCode, name, school, grade, testDate, examName, examName);
  }
}

function goBack() {
  renderHome();
}

function renderExamSelect(memberCode, name, school, grade, testDate, list) {
  app.innerHTML = `
    <h1>시험지 선택</h1>
    <p class="muted" style="margin-bottom:18px;"><strong>${esc(name)}</strong> · ${esc(school)} · ${esc(grade)}</p>
    <div class="select-box">
      ${list.map(item => `
        <div class="select-btn" onclick="renderExamPage('${escapeJs(memberCode)}','${escapeJs(name)}','${escapeJs(school)}','${escapeJs(grade)}','${escapeJs(testDate)}','${escapeJs(item.title)}','${escapeJs(item.key)}')">
          ${esc(item.title)}
        </div>
      `).join('')}
    </div>
    <div class="top-bar" style="margin-top:24px;"><button class="secondary" onclick="goBack()">처음으로</button></div>
  `;
}
function getChessInterviewCode(title, examKey) {
  const raw = `${title} ${examKey}`.toUpperCase();

  if (raw.includes("D1")) return "D1";
  if (raw.includes("D2")) return "D2";
  if (raw.includes("D3")) return "D3";
  if (raw.includes("D4")) return "D4";
  if (raw.includes("L1")) return "L1";
  if (raw.includes("L2")) return "L2";
  if (raw.includes("L3")) return "L3";
  if (raw.includes("L4")) return "L4";

  return "";
}

function collectChessInterviewResult(title, examKey) {
  const code = getChessInterviewCode(title, examKey);
  const config = CHESS_INTERVIEW_MAP[code];
  if (!config) return { speaking: {}, writing: {} };

  const result = {
    speaking: {},
    writing: {}
  };

  config.speaking.forEach(item => {
    result.speaking[item.key] = document.getElementById(`speaking-${item.key}`)?.value || "A";
  });

  if (config.writing && config.writing.length > 0) {
    config.writing.forEach(item => {
      result.writing[item.key] = document.getElementById(`writing-${item.key}`)?.value || "A";
    });
  }

  return result;
}

function renderChessInterviewSection(title, examKey, savedInterview = null) {
  const code = getChessInterviewCode(title, examKey);
console.log("인터뷰코드:", code, "title:", title, "examKey:", examKey);
  const config = CHESS_INTERVIEW_MAP[code];
  if (!config) return "";

  function getSavedValue(type, key) {
    if (!savedInterview) return "A";
    if (!savedInterview[type]) return "A";
    return savedInterview[type][key] || "A";
  }

  function renderSelectOptions(selected) {
    return ["A", "B", "C", "D"]
      .map(v => `<option value="${v}" ${selected === v ? "selected" : ""}>${v}</option>`)
      .join("");
  }

  function renderCard(item, type) {
    const selected = getSavedValue(type, item.key);
    return `
      <div class="interview-card">
        <div class="interview-code">${item.key}</div>
        <div class="interview-text">
          <div class="interview-title">${item.label}</div>
          <div class="interview-desc">${item.desc}</div>
        </div>
        <select id="${type}-${item.key}" class="interview-select">
          ${renderSelectOptions(selected)}
        </select>
      </div>
    `;
  }

  let html = `
    <div class="interview-wrap">
      <div class="interview-section-title">Speaking / Reading 평가</div>
      <div class="interview-grid">
        ${config.speaking.map(item => renderCard(item, "speaking")).join("")}
      </div>
  `;

  if (config.writing && config.writing.length > 0) {
    html += `
      <div class="interview-section-title" style="margin-top:18px;">Writing 평가</div>
      <div class="interview-grid interview-grid-writing">
        ${config.writing.map(item => renderCard(item, "writing")).join("")}
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

function renderExamPage(memberCode, name, school, grade, testDate, title, examKey, answerMap = null, vtState = null) {
  const examData = EXAMS[examKey];
  let rows = "";
  examData.forEach((q) => {
    const preset = answerMap && answerMap[q.no] ? answerMap[q.no] : "";
    rows += `
      <div class="answer-row simple" id="row-${q.no}">
        <div class="question-no">${q.no}번</div>
        <input id="q-${q.no}" class="answer-input" maxlength="1" inputmode="numeric"
          value="${esc(preset)}" data-ans="${esc(q.ans == null ? '' : q.ans)}"
          oninput="onlyChoice(this)"
          onkeydown="moveLinear(event,'q',${q.no},${examData.length},'${grade === '초등6' || grade === '중등1' ? 'vocab-1' : ''}')">
        <div class="answer-meta">${q.area} / ${q.score}점</div>
      </div>
    `;
  });

  let integratedVT = "";

if ((grade === "초등6" || grade === "중등1") &&
    typeof VOCAB_ITEMS !== "undefined" &&
    typeof TRANS_ITEMS !== "undefined") {

  const vocabRows = VOCAB_ITEMS.map(item => {
    const preset = vtState?.vocabAnswers?.[item.no] || "";
    return `
      <div class="answer-row simple vt-vocab-row">
        <div class="question-no">${item.no}번</div>
        <div class="answer-meta left">${esc(item.word)}</div>
        <input id="vocab-${item.no}" class="answer-input" maxlength="1" inputmode="numeric"
          value="${esc(preset)}"
          oninput="onlyBinary(this)"
          onkeydown="moveLinear(event,'vocab',${item.no},${VOCAB_ITEMS.length},'trans-score-1')">
      </div>
    `;
  }).join('');

const transRows = TRANS_ITEMS.map((item, idx) => {
  const preset = vtState?.transScores?.[item.no] || "";
  const nextTarget =
    idx === TRANS_ITEMS.length - 1
      ? ''
      : `trans-score-${TRANS_ITEMS[idx + 1].no}`;

  return `
    <div style="
      border:1px solid #dbe7f3;
      border-radius:18px;
      background:#fff;
      padding:14px 14px 16px;
      box-shadow:0 6px 16px rgba(15,23,42,0.04);
    ">
      <div style="
        font-size:14px;
        font-weight:900;
        color:#1f5d96;
        margin-bottom:10px;
      ">
        ${item.no}번 (${esc(item.grade || "")}) · ${item.max || 0}점 만점
      </div>

      <div style="
        border:1px dashed #c9d7e6;
        border-radius:14px;
        background:#f8fbff;
        padding:12px 14px;
        color:#334155;
        font-size:14px;
        line-height:1.55;
        margin-bottom:12px;
        white-space:normal;
        word-break:keep-all;
        overflow-wrap:anywhere;
      ">
        ${esc(item.korean || item.text || item.sentence || "해석")}
      </div>

      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        flex-wrap:wrap;
      ">
        <input
          id="trans-score-${item.no}"
          class="answer-input"
          maxlength="2"
          inputmode="numeric"
          style="
            width:120px;
            min-width:120px;
            text-align:center;
          "
          value="${esc(preset)}"
          oninput="onlyNumber(this)"
          onkeydown="moveLinear(event,'trans-score',${item.no},${TRANS_ITEMS.length},'${nextTarget}')"
        >
        <span style="
          font-size:14px;
          color:#64748b;
          font-weight:700;
        ">0 ~ ${item.max || 0}점 입력</span>
      </div>
    </div>
  `;
}).join('');

  integratedVT = `
    <div class="integrated-section">
      <div class="chess-section">
        <h3>Vocabulary Test</h3>
        <div class="answer-list">
          ${vocabRows}
        </div>
      </div>

   <div class="chess-section">
  <h3>Translation Test</h3>
  <div style="display:grid; gap:12px;">
    ${transRows}
  </div>
</div>
  `;
}

app.innerHTML = `
  <h1>${esc(title)}</h1>
  <p class="muted" style="margin-bottom:12px;"><strong>${esc(name)}</strong> · ${esc(school)} · ${esc(grade)} · ${esc(formatDate(testDate))} · ${esc(title)}</p>
  <div class="top-bar no-print sticky-actions">
    <button class="secondary" onclick="goBack()">처음으로</button>
    <button onclick="checkExam('${escapeJs(memberCode)}','${escapeJs(name)}','${escapeJs(school)}','${escapeJs(grade)}','${escapeJs(testDate)}','${escapeJs(title)}','${escapeJs(examKey)}')">채점하기</button>
  </div>
  <div class="answer-list">${rows}</div>
  ${integratedVT}
 ${renderChessInterviewSection(title, examKey, answerMap?.interview || null)}
`;

  LAST_EXAM_SESSION = {
    memberCode,
    name,
    school,
    grade,
    testDate,
    title,
    examKey,
    answerMap: answerMap || {},
    vtState: vtState || null
  };

  document.getElementById("q-1")?.focus();
  markAllAns();
}

function restoreExamInput() {
  if (!LAST_EXAM_SESSION) return;

  renderExamPage(
    LAST_EXAM_SESSION.memberCode,
    LAST_EXAM_SESSION.name,
    LAST_EXAM_SESSION.school,
    LAST_EXAM_SESSION.grade,
    LAST_EXAM_SESSION.testDate,
    LAST_EXAM_SESSION.title,
    LAST_EXAM_SESSION.examKey,
    LAST_EXAM_SESSION.answerMap || null,
    LAST_EXAM_SESSION.vtState || null
  );
}
function evaluateExam(examData) {
  const results = examData.map(q => {
    const user = (document.getElementById(`q-${q.no}`)?.value || "").trim();
    const correct = user === q.ans;
    return { ...q, user, correct, earned: correct ? q.score : 0 };
  });

  const total = results.reduce((a, b) => a + b.earned, 0);
  const areaStats = Object.fromEntries(["LC", "RC"].map(area => {
    const items = results.filter(q => q.area === area);
    const possible = items.reduce((a, b) => a + b.score, 0);
    const earned = items.reduce((a, b) => a + b.earned, 0);
    return [area, {
      earned,
      possible,
      rate: percent(earned, possible),
      correct: items.filter(i => i.correct).map(i => i.no),
      wrong: items.filter(i => !i.correct).map(i => i.no)
    }];
  }));

  const competencies = aggregateBy(results, "competency");
  const types = aggregateBy(results, "type");
  return { results, total, areaStats, competencies, types };
}

function aggregateBy(results, key) {
  const map = {};
  results.forEach(q => {
    if (!map[q[key]]) map[q[key]] = { label: q[key], earned: 0, possible: 0, count: 0 };
    map[q[key]].earned += q.earned;
    map[q[key]].possible += q.score;
    map[q[key]].count += 1;
  });
  return Object.values(map)
    .map(v => ({ ...v, rate: percent(v.earned, v.possible) }))
    .sort((a, b) => b.possible - a.possible);
}

function getTopFive(data) {
  return data.slice(0, 5);
}

function donutSvg(rate, label, size = 118, stroke = 16, color = "#13a6ee") {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (rate / 100) * c;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${dash} ${c-dash}" transform="rotate(-90 ${size/2} ${size/2})"/>
      <circle cx="${size/2}" cy="${size/2}" r="${Math.max(r-14, 8)}" fill="#fff"/>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="18" font-weight="800" fill="#334155">${rate}%</text>
    </svg>
  `;
}

function radarSvg(items, title) {
  const size = 176, center = 88, radius = 50;
  const levels = [20, 40, 60, 80, 100];
  const angleStep = (Math.PI * 2) / items.length;

  function pt(rate, i, scale = 1) {
    const ang = -Math.PI / 2 + angleStep * i;
    const rr = radius * scale * (rate / 100);
    return [center + Math.cos(ang) * rr, center + Math.sin(ang) * rr];
  }

  const polys = levels.map(l => items.map((_, i) => pt(l, i, 1)).map(p => p.join(",")).join(" "));
  const dataPts = items.map((it, i) => pt(it.rate, i)).map(p => p.join(",")).join(" ");
  const axes = items.map((it, i) => {
    const p = pt(100, i, 1.05);
    return `<line x1="${center}" y1="${center}" x2="${p[0]}" y2="${p[1]}" stroke="#cbd5e1" stroke-width="1"/>`;
  }).join("");

  const labels = items.map((it, i) => {
    const p = pt(100, i, 1.22);
    return `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#475569">${it.label.replace(/영역/g,'')}</text>
            <text x="${p[0]}" y="${p[1]+16}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="800" fill="#0284c7">${it.rate}%</text>`;
  }).join("");

  return `
    <div class="chart-card">
      <div class="chart-title">${title}</div>
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${polys.map((poly, idx) => `<polygon points="${poly}" fill="none" stroke="${idx===levels.length-1 ? '#94a3b8':'#dbe4ee'}" stroke-width="${idx===levels.length-1 ? 2 : 1}" stroke-dasharray="${idx===levels.length-1 ? '4 4' : '0'}"/>`).join('')}
        ${axes}
        <polygon points="${dataPts}" fill="rgba(19,166,238,.55)" stroke="#13a6ee" stroke-width="2"/>
        ${items.map((it, i) => { const p = pt(it.rate, i); return `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#0ea5e9"/>`; }).join('')}
        ${labels}
      </svg>
    </div>
  `;
}

function normalizeVocabAnswer(value) {
  return normalizeKor(value);
}

function evaluateVTExam() {
  if (typeof VOCAB_ITEMS === "undefined" || typeof TRANS_ITEMS === "undefined") return null;

  const vocabGroupsOrder = ["초3~4", "초5~6", "중1", "중2", "중3", "고1", "고2", "고3"];

  const vocabGroupComments = {
    "초3~4": {
      A: "초3~4학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계로 난이도를 올려 학습을 시작하세요.",
      B: "초3~4학년 수준의 어휘를 대체로 이해하고 있습니다. 반복 학습으로 정확도를 더 높여 주세요.",
      C: "초3~4학년 수준의 기본 어휘부터 다시 확인해 보세요. 쉬운 단어부터 차근차근 복습이 필요합니다."
    },
    "초5~6": {
      A: "초5~6학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계로 난이도를 올려 학습을 시작하세요.",
      B: "초5~6학년 수준의 어휘를 대체로 이해하고 있습니다. 반복 학습으로 정확도를 더 높여 주세요.",
      C: "초5~6학년 수준의 핵심 어휘를 다시 점검해 보세요. 뜻을 정확히 연결하는 연습이 필요합니다."
    },
    "중1": {
      A: "중1학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계로 난이도를 올려 학습을 시작하세요.",
      B: "중1학년 수준의 어휘를 다소 이해하고 뜻을 쓸 수 있습니다. 보다 철저한 학습을 통해 현재의 어휘 이해 수준을 높여 나가세요.",
      C: "중1학년 수준의 어휘 학습을 시작해보세요. 예문과 함께 학습하는 것을 추천합니다."
    },
    "중2": {
      A: "중2학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계로 난이도를 올려 학습을 시작하세요.",
      B: "중2학년 수준의 어휘를 다소 이해하고 뜻을 쓸 수 있습니다. 보다 철저한 학습을 통해 현재의 어휘 이해 수준을 높여 나가세요.",
      C: "중2학년 수준의 어휘 학습을 시작해보세요. 예문과 함께 학습하는 것을 추천합니다."
    },
    "중3": {
      A: "중3학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계로 난이도를 올려 학습을 시작하세요.",
      B: "중3학년 수준의 어휘를 다소 이해하고 뜻을 쓸 수 있습니다. 보다 철저한 학습을 통해 현재의 어휘 이해 수준을 높여 나가세요.",
      C: "중3학년 수준의 어휘 학습을 시작해보세요. 예문과 함께 학습하는 것을 추천합니다."
    },
    "고1": {
      A: "고1학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계 학습도 충분히 가능합니다.",
      B: "고1학년 수준의 어휘를 다소 이해하고 뜻을 쓸 수 있습니다. 보다 철저한 학습을 통해 현재의 어휘 이해 수준을 높여 나가세요.",
      C: "고1학년 수준의 어휘 학습을 시작해보세요. 예문과 함께 학습하는 것을 추천합니다."
    },
    "고2": {
      A: "고2학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계 학습도 충분히 가능합니다.",
      B: "고2학년 수준의 어휘를 다소 이해하고 뜻을 쓸 수 있습니다. 보다 철저한 학습을 통해 현재의 어휘 이해 수준을 높여 나가세요.",
      C: "고2학년 수준의 어휘 학습을 시작해보세요. 예문과 함께 학습하는 것을 추천합니다."
    },
    "고3": {
      A: "고3학년 수준의 어휘를 이해하고 정확한 뜻을 쓸 수 있습니다. 다음 단계 학습도 충분히 가능합니다.",
      B: "고3학년 수준의 어휘를 다소 이해하고 뜻을 쓸 수 있습니다. 보다 철저한 학습을 통해 현재의 어휘 이해 수준을 높여 나가세요.",
      C: "고3학년 수준의 어휘 학습을 시작해보세요. 예문과 함께 학습하는 것을 추천합니다."
    }
  };

  function getVocabLetter(rate) {
    if (rate >= 80) return "A";
    if (rate >= 40) return "B";
    return "C";
  }

  const vocabResults = VOCAB_ITEMS.map(item => {
    const raw = (document.getElementById(`vocab-${item.no}`)?.value || "").trim();
    const correct = raw === "1";
    return {
      ...item,
      user: raw,
      correct,
      earned: correct ? 1 : 0,
      possible: 1
    };
  });

  const vocabGroups = vocabGroupsOrder.map(label => {
    const items = vocabResults.filter(item => item.gradeGroup === label);
    const earned = items.reduce((sum, item) => sum + item.earned, 0);
    const possible = items.reduce((sum, item) => sum + item.possible, 0);
    const rate = percent(earned, possible);
    const letter = getVocabLetter(rate);
    const comment = vocabGroupComments[label]?.[letter] || "";
    return { label, earned, possible, rate, letter, comment };
  });

  const vocabTotal = {
    earned: vocabGroups.reduce((sum, g) => sum + g.earned, 0),
    possible: vocabGroups.reduce((sum, g) => sum + g.possible, 0)
  };
  vocabTotal.rate = percent(vocabTotal.earned, vocabTotal.possible);

  const transResults = TRANS_ITEMS.map(item => {
    const raw = (document.getElementById(`trans-score-${item.no}`)?.value || "").trim();

    if (raw === "") {
      return { ...item, earned: 0, rate: percent(0, item.max) };
    }

    const score = Number(raw);

    if (Number.isNaN(score)) {
      throw new Error(`${item.no}번 해석 점수는 숫자로 입력해야 합니다.`);
    }

    if (score < 0 || score > item.max) {
      throw new Error(`${item.no}번 해석 점수는 0~${item.max}점 사이로 입력해야 합니다.`);
    }

    return { ...item, earned: score, rate: percent(score, item.max) };
  });

  const transTotal    = transResults.reduce((sum, item) => sum + item.earned, 0);
  const transPossible = transResults.reduce((sum, item) => sum + item.max,    0);

  return {
    vocabResults,
    vocabGroups,
    vocabTotal,
    vocabPossible: vocabTotal.possible,
    transResults,
    transTotal,
    transPossible
  };
}

function validateTransScoreInput(input, max) {
  const raw = String(input.value || "").trim();

  input.classList.remove("input-error");

  if (raw === "") return;

  const score = Number(raw);

  if (Number.isNaN(score) || score < 0 || score > max) {
    input.classList.add("input-error");
  }
}

function renderVTExamPage(memberCode, name, school, grade, testDate, title, vtState = null) {
  if (typeof VOCAB_ITEMS === "undefined" || typeof TRANS_ITEMS === "undefined") {
    alert("VOCAB_ITEMS / TRANS_ITEMS 데이터가 없습니다.");
    return;
  }

  const vocabRows = VOCAB_ITEMS.map(item => {
    const preset = vtState?.vocabAnswers?.[item.no] || "";
    return `
      <div class="answer-row simple vt-vocab-row">
        <div class="question-no">${item.no}번</div>
        <div class="answer-meta left">${esc(item.word)} <span style="color:#64748b;">(${esc(item.gradeGroup)})</span></div>
        <input id="vocab-${item.no}" class="answer-input" maxlength="1" inputmode="numeric"
          value="${esc(preset)}"
          oninput="onlyBinary(this)"
          onkeydown="moveLinear(event,'vocab',${item.no},${VOCAB_ITEMS.length},'trans-score-1')">
      </div>
    `;
  }).join('');

  const transRows = TRANS_ITEMS.map(item => {
    const scoreVal = vtState?.transScores?.[item.no] ?? "0";
    return `
      <div class="card" style="margin-bottom:12px;">
        <div style="font-weight:700; color:#234b7d; margin-bottom:8px;">${item.no}번 (${item.grade}) · ${item.max}점 만점</div>
        <div class="note" style="margin-bottom:8px; color:#111827;">${esc(item.sentence)}</div>
        <div class="top-bar" style="margin-top:8px; margin-bottom:0;">
          <input id="trans-score-${item.no}" type="number" min="0" max="${item.max}" step="1"
            style="max-width:180px;"
            value="${esc(scoreVal)}"
            oninput="validateTransScoreInput(this, ${item.max})"
            onkeydown="moveScoreSelect(event,${item.no},${TRANS_ITEMS.length})">
          <div class="answer-meta">0 ~ ${item.max}점 입력</div>
        </div>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <h1>${esc(title)}</h1>
    <p class="muted" style="margin-bottom:12px;"><strong>${esc(name)}</strong> · ${esc(school)} · ${esc(grade)} · ${esc(formatDate(testDate))} · ${esc(title)}</p>
    <div class="top-bar no-print sticky-actions">
      <button class="secondary" onclick="goBack()">처음으로</button>
      <button onclick="checkVTExam('${escapeJs(memberCode)}','${escapeJs(name)}','${escapeJs(school)}','${escapeJs(grade)}','${escapeJs(testDate)}','${escapeJs(title)}')">채점하기</button>
    </div>
    <div class="integrated-section">
      <div class="integrated-title">Part 1. Vocabulary</div>
      <div class="answer-list">${vocabRows}</div>
    </div>
    <div class="integrated-section">
      <div class="integrated-title">Part 2. Translation</div>
      <div>${transRows}</div>
    </div>
  `;

  LAST_VT_SESSION = { memberCode, name, school, grade, testDate, title, vtState: vtState || null };
  document.getElementById("vocab-1")?.focus();
  markAllAns();
}

function restoreVTInput() {
  if (!LAST_VT_SESSION) return;
  renderVTExamPage(
    LAST_VT_SESSION.memberCode,
    LAST_VT_SESSION.name,
    LAST_VT_SESSION.school,
    LAST_VT_SESSION.grade,
    LAST_VT_SESSION.testDate,
    LAST_VT_SESSION.title,
    LAST_VT_SESSION.vtState || null
  );
}

function renderSimpleVTReport(memberCode, name, school, grade, testDate, title, vtEvaluation) {
  return `
    <section class="page">
      <div class="page-head">
        <div>
          <div class="page-label">Voca & Translation Report</div>
          <div class="report-subtitle">${esc(name)} · ${esc(school)} · ${esc(grade)} · ${esc(formatDate(testDate))}</div>
        </div>
        <div class="badge">ACE Academic Assessment Report</div>
      </div>

      <div class="score-grid">
        <div class="score-card">
          <div class="score-title">Vocabulary</div>
          <div class="score-value">${vtEvaluation.vocabTotal} / ${vtEvaluation.vocabPossible}</div>
        </div>
        <div class="score-card">
          <div class="score-title">Translation</div>
          <div class="score-value">${vtEvaluation.transTotal} / ${vtEvaluation.transPossible}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div style="font-weight:800; margin-bottom:10px;">Vocabulary 정오표</div>
        <div>${vtEvaluation.vocabResults.map(item => `<span style="display:inline-block; margin:4px 8px 4px 0; padding:6px 10px; border-radius:10px; background:${item.correct ? '#e0f2fe' : '#fee2e2'};">${item.no}번 ${item.correct ? 'O' : 'X'}</span>`).join('')}</div>
      </div>
    </section>
  `;
}

function checkVTExam(memberCode, name, school, grade, testDate, title) {
  const vocabAnswers = {};
  VOCAB_ITEMS.forEach(item => {
    vocabAnswers[item.no] = document.getElementById(`vocab-${item.no}`)?.value || '';
  });

  const transScores = {};
  TRANS_ITEMS.forEach(item => {
    transScores[item.no] = document.getElementById(`trans-score-${item.no}`)?.value || '0';
  });

  const vtState = { vocabAnswers, transScores };
  LAST_VT_SESSION = { memberCode, name, school, grade, testDate, title, vtState };

  let vtEvaluation;

  try {
    vtEvaluation = evaluateVTExam();
  } catch (err) {
    alert(err.message || "해석 점수를 확인해 주세요.");
    return;
  }

  app.innerHTML = `
    <div class="top-bar no-print sticky-actions">
      <button class="secondary" onclick="restoreVTInput()">답안입력으로 돌아가기</button>
      <button onclick="window.print()">인쇄</button>
      <button class="secondary" onclick="goBack()">처음으로</button>
    </div>
    <div id="reportArea" class="report-scale-fix">
      ${renderSimpleVTReport(memberCode, name, school, grade, testDate, title, vtEvaluation)}
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderFallbackReport(memberCode, name, school, grade, testDate, title, examItems, evaluation, assignedLevel) {
  return `
    <section class="page">
      <div class="page-head">
        <div>
          <div class="page-label">${esc(title)} Report</div>
          <div class="report-subtitle">${esc(name)} · ${esc(school)} · ${esc(grade)} · ${esc(formatDate(testDate))}</div>
        </div>
        <div class="badge">${esc(getDisplayLevel(assignedLevel))}</div>
      </div>

      <div class="score-grid">
        <div class="score-card">
          <div class="score-title">총점</div>
          <div class="score-value">${evaluation.total}</div>
        </div>
        <div class="score-card">
          <div class="score-title">Listening</div>
          <div class="score-value">${evaluation.areaStats.LC?.earned || 0} / ${evaluation.areaStats.LC?.possible || 0}</div>
        </div>
        <div class="score-card">
          <div class="score-title">Reading</div>
          <div class="score-value">${evaluation.areaStats.RC?.earned || 0} / ${evaluation.areaStats.RC?.possible || 0}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div style="font-weight:800; margin-bottom:10px;">정오표</div>
        <div>${evaluation.results.map(item => `<span style="display:inline-block; margin:4px 8px 4px 0; padding:6px 10px; border-radius:10px; background:${item.correct ? '#e0f2fe' : '#fee2e2'};">${item.no}번 ${item.correct ? 'O' : 'X'}</span>`).join('')}</div>
      </div>
    </section>
  `;
}
function renderVTFallbackReport(memberCode, name, school, grade, testDate, evaluation) {
  if (!evaluation) return "";

  const { vocabGroups, vocabTotal, transResults } = evaluation;

  const vocabRows = (vocabGroups || []).map(g => `
    <tr>
      <td>${g.label}</td>
      <td>${g.earned} / ${g.possible} (${g.rate}%)</td>
      <td style="font-size:24px; color:#12a9ef; font-weight:800;">${g.letter}</td>
      <td class="left">${g.comment || ""}</td>
    </tr>
  `).join("");

  const transRows = (transResults || []).map(item => `
    <tr>
      <td>${item.no}</td>
      <td>${item.grade}</td>
      <td>${item.earned} / ${item.max} (${item.rate}%)</td>
      <td class="left">${esc(item.type || "")}</td>
    </tr>
  `).join("");

  return `
    <section class="page">
      <div class="page-head">
        <div>
          <div class="page-label">Voca & Translation Ⅰ</div>
          <div class="report-subtitle">${esc(name)} · ${esc(school)} · ${esc(grade)} · ${esc(formatDate(testDate))}</div>
        </div>
        <div class="badge">ACE Academic Assessment Report</div>
      </div>

      <div class="card vt-vocab-card">
        <div class="page-label" style="display:inline-block; margin-bottom:10px;">Part 1. Vocabulary</div>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>Grade</th>
                <th>Achievement</th>
                <th>정오표</th>
                <th>코멘트</th>
              </tr>
            </thead>
            <tbody>
              ${vocabRows}
              <tr>
                <td>Total</td>
                <td>${vocabTotal?.earned || 0} / ${vocabTotal?.possible || 0} (${vocabTotal?.rate || 0}%)</td>
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
    </section>
  `;
}
function checkExam(memberCode, name, school, grade, testDate, title, examKey) {
  const examData = EXAMS[examKey];
  const answerMap = {};

  examData.forEach(q => {
    answerMap[q.no] = (document.getElementById(`q-${q.no}`)?.value || "").trim();
  });

const interviewResult = collectChessInterviewResult(title, examKey);

  let vtState = null;
  let vtEvaluation = null;

 if (
  (grade === "초등6" || grade === "중등1") &&
  typeof VOCAB_ITEMS !== "undefined" &&
  typeof TRANS_ITEMS !== "undefined" &&
  document.getElementById("trans-score-1")
) {
  const vocabAnswers = {};
  VOCAB_ITEMS.forEach(item => {
    vocabAnswers[item.no] = document.getElementById(`vocab-${item.no}`)?.value || '';
  });

  const transScores = {};
  TRANS_ITEMS.forEach(item => {
    transScores[item.no] = document.getElementById(`trans-score-${item.no}`)?.value || '0';
  });

  vtState = { vocabAnswers, transScores };

  try {
    vtEvaluation = evaluateVTExam();
  } catch (err) {
    alert(err.message || "해석 점수를 확인해 주세요.");
    return;
  }
}


const evaluation = evaluateExam(examData);
const reportGrade = getReportGradeForExam(grade, title);
const assignedLevel = getAssignedLevel(reportGrade, title, evaluation.total, testDate);

  renderAnswerReview(memberCode, name, school, grade, testDate, title, examKey, evaluation, vtEvaluation, assignedLevel, reportGrade);

  window.scrollTo({ top: 0, behavior: "smooth" });
}
function renderAnswerReview(memberCode, name, school, grade, testDate, title, examKey, evaluation, vtEvaluation = null, assignedLevel = "미배정", reportGrade = grade) {
  const results = evaluation.results || [];

  const reviewRows = results.map(q => `
    <div class="review-row ${q.correct ? "correct" : "wrong"}">
      <div class="review-no">${q.no}번</div>
      <div class="review-state">${q.correct ? "정답" : "오답"}</div>
      <div class="review-answer">내 답: ${esc(q.userAnswer || q.user || "-")}</div>
      <div class="review-correct-answer">정답: ${esc(q.ans || "-")}</div>
    </div>
  `).join("");

   const levelOpts = getLevelOptions(grade, title);
  const levelOptions = levelOpts.map(lv =>
    `<option value="${lv}" ${lv === assignedLevel ? "selected" : ""}>${lv}</option>`
  ).join("");

  app.innerHTML = `
    <div class="top-bar no-print sticky-actions">
      <button class="secondary" onclick="restoreExamInput()">답안입력으로 돌아가기</button>
      <button onclick="goToFinalReport('${escapeJs(memberCode)}','${escapeJs(name)}','${escapeJs(school)}','${escapeJs(grade)}','${escapeJs(testDate)}','${escapeJs(title)}','${escapeJs(examKey)}')">성적표 보기</button>
      <button class="secondary" onclick="goBack()">처음으로</button>
    </div>

    <div class="top-bar no-print" style="margin-top:8px; gap:10px; align-items:center;">
      <span style="font-weight:700; color:#1f5d96;">자동 배정 레벨: <strong>${esc(assignedLevel)}</strong></span>
      <span style="color:#64748b;">→ 직접 변경:</span>
      <select id="levelOverrideSelect" onchange="overrideAssignedLevel(this.value)" style="font-size:15px; font-weight:700; padding:6px 12px; border-radius:10px; border:1.5px solid #1f5d96; color:#1f5d96;">
        ${levelOptions}
      </select>
    </div>

    <h1>채점 결과 확인</h1>
    <p class="muted" style="margin-bottom:12px;">
      <strong>${esc(name)}</strong> · ${esc(school)} · ${esc(grade)} · ${esc(formatDate(testDate))} · ${esc(title)}
    </p>

    <div class="review-grid compact-review-grid">
      ${reviewRows}
    </div>
  `;

  LAST_REPORT_SESSION = {
    memberCode,
    name,
    school,
    grade,
    testDate,
    title,
    examKey,
    evaluation,
    vtEvaluation,
    assignedLevel,
reportGrade
  };

  window.scrollTo({ top: 0, behavior: "smooth" });
}
function overrideAssignedLevel(newLevel) {
  if (!LAST_REPORT_SESSION) return;
  LAST_REPORT_SESSION.assignedLevel = newLevel;
}
function goToFinalReport(memberCode, name, school, grade, testDate, title, examKey) {
  if (LAST_REPORT_SESSION) {
    renderReportScreen(
      LAST_REPORT_SESSION.memberCode,
      LAST_REPORT_SESSION.name,
      LAST_REPORT_SESSION.school,
      LAST_REPORT_SESSION.grade,
      LAST_REPORT_SESSION.testDate,
      LAST_REPORT_SESSION.title,
      LAST_REPORT_SESSION.examKey,
      LAST_REPORT_SESSION.evaluation,
      LAST_REPORT_SESSION.vtEvaluation,
      LAST_REPORT_SESSION.assignedLevel,
      LAST_REPORT_SESSION.reportGrade
    );
    return;
  }

const evaluation = evaluateExam(EXAMS[examKey]);

const reportGrade = getReportGradeForExam(grade, title); // 추가
const assignedLevel = getAssignedLevel(reportGrade, title, evaluation.total, testDate); // 수정

let vtEvaluation = null;

  if (
  (grade === "초등6" || grade === "중등1") &&
  typeof evaluateVTExam === "function" &&
  document.getElementById("trans-score-1")
) {
  vtEvaluation = evaluateVTExam();
}

  renderReportScreen(memberCode, name, school, grade, testDate, title, examKey, evaluation, vtEvaluation, assignedLevel);
}
const E6_ANS = [5,5,3,3,3,5,4,2,2,3,3,3,1,2,5,5,3,3,3,4,2,3,3,5,2,3,5,1,1,5,3,3,5,1,1,5,3,1,3,3];
const M_ANS = [3,5,4,2,2,3,3,3,1,2,5,5,5,2,2,5,1,1,4,5,2,3,5,1,1,5,3,3,5,1,1,5,1,2,4,4,1,2,1,4];

function overrideAnswers() {
  if (typeof EXAMS === 'undefined') return;
  if (EXAMS["E6"]) EXAMS["E6"].forEach((q, i) => q.ans = String(E6_ANS[i]));
  if (EXAMS["M1,M2(일반형)"]) EXAMS["M1,M2(일반형)"].forEach((q, i) => q.ans = String(M_ANS[i]));
}
overrideAnswers();

function updatePaperButtons() {
  const examEl = document.getElementById("examName");
  const questionBtn = document.getElementById("downloadQuestionBtn");
  const answerBtn = document.getElementById("viewAnswerBtn");

  if (!examEl || !questionBtn || !answerBtn) return;

  const selectedExam = examEl.value;

  const PAPER_FILE_MAP = {
    "E6": "PDF/[JLS Academic Achievement Assessment] E6.pdf",
    "M1(일반형)": "PDF/[JLS Academic Achievement Assessment] M1.pdf",
    "M2(일반형)": "PDF/[JLS Academic Achievement Assessment] M1.pdf",
    "M1(수능형)": "PDF/ACE 신규모집 M1(고1수능) 문제지_중1.pdf",
    "M2(수능형)": "PDF/ACE 신규모집 M2(고1수능) 문제지_중2.pdf",
    "M3(고1형)": "PDF/ACE 신규모집 M3(고1수능) 문제지_중3.pdf",
    "M3(고2형)": "PDF/ACE 신규모집 M3(고2수능) 문제지_중3.pdf",
    "Voca & Translation": "PDF/[JLS Academic Achievement Assessment] Voca & Translation_0116.pdf"
  };

  const CHESS_PAPER_MAP = {
    D1: "./PDF/D1.pdf",
    D2: "./PDF/D2.pdf",
    D3: "./PDF/D3.pdf",
    D4: "./PDF/D4.pdf",
    L1: "./PDF/L1.pdf",
    L2: "./PDF/L2.pdf",
    L3: "./PDF/L3.pdf",
    L4: "./PDF/L4.pdf"
  };

  




  const filePath = PAPER_FILE_MAP[selectedExam] || CHESS_PAPER_MAP[selectedExam];

  if (!selectedExam) {
    questionBtn.disabled = true;
    answerBtn.disabled = true;
    questionBtn.onclick = null;
    answerBtn.onclick = null;
    return;
  }

  if (filePath) {
    questionBtn.disabled = false;
    questionBtn.onclick = () => window.open(filePath, "_blank");
  } else {
    questionBtn.disabled = true;
    questionBtn.onclick = null;
  }

  answerBtn.disabled = false;

const chessTests = ["D1", "D2", "D3", "D4", "L1", "L2", "L3", "L4"];

  if (chessTests.includes(selectedExam)) {
    answerBtn.onclick = () => {
      CURRENT_CHESS_EXAM_KEY = selectedExam;
      showChessAnswerSheet();
    };
  } else {
    answerBtn.onclick = openSelectedAnswer;
  }
}
function getReportGradeForExam(studentGrade, examName) {
 
  const g = String(studentGrade || "").replace(/\s/g, "");
  const e = String(examName || "").replace(/\s/g, "");

 
  if ((g.includes("초5") || g.includes("초등5")) && (e.includes("E6") || e === "")) {
    console.log("학년 보정 발생: 초5 -> 초등6"); 
    return "초등6";
  }

  return studentGrade;
}
function getAssignedLevel(grade, examName, score, testDate = "") {
  const g = String(grade || "").replace(/\s/g, "");
  const e = String(examName || "").replace(/\s/g, "");
  const s = Number(score);

  if (Number.isNaN(s)) return "미배정";

  const term = getTermInfo(testDate)?.term || "";

// 초6
if (
  g === "초등6" || g === "초6" ||
  ((g === "초등5" || g === "초5") && e === "E6")
) {
  if (s >= 75) return "A1";
  if (s >= 65) return "PA2";
  if (s >= 60) return "PA1";
  if (s >= 45) return "HB";
  if (s >= 30) return "B";
  return "미배정";
}

  // 중1
  if (g === "중등1" || g === "중1") {
    if (e === "M1(수능형)") {
      if (s >= 75) return "MA2";
      if (s >= 65) return "MA1";
      if (s >= 55) return "A2";
      if (s >= 45) return "A1";
      return "미배정";
    }

    if (e === "M1(일반형)") {
      if (s >= 75) return "A1";
      if (s >= 60) return "PA2";
      if (s >= 45) return "PA1";
      return "미배정";
    }

    return "미배정";
  }

  // 중2
  if (g === "중등2" || g === "중2") {
    if (e === "M2(수능형)") {
      if (term === "1st" || term === "2nd") {
        if (s >= 85) return "MA3";
        if (s >= 75) return "MA2";
        if (s >= 65) return "MA1";
        return "미배정";
      }

      if (term === "3rd" || term === "4th") {
        if (s >= 85) return "HM2";
        if (s >= 75) return "HM1";
        if (s >= 65) return "HA2";
        if (s >= 55) return "HA1";
        return "미배정";
      }

      return "미배정";
    }

    if (e === "M2(일반형)") {
      if (s >= 70) return "MA1";
      if (s >= 55) return "A2";
      if (s >= 40) return "A1";
      return "미배정";
    }

    return "미배정";
  }

  // 중3
  if (g === "중등3" || g === "중3") {
    if (e === "M3(고2형)") {
      if (s >= 85) return "HM3";
      if (s >= 75) return "HM2";
      return "미배정";
    }

    if (e === "M3(고1형)") {
      if (s >= 85) return "HM2";
      if (s >= 75) return "HM1";
      if (s >= 65) return "HA2";
      return "미배정";
    }

    return "미배정";
  }

  return "미배정";
}
function getLevelOptions(grade, examName) {
  const g = String(grade || "").replace(/\s/g, "");
  const e = String(examName || "").replace(/\s/g, "");

  // CHESS 시험인 경우 — CHESS_LEVEL_RULES 기준 레벨 목록
  const chessMap = {
    "CHESSD1": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "CHESSD2": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "CHESSD3": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "CHESSD4": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "CHESSL1": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "CHESSL2": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "CHESSL3": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "CHESSL4": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    // examName이 "D1", "L2" 형태로 올 때도 대응
    "D1": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "D2": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "D3": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "D4": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "L1": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "L2": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "L3": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"],
    "L4": ["IS", "DSA", "DSB","DSC", "DSD","LSA", "LSB", "LSC","LSD", "MSA"]
  };

  // 공백 제거 후 대문자로 비교
  const chessKey = e.replace(/\s/g, "").toUpperCase();
  if (chessMap[chessKey]) {
    return ["미배정", "interview", ...chessMap[chessKey]];
  }

  // ACE 시험 — 학년 기준
  let levels = [];

  if (g === "초등6" || g === "초6" || ((g === "초등5" || g === "초5") && e === "E6")) {
    levels = ["B", "HB", "PA1", "PA2", "A1" , "A2"];
  } else if (g === "중등1" || g === "중1") {
    if (e === "M1(수능형)") {
      levels = ["PA1", "PA2", "A1","A2","MA1","MA2"];
    } else {
      levels = ["PA1", "PA2", "A1","A2","MA1","MA2"];
    }
  } else if (g === "중등2" || g === "중2") {
    if (e === "M2(수능형)") {
      levels = ["A1", "A2", "MA1","MA2", "MA3","HM1"];
    } else {
      levels = ["A1", "A2", "MA1","MA2", "MA3","HM1"];
    }
  } else if (g === "중등3" || g === "중3") {
    if (e === "M3(고2형)") {
      levels = ["MA1","MA2", "MA3","HM1", "HM2","HM3"];
    } else {
      levels = ["MA1","MA2", "MA3","HM1", "HM2","HM3"];
    }
  }

  return ["미배정", ...levels];
}


function buildCoverPage(memberCode, name, school, grade, testDate, title, introText) {
  return `
    <section class="page cover-page">
      <div class="cover-inner">
        <div style="text-align:center; margin-bottom:24px;">
          <img src="jls-logo.png" alt="정상어학원 로고" style="max-width:420px; width:100%; height:auto; object-fit:contain;">
        </div>

        <div class="page-head" style="justify-content:center; text-align:center; border-top:none; padding-top:0;">
          <div>
            <div style="font-size:34px; font-weight:800; color:var(--brand); line-height:1.2;">
              JLS Academic Achievement<br>Assessment Report
            </div>
          </div>
        </div>

        <div class="cover-meta-grid">
          <div class="cover-meta">
            <div class="kpi-label">회원코드</div>
            <div class="kpi-value" style="font-size:20px;">${esc(memberCode || '-')}</div>
          </div>
          <div class="cover-meta">
            <div class="kpi-label">학생명</div>
            <div class="kpi-value" style="font-size:22px;">${esc(name)}</div>
          </div>
          <div class="cover-meta">
            <div class="kpi-label">학교 / 학년</div>
            <div class="kpi-value" style="font-size:18px;">${esc(school)} · ${esc(grade)}</div>
          </div>
          <div class="cover-meta">
            <div class="kpi-label">시험 본 날짜</div>
            <div class="kpi-value" style="font-size:18px;">${esc(formatDate(testDate))}</div>
          </div>
          <div class="cover-meta" style="grid-column:1 / -1;">
            <div class="kpi-label">시험지명</div>
            <div class="kpi-value" style="font-size:20px;">${esc(title)}</div>
          </div>
        </div>

        ${introText}
      </div>
    </section>
  `;
}
const PAPER_GRADE_MAP = {
  LC: [
    { label:'예비중1 영역', start:1, end:4 },
    { label:'중1 영역', start:5, end:8 },
    { label:'중2 영역', start:9, end:12 },
    { label:'중3 영역', start:13, end:16 },
    { label:'예비고1 영역', start:17, end:20 }
  ],
  RC: [
    { label:'예비중1 영역', start:21, end:24 },
    { label:'중1 영역', start:25, end:28 },
    { label:'중2 영역', start:29, end:32 },
    { label:'중3 영역', start:33, end:36 },
    { label:'예비고1 영역', start:37, end:40 }
  ]
};

function getPaperGradeLabel(no) {
  if (no >= 1 && no <= 4) return '예비중1 영역';
  if (no >= 5 && no <= 8) return '중1 영역';
  if (no >= 9 && no <= 12) return '중2 영역';
  if (no >= 13 && no <= 16) return '중3 영역';
  if (no >= 17 && no <= 20) return '예비고1 영역';
  if (no >= 21 && no <= 24) return '예비중1 영역';
  if (no >= 25 && no <= 28) return '중1 영역';
  if (no >= 29 && no <= 32) return '중2 영역';
  if (no >= 33 && no <= 36) return '중3 영역';
  if (no >= 37 && no <= 40) return '예비고1 영역';
  return '-';
}

function computePaperGradeStats(results) {
  const rows = ['예비중1 영역','중1 영역','중2 영역','중3 영역','예비고1 영역'];
  const init = () => Object.fromEntries(rows.map(label => [label, { earned:0, possible:0, rate:0 }]));

  const listening = init();
  const reading = init();
  const total = init();

  results.forEach(q => {
    const label = getPaperGradeLabel(q.no);
    if (!label || label === '-') return;

    const target = q.area === 'LC' ? listening : reading;
    target[label].earned += q.earned || 0;
    target[label].possible += q.score || 0;

    total[label].earned += q.earned || 0;
    total[label].possible += q.score || 0;
  });

  rows.forEach(label => {
    listening[label].rate = percent(listening[label].earned, listening[label].possible);
    reading[label].rate = percent(reading[label].earned, reading[label].possible);
    total[label].rate = percent(total[label].earned, total[label].possible);
  });

  return { labels: rows, listening, reading, total };
}

function renderReport(memberCode, name, school, grade, testDate, title, examData, evaluation, assignedLevel, reportGrade = grade) {
  return isSatExamKey(title)
    ? renderSatReport(memberCode, name, school, grade, testDate, title, examData, evaluation, assignedLevel, reportGrade)
    : renderGeneralReport(memberCode, name, school, grade, testDate, title, examData, evaluation, assignedLevel, reportGrade);
}

function renderReportScreen(memberCode, name, school, grade, testDate, title, examKey, evaluation, vtEvaluation = null, assignedLevel, reportGrade = grade) {
  
  const mainReport = renderReport(
    memberCode,
    name,
    school,
    grade,
    testDate,
    title,
    EXAMS[examKey],
    evaluation,
    assignedLevel,
    reportGrade 
  );

  const vtReport = (vtEvaluation && typeof renderVTReport === "function")
    ? renderVTReport(memberCode, name, school, grade, testDate, "Voca & Translation", vtEvaluation)
    : "";

  app.innerHTML = `
    <div class="top-bar no-print sticky-actions">
      <button class="secondary" onclick="restoreExamInput()">답안입력으로 돌아가기</button>
      <button onclick="window.print()">인쇄</button>
      <button class="secondary" onclick="goBack()">처음으로</button>
    </div>

    <div id="reportArea" class="report-scale-fix">
      ${mainReport}
      ${vtReport}
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}
const app = document.getElementById('app');
if (app) {
  renderHome();
}