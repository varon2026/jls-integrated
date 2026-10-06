/* 신입생 안내 페이지 — 공개 뷰어(guide.html)와 편집기(guide-app)가 같이 쓰는 그리기 코드.
   둘이 따로 관리되면 "편집 화면이랑 학부모님이 보는 화면이 다르다"는 문제가 또 생기므로,
   화면을 그리는 부분은 반드시 여기 한 곳에만 둔다. */

function escG(s){return (s||'').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}

/* 저작권 있는 그림을 베끼지 않고, 아주 단순한 기하학 눈꽃 장식만 그린다 */
function heroDeco(pos, size, small){
  var s = small ? 16 : 26;
  size = size || s;
  return '<svg class="deco" style="'+pos+'" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" aria-hidden="true">'+
    '<path d="M12 1v22M1 12h22M4.2 4.2l15.6 15.6M19.8 4.2 4.2 19.8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
}

var GUIDE_TABS = [
  {k:'parent', label:'학부모', sub:'가입·결제·앱'},
  {k:'student',label:'학생', sub:'과제·단어'},
  {k:'exam',   label:'시험', sub:'재시험·STaRT'},
  {k:'life',   label:'학원 생활', sub:'특강·시상'}
];

/* rootEl 안에 히어로 + 탭바 + 4개 빈 패널을 그린다 (내용은 이후 splitIntoTabs로 채운다) */
function buildGuideShell(rootEl, name, heroImageUrl){
  var heroArt = heroImageUrl
    ? '<img class="g-hero-img" src="'+escG(heroImageUrl)+'" alt="">'
    : heroDeco('left:6%;top:18px',30)+heroDeco('right:8%;top:60px',22)+
      heroDeco('right:16%;top:14px',16,true)+heroDeco('left:14%;top:70px',14,true);

  var tabsHtml = GUIDE_TABS.map(function(t,i){
    return '<button data-tab="'+t.k+'" class="'+(i===0?'on':'')+'">'+escG(t.label)+'<span>'+escG(t.sub)+'</span></button>';
  }).join('');

  var panelsHtml = GUIDE_TABS.map(function(t,i){
    return '<div class="g-panel'+(i===0?' on':'')+'" id="g-panel-'+t.k+'"></div>';
  }).join('');

  rootEl.innerHTML =
    '<div class="g-hero" id="g-hero-box">'+heroArt+
      '<span class="brand">'+escG(name)+' JLS</span>'+
      '<div class="welcome">Welcome to JLS!</div>'+
      '<h1 class="g-disp">신입생 안내</h1>'+
      '<p>처음 학원을 이용하시는 학부모님과 학생들을 위한 안내입니다. 아래 탭에서 필요한 내용을 골라 보세요.</p>'+
      '<div class="g-quick">'+
        '<button data-goto="parent">무엇부터 해야 하지?</button>'+
        '<button data-goto="student">숙제는 어디서 하지?</button>'+
        '<button data-goto="exam">시험은 언제 보지?</button>'+
        '<button data-goto="exam">재시험은 어떻게 하지?</button>'+
      '</div>'+
      '<div class="g-hero-chars" aria-hidden="true">'+
        '<span class="c" style="background:#FFB3B5"><b class="e"><i></i><i></i></b></span>'+
        '<span class="c y" style="background:#F9EDB0"><b class="e"><i></i><i></i></b></span>'+
        '<span class="c p" style="background:#C0A3D8"><b class="e"><i></i><i></i></b></span>'+
        '<span class="c spiky" style="background:#E8693A"><b class="e"><i></i><i></i></b></span>'+
      '</div>'+
      '</div>'+
    '<nav class="g-tabs"><div class="g-tabs-inner">'+tabsHtml+'</div></nav>'+
    '<div class="g-wrap">'+panelsHtml+'</div>'+
    '<div class="g-footer">'+escG(name)+' JLS</div>';

  wireTabs(rootEl);
}

/* 사진 클릭하면 크게 보기 (라이트박스). 공개 페이지·편집 화면 둘 다에서 쓴다. */
function wireLightbox(rootEl){
  rootEl.addEventListener('click', function(e){
    var img = e.target.closest && e.target.closest('.g-img, .g-carousel img');
    if(!img) return;
    openLightbox(img.src);
  });
}
function openLightbox(src){
  var box = document.getElementById('g-lightbox');
  if(!box){
    box = document.createElement('div');
    box.id = 'g-lightbox';
    box.className = 'g-lightbox';
    box.innerHTML = '<button class="g-lightbox-close" onclick="closeLightbox()">✕</button><img id="g-lightbox-img" src="">';
    box.addEventListener('click', function(e){ if(e.target===box) closeLightbox(); });
    document.body.appendChild(box);
  }
  document.getElementById('g-lightbox-img').src = src;
  box.classList.add('show');
}
function closeLightbox(){
  var box = document.getElementById('g-lightbox');
  if(box) box.classList.remove('show');
}
window.closeLightbox = closeLightbox;

