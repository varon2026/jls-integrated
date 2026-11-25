/* ============================================================================
   AT 성적표 링크 (학사관리 › AT 성적표)

   왜 만들었나: 큐앱에는 정규반 학생만 AT 성적을 올릴 수 있다. A2 중1 학생들이 내신반에 가 있으면
   반을 정규반으로 옮겼다가 다시 내신반으로 옮겨야 했다(수기로 전부). 그래서 성적 엑셀을 올리면
   학생마다 성적표 화면(루트의 at-report.html)과 그 주소를 만들고, 주소는 분원이 문자로 보낸다.

   · 성적 엑셀 모양: 한 시트에 한 담임 반, 열은 [학생코드 학생이름 학교명/학년 레벨 수업요일 담임선생님 ... 점수 문법 문법(항목…) 독해 독해(항목…)].
     열 이름 '문법 (만점 16점) (분사)' 에서 영역·만점·항목 이름을 읽는다(`atParseRows`). 영역 이름이 문법·독해가 아니어도 읽는다.
   · 같은 항목 이름이 두 칸에 나뉘어 있으면(예: '간접 말하기, 쓰기' 2점 + 10점) 한 줄로 합친다 —
     큐앱 화면이 그렇게 12점 한 줄로 보여 준다.
   · 주소는 서버(at_cards_upsert)가 만든다. 같은 학생·같은 시험을 다시 올리면 주소는 그대로 두고 점수만 바꾼다
     → 문자를 이미 보낸 뒤에 점수를 고쳐도 학부모 링크가 안 깨진다. sql/at_report_cards.sql 필요.
   ============================================================================ */
const ATC = { rows: [], title: '', fileName: '', warn: [], result: null, missing: false };

function atcNorm(h){ return String(h==null?'':h).replace(/\s+/g,' ').trim(); }
/* 항목 이름 비교용 — 띄어쓰기·쉼표만 다른 같은 이름('간접 말하기 , 쓰기' / '간접 말하기, 쓰기')을 하나로 본다 */
function atcKey(s){ return String(s).replace(/[\s,]/g,''); }
function atcClean(s){ return String(s).replace(/\s*,\s*/g,', ').replace(/\s+/g,' ').trim(); }

