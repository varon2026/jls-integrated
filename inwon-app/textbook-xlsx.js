/* ============================================================================
   교재리스트 엑셀 — 선생님마다 시트 한 장, 출력 버튼만 누르면 A4 한 장 폭에 맞춰 나온다.

   예전엔 본사 양식을 따라 '레벨·교재 × 선생님 칸에 1' 표와 선생님 이름이 줄마다 반복되는 목록을 줬는데,
   레벨이 줄줄이 이어져 눈에 안 들어오고 칸 너비·색이 없어 그대로 출력할 수가 없었다(운영자 지적).
   그래서 ① 맨 앞 '전체 요약' ② 선생님별 시트(레벨마다 색 띠로 구분, 서명 칸까지) 로 바꿨다.

   · 글자 색·칸 색·테두리가 필요해서 SheetJS(스타일 못 씀) 대신 ExcelJS 를 쓴다(index.html 에서 불러옴).
   · 이 파일은 브라우저와 node 둘 다에서 돌도록 ExcelJS 를 인자로 받는다(화면 없이 시험해 보려고).
   · 레벨 하나(띠 + 헤더 + 교재들)가 쪽을 가로질러 잘리지 않게, 안 들어가면 그 레벨 앞에서 쪽을 나눈다.
   ============================================================================ */
const TBX_BRAND = '8B6EE8';
/* 레벨 계열별 색 (띠 배경 / 글자). 한 시트에 레벨이 여러 개 쭉 이어지니 색으로 갈라서 보이게 한다. */
function tbxLevelColor(lk){
  const b = String(lk).split('|')[0].replace(/\(고등\)/,'').toUpperCase();
  if(/^IS/.test(b)) return ['E3F2FD','1565C0'];
  if(/^DS/.test(b)) return ['E8F5E9','2E7D32'];
  if(/^LS/.test(b)) return ['FFF3E0','E65100'];
  if(/^MS/.test(b)) return ['FCE4EC','AD1457'];
  if(/^(B|HB)$/.test(b)) return ['EDE7F6','5E35B1'];
  if(/^PA/.test(b)) return ['E8EAF6','283593'];
  if(/^(A1|A2|A3)$/.test(b)) return ['E0F7FA','00838F'];
  if(/^MA/.test(b)) return ['F3E5F5','6A1B9A'];
  if(/^(HA|HM)/.test(b)) return ['FFEBEE','C62828'];
  return ['ECEFF1','37474F'];
}
const TBX_AREA = { '활용':'EDE7F6','독해':'E3F2FD','듣기':'FFF8E1','단어':'E8F5E9','문법':'FCE4EC','해설':'F5F5F5','몰입':'FFF3E0',
  'CHESS':'E8EAF6','스토리북':'E0F2F1','말하기':'FFFDE7','쓰기':'F3E5F5','모의고사':'ECEFF1','내신':'ECEFF1','외부':'FFE0B2' };
const TBX_LINE = { style:'thin', color:{ argb:'FFD9D2EE' } };
const TBX_BORDER = { top:TBX_LINE, left:TBX_LINE, bottom:TBX_LINE, right:TBX_LINE };
function tbxFill(hex){ return { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+hex } }; }
function tbxSheetName(name, used){
  let n = String(name||'선생님').replace(/[\\\/\?\*\[\]:]/g,'').trim().slice(0,28) || '선생님';
  let k = n, i = 2; while(used.has(k)){ k = n.slice(0,26)+'_'+i; i++; }
  used.add(k); return k;
}
function tbxMerged(ws, row, text, o){
  o = o||{};
  ws.mergeCells(row,1,row,5);
  const c = ws.getCell(row,1);
  c.value = text;
  c.font = { name:'맑은 고딕', size:o.size||11, bold:!!o.bold, italic:!!o.italic, color:{ argb:'FF'+(o.color||'2A2440') } };
  c.alignment = { vertical:'middle', horizontal:o.align||'left', wrapText:true, indent:o.indent||0 };
  if(o.fill) c.fill = tbxFill(o.fill);
  ws.getRow(row).height = o.height || 20;
}

