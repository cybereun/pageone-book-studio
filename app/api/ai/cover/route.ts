import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt, title, subtitle, author } = await request.json();
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const coverPrompt = `세련된 한국어 단행본 앞표지. 장르와 분위기: ${prompt}. 제목은 "${title}", 부제는 "${subtitle}", 저자명은 "${author}". 제목이 선명하게 읽히고 인쇄 가능한 평면 표지 디자인. 목업, 책등, 손, 워터마크 없이 앞표지만.`;

  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: "gpt-image-2", size: "1024x1536", quality: "medium", prompt: coverPrompt }),
    });
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ image: `data:image/png;base64,${data.data?.[0]?.b64_json}`, provider: "openai" });
    }
  }

  if (geminiKey) {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: coverPrompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const imagePart = data.candidates?.[0]?.content?.parts?.find((part: { inlineData?: { data?: string } }) => part.inlineData?.data);
      if (imagePart?.inlineData?.data) {
        return NextResponse.json({ image: `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`, provider: "gemini" });
      }
    }
  }

  return NextResponse.json({ demo: true });
}
