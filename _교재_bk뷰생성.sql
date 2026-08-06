-- ============================================================
-- 교재 재고 뷰를 메인 DB(jls-counseling)에 생성 (bk_ 접두어)
-- 실행 위치: jls-counseling(메인) → SQL Editor → Run
-- bk_sales_history + bk_books 로부터 분원별 재고를 계산하는 뷰.
--   재고 = (입고류: 입고·초기재고·분원입고, 입고취소는 -) - (출고류: 출고·분원출고·반품, 출고취소는 +)
-- ============================================================

create or replace view bk_stock_by_branch_all as
 select b.name as book_name,
        b.note,
        b.vendor,
        sh.branch,
        sh.barcode,
        (sum(case
                when sh.type = any (array['입고','초기재고','분원입고']) then sh.qty
                when sh.type = '입고취소' then (- sh.qty)
                else 0
             end)
       - sum(case
                when sh.type = any (array['출고','분원출고','반품']) then sh.qty
                when sh.type = '출고취소' then (- sh.qty)
                else 0
             end)) as stock
   from bk_sales_history sh
   join bk_books b on (sh.barcode = b.barcode)
  group by b.name, b.note, b.vendor, sh.branch, sh.barcode;

create or replace view bk_stock_by_branch as
 select b.name as book_name,
        sh.branch,
        (sum(case
                when sh.type = any (array['입고','초기재고','분원입고']) then sh.qty
                when sh.type = '입고취소' then (- sh.qty)
                else 0
             end)
       - sum(case
                when sh.type = any (array['출고','분원출고','반품']) then sh.qty
                when sh.type = '출고취소' then (- sh.qty)
                else 0
             end)) as stock
   from bk_sales_history sh
   join bk_books b on (sh.barcode = b.barcode)
  where b.note = any (array['바론자체교재','소모품'])
  group by b.name, sh.branch;

-- 앱(익명 키)이 뷰를 읽을 수 있도록 권한 부여
grant select on bk_stock_by_branch, bk_stock_by_branch_all to anon, authenticated;