/* data = { branch, semester, date, teachers:[{name, levels:[{lk,label,grade,classes:[문자열],students,items:[{n,a,x,d,r,m}]}]}] } */
function tbBuildWorkbook(ExcelJS, data){
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JLS'; wb.created = new Date();
  const used = new Set();

  /* ---------- 1) 전체 요약 ---------- */
  const sm = wb.addWorksheet(tbxSheetName('전체 요약', used), { views:[{ showGridLines:false }] });
  sm.columns = [ {width:16},{width:50},{width:12},{width:12},{width:12},{width:14} ];
  sm.mergeCells(1,1,1,6);
  const t1 = sm.getCell(1,1); t1.value = data.branch+'  '+data.semester+'  교재리스트 요약';
  t1.font = { name:'맑은 고딕', size:16, bold:true, color:{ argb:'FFFFFFFF' } }; t1.fill = tbxFill(TBX_BRAND);
  t1.alignment = { vertical:'middle', horizontal:'left', indent:1 }; sm.getRow(1).height = 32;
  sm.mergeCells(2,1,2,6);
  const t2 = sm.getCell(2,1); t2.value = '출력일 '+data.date+'   ·   선생님별 시트는 뒤쪽 탭에 있어요 (선생님 이름 탭 → 인쇄)';
  t2.font = { name:'맑은 고딕', size:10, color:{ argb:'FF6B6385' } }; t2.alignment = { vertical:'middle', indent:1 }; sm.getRow(2).height = 20;
  let r = 4;
  ['선생님','레벨','반 수','교재 수','학원 배부','수령 확인'].forEach((h,i)=>{
    const c = sm.getCell(r,i+1); c.value = h; c.font = { name:'맑은 고딕', size:10, bold:true, color:{ argb:'FF5E35B1' } };
    c.fill = tbxFill('F0EBFE'); c.alignment = { horizontal:'center', vertical:'middle' }; c.border = TBX_BORDER;
  });
  sm.getRow(r).height = 22; r++;
  data.teachers.forEach(t=>{
    const all = t.levels.reduce((s,L)=>s+L.items.length,0);
    const dn  = t.levels.reduce((s,L)=>s+L.items.filter(i=>i.d).length,0);
    const rc  = t.levels.reduce((s,L)=>s+L.items.filter(i=>i.r).length,0);
    const cls = t.levels.reduce((s,L)=>s+L.classes.length,0);
    const vals = [t.name, t.levels.map(L=>L.label).join(', '), cls, all, dn+' / '+all, rc+' / '+all];
    vals.forEach((v,i)=>{
      const c = sm.getCell(r,i+1); c.value = v;
      c.font = { name:'맑은 고딕', size:10, bold:i===0 }; c.border = TBX_BORDER;
      c.alignment = { vertical:'middle', horizontal:i>=2?'center':'left', wrapText:true, indent:i<2?1:0 };
    });
    /* 받은 걸 다 확인했으면 초록, 아직이면 연한 노랑 — 누가 안 했는지 한눈에 */
    const done = all>0 && rc===all;
    sm.getCell(r,6).fill = tbxFill(done?'E6F7F0':'FFF8E1');
    sm.getCell(r,6).font = { name:'맑은 고딕', size:10, bold:true, color:{ argb: done?'FF2E7D32':'FF9A5A12' } };
    sm.getRow(r).height = Math.max(22, 16*Math.ceil(vals[1].length/42));
    r++;
  });
  /* 교재별 필요 권수 — 분원이 책을 준비할 때 쓰는 합계. 선생님 수 = 필요한 교사용 권수 */
  r += 2;
  sm.mergeCells(r,1,r,6);
  const h2 = sm.getCell(r,1); h2.value = '교재별 필요 권수 (교사용)'; h2.font = { name:'맑은 고딕', size:12, bold:true, color:{ argb:'FF5E35B1' } };
  h2.alignment = { indent:1, vertical:'middle' }; sm.getRow(r).height = 24; r++;
  const tot = new Map();
  data.teachers.forEach(t=>t.levels.forEach(L=>L.items.forEach(it=>{
    const k = L.lk+'||'+it.n;
    if(!tot.has(k)) tot.set(k,{ L:L, it:it, n:0 });
    tot.get(k).n++;
  })));
  ['레벨','교재명','영역','필요 권수'].forEach((h,i)=>{
    const col = [1,2,3,4][i];
    const c = sm.getCell(r,col); c.value = h; c.font = { name:'맑은 고딕', size:10, bold:true, color:{ argb:'FF5E35B1' } };
    c.fill = tbxFill('F0EBFE'); c.alignment = { horizontal:'center', vertical:'middle' }; c.border = TBX_BORDER;
  });
  sm.getRow(r).height = 22; r++;
  let lastLv = null;
  [...tot.values()].forEach(x=>{
    const [bg,fg] = tbxLevelColor(x.L.lk);
    const a = sm.getCell(r,1), b = sm.getCell(r,2), c = sm.getCell(r,3), d = sm.getCell(r,4);
    a.value = x.L.lk===lastLv ? '' : x.L.label; lastLv = x.L.lk;
    b.value = x.it.n; c.value = x.it.a; d.value = x.n;
    a.fill = tbxFill(bg); a.font = { name:'맑은 고딕', size:10, bold:true, color:{ argb:'FF'+fg } };
    b.font = { name:'맑은 고딕', size:10 }; c.font = { name:'맑은 고딕', size:10, color:{ argb:'FF6B6385' } }; d.font = { name:'맑은 고딕', size:10, bold:true };
    [a,b,c,d].forEach(z=>{ z.border = TBX_BORDER; z.alignment = { vertical:'middle', horizontal: z===d||z===c?'center':'left', indent: z===a||z===b?1:0 }; });
    if(TBX_AREA[x.it.a]) c.fill = tbxFill(TBX_AREA[x.it.a]);
    sm.getRow(r).height = 20; r++;
  });
  sm.pageSetup = { paperSize:9, orientation:'portrait', fitToPage:true, fitToWidth:1, fitToHeight:0,
    margins:{ left:0.4, right:0.4, top:0.5, bottom:0.6, header:0.2, footer:0.3 }, horizontalCentered:true };
  sm.headerFooter = { oddFooter:'&C&9&P / &N' };

  /* ---------- 2) 선생님마다 한 장 ---------- */
  data.teachers.forEach(t=>{
    const ws = wb.addWorksheet(tbxSheetName(t.name, used), { views:[{ showGridLines:false }] });
    ws.columns = [ {width:13},{width:50},{width:11},{width:11},{width:20} ];
    const all = t.levels.reduce((s,L)=>s+L.items.length,0);
    const cls = t.levels.reduce((s,L)=>s+L.classes.length,0);
    let row = 1, used_pt = 0;
    tbxMerged(ws,row,data.branch+'  '+data.semester+'  교재 배부 확인표',{ size:16, bold:true, color:'FFFFFF', fill:TBX_BRAND, height:32, indent:1 }); row++;
    tbxMerged(ws,row,t.name+' 선생님',{ size:14, bold:true, height:28, indent:1 }); row++;
    tbxMerged(ws,row,'담당 반 '+cls+'개  ·  교재 '+all+'권  ·  출력일 '+data.date,{ size:10, color:'6B6385', height:18, indent:1 }); row++;
    tbxMerged(ws,row,'학원에서 받은 교재가 맞으면 ‘수령 확인’ 칸에 체크(✓)해 주세요. 다르거나 빠진 게 있으면 비고에 적어 주세요.',{ size:10, bold:true, color:'9A5A12', fill:'FFF8E1', height:34, indent:1 }); row++;
    ws.getRow(row).height = 8; row++;
    used_pt = 32+28+18+34+8;
    const PAGE = 720;     // 한 쪽에 들어가는 높이(pt) 대략. 넘치면 레벨 앞에서 쪽을 나눈다.
    t.levels.forEach((L,li)=>{
      const [bg,fg] = tbxLevelColor(L.lk);
      const need = 26+18+22+L.items.length*21+12;
      if(used_pt>0 && used_pt+need>PAGE){ ws.getRow(row-1).addPageBreak(); used_pt = 0; }
      /* 레벨 띠 */
      tbxMerged(ws,row,L.label+(L.grade?'   ·   '+L.grade:'')+'   ·   반 '+L.classes.length+'개 · 학생 '+L.students+'명',{ size:12, bold:true, color:fg, fill:bg, height:26, indent:1 });
      ws.getCell(row,1).border = { left:{ style:'thick', color:{ argb:'FF'+fg } } };
      row++;
      tbxMerged(ws,row,L.classes.join('   |   '),{ size:9, italic:true, color:'6B6385', height:18, indent:1 }); row++;
      ['영역','교재명','학원 배부','수령 확인','비고'].forEach((h,i)=>{
        const c = ws.getCell(row,i+1); c.value = h; c.font = { name:'맑은 고딕', size:10, bold:true, color:{ argb:'FF6B6385' } };
        c.fill = tbxFill('F7F5FB'); c.border = TBX_BORDER; c.alignment = { horizontal:'center', vertical:'middle' };
      });
      ws.getRow(row).height = 22; row++;
      L.items.forEach(it=>{
        const cells = [1,2,3,4,5].map(i=>ws.getCell(row,i));
        cells[0].value = it.a; cells[1].value = it.n;
        cells[2].value = it.d ? '✓' : '☐'; cells[3].value = it.r ? '✓' : '☐';
        cells[4].value = it.m ? '받은 것과 다름' : (it.x ? '외부교재' : '');
        cells.forEach(c=>{ c.border = TBX_BORDER; c.font = { name:'맑은 고딕', size:10 }; c.alignment = { vertical:'middle', horizontal:'left', indent:1 }; });
        cells[0].alignment = { vertical:'middle', horizontal:'center' }; cells[0].font = { name:'맑은 고딕', size:9, color:{ argb:'FF5A5272' } };
        if(TBX_AREA[it.a]) cells[0].fill = tbxFill(TBX_AREA[it.a]);
        [2,3].forEach(k=>{ cells[k].alignment = { vertical:'middle', horizontal:'center' }; cells[k].font = { name:'맑은 고딕', size:13, bold:true, color:{ argb: cells[k].value==='✓' ? 'FF2E7D32' : 'FFB0A8C8' } }; });
        cells[4].font = { name:'맑은 고딕', size:9, bold:!!it.m, color:{ argb: it.m ? 'FFE2557A' : 'FFC9761F' } };
        ws.getRow(row).height = 21; row++;
      });
      ws.getRow(row).height = 12; row++;
      used_pt += need;
    });
    /* 서명 칸 — 본사 양식의 '확인도장'을 대신한다 */
    if(used_pt+70>PAGE){ ws.getRow(row-1).addPageBreak(); }
    row++;
    tbxMerged(ws,row,'선생님 확인      서명 : ______________________        날짜 : ____ 월 ____ 일',{ size:11, bold:true, height:30, indent:1 });
    ws.getCell(row,1).border = { top:{ style:'medium', color:{ argb:'FF8B6EE8' } } };
    row++;
    ws.pageSetup = { paperSize:9, orientation:'portrait', fitToPage:true, fitToWidth:1, fitToHeight:0,
      margins:{ left:0.4, right:0.4, top:0.5, bottom:0.6, header:0.2, footer:0.3 }, horizontalCentered:true };
    ws.headerFooter = { oddFooter:'&L&9'+t.name.replace(/&/g,'&&')+' 선생님&C&9&P / &N' };
    ws.properties.defaultRowHeight = 20;
  });
  return wb;
}
if(typeof module!=='undefined' && module.exports) module.exports = { tbBuildWorkbook };
