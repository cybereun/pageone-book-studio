"use client";

import { useEffect, useMemo, useState } from "react";

type Step = "cover" | "edit" | "publish";

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
  const [generating, setGenerating] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [aiInput, setAiInput] = useState("첫 문단을 더 몰입감 있게 다듬어줘");
  const [aiReply, setAiReply] = useState("원고의 목소리는 그대로 두고, 문장의 호흡과 장면감을 섬세하게 다듬어 드릴게요.");
  const [aiBusy, setAiBusy] = useState(false);
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState("");
  const [format, setFormat] = useState("A5");

  useEffect(() => {
    const cached = localStorage.getItem("pageone-draft");
    if (cached) {
      try {
        const draft = JSON.parse(cached);
        setTitle(draft.title ?? title);
        setSubtitle(draft.subtitle ?? subtitle);
        setAuthor(draft.author ?? author);
        setBody(draft.body ?? body);
        setCoverImage(draft.coverImage ?? "");
      } catch { /* keep the starter manuscript */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSaved(false);
    const timer = setTimeout(() => {
      localStorage.setItem("pageone-draft", JSON.stringify({ title, subtitle, author, body, coverImage }));
      setSaved(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [title, subtitle, author, body, coverImage]);

  const wordCount = useMemo(() => body.replace(/\s/g, "").length, [body]);

  async function generateCover() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: coverPrompt, title, subtitle, author }),
      });
      const data = await res.json();
      if (data.image) setCoverImage(data.image);
      setToast(data.demo ? "AI API 키가 없어 편집 가능한 디자인 시안을 만들었어요." : "AI가 새 표지를 완성했어요.");
    } catch {
      setToast("표지 생성이 잠시 지연되고 있어요. 다시 시도해 주세요.");
    } finally {
      setGenerating(false);
      setTimeout(() => setToast(""), 3200);
    }
  }

  async function askAi(action?: string) {
    setAiBusy(true);
    const request = action ?? aiInput;
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, text: body, title }),
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
              <p>책의 분위기를 알려주면 AI가 표지 시안을 만들어요. 제목과 색상은 언제든 수정할 수 있어요.</p>
            </div>
            <label>책 제목<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label>부제<input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></label>
            <label>저자명<input value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
            <label>어떤 표지를 원하세요?<textarea rows={4} value={coverPrompt} onChange={(e) => setCoverPrompt(e.target.value)} /></label>
            <div className="prompt-suggestions">
              <button onClick={() => setCoverPrompt("여백이 넉넉한 미니멀 에세이, 따뜻한 아이보리 종이와 작은 식물 드로잉")}>미니멀 에세이</button>
              <button onClick={() => setCoverPrompt("짙은 남색 밤하늘과 금빛 별, 신비로운 문학 소설 표지")}>문학 소설</button>
              <button onClick={() => setCoverPrompt("선명한 코랄 포인트와 기하학 도형, 현대적인 자기계발서 표지")}>자기계발</button>
            </div>
            <button className="primary-button" onClick={generateCover} disabled={generating}>
              <span>✦</span>{generating ? "AI가 표지를 그리고 있어요…" : "AI로 새 표지 만들기"}
            </button>
            <p className="credit-note">생성 1회 · AI 크레딧 1개</p>
          </aside>

          <div className="canvas-zone">
            <div className="canvas-head"><span>표지 미리보기</span><div><button>앞표지</button><button>책등</button><button>뒷표지</button></div><button className="zoom">− &nbsp; 80% &nbsp; +</button></div>
            <div className="cover-stage">
              <div className={`book-cover ${coverImage ? "has-image" : ""}`} style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}>
                <div className="cover-grain" />
                <div className="cover-topline">ESSAY COLLECTION · 2026</div>
                <div className="cover-copy">
                  <span className="cover-symbol">✦</span>
                  <h2>{title}</h2>
                  <p>{subtitle}</p>
                </div>
                <div className="cover-author">{author} 지음</div>
              </div>
              <div className="cover-tools">
                <button title="텍스트 추가">T</button><button title="이미지 배치">▧</button><button title="색상 변경">◐</button><button title="정렬">↔</button>
              </div>
            </div>
            <div className="canvas-footer"><span>148 × 210 mm · A5</span><span>300 DPI · 인쇄 적합 ✓</span></div>
          </div>

          <aside className="tip-panel">
            <div className="tip-icon">✦</div>
            <h3>좋은 표지 프롬프트</h3>
            <p>장르, 분위기, 중심 소재와 원하는 색을 함께 적으면 더 좋은 결과를 얻을 수 있어요.</p>
            <div className="example-prompt">“비 오는 창가의 찻잔, 청회색 수채화, 차분한 에세이 표지”</div>
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
            <div className="book-facts"><span>도서명</span><b>{title}</b><span>저자</span><b>{author}</b><span>예상 분량</span><b>약 36쪽</b></div>
          </div>
          <aside className="publish-card">
            <h2>출판 설정</h2>
            <label>판형<select value={format} onChange={(e) => setFormat(e.target.value)}><option>A5</option><option>신국판</option><option>B5</option></select></label>
            <label>출판 형태<div className="format-toggle"><button className="active">종이책</button><button>전자책</button></div></label>
            <div className="check-list"><p><span>✓</span> 표지 해상도 적합</p><p><span>✓</span> 재단 여백 확인</p><p><span>✓</span> 폰트 포함 완료</p><p><span>✓</span> 빈 페이지 없음</p></div>
            <button className="primary-button" onClick={exportPdf}>↓ 인쇄용 PDF 만들기</button>
            <button className="secondary-button" onClick={() => setStep("edit")}>본문으로 돌아가기</button>
          </aside>
        </section>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
