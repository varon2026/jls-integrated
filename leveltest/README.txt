이 폴더는 원본 단일 HTML 파일을 관리하기 쉽게 나눈 버전입니다.

파일 구성
- index.html: 메인 진입 파일
- style.css: 스타일
- roadmap-data.js: 로드맵 관련 데이터
- common.js: 공통 로직과 화면 흐름
- general.js: 일반형 성적표 렌더링
- sat.js: 수능형 성적표 렌더링

열기 방법
1. 모든 파일을 같은 폴더에 둡니다.
2. index.html을 더블클릭해서 엽니다.

참고
- 이번 분리는 원본 구조를 최대한 유지한 분리 작업입니다.
- 앞으로는 일반형은 general.js, 수능형은 sat.js, 로드맵은 roadmap-data.js만 수정하면 됩니다.
