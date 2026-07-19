"use client";

import { useEffect, useMemo, useState } from "react";

type Step = "cover" | "edit" | "publish";
type Provider = "openai" | "gemini" | "claude";
type TrimId = "46" | "A5" | "B5" | "A4";
type CoverWorkflow = "ai" | "canva";
type CoverSource = "starter" | "ai" | "canva";

const trimOptions: Array<{ id: TrimId; label: string; width: number; height: number; use: string }> = [
  { id: "46", label: "46판", width: 127, height: 188, use: "시 · 에세이" },
  { id: "A5", label: "A5", width: 148, height: 210, use: "소설 · 에세이" },
  { id: "B5", label: "B5", width: 182, height: 257, use: "문제지 · 잡지" },
  { id: "A4", label: "A4", width: 210, height: 297, use: "문제지 · 화보" },
];

const aiProviders: Array<{ id: Provider; name: string; model: string; icon: string; link: string; color: string }> = [
  { id: "openai", name: "OpenAI", model: "GPT · Image", icon: "/ai-logos/openai.svg", link: "https://platform.openai.com/api-keys", color: "#202724" },
  { id: "gemini", name: "Google Gemini", model: "Gemini · Nano Banana", icon: "/ai-logos/gemini.svg", link: "https://aistudio.google.com/app/apikey", color: "#7367dc" },
  { id: "claude", name: "Anthropic Claude", model: "Claude Sonnet", icon: "/ai-logos/anthropic.svg", link: "https://console.anthropic.com/settings/keys", color: "#d97757" },
];

const chapters = [
  { id: 1, kicker: "프롤로그", title: "시작하는 마음", pages: 3 },
  { id: 2, kicker: "1장", title: "나만의 속도로 걷기", pages: 12 },
  { id: 3, kicker: "2장", title: "작은 장면을 기록하는 법", pages: 16 },
  { id: 4, kicker: "에필로그", title: "다시, 첫 페이지", pages: 4 },
];

const initialBody = `어떤 시작은 아주 조용하다.\n\n오래 미뤄 둔 문장을 적는 일, 오늘의 마음을 한 줄로 붙잡는 일. 이 책은 거창한 결심보다 그런 작은 움직임에서 태어났다.\n\n완벽한 문장을 기다리지 않기로 했다. 대신 지금의 나만 쓸 수 있는 이야기를, 나만의 속도로 한 장씩 쌓아 보기로 했다.`;

