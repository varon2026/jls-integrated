#!/usr/bin/env python3
"""AT 성적표 링크 만들기.

큐앱 AT 성적 엑셀(반마다 시트 하나)을 읽어서 두 가지를 만든다.
  1) at_cards_insert_<이름>.sql  — Supabase SQL Editor 에서 실행하면 학생별 성적이 들어간다
  2) AT성적표링크_<이름>.xlsx    — 학생명 / 학생코드 / 반 / 총점 / 성적표 링크 / 문자 문구
엑셀 머리글 '문법 (만점 16점) (분사)' 에서 영역·만점·항목을 읽고, 같은 항목 이름이 두 칸에
나뉘어 있으면('간접 말하기, 쓰기' 2점 + 10점) 한 줄로 합친다 — 큐앱 화면이 그렇게 보여 준다.

쓰는 법:  python3 tools/at_report_make.py 성적.xlsx --title "2026 겨울학기 AT시험 A2(1-3개월)" \
            --branch br_seosuwon --semester sem_2026_winter --out 출력폴더
"""
import argparse, json, re, secrets, sys, os
import openpyxl

SITE = 'https://varon2026.github.io/jls-integrated/at-report.html'

def norm(h): return re.sub(r'\s+', ' ', str(h if h is not None else '')).strip()
def ikey(s): return re.sub(r'[\s,]', '', s)
def iclean(s): return re.sub(r'\s+', ' ', re.sub(r'\s*,\s*', ', ', s)).strip()
def num(v):
    try: return float(v)
    except (TypeError, ValueError): return 0.0
def fmt(n): return int(n) if float(n).is_integer() else n

def parse_sheet(ws):
    rows = list(ws.iter_rows(values_only=True))
    head = [norm(h) for h in rows[0]]
    def col(rx):
        for i, h in enumerate(head):
            if re.search(rx, h): return i
        return -1
    iCode, iName, iSch, iLv, iDay, iTc, iTot = (col(r) for r in (r'^학생코드', r'^학생이름', r'^학교', r'^레벨', r'^수업요일', r'^담임', r'^점수'))
    if iName < 0 or iTot < 0: raise SystemExit('머리글에서 학생이름·점수 칸을 못 찾았습니다: ' + ws.title)
    totmax = float((re.search(r'만점 (\d+)', head[iTot]) or [0, 100])[1])
    order, secs, cols = [], {}, []
    for i, h in enumerate(head):
        if i <= iTot: continue
        m = re.match(r'^(.+?) \(만점 (\d+)점\)(?: \((.+)\))?$', h)
        if not m: continue
        sec, mx, item = m.group(1), float(m.group(2)), m.group(3)
        if sec not in secs: secs[sec] = {'max': 0, 'keys': [], 'name': {}, 'imax': {}}; order.append(sec)
        S = secs[sec]
        if not item: S['max'] = mx; cols.append((i, sec, None))
        else:
            k = ikey(item)
            if k not in S['keys']: S['keys'].append(k); S['name'][k] = iclean(item); S['imax'][k] = 0
            S['imax'][k] += mx; cols.append((i, sec, k))
    out, warns = [], []
    for r in rows[1:]:
        name = norm(r[iName])
        if not name: continue
        sections = []
        for sn in order:
            S = secs[sn]
            sections.append({'name': sn, 'score': 0.0, 'max': S['max'],
                             'items': [{'name': S['name'][k], 'score': 0.0, 'max': S['imax'][k]} for k in S['keys']]})
        for i, sec, k in cols:
            s = next(x for x in sections if x['name'] == sec)
            if k is None: s['score'] = num(r[i])
            else: s['items'][secs[sec]['keys'].index(k)]['score'] += num(r[i])
        total = num(r[iTot]); w = []
        for s in sections:
            if s['items'] and abs(sum(x['score'] for x in s['items']) - s['score']) > .01: w.append(s['name'] + ' 세부 합이 영역 점수와 다름')
        if sections and abs(sum(s['score'] for s in sections) - total) > .01: w.append('영역 합이 총점과 다름')
        for s in sections:
            s['score'] = fmt(s['score']); s['max'] = fmt(s['max'])
            for x in s['items']: x['score'] = fmt(x['score']); x['max'] = fmt(x['max'])
        if w: warns.append(name + ': ' + ' / '.join(w))
        out.append({
            'code': norm(r[iCode]) if iCode >= 0 else '', 'name': name,
            'school': norm(r[iSch]).replace('/', ' · ') if iSch >= 0 else '',
            'level': norm(r[iLv]) if iLv >= 0 else '', 'teacher': norm(r[iTc]) if iTc >= 0 else '',
            'total': fmt(total), 'totmax': fmt(totmax), 'sections': sections, 'sheet': ws.title})
    return out, warns

