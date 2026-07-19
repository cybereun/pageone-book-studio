import { NextResponse } from "next/server";

async function claudeArtDirection(apiKey: string, prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 500, messages: [{ role: "user", content: `한국 단행본 표지의 아트디렉터로서 아래 요청을 이미지 생성 모델용 프롬프트로 구체화하세요. 설명 없이 프롬프트만 출력하세요.\n${prompt}` }] }),
  });
  if (!response.ok) return prompt;
  const data = await response.json();
  return data.content?.find((part: { type: string }) => part.type === "text")?.text || prompt;
}

async function openaiImage(apiKey: string, prompt: string) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-image-2", size: "1024x1536", quality: "medium", prompt }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null;
}

async function geminiImage(apiKey: string, prompt: string) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent", {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.find((item: { inlineData?: { data?: string } }) => item.inlineData?.data);
  return part?.inlineData?.data ? `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}` : null;
}

export async function POST(request: Request) {
  const { prompt, title, subtitle, author, provider = "auto" } = await request.json();
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  let coverPrompt = `세련된 한국어 단행본 앞표지. 장르와 분위기: ${prompt}. 제목은 "${title}", 부제는 "${subtitle}", 저자명은 "${author}". 제목이 선명하게 읽히고 인쇄 가능한 평면 표지 디자인. 목업, 책등, 손, 워터마크 없이 앞표지만.`;

  if (provider === "claude" && anthropicKey) coverPrompt = await claudeArtDirection(anthropicKey, coverPrompt);
  const order = provider === "gemini" ? ["gemini"] : provider === "openai" ? ["openai"] : provider === "claude" ? ["gemini", "openai"] : ["openai", "gemini"];
  for (const engine of order) {
    const image = engine === "openai" && openaiKey ? await openaiImage(openaiKey, coverPrompt) : engine === "gemini" && geminiKey ? await geminiImage(geminiKey, coverPrompt) : null;
    if (image) return NextResponse.json({ image, providerLabel: provider === "claude" ? `Claude + ${engine === "gemini" ? "Gemini" : "OpenAI"}` : engine === "gemini" ? "Gemini" : "OpenAI" });
  }
  return NextResponse.json({ demo: true });
}
