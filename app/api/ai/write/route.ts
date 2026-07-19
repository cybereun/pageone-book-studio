import { NextResponse } from "next/server";

const demo = "문장 사이에 잠시 머물 틈을 두자, 그날의 공기와 마음이 조금씩 선명해졌다. 기록은 지나간 시간을 붙드는 일이 아니라, 지금의 나를 천천히 알아가는 일이었다.";

export async function POST(request: Request) {
  const { request: userRequest, text, title, provider = "auto" } = await request.json();
  const prompt = `역할: 한국어 출판 편집자\n목표: 저자의 목소리와 사실을 보존하며 요청에 맞는 출판 원고를 제안한다.\n책 제목: ${title}\n요청: ${userRequest}\n현재 원고:\n${text}\n\n출력: 설명 없이 원고에 바로 붙일 수 있는 한국어 문장만 300자 이내로 작성한다.`;
  const order = provider === "auto" ? ["openai", "gemini", "claude"] : [provider];

  for (const engine of order) {
    if (engine === "openai" && process.env.OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-5.6", input: prompt, text: { verbosity: "low" } }) });
      if (response.ok) { const data = await response.json(); const output = data.output?.flatMap((item: { content?: Array<{ type: string; text?: string }> }) => item.content ?? []).find((item: { type: string }) => item.type === "output_text")?.text; if (output) return NextResponse.json({ text: output, provider: "openai" }); }
    }
    if (engine === "gemini" && process.env.GEMINI_API_KEY) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 450 } }) });
      if (response.ok) { const data = await response.json(); const output = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim(); if (output) return NextResponse.json({ text: output, provider: "gemini" }); }
    }
    if (engine === "claude" && process.env.ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 450, messages: [{ role: "user", content: prompt }] }) });
      if (response.ok) { const data = await response.json(); const output = data.content?.find((part: { type: string }) => part.type === "text")?.text?.trim(); if (output) return NextResponse.json({ text: output, provider: "claude" }); }
    }
  }
  return NextResponse.json({ text: demo, demo: true });
}