/* 옆으로 넘기면서 보는 사진첩(점 표시). 사진 여러 장을 하나의 g-carousel로 묶어 쓴다.
   HTML 구조: <div class="g-carousel"><div class="g-carousel-track">
   <img class="g-img">...여러 장...</div><div class="g-carousel-dots"></div></div> */
function wireCarousels(rootEl){
  rootEl.querySelectorAll('.g-carousel').forEach(function(car){
    if(car.dataset.wired) return;
    car.dataset.wired = '1';
    var track = car.querySelector('.g-carousel-track');
    var dotsWrap = car.querySelector('.g-carousel-dots');
    if(!track || !dotsWrap) return;
    var imgs = track.querySelectorAll('img');
    if(dotsWrap.children.length !== imgs.length){
      dotsWrap.innerHTML = '';
      imgs.forEach(function(_, i){
        var d = document.createElement('button');
        d.type = 'button';
        if(i===0) d.className = 'on';
        d.onclick = function(){ imgs[i].scrollIntoView({behavior:'smooth', inline:'center'}); };
        dotsWrap.appendChild(d);
      });
    }
    track.addEventListener('scroll', function(){
      var idx = Math.round(track.scrollLeft / track.clientWidth);
      Array.prototype.forEach.call(dotsWrap.children, function(d,i){ d.classList.toggle('on', i===idx); });
    });
  });
}

/* 학원 생활 — 좋은 예시 캐러셀: ‹ › 화살표로 한 장씩 넘기고, ACE/CHESS 전환 */
function wireBbCarousels(rootEl){
  if(rootEl.dataset.bbWired) return;
  rootEl.dataset.bbWired = '1';
  rootEl.addEventListener('click', function(e){
    var go = e.target.closest('[data-goto]');
    if(go){
      e.preventDefault();
      var tabBtn = rootEl.querySelector('button[data-tab="' + go.dataset.goto + '"]');
      if(tabBtn) tabBtn.click();
      var dest = go.dataset.anchor ? rootEl.querySelector('#' + go.dataset.anchor) : rootEl.querySelector('.g-tabs');
      if(dest) dest.scrollIntoView({behavior:'smooth', block:'start'});
      return;
    }
    var nav = e.target.closest('.g-bb-nav');
    if(nav){
      var track = nav.parentElement.querySelector('.g-bb-track');
      if(track) track.scrollBy({left: (nav.classList.contains('next') ? 1 : -1) * track.clientWidth, behavior:'smooth'});
      return;
    }
    var sw = e.target.closest('.g-bb-switch button');
    if(sw){
      var wrap = sw.closest('.g-bb-switch').parentElement;
      wrap.querySelectorAll('.g-bb-switch button').forEach(function(b){ b.classList.toggle('on', b === sw); });
      wrap.querySelectorAll('.g-bb-carousel').forEach(function(c){ c.hidden = c.dataset.set !== sw.dataset.set; });
    }
  });
}

/* Self-test 4칸 접기 위젯 — 1칸 뜻 → 2칸 영어 → 3칸 뜻 → 4칸 영어, 네 칸을 한
   화면에 나란히 두고 지나온 칸은 접힌(빗금) 모습으로, 지금 칸은 테두리로,
   아직 안 지나온 칸은 빈 칸으로 보여준다. 실제 채점은 학생이 공책에 직접
   한다 — 이 위젯은 "한 칸 쓰고 바로 채점하고 다음 칸으로" 방법을 보여주는
   안내용이라, 2칸(처음 영어 쓰기)에서 한 단어를 일부러 틀리게, 4칸(두 번째
   영어 쓰기)에서는 그 단어를 맞게 보여줘서 "바로 채점→다시 확인" 효과를
   실제로 보여준다.
   버튼에 onclick을 직접 매다는 대신, wireLightbox처럼 rootEl 하나에만 클릭을
   위임해서 듣는다 — splitIntoTabs가 두 번 이상 불려서 패널 innerHTML이
   다시 만들어져도(버튼이 새 DOM 노드로 바뀌어도) rootEl 자체는 그대로라
   리스너가 안 끊긴다. 버튼에 직접 매다는 방식은 실제 배포 사이트에서
   가끔 onclick이 비어있는 채로 나오는 문제가 있었다. */
