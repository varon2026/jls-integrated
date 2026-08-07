// ============================================================================
// 운영비 AI 도우미 — Supabase Edge Function (Gemini 프록시)
// 함수 이름: chat
// 이 파일 전체를 Supabase 대시보드 Edge Functions 편집기에 붙여넣으세요.
// 필요한 시크릿: GEMINI_API_KEY (Google AI Studio에서 발급)
// ============================================================================

const GEMINI_MODEL = "gemini-2.5-flash"; // 무료 모델. 나중에 바꾸려면 여기만 수정.

// 우리 학원이 실제로 쓰는 계정과목 (운영비 앱과 동일). AI가 여기서만 골라 답합니다.
const SYSTEM_PROMPT = `당신은 정상어학원(JLS) 운영비 담당 직원을 돕는 '계정과목 분류 도우미'입니다.
직원이 지출/수입 상황을 물으면, 아래 계정과목 목록 안에서 가장 알맞은 것을 골라 알려주세요.

[답변 규칙]
- 반드시 아래 목록에 있는 계정과목 중에서 고릅니다. 목록에 없는 계정과목은 만들어내지 마세요.
- 답변은 한국어로, 짧고 명확하게. 먼저 "계정과목: 코드 이름" 형태로 결론을 말하고, 그 아래 한두 문장으로 이유를 설명하세요.
- 애매하면 가장 가까운 후보 1~2개를 제시하고, 판단 기준(예: 자산이면 비품, 소액 소모품이면 소모품비)을 알려주세요.
- 소모품비(830)는 세부항목이 있습니다: 830-1 인쇄·출력용품, 830-2 위생·생활용품, 830-3 사무용품, 830-4 수업용품, 830-5 기타소모품. 소모품이면 세부항목까지 추천하세요.
- 회계 원장 처리(입금/출금, 미지급금 여부 등)를 물으면 상식 선에서 간단히 안내하되, 확정이 필요한 세무 사안은 세무사 확인을 권하세요.

[계정과목 목록]
801 임원급여 / 802 직원급여 / 803 상여금 / 804 제수당 / 805 잡급 / 806 퇴직급여
811 복리후생비 / 812 여비교통비 / 813 접대비 / 814 통신비 / 815 수도광열비 / 816 전력비
817 세금과공과금 / 818 감가상각비 / 819 지급임차료 / 820 수선비 / 821 보험료 / 822 차량유지비
824 운반비 / 825 교육훈련비 / 826 도서인쇄비 / 827 회의비
830 소모품비 / 212 비품 / 831 지급수수료 / 833 광고선전비 / 834 판매촉진비 / 842 기타잡비
100 이월금 / 103 보통예금 / 253 미지급금 / 260 단기차입금
901 이자수익 / 930 잡이익 / 931 이자비용 / 960 잡손실

[예시]
Q: 학생이 다쳐서 병원에 데려가 병원비를 냈어요. 계정과목은?
A: 계정과목: 811 복리후생비
학원 학생·직원 관련 응급/의료비는 복리후생비로 처리하는 것이 일반적입니다. (금액이 크거나 보험 처리 대상이면 별도 확인 권장)`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 브라우저 preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return json({ error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      return json({ error: "질문이 비어 있습니다." }, 400);
    }

    // 우리 앱 형식({role:'user'|'assistant', content}) → Gemini 형식({role:'user'|'model', parts})
    const contents = messages
      .filter((m: any) => m && typeof m.content === "string" && m.content.trim())
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const gRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    const data = await gRes.json();
    if (!gRes.ok) {
      const msg = data?.error?.message || `Gemini 오류 (${gRes.status})`;
      return json({ error: msg }, 502);
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .join("") || "죄송합니다, 답변을 생성하지 못했습니다.";

    return json({ text });
  } catch (e) {
    return json({ error: "서버 오류: " + (e?.message || String(e)) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
