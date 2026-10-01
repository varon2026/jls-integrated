/* 신입생 안내 페이지 — 분원별 기본 초안.
   분원마다 편집기(guide-app)에서 자유롭게 고쳐 쓰는 걸 전제로 한 "시작용 초안"이다.
   전화번호·블로그 링크·담임 안내 같은 분원별 디테일은 비워두거나 일반적인 문구로
   남겨뒀으니, 각 분원이 자기 사정에 맞게 고쳐야 한다. */

var GUIDE_BRANCH_NAMES = {
  'baronbooks':       '바론',
  'namdongtanjls':     '남동탄',
  'suwon_jls':         '수원',
  'suwonjls2009':      '장안',
  'seosuwonjls':       '서수원',
  'unjeongjls':        '운정1',
  'unjeongjls2':       '운정2',
  'asantangjeongjls':  '아산탕정'
};

function guideDefaultHtml(branchName){
  var name = branchName || '우리';
  return ''
  + '<div class="g-flow"><h2>학부모님 한눈에 보기</h2>'
  + '<ul class="chips"><li>회원가입·자녀 등록</li><li>수강료 결제</li><li>반교재 구매</li><li>학습관리 앱 설치</li></ul></div>'

  + '<div class="g-sec"><h2><span class="n">01</span>회원가입 · 자녀 등록</h2>'
  + '<p>학원 홈페이지에서 학부모 회원가입 후 자녀 등록을 진행해 주세요.</p>'
  + '<ol class="g-steps">'
  + '<li><strong>학원 홈페이지 접속</strong></li>'
  + '<li><strong>회원가입 후 로그인</strong></li>'
  + '<li><strong>자녀 등록하기에서 학생 계정 생성</strong><small>학생 아이디·비밀번호는 온라인 과제를 할 때 학생이 직접 쓰는 계정이에요. 기억하기 쉬운 걸로 정해주세요.</small></li>'
  + '</ol></div>'

  + '<div class="g-sec"><h2><span class="n">02</span>수강료 결제</h2>'
  + '<p>홈페이지 메인 화면에서 교육비 결제 메뉴를 눌러 진행해 주세요.</p>'
  + '<div class="g-note alert"><b>학부모 계정으로 결제해 주세요</b>학생 계정으로는 결제가 진행되지 않습니다.</div>'
  + '<div class="g-note"><b>현장 카드 결제도 가능합니다</b>학원 운영시간 내 방문하시면 카드로도 결제하실 수 있어요.</div>'
  + '</div>'

  + '<div class="g-sec"><h2><span class="n">03</span>반교재 구매</h2>'
  + '<p>학부모·학생 계정 모두 구매 가능합니다. 홈페이지 메인에서 반교재 메뉴를 눌러 학생 반에 맞는 교재를 선택해 주세요.</p>'
  + '<div class="g-note"><b>반 배정 전에는 목록이 안 보일 수 있어요</b>반 배정이 끝났는데도 교재 목록이 안 보이면 학원으로 연락해 주세요.</div>'
  + '</div>'

  + '<div class="g-sec"><h2><span class="n">04</span>학습관리 앱 설치</h2>'
  + '<p>시험 점수, 단어시험 결과, 재시험 일정 확인·예약까지 할 수 있는 앱이에요. 신입생 학부모님은 꼭 설치해 주세요.</p>'
  + '<ul class="g-grid2"><li>시험 점수 확인</li><li>단어시험 결과</li><li>재시험 일정 확인</li><li>재시험 예약</li></ul>'
  + '<p style="margin-top:10px;font-size:13px;color:#6B7BA0">(여기에 앱 다운로드 링크를 넣어주세요)</p>'
  + '</div>'

  + '<div class="g-sec"><h2><span class="n">05</span>셔틀 이용 학생 안내</h2>'
  + '<p>셔틀을 이용하는 학생의 학부모님은 셔틀 앱도 함께 설치해 주세요. 탑승 시간, 정류장, 미탑승 처리를 확인할 수 있어요.</p>'
  + '<div class="g-note"><b>오늘 셔틀을 타지 않는다면 꼭 "안타요" 처리를 해주세요</b>셔틀 선생님이 헛걸음하지 않도록 앱에서 미리 알려주시면 좋아요.</div>'
  + '<p style="margin-top:4px;font-size:13px;color:#6B7BA0">(셔틀을 운행하지 않는 분원이면 이 항목은 지워주세요)</p>'
  + '</div>'

  + '<div class="g-sec"><h2><span class="n">06</span>등록 후 안내전화</h2>'
  + '<p>등록 후 담임 선생님이, 셔틀을 이용하는 경우 셔틀 선생님도 안내전화를 드려요.</p>'
  + '<ul class="g-grid2"><li>수업 방식</li><li>온라인 과제</li><li>준비물</li><li>단어시험</li></ul>'
  + '</div>'

  // ===== 학생 =====
  + '<div class="g-flow" data-tab="student"><h2>학생 한눈에 보기</h2>'
  + '<ul class="chips"><li>온라인 과제</li><li>단어 암기</li><li>Self-test</li><li>수업</li><li>시험</li></ul></div>'

  + '<div class="g-sec" data-tab="student"><h2><span class="n">01</span>온라인 과제는 다음 수업 예습이에요</h2>'
  + '<p>온라인 과제는 수업이 끝난 뒤 바로, 다음 수업을 준비하는 과정이에요. 수업 직전에 몰아서 하지 말고 미리 해두세요.</p></div>'

  + '<div class="g-sec" data-tab="student"><h2><span class="n">02</span>단어 먼저, 그다음 다른 숙제</h2>'
  + '<p>단어를 먼저 익히면 문장 뜻이 쉽게 이해되고, 문제 푸는 시간도 줄어들어요.</p></div>'

  + '<div class="g-sec" data-tab="student"><h2><span class="n">03</span>준비물</h2>'
  + '<p>기본 준비물 외에 담임 선생님이 알림장이나 과제 안내로 추가 준비물을 올려주실 수 있어요. 늘 함께 확인해 주세요.</p>'
  + '<ul class="g-grid2"><li>연필·샤프</li><li>지우개</li><li>빨간 펜</li><li>형광펜</li><li>당일 수업 교재</li><li>영어 전용 공책</li></ul>'
  + '</div>'

  + '<div class="g-sec" data-tab="student"><h2><span class="n">04</span>Self-test로 단어 확인하기</h2>'
  + '<p>정식 시험 전, 내가 단어를 정말 외웠는지 직접 확인하는 과정이에요. 눈으로 여러 번 읽기보다 <b>보지 않고 직접 써보는 것</b>이 핵심입니다. 담임 선생님이 주시는 방법·프린트를 따라주세요.</p></div>'

  + '<div class="g-sec" data-tab="student"><h2><span class="n">05</span>교재 사용 습관</h2>'
  + '<ul class="dots" style="margin-top:10px;padding-left:20px">'
  + '<li>교재 앞에 이름 적기</li><li>시험지·프린트는 정해진 위치에 붙이기</li><li>채점은 빨간 펜으로</li><li>틀린 문제는 바르게 고쳐 쓰기</li>'
  + '</ul><p style="margin-top:8px;font-size:13px;color:#6B7BA0">시험지 붙이는 위치는 레벨마다 다를 수 있어요. 담임 선생님 안내를 따라주세요.</p></div>'

  // ===== 시험 =====
  + '<div class="g-flow" data-tab="exam"><h2>시험 한눈에 보기</h2>'
  + '<ul class="chips"><li>시험</li><li>통과 못 하면 보강</li><li>재시험 준비</li><li>재시험</li><li>시험지 정리</li></ul></div>'

  + '<div class="g-sec" data-tab="exam"><h2><span class="n">01</span>통과하지 못했다면</h2>'
  + '<p>바로 재시험을 보지 않고, 먼저 보강을 받아요. 재시험은 틀린 부분만 외워 오는 게 아니라 <b>범위 전체를 다시 확인하는 과정</b>이에요.</p></div>'

  + '<div class="g-sec" data-tab="exam"><h2><span class="n">02</span>재시험 준비</h2>'
  + '<p>재시험을 바로 볼 수는 없고, 공부한 흔적을 먼저 확인받은 뒤에 시험지를 받을 수 있어요.</p>'
  + '<ul class="g-grid2"><li>공책 Self-test</li><li>담임 선생님 프린트</li><li>오답 정리</li></ul></div>'

  + '<div class="g-sec" data-tab="exam"><h2><span class="n">03</span>STaRT Room이란?</h2>'
  + '<p>혼자 자습하거나, 재시험·예비시험을 보는 공간이에요.</p>'
  + '<ul class="g-grid2"><li>자습</li><li>재시험</li><li>예비시험</li></ul></div>'

  + '<div class="g-sec" data-tab="exam"><h2><span class="n">04</span>입실 방법</h2>'
  + '<p>(이 분원의 STaRT Room 입실 절차를 적어주세요. 패드로 입실체크하는 방식인지, 다른 방식인지 분원마다 다를 수 있어요.)</p>'
  + '<ol class="g-steps">'
  + '<li><strong>입실 체크</strong><small>여기에 입실 체크 방법을 적어주세요.</small></li>'
  + '<li><strong>이용 목적 확인</strong><small>자습·재시험·예비시험 중 오늘 온 목적에 맞게 이용해요.</small></li>'
  + '<li><strong>휴대폰 제출</strong><small>지정된 보관 장소에 제출해요.</small></li>'
  + '</ol>'
  + '<p style="margin-top:8px;font-size:13px;color:#6B7BA0">STaRT Room을 운영하지 않는 분원이면 이 섹션을 지우거나 자습실 안내로 바꿔주세요.</p>'
  + '</div>'

  + '<div class="g-sec" data-tab="exam"><h2><span class="n">05</span>통과한 시험지는 교재에 붙이기</h2>'
  + '<p>본시험이든 재시험이든, 통과한 시험지는 모두 교재의 정해진 위치에 붙여요. 자세한 위치는 담임 선생님 안내를 따라주세요.</p></div>'

  // ===== 학원 생활 =====
  + '<div class="g-flow" data-tab="life"><h2>학원 생활</h2>'
  + '<ul class="chips"><li>공지사항</li><li>방학 특강</li><li>학기말 시상</li></ul></div>'

  + '<div class="g-sec" data-tab="life"><h2><span class="n">01</span>공지와 학사일정</h2>'
  + '<p>학원 소식과 일정은 아래에서 확인하실 수 있어요.</p>'
  + '<p style="font-size:13px;color:#6B7BA0">(여기에 분원 블로그·홈페이지 링크를 넣어주세요)</p></div>'

  + '<div class="g-sec" data-tab="life"><h2><span class="n">02</span>방학 특강</h2>'
  + '<p>여름·겨울방학마다 커리큘럼에 맞춘 특강이 진행돼요. (분원 특강 일정·대상 레벨을 적어주세요)</p></div>'

  + '<div class="g-sec" data-tab="life"><h2><span class="n">03</span>학기말 시상</h2>'
  + '<p>매 학기를 마무리하며 한 학기 동안의 노력과 성장을 시상해요.</p>'
  + '<ul class="g-grid2"><li>THE BEST SCORE</li><li>THE BEST SPEAKER</li><li>THE BEST BOOK</li></ul></div>'

  + '<p style="text-align:center;color:#8A95B8;font-size:13px;margin-top:10px">' + name + ' JLS</p>';
}
