/* OMR 답안지 — 출력(학생별 개인 OMR)과 스캔 읽기.
   배경: DT·AT 답안을 OMR을 보고 한 문항씩 입력하는 게 일이라, 스캔 한 번에 답안칸이 채워지게 한다.
   · 출력: 반을 고르면 학생마다 이름·학교·학년·반·담임이 찍히고 QR이 들어간 OMR을 한 번에 뽑는다.
          QR 안에는 학생코드·학기·시험·레벨이 들어 있다(이름은 넣지 않는다).
   · 스캔: 복합기로 스캔한 PDF를 올리면 QR로 '누구의 어떤 시험지인지' 알아내고, 칸마다 칠해진 정도를 재서
          답안칸을 채운다. 채점·저장은 기존 화면 그대로 — 선생님이 노란 칸만 확인하고 [채점 결과 저장]을 누른다.
   · 한 문항에 두 칸을 칠했거나 비운 문항은 '틀린 걸로 처리'(빈칸)하고 노랗게 표시한다.
   ⚠️ 읽는 방법은 실제 스캔 7장(245문항)으로 검증했다(틀리게 읽은 문항 0, 경계에 걸린 3문항은 '확인 필요').
      AT는 모서리 표식이 프린터 여백에 잘려 쓸 수 없었고, QR만으로 위치를 잡으면 먼 쪽 칸이 어긋나서
      '빈 틀'과 위치를 맞추는 보정(ECC)을 한다. 보정에서 QR·이름·손글씨 자리는 뺀다(틀에 없는 내용이라 헷갈림). */