/* rows: 시트를 배열의 배열로 읽은 것(첫 줄 = 머리글). 반환: {students:[…], warn:[…]} */
function atParseRows(rows, sheetName){
  const head = (rows[0]||[]).map(atcNorm);
  const col = re => head.findIndex(h=>re.test(h));
  const iCode=col(/^학생코드/), iName=col(/^학생이름/), iSch=col(/^학교/), iLv=col(/^레벨/), iDay=col(/^수업요일/), iTc=col(/^담임/), iTot=col(/^점수/);
  const warn=[];
  if(iName<0 || iTot<0) return { students:[], warn:['머리글에서 학생이름·점수 칸을 못 찾았습니다 ('+sheetName+')'] };
  const totMax = +((head[iTot].match(/만점 (\d+)/)||[])[1]||100);
  /* 영역·항목 칸 */
  const secOrder=[], secs={}, cols=[];
  head.forEach((h,i)=>{
    if(i===iTot || i<=iTot) return;
    const m=h.match(/^(.+?) \(만점 (\d+)점\)(?: \((.+)\))?$/);
    if(!m) return;
    const sec=m[1], max=+m[2], item=m[3]?atcClean(m[3]):null;
    if(!secs[sec]){ secs[sec]={name:sec, max:0, itemKeys:[], itemName:{}, itemMax:{}}; secOrder.push(sec); }
    if(!item){ secs[sec].max=max; cols.push({i:i, sec:sec, item:null}); }
    else {
      const k=atcKey(item); const S=secs[sec];
      if(S.itemKeys.indexOf(k)<0){ S.itemKeys.push(k); S.itemName[k]=item; S.itemMax[k]=0; }
      S.itemMax[k]+=max;
      cols.push({i:i, sec:sec, item:k});
    }
  });
  const students=[];
  rows.slice(1).forEach(r=>{
    const name=atcNorm(r[iName]); if(!name) return;
    const num=v=>{ const n=parseFloat(v); return isNaN(n)?0:n; };
    const sections=secOrder.map(sn=>{
      const S=secs[sn]; const items=S.itemKeys.map(k=>({name:S.itemName[k], score:0, max:S.itemMax[k]}));
      return {name:sn, score:0, max:S.max, items:items, _S:S};
    });
    cols.forEach(c=>{
      const sec=sections.find(x=>x.name===c.sec);
      if(c.item===null) sec.score=num(r[c.i]);
      else sec.items[sec._S.itemKeys.indexOf(c.item)].score+=num(r[c.i]);
    });
    const w=[];
    sections.forEach(s=>{
      const sum=s.items.reduce((a,b)=>a+b.score,0), msum=s.items.reduce((a,b)=>a+b.max,0);
      if(s.items.length && Math.abs(sum-s.score)>0.01) w.push(s.name+' 세부 합('+sum+')이 영역 점수('+s.score+')와 다름');
      if(s.items.length && msum!==s.max) w.push(s.name+' 세부 만점 합('+msum+')이 영역 만점('+s.max+')과 다름');
      delete s._S;
    });
    const total=num(r[iTot]);
    const secSum=sections.reduce((a,b)=>a+b.score,0);
    if(sections.length && Math.abs(secSum-total)>0.01) w.push('영역 합('+secSum+')이 총점('+total+')과 다름');
    students.push({
      code: iCode>=0?atcNorm(r[iCode]):'', name:name,
      school: iSch>=0?atcNorm(r[iSch]).replace('/',' · '):'', level: iLv>=0?atcNorm(r[iLv]):'',
      day: iDay>=0?atcNorm(r[iDay]):'', teacher: iTc>=0?atcNorm(r[iTc]):'',
      total:total, totalMax:totMax, sections:sections, warn:w, sheet:sheetName
    });
  });
  return { students:students, warn:warn };
}
/* 시트 이름 'A2(1-3)Mark' → 'A2(1-3개월)' */
function atcLevelFromSheet(sn){
  const m=String(sn).match(/^([A-Za-z]+\d*)\((\d+-\d+)\)/);
  return m ? m[1]+'('+m[2]+'개월)' : '';
}

function atcBranchId(){ return session.role==='admin' ? (state.tbBranch || (db.branches[0]&&db.branches[0].id)) : session.branchId; }