var ST_TAB_LABELS = ['1칸 뜻','2칸 영어','3칸 뜻','4칸 영어'];
var ST_CAPTIONS = [
  '단어책을 보면서 1칸에 뜻을 적습니다. 다 적으면 단어책과 비교해 맞게 옮겼는지 채점합니다.',
  '1칸을 가리고 뜻만 떠올리며 2칸에 영어를 씁니다. 다 쓰면 바로 채점! 둘째 줄 단어를 틀렸네요 — 발음·뜻·스펠링을 다시 확인한 뒤 다음 칸으로 넘어갑니다.',
  '1~2칸을 가리고 2칸의 영어만 보면서 3칸에 뜻을 씁니다. 다 쓰면 바로 채점합니다.',
  '1~3칸을 가리고 3칸의 뜻만 보면서 4칸에 영어를 씁니다. 채점해 보니 2칸에서 틀렸던 단어를 이번엔 맞게 썼어요 — 이렇게 틀린 단어를 다시 익혀서 다음엔 안 틀리도록 합니다.'
];
var ST_BAD_ROW = 1;
var ST_BAD_TYPO = 'borow';
function stPop(el){
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}
function stColHtml(words, c, step){
  var showKo = (c % 2 === 0);
  /* 지금 칸만 보이는 게 아니라, "바로 직전 칸 + 지금 칸" 두 개가 짝으로 함께
     보인다 — 영어를 쓸 때 바로 앞 뜻 칸을 보면서 써야 하기 때문. 그보다
     앞 칸들은 이미 접어 넘긴 것처럼 가려진다. */
  var state = (c === step) ? 'now' : (c === step - 1) ? 'show' : (c < step) ? 'hidden' : 'blank';
  var rows = words.map(function(w, i){
    var isBadDemo = (c === 1 && i === ST_BAD_ROW);
    if(isBadDemo){
      return '<span class="w bad">'+escG(ST_BAD_TYPO)+'</span><span class="fix">→ '+escG(w.en)+'</span>';
    }
    var text = showKo ? w.ko : w.en;
    return '<span class="w">'+escG(text)+'</span>';
  }).join('');
  return '<div class="g-st-col '+state+'" data-col="'+c+'"><span class="h">'+(c+1)+' '+(showKo?'뜻':'영어')+'</span>'+rows+'</div>';
}
/* 단어 목록을 "씨앗" 상태(<ul class="g-st-words" hidden>)에서 읽는다.
   편집기에서 저장하면 지금 화면에 그려진 DOM이 그대로 저장되는데, 이 위젯은
   스스로 다시 그려 넣는 식이라 자칫 "다 그려진 뒤의 모습"이 저장될 수 있다
   (실제로 한 번 그런 일이 있었다 — data-built="1" 같은 상태값까지 저장돼서,
   다음에 열었을 때 다시 그리질 않고 그 굳어버린 모습 그대로 떴다).
   그래서 씨앗 목록을 매번 새로 그려 넣은 innerHTML 안에도 항상 같이 넣어
   둔다 — 언제 다시 저장되더라도 씨앗이 함께 저장되니 다음에 또 읽을 수 있다.
   혹시 씨앗이 없는 옛날 저장본이면 data-words에 저장해둔 값으로 대신한다. */
