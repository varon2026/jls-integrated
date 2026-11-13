/* ============================================================================
   학생 시험 기록 검색 (DT · AT · 내신모의고사, 전 학기)
   ----------------------------------------------------------------------------
   · 통합관리 대시보드(관리자·분원)와 학사관리 '내 반 현황'(담임) 두 곳이 같이 쓴다.
     화면마다 데이터 모양이 달라서 "누구를 검색할 수 있나(candidates)"만 각 화면이 넘겨준다.
   · 점수는 exam_scores 한 줄이 '학생 × 시험 한 가지'다. 재시험을 보면 새 줄이 생기는 게 아니라
     그 줄의 score 가 최신 점수로 바뀌고, 이전 점수들은 prev_scores 배열에 쌓인다.
     그래서 시도 목록 = [...prev_scores, score] 이다 (grader.html 의 재시험관리와 같은 해석).
   · AT 는 독해·문법이 따로 한 줄씩이다. 회차별 총점 = 두 영역의 같은 회차를 더한다.
     한 영역만 재시험 봤으면 안 본 영역은 마지막 점수를 그대로 쓴다(grader 의 '1차 총점' 규칙과 같다).
   · 영역별(듣기·독해 등) 점수는 DT 에서 '가장 최근 회차'만 알 수 있다 — responses 가 덮어써지기 때문.
     이전 회차는 총점만 보여준다.
   · 통과 기준(컷라인)은 2026 가을학기부터 적용된다(grader 와 같음). 그 이전 학기는 통과/미통과를 안 띄운다.
   ============================================================================ */
