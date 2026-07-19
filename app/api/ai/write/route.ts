import { NextResponse } from "next/server";

const demo = "문장 사이에 잠시 머물 틈을 두자, 그날의 공기와 마음이 조금씩 선명해졌다. 기록은 지나간 시간을 붙드는 일이 아니라, 지금의 나를 천천히 알아가는 일이었다.";

export async function POST(request: Request) {
  const { request: userRequest, text, title, chapterTitle, pageNumber, provider = "auto", apiKeys = {} } = await request.json();
  if (!String(userRequest || "").trim()) return NextResponse.json({ error: "AI 요청 내용을 입력해 주세요." }, { status: 400 });
  const prompt = `역할: 숙련된 한국어 출판 편집자\n목표: 저자의 목소리와 사실을 보존하며 요청에 맞는 출판 원고를 작성한다.\n책 제목: ${title}\n현재 장: ${chapterTitle || "제목 없음"}\n현재 쪽: ${pageNumber || "미정"}\n편집 요청: ${userRequest}\n현재 페이지 원고:\n${text || "(빈 페이지)"}\n\n출력 규칙: 설명, 따옴표, 머리말 없이 원고에 바로 붙일 수 있는 한국어 문장만 작성한다. 제목 제안 요청일 때만 번호 목록을 허용한다. 최대 1,000자.`;
  const order = provider === "auto" ? ["openai", "gemini", "claude"] : [provider];
  const errors: string[] = [];

  for (const engine of order) {
    const openaiKey = apiKeys.openai || process.env.OPENAI_API_KEY;
    const geminiKey = apiKeys.gemini || process.env.GEMINI_API_KEY;
    const anthropicKey = apiKeys.claude || process.env.ANTHROPIC_API_KEY;
    if (engine === "openai" && openaiKey) {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` }, body: JSON.stringify({ model: "gpt-5.4-mini", input: prompt, max_output_tokens: 1200, text: { verbosity: "low" } }) });
      if (response.ok) { const data = await response.json(); const output = data.output_text || data.output?.flatMap((item: { content?: Array<{ type: string; text?: string }> }) => item.content ?? []).find((item: { type: string }) => item.type === "output_text")?.text; if (output) return NextResponse.json({ text: output.trim(), provider: "openai", providerLabel: "OpenAI · GPT-5.4 mini" }); }
      errors.push(`OpenAI ${response.status}`);
    }
    if (engine === "gemini" && geminiKey) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 450 } }) });
      if (response.ok) { const data = await response.json(); const output = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim(); if (output) return NextResponse.json({ text: output, provider: "gemini", providerLabel: "Google · Gemini 3.5 Flash" }); }
      errors.push(`Gemini ${response.status}`);
    }
    if (engine === "claude" && anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }) });
      if (response.ok) { const data = await response.json(); const output = data.content?.find((part: { type: string }) => part.type === "text")?.text?.trim(); if (output) return NextResponse.json({ text: output, provider: "claude", providerLabel: "Anthropic · Claude Sonnet 4" }); }
      errors.push(`Claude ${response.status}`);
    }
  }
  if (errors.length) return NextResponse.json({ error: `AI 요청에 실패했습니다. API 키와 사용 한도를 확인해 주세요. (${errors.join(", ")})` }, { status: 502 });
  if (provider !== "auto") return NextResponse.json({ error: "선택한 AI의 API 키를 설정해 주세요." }, { status: 400 });
  return NextResponse.json({ text: demo, demo: true, providerLabel: "API 키 없이 보는 체험 제안" });
}
