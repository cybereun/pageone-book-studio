import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt, title, subtitle, author } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ demo: true });
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-image-2",
      size: "1024x1536",
      quality: "medium",
      prompt: `세련된 한국어 단행본 앞표지. 장르와 분위기: ${prompt}. 제목은 \"${title}\", 부제는 \"${subtitle}\", 저자명은 \"${author}\". 제목이 선명하게 읽히고 인쇄 가능한 평면 표지 디자인. 목업, 책등, 손, 워터마크 없이 앞표지만.`
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }
  const data = await response.json();
  return NextResponse.json({ image: `data:image/png;base64,${data.data?.[0]?.b64_json}` });
}
