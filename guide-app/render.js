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
      '<p>처음 학원을 이용하시는 학부모님과 학생들을 위한 안내입니다. 아래 탭에서 필요한 내용을 골라 보세요.</p></div>'+
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

/* Self-test 4칸 접기 위젯 — 지금 몇 칸째, 뭘 적을 차례인지만 따라가며 보여준다.
   실제 채점은 학생이 공책에 직접 한다(이 위젯은 안내용). */
var ST_LABELS = ['1칸 · 뜻 적기 (단어책 보면서)','2칸 · 영어 적기 (1칸 가리고, 기억으로)','3칸 · 뜻 적기 (2칸까지 가리고)','4칸 · 영어 적기 (3칸까지 가리고)'];
function wireSelfTest(rootEl){
  rootEl.querySelectorAll('.g-selftest').forEach(function(box){
    if(box.dataset.wired) return;
    box.dataset.wired = '1';
    var step = 0;
    var words = box.querySelectorAll('.g-st-words li');
    var stepEl = box.querySelector('.g-st-step');
    var labelEl = box.querySelector('.g-st-label');
    var prevBtn = box.querySelector('.g-st-prev');
    var nextBtn = box.querySelector('.g-st-next');
    /* 클래스를 뗐다 다시 붙여야 같은 애니메이션이 또 돈다(브라우저는 이미 붙어있는
       클래스를 다시 붙이면 무시한다) — 한 프레임 쉬었다가 다시 건다 */
    function pop(el){
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    function render(animate){
      var showKo = (step % 2 === 0);
      words.forEach(function(li){
        li.textContent = showKo ? li.dataset.ko : li.dataset.en;
        if(animate) pop(li);
      });
      stepEl.textContent = (step+1) + ' / 4';
      if(animate) pop(stepEl);
      labelEl.textContent = ST_LABELS[step];
      prevBtn.disabled = (step === 0);
      nextBtn.textContent = (step === 3) ? '처음으로 ↺' : '다음 칸 쓰기 →';
    }
    prevBtn.onclick = function(){ if(step>0){ step--; render(true); } };
    nextBtn.onclick = function(){ step = (step === 3) ? 0 : step+1; render(true); };
    render(false);
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
