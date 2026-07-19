import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { provider, apiKey } = await request.json();
  if (!apiKey || !["openai", "gemini", "claude"].includes(provider)) {
    return NextResponse.json({ ok: false, message: "키가 필요합니다." }, { status: 400 });
  }

  let response: Response;
  if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
  } else if (provider === "gemini") {
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", { headers: { "x-goog-api-key": apiKey } });
  } else {
    response = await fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
  }

  if (!response.ok) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, provider });
}