function renderAtCard(){
  crumbs([{label:'AT 성적표'}]);
  const brId=atcBranchId(), b=getBranch(brId)||{};
  const sem=(db.semesters.find(s=>s.id===state.semId)||{}).name||'';
  const brSel = session.role==='admin'
    ? `<select class="tb-sel" style="border:1px solid var(--line);border-radius:8px;padding:6px" onchange="state.tbBranch=this.value;ATC.rows=[];ATC.result=null;renderAtCard()">${db.branches.map(x=>`<option value="${esc(x.id)}"${x.id===brId?' selected':''}>${esc(x.name)}</option>`).join('')}</select>`:'';
  let h=`<div class="page-head" style="display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap">
    <div><h2>AT 성적표</h2><div class="sub">${esc(b.name||'')} · ${esc(sem)} · 성적 엑셀을 올리면 학생마다 성적표 링크가 만들어져요</div></div>
    <div style="margin-left:auto">${brSel}</div></div>
  <div style="background:var(--brand-soft);border:1.5px solid #cebef4;border-radius:12px;padding:14px 18px;margin:0 0 16px;font-size:13.5px;line-height:1.7">
    <b style="color:var(--brand)">쓰는 방법</b> ① 큐앱 AT 성적 엑셀(반마다 시트 하나)을 고르면 아래에 미리보기가 떠요. ② 시험 이름을 확인하고 [링크 만들기]. ③ 나온 엑셀을 내려받아 문자 발송에 붙여 쓰세요.<br>
    같은 학생·같은 시험을 다시 올리면 <b>링크는 그대로, 점수만</b> 바뀌어요(이미 보낸 문자 링크도 안 깨져요).</div>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
    <input type="file" id="atcFile" accept=".xlsx,.xls" onchange="atcPick(this.files[0])">
    ${ATC.rows.length?`<span style="font-size:12.5px;color:var(--ink-3)">${esc(ATC.fileName)} · 학생 ${ATC.rows.length}명</span>`:''}
  </div>`;
  if(ATC.missing) h+=`<div style="background:var(--neg-soft);border:1px solid #f6c4d1;color:#b8325a;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px"><b>AT 성적표 표가 아직 없습니다.</b> Supabase SQL Editor 에서 <b>sql/at_report_cards.sql</b> 을 한 번 실행한 뒤 이 화면을 새로고침해 주세요.</div>`;
  if(ATC.warn.length) h+=`<div style="background:var(--warn-soft);border:1px solid #f6d9b4;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#9a5a12">${ATC.warn.map(esc).join('<br>')}</div>`;
  if(ATC.rows.length){
    const bad=ATC.rows.filter(r=>r.warn.length).length, noPhone=ATC.rows.filter(r=>!r.phone).length;
    h+=`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
      <label style="font-size:13px;font-weight:700">시험 이름</label>
      <input id="atcTitle" value="${esc(ATC.title)}" style="flex:1;min-width:280px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:13.5px" onchange="ATC.title=this.value.trim()">
      <button class="btn primary" onclick="atcMake()">링크 만들기 (${ATC.rows.length}명)</button>
      ${ATC.result?`<button class="btn" style="border-color:var(--brand);color:var(--brand)" onclick="atcDownload()">⬇ 링크 엑셀 내려받기</button>`:''}
    </div>
    <div style="font-size:12px;color:var(--ink-3);margin-bottom:8px">${bad?`⚠ 점수 합이 안 맞는 학생 ${bad}명(아래 표시) · `:''}학부모 연락처를 못 찾은 학생 ${noPhone}명(링크 엑셀에서 빈칸)</div>
    <div class="table-wrap"><div class="table-scroll"><table class="rank-table"><thead><tr><th>학생명</th><th>학생코드</th><th>레벨·담임</th><th>총점</th>${ATC.rows[0].sections.map(s=>`<th>${esc(s.name)}</th>`).join('')}<th>학부모 연락처</th><th>${ATC.result?'링크':'확인'}</th></tr></thead><tbody>
    ${ATC.rows.map(r=>{
      const link=ATC.result&&ATC.result[r.code];
      return `<tr><td class="nm">${esc(r.name)}</td><td><span class="code-chip">${esc(r.code)}</span></td><td style="font-size:12px;color:var(--ink-3)">${esc(r.level)} · ${esc(r.teacher)}</td>
      <td class="num">${r.total}</td>${r.sections.map(s=>`<td class="num">${s.score}/${s.max}</td>`).join('')}
      <td style="font-size:12px">${r.phone?esc(r.phone):'<span style="color:var(--ink-3)">없음</span>'}</td>
      <td style="font-size:12px">${link?`<a href="${esc(link)}" target="_blank" rel="noopener" style="color:var(--brand)">열어 보기</a>`:(r.warn.length?`<span style="color:var(--neg)">${esc(r.warn.join(' / '))}</span>`:'<span style="color:var(--pos)">✓</span>')}</td></tr>`;
    }).join('')}</tbody></table></div></div>`;
  }
  el('content').innerHTML=h;
}

