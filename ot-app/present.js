/* 진급 OT 안내 — TV 발표 모드 (▶ 발표 버튼)
   세로(A4) 소책자 쪽은 TV에서 글씨가 너무 빽빽하다. 그래서 지금 화면의 슬라이드(수정한 내용·분원 사본 포함)를
   '요일 · 교시 · 과목 · 항목 묶음' 단위로 쪼개 가로(16:9) 화면 여러 장으로 다시 짜서 전체화면으로 보여준다.
   · 내용은 화면(#root)에서 그대로 복제하므로 따로 관리할 데이터가 없다. 고치면 발표 화면에도 바로 반영된다.
   · 모르는 모양의 슬라이드(직접 추가한 사진·노트 쪽 등)는 통째로 한 화면에 줄여 넣는다(fallback) — 빠지는 쪽이 없게.
   · 글자 크기는 화면마다 넘치지 않는 가장 큰 값으로 자동 맞춘다(--s). 인쇄·소책자와는 무관하다. */
(function(){
var W=1280,H=720,K=1.4;                 // 슬라이드를 1280×720 으로 짜서 1.4배로 키워 1792×1008 카드로 보여준다(1920×1080 무대)
var SC=[],IDX=0,STAGE=null,ROOT=null,LABEL='';

var CSS=
'#pv{position:fixed;inset:0;z-index:2000;background:#0e1b44;display:none;overflow:hidden;user-select:none;-webkit-user-select:none;cursor:default}'+
'#pv.on{display:block}'+
'#pv.idle{cursor:none}'+
'.pv-stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;margin:-540px 0 0 -960px;transform:scale(var(--k,1));transform-origin:center;overflow:hidden;background:linear-gradient(135deg,#e6efff 0%,#fff4f1 55%,#e9f7ee 100%);font-family:inherit}'+
'.pv-blob{position:absolute;border-radius:50%;opacity:.55;animation:pvFloat 16s ease-in-out infinite;pointer-events:none}'+
'.pv-b1{width:560px;height:560px;left:-160px;top:-180px;background:radial-gradient(circle at 35% 35%,#cfe0ff,#9db8f0 70%)}'+
'.pv-b2{width:420px;height:420px;right:-120px;bottom:-140px;background:radial-gradient(circle at 35% 35%,#ffe3e3,#fdb5b5 75%);animation-delay:-5s}'+
'.pv-b3{width:260px;height:260px;right:240px;top:-90px;background:radial-gradient(circle at 35% 35%,#fff3bd,#f9e8a8 75%);animation-delay:-9s}'+
'@keyframes pvFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,24px) scale(1.06)}}'+
'.pv-sc{position:absolute;inset:0;visibility:hidden;opacity:0}'+
'.pv-sc.on{visibility:visible;opacity:1;animation:pvInF .65s cubic-bezier(.22,.8,.3,1) both}'+
'.pv-back .pv-sc.on{animation-name:pvInB}'+
'.pv-sc.out{visibility:visible;animation:pvOutF .5s cubic-bezier(.4,0,.6,1) both}'+
'.pv-back .pv-sc.out{animation-name:pvOutB}'+
'@keyframes pvInF{from{opacity:0;transform:translateX(90px) scale(.97)}to{opacity:1;transform:none}}'+
'@keyframes pvInB{from{opacity:0;transform:translateX(-90px) scale(.97)}to{opacity:1;transform:none}}'+
'@keyframes pvOutF{from{opacity:1;transform:none}to{opacity:0;transform:translateX(-90px) scale(.97)}}'+
'@keyframes pvOutB{from{opacity:1;transform:none}to{opacity:0;transform:translateX(90px) scale(.97)}}'+
'.pv-card{position:absolute;left:64px;top:36px;width:1792px;height:1008px;border-radius:30px;background:#fff;box-shadow:0 18px 50px rgba(30,50,110,.22),0 2px 8px rgba(30,50,110,.1);overflow:hidden}'+
'.pv-fit{width:'+W+'px;height:'+H+'px;transform:scale('+K+');transform-origin:0 0}'+
'.pv-w{width:'+W+'px;height:'+H+'px;container-type:inline-size;padding:0;max-width:none;margin:0}'+
'.pv-w .ot-slide{width:'+W+'px !important;max-width:none !important;height:'+H+'px !important;aspect-ratio:auto !important;margin:0 !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;background:#fff;box-sizing:border-box}'+
/* 줄바꿈이 어색하게 끊기지 않게 */
'.pv-w .ot-slide{word-break:keep-all}'+
/* ── 표지 ── */
'.pv-sc.cv .pv-card{background:linear-gradient(160deg,#5A86E8 0%,#3E66D6 100%);box-shadow:0 18px 50px rgba(20,40,110,.35)}'+
'.pv-cv{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#fff}'+
'.pv-cv .en{font-family:var(--hand);font-size:76px;font-weight:700;color:#FFE08A;margin-bottom:6px}'+
'.pv-cv h1{font-family:var(--disp);font-weight:400;font-size:150px;line-height:1.18;margin:0;letter-spacing:-.01em;text-shadow:0 6px 0 rgba(20,40,110,.25)}'+
'.pv-cv .cls{display:inline-block;margin-top:34px;font-size:46px;font-weight:800;background:rgba(255,255,255,.22);border-radius:999px;padding:8px 42px}'+
'.pv-cv.mid h1{font-size:170px}'+
'.pv-cv .br{position:absolute;top:70px;left:0;right:0;font-size:34px;font-weight:800;letter-spacing:.08em;opacity:.9}'+
'.pv-cv .st{position:absolute;opacity:.9;animation:pvTwinkle 3.2s ease-in-out infinite}'+
'@keyframes pvTwinkle{0%,100%{transform:scale(1) rotate(0);opacity:.9}50%{transform:scale(1.25) rotate(25deg);opacity:.45}}'+
'.pv-sc.on .pv-cv .pv-in{animation:pvPop .9s cubic-bezier(.2,1.2,.3,1) both}'+
'@keyframes pvPop{from{opacity:0;transform:scale(.8) translateY(30px)}to{opacity:1;transform:none}}'+
/* ── 항목 차례로 나타나기 ── */
'.pv-a{opacity:0}'+
'.pv-sc.on .pv-a{animation:pvUp .6s cubic-bezier(.2,.9,.3,1) both;animation-delay:calc(var(--i)*90ms + 260ms)}'+
'@keyframes pvUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}'+
/* ── 시간표 ── */
'.pv-time{padding:46px 56px 40px;display:flex;flex-direction:column;gap:26px}'+
'.pv-time .tm-h{flex:none;display:flex;align-items:center;gap:18px;border-bottom:3px solid #1C2A4A;padding-bottom:14px}'+
'.pv-time .tm-h .n{background:#FDE2E4;color:#9A2E3E;border-radius:50%;min-width:56px;height:56px;display:grid;place-items:center;font-size:15.6px;font-weight:800}'+
'.pv-time .tm-h h2{font-family:inherit;font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0;color:#1C2A4A}'+
'.pv-tcols{flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:22px}'+
'.pv-tcol{min-height:0;border-radius:22px;background:#F4F7FF;padding:22px 22px 18px;display:flex;flex-direction:column;gap:12px}'+
'.pv-tcol .d{font-size:calc(27.6px*var(--s));font-weight:800;color:#1C2A4A;text-align:center;line-height:1.1;padding-bottom:8px}'+
'.pv-tr{flex:1 1 0;min-height:0;background:#fff;border-radius:16px;padding:calc(12px*var(--s)) calc(16px*var(--s));display:flex;flex-direction:column;justify-content:center;gap:2px}'+
'.pv-tr .t{font-size:calc(13.2px*var(--s));font-weight:800;color:#5A6B95;line-height:1.3}'+
'.pv-tr .t small{font-size:calc(10.8px*var(--s));font-weight:700;margin-left:8px;color:#8A95B8}'+
'.pv-tr .s{font-size:calc(20.4px*var(--s));font-weight:800;color:#D23B3B;line-height:1.2}'+
'.pv-tr .k{font-size:calc(13.2px*var(--s));font-weight:700;color:#1C2A4A;line-height:1.35}'+
/* ── 첫 주 일정: 왼쪽 교재·범위 / 오른쪽 과제 ── */
'.pv-w .wkp{padding:38px 56px 34px;display:flex;flex-direction:column}'+
'.pv-w .wkp .w2-head{padding-bottom:12px}'+
'.pv-w .wkp .w2-day{font-size:43.1px}'+
'.pv-w .wkp .w2-wk{font-size:14.4px}'+
'.pv-w .wkp .wp-body{margin-top:14px;justify-content:center}'+
'.pv-w .wkp .wp-band{flex:0 0 auto;margin:auto 0}.pv-w .wkp .wp-bb{flex:1 1 auto}'+
'.pv-w .wkp .wp-ph{font-size:calc(31.9px*var(--s));padding-bottom:6px;margin-bottom:10px;border-bottom:0}'+
'.pv-w .wkp .wp-pt{font-size:calc(20.7px*var(--s))}'+
'.pv-w .wkp .w2-col{flex:1 1 auto;display:flex;flex-direction:column;justify-content:flex-start;padding:0}'+
'.pv-w .wkp .w2-sub{font-size:calc(31.9px*var(--s));margin-bottom:calc(10px*var(--s))}'+
'.pv-2{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:0 44px}'+
'.pv-2.one{grid-template-columns:1fr}'+
'.pv-2>div{min-width:0}'+
'.pv-2 .pv-r{padding-left:8px}'+
'.pv-w .wkp .w2-row{grid-template-columns:calc(86px*var(--s)) 1fr;gap:12px;font-size:calc(20.7px*var(--s));line-height:1.45;margin-bottom:calc(10px*var(--s))}'+
'.pv-w .wkp .w2-l{font-size:calc(16.8px*var(--s))}'+
'.pv-w .wkp .w2-book{font-size:calc(22.3px*var(--s))}'+
'.pv-w .wkp .w2-hwl{font-size:calc(19.2px*var(--s));margin:0 0 calc(10px*var(--s));padding-top:0;border-top:0;color:#D23B3B;font-weight:800}'+
'.pv-w .wkp .w2-ol li,.pv-w .wkp .w2-ol.sm li{font-size:calc(21.5px*var(--s));padding-left:calc(42px*var(--s));margin-bottom:calc(11px*var(--s));line-height:1.42}'+
'.pv-w .wkp .w2-ol li small{font-size:calc(17.6px*var(--s))}'+
'.pv-w .wkp .w2-ref{font-size:calc(17.6px*var(--s))}'+
/* ── 평가 일정 · STaRT ── */
'.pv-w .ev{padding:44px 60px 36px}'+
'.pv-w .ev-head{padding-bottom:14px;border-bottom-width:3px}'+
'.pv-w .ev-t{font-size:41.1px}'+
'.pv-w .ev-head .n{min-width:58px;height:58px;font-size:19.8px}'+
'.pv-w .ev-sub{font-size:18.4px}'+
'.pv-w .ev-tl{margin:auto 0}'+
'.pv-w .ev-lab{font-size:calc(17px*var(--s));margin-bottom:12px}'+
'.pv-w .ev-bar{border:0;gap:18px;background:none}'+
'.pv-w .ev-bar>div{padding:calc(18px*var(--s)) calc(22px*var(--s));border:0;background:#F4F7FF;border-radius:18px;min-height:0}'+
'.pv-w .ev-mh{font-size:calc(22.7px*var(--s));margin-bottom:calc(10px*var(--s))}'+
'.pv-w .ev-mp{font-size:calc(19.1px*var(--s));line-height:1.55}'+
'.pv-w .ev-mp::before{font-size:calc(12.7px*var(--s))}'+
'.pv-w .ev-all{margin-top:calc(18px*var(--s));font-size:calc(19.1px*var(--s));gap:calc(14px*var(--s))}'+
'.pv-w .ev-all i{font-size:calc(16.3px*var(--s));padding:calc(2px*var(--s)) calc(18px*var(--s))}'+
'.pv-w .ev-rows{margin-top:18px;justify-content:center;gap:6px}'+
'.pv-w .ev-r{flex:0 1 auto;grid-template-columns:27% 1fr;gap:0 40px;padding:calc(20px*var(--s)) 0;border:0}'+
'.pv-w .ev-r:first-child{border:0}'+
'.pv-w .ev-nm{font-size:calc(26.9px*var(--s))}'+
'.pv-w .ev-ds{font-size:calc(19.8px*var(--s));line-height:1.55}'+
'.pv-w .ev-ok{font-size:calc(15.6px*var(--s));border-width:2px;margin-top:calc(8px*var(--s))}'+
/* ── 목록(준비물·숙제 방법…) ── */
'.pv-w .ls{padding:48px 70px 40px}'+
'.pv-w .ls .ls-all{justify-content:center}'+
'.pv-w .ls .ls-sec:not(.top){flex:0 1 auto;gap:calc(22px*var(--s));padding:0}'+
'.pv-w .ls .ls-sec:not(.top) .ls-h{font-size:37.2px;padding-bottom:16px;border-bottom-width:5px;gap:24px}'+
'.pv-w .ls .ls-sec.top .ls-h{font-size:34.8px;padding-bottom:14px;border-bottom:5px solid #1C2A4A;margin-bottom:16px}'+
'.pv-w .ls .ls-sec.top .ls-h i{font-size:16.8px}'+
'.pv-w .ls .ls-sec.top .ls-sm{font-size:calc(15.6px*var(--s))}'+
'.pv-w .ls .ls-sec:not(.top) .ls-h i{font-size:18px;min-width:66px;height:66px}'+
'.pv-w .ls .ls-sec:not(.top) .ls-b{justify-content:flex-start}'+
'.pv-w .ls .ls-sec,.pv-w .ls ol.items li{border-left:0}'+
'.pv-w .ls .ls-sec:not(.top) ol.items{flex:none;justify-content:flex-start}'+
'.pv-w .ls .ls-sec ol.items li{font-size:calc(24px*var(--s));padding:calc(11px*var(--s)) 0 calc(11px*var(--s)) calc(76px*var(--s))}'+
'.pv-w .ls .ls-sec ol.items li::before{font-size:calc(18px*var(--s))!important}'+
'.pv-w .ls .ls-sec ol.items li small{font-size:calc(16.8px*var(--s))}'+
'.pv-w .ls .ls-sec .hl{font-size:calc(21.6px*var(--s));margin-left:calc(76px*var(--s));padding:calc(20px*var(--s)) calc(30px*var(--s))}'+
'.pv-w .ls .ls-sec .msg{font-size:calc(25.2px*var(--s))}'+
'.pv-w .ls .ls-sec .msg i{font-size:calc(21.6px*var(--s))}'+
'.pv-w .ls .ls-sec .ls-b img{max-height:calc(420px*var(--s));width:auto;max-width:100%;object-fit:contain}'+
/* ── 사진 한 장 화면(시험지 부착 위치) ── */
'.pv-ph{padding:40px 60px 34px;display:flex;flex-direction:column;gap:16px}'+
'.pv-ph .h{flex:none;display:flex;align-items:center;gap:20px;border-bottom:4px solid #1C2A4A;padding-bottom:12px}'+
'.pv-ph .h h2{font-family:inherit;font-size:32.4px;font-weight:800;margin:0;color:#1C2A4A}'+
'.pv-ph .note{flex:none;background:#FFF6D6;border-radius:16px;padding:12px 24px;font-size:16.8px;font-weight:800;text-align:center}'+
'.pv-ph .lab{flex:none;font-size:19.2px;font-weight:800;display:flex;align-items:center;gap:14px}'+
'.pv-ph .lab .tp-b{display:inline-grid;place-items:center;width:46px;height:46px;border-radius:50%;font-size:15.6px}'+
'.pv-ph .pic{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}'+
'.pv-ph .pic img{max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;box-shadow:0 4px 18px rgba(30,50,110,.15)}'+
'.c1{background:#FDE2E4;color:#9A2E3E}.c2{background:#FFF0BD;color:#7A5B00}.c3{background:#D9F3E6;color:#1F6B4A}.c4{background:#E2ECFF;color:#2E4FA6}'+
/* ── Self-test 4칸 접기: 클릭할 때마다 한 칸씩(신규생 안내의 Self-test 와 같은 방식) ── */
'.pv-st{padding:38px 56px 30px;display:flex;flex-direction:column}'+
'.pv-st .h{flex:none;display:flex;align-items:center;gap:14px;border-bottom:2px solid #1C2A4A;padding-bottom:12px}'+
'.pv-st .h .n:empty{display:none}.pv-st .h .n{background:#FDE2E4;color:#9A2E3E;border-radius:50%;width:40px;height:40px;display:grid;place-items:center;font-size:18px;font-weight:800}'+
'.pv-st .h h2{font-family:inherit;font-size:31px;font-weight:800;margin:0;letter-spacing:-.02em}'+
'.pv-st .h .sub{margin-left:auto;font-size:17px;font-weight:700;color:#8A95B8}'+
'.pv-st .lead{font-size:20px;font-weight:700;margin:18px 0 0;line-height:1.5}.pv-st .lead em{font-style:normal;color:#D23B3B}'+
'.pv-stg{margin-top:24px;display:grid;grid-template-columns:repeat(4,1fr);border:2px solid #1C2A4A;border-radius:14px;overflow:hidden;height:340px;flex:none}'+
'.pv-gc{padding:12px 16px;border-right:1.5px dashed #C9D3EE;position:relative}.pv-gc:last-child{border-right:0}'+
'.pv-gc .hh{font-size:15px;font-weight:800;color:#2E4FA6;margin-bottom:6px;display:block}'+
'.pv-gc .w{display:block;font-size:24px;line-height:1.7;font-weight:700;white-space:nowrap}'+
'.pv-gc .w::after{content:"\\25CB";color:#E0304F;font-size:16px;margin-left:6px}'+
'.pv-gc .w.bad{color:#8A95B8;text-decoration:line-through 2px #E0304F}.pv-gc .w.bad::after{content:"\\2715"}'+
'.pv-gc .fx{display:block;color:#E0304F;font-weight:800;font-size:15px;margin:-4px 0 2px}'+
'.pv-gc.hidden{background:repeating-linear-gradient(135deg,#F1F4FC 0 6px,#E3E9F7 6px 7px)}.pv-gc.hidden>*{visibility:hidden}'+
'.pv-gc.blank .w,.pv-gc.blank .fx{visibility:hidden}'+
'.pv-gc.now{box-shadow:inset 0 0 0 4px #FFD36E;animation:pvPulse .5s}'+
'@keyframes pvPulse{0%{transform:scale(.96)}60%{transform:scale(1.02)}100%{transform:scale(1)}}'+
'.pv-st .cap{margin-top:28px;background:#EEF3FF;border-radius:14px;padding:16px 24px;font-size:20px;font-weight:700;line-height:1.5}.pv-st .cap b{color:#2E4FA6}'+
'.pv-st .tabs{margin-top:26px;display:flex;align-items:center;gap:8px}'+
'.pv-st .tabs span{font-size:16px;font-weight:800;border-radius:999px;padding:6px 16px;background:#EEF1F8;color:#8A95B8;cursor:pointer}'+
'.pv-st .tabs span.on{background:#2E4FA6;color:#fff}.pv-st .tabs .hint{margin-left:auto;background:none;color:#8A95B8;font-weight:700;cursor:default}'+
/* ── 통째로 줄여 넣은 쪽(fallback) ── */
'.pv-fb{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#fff}'+
/* ── 막대 · 쪽수 · 버튼 ── */
'.pv-bar{position:absolute;left:0;bottom:0;height:8px;background:linear-gradient(90deg,#5A86E8,#FFB347);width:0;transition:width .5s ease;z-index:5}'+
'.pv-top{position:absolute;left:78px;top:12px;font-size:18px;font-weight:800;color:#5A6B95;z-index:5;opacity:.85}'+
'.pv-cnt{position:absolute;right:78px;top:12px;font-size:18px;font-weight:800;color:#5A6B95;z-index:5;opacity:.85}'+
'.pv-nav{position:absolute;top:50%;width:64px;height:64px;margin-top:-32px;border-radius:50%;border:0;background:rgba(30,50,110,.55);color:#fff;font-size:34px;font-weight:800;cursor:pointer;z-index:6;opacity:0;transition:opacity .3s}'+
'#pv:not(.idle) .pv-nav{opacity:.8}'+
'.pv-nav:hover{opacity:1 !important;background:rgba(30,50,110,.8)}'+
'.pv-nav.l{left:6px}.pv-nav.r{right:6px}'+
'.pv-x{position:absolute;right:14px;top:6px;width:46px;height:46px;border-radius:50%;border:0;background:rgba(30,50,110,.55);color:#fff;font-size:22px;font-weight:800;cursor:pointer;z-index:7;opacity:0;transition:opacity .3s}'+
'#pv:not(.idle) .pv-x{opacity:.8}'+
'.pv-help{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);background:rgba(20,30,70,.78);color:#fff;border-radius:999px;padding:8px 22px;font-size:20px;font-weight:700;z-index:8;transition:opacity .6s;white-space:nowrap}';

function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function strip(n){[].forEach.call(n.querySelectorAll('[contenteditable]'),function(e){e.removeAttribute('contenteditable');});[].forEach.call(n.querySelectorAll('[data-ui]'),function(e){e.remove();});return n;}

/* 넘치는지 보는 칸들 — 화면 높이(720)보다 내용이 길면 글자를 줄인다 */
var OVER='.ls-all,.ls-sec,.ls-b,.wp-body,.wp-band,.wp-bb,.w2-col,.pv-2,.pv-2>div,.ev-rows,.ev-r,.ev-tl,.pv-tcols,.pv-tcol,.pv-tr';
function over(s){
  if(s.scrollHeight>s.clientHeight+1||s.scrollWidth>s.clientWidth+1)return true;
  if([].some.call(s.querySelectorAll('.ev-ds,.ev-ds .bl,.w2-v,.w2-ol li,.ls-b li,.msg,.hl'),function(p){return p.scrollWidth>p.clientWidth+1;}))return true;
  return [].some.call(s.querySelectorAll(OVER),function(p){return p.scrollHeight>p.clientHeight+1;});
}
/* 안 넘치는 가장 큰 글자 크기를 이진탐색으로 찾는다. 반환값: 그 크기(lo), 최소로도 넘치면 최소값 */
function fit(s,min,max){
  var lo=min,hi=max;
  s.style.setProperty('--s',max);
  if(!over(s))return max;
  for(var i=0;i<13;i++){var m=(lo+hi)/2;s.style.setProperty('--s',m);if(over(s))hi=m;else lo=m;}
  s.style.setProperty('--s',lo*0.94);
  return lo;
}

/* 화면 한 장: 카드 안에 1280×720 짜리 슬라이드를 넣는다 */
function mk(slide,opt){
  opt=opt||{};
  var sc=el('div','pv-sc'+(opt.cls?' '+opt.cls:''));
  var card=el('div','pv-card');
  var fitbox=el('div','pv-fit'),w=el('div','pv-w');
  w.appendChild(slide);fitbox.appendChild(w);card.appendChild(fitbox);sc.appendChild(card);
  return sc;
}
function measureBox(){
  var m=document.getElementById('pvMeasure');
  if(!m){m=el('div');m.id='pvMeasure';m.style.cssText='position:fixed;left:-20000px;top:0;width:'+W+'px;height:'+H+'px;visibility:hidden;pointer-events:none';document.body.appendChild(m);}
  return m;
}
/* 측정용 영역에서 글자 크기를 맞춘 뒤 무대로 옮긴다 */
function finish(sc,slide,min,max,anim){
  var m=measureBox();
  m.appendChild(sc);
  var fitbox=sc.querySelector('.pv-fit');fitbox.style.transform='none';
  if(slide&&max)fit(slide,min,max);
  fitbox.style.transform='';
  if(slide&&max)sc._refit=function(){var fb=sc.querySelector('.pv-fit');fb.style.transform='none';fit(slide,min,max);fb.style.transform='';};
  /* 나타나는 순서: 제목 → 항목들 */
  var i=0;
  (anim||[]).forEach(function(sel){[].forEach.call(sc.querySelectorAll(sel),function(n){n.classList.add('pv-a');n.style.setProperty('--i',i++);});});
  m.removeChild(sc);
  SC.push(sc);
}

/* ── 종류별로 화면 만들기 ── */
var ANIM_HEAD='.w2-head,.ev-head,.tm-h,.ls-h,.h,.note,.wp-ph';
function coverScreen(s){
  var en=s.querySelector('.en'),h1=s.querySelector('h1'),cn=s.querySelector('.cls-name');
  var mid=s.classList.contains('mid'),end=s.classList.contains('end');
  var sc=el('div','pv-sc cv'),card=el('div','pv-card'),cv=el('div','pv-cv'+(mid?' mid':'')+(end?' end':''));
  var star=function(x,y,sz,d){return '<svg class="st" style="left:'+x+';top:'+y+';animation-delay:'+d+'s" width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24"><path d="M12 1v22M1 12h22M4.2 4.2l15.6 15.6M19.8 4.2 4.2 19.8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';};
  cv.innerHTML=star('8%','12%',90,0)+star('88%','18%',64,1)+star('80%','78%',80,.6)+star('12%','72%',56,1.6)+
    '<div class="br">JLS 정상어학원</div><div class="pv-in"><div class="en">'+(en?en.innerHTML:'')+'</div><h1>'+(h1?h1.innerHTML:'')+'</h1>'+(cn&&!mid&&!end?'<div class="cls">'+cn.innerHTML+'</div>':'')+'</div>';
  card.appendChild(cv);sc.appendChild(card);
  SC.push(sc);
}
function timeScreen(s){
  var days=[].map.call(s.querySelectorAll('.md'),function(md){
    return {d:(md.querySelector('.md-d')||{}).textContent||'',rows:[].map.call(md.querySelectorAll('.md-pr'),function(pr){
      var t=pr.querySelector('.md-t'),sm=t&&t.querySelector('small'),tx=t?t.cloneNode(true):null;
      if(tx){var q=tx.querySelector('small');if(q)q.remove();}
      return {t:tx?tx.textContent.trim():'',tm:sm?sm.textContent.trim():'',s:(pr.querySelector('.md-s')||{}).textContent||'',k:(pr.querySelector('.md-k')||{}).textContent||''};
    })};
  });
  if(!days.length)return false;
  var n=s.querySelector('.tm-hd .n'),h=s.querySelector('.tm-hd h2');
  var sl=el('section','ot-slide pv-time');
  sl.innerHTML='<div class="tm-h"><span class="n">'+(n?n.innerHTML:'01')+'</span><h2>'+(h?h.innerHTML:'수업 시간표')+'</h2></div>'+
   '<div class="pv-tcols" style="--n:'+days.length+'">'+days.map(function(d){
     return '<div class="pv-tcol"><div class="d">'+d.d+'</div>'+d.rows.map(function(r){
       return '<div class="pv-tr"><div class="t">'+r.t+(r.tm?'<small>'+r.tm+'</small>':'')+'</div><div class="s">'+r.s+'</div><div class="k">'+r.k+'</div></div>';}).join('')+'</div>';}).join('')+'</div>';
  var sc=mk(sl);finish(sc,sl,0.5,1.15,[ANIM_HEAD,'.pv-tcol']);
  /* 칸 안 줄도 차례로 */
  return true;
}
function wkpScreens(s){
  var head=s.querySelector('.w2-head'),bands=[].slice.call(s.querySelectorAll('.wp-band'));
  var made=0;
  bands.forEach(function(b){
    var cols=[].slice.call(b.querySelectorAll('.w2-col'));
    cols.forEach(function(c){
      var sl=el('section','ot-slide port wkp');sl.setAttribute('data-seg','pv');
      sl.appendChild(head.cloneNode(true));
      var body=el('div','wp-body'),band=el('div','wp-band');
      var ph=b.querySelector('.wp-ph');if(ph)band.appendChild(ph.cloneNode(true));
      var bb=el('div','wp-bb'),col=c.cloneNode(true);
      /* 왼쪽(교재·범위 …) / 오른쪽(과제) 두 칸으로 나눈다. 과제가 없으면 한 칸 */
      var kids=[].slice.call(col.children),sub=kids.filter(function(k){return k.classList.contains('w2-sub');})[0];
      var hw=-1;kids.forEach(function(k,i){if(hw<0&&k.classList.contains('w2-hwl'))hw=i;});
      var two=el('div','pv-2'+(hw<0?' one':'')),L=el('div','pv-l'),R=el('div','pv-r');
      kids.forEach(function(k,i){if(k===sub)return;(hw>=0&&i>=hw?R:L).appendChild(k);});
      col.innerHTML='';if(sub)col.appendChild(sub);
      two.appendChild(L);if(hw>=0)two.appendChild(R);col.appendChild(two);
      bb.appendChild(col);band.appendChild(bb);body.appendChild(band);sl.appendChild(body);
      strip(sl);
      var sc=mk(sl);finish(sc,sl,0.45,1.3,[ANIM_HEAD,'.w2-sub','.w2-row','.w2-hwl','.w2-ol li','.w2-ref']);made++;
    });
  });
  return made>0;
}
function evScreens(s){
  var rows=[].slice.call(s.querySelectorAll('.ev-r'));
  var hasTl=!!s.querySelector('.ev-tl');
  function base(){
    var sl=s.cloneNode(true);strip(sl);sl.removeAttribute('style');
    [].forEach.call(sl.querySelectorAll('.ev-r'),function(r){r.remove();});
    return sl;
  }
  function build(list,withTl){
    var sl=base();
    var rowsBox=sl.querySelector('.ev-rows');
    if(!withTl){var tl=sl.querySelector('.ev-tl');if(tl)tl.remove();}
    if(list.length){if(!rowsBox){rowsBox=el('div','ev-rows');sl.appendChild(rowsBox);}list.forEach(function(r){rowsBox.appendChild(r.cloneNode(true));});}
    else if(rowsBox)rowsBox.remove();
    return sl;
  }
  /* 한 화면에 안 들어가면(최소 글자 0.8배) 반으로 나눠 여러 화면으로 */
  function place(list,withTl){
    var sl=build(list,withTl),sc=mk(sl),m=measureBox();m.appendChild(sc);
    var fb=sc.querySelector('.pv-fit');fb.style.transform='none';
    var v=fit(sl,0.5,1.15);fb.style.transform='';m.removeChild(sc);
    if(v<0.8&&list.length>1){var h=Math.ceil(list.length/2);place(list.slice(0,h),withTl);place(list.slice(h),false);return;}
    finish(sc,sl,0.5,1.15,[ANIM_HEAD,'.ev-lab','.ev-bar>div','.ev-all','.ev-r']);
  }
  if(hasTl){place([],true);place(rows,false);}   // 첫 화면은 '한 학기 흐름', 그 뒤로 시험별 설명
  else place(rows,false);
  return true;
}
/* Self-test 4칸 접기 — 한 번 클릭할 때마다 한 칸씩 나타난다(앞 칸은 가려짐). 단어는 신규생 안내와 같은 예시 */
var ST_W=[['사과','apple'],['빌리다','borrow'],['용감한','brave'],['도서관','library']];
var ST_CAP=['단어책을 보면서 <b>1칸에 뜻</b>을 적고, 다 적으면 바로 채점(○)해요.','1칸을 가리고 <b>2칸에 영어</b>를 써요. 쓰자마자 채점! 틀린 단어는 다시 확인해요.','1~2칸을 가리고 2칸의 영어만 보면서 <b>3칸에 뜻</b>을 써요.','1~3칸을 가리고 <b>4칸에 영어</b>를 써요. 아까 틀린 단어도 이번엔 맞게!'];
function isSelfTest(sec){var h=sec.querySelector('.ls-h');return !!h&&/Self-test/i.test(h.textContent)&&/4칸/.test(sec.textContent);}
function stScreen(sec){
  var h=sec.querySelector('.ls-h'),n=h.querySelector('i'),sm=h.querySelector('.ls-sm');
  var hc=h.cloneNode(true);[].forEach.call(hc.querySelectorAll('i,.ls-sm'),function(x){x.remove();});
  var sl=el('section','ot-slide pv-st');
  sl.innerHTML='<div class="h"><span class="n">'+(n?n.innerHTML:'')+'</span><h2>'+hc.innerHTML+'</h2><span class="sub">'+(sm?sm.textContent:'공책 4칸 접기')+'</span></div>'+
    '<p class="lead">보지 않고 <em>직접 써 보는 것</em>이 핵심! 한 칸 쓰고 <em>바로 채점</em>, 그다음 칸으로.</p><div class="pv-stg"></div><div class="cap"></div>'+
    '<div class="tabs">'+['1칸 뜻','2칸 영어','3칸 뜻','4칸 영어'].map(function(t,i){return '<span class="pv-tab" data-j="'+i+'">'+t+'</span>';}).join('')+'<span class="hint"></span></div>';
  var sc=mk(sl);
  sc._steps=4;sc._step=0;
  sc._render=function(){
    var st=sc._step;
    sl.querySelector('.pv-stg').innerHTML=[0,1,2,3].map(function(c){
      var ko=c%2===0,cls=c===st?'now':c===st-1?'show':c<st?'hidden':'blank';
      return '<div class="pv-gc '+cls+'"><span class="hh">'+(c+1)+'칸 · '+(ko?'뜻':'영어')+'</span>'+ST_W.map(function(w,i){
        return (c===1&&i===1)?'<span class="w bad">borow</span><span class="fx">→ borrow</span>':'<span class="w">'+(ko?w[0]:w[1])+'</span>';}).join('')+'</div>';}).join('');
    sl.querySelector('.cap').innerHTML=ST_CAP[st];
    [].forEach.call(sl.querySelectorAll('.pv-tab'),function(b,i){b.classList.toggle('on',i===st);});
    sl.querySelector('.hint').textContent=st<3?'클릭하면 다음 칸 ▶  ('+(st+1)+' / 4)':'클릭하면 다음 화면 ▶  (4 / 4)';
  };
  sc._render();
  finish(sc,null,0,0,['.h','.lead','.pv-stg','.cap','.tabs']);
}
function lsScreens(s){
  var secs=[].slice.call(s.querySelectorAll('.ls-sec'));
  if(!secs.length)return false;
  secs.forEach(function(sec){
    if(isSelfTest(sec)){stScreen(sec);return;}
    var phs=[].slice.call(sec.querySelectorAll('.tp-ph'));
    if(s.classList.contains('tp')&&phs.length){          // 시험지 부착 위치: 사진 한 장당 한 화면
      var ttl=(sec.querySelector('.ls-h')||{}).textContent||'시험지 부착 위치',note=sec.querySelector('.tp-note');
      phs.forEach(function(p){
        var img=p.querySelector('img'),lab=p.querySelector('.tp-t');
        var sl=el('section','ot-slide pv-ph');
        sl.innerHTML='<div class="h"><h2>'+ttl+'</h2></div>'+(note?'<div class="note">'+note.innerHTML+'</div>':'')+(lab?'<div class="lab">'+lab.innerHTML+'</div>':'')+'<div class="pic">'+(img?'<img src="'+img.getAttribute('src')+'" alt="">':'')+'</div>';
        var sc=mk(sl);finish(sc,null,0,0,['.h','.note','.lab','.pic']);
      });
      return;
    }
    var mkSl=function(src,noImg){
      var sl=el('section',s.className);
      var all=el('div','ls-all'),cl=src.cloneNode(true);
      if(noImg)[].forEach.call(cl.querySelectorAll('img'),function(i){i.remove();});
      all.appendChild(cl);sl.appendChild(all);strip(sl);return sl;
    };
    var sl=mkSl(sec,false),imgs=[].slice.call(sec.querySelectorAll('.ls-b img'));
    /* 사진이 글과 같이 한 화면에 들어가면 글자가 너무 작아진다(화면 캡처 예시 등) — 그럴 땐 글 화면 + 사진 화면으로 나눈다.
       QR 단어장(.vq)처럼 사진이 내용 자체인 쪽은 그대로 둔다. */
    if(imgs.length&&!s.classList.contains('vq')){
      var t=mk(sl),m=measureBox();m.appendChild(t);t.querySelector('.pv-fit').style.transform='none';
      var v=fit(sl,0.3,1.15);m.removeChild(t);
      if(v<0.62){
        var tsl=mkSl(sec,true);
        var sc0=mk(tsl);finish(sc0,tsl,0.3,1.15,['.ls-h','.items li','.hl','.msg','.ls-b p']);
        var th=sec.querySelector('.ls-h'),thc=th?th.cloneNode(true):null;if(thc)[].forEach.call(thc.querySelectorAll('i'),function(i){i.remove();});var ttl=thc?thc.innerHTML:'';
        imgs.forEach(function(im){
          var pl=el('section','ot-slide pv-ph');
          pl.innerHTML='<div class="h"><h2>'+ttl+'</h2></div><div class="pic"><img src="'+im.getAttribute('src')+'" alt="'+(im.getAttribute('alt')||'').replace(/"/g,'')+'"></div>';
          var scp=mk(pl);finish(scp,null,0,0,['.h','.pic']);
        });
        return;
      }
      sl=mkSl(sec,false);
    }
    var sc=mk(sl);finish(sc,sl,0.3,1.15,['.ls-h','.items li','.hl','.msg','.ls-b img','.ls-b p']);
  });
  return true;
}
/* 모르는 모양: 쪽 전체를 줄여서 한 화면에 */
function fallbackScreen(s){
  var sc=el('div','pv-sc'),card=el('div','pv-card'),fb=el('div','pv-fb');
  var w=el('div');w.className='wrap';w.style.cssText='width:794px;max-width:none;padding:0;margin:0;container-type:inline-size';
  var cl=s.cloneNode(true);strip(cl);cl.style.margin='0';cl.style.maxWidth='none';
  w.appendChild(cl);
  var k=Math.min(1008/(cl.classList.contains('full')?Math.max(1,s.offsetHeight):1123),1792/794);
  var box=el('div');box.style.cssText='width:794px;transform:scale('+Math.min(k,1.4)+');transform-origin:center center;flex:none';
  box.appendChild(w);fb.appendChild(box);card.appendChild(fb);sc.appendChild(card);
  var m=measureBox();m.appendChild(sc);m.removeChild(sc);
  sc.classList.add('fb');SC.push(sc);
}

function build(){
  SC=[];
  var slides=[].slice.call(document.querySelectorAll('#root .ot-slide'));
  slides.forEach(function(s){
    var ok=false;
    try{
      if(s.classList.contains('cover')){coverScreen(s);ok=true;}
      else if(s.classList.contains('tm2')||s.classList.contains('time'))ok=timeScreen(s);
      else if(s.classList.contains('wkp'))ok=wkpScreens(s);
      else if(s.classList.contains('ev'))ok=evScreens(s);
      else if(s.classList.contains('ls'))ok=lsScreens(s);
    }catch(e){ok=false;if(window.console)console.warn('발표 화면 변환 실패 — 통째로 보여줌',e);}
    if(!ok)fallbackScreen(s);
  });
}

/* ── 보여주기 ── */
function show(i,dir){
  if(i<0||i>=SC.length)return;
  var prev=SC[IDX];
  STAGE.classList.toggle('pv-back',dir<0);
  if(prev&&prev!==SC[i]&&prev.classList.contains('on')){prev.classList.remove('on');prev.classList.add('out');(function(p){setTimeout(function(){p.classList.remove('out');},520);})(prev);}
  IDX=i;
  var cur=SC[i];cur.classList.remove('out');
  if(cur._steps){cur._step=dir<0?cur._steps-1:0;cur._render();}
  if(cur._refit)cur._refit();
  /* 같은 화면을 다시 보면 애니메이션이 처음부터 돌도록 한 번 껐다 켠다 */
  cur.classList.remove('on');void cur.offsetWidth;cur.classList.add('on');
  var bar=STAGE.querySelector('.pv-bar');bar.style.width=((i+1)/SC.length*100)+'%';
  STAGE.querySelector('.pv-cnt').textContent=(i+1)+' / '+SC.length;
}
function next(){var c=SC[IDX];if(c&&c._steps&&c._step<c._steps-1){c._step++;c._render();return;}if(IDX<SC.length-1)show(IDX+1,1);}
function prev(){var c=SC[IDX];if(c&&c._steps&&c._step>0){c._step--;c._render();return;}if(IDX>0)show(IDX-1,-1);}
function scale(){
  var k=Math.min(window.innerWidth/1920,window.innerHeight/1080);
  STAGE.style.setProperty('--k',k);
}
var idleT=null;
function wake(){
  ROOT.classList.remove('idle');clearTimeout(idleT);
  idleT=setTimeout(function(){ROOT.classList.add('idle');},2600);
}
function key(e){
  if(!ROOT||!ROOT.classList.contains('on'))return;
  var k=e.key;
  if(k==='ArrowRight'||k==='ArrowDown'||k===' '||k==='PageDown'||k==='Enter'){e.preventDefault();next();}
  else if(k==='ArrowLeft'||k==='ArrowUp'||k==='PageUp'||k==='Backspace'){e.preventDefault();prev();}
  else if(k==='Home'){e.preventDefault();show(0,-1);}
  else if(k==='End'){e.preventDefault();show(SC.length-1,1);}
  else if(k==='Escape'){stop();}
  wake();
}
var tx=null;
function stop(){
  if(!ROOT)return;
  ROOT.classList.remove('on');
  document.body.style.overflow='';
  clearTimeout(idleT);
  try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}
}
function start(){
  if(typeof EDIT!=='undefined'&&EDIT){alert('수정 중에는 발표를 켤 수 없어요. 저장하거나 취소한 뒤에 눌러 주세요.');return;}
  if(!document.querySelector('#root .ot-slide')){alert('보여줄 슬라이드가 없어요');return;}
  if(!document.getElementById('pvCss')){var st=el('style');st.id='pvCss';st.textContent=CSS;document.head.appendChild(st);}
  if(!ROOT){
    ROOT=el('div');ROOT.id='pv';
    STAGE=el('div','pv-stage');
    ROOT.appendChild(STAGE);document.body.appendChild(ROOT);
    ROOT.addEventListener('mousemove',wake);
    ROOT.addEventListener('click',function(e){
      var tb=e.target.closest('.pv-tab');if(tb){var c=SC[IDX];if(c&&c._steps){c._step=+tb.getAttribute('data-j');c._render();}return;}
      if(e.target.closest('.pv-nav,.pv-x'))return;
      if(e.clientX<window.innerWidth*0.3)prev();else next();wake();
    });
    ROOT.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
    ROOT.addEventListener('touchend',function(e){if(tx==null)return;var dx=e.changedTouches[0].clientX-tx;tx=null;if(Math.abs(dx)>50){if(dx<0)next();else prev();}});
    document.addEventListener('keydown',key);
    window.addEventListener('resize',function(){if(STAGE)scale();});
    document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement&&ROOT.classList.contains('on')){/* 전체화면만 풀렸을 때는 발표 화면은 유지 */}});
  }
  var go=function(){
    STAGE.innerHTML='<i class="pv-blob pv-b1"></i><i class="pv-blob pv-b2"></i><i class="pv-blob pv-b3"></i>';
    build();
    SC.forEach(function(sc){STAGE.appendChild(sc);});
    STAGE.insertAdjacentHTML('beforeend','<div class="pv-top"></div><div class="pv-cnt"></div><div class="pv-bar"></div>'+
      '<button class="pv-nav l" title="이전">‹</button><button class="pv-nav r" title="다음">›</button><button class="pv-x" title="닫기 (Esc)">✕</button>'+
      '<div class="pv-help">← → 키 · 화면 클릭으로 넘겨요 · Esc 로 나가기</div>');
    STAGE.querySelector('.pv-top').textContent=(document.getElementById('hTitle')||{}).textContent?('진급 OT 안내 · '+document.getElementById('hTitle').textContent+(typeof DAY!=='undefined'&&DAY?' '+(DAY==='mwf'?'월수금':'화목'):'')):'진급 OT 안내';
    STAGE.querySelector('.pv-nav.l').onclick=function(e){e.stopPropagation();prev();};
    STAGE.querySelector('.pv-nav.r').onclick=function(e){e.stopPropagation();next();};
    STAGE.querySelector('.pv-x').onclick=function(e){e.stopPropagation();stop();};
    setTimeout(function(){var h=STAGE.querySelector('.pv-help');if(h)h.style.opacity=0;},4500);
    scale();IDX=0;SC.forEach(function(s){s.classList.remove('on','out');});
    ROOT.classList.add('on');document.body.style.overflow='hidden';
    try{var p=ROOT.requestFullscreen&&ROOT.requestFullscreen();if(p&&p.catch)p.catch(function(){});}catch(e){}
    show(0,1);wake();
  };
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go);else go();
}
window.startPresent=start;
})();