export default function Home() {
  const [step, setStep] = useState<Step>("cover");
  const [title, setTitle] = useState("느리게 쓰는 마음");
  const [subtitle, setSubtitle] = useState("매일의 작은 장면을 기록하는 법");
  const [author, setAuthor] = useState("김하루");
  const [coverPrompt, setCoverPrompt] = useState("새벽빛이 스미는 창가, 펼쳐진 노트와 작은 올리브 나뭇가지. 따뜻하고 고요한 에세이 표지");
  const [coverImage, setCoverImage] = useState("");
  const [coverWorkflow, setCoverWorkflow] = useState<CoverWorkflow>("ai");
  const [coverSource, setCoverSource] = useState<CoverSource>("starter");
  const [canvaFileName, setCanvaFileName] = useState("");
  const [canvaFileStatus, setCanvaFileStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [aiInput, setAiInput] = useState("첫 문단을 더 몰입감 있게 다듬어줘");
  const [aiReply, setAiReply] = useState("원고의 목소리는 그대로 두고, 문장의 호흡과 장면감을 섬세하게 다듬어 드릴게요.");
  const [aiBusy, setAiBusy] = useState(false);
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState("");
  const [provider, setProvider] = useState("auto");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({ openai: "", gemini: "", claude: "" });
  const [keyStatus, setKeyStatus] = useState<Record<Provider, "idle" | "testing" | "success" | "error">>({ openai: "idle", gemini: "idle", claude: "idle" });
  const [trimId, setTrimId] = useState<TrimId>("A5");
  const [pageCount, setPageCount] = useState(100);
  const [hasFlaps, setHasFlaps] = useState(false);
  const [flapWidth, setFlapWidth] = useState(90);
  const [showSpineAuthor, setShowSpineAuthor] = useState(true);
  const [showGuides, setShowGuides] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cached = localStorage.getItem("pageone-draft");
    if (cached) {
      try {
        const draft = JSON.parse(cached);
        queueMicrotask(() => {
          if (cancelled) return;
          setTitle(draft.title ?? title);
          setSubtitle(draft.subtitle ?? subtitle);
          setAuthor(draft.author ?? author);
          setBody(draft.body ?? body);
          setCoverImage(draft.coverImage ?? "");
          setCoverWorkflow(draft.coverWorkflow ?? "ai");
          setCoverSource(draft.coverSource ?? "starter");
          setCanvaFileName(draft.canvaFileName ?? "");
          setTrimId(draft.trimId ?? "A5");
          setPageCount(draft.pageCount ?? 100);
          setHasFlaps(draft.hasFlaps ?? false);
          setFlapWidth(draft.flapWidth ?? 90);
          setShowSpineAuthor(draft.showSpineAuthor ?? true);
        });
      } catch { /* keep the starter manuscript */ }
    }
    const savedKeys = sessionStorage.getItem("pageone-api-keys");
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        queueMicrotask(() => {
          if (!cancelled) setApiKeys({ openai: "", gemini: "", claude: "", ...keys });
        });
      } catch { /* ignore invalid local state */ }
    }
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dirtyTimer = setTimeout(() => setSaved(false), 0);
    const timer = setTimeout(() => {
      localStorage.setItem("pageone-draft", JSON.stringify({ title, subtitle, author, body, coverImage, coverWorkflow, coverSource, canvaFileName, trimId, pageCount, hasFlaps, flapWidth, showSpineAuthor }));
      setSaved(true);
    }, 600);
    return () => {
      clearTimeout(dirtyTimer);
      clearTimeout(timer);
    };
  }, [title, subtitle, author, body, coverImage, coverWorkflow, coverSource, canvaFileName, trimId, pageCount, hasFlaps, flapWidth, showSpineAuthor]);

  const wordCount = useMemo(() => body.replace(/\s/g, "").length, [body]);
  const trim = trimOptions.find((item) => item.id === trimId) ?? trimOptions[1];
  const spineWidth = Number((pageCount * 0.055 + 1.6).toFixed(2));
  const bleed = 3;
  const spreadWidth = Number((trim.width * 2 + spineWidth + bleed * 2 + (hasFlaps ? flapWidth * 2 : 0)).toFixed(2));
  const spreadHeight = trim.height + bleed * 2;
  const outputPixels = { width: Math.round((spreadWidth / 25.4) * 300), height: Math.round((spreadHeight / 25.4) * 300) };
  const spreadColumns = hasFlaps
    ? `${flapWidth}fr ${trim.width}fr ${spineWidth}fr ${trim.width}fr ${flapWidth}fr`
    : `${trim.width}fr ${spineWidth}fr ${trim.width}fr`;
  const canvaBrief = useMemo(() => `Canva에서 한국 단행본 인쇄용 전체 표지 전개도를 만들어 주세요.

도서명: ${title}
부제: ${subtitle}
저자: ${author}
표지 분위기: ${coverPrompt}

[정확한 제작 규격]
- 판형: ${trim.label} (${trim.width}×${trim.height}mm)
- 페이지 수: ${pageCount}P
- 책등: ${spineWidth.toFixed(2)}mm
- 책등 글자: 제목은 크게 세로 한 줄, 작가명은 ${showSpineAuthor ? "제목 아래쪽에 작게 포함" : "제외"}
- 날개: ${hasFlaps ? `좌우 각 ${flapWidth}mm` : "없음"}
- 재단 여백: 사방 ${bleed}mm
- 전체 전개도: ${spreadWidth}×${spreadHeight}mm
- Canva 사용자 지정 크기: ${outputPixels.width}×${outputPixels.height}px (300DPI 기준)
- 구성 순서: ${hasFlaps ? "왼쪽 날개 → 뒤표지 → 책등 → 앞표지 → 오른쪽 날개" : "뒤표지 → 책등 → 앞표지"}

중요한 글자와 로고는 재단선에서 5mm 이상 안쪽에 배치하고, 책등 제목은 ${spineWidth.toFixed(2)}mm 영역 중앙에 세로 한 줄로 크게 정렬해 주세요.${showSpineAuthor ? " 작가명은 제목 아래쪽에 충분한 간격을 두고 더 작은 크기로 배치하되, 두 글자 묶음은 책등 중앙 축에 맞춰 주세요." : " 책등에는 작가명을 넣지 마세요."} 완성 후 고해상도 PNG로 내보내 주세요.`, [author, bleed, coverPrompt, flapWidth, hasFlaps, outputPixels.height, outputPixels.width, pageCount, showSpineAuthor, spineWidth, spreadHeight, spreadWidth, subtitle, title, trim.height, trim.label, trim.width]);

  async function generateCover() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: coverPrompt, title, subtitle, author, provider, apiKeys,
          spec: { trimId, trimWidth: trim.width, trimHeight: trim.height, pageCount, spineWidth, showSpineAuthor, hasFlaps, flapWidth: hasFlaps ? flapWidth : 0, bleed, spreadWidth, spreadHeight },
        }),
      });
      const data = await res.json();
      if (data.image) {
        setCoverImage(data.image);
        setCoverSource("ai");
        setCanvaFileName("");
        setCanvaFileStatus("");
      }
      setToast(data.demo ? "이미지 생성 키가 없어 편집 가능한 디자인 시안을 만들었어요." : `${data.providerLabel || "AI"}가 새 표지를 완성했어요.`);
    } catch {
      setToast("표지 생성이 잠시 지연되고 있어요. 다시 시도해 주세요.");
    } finally {
      setGenerating(false);
      setTimeout(() => setToast(""), 3200);
    }
  }

  async function copyCanvaBrief() {
    try {
      await navigator.clipboard.writeText(canvaBrief);
      setToast("Canva MCP 작업 지시서를 복사했어요.");
    } catch {
      setToast("복사 권한을 허용한 뒤 다시 시도해 주세요.");
    }
    setTimeout(() => setToast(""), 2600);
  }

  function downloadCanvaGuide() {
    const canvas = document.createElement("canvas");
    canvas.width = outputPixels.width;
    canvas.height = outputPixels.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const scale = 300 / 25.4;
    const px = (mm: number) => mm * scale;
    context.fillStyle = "#fffdf9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#21a9df";
    context.lineWidth = Math.max(2, Math.round(scale * 0.2));
    context.strokeRect(px(bleed), px(bleed), canvas.width - px(bleed * 2), canvas.height - px(bleed * 2));

    const sections = hasFlaps
      ? [{ label: "왼쪽 날개", width: flapWidth }, { label: "뒤표지", width: trim.width }, { label: "책등", width: spineWidth }, { label: "앞표지", width: trim.width }, { label: "오른쪽 날개", width: flapWidth }]
      : [{ label: "뒤표지", width: trim.width }, { label: "책등", width: spineWidth }, { label: "앞표지", width: trim.width }];
    let x = px(bleed);
    context.textAlign = "center";
    context.textBaseline = "middle";
    sections.forEach((section, index) => {
      const width = px(section.width);
      if (index > 0) {
        context.setLineDash(section.label === "책등" || sections[index - 1]?.label === "책등" ? [16, 10] : [8, 8]);
        context.strokeStyle = section.label === "책등" || sections[index - 1]?.label === "책등" ? "#e44f79" : "#7b61e8";
        context.beginPath();
        context.moveTo(x, px(bleed));
        context.lineTo(x, canvas.height - px(bleed));
        context.stroke();
      }
      context.setLineDash([]);
      context.fillStyle = section.label === "책등" ? "#fff0f4" : index % 2 ? "#f5f2ff" : "#f4fbfe";
      context.globalAlpha = 0.48;
      context.fillRect(x, px(bleed), width, canvas.height - px(bleed * 2));
      context.globalAlpha = 1;
      context.fillStyle = "#3a3936";
      context.font = `700 ${Math.max(20, Math.round(canvas.height * 0.025))}px sans-serif`;
      context.fillText(`${section.label} · ${section.width.toFixed(section.label === "책등" ? 2 : 0)}mm`, x + width / 2, canvas.height / 2);
      x += width;
    });
    context.fillStyle = "#1679a1";
    context.font = `600 ${Math.max(18, Math.round(canvas.height * 0.015))}px sans-serif`;
    context.textAlign = "left";
    context.fillText(`PAGEONE 표지 가이드 · ${spreadWidth}×${spreadHeight}mm · ${outputPixels.width}×${outputPixels.height}px`, px(bleed + 3), px(bleed + 5));
    const link = document.createElement("a");
    link.download = `PAGEONE-${trim.label}-${pageCount}P-cover-guide.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setToast("Canva용 표지 규격 가이드를 내려받았어요.");
    setTimeout(() => setToast(""), 2600);
  }

  function importCanvaCover(file?: File) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setCanvaFileStatus("PNG, JPG 또는 WEBP 파일만 적용할 수 있어요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const expectedRatio = outputPixels.width / outputPixels.height;
        const actualRatio = image.naturalWidth / image.naturalHeight;
        const ratioError = Math.abs(actualRatio - expectedRatio) / expectedRatio;
        if (ratioError > 0.02) {
          setCanvaFileStatus(`규격 비율이 맞지 않아요. ${outputPixels.width}×${outputPixels.height}px로 다시 내보내 주세요.`);
          return;
        }
        setCoverImage(String(reader.result));
        setCoverSource("canva");
        setCanvaFileName(file.name);
        setCanvaFileStatus(image.naturalWidth >= outputPixels.width && image.naturalHeight >= outputPixels.height
          ? `규격 확인 완료 · ${image.naturalWidth.toLocaleString()}×${image.naturalHeight.toLocaleString()}px`
          : `표지에 적용했지만 해상도가 낮아요 · 권장 ${outputPixels.width.toLocaleString()}×${outputPixels.height.toLocaleString()}px`);
        setToast("Canva 표지를 전체 전개도에 적용했어요.");
        setTimeout(() => setToast(""), 2600);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function askAi(action?: string) {
    setAiBusy(true);
    const request = action ?? aiInput;
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, text: body, title, provider, apiKeys }),
      });
      const data = await res.json();
      setAiReply(data.text);
    } catch {
      setAiReply("잠시 연결이 원활하지 않아요. 문장을 유지한 채 잠시 후 다시 시도해 주세요.");
    } finally {
      setAiBusy(false);
    }
  }

  function applyAi() {
    if (!aiReply) return;
    setBody((value) => `${value}\n\n${aiReply}`);
    setToast("AI 제안을 원고 끝에 추가했어요.");
    setTimeout(() => setToast(""), 2600);
  }

  function exportPdf() {
    setToast("인쇄 창에서 ‘PDF로 저장’을 선택해 주세요.");
    setTimeout(() => window.print(), 350);
  }

  function saveKey(id: Provider) {
    sessionStorage.setItem("pageone-api-keys", JSON.stringify(apiKeys));
    setToast(`${aiProviders.find((item) => item.id === id)?.name} API 키를 이 브라우저 세션에 저장했어요.`);
    setTimeout(() => setToast(""), 2600);
  }

  function deleteKey(id: Provider) {
    const next = { ...apiKeys, [id]: "" };
    setApiKeys(next);
    sessionStorage.setItem("pageone-api-keys", JSON.stringify(next));
    setKeyStatus((value) => ({ ...value, [id]: "idle" }));
  }

  async function testKey(id: Provider) {
    if (!apiKeys[id].trim()) {
      setKeyStatus((value) => ({ ...value, [id]: "error" }));
      return;
    }
    setKeyStatus((value) => ({ ...value, [id]: "testing" }));
    try {
      const response = await fetch("/api/ai/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: id, apiKey: apiKeys[id] }) });
      setKeyStatus((value) => ({ ...value, [id]: response.ok ? "success" : "error" }));
    } catch {
      setKeyStatus((value) => ({ ...value, [id]: "error" }));
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setStep("cover")} aria-label="페이지원 홈">
          <span className="brand-mark">P</span>
          <span>PAGEONE</span>
        </button>
        <div className="project-name">
          <span className="status-dot" />
          <span>{title}</span>
          <button aria-label="책 제목 수정">⌄</button>
        </div>
        <div className="top-actions">
          <span className="save-state">{saved ? "✓ 모든 변경사항 저장됨" : "저장 중…"}</span>
          <button className="icon-button" aria-label="미리보기">⌕</button>
          <button className="avatar" aria-label="내 계정">하</button>
          <button className="settings-button" aria-label="AI API 설정" title="AI API 설정" onClick={() => setSettingsOpen(true)}><span>⚙</span></button>
        </div>
      </header>

      <nav className="stepbar" aria-label="책 제작 단계">
        <button className={step === "cover" ? "active" : ""} onClick={() => setStep("cover")}><b>1</b><span>표지 디자인</span></button>
        <i />
        <button className={step === "edit" ? "active" : ""} onClick={() => setStep("edit")}><b>2</b><span>본문 편집</span></button>
        <i />
        <button className={step === "publish" ? "active" : ""} onClick={() => setStep("publish")}><b>3</b><span>검토 · 출판</span></button>
      </nav>

      {step === "cover" && (
        <section className="workspace cover-workspace">
          <aside className="control-panel">
            <div className="panel-heading">
              <span className="eyebrow">STEP 01</span>
              <h1>책의 첫인상을<br />만들어 볼까요?</h1>
              <p>{coverWorkflow === "ai" ? "책의 분위기를 알려주면 AI가 표지 시안을 만들어요. 제목과 색상은 언제든 수정할 수 있어요." : "현재 규격을 Canva 작업에 전달하고, 완성한 표지를 다시 가져와 정확히 적용할 수 있어요."}</p>
            </div>
            <div className="cover-workflow" role="radiogroup" aria-label="표지 제작 방식 선택">
              <button role="radio" aria-checked={coverWorkflow === "ai"} className={coverWorkflow === "ai" ? "active" : ""} onClick={() => setCoverWorkflow("ai")}><span className="workflow-mark ai-mark">✦</span><span><b>PAGEONE AI</b><small>지금 방식으로 바로 생성</small></span></button>
              <button role="radio" aria-checked={coverWorkflow === "canva"} className={coverWorkflow === "canva" ? "active canva-active" : ""} onClick={() => setCoverWorkflow("canva")}><span className="workflow-mark canva-mark">C</span><span><b>Canva 작업</b><small>MCP 제작 후 가져오기</small></span></button>
            </div>
            <label>책 제목<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label>부제<input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></label>
            <label>저자명<input value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
            <section className="book-spec-card">
              <div className="spec-heading"><div><span className="eyebrow">PRINT FORMAT</span><h3>책 규격을 선택해 주세요</h3></div><em>{trim.label} · {trim.width}×{trim.height}mm</em></div>
              <div className="trim-picker" role="radiogroup" aria-label="책 판형 선택">
                {trimOptions.map((item) => (
                  <button key={item.id} role="radio" aria-checked={trimId === item.id} className={trimId === item.id ? "active" : ""} onClick={() => setTrimId(item.id)}>
                    <span className="trim-visual"><i style={{ width: `${Math.round(31 + (item.width - 127) * 0.18)}px`, height: `${Math.round(47 + (item.height - 188) * 0.22)}px` }}>{item.label}</i></span>
                    <b>{item.label}</b><small>{item.width} × {item.height}mm</small><small>{item.use}</small>
                  </button>
                ))}
              </div>
              <div className="flap-heading">책 날개를 선택해 주세요</div>
              <div className="flap-picker" role="radiogroup" aria-label="책 날개 선택">
                <button role="radio" aria-checked={hasFlaps} className={hasFlaps ? "active" : ""} onClick={() => setHasFlaps(true)}><span className="flap-diagram with-flaps"><i /><b /><i /></span><strong>날개 있음</strong></button>
                <button role="radio" aria-checked={!hasFlaps} className={!hasFlaps ? "active" : ""} onClick={() => setHasFlaps(false)}><span className="flap-diagram no-flaps"><b /></span><strong>날개 없음</strong></button>
              </div>
              <div className="dimension-form">
                <label htmlFor="page-count"><span>페이지 수<small>면수</small></span><div><input id="page-count" type="number" min="50" max="300" step="2" value={pageCount} onChange={(event) => setPageCount(Math.min(300, Math.max(50, Number(event.target.value) || 50)))} /><em>P</em></div></label>
                <div><span>날개</span><b>{hasFlaps ? `있음 · ${flapWidth}mm` : "없음"}</b></div>
                {hasFlaps && <label className="flap-width" htmlFor="flap-width"><span>날개 폭</span><div><input id="flap-width" type="number" min="60" max="120" step="5" value={flapWidth} onChange={(event) => setFlapWidth(Math.min(120, Math.max(60, Number(event.target.value) || 90)))} /><em>mm</em></div></label>}
                <div className="spine-value"><span>자동 책등 두께</span><b>{spineWidth.toFixed(2)} <small>mm</small></b></div>
                <div className="spine-author-option"><span>책등 작가명</span><div role="radiogroup" aria-label="책등 작가명 표시"><button role="radio" aria-checked={showSpineAuthor} className={showSpineAuthor ? "active" : ""} onClick={() => setShowSpineAuthor(true)}>포함</button><button role="radio" aria-checked={!showSpineAuthor} className={!showSpineAuthor ? "active" : ""} onClick={() => setShowSpineAuthor(false)}>제외</button></div></div>
              </div>
              <div className="spec-summary"><span>전체 전개도</span><b>{spreadWidth} × {spreadHeight}mm</b><small>{outputPixels.width.toLocaleString()} × {outputPixels.height.toLocaleString()}px · 300DPI</small></div>
            </section>
            <label>어떤 표지를 원하세요?<textarea rows={4} value={coverPrompt} onChange={(e) => setCoverPrompt(e.target.value)} /></label>
            {coverWorkflow === "ai" ? <>
              <div className="provider-picker" aria-label="표지 AI 선택">
                <button className={provider === "auto" ? "active" : ""} onClick={() => setProvider("auto")}>✦ 자동</button>
                {aiProviders.map((item) => <button key={item.id} className={provider === item.id ? "active" : ""} onClick={() => setProvider(item.id)}><img src={item.icon} alt="" />{item.name.split(" ").slice(-1)[0]}</button>)}
              </div>
              <div className="prompt-suggestions">
                <button onClick={() => setCoverPrompt("여백이 넉넉한 미니멀 에세이, 따뜻한 아이보리 종이와 작은 식물 드로잉")}>미니멀 에세이</button>
                <button onClick={() => setCoverPrompt("짙은 남색 밤하늘과 금빛 별, 신비로운 문학 소설 표지")}>문학 소설</button>
                <button onClick={() => setCoverPrompt("선명한 코랄 포인트와 기하학 도형, 현대적인 자기계발서 표지")}>자기계발</button>
              </div>
              <button className="primary-button" onClick={generateCover} disabled={generating}>
                <span>✦</span>{generating ? "AI가 표지를 그리고 있어요…" : "AI로 새 표지 만들기"}
              </button>
              <p className="credit-note">생성 1회 · AI 크레딧 1개</p>
            </> : <section className="canva-flow" aria-label="Canva 표지 작업 과정">
              <div className="canva-step"><span>1</span><div><b>작업 규격 준비</b><small>{outputPixels.width.toLocaleString()}×{outputPixels.height.toLocaleString()}px · 300DPI</small></div><button onClick={downloadCanvaGuide}>가이드 PNG</button></div>
              <div className="canva-step"><span>2</span><div><b>Canva에서 제작</b><small>MCP에 지시서를 전달한 뒤 자유롭게 편집</small></div></div>
              <div className="canva-actions">
                <button className="canva-copy" onClick={copyCanvaBrief}>MCP 작업 지시서 복사</button>
                <a href="https://www.canva.com/" target="_blank" rel="noreferrer">Canva 열기 ↗</a>
              </div>
              <div className="canva-step"><span>3</span><div><b>완성 표지 가져오기</b><small>Canva에서 고해상도 PNG로 내려받아 주세요</small></div></div>
              <label className={canvaFileName ? "canva-upload has-file" : "canva-upload"} htmlFor="canva-cover-file">
                <input id="canva-cover-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => importCanvaCover(event.target.files?.[0])} />
                <span>{canvaFileName ? "✓" : "↑"}</span><b>{canvaFileName || "Canva 표지 파일 선택"}</b><small>PNG · JPG · WEBP</small>
              </label>
              {canvaFileStatus && <p className={canvaFileStatus.includes("완료") ? "canva-status success" : "canva-status"}>{canvaFileStatus}</p>}
            </section>}
          </aside>

          <div className="canvas-zone">
            <div className="canvas-head"><span>전체 표지 전개도</span>{coverSource !== "starter" && <em className={`cover-source ${coverSource}`}>{coverSource === "canva" ? "Canva 적용됨" : "AI 적용됨"}</em>}<div className="spread-meta"><b>{trim.label}</b><span>{pageCount}P</span><span>책등 {spineWidth.toFixed(2)}mm</span></div><button className={showGuides ? "guide-toggle active" : "guide-toggle"} onClick={() => setShowGuides((value) => !value)}>가이드 {showGuides ? "ON" : "OFF"}</button><button className="zoom">− &nbsp; 80% &nbsp; +</button></div>
            <div className="cover-stage">
              <div className="ruler ruler-top"><span>0</span><span>{Math.round(spreadWidth / 4)}</span><span>{Math.round(spreadWidth / 2)}</span><span>{Math.round(spreadWidth * 0.75)}</span><span>{Math.round(spreadWidth)}mm</span></div>
              <div className={`cover-spread ${coverImage ? "has-image" : ""}`} style={{ aspectRatio: `${spreadWidth} / ${spreadHeight}`, gridTemplateColumns: spreadColumns, ...(coverImage ? { backgroundImage: `url(${coverImage})` } : {}) } as React.CSSProperties}>
                <div className="cover-grain" />
                {showGuides && <><div className="bleed-guide" /><div className="safe-guide" /></>}
                {hasFlaps && <section className="spread-flap flap-left"><small>날개 {flapWidth}mm</small><p>저자 소개와 책의 이야기를 담는 공간</p></section>}
                <section className="spread-back"><span className="panel-label">뒤표지</span><p>어떤 시작은 아주 조용합니다.<br />이 책은 매일의 작은 장면을 천천히 기록하는 방법을 이야기합니다.</p><i>PAGEONE · 2026</i></section>
                <section className="spread-spine"><span className="spine-title">{title}</span>{showSpineAuthor && <small className="spine-author">{author}</small>}</section>
                <section className="spread-front"><span className="panel-label">앞표지</span><div className="cover-copy"><span className="cover-symbol">✦</span><h2>{title}</h2><p>{subtitle}</p></div><div className="cover-author">{author} 지음</div></section>
                {hasFlaps && <section className="spread-flap flap-right"><small>날개 {flapWidth}mm</small><p>책 속의 문장과 출판 정보를 담는 공간</p></section>}
              </div>
              <div className="spread-caption"><span>← 뒤표지</span><b>{spineWidth.toFixed(2)}mm</b><span>앞표지 →</span></div>
              <div className="cover-tools">
                <button title="텍스트 추가">T</button><button title="이미지 배치">▧</button><button title="색상 변경">◐</button><button title="정렬">↔</button>
              </div>
            </div>
            <div className="canvas-footer"><span>{trim.label} {trim.width}×{trim.height}mm · {pageCount}P · 책등 {spineWidth.toFixed(2)}mm · {hasFlaps ? `날개 ${flapWidth}mm` : "날개 없음"}</span><span>전체 {spreadWidth}×{spreadHeight}mm · {outputPixels.width.toLocaleString()}×{outputPixels.height.toLocaleString()}px · 300DPI ✓</span></div>
          </div>

          <aside className="tip-panel">
            <div className="tip-icon">{coverWorkflow === "canva" ? "C" : "✦"}</div>
            <h3>{coverWorkflow === "canva" ? "Canva 가져오기 안내" : "좋은 표지 프롬프트"}</h3>
            <p>{coverWorkflow === "canva" ? "가이드 파일을 Canva 작업의 가장 아래 레이어에 놓고 투명도를 낮춰 사용하세요. 완성할 때는 가이드 레이어를 숨긴 뒤 내려받으세요." : "장르, 분위기, 중심 소재와 원하는 색을 함께 적으면 더 좋은 결과를 얻을 수 있어요."}</p>
            <div className="example-prompt">{coverWorkflow === "canva" ? `권장 출력 ${outputPixels.width.toLocaleString()}×${outputPixels.height.toLocaleString()}px` : "“비 오는 창가의 찻잔, 청회색 수채화, 차분한 에세이 표지”"}</div>
            <button onClick={() => setStep("edit")}>다음: 본문 편집 <span>→</span></button>
          </aside>
        </section>
      )}

      {step === "edit" && (
        <section className="workspace editor-workspace">
          <aside className="chapter-panel">
            <div className="chapter-head"><b>목차</b><button aria-label="장 추가">＋</button></div>
            {chapters.map((chapter, index) => (
              <button key={chapter.id} className={index === 0 ? "chapter active" : "chapter"}>
                <span>{chapter.kicker}</span><b>{chapter.title}</b><small>{chapter.pages}쪽</small>
              </button>
            ))}
            <button className="add-chapter">＋ 새 장 추가</button>
          </aside>

          <div className="editor-zone">
            <div className="editor-toolbar">
              <select aria-label="본문 스타일" defaultValue="본문"><option>본문</option><option>제목 1</option><option>인용문</option></select>
              <button><b>B</b></button><button><i>I</i></button><button><u>U</u></button><span />
              <button>≡</button><button>☷</button><button>❝</button><span />
              <button>↶</button><button>↷</button>
              <small>{wordCount.toLocaleString()}자 · 약 {Math.max(1, Math.ceil(wordCount / 700))}쪽</small>
            </div>
            <div className="page-desk">
              <article className="manuscript-page print-page">
                <div className="running-head">느리게 쓰는 마음</div>
                <span className="chapter-kicker">프롤로그</span>
                <input className="chapter-title-input" defaultValue="시작하는 마음" aria-label="장 제목" />
                <textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="본문 원고" />
                <div className="page-number">3</div>
              </article>
            </div>
          </div>

          <aside className="ai-panel">
            <div className="ai-title"><div className="ai-orb">✦</div><div><b>페이지 AI</b><span>당신의 글쓰기 파트너</span></div><span className="online" /></div>
            <div className="ai-context"><span>현재 읽는 중</span><b>프롤로그 · 시작하는 마음</b></div>
            <div className="provider-picker compact" aria-label="글쓰기 AI 선택">
              <button className={provider === "auto" ? "active" : ""} onClick={() => setProvider("auto")}>✦ 자동</button>
              {aiProviders.map((item) => <button key={item.id} className={provider === item.id ? "active" : ""} onClick={() => setProvider(item.id)}><img src={item.icon} alt="" />{item.name.split(" ").slice(-1)[0]}</button>)}
            </div>
            <p className="ai-greeting">어떤 도움이 필요하세요? 문장을 다듬거나, 다음 내용을 함께 구상할 수 있어요.</p>
            <div className="quick-actions">
              <button onClick={() => askAi("현재 원고의 문체와 사실을 유지하며 더 자연스럽고 몰입감 있게 다듬어줘")}>✦ 문장 다듬기</button>
              <button onClick={() => askAi("현재 원고 다음에 이어질 한 문단을 같은 문체로 제안해줘")}>＋ 이어쓰기</button>
              <button onClick={() => askAi("현재 글의 핵심은 유지하고 표현을 더 풍부하게 바꿔줘")}>◈ 표현 풍부하게</button>
              <button onClick={() => askAi("현재 원고에 어울리는 장 제목 3개를 제안해줘")}>⌁ 제목 제안</button>
            </div>
            <div className="ai-response"><span>AI 제안</span><p>{aiBusy ? "원고의 결을 읽고 있어요…" : aiReply}</p><button onClick={applyAi}>원고에 추가</button></div>
            <div className="ai-compose"><textarea rows={3} value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="AI에게 요청하세요…" /><button onClick={() => askAi()} disabled={aiBusy}>↑</button></div>
            <small>AI가 만든 내용은 꼭 검토해 주세요.</small>
          </aside>
        </section>
      )}

      {step === "publish" && (
        <section className="publish-workspace">
          <div className="publish-copy"><span className="eyebrow">STEP 03</span><h1>당신의 책이<br />완성되었어요.</h1><p>인쇄 전 마지막 정보를 확인하고, 종이책 또는 전자책용 PDF를 내려받으세요.</p></div>
          <div className="publish-preview">
            <div className="mini-book"><div className="mini-cover" style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}><b>{title}</b><span>{author}</span></div><div className="mini-pages" /></div>
            <div className="book-facts"><span>도서명</span><b>{title}</b><span>저자</span><b>{author}</b><span>판형</span><b>{trim.label} · {trim.width}×{trim.height}mm</b><span>분량·책등</span><b>{pageCount}쪽 · {spineWidth.toFixed(2)}mm</b></div>
          </div>
          <aside className="publish-card">
            <h2>출판 설정</h2>
            <label>판형<select value={trimId} onChange={(e) => setTrimId(e.target.value as TrimId)}>{trimOptions.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.width}×{item.height}mm</option>)}</select></label>
            <label>출판 형태<div className="format-toggle"><button className="active">종이책</button><button>전자책</button></div></label>
            <div className="check-list"><p><span>✓</span> 표지 해상도 적합</p><p><span>✓</span> 재단 여백 확인</p><p><span>✓</span> 폰트 포함 완료</p><p><span>✓</span> 빈 페이지 없음</p></div>
            <button className="primary-button" onClick={exportPdf}>↓ 인쇄용 PDF 만들기</button>
            <button className="secondary-button" onClick={() => setStep("edit")}>본문으로 돌아가기</button>
          </aside>
        </section>
      )}

      {toast && <div className="toast">{toast}</div>}
      {settingsOpen && (
        <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <header className="settings-head">
              <div><span className="eyebrow">AI CONNECTIONS</span><h2 id="settings-title">AI API 설정</h2><p>사용할 AI의 키를 연결하세요. 키는 서버에 저장되지 않고 현재 브라우저 세션에서만 사용됩니다.</p></div>
              <button onClick={() => setSettingsOpen(false)} aria-label="설정 닫기">×</button>
            </header>
            <div className="settings-list">
              {aiProviders.map((item) => {
                const status = keyStatus[item.id];
                return <article className="api-card" key={item.id} style={{ "--provider-color": item.color } as React.CSSProperties}>
                  <div className="provider-identity"><div className="provider-icon"><img src={item.icon} alt={`${item.name} 아이콘`} /></div><div><h3>{item.name}</h3><span>{item.model}</span></div><i className={apiKeys[item.id] ? "connected" : ""}>{apiKeys[item.id] ? "키 입력됨" : "연결 안 됨"}</i></div>
                  <label htmlFor={`${item.id}-key`}>API KEY</label>
                  <div className="key-field"><input id={`${item.id}-key`} type="password" autoComplete="off" value={apiKeys[item.id]} onChange={(event) => { setApiKeys((value) => ({ ...value, [item.id]: event.target.value })); setKeyStatus((value) => ({ ...value, [item.id]: "idle" })); }} placeholder={item.id === "openai" ? "sk-proj-••••••••••••" : item.id === "gemini" ? "AIza••••••••••••" : "sk-ant-••••••••••••"} /><span>•••</span></div>
                  <div className="key-feedback" data-status={status}>{status === "testing" ? "연결을 확인하고 있어요…" : status === "success" ? "✓ 연결에 성공했습니다" : status === "error" ? "키를 확인해 주세요" : "키는 암호화된 HTTPS 요청에만 사용됩니다."}</div>
                  <div className="api-actions"><a href={item.link} target="_blank" rel="noreferrer">API 키 발급 ↗</a><button className="delete-key" onClick={() => deleteKey(item.id)} disabled={!apiKeys[item.id]}>삭제</button><button className="test-key" onClick={() => testKey(item.id)} disabled={status === "testing"}>{status === "testing" ? "테스트 중" : "테스트"}</button><button className="save-key" onClick={() => saveKey(item.id)} disabled={!apiKeys[item.id]}>저장</button></div>
                </article>;
              })}
            </div>
            <footer className="settings-footer"><span>🔒 API 키는 이 탭을 닫으면 자동으로 삭제됩니다.</span><button onClick={() => setSettingsOpen(false)}>설정 완료</button></footer>
          </section>
        </div>
      )}
    </main>
  );
}