(function(){
'use strict';
var CDN={
  cv:'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.3/dist/opencv.js',
  pdf:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
  pdfw:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
  qr:'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
};
var PX=4;                       // 위치 맞출 때 1pt = 4px
var DPI_SCAN=200;               // 스캔 PDF를 이미지로 펼치는 해상도
/* 칸 위치(pt). 원본 틀에서 동그라미를 찾아 잰 값 — 틀을 바꾸면 다시 재야 한다 */
var GEOM={"dsb":{"W":516,"H":729,"r":4.18,"b":[{"q":1,"rows":[157.7,183.0,208.0,232.9,257.9,282.8,307.7,333.0,358.0,382.9,407.9,432.8,457.7,483.0,508.0,532.9,557.9,582.8,607.7,633.0],"cols":[242.4,282.1,321.5]},{"q":21,"rows":[157.7,183.0,208.0,232.9,257.9,282.8,307.7,333.0,358.0,382.9,407.9,432.8,457.7,483.0,508.0,532.9,557.9,582.8,607.7,633.0],"cols":[385.3,424.6,464.3]}]},"dsc":{"W":516,"H":729,"r":4.18,"b":[{"q":1,"rows":[157.7,183.0,208.0,232.9,257.9,282.8,307.7,333.0,358.0,382.9,407.9,432.8,457.7,483.0,508.0,532.9,557.9,582.8,607.7,633.0],"cols":[237.7,267.2,296.8,326.2]},{"q":21,"rows":[157.7,183.0,208.0,232.9,257.9,282.8,307.7,333.0,358.0,382.9,407.9,432.8,457.7,483.0,508.0,532.9,557.9,582.8,607.7,633.0],"cols":[380.5,410.1,439.6,469.1]}]},"lsa":{"W":516,"H":729,"r":4.18,"b":[{"q":1,"rows":[157.7,183.0,208.0,232.9,257.9,282.8,307.7,333.0,358.0,382.9,407.9,432.8,457.7,483.0,508.0,532.9,557.9,582.8,607.7,633.0],"cols":[237.7,267.2,296.8,326.2]},{"q":21,"rows":[157.7,183.0,208.0,232.9,257.9,282.8,307.7,333.0,358.0,382.9,407.9,432.8,457.7,483.0,508.0,532.9,557.9,582.8,607.7,633.0],"cols":[380.5,410.1,439.6,469.1]}]},"at_grammar":{"W":720,"H":540,"r":3.65,"b":[{"q":1,"rows":[96.3,118.2,139.8,161.6,183.2,205.0,226.6,248.2,270.1,291.7,313.5,335.1,356.7,378.6,400.2,422.0,443.6,465.2,487.0,508.6],"cols":[84.8,124.4,164.0,203.9,243.5]}]},"at_reading":{"W":720,"H":540,"r":3.65,"b":[{"q":1,"rows":[99.4,121.0,142.6,164.5,186.1,207.9,229.5,251.4,273.0,294.6,316.4,338.0,359.8,381.4,403.0,422.7,444.3,465.9,487.8,509.4],"cols":[304.4,341.4,378.1,415.1,451.8]},{"q":21,"rows":[99.4,121.0,142.6,164.5,186.1],"cols":[525.7,562.4,599.4,636.1,673.1]}]}};
/* QR 자리(x,y,크기 pt) */
var QRPOS={dsb:[59,492,100],dsc:[59,492,100],lsa:[59,492,100],at_grammar:[624,92,64],at_reading:[70,110,100]};
/* 위치 보정에서 뺄 곳 — 학생마다 달라지는 내용(QR·이름·손글씨). pt: x0,y0,x1,y1 */
var IGNORE={
  dsb:[[28,30,168,76],[75,96,188,297],[30,486,190,628]],
  dsc:[[28,30,168,76],[75,96,188,297],[30,486,190,628]],
  lsa:[[28,30,168,76],[75,96,188,297],[30,486,190,628]],
  at_grammar:[[606,84,702,522],[268,48,702,84],[290,84,606,522]],
  at_reading:[[20,66,252,524],[268,48,702,84]]
};
var TEMPLATE={dsb:['omr/templates/dsb.pdf',1],dsc:['omr/templates/dsc.pdf',1],lsa:['omr/templates/lsa.pdf',1],
              at_grammar:['omr/templates/at.pdf',1],at_reading:['omr/templates/at.pdf',2]};
/* 칸 판정 기준(실제 스캔 7장으로 정함): 빈 칸은 -0.1~0.04, 칠한 칸은 0.08 이상, 그 사이는 '애매' */
var T_LO=0.04,T_HI=0.08,T_STRONG=0.15;
/* 위치 맞춤 일치도(ECC 상관)가 이보다 낮으면 그 장은 읽지 않는다. 정상 스캔은 0.95~0.99, 실패했던 장은 0.52였다.
   위치가 틀린 채로 읽으면 엉뚱한 칸을 '확정'해 버려서, 못 읽었다고 알리고 선생님이 직접 입력하게 한다 */
var MIN_CC=0.85;

/* ---------------- 공통 도우미 ---------------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function toastMsg(m,ok){ if(typeof toast==='function') toast(m,ok); else console.log(m); }
function loadScript(src){
  return new Promise(function(res,rej){
    var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('불러오지 못했어요: '+src));};document.head.appendChild(s);
  });
}
var libP={},CV=null;   // CV: OpenCV 모듈. 'then'을 가진 객체라 async 함수에서 그대로 돌려주면 영원히 안 끝난다 — 변수에 담아 쓴다
function lib(name){ if(!libP[name]) libP[name]=loadLib(name); return libP[name]; }
async function loadLib(name){
  if(name==='pdf'){
    await loadScript(CDN.pdf);
    var txt=await (await fetch(CDN.pdfw)).text();     // 워커는 다른 주소에서 못 불러서 Blob으로 만든다
    window.pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([txt],{type:'application/javascript'}));
    return window.pdfjsLib;
  }
  if(name==='qr'){ await loadScript(CDN.qr); return window.qrcode; }
  if(name==='cv'){
    await loadScript(CDN.cv);
    var cv=window.cv; if(cv instanceof Promise) cv=await cv;
    if(!cv.Mat) await new Promise(function(r){cv.onRuntimeInitialized=r;});
    CV=cv; return true;
  }
}

/* ---------------- QR 내용 ----------------
   JLSOMR2|학생코드|학기|시험|레벨|문항수|보기수[|sec=G/R]
   한글이 들어가면 QR 읽기가 불안해서 전부 영문·숫자로 만든다(학생코드는 URL 인코딩, 레벨의 '개월' 같은 한글은 뺀다) */
function levelAscii(s){return String(s||'').replace(/[^A-Za-z0-9()\-~.]/g,'');}
function buildPayload(o){
  var p=['JLSOMR2',encodeURIComponent(o.code),o.sem,o.exam,levelAscii(o.level),o.n,o.choices];
  if(o.sec) p.push('sec='+o.sec);
  return p.join('|');
}
function parsePayload(t){
  var f=String(t||'').split('|'); if(f[0]!=='JLSOMR2'||f.length<7) return null;
  var sec=''; for(var i=7;i<f.length;i++){ if(f[i].indexOf('sec=')===0) sec=f[i].slice(4); }
  if(sec==='문법') sec='G'; if(sec==='독해') sec='R';
  var code=f[1]; try{code=decodeURIComponent(f[1]);}catch(e){}
  return {code:code,sem:f[2],exam:f[3],level:f[4],n:f[5],choices:f[6],sec:sec};
}
function templateKey(p){
  if(!p) return null;
  if(p.exam==='DT'){ var lv=p.level.toUpperCase().slice(0,3); return {DSB:'dsb',DSC:'dsc',LSA:'lsa'}[lv]||null; }
  if(p.exam==='AT') return p.sec==='G'?'at_grammar':(p.sec==='R'?'at_reading':null);
  return null;
}
/* 이 레벨을 OMR로 뽑을 틀이 있는지 */
function dtTemplateFor(levelCode){ var lv=String(levelCode||'').toUpperCase().slice(0,3); return {DSB:'dsb',DSC:'dsc',LSA:'lsa'}[lv]||null; }

/* ---------------- 칸 판정 ---------------- */
/* 한 문항의 보기별 값 → {st:'ok'|'blank'|'multi'|'unsure', v:번호|null, c:[칸번호...]} */
function judge(vals){
  var marked=[],unsure=[],strong=[];
  vals.forEach(function(d,i){ if(d>=T_HI) marked.push(i+1); else if(d>=T_LO) unsure.push(i+1); if(d>=T_STRONG) strong.push(i+1); });
  if(strong.length===1&&marked.length===1) return {st:'ok',v:marked[0],c:marked};
  if(marked.length===1&&!unsure.length) return {st:'ok',v:marked[0],c:marked};
  if(!marked.length&&!unsure.length) return {st:'blank',v:null,c:[]};
  if(marked.length>=2) return {st:'multi',v:null,c:marked};
  // 연하게 한 칸만 표시(또는 애매) — 가장 진한 칸을 후보로 두고 선생님 확인
  var best=0,bi=-1; vals.forEach(function(d,i){ if(d>best){best=d;bi=i;} });
  return {st:'unsure',v:bi>=0?bi+1:null,c:marked.concat(unsure)};
}

/* ---------------- 3x3 행렬 ---------------- */
function mul3(A,B){var C=new Array(9);for(var i=0;i<3;i++)for(var j=0;j<3;j++){var s=0;for(var k=0;k<3;k++)s+=A[i*3+k]*B[k*3+j];C[i*3+j]=s;}return C;}
function inv3(m){
  var a=m[0],b=m[1],c=m[2],d=m[3],e=m[4],f=m[5],g=m[6],h=m[7],i=m[8];
  var A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,det=a*A+b*B+c*C;
  return [A/det,-(b*i-c*h)/det,(b*f-c*e)/det,B/det,(a*i-c*g)/det,-(a*f-c*d)/det,C/det,-(a*h-b*g)/det,(a*e-b*d)/det];
}

/* ---------------- 틀(빈 종이) 이미지 ---------------- */
var tplGray={};
async function renderTemplate(key,scale){
  var pdfjs=await lib('pdf'); var t=TEMPLATE[key];
  var doc=await pdfjs.getDocument({url:t[0]}).promise;
  var page=await doc.getPage(t[1]); var vp=page.getViewport({scale:scale});
  var cv=document.createElement('canvas');cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);
  var ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  await page.render({canvasContext:ctx,viewport:vp}).promise;
  return cv;
}
async function templateMat(key){
  await lib('cv'); var cv=CV;
  if(tplGray[key]) return tplGray[key];
  var c=await renderTemplate(key,PX);
  var rgba=cv.imread(c),g=new cv.Mat();cv.cvtColor(rgba,g,cv.COLOR_RGBA2GRAY);rgba.delete();
  tplGray[key]=g;return g;
}

/* ---------------- 스캔 한 쪽 읽기 ---------------- */
function readQR(cv,gray){
  var det=new cv.QRCodeDetector(),pts=new cv.Mat();
  var scales=[1,0.7,0.5];
  try{
    for(var i=0;i<scales.length;i++){
      var s=scales[i],im=gray,tmp=null;
      if(s!==1){tmp=new cv.Mat();cv.resize(gray,tmp,new cv.Size(0,0),s,s,cv.INTER_AREA);im=tmp;}
      var txt='';
      try{txt=det.detectAndDecode(im,pts);}catch(e){txt='';}
      if(tmp) tmp.delete();
      if(txt&&txt.indexOf('JLSOMR2|')===0&&pts.rows>0){
        var d=pts.data32F,p=[];for(var k=0;k<4;k++)p.push([d[k*2]/s,d[k*2+1]/s]);
        return {text:txt,pts:p};
      }
    }
  }finally{ pts.delete(); det.delete&&det.delete(); }
  return null;
}
/* QR 네 귀퉁이 → 틀 좌표로 가는 '회전+크기+이동'(원근 없음)을 최소제곱으로 구한다.
   예전엔 네 점으로 원근 변환까지 계산했는데, 스캔한 종이는 평평한데도 QR 모서리 한 점이 4~5px만 어긋나면
   원근 성분이 생겨 먼 쪽 칸이 크게 틀어졌다. 그 상태로 시작한 위치 맞춤(ECC)이 엉뚱한 곳으로 빠져서
   김지안 장(서수원 AT)이 노란 칸 투성이가 됐다(틀리게 '확정'한 칸도 있었다). */
function similarityFromPts(src,dst){
  var n=src.length,sx=0,sy=0,du=0,dv=0,i;
  for(i=0;i<n;i++){sx+=src[i][0];sy+=src[i][1];du+=dst[i][0];dv+=dst[i][1];}
  sx/=n;sy/=n;du/=n;dv/=n;
  var Sxx=0,Sxy=0,den=0;
  for(i=0;i<n;i++){
    var x=src[i][0]-sx,y=src[i][1]-sy,u=dst[i][0]-du,v=dst[i][1]-dv;
    Sxx+=x*u+y*v;Sxy+=x*v-y*u;den+=x*x+y*y;
  }
  var a=Sxx/den,b=Sxy/den;
  return [a,-b,du-(a*sx-b*sy), b,a,dv-(b*sx+a*sy)];
}
async function alignPage(cv,gray,key,qrPts){
  var g=GEOM[key],q=QRPOS[key],W=g.W,H=g.H;
  var x=q[0],y=q[1],s=q[2];
  var dstPts=[[x*PX,y*PX],[(x+s)*PX,y*PX],[(x+s)*PX,(y+s)*PX],[x*PX,(y+s)*PX]];
  var m=similarityFromPts(qrPts,dstPts);
  var M=cv.matFromArray(2,3,cv.CV_64F,m);
  var warp=new cv.Mat();
  cv.warpAffine(gray,warp,M,new cv.Size(W*PX,H*PX),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255));
  M.delete();
  var tpl=await templateMat(key);
  // 큰 그림 → 세밀하게 3단계로 위치 맞추기(빈 틀과 비교)
  var Wf=[1,0,0,0,1,0,0,0,1],cc=0,stageCC=[];
  var stages=[[0.125,3.0],[0.25,2.0],[0.5,1.5]];
  for(var si=0;si<stages.length;si++){
    var s2=stages[si][0],sig=stages[si][1]/2;      // 축소한 뒤 흐리게 (파이썬에서 원본에 σ=단계값/(2×배율)로 흐린 것과 같다)
    var a=new cv.Mat(),b=new cv.Mat(),a32=new cv.Mat(),b32=new cv.Mat();
    cv.resize(tpl,a,new cv.Size(0,0),s2,s2,cv.INTER_AREA);cv.resize(warp,b,new cv.Size(0,0),s2,s2,cv.INTER_AREA);
    cv.GaussianBlur(a,a,new cv.Size(0,0),sig,sig,cv.BORDER_DEFAULT);cv.GaussianBlur(b,b,new cv.Size(0,0),sig,sig,cv.BORDER_DEFAULT);
    a.convertTo(a32,cv.CV_32F,1/255);b.convertTo(b32,cv.CV_32F,1/255);
    var S=[s2,0,0,0,s2,0,0,0,1],Ws=mul3(mul3(S,Wf),inv3(S));
    var Wm=cv.matFromArray(3,3,cv.CV_32F,Ws);
    var mask=new cv.Mat(b.rows,b.cols,cv.CV_8U,new cv.Scalar(255));
    IGNORE[key].forEach(function(r){cv.rectangle(mask,new cv.Point(Math.floor(r[0]*PX*s2),Math.floor(r[1]*PX*s2)),new cv.Point(Math.floor(r[2]*PX*s2)-1,Math.floor(r[3]*PX*s2)-1),new cv.Scalar(0),-1);});
    var crit=new cv.TermCriteria(cv.TermCriteria_EPS+cv.TermCriteria_COUNT,200,1e-6),ok=true;
    try{ cc=cv.findTransformECC(a32,b32,Wm,cv.MOTION_HOMOGRAPHY,crit,mask,5); stageCC.push(+cc.toFixed(3)); }catch(e){ ok=false; stageCC.push('오류'); }
    if(ok){ var wv=Array.prototype.slice.call(Wm.data32F); Wf=mul3(mul3(inv3(S),wv),S); }
    a.delete();b.delete();a32.delete();b32.delete();Wm.delete();mask.delete();
    if(!ok) break;
  }
  var out=new cv.Mat(),Wmat=cv.matFromArray(3,3,cv.CV_32F,Wf);
  cv.warpPerspective(warp,out,Wmat,new cv.Size(W*PX,H*PX),cv.INTER_LINEAR+cv.WARP_INVERSE_MAP,cv.BORDER_CONSTANT,new cv.Scalar(255));
  Wmat.delete();warp.delete();
  return {img:out,cc:cc,stages:stageCC,W:Wf};
}
/* 칸마다 '안쪽 평균 / 바깥 고리 중앙값'으로 얼마나 진한지 → 같은 장·같은 열의 중앙값을 빼서 빈 칸이 0이 되게 */
function measure(key,img){
  var g=GEOM[key],r=g.r*PX,rin=r*0.68,r1=r*1.45,r2=r*2.0,data=img.data,w=img.cols,h=img.rows,res={};
  g.b.forEach(function(b){
    b.rows.forEach(function(cy,ri){
      var q=b.q+ri,vals=[];
      b.cols.forEach(function(cx){
        var px=cx*PX,py=cy*PX,x0=Math.max(0,Math.floor(px-r2-2)),x1=Math.min(w,Math.floor(px+r2+3)),y0=Math.max(0,Math.floor(py-r2-2)),y1=Math.min(h,Math.floor(py+r2+3));
        var sum=0,n=0,ring=[];
        for(var y=y0;y<y1;y++){for(var x=x0;x<x1;x++){
          var d2=(x-px)*(x-px)+(y-py)*(y-py),v=data[y*w+x];
          if(d2<=rin*rin){sum+=v;n++;}else if(d2>=r1*r1&&d2<=r2*r2){ring.push(v);}
        }}
        ring.sort(function(a,b){return a-b;});
        var bg=Math.max(ring.length?ring[ring.length>>1]:255,1);
        vals.push(n?1-(sum/n)/bg:0);
      });
      res[q]=vals;
    });
    var qs=b.rows.map(function(_,i){return b.q+i;});
    for(var k=0;k<b.cols.length;k++){
      var col=qs.map(function(q){return res[q][k];}).sort(function(a,b){return a-b;});
      var med=(col[(col.length-1)>>1]+col[col.length>>1])/2;
      qs.forEach(function(q){res[q][k]-=med;});
    }
  });
  return res;
}
/* 한 쪽 이미지(canvas)를 읽는다 → {ok,payload,key,answers,cc} */
async function readCanvas(canvas){
  await lib('cv'); var cv=CV;
  var rgba=cv.imread(canvas),gray=new cv.Mat();cv.cvtColor(rgba,gray,cv.COLOR_RGBA2GRAY);rgba.delete();
  try{
    var qr=readQR(cv,gray);
    if(!qr) return {ok:false,error:'QR을 못 읽었어요'};
    var p=parsePayload(qr.text),key=templateKey(p);
    if(!p||!key) return {ok:false,error:'지원하지 않는 OMR이에요 ('+qr.text.slice(0,40)+')'};
    var al=await alignPage(cv,gray,key,qr.pts);
    if(!(al.cc>=MIN_CC)){ al.img.delete(); return {ok:false,error:'칸 위치를 맞추지 못했어요(일치도 '+(al.cc||0).toFixed(2)+') — 비뚤게 스캔됐거나 접힌 것 같아요. 다시 스캔하거나 직접 입력하세요',payload:p,key:key,cc:al.cc}; }
    var m=measure(key,al.img);al.img.delete();
    var answers={};Object.keys(m).forEach(function(q){answers[q]=judge(m[q]);});
    return {ok:true,payload:p,key:key,answers:answers,vals:m,cc:al.cc};
  }finally{ gray.delete(); }
}
async function readFile(file,onProgress){
  var pages=[];
  if(/^image\//.test(file.type)){
    var img=new Image();img.src=URL.createObjectURL(file);await img.decode();
    var c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);
    if(onProgress) onProgress(1,1);
    var r=await readCanvas(c);r.page=1;pages.push(r);return pages;
  }
  var pdfjs=await lib('pdf');
  var doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  for(var i=1;i<=doc.numPages;i++){
    if(onProgress) onProgress(i,doc.numPages);
    var page=await doc.getPage(i),vp=page.getViewport({scale:DPI_SCAN/72});
    var cvs=document.createElement('canvas');cvs.width=Math.round(vp.width);cvs.height=Math.round(vp.height);
    var ctx=cvs.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cvs.width,cvs.height);
    await page.render({canvasContext:ctx,viewport:vp}).promise;
    var res;
    try{res=await readCanvas(cvs);}catch(e){res={ok:false,error:'읽는 중 오류: '+(e&&e.message||e)};}
    res.page=i;pages.push(res);
    await new Promise(function(r){setTimeout(r,0);});     // 화면이 멈춰 보이지 않게 숨 돌리기
  }
  return pages;
}

window.OMR={
  CDN:CDN,GEOM:GEOM,QRPOS:QRPOS,TEMPLATE:TEMPLATE,
  lib:lib,esc:esc,buildPayload:buildPayload,parsePayload:parsePayload,templateKey:templateKey,dtTemplateFor:dtTemplateFor,levelAscii:levelAscii,
  judge:judge,readCanvas:readCanvas,readFile:readFile,renderTemplate:renderTemplate,toastMsg:toastMsg
};
})();
