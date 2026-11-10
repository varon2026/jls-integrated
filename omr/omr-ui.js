/* OMR 화면 — DT·AT 답안입력 화면의 [OMR 출력] [OMR 스캔] 버튼.
   읽기 엔진은 omr.js. 여기는 대화창·출력 화면·답안칸 채우기만 한다.
   ⚠️ 이 파일은 grader.html의 전역(EXAM, SEM, CURVARIANT, CURTAB, curClassObj, scoreRow …)을 그대로 쓴다. */
(function(){
'use strict';
var O=window.OMR; if(!O) return;
var esc=O.esc;

/* ---------- 공통: 대화창 ---------- */
function modal(html){
  var m=document.getElementById('omrMask');
  if(!m){
    m=document.createElement('div');m.id='omrMask';
    m.style.cssText='position:fixed;inset:0;background:rgba(40,35,70,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:4vh 16px;overflow:auto';
    document.body.appendChild(m);
  }
  m.innerHTML='<div style="background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(60,50,110,.3);width:min(720px,100%);padding:22px 26px">'+html+'</div>';
  return m;
}
function closeModal(){var m=document.getElementById('omrMask');if(m)m.remove();}
/* 시험 운영 중이라 서수원분원 반에서만 연다(분원 이름으로 판정 — 미통과 관리의 retestOn과 같은 방식).
   다른 분원에는 버튼이 안 보이고, 코드로 불러도 막힌다. 전 분원으로 열 때는 이 함수만 true로 바꾸면 된다. */
function enabledFor(cls){return !!cls&&/서수원/.test(String(cls.branchName||''));}
function ctxCheck(){
  if(typeof EXAM==='undefined'||(EXAM!=='DT'&&EXAM!=='AT')){O.toastMsg('DT·AT 답안입력 화면에서 쓰세요',false);return null;}
  var cls=curClassObj();if(!cls){O.toastMsg('반을 먼저 선택해주세요',false);return null;}
  if(!enabledFor(cls)){O.toastMsg('OMR 기능은 아직 서수원분원에서만 시험 중이에요',false);return null;}
  return cls;
}
function gradeOf(r){var g=(typeof gradeKey==='function')?gradeKey(r.grade):'';return g||r.grade||'';}
function fit(t,maxw,base,minsz){var sz=base;t=String(t||'');while(sz>minsz&&t.length*sz*0.95>maxw)sz-=0.5;return sz;}

/* =====================================================================
   출력 — 학생마다 이름·학교·학년·반·담임이 찍히고 QR이 들어간 OMR (틀은 원본 그대로)
   ===================================================================== */
function tx(x,y,w,h,html,size,weight,color,align){
  return '<div style="position:absolute;left:'+x+'pt;top:'+y+'pt;width:'+w+'pt;height:'+h+'pt;display:flex;align-items:center;justify-content:'+(align==='left'?'flex-start':'center')+';font-size:'+size+'pt;font-weight:'+(weight||700)+';color:'+(color||'#111')+';line-height:1.15;text-align:'+(align||'center')+'">'+html+'</div>';
}
function qrSvg(payload,x,y,size){
  var q=window.qrcode(0,'M');q.addData(payload);q.make();var n=q.getModuleCount(),d='';
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';
  var pad=size*0.06;
  return '<div style="position:absolute;left:'+(x-pad)+'pt;top:'+(y-pad)+'pt;width:'+(size+2*pad)+'pt;height:'+(size+2*pad)+'pt;background:#fff"></div>'
   +'<svg style="position:absolute;left:'+x+'pt;top:'+y+'pt;width:'+size+'pt;height:'+size+'pt" viewBox="0 0 '+n+' '+n+'" shape-rendering="crispEdges"><path d="'+d+'" fill="#000"/></svg>';
}
function dtSheet(s,c,payload){
  var b='',x=78,w=106;
  b+=tx(31,40,135,30,esc(c.semLabel)+'<br>'+esc(c.branch),8.5,700,'#444','left');
  b+=tx(x,136,w,40,esc(s.name),fit(s.name,w,15,10),900);
  b+=tx(x,176,w,40,esc(s.school),fit(s.school,w,11,7),700);
  b+=tx(x,216,w,40,esc(s.grade),12,700);
  var lc=c.level+' · '+c.detail;
  b+=tx(x,256,w,40,'<div><div style="font-size:'+fit(lc,w,10,7)+'pt;font-weight:900">'+esc(lc)+'</div><div style="font-size:8pt;font-weight:700;color:#444;margin-top:2pt">담임 '+esc(c.teacher)+'</div></div>',10,700);
  b+=qrSvg(payload,59,492,100);
  b+=tx(31,596,156,12,esc(s.code),8,700,'#333');
  b+=tx(31,609,156,10,'QR은 가리거나 접지 마세요',6.5,400,'#888');
  return b;
}
function atHeader(s,c){
  var b='',cells=[[269,376,s.name],[377,484,s.school+' · '+s.grade],[485,592,c.teacher]];
  cells.forEach(function(cl,i){var w=cl[1]-cl[0]-6;b+=tx(cl[0]+3,50,w,31,esc(cl[2]),fit(cl[2],w,i?11:12.5,7),i?700:900);});
  var w2=700-592-6;
  b+=tx(595,50,w2,31,'<div><div style="font-size:'+fit(c.variant,w2,11.5,8)+'pt;font-weight:900">'+esc(c.variant)+'</div><div style="font-size:7.5pt;font-weight:700;color:#444;margin-top:1pt">'+esc(c.detail)+'</div></div>',11,700);
  return b;
}
function atGrammarSheet(s,c,payload){
  var b=atHeader(s,c);
  [[86,172],[173,259],[260,346],[346,432],[433,519]].forEach(function(r){b+='<div style="position:absolute;left:614pt;top:'+(r[0]-0.5)+'pt;width:86pt;height:'+(r[1]-r[0]+1)+'pt;background:#fff"></div>';});
  b+=qrSvg(payload,624,92,64);
  b+=tx(612,160,90,12,esc(s.code),7.5,700,'#333');
  b+=tx(612,174,90,24,esc(c.semLabel)+'<br>'+esc(c.branch),6.5,400,'#666');
  b+=tx(612,200,90,12,'Grammar',8,900,'#555');
  b+=tx(612,214,90,20,'QR은 가리거나<br>접지 마세요',6,400,'#999');
  return b;
}
function atReadingSheet(s,c,payload){
  var b=atHeader(s,c);
  b+=qrSvg(payload,70,110,100);
  b+=tx(30,218,180,14,esc(s.code),9,700,'#333');
  b+=tx(30,234,180,26,esc(c.semLabel)+' · '+esc(c.branch),7.5,400,'#666');
  b+=tx(30,252,180,14,'Reading',9,900,'#555');
  b+=tx(30,268,180,12,'QR은 가리거나 접지 마세요',6.5,400,'#999');
  return b;
}
async function bgUrl(key){
  var cv=await O.renderTemplate(key,300/72);   // 인쇄용이라 300dpi
  return cv.toDataURL('image/png');
}
function printWindow(html,W,H){
  var w=window.open('','_blank');
  if(!w){O.toastMsg('팝업이 막혀 있어요. 주소창의 팝업 차단을 풀어주세요',false);return;}
  w.document.open();w.document.write(html);w.document.close();
  setTimeout(function(){try{w.focus();w.print();}catch(e){}},700);
}

function openPrint(){
  var cls=ctxCheck();if(!cls)return;
  var studs=cls.recs.slice().sort(function(a,b){return String(a.name).localeCompare(String(b.name));});
  var tpl=null,variantHtml='';
  if(EXAM==='DT'){
    tpl=O.dtTemplateFor(cls.levelCode);
    if(!tpl){modal('<div style="font-size:18px;font-weight:800">OMR 출력</div><div style="margin:14px 0;font-size:14px;line-height:1.7"><b>'+esc(cls.levelCode)+'</b> 레벨은 OMR 틀이 아직 없어요.<br>지금은 <b>DSB · DSC · LSA</b> 레벨만 출력할 수 있어요. 다른 레벨 OMR 틀 파일을 주시면 추가할게요.</div><div style="text-align:right"><button class="ghost mini" onclick="OMR.closeModal()">닫기</button></div>');return;}
  }else{
    var vs=variantsForBase(cls.levelCode);
    if(!vs.length){O.toastMsg('이 반은 AT 정답키(시험지)가 없어요',false);return;}
    variantHtml='<div style="margin:12px 0"><span style="font-size:13px;font-weight:800;color:var(--ink2)">시험지(개월수)</span> <select id="omrVariant" style="font:inherit;font-weight:700;border:1px solid var(--line);border-radius:9px;padding:7px 10px;margin-left:6px">'
      +vs.map(function(v){return '<option value="'+esc(v)+'"'+(v===CURVARIANT?' selected':'')+'>'+esc(v)+'</option>';}).join('')+'</select><span style="font-size:12px;color:var(--ink3);margin-left:8px">반 칸과 QR에 이 개월수가 찍혀요</span></div>';
  }
  var list=studs.map(function(r,i){return '<label style="display:flex;align-items:center;gap:8px;padding:5px 4px;border-bottom:1px solid var(--line2)"><input type="checkbox" class="omrChk" data-i="'+i+'" checked> <b>'+esc(r.name)+'</b> <span style="color:var(--ink3);font-size:12px">'+esc(r.school||'')+' '+esc(gradeOf(r))+' · '+esc(r.code||'')+'</span></label>';}).join('');
  window.__omrStuds=studs;
  modal('<div style="font-size:18px;font-weight:800">OMR 출력 <span style="font-size:13px;color:var(--ink3);font-weight:700">'+esc(cls.dispCode||cls.levelCode)+' · '+esc(classDetail(cls.className))+'</span></div>'
   +'<div style="font-size:13px;color:var(--ink3);margin-top:4px">학생마다 이름·학교·반·담임·QR이 찍힌 OMR을 한 번에 뽑아요. 아래 [인쇄]를 누르면 인쇄 화면이 열려요(PDF로 저장도 돼요). <b>용지 크기는 "페이지에 맞춤"으로</b> 인쇄하세요.</div>'
   +variantHtml
   +'<div style="margin:10px 0;display:flex;gap:8px;align-items:center"><label style="font-size:13px"><input type="checkbox" id="omrAll" checked onchange="document.querySelectorAll(\'.omrChk\').forEach(function(c){c.checked=document.getElementById(\'omrAll\').checked})"> 전체 선택</label><span style="font-size:12px;color:var(--ink3)">'+studs.length+'명</span></div>'
   +'<div style="max-height:40vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:4px 10px">'+list+'</div>'
   +'<div id="omrPrintMsg" style="margin-top:10px;font-size:12.5px;color:var(--ink3)"></div>'
   +'<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button class="ghost" onclick="OMR.closeModal()">닫기</button><button class="btn" id="omrPrintBtn" onclick="OMR.doPrint()">🖨 인쇄</button></div>');
}
async function doPrint(){
  var cls=curClassObj(),msg=document.getElementById('omrPrintMsg'),btn=document.getElementById('omrPrintBtn');
  var all=window.__omrStuds||[],sel=[];
  document.querySelectorAll('.omrChk').forEach(function(c){if(c.checked)sel.push(all[+c.dataset.i]);});
  if(!sel.length){O.toastMsg('출력할 학생을 선택하세요',false);return;}
  btn.disabled=true;msg.textContent='출력 준비 중… (처음에는 QR·PDF 도구를 불러오느라 몇 초 걸려요)';
  try{
    await O.lib('pdf');await O.lib('qr');
    var base={semLabel:semName(SEM),branch:(typeof BRANCHES==='object'&&BRANCHES[cls.branchId])||cls.branchName||'',teacher:cls.teacher||'',detail:classDetail(cls.className)};
    var html,W,H;
    if(EXAM==='DT'){
      var key=O.dtTemplateFor(cls.levelCode),url=await bgUrl(key),ch=(key==='dsb'?3:4);W=516;H=729;
      var c=Object.assign({},base,{level:cls.levelCode});
      var pages=sel.map(function(r){
        var s={name:r.name||'',school:r.school||'',grade:gradeOf(r),code:r.code||''};
        var payload=O.buildPayload({code:s.code,sem:SEM,exam:'DT',level:cls.levelCode,n:40,choices:ch});
        return '<section class="pg pgA">'+dtSheet(s,c,payload)+'</section>';
      }).join('');
      html='<style>.pgA{background-image:url('+url+')}</style>'+pages;
    }else{
      var variant=document.getElementById('omrVariant').value;W=720;H=540;
      var u1=await bgUrl('at_grammar'),u2=await bgUrl('at_reading');
      var c2=Object.assign({},base,{variant:variant});
      var pages2=sel.map(function(r){
        var s={name:r.name||'',school:r.school||'',grade:gradeOf(r),code:r.code||''};
        var pg=O.buildPayload({code:s.code,sem:SEM,exam:'AT',level:variant,n:'25+25',choices:5,sec:'G'});
        var pr=O.buildPayload({code:s.code,sem:SEM,exam:'AT',level:variant,n:'25+25',choices:5,sec:'R'});
        return '<section class="pg pgG">'+atGrammarSheet(s,c2,pg)+'</section><section class="pg pgR">'+atReadingSheet(s,c2,pr)+'</section>';
      }).join('');
      html='<style>.pgG{background-image:url('+u1+')}.pgR{background-image:url('+u2+')}</style>'+pages2;
    }
    var doc='<!doctype html><html><head><meta charset="utf-8"><title>OMR 출력</title><style>@page{size:'+W+'pt '+H+'pt;margin:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Malgun Gothic","Noto Sans KR",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.pg{position:relative;width:'+W+'pt;height:'+H+'pt;overflow:hidden;page-break-after:always;background-size:100% 100%;background-repeat:no-repeat}</style></head><body>'+html+'</body></html>';
    printWindow(doc,W,H);
    msg.textContent='인쇄 화면을 열었어요. 인쇄가 안 뜨면 새 창의 팝업 허용을 확인하세요.';
  }catch(e){
    console.error(e);msg.innerHTML='<b style="color:var(--neg)">출력 준비에 실패했어요: '+esc(e.message||e)+'</b>';
  }
  btn.disabled=false;
}

/* =====================================================================
   스캔 — 스캔 PDF를 올리면 QR로 학생을 찾고 답안칸을 채운다
   ===================================================================== */
var AT_BUF={};        // AT: 지금 탭이 아닌 영역(독해/문법)은 탭을 옮길 때 채운다
function bufKey(){var c=curClassObj();return c?(c.key+'|'+(CURVARIANT||'')):'';}
function setWarn(td,on,title){td.classList.toggle('omr-warn',!!on);if(on)td.title=title;else td.removeAttribute('title');}
function fillCell(td,res,nm){
  var inp=td.querySelector('input');if(!inp)return 0;
  var warn=0;
  if(res.st==='ok'){inp.value=String(res.v);setWarn(td,false);}
  else if(res.st==='unsure'){inp.value=res.v?String(res.v):'';setWarn(td,true,'애매해요 — 연하게 표시된 칸이에요. 실제 답을 확인하세요'+(res.v?' (읽은 값: '+res.v+'번)':''));warn=1;}
  else if(res.st==='multi'){inp.value='';setWarn(td,true,'한 문항에 두 칸 이상 칠했어요('+res.c.join('·')+'번) — 틀린 걸로 처리했어요. 고치려면 번호를 입력하세요');warn=1;}
  else{inp.value='';setWarn(td,true,'칠하지 않았어요 — 틀린 걸로 처리했어요. 고치려면 번호를 입력하세요');warn=1;}
  return warn;
}
function fillRow(tr,answers,scoreFn){
  var warns=[];
  Object.keys(answers).forEach(function(q){
    var td=tr.querySelector('td.qcell[data-n="'+q+'"]');if(!td)return;
    if(td.classList.contains('sa'))return;            // 주관식은 선생님이 직접 입력
    if(fillCell(td,answers[q],q))warns.push(+q);
  });
  scoreFn(tr);
  return warns.sort(function(a,b){return a-b;});
}
function warnCss(){
  if(document.getElementById('omrCss'))return;
  var st=document.createElement('style');st.id='omrCss';
  st.textContent='.g td.qcell.omr-warn input{background:#fff3b0!important;border-color:#e0a44c!important;color:#7a5200!important}';
  document.head.appendChild(st);
  document.addEventListener('input',function(e){var td=e.target&&e.target.closest&&e.target.closest('td.omr-warn');if(td)setWarn(td,false);});
}
function openScan(){
  var cls=ctxCheck();if(!cls)return;
  if(typeof isTeacherRO==='function'&&isTeacherRO()){O.toastMsg('담임 계정은 읽기 전용이라 스캔을 올릴 수 없어요',false);return;}
  modal('<div style="font-size:18px;font-weight:800">OMR 스캔 올리기 <span style="font-size:13px;color:var(--ink3);font-weight:700">'+esc(cls.dispCode||cls.levelCode)+' · '+esc(classDetail(cls.className))+'</span></div>'
   +'<div style="font-size:13px;color:var(--ink3);margin-top:6px;line-height:1.7">복합기로 스캔한 <b>PDF</b>(또는 사진)를 올리세요. 여러 장을 한 파일로 올려도 돼요.<br>QR로 학생을 찾아서 <b>답안칸을 채워드려요.</b> 채점·저장은 평소처럼 [채점 결과 저장]을 누르면 돼요.<br>두 칸 이상 칠했거나 비운 문항은 <b>틀린 걸로 처리하고 노랗게</b> 표시해요.</div>'
   +'<div style="margin:16px 0"><input type="file" id="omrFile" accept="application/pdf,image/*" multiple onchange="OMR.doScan(this)"></div>'
   +'<div id="omrScanMsg" style="font-size:13px;line-height:1.7"></div>'
   +'<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="ghost" onclick="OMR.closeModal()">닫기</button></div>');
}
async function doScan(input){
  var files=[].slice.call(input.files||[]);if(!files.length)return;
  var msg=document.getElementById('omrScanMsg'),cls=curClassObj();
  warnCss();
  input.disabled=true;
  msg.innerHTML='인식 도구를 불러오는 중… <span style="color:var(--ink3)">(처음 한 번은 약 10MB를 받느라 30초쯤 걸려요)</span>';
  var results=[];
  try{
    await O.lib('cv');await O.lib('pdf');
    for(var fi=0;fi<files.length;fi++){
      var rs=await O.readFile(files[fi],function(i,n){msg.innerHTML='읽는 중… <b>'+(fi+1)+'/'+files.length+'번째 파일 · '+i+'/'+n+'쪽</b>';});
      rs.forEach(function(r){r.file=files[fi].name;results.push(r);});
    }
  }catch(e){
    console.error(e);msg.innerHTML='<b style="color:var(--neg)">읽지 못했어요: '+esc(e.message||e)+'</b>';input.disabled=false;return;
  }
  report(applyResults(results,cls),results.length);
  input.disabled=false;
}
/* 읽은 결과를 현재 화면에 채운다. 반환: 요약 */
function applyResults(results,cls){
  var sum={fail:[],skip:[],filled:[],buffered:[],overwritten:0};
  var rows={};document.querySelectorAll('#gradeArea tbody tr[data-code]').forEach(function(tr){rows[tr.dataset.code]=tr;});
  // 덮어쓸 학생이 있는지 먼저 확인
  var good=[];
  results.forEach(function(p){
    if(!p.ok){
      var who=(p.payload&&rows[p.payload.code])?(rows[p.payload.code].dataset.name+' 학생 '):'';
      sum.fail.push((p.file||'')+' '+p.page+'쪽 '+who+'— '+p.error);return;
    }
    var pl=p.payload,nm=(rows[pl.code]&&rows[pl.code].dataset.name)||pl.code;
    if(pl.exam!==EXAM){sum.skip.push(nm+': '+pl.exam+' 시험지예요 (지금은 '+EXAM+' 화면)');return;}
    if(pl.sem!==SEM){sum.skip.push(nm+': 다른 학기('+pl.sem+') 시험지예요');return;}
    if(EXAM==='DT'){
      if(String(pl.level).toUpperCase()!==String(cls.levelCode).toUpperCase()){sum.skip.push(nm+': '+pl.level+' 반 시험지예요 (지금 선택한 반은 '+cls.levelCode+')');return;}
    }else{
      if(O.levelAscii(CURVARIANT).toUpperCase()!==String(pl.level).toUpperCase()){sum.skip.push(nm+': 시험지('+pl.level+')가 지금 선택한 시험지('+CURVARIANT+')와 달라요 — 위 [시험지] 버튼을 맞춰주세요');return;}
    }
    if(!rows[pl.code]){sum.skip.push(pl.code+': 이 반 명단에 없는 학생이에요');return;}
    good.push(p);
  });
  var exist=0;
  good.forEach(function(p){
    var section=EXAM==='AT'?(p.payload.sec==='G'?'문법':'독해'):null;
    if(EXAM==='AT'&&section!==CURTAB)return;
    var tr=rows[p.payload.code];
    if([].some.call(tr.querySelectorAll('td.qcell:not(.sa) input'),function(i){return i.value.trim()!=='';}))exist++;
  });
  if(exist&&!confirm('이미 답이 입력된 학생 '+exist+'명이 있어요. 스캔 결과로 덮어쓸까요?\n(덮어쓰지 않으려면 취소)')){sum.skip.push('덮어쓰기를 취소했어요 — 아무것도 바꾸지 않았어요');return sum;}
  good.forEach(function(p){
    var tr=rows[p.payload.code],nm=tr.dataset.name||p.payload.code;
    if(EXAM==='DT'){
      var w=fillRow(tr,p.answers,scoreRow);sum.filled.push({name:nm,warn:w});
    }else{
      var section=p.payload.sec==='G'?'문법':'독해';
      if(section===CURTAB){
        var ans=aceAns(section);var w2=fillRow(tr,p.answers,function(t){aceScoreRow(t,ans);});sum.filled.push({name:nm,warn:w2,section:section});
      }else{
        var k=bufKey();AT_BUF[k]=AT_BUF[k]||{};AT_BUF[k][section]=AT_BUF[k][section]||{};AT_BUF[k][section][p.payload.code]=p.answers;
        sum.buffered.push({name:nm,section:section});
      }
    }
  });
  return sum;
}
/* AT: 다른 탭에 읽어 둔 값을 그 탭이 열릴 때 채운다(grader.html의 buildAceArea 끝에서 부른다) */
function applyBuffer(){
  if(typeof EXAM==='undefined'||EXAM!=='AT')return;
  var k=bufKey(),b=AT_BUF[k];if(!b||!b[CURTAB])return;
  warnCss();
  var rows={};document.querySelectorAll('#gradeArea tbody tr[data-code]').forEach(function(tr){rows[tr.dataset.code]=tr;});
  var ans=aceAns(CURTAB),n=0,w=0;
  Object.keys(b[CURTAB]).forEach(function(code){
    var tr=rows[code];if(!tr)return;
    w+=fillRow(tr,b[CURTAB][code],function(t){aceScoreRow(t,ans);}).length;n++;
  });
  delete b[CURTAB];
  if(n)O.toastMsg('스캔에서 읽어 둔 '+CURTAB+' 답안 '+n+'명을 채웠어요'+(w?' · 노란 칸 '+w+'개 확인':''),true);
}
function report(sum,total){
  var warnTot=0;sum.filled.forEach(function(f){warnTot+=f.warn.length;});
  var h='<div style="font-size:18px;font-weight:800">OMR 스캔 결과</div>';
  h+='<div style="margin-top:10px;font-size:14px;line-height:1.8">읽은 쪽 <b>'+total+'</b>쪽 → 답안칸에 채운 학생 <b style="color:var(--pos)">'+sum.filled.length+'명</b>'
    +(sum.buffered.length?' · 다른 탭에 대기 <b>'+sum.buffered.length+'명</b>':'')
    +(warnTot?' · <b style="color:#b7791f">노란 칸 '+warnTot+'개</b>':'')+'</div>';
  if(sum.buffered.length){
    var secs={};sum.buffered.forEach(function(b){secs[b.section]=(secs[b.section]||0)+1;});
    h+='<div style="margin-top:6px;font-size:13px;color:var(--ink2)">'+Object.keys(secs).map(function(s){return '<b>'+s+'</b> '+secs[s]+'명';}).join(', ')+'은 해당 <b>탭을 누르면</b> 채워져요. (영역마다 [채점 저장]을 따로 눌러야 해요)</div>';
  }
  if(sum.filled.length){
    h+='<div style="margin-top:12px;max-height:34vh;overflow:auto;border:1px solid var(--line);border-radius:10px">'
     +'<table style="width:100%;border-collapse:collapse;font-size:13px">'+sum.filled.map(function(f){
       return '<tr style="border-bottom:1px solid var(--line2)"><td style="padding:6px 10px;font-weight:700">'+esc(f.name)+'</td><td style="padding:6px 10px;color:'+(f.warn.length?'#b7791f':'var(--pos)')+'">'+(f.warn.length?'확인할 문항 '+f.warn.length+'개: '+f.warn.slice(0,14).join(', ')+(f.warn.length>14?' …':''):'모두 확정')+'</td></tr>';
     }).join('')+'</table></div>';
  }
  if(sum.skip.length||sum.fail.length){
    h+='<div style="margin-top:12px;padding:10px 14px;background:var(--warn-s);border-radius:10px;font-size:12.5px;line-height:1.7;color:var(--warn)"><b>건너뛴 것</b><br>'
      +sum.skip.concat(sum.fail).slice(0,20).map(function(s){return '· '+esc(s);}).join('<br>')+(sum.skip.length+sum.fail.length>20?'<br>…':'')+'</div>';
  }
  if(sum.filled.length)h+='<div style="margin-top:12px;font-size:13px;color:var(--ink2)">👉 노란 칸을 확인해서 필요하면 번호를 고치고, <b>[채점 결과 저장]</b>을 눌러야 저장돼요.</div>';
  h+='<div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn" onclick="OMR.closeModal()">확인</button></div>';
  modal(h);
}

O.enabledFor=enabledFor;O.openPrint=openPrint;O.doPrint=doPrint;O.openScan=openScan;O.doScan=doScan;O.closeModal=closeModal;O.applyBuffer=applyBuffer;O.applyResults=applyResults;
})();
