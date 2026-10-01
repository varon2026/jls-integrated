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