function stWords(box){
  var lis = box.querySelectorAll('.g-st-words li');
  if(lis.length) return Array.prototype.map.call(lis, function(li){ return {ko: li.dataset.ko, en: li.dataset.en}; });
  try{ return JSON.parse(box.dataset.words || '[]'); }catch(e){ return []; }
}
function stBuild(box){
  var words = stWords(box);
  box.dataset.words = JSON.stringify(words);
  var seedHtml = '<ul class="g-st-words" hidden>'+words.map(function(w){
    return '<li data-ko="'+escG(w.ko)+'" data-en="'+escG(w.en)+'"></li>';
  }).join('')+'</ul>';
  box.innerHTML = seedHtml +
    '<h4 class="g-st-title">4칸 접기 Self-test 따라하기</h4>'+
    '<div class="g-st-hint"><span class="g-st-tap">👆</span> 좋아요! 한 칸 쓰고 <b>바로 채점</b>, 그다음 칸으로</div>'+
    '<div class="g-st-tabs">'+ST_TAB_LABELS.map(function(l,i){
      return '<button type="button" data-jump="'+i+'"><i>'+(i+1)+'</i>'+l+'</button>';
    }).join('')+'</div>'+
    '<div class="g-st-grid"></div>'+
    '<p class="g-st-cap"></p>'+
    '<div class="g-st-nav"><button type="button" class="g-st-prev">← 이전</button><span class="g-st-prog"></span><button type="button" class="g-st-next">다음 칸 쓰기 →</button></div>';
}
function stRender(box, animate){
  var step = parseInt(box.dataset.step || '0', 10);
  var words = JSON.parse(box.dataset.words || '[]');
  var grid = box.querySelector('.g-st-grid');
  grid.innerHTML = [0,1,2,3].map(function(c){ return stColHtml(words, c, step); }).join('');
  if(animate) stPop(grid.querySelector('[data-col="'+step+'"]'));
  box.querySelector('.g-st-cap').textContent = ST_CAPTIONS[step];
  box.querySelector('.g-st-prog').textContent = (step+1) + ' / 4';
  box.querySelector('.g-st-prev').disabled = (step === 0);
  box.querySelector('.g-st-next').textContent = (step === 3) ? '처음부터 다시 ↺' : '다음 칸 쓰기 →';
  box.querySelectorAll('.g-st-tabs button').forEach(function(b, i){
    b.setAttribute('aria-pressed', i === step ? 'true' : 'false');
  });
}
function wireSelfTest(rootEl){
  rootEl.querySelectorAll('.g-selftest').forEach(function(box){
    /* "한 번 지었으면 다시 안 지음" 식 guard를 일부러 안 둔다 — 매번 씨앗
       목록부터 다시 그려서, 화면에 뭐가 저장돼 있었든 항상 1칸부터 깨끗하게
       시작한다. */
    box.dataset.step = '0';
    stBuild(box);
    stRender(box, false);
  });
  if(rootEl.dataset.stWired) return;
  rootEl.dataset.stWired = '1';
  rootEl.addEventListener('click', function(e){
    var box = e.target.closest && e.target.closest('.g-selftest');
    if(!box) return;
    var step = parseInt(box.dataset.step || '0', 10);
    var jumpBtn = e.target.closest('.g-st-tabs button');
    if(jumpBtn){
      step = parseInt(jumpBtn.dataset.jump, 10);
    } else if(e.target.closest('.g-st-next')){
      step = (step === 3) ? 0 : step + 1;
    } else if(e.target.closest('.g-st-prev')){
      if(step === 0) return;
      step--;
    } else {
      return;
    }
    box.dataset.step = String(step);
    stRender(box, true);
  });
}

function wireTabs(rootEl){
  var btns = rootEl.querySelectorAll('.g-tabs button');
  btns.forEach(function(b){
    b.onclick = function(){
      btns.forEach(function(x){x.classList.remove('on')});
      b.classList.add('on');
      rootEl.querySelectorAll('.g-panel').forEach(function(p){p.classList.remove('on')});
      rootEl.querySelector('#g-panel-'+b.dataset.tab).classList.add('on');
      window.scrollTo(0,0);
    };
  });
}

/* 저장된 하나의 HTML 덩어리를 data-tab 마커 기준으로 4개 패널에 나눠 담는다.
   마커 없는 옛 콘텐츠는 전부 '학부모' 탭으로 (하위호환). */
function splitIntoTabs(rootEl, html){
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var targets = {parent:[], student:[], exam:[], life:[]};
  Array.prototype.forEach.call(tmp.children, function(node){
    var tab = node.getAttribute && node.getAttribute('data-tab');
    if(!tab || !targets[tab]) tab = 'parent';
    targets[tab].push(node.outerHTML);
  });
  Object.keys(targets).forEach(function(k){
    var el = rootEl.querySelector('#g-panel-'+k);
    if(el) el.innerHTML = targets[k].join('');
  });
  wireLightbox(rootEl);
  wireCarousels(rootEl);
  wireSelfTest(rootEl);
  wireBbCarousels(rootEl);
}

/* 편집기 전용: 4개 패널에 나뉜 내용을 다시 하나의 HTML로 합친다 (저장용) */
function joinTabsHtml(rootEl){
  var out = [];
  GUIDE_TABS.forEach(function(t){
    var el = rootEl.querySelector('#g-panel-'+t.k);
    if(!el) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = el.innerHTML;
    Array.prototype.forEach.call(tmp.children, function(node){
      if(node.setAttribute) node.setAttribute('data-tab', t.k);
      out.push(node.outerHTML);
    });
  });
  return out.join('');
}
