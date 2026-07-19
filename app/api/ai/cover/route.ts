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
    body: JSON.stringify({ model: "gpt-image-2", size: "1536x1024", quality: "high", prompt }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null;
}

async function geminiImage(apiKey: string, prompt: string, aspectRatio: "3:2" | "16:9") {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent", {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio } } }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.find((item: { inlineData?: { data?: string } }) => item.inlineData?.data);
  return part?.inlineData?.data ? `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}` : null;
}

export async function POST(request: Request) {
  const { prompt, title, subtitle, author, provider = "auto", apiKeys = {}, spec = {} } = await request.json();
  const openaiKey = apiKeys.openai || process.env.OPENAI_API_KEY;
  const geminiKey = apiKeys.gemini || process.env.GEMINI_API_KEY;
  const anthropicKey = apiKeys.claude || process.env.ANTHROPIC_API_KEY;
  const ratio = Number(spec.spreadWidth || 1) / Number(spec.spreadHeight || 1);
  const imageAspect: "3:2" | "16:9" = ratio > 1.7 ? "16:9" : "3:2";
  let coverPrompt = `한국 단행본의 인쇄용 전체 표지 전개도 배경 아트워크를 만드세요.
장르와 분위기: ${prompt}.
정확한 제작 사양: ${spec.trimId || "A5"} 판형 ${spec.trimWidth || 148}×${spec.trimHeight || 210}mm, ${spec.pageCount || 100}페이지, 책등 ${spec.spineWidth || 7.1}mm, 날개 ${spec.hasFlaps ? `좌우 각 ${spec.flapWidth}mm` : "없음"}, 재단 여백 ${spec.bleed || 3}mm, 전체 전개도 ${spec.spreadWidth || 309.1}×${spec.spreadHeight || 216}mm.
구성은 왼쪽에서 오른쪽 순서로 ${spec.hasFlaps ? "왼쪽 날개, " : ""}뒤표지, 매우 좁은 책등, 앞표지${spec.hasFlaps ? ", 오른쪽 날개" : ""}입니다. 앞표지는 오른쪽에 중심 장면, 뒤표지는 왼쪽에 잔잔하게 이어지는 장면, 책등은 중앙의 자연스러운 연결 영역으로 만드세요.
제목 "${title}", 부제 "${subtitle}", 저자 "${author}"는 앱이 별도 레이어로 정확히 배치하므로 이미지 안에는 어떤 문자도 넣지 마세요. 목업, 책 모양, 손, 바코드, 로고, 워터마크, 가이드선 없이 평평한 가로형 배경 이미지만 생성하세요.`;

  if (provider === "claude" && anthropicKey) coverPrompt = await claudeArtDirection(anthropicKey, coverPrompt);
  const order = provider === "gemini" ? ["gemini"] : provider === "openai" ? ["openai"] : provider === "claude" ? ["gemini", "openai"] : ["openai", "gemini"];
  for (const engine of order) {
    const image = engine === "openai" && openaiKey ? await openaiImage(openaiKey, coverPrompt) : engine === "gemini" && geminiKey ? await geminiImage(geminiKey, coverPrompt, imageAspect) : null;
    if (image) return NextResponse.json({ image, providerLabel: provider === "claude" ? `Claude + ${engine === "gemini" ? "Gemini" : "OpenAI"}` : engine === "gemini" ? "Gemini" : "OpenAI" });
  }
  return NextResponse.json({ demo: true });
}