(function(){
  var CSS = ''
  + '.exh-wrap{position:relative;display:inline-block}'
  /* 검색창이 눈에 안 띈다는 운영자 지적 — 테두리를 진한 보라 2px + 옅은 보라 바탕 + 그림자로 */
  + '.exh-in{display:flex;align-items:center;gap:10px;width:340px;border:2px solid #6B4FD8;border-radius:999px;background:#F7F4FF;padding:10px 18px;font-size:14px;box-shadow:0 3px 12px #6b4fd830;transition:box-shadow .15s,background .15s}'
  + '.exh-in:focus-within{background:#fff;box-shadow:0 0 0 4px #6b4fd830,0 6px 18px #6b4fd830}'
  + '.exh-in input::placeholder{color:#6B4FD8;opacity:.75;font-weight:700}'
  + '.exh-in input{border:0;outline:0;flex:1;min-width:0;font:inherit;font-weight:700;color:#2f3138;background:none}'
  + '.exh-in svg{flex:none}'
  + '.exh-dd{position:absolute;right:0;top:calc(100% + 8px);width:480px;max-width:92vw;background:#fff;border-radius:18px;box-shadow:0 18px 50px #4b35b238,0 0 0 1px #ece9f6;overflow:hidden;z-index:3000;display:none;text-align:left}'
  + '.exh-dd.on{display:block}'
  + '.exh-lb{padding:11px 18px 5px;font-size:11.5px;font-weight:800;color:#8b90a0}'
  + '.exh-it{display:flex;align-items:center;gap:13px;padding:10px 18px;cursor:pointer}'
  + '.exh-it.on,.exh-it:hover{background:#F4F1FE}'
  + '.exh-av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;flex:none;background:linear-gradient(135deg,#EDE7FF,#DCD2FF);color:#6B4FD8}'
  + '.exh-nm{font-size:15px;font-weight:700;color:#262833}.exh-nm mark{background:none;color:#6B4FD8;font-weight:800}'
  + '.exh-mt{font-size:12px;color:#8b90a0;margin-top:2px}'
  + '.exh-tag{margin-left:auto;font-size:11px;font-weight:800;border-radius:999px;padding:3px 9px;background:#E8F7ED;color:#1E9E4A;flex:none}'
  + '.exh-tag.gone{background:#EFEDF5;color:#777}'
  + '.exh-it.gone .exh-av{filter:grayscale(1);opacity:.55}.exh-it.gone .exh-nm{color:#999}'
  + '.exh-ft{display:flex;gap:14px;padding:9px 18px;font-size:11.5px;color:#8b90a0;background:#FAF9FD;border-top:1px solid #ece9f6}'
  + '.exh-ft kbd{background:#fff;border:1px solid #ece9f6;border-radius:5px;padding:0 6px;font:inherit;font-weight:800}'
  + '.exh-empty{padding:22px 18px;text-align:center;color:#8b90a0;font-size:13px}'
  + '.exh-dim{position:fixed;inset:0;background:#25203c99;z-index:4000;display:flex;align-items:center;justify-content:center;padding:24px}'
  + '.exh-md{background:#fff;border-radius:24px;box-shadow:0 30px 80px #0005;width:min(1040px,100%);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;color:#262833;text-align:left}'
  + '.exh-mh{padding:22px 28px 16px;background:linear-gradient(120deg,#F4F1FE,#FBFAFF);display:flex;gap:16px;align-items:center;flex:none}'
  + '.exh-mh .exh-av{width:58px;height:58px;font-size:23px}'
  + '.exh-mh h2{margin:0;font-size:23px;font-weight:800}.exh-mh p{margin:4px 0 0;font-size:13px;color:#8b90a0}'
  + '.exh-x{margin-left:auto;align-self:flex-start;width:34px;height:34px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#888;font-size:16px;box-shadow:0 1px 4px #0001;cursor:pointer;border:0}'
  + '.exh-sum{display:flex;gap:10px;flex-wrap:wrap;padding:0 28px 16px;background:linear-gradient(120deg,#F4F1FE,#FBFAFF);flex:none}'
  + '.exh-sm{background:#fff;border-radius:13px;padding:9px 16px;box-shadow:0 1px 3px #6b4fd814}.exh-sm small{display:block;font-size:11.5px;color:#8b90a0;font-weight:700}.exh-sm b{font-size:19px}.exh-sm b i{font-style:normal;font-size:12px;color:#8b90a0;font-weight:700;margin-left:2px}'
  + '.exh-tabs{display:flex;gap:4px;padding:12px 28px 0;border-bottom:1px solid #ece9f6;flex:none;align-items:center}'
  + '.exh-tab{padding:9px 16px;font-weight:800;font-size:13.5px;color:#8b90a0;border:0;background:none;border-bottom:3px solid transparent;margin-bottom:-1px;cursor:pointer;font-family:inherit}'
  + '.exh-tab.on{color:#6B4FD8;border-color:#6B4FD8}'
  + '.exh-exp{margin-left:auto;font-size:12.5px;font-weight:800;color:#6B4FD8;background:none;border:0;cursor:pointer;font-family:inherit;padding:6px 0}'
  + '.exh-bd{padding:18px 28px 24px;overflow:auto;flex:1}'
  + '.exh-sem{display:grid;grid-template-columns:112px 1fr;gap:6px 16px;margin-bottom:20px}'
  + '.exh-sl b{font-size:16px;font-weight:800;display:block;white-space:nowrap}.exh-sl small{font-size:11.5px;color:#8b90a0;display:block;margin-top:3px;line-height:1.5;overflow-wrap:anywhere}'
  + '.exh-ex{border-radius:15px;box-shadow:0 0 0 1px #ece9f6;padding:15px 19px;margin-bottom:10px;position:relative}'
  + '.exh-ex:before{content:"";position:absolute;left:-14px;top:23px;width:8px;height:8px;border-radius:50%;background:#8A74F0}'
  + '.exh-eh{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.exh-eh b{font-size:15px;font-weight:800}.exh-eh small{color:#8b90a0;font-size:12px}'
  + '.exh-pill{border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:800}'
  + '.exh-pill.ok{background:#E8F7ED;color:#1E9E4A}.exh-pill.ng{background:#FEEEEC;color:#E0483E}.exh-pill.gy{background:#EFEDF5;color:#777}'
  + '.exh-st{display:flex;margin-top:13px;flex-wrap:wrap;row-gap:12px}'
  + '.exh-s{flex:1 1 170px;max-width:230px;padding:0 4px}'
  + '.exh-s .t{font-size:11.5px;color:#8b90a0;font-weight:700;display:flex;align-items:center;gap:6px}'
  + '.exh-s .t:after{content:"";height:2px;flex:1;background:#ece9f6}.exh-s:last-child .t:after{display:none}'
  + '.exh-s .n{font-size:28px;font-weight:800;margin-top:3px;letter-spacing:-.02em}.exh-s.ng .n{color:#E0483E}.exh-s.ok .n{color:#1E9E4A}.exh-s .n small{font-size:12px;color:#8b90a0;font-weight:700;margin-left:2px}'
  + '.exh-s .d{font-size:12px;color:#8b90a0;margin-top:2px;line-height:1.5}'
  + '.exh-bar{height:6px;border-radius:9px;background:#EFEDF5;margin-top:7px;position:relative;width:92%}.exh-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:#B9B2D8}'
  + '.exh-s.ng .exh-bar i{background:#F2A29C}.exh-s.ok .exh-bar i{background:#6CCB8B}.exh-bar u{position:absolute;top:-4px;bottom:-4px;width:2px;background:#555;opacity:.55}'
  + '.exh-note{margin-top:11px;font-size:12px;color:#6f7383;background:#FAF9FD;border-radius:9px;padding:8px 12px;line-height:1.6}'
  + '.exh-none{padding:46px 0;text-align:center;color:#8b90a0;font-size:14px}'
  + '@media(max-width:700px){.exh-sem{grid-template-columns:1fr}.exh-in{width:100%}.exh-dim{padding:0}.exh-md{max-height:100vh;border-radius:0}}';

  var SB = null, CUT = null, STYLE_ON = false;
  var SEASON = { '봄':0, '여름':1, '가을':2, '겨울':3 };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function r1(n){ return Math.round(n*10)/10; }
  function fmt(n){ return (n==null||isNaN(n))?'-':String(r1(n)); }
  function addStyle(){ if(STYLE_ON) return; STYLE_ON=true; var s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s); }
  /* '2026 가을' · '2025-26 겨울' 같은 이름에서 정렬용 숫자를 만든다 */
  function rankOfName(name, sems){
    var hit=(sems||[]).find(function(s){return s.name===name;});
    if(hit){ var m=String(hit.id).match(/sem_(\d+)_(\w+)/); if(m){ var o={spring:0,summer:1,fall:2,winter:3}; return parseInt(m[1],10)*10+(o[m[2]]||0); } }
    var y=String(name).match(/(\d{4})/), se=String(name).match(/(봄|여름|가을|겨울)/);
    return y&&se ? parseInt(y[1],10)*10+SEASON[se[1]] : 0;
  }
  function cutApplies(rank){ return rank >= 2026*10+2; }   // 2026 가을부터

  /* ---------- 검색창 ---------- */
  function attach(opts){
    addStyle();
    SB = opts.sb;
    var host = typeof opts.host==='string' ? document.getElementById(opts.host) : opts.host;
    if(!host) return;
    host.innerHTML = '<div class="exh-wrap"><div class="exh-in"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="#6B4FD8" stroke-width="2.8"/><path d="M20 20l-4-4" stroke="#6B4FD8" stroke-width="2.4" stroke-linecap="round"/></svg>'
      + '<input type="text" autocomplete="off" placeholder="' + esc(opts.placeholder||'학생 이름 검색 (시험 기록)') + '"></div><div class="exh-dd"></div></div>';
    var inp = host.querySelector('input'), dd = host.querySelector('.exh-dd'), list = [], cur = 0;
    function close(){ dd.classList.remove('on'); }
    function draw(){
      var q = inp.value.trim();
      if(!q){ close(); return; }
      var all = opts.candidates() || [];
      list = all.filter(function(c){ return String(c.name||'').indexOf(q) >= 0; })
        .sort(function(a,b){
          var ga=a.status==='withdraw'?1:0, gb=b.status==='withdraw'?1:0; if(ga!==gb) return ga-gb;
          var sa=String(a.name).indexOf(q)===0?0:1, sb2=String(b.name).indexOf(q)===0?0:1; if(sa!==sb2) return sa-sb2;
          return String(a.name).localeCompare(String(b.name),'ko');
        }).slice(0,12);
      cur = 0;
      if(!list.length){ dd.innerHTML = '<div class="exh-empty">검색 결과가 없어요</div>'; dd.classList.add('on'); return; }
      dd.innerHTML = '<div class="exh-lb">학생 · '+list.length+'명'+(list.length>=12?' 이상':'')+'</div>' + list.map(function(c,i){
        var nm = esc(c.name), j = String(c.name).indexOf(q);
        var hl = '<mark>'+esc(String(c.name).substr(j,q.length))+'</mark>'+esc(String(c.name).substr(j+q.length));
        hl = esc(String(c.name).substr(0,j)) + hl;
        var gone = c.status==='withdraw';
        return '<div class="exh-it'+(i===0?' on':'')+(gone?' gone':'')+'" data-i="'+i+'"><div class="exh-av">'+esc(String(c.name).charAt(0))+'</div><div><div class="exh-nm">'+hl+'</div>'
          + '<div class="exh-mt">'+esc([c.branchName,c.className,[c.school,c.grade].filter(Boolean).join(' ')].filter(Boolean).join(' · '))+'</div></div>'
          + '<span class="exh-tag'+(gone?' gone':'')+'">'+(gone?'퇴원':'재원')+'</span></div>';
      }).join('') + '<div class="exh-ft"><span><kbd>↑</kbd> <kbd>↓</kbd> 이동</span><span><kbd>Enter</kbd> 열기</span><span><kbd>Esc</kbd> 닫기</span></div>';
      dd.classList.add('on');
    }
    function mark(){ Array.prototype.forEach.call(dd.querySelectorAll('.exh-it'),function(e,i){ e.classList.toggle('on',i===cur); }); }
    function pick(i){ var c=list[i]; if(!c) return; close(); inp.blur(); open(c, opts); }
    inp.addEventListener('input', draw);
    inp.addEventListener('focus', draw);
    inp.addEventListener('keydown', function(e){
      if(e.key==='ArrowDown'){ e.preventDefault(); if(list.length){ cur=(cur+1)%list.length; mark(); } }
      else if(e.key==='ArrowUp'){ e.preventDefault(); if(list.length){ cur=(cur-1+list.length)%list.length; mark(); } }
      else if(e.key==='Enter'){ e.preventDefault(); pick(cur); }
      else if(e.key==='Escape'){ close(); inp.blur(); }
    });
    dd.addEventListener('mousedown', function(e){ var it=e.target.closest('.exh-it'); if(it){ e.preventDefault(); pick(+it.dataset.i); } });
    document.addEventListener('mousedown', function(e){ if(!host.contains(e.target)) close(); });
  }

  /* ---------- 데이터 모으기 ---------- */
  async function loadCut(){
    if(CUT) return CUT;
    CUT = { DT:80, AT:70 };
    try{ var r = await SB.from('exam_config').select('test_type,cutline'); (r.data||[]).forEach(function(x){ if(x.cutline!=null && (x.test_type==='DT'||x.test_type==='AT')) CUT[x.test_type]=+x.cutline; }); }catch(e){}
    return CUT;
  }
  var _L2N = {A:'1',B:'2',C:'3',D:'4',E:'5','①':'1','②':'2','③':'3','④':'4','⑤':'5'};
  function normA(v){ v=String(v==null?'':v).trim().toUpperCase(); return _L2N[v]||v; }
  /* grader.html 의 computeParts 와 같은 규칙 — DT 영역별 점수 */
  function partsOf(responses, ans){
    var rmap={}; (responses||[]).forEach(function(r){ rmap[r.n]=r; });
    var parts=[], got={}, pt={};
    ans.forEach(function(a){ var p=a.part||'전체'; if(parts.indexOf(p)<0){ parts.push(p); got[p]=0; pt[p]=0; } });
    ans.forEach(function(a){ var p=a.part||'전체'; pt[p]+=(a.pt||0); var rp=rmap[a.n]; if(!rp) return; var v=String(rp.ans==null?'':rp.ans).trim(); if(v==='') return;
      var ok = a.type==='sa' ? (v==='1') : (normA(v)===normA(a.ans)); if(ok) got[p]+=(a.pt||0); });
    return parts.map(function(p){ return { name:p, got:r1(got[p]), pt:r1(pt[p]) }; });
  }
  /* 학기 이름은 '2026년 가을학기' 로 길게 저장돼 있어 왼쪽 칸에서 두 줄로 꺾였다 — '2026 가을' 로 줄이고 한 줄로 고정한다 */
  function shortSem(n){ return String(n||'').replace(/년\s*/,' ').replace(/학기$/,'').trim(); }
  function chunks(a){ return a.map(function(x){ return '<span style="white-space:nowrap">'+x+'</span>'; }).join(' · '); }
  /* 반 이름은 '[DSD2]FA2/MWF/J' 처럼 길어서 왼쪽 칸에서 잘렸다 — 괄호·빗금을 점으로 바꿔 짧게 읽히게 하고 줄바꿈도 허용한다 */
  function shortCls(c){ return String(c||'').replace(/[\[\]]/g,' ').replace(/\s*\/\s*/g,' · ').replace(/\s+/g,' ').trim(); }
  function rowDate(r){ return r && r.graded_at ? String(r.graded_at).slice(0,10) : ''; }
  function md(d){ return d ? String(d).slice(5,10) : ''; }

  async function open(stu, opts){
    addStyle(); SB = (opts&&opts.sb) || SB;
    var dim = document.createElement('div'); dim.className='exh-dim';
    dim.innerHTML = '<div class="exh-md"><div class="exh-none">시험 기록을 불러오는 중…</div></div>';
    document.body.appendChild(dim);
    function close(){ dim.remove(); document.removeEventListener('keydown',esc2); }
    function esc2(e){ if(e.key==='Escape') close(); }
    document.addEventListener('keydown', esc2);
    dim.addEventListener('mousedown', function(e){ if(e.target===dim) close(); });
    var sems = (opts&&opts.semesters&&opts.semesters())||[];
    try{
      var cut = await loadCut();
      var res = await Promise.all([
        SB.from('exam_scores').select('*').eq('student_code', stu.code),
        SB.from('retest_schedule').select('*').eq('student_code', stu.code)
      ]);
      if(res[0].error) throw res[0].error;
      var rows = res[0].data||[], sched = res[1].error?[]:(res[1].data||[]);
      var dtIds = rows.filter(function(r){return r.test_type==='DT'&&r.key_id;}).map(function(r){return r.key_id;});
      var keyMap = {};
      if(dtIds.length){ var kr = await SB.from('exam_keys').select('id,answers').in('id', dtIds.filter(function(x,i,a){return a.indexOf(x)===i;})); (kr.data||[]).forEach(function(k){ keyMap[k.id]=k; }); }
      var model = build(rows, sched, keyMap, cut, sems);
      render(dim, stu, model, close);
    }catch(e){
      dim.querySelector('.exh-md').innerHTML = '<div class="exh-none">시험 기록을 불러오지 못했어요<br><small>'+esc(e&&e.message||e)+'</small></div>';
    }
  }

  /* 학기 → 시험들 */
  function build(rows, sched, keyMap, cut, sems){
    var bySem = {};
    function semOf(name){ if(!bySem[name]) bySem[name]={ name:name, rank:rankOfName(name,sems), exams:[] }; return bySem[name]; }
    var schedBy = {};
    sched.forEach(function(s){ var sm=(sems.find(function(x){return x.id===s.semester;})||{}).name || s.semester; schedBy[sm+'|'+s.test_type]=s; });

    /* DT: 한 줄 = 한 시험 */
    rows.filter(function(r){return r.test_type==='DT';}).forEach(function(r){
      var prev = Array.isArray(r.prev_scores)?r.prev_scores:[];
      var att = prev.concat([r.score]).map(function(v,i,a){ return { total:+v, last:i===a.length-1 }; });
      var key = keyMap[r.key_id], parts = key ? partsOf(r.responses, key.answers||[]) : null;
      var sm = semOf(r.semester||'(학기 미상)');
      sm.exams.push({ type:'DT', title:String(r.key_name||'DT').replace(/^DT\s*·\s*/,''), date:rowDate(r), cls:r.class_name, attempts:att, lastParts:parts, unit:'점', max:100,
        cutKey:'DT', sched:schedBy[sm.name+'|DT'], at:false });
    });
    /* AT: 독해·문법 두 줄을 합친다 */
    var atg = {};
    rows.filter(function(r){return r.test_type==='AT';}).forEach(function(r){ var k=r.semester+'|'+r.key_name; (atg[k]=atg[k]||[]).push(r); });
    Object.keys(atg).forEach(function(k){
      var rs=atg[k], d=rs.filter(function(x){return x.section==='독해';})[0], g=rs.filter(function(x){return x.section==='문법';})[0];
      function arr(x){ return x ? (Array.isArray(x.prev_scores)?x.prev_scores:[]).concat([x.score]).map(Number) : []; }
      var da=arr(d), ga=arr(g), n=Math.max(da.length,ga.length), att=[];
      for(var i=0;i<n;i++){
        var dv = da.length ? da[Math.min(i,da.length-1)] : null, gv = ga.length ? ga[Math.min(i,ga.length-1)] : null;
        att.push({ total:r1((dv||0)+(gv||0)), d:dv, g:gv, half:(!da.length||!gv&&gv!==0&&!ga.length), last:i===n-1 });
      }
      var base = d||g, sm = semOf(base.semester||'(학기 미상)');
      sm.exams.push({ type:'AT', title:String(base.key_name||'AT'), date:rowDate(base), cls:base.class_name, attempts:att, at:true, missing:(!d?'독해':(!g?'문법':'')),
        unit:'점', max:100, cutKey:'AT', sched:schedBy[sm.name+'|AT'] });
    });
    /* 내신모의고사: 지필·듣기·수행 영역별 줄을 합친다 */
    var ng = {};
    rows.filter(function(r){return r.test_type==='내신모의고사';}).forEach(function(r){ var k=r.semester+'|'+r.key_name; (ng[k]=ng[k]||[]).push(r); });
    Object.keys(ng).forEach(function(k){
      var rs=ng[k], got=0, tot=0, secs=[];
      rs.forEach(function(x){ got+=(+x.got_pt||+x.score||0); tot+=(+x.total_pt||0); secs.push({ name:x.section||'전체', got:r1(+x.got_pt||+x.score||0), pt:r1(+x.total_pt||0) }); });
      var base = rs[0], sm = semOf(base.semester||'(학기 미상)');
      var pct = tot>0 ? r1(got/tot*100) : r1(got);
      sm.exams.push({ type:'내신', title:'내신모의고사 · '+base.key_name, date:rowDate(rs.sort(function(a,b){return String(b.graded_at).localeCompare(String(a.graded_at));})[0]), cls:base.class_name,
        attempts:[{ total:pct, last:true, got:r1(got), pt:r1(tot) }], secs:secs, cutKey:null, unit:'점', max:100 });
    });

    var list = Object.keys(bySem).map(function(k){ return bySem[k]; }).sort(function(a,b){ return b.rank-a.rank; });
    list.forEach(function(sm){
      sm.exams.sort(function(a,b){ return String(b.date).localeCompare(String(a.date)); });
      sm.exams.forEach(function(ex){
        var c = (ex.cutKey && cutApplies(sm.rank)) ? cut[ex.cutKey] : null; ex.cut = c;
        var fin = ex.attempts[ex.attempts.length-1].total;
        ex.retests = Math.max(0, ex.attempts.length-1);
        ex.first = ex.attempts[0].total; ex.final = fin;
        ex.passed = (c!=null) ? fin>=c : null;
      });
    });
    return list;
  }

  /* ---------- 창 그리기 ---------- */
  var TABS = [['all','전체'],['DT','DT'],['AT','AT'],['내신','내신모의고사']];
  function render(dim, stu, model, close){
    var all = []; model.forEach(function(s){ s.exams.forEach(function(e){ all.push(e); }); });
    var n = all.length, rt = all.reduce(function(a,e){return a+e.retests;},0);
    function lastOf(t){ for(var i=0;i<model.length;i++){ var e=model[i].exams.filter(function(x){return x.type===t;})[0]; if(e) return e; } return null; }
    var ld=lastOf('DT'), la=lastOf('AT'), ln=lastOf('내신');
    function sumBox(lbl, e){ if(!e) return ''; var ok = e.passed===true?' style="color:#1E9E4A"':(e.passed===false?' style="color:#E0483E"':''); return '<div class="exh-sm"><small>'+lbl+'</small><b'+ok+'>'+fmt(e.final)+'<i>점'+(e.passed===true?' 통과':(e.passed===false?' 미통과':''))+'</i></b></div>'; }
    var head = '<div class="exh-mh"><div class="exh-av">'+esc(String(stu.name).charAt(0))+'</div><div><h2>'+esc(stu.name)+'</h2><p>'
      + esc([stu.branchName, stu.className, [stu.school,stu.grade].filter(Boolean).join(' '), stu.teacher?('담임 '+stu.teacher):'', stu.status==='withdraw'?'퇴원':''].filter(Boolean).join(' · '))
      + '</p></div><button class="exh-x" title="닫기">✕</button></div>'
      + '<div class="exh-sum"><div class="exh-sm"><small>응시한 시험</small><b>'+n+'<i>건</i></b></div><div class="exh-sm"><small>재시험</small><b>'+rt+'<i>회</i></b></div>'
      + sumBox('최근 DT',ld)+sumBox('최근 AT',la)+sumBox('최근 내신모의고사',ln)+'</div>';
    var cur = 'all';
    function body(){
      var h = '';
      model.forEach(function(s){
        var ex = s.exams.filter(function(e){ return cur==='all' || e.type===cur; });
        if(!ex.length) return;
        h += '<div class="exh-sem"><div class="exh-sl"><b>'+esc(shortSem(s.name))+'</b><small>'+esc(shortCls(ex[0].cls))+'</small></div><div>'+ex.map(exHtml).join('')+'</div></div>';
      });
      return h || '<div class="exh-none">'+(n?'이 종류의 시험 기록이 없어요':'아직 저장된 시험 기록이 없어요')+'</div>';
    }
    function tabsHtml(){ return TABS.map(function(t){ return '<button class="exh-tab'+(cur===t[0]?' on':'')+'" data-t="'+t[0]+'">'+t[1]+'</button>'; }).join('') + '<button class="exh-exp">엑셀로 받기</button>'; }
    var box = dim.querySelector('.exh-md');
    box.innerHTML = head + '<div class="exh-tabs">'+tabsHtml()+'</div><div class="exh-bd">'+body()+'</div>';
    box.addEventListener('click', function(e){
      if(e.target.closest('.exh-x')) return close();
      var t = e.target.closest('.exh-tab');
      if(t){ cur=t.dataset.t; box.querySelector('.exh-tabs').innerHTML=tabsHtml(); box.querySelector('.exh-bd').innerHTML=body(); return; }
      if(e.target.closest('.exh-exp')) exportXlsx(stu, model);
    });
  }
  function exHtml(e){
    var cut=e.cut, h = '<div class="exh-ex"><div class="exh-eh"><b>'+esc(e.title)+'</b>'+(e.date?'<small>'+esc(e.date)+'</small>':'');
    if(e.retests>0) h += '<span class="exh-pill '+(e.passed===true?'ok':'gy')+'">재시험 '+e.retests+'회'+(e.passed===true?' 끝에 통과':'')+'</span>';
    else if(e.type==='내신') h += '<span class="exh-pill gy">재시험 없음</span>';
    else if(e.passed===true) h += '<span class="exh-pill ok">통과</span>';
    if(e.passed===false) h += '<span class="exh-pill ng">미통과 (기준 '+fmt(cut)+')</span>';
    else if(e.passed===true && e.retests>0) h += '<span class="exh-pill ok">기준 '+fmt(cut)+'</span>';
    h += '</div><div class="exh-st">';
    e.attempts.forEach(function(a,i){
      var pass = (cut!=null) ? a.total>=cut : null;
      var st = pass===true?'ok':(pass===false?'ng':'');
      var lbl = i===0 ? (e.attempts.length>1?'1차 본시험':'본시험') : ('재시험 ' + (i) + '차');
      var det = '';
      if(e.at){ det = a.d!=null||a.g!=null ? chunks(['독해 '+fmt(a.d),'문법 '+fmt(a.g)]) : ''; }
      else if(e.type==='DT' && a.last && e.lastParts && e.lastParts.length>1){ det = chunks(e.lastParts.map(function(p){ return esc(p.name)+' '+fmt(p.got); })); }
      else if(e.type==='내신'){ det = chunks((e.secs||[]).map(function(p){ return esc(p.name)+' '+fmt(p.got)+'/'+fmt(p.pt); })); }
      var pct = Math.max(0, Math.min(100, a.total/(e.max||100)*100));
      h += '<div class="exh-s '+st+'"><div class="t">'+lbl+'</div><div class="n">'+fmt(a.total)+'<small>점</small></div>'+(det?'<div class="d">'+det+'</div>':'')
        + '<div class="exh-bar"><i style="width:'+pct+'%"></i>'+(cut!=null?'<u style="left:'+Math.min(100,cut/(e.max||100)*100)+'%"></u>':'')+'</div></div>';
    });
    h += '</div>';
    var notes = [];
    if(cut!=null) notes.push('통과 기준 '+fmt(cut)+'점 (막대 위의 선)');
    else if(e.cutKey) notes.push('이 학기는 통과 기준을 적용하지 않아 통과 여부는 표시하지 않아요');
    if(e.at && e.missing) notes.push(e.missing+' 영역은 아직 채점되지 않았어요');
    if(e.type==='DT' && e.retests>0) notes.push('영역별 점수는 가장 최근 회차만 남아 있어요');
    if(e.at && e.retests>0) notes.push('회차별 영역 점수는 같은 회차끼리 더한 값이에요(한 영역만 재시험 본 경우 안 본 영역은 마지막 점수)');
    var s = e.sched;
    if(s){
      if(s.scheduled_at) notes.push('재시험 예약 '+md(s.scheduled_at));
      if(s.makeup_at) notes.push('보강 '+md(s.makeup_at));
      if(s.makeup_done) notes.push('보강 완료');
    }
    if(notes.length) h += '<div class="exh-note">'+notes.map(esc).join(' · ')+'</div>';
    return h + '</div>';
  }
  function exportXlsx(stu, model){
    if(!window.XLSX){ alert('엑셀 도구를 불러오지 못했어요'); return; }
    var rows = [['학기','시험','회차','총점','영역별','통과 기준','결과','채점일']];
    model.forEach(function(s){ s.exams.forEach(function(e){ e.attempts.forEach(function(a,i){
      var det = e.at ? ('독해 '+fmt(a.d)+' / 문법 '+fmt(a.g)) : (e.type==='DT'&&a.last&&e.lastParts ? e.lastParts.map(function(p){return p.name+' '+fmt(p.got);}).join(' / ') : (e.type==='내신'?(e.secs||[]).map(function(p){return p.name+' '+fmt(p.got)+'/'+fmt(p.pt);}).join(' / '):''));
      var res = e.cut==null ? '' : (a.total>=e.cut?'통과':'미통과');
      rows.push([s.name, e.title, i===0?(e.attempts.length>1?'1차 본시험':'본시험'):('재시험 '+i+'차'), a.total, det, e.cut==null?'':e.cut, res, a.last?e.date:'']);
    }); }); });
    var ws = XLSX.utils.aoa_to_sheet(rows), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, '시험기록');
    XLSX.writeFile(wb, stu.name+'_시험기록.xlsx');
  }

  window.ExamHistory = { attach: attach, open: open };
})();