async function atcPick(file){
  if(!file) return;
  try{
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
    const all=[], warn=[]; let level=''; const levels=new Set();
    wb.SheetNames.forEach(sn=>{
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:''});
      if(!rows.length) return;
      const r=atParseRows(rows, sn);
      r.warn.forEach(x=>warn.push(x));
      r.students.forEach(s=>all.push(s));
      const lv=atcLevelFromSheet(sn); if(lv){ levels.add(lv); if(!level) level=lv; }
    });
    if(levels.size>1) warn.push('시트마다 레벨이 다릅니다('+[...levels].join(', ')+'). 시험 이름이 하나로 들어가니 레벨별로 파일을 나눠 올려 주세요.');
    const dup=new Set(), seen=new Set(); all.forEach(s=>{ if(s.code&&seen.has(s.code)) dup.add(s.name); seen.add(s.code); });
    if(dup.size) warn.push('학생코드가 겹치는 학생: '+[...dup].join(', ')+' (뒤엣것으로 덮어씁니다)');
    const noCode=all.filter(s=>!s.code); if(noCode.length) warn.push('학생코드가 없는 학생 '+noCode.length+'명은 링크를 만들 수 없습니다: '+noCode.map(s=>s.name).join(', '));
    const semNm=((db.semesters.find(s=>s.id===state.semId)||{}).name||'').replace(/(\d{4})년/,'$1');
    ATC.title = (semNm?semNm+' ':'')+'AT시험'+(level?' '+level:'');
    ATC.rows = all.filter(s=>s.code); ATC.fileName=file.name; ATC.warn=warn; ATC.result=null; ATC.missing=false;
    await atcFindPhones();
  }catch(e){ console.error(e); toast('엑셀을 읽지 못했습니다','err'); ATC.rows=[]; }
  renderAtCard();
}
/* 학부모 연락처 — 교재 명단(bk_students.contact)에서 학생코드로 찾는다. 없으면 빈칸. */
async function atcFindPhones(){
  try{
    const codes=ATC.rows.map(r=>r.code); const map={};
    for(let i=0;i<codes.length;i+=150){
      const { data } = await sb.from('bk_students').select('student_id,contact').in('student_id', codes.slice(i,i+150));
      (data||[]).forEach(x=>{ if(x.contact) map[x.student_id]=String(x.contact); });
    }
    ATC.rows.forEach(r=>{ r.phone=map[r.code]||''; });
  }catch(e){ console.warn('연락처 조회 실패', e); ATC.rows.forEach(r=>{ r.phone=''; }); }
}
function atcBase(){ return new URL('../at-report.html', location.href).href.replace(/[?#].*$/,''); }
async function atcMake(){
  const title=(document.getElementById('atcTitle')||{}).value||ATC.title;
  if(!title.trim()){ toast('시험 이름을 적어 주세요','err'); return; }
  ATC.title=title.trim();
  if(!ATC.rows.length) return;
  const brId=atcBranchId(), semId=state.semId;
  const rows=ATC.rows.map(r=>({ branch_id:brId, semester_id:semId, student_code:r.code, student_name:r.name, exam_title:ATC.title,
    created_by:(session&&session.username)||null,
    payload:{ student:{name:r.name, school:r.school, level:r.level, day:r.day, teacher:r.teacher},
              total:{score:r.total, max:r.totalMax}, sections:r.sections } }));
  const { data, error } = await sb.rpc('at_cards_upsert', { p_rows: rows });
  if(error){
    console.error(error); ATC.missing = /at_cards_upsert|schema cache|does not exist/i.test(String(error.message||error.code));
    toast(ATC.missing?'AT 성적표 표가 아직 없습니다':'링크를 만들지 못했습니다','err'); renderAtCard(); return;
  }
  const out={}; (data||[]).forEach(x=>{ out[x.student_code]=atcBase()+'?t='+x.token; });
  ATC.result=out; toast(Object.keys(out).length+'명 링크를 만들었습니다'); renderAtCard();
}
function atcDownload(){
  if(!ATC.result) return;
  const b=(getBranch(atcBranchId())||{}).name||'분원';
  const aoa=[['학생명','학생코드','학부모 연락처','반(레벨·담임)','총점','성적표 링크','문자 문구 예시']];
  ATC.rows.forEach(r=>{
    const link=ATC.result[r.code]||'';
    aoa.push([r.name, r.code, r.phone||'', r.level+' '+r.teacher, r.total, link,
      '[정상어학원] '+r.name+' 학생의 '+ATC.title+' 성적표입니다. 아래 링크에서 확인하세요. '+link]);
  });
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols']=[{wch:10},{wch:14},{wch:16},{wch:20},{wch:6},{wch:70},{wch:90}];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'성적표 링크');
  XLSX.writeFile(wb, b+'_AT성적표링크_'+ATC.title.replace(/[\\/:*?"<>|]/g,'')+'.xlsx');
}