def sql_str(s): return "'" + str(s).replace("'", "''") + "'"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('xlsx'); ap.add_argument('--title', required=True)
    ap.add_argument('--branch', required=True); ap.add_argument('--semester', required=True)
    ap.add_argument('--out', required=True); ap.add_argument('--tag', default='')
    a = ap.parse_args()
    wb = openpyxl.load_workbook(a.xlsx, data_only=True)
    students, warns = [], []
    for ws in wb:
        s, w = parse_sheet(ws); students += s; warns += w
    nocode = [s['name'] for s in students if not s['code']]
    if nocode: raise SystemExit('학생코드가 없는 학생: ' + ', '.join(nocode))
    seen = {}
    for s in students: seen[s['code']] = s            # 학생코드가 겹치면 뒤엣것
    students = list(seen.values())
    for s in students: s['token'] = secrets.token_hex(24)
    os.makedirs(a.out, exist_ok=True)
    tag = a.tag or re.sub(r'[^0-9A-Za-z가-힣_-]+', '_', a.title)
    sqlp = os.path.join(a.out, 'at_cards_insert_%s.sql' % tag)
    with open(sqlp, 'w', encoding='utf-8') as f:
        f.write('-- AT 성적표 %s — %d명. Supabase SQL Editor 에서 한 번 실행.\n' % (a.title, len(students)))
        f.write('-- 같은 학생·같은 시험을 다시 넣으면 점수만 바뀌고 링크(token)는 그대로다.\n\n')
        f.write('insert into at_cards (token, branch_id, semester_id, student_code, student_name, exam_title, payload, created_by) values\n')
        vals = []
        for s in students:
            payload = {'student': {'name': s['name'], 'school': s['school'], 'level': s['level'], 'teacher': s['teacher']},
                       'total': {'score': s['total'], 'max': s['totmax']}, 'sections': s['sections']}
            vals.append('(%s,%s,%s,%s,%s,%s,%s::jsonb,%s)' % (sql_str(s['token']), sql_str(a.branch), sql_str(a.semester), sql_str(s['code']),
                        sql_str(s['name']), sql_str(a.title), sql_str(json.dumps(payload, ensure_ascii=False)), sql_str('claude')))
        f.write(',\n'.join(vals))
        f.write('\non conflict (branch_id, semester_id, student_code, exam_title)\ndo update set student_name = excluded.student_name, payload = excluded.payload;\n\n')
        f.write('-- 확인: %d 이어야 함\nselect count(*) from at_cards where branch_id = %s and semester_id = %s and exam_title = %s;\n' % (len(students), sql_str(a.branch), sql_str(a.semester), sql_str(a.title)))
        f.write('\n-- 이미 만든 학생을 다시 넣었다면 링크(token)는 옛 것이 유지돼 엑셀의 링크와 다를 수 있다. 그때는 아래를 실행해 결과를 보내 주세요.\n')
        f.write('-- select student_name, student_code, token from at_cards where branch_id = %s and semester_id = %s and exam_title = %s order by student_name;\n' % (sql_str(a.branch), sql_str(a.semester), sql_str(a.title)))
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    wb2 = openpyxl.Workbook(); ws = wb2.active; ws.title = '성적표 링크'
    ws.append(['학생명', '학생코드', '반(레벨·담임)', '총점', '성적표 링크', '문자 문구 예시'])
    for s in students:
        link = SITE + '?t=' + s['token']
        ws.append([s['name'], s['code'], (s['level'] + ' ' + s['teacher']).strip(), s['total'], link,
                   '[정상어학원] %s 학생의 %s 성적표입니다. 아래 링크에서 확인하세요. %s' % (s['name'], a.title, link)])
    for c, w in zip('ABCDEF', [10, 14, 18, 6, 78, 120]): ws.column_dimensions[c].width = w
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='8B6EE8'); c.alignment = Alignment(horizontal='center')
    for row in ws.iter_rows(min_row=2):
        for c in row: c.border = Border(bottom=Side(style='thin', color='DDDDDD'))
    ws.freeze_panes = 'A2'
    xp = os.path.join(a.out, 'AT성적표링크_%s.xlsx' % tag); wb2.save(xp)
    print('학생', len(students), '명'); print(sqlp); print(xp)
    for w in warns: print('경고:', w)

if __name__ == '__main__': main()
