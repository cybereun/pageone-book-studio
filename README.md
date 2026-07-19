<div align="center">

# PAGEONE

### AI와 함께 표지부터 본문, 인쇄용 PDF까지 완성하는 셀프 퍼블리싱 스튜디오

[![Release](https://img.shields.io/badge/Release-V1.0.0-5F55DF?style=for-the-badge)](#릴리즈)
[![Developer](https://img.shields.io/badge/Developer-Lebi%20(cybereun)-FF654A?style=for-the-badge)](https://github.com/cybereun)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Developer: [Lebi (cybereun)](https://github.com/cybereun)**

[라이브 앱 실행](https://pageone-book-studio.go-lebi.chatgpt.site)

</div>

---

## PAGEONE 소개

PAGEONE은 독립 출판자, 작가, 에세이스트, 콘텐츠 크리에이터가 하나의 작업 공간에서 종이책과 전자책을 제작할 수 있도록 만든 웹 기반 도서 제작 앱입니다. 책의 판형과 페이지 수를 선택하면 인쇄에 필요한 전체 표지 전개도, 책등 두께, 재단 여백과 300 DPI 출력 크기를 자동으로 계산합니다.

표지는 PAGEONE AI로 생성하거나 Canva에서 별도로 디자인한 결과물을 가져올 수 있습니다. 본문 편집 화면에서는 OpenAI, Google Gemini, Anthropic Claude를 글쓰기 파트너로 선택하여 문장 다듬기, 이어쓰기, 표현 확장, 제목 제안 등의 도움을 받을 수 있습니다. 완성된 표지는 실제 물리 규격의 PNG 및 PDF로 출력할 수 있습니다.

## 핵심 특징

### 1. 직관적인 책 규격 선택

- 46판, A5, B5, A4를 실제 종이 비율에 가까운 시각 카드로 선택합니다.
- 각 판형의 가로·세로 크기와 권장 용도를 함께 보여줍니다.
- 책 날개 포함 여부를 직관적인 전개도 그림으로 선택합니다.
- 날개를 사용할 경우 좌우 날개 폭을 60~120mm 범위에서 설정합니다.
- 페이지 수는 50~300페이지 범위에서 입력할 수 있습니다.
- 현재 판형, 페이지 수, 책등, 날개, 전체 전개도와 300 DPI 픽셀 크기를 즉시 확인합니다.

| 판형 | 완성 크기 | 추천 용도 |
|---|---:|---|
| 46판 | 127 × 188mm | 시집, 에세이, 소형 단행본 |
| A5 | 148 × 210mm | 소설, 에세이, 일반 단행본 |
| B5 | 182 × 257mm | 문제집, 잡지, 워크북 |
| A4 | 210 × 297mm | 교재, 문제집, 화보 |

### 2. 페이지 수 기반 책등 자동 계산

PAGEONE은 다음 공식을 사용하여 책등 두께를 계산합니다.

```text
책등 두께(mm) = 페이지 수 × 0.055 + 1.6
```

| 페이지 수 | 자동 책등 두께 |
|---:|---:|
| 50P | 4.35mm |
| 60P | 4.90mm |
| 70P | 5.45mm |
| 80P | 6.00mm |
| 90P | 6.55mm |
| 100P | 7.10mm |
| 110P | 7.65mm |
| 200P | 12.60mm |
| 300P | 18.10mm |

계산된 책등은 미리보기의 가운데 영역, Canva 작업 지시서, 300 DPI PNG 및 인쇄용 PDF에 동일하게 반영됩니다. 실제 인쇄 시에는 인쇄소의 종이 종류와 제본 방식에 따라 책등 기준이 달라질 수 있으므로 최종 발주 전에 인쇄소 규격을 확인하세요.

### 3. PAGEONE AI 표지 생성

- 제목, 부제, 저자명, 장르, 분위기, 중심 소재와 원하는 색을 프롬프트로 입력합니다.
- 선택한 판형, 페이지 수, 책등, 날개와 전체 전개도 비율이 AI 요청에 자동 포함됩니다.
- AI는 표지 문자를 이미지에 굽지 않고 배경 아트워크를 중심으로 생성하도록 지시되며, 제목과 저자명은 편집 가능한 별도 레이어로 유지됩니다.
- 생성된 이미지는 선택한 전체 전개도 비율로 중앙 기준 크롭되고 300 DPI 목표 픽셀 크기로 정규화됩니다.
- OpenAI와 Gemini는 이미지 생성 엔진으로 사용할 수 있습니다.
- Claude 선택 시 Claude가 출판 표지 아트디렉션 프롬프트를 작성하고, 연결된 OpenAI 또는 Gemini 이미지 엔진이 결과 이미지를 생성합니다.

### 4. 실제로 작동하는 표지 편집 도구

표지 미리보기 오른쪽의 도구 모음은 모두 실제 편집 상태에 연결됩니다.

- **텍스트 도구**: 앞표지 제목, 부제, 저자명, 책등 제목, 책등 저자명을 선택합니다.
- **텍스트 추가**: 앞표지에 새로운 사용자 문구를 추가하고 문구를 직접 수정합니다.
- **글꼴 편집**: Noto Serif KR, Noto Sans KR, Georgia, Arial 중에서 선택합니다.
- **글자 크기와 색상**: 레이어별 글자 크기와 색을 변경합니다.
- **정렬과 위치**: 왼쪽·가운데·오른쪽 정렬 및 상하좌우 미세 이동을 지원합니다.
- **이미지 도구**: PNG, JPG, WEBP 배경을 교체하고 100~200% 확대와 가로·세로 위치를 조절합니다.
- **색상 도구**: 컬러 피커 또는 추천 팔레트로 표지 배경색을 변경합니다.
- **줌**: 50~140% 범위에서 전개도를 축소하거나 확대합니다.
- **가이드**: 재단선과 안전 여백 가이드를 켜거나 끕니다.

### 5. 정교한 책등 타이포그래피

- 책 제목은 책등 중앙 축에 세로 한 줄로 크게 배치됩니다.
- 작가명은 제목 아래쪽에 충분한 간격을 두고 더 작은 크기로 배치됩니다.
- 제목과 작가명은 각각 책등 중앙에 정렬됩니다.
- 책등 작가명은 `포함` 또는 `제외`를 선택할 수 있습니다.
- 책등이 얇은 경우에도 영역을 벗어나지 않도록 글자 크기와 넘침을 제한합니다.

### 6. Canva 연동 작업 흐름

Canva를 사용할 때는 PAGEONE의 일반 AI 생성 흐름과 분리된 전용 과정을 이용합니다.

1. 현재 판형, 책등, 날개, 재단 여백이 포함된 300 DPI 가이드 PNG를 내려받습니다.
2. `MCP 작업 지시서 복사`를 눌러 정확한 Canva 제작 사양을 복사합니다.
3. Canva 또는 Canva MCP 작업 환경에서 사용자 지정 크기의 전체 표지를 디자인합니다.
4. 완성본을 고해상도 PNG, JPG 또는 WEBP로 내보냅니다.
5. PAGEONE에 가져오면 비율과 해상도를 검사하고 선택한 전개도 크기에 자동으로 맞춥니다.

> Canva MCP는 PAGEONE 브라우저 앱 내부에서 직접 실행되는 것이 아니라 외부 Canva 작업 환경에서 실행됩니다. PAGEONE은 정확한 지시서·가이드 생성과 결과물 가져오기를 담당합니다.

### 7. AI 글쓰기 편집기

- 원고를 장 단위로 구성하고 본문을 직접 작성합니다.
- 오른쪽 PAGEONE AI 패널이 현재 원고 문맥을 바탕으로 도움을 제공합니다.
- `문장 다듬기`, `이어쓰기`, `표현 풍부하게`, `제목 제안` 빠른 작업을 지원합니다.
- 자유 요청을 입력하여 편집 방향을 구체적으로 지정할 수 있습니다.
- AI 제안은 확인한 후 원고 끝에 추가할 수 있습니다.
- OpenAI, Gemini, Claude를 직접 선택하거나 자동 전환 모드를 사용할 수 있습니다.

### 8. AI API 설정

오른쪽 상단 톱니바퀴 아이콘에서 AI 연결을 관리합니다.

- OpenAI, Google Gemini, Anthropic Claude의 고유 아이콘과 모델 정보를 표시합니다.
- 제공자별 API 키 입력, 연결 테스트, 저장, 삭제 기능을 제공합니다.
- 각 서비스의 공식 API 키 발급 페이지로 이동할 수 있습니다.
- 입력한 키는 서버 데이터베이스에 영구 저장하지 않으며 현재 브라우저 세션 저장소에서 관리합니다.
- 서버 배포 환경에서는 환경 변수로 공용 키를 설정할 수도 있습니다.

| 제공자 | 글쓰기 | 이미지/표지 역할 | 환경 변수 |
|---|:---:|---|---|
| OpenAI | ✓ | 이미지 생성 | `OPENAI_API_KEY` |
| Google Gemini | ✓ | 최대 4K 이미지 생성 | `GEMINI_API_KEY` |
| Anthropic Claude | ✓ | 표지 아트디렉션 + 이미지 엔진 연계 | `ANTHROPIC_API_KEY` |

### 9. 인쇄 규격 출력

- 모든 판형에 사방 3mm 재단 여백을 적용합니다.
- 전체 전개도는 `뒤표지 + 책등 + 앞표지` 순서로 구성됩니다.
- 날개 사용 시 `왼쪽 날개 + 뒤표지 + 책등 + 앞표지 + 오른쪽 날개` 순서가 됩니다.
- **300 DPI PNG**: 선택한 전체 전개도 규격을 고해상도 이미지로 출력합니다.
- **인쇄용 PDF**: mm를 PDF 포인트로 변환하여 실제 물리 크기의 단일 페이지 PDF를 생성합니다.
- 제목, 부제, 저자명, 책등 문자, 사용자 추가 문구와 배경 편집 결과가 출력물에 반영됩니다.

## 사용 방법

### 1단계: 표지 디자인

1. 책 제목, 부제와 저자명을 입력합니다.
2. 46판, A5, B5, A4 중 책 판형을 선택합니다.
3. 페이지 수와 날개 포함 여부를 설정합니다.
4. 자동 계산된 책등 두께와 전체 전개도 크기를 확인합니다.
5. 책등에 작가명을 넣을지 선택합니다.
6. `PAGEONE AI` 또는 `Canva 작업` 중 제작 방식을 선택합니다.
7. AI를 사용한다면 프롬프트와 제공자를 선택하고 표지를 생성합니다.
8. Canva를 사용한다면 가이드와 MCP 작업 지시서를 이용하여 디자인한 뒤 결과를 가져옵니다.
9. 오른쪽 편집 도구로 텍스트, 이미지, 색상과 정렬을 조정합니다.
10. 필요하면 300 DPI PNG 또는 인쇄용 PDF를 내려받습니다.

### 2단계: 본문 편집

1. 상단의 `본문 편집` 단계로 이동합니다.
2. 목차에서 편집할 장을 선택하고 중앙 원고 영역에 글을 작성합니다.
3. 오른쪽 AI 패널에서 원하는 AI 제공자를 선택합니다.
4. 빠른 작업 버튼 또는 자유 요청으로 AI 제안을 생성합니다.
5. 내용을 검토하고 `원고에 추가`를 눌러 반영합니다.

### 3단계: 검토 및 출판

1. `검토 · 출판` 단계로 이동합니다.
2. 도서명, 저자, 판형, 페이지 수와 책등 두께를 확인합니다.
3. 표지 해상도, 재단 여백, 폰트와 빈 페이지 확인 항목을 검토합니다.
4. 종이책 또는 전자책 용도에 맞는 PDF를 생성합니다.
5. 실제 인쇄 전에는 출력 PDF를 인쇄소 규격 검사 도구로 다시 확인합니다.

## 로컬 설치 방법

### 필수 환경

- Node.js `22.13.0` 이상
- npm
- 최신 Chrome, Edge, Safari 또는 Firefox
- AI 기능을 실제로 사용하려면 하나 이상의 AI API 키

### 설치

```bash
git clone https://github.com/cybereun/pageone-book-studio.git
cd pageone-book-studio
npm install
```

### 환경 변수 설정

`.env.example`을 `.env`로 복사하고 사용할 키만 입력합니다.

```bash
cp .env.example .env
```

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

환경 변수를 설정하지 않아도 앱을 실행할 수 있습니다. 이 경우 앱 오른쪽 상단의 API 설정 창에서 현재 세션에 사용할 키를 입력하세요.

### 개발 서버 실행

```bash
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 엽니다.

### 프로덕션 빌드

```bash
npm run build
npm run start
```

### 검사와 테스트

```bash
npm run lint
node --test tests/*.test.mjs
```

## npm 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run build` | vinext 프로덕션 빌드 생성 |
| `npm run start` | 프로덕션 빌드 실행 |
| `npm run lint` | 전체 소스 코드 검사 |
| `npm test` | 빌드 후 서버 렌더링 테스트 실행 |
| `npm run db:generate` | Drizzle 데이터베이스 마이그레이션 생성 |

## 프로젝트 구조

```text
pageone-book-studio/
├─ app/
│  ├─ api/ai/
│  │  ├─ cover/route.ts      # AI 표지 생성과 제공자 전환
│  │  ├─ write/route.ts      # AI 글쓰기 지원
│  │  └─ test/route.ts       # API 키 연결 검사
│  ├─ lib/
│  │  └─ cover-spec.mjs      # 책등·전개도·DPI·PDF 계산
│  ├─ globals.css            # 전체 디자인 시스템과 편집기 UI
│  ├─ layout.tsx             # 메타데이터와 앱 레이아웃
│  └─ page.tsx               # 표지·본문·출판 작업 공간
├─ public/
│  ├─ ai-logos/              # AI 제공자 아이콘
│  └─ og.png                 # 소셜 공유 이미지
├─ tests/
│  ├─ cover-spec.test.mjs    # 인쇄 규격과 PDF 구조 테스트
│  └─ rendered-html.test.mjs # 렌더링과 편집 기능 테스트
├─ .env.example
├─ package.json
└─ README.md
```

## 기술 구성

- **UI**: React 19, Next.js 16 호환 App Router
- **빌드 및 런타임**: vinext, Vite, Cloudflare Workers 호환 ESM
- **언어**: TypeScript, JavaScript ESM
- **스타일**: 반응형 CSS, CSS Grid, Flexbox
- **이미지 처리**: Browser Canvas 2D API
- **PDF 출력**: JPEG 이미지 XObject와 정확한 MediaBox를 사용하는 자체 단일 페이지 PDF 생성기
- **로컬 저장**: localStorage, sessionStorage, IndexedDB
- **AI 연동**: OpenAI API, Gemini API, Anthropic Messages API
- **테스트**: Node.js 기본 테스트 러너, 서버 렌더링 검사
- **배포**: Cloudflare 기반 OpenAI Sites

## 데이터와 보안

- API 키 입력값은 앱 데이터베이스에 저장하지 않습니다.
- 사용자가 설정 창에서 저장한 API 키는 현재 탭의 `sessionStorage`에만 보관됩니다.
- 대용량 표지 이미지는 localStorage 용량 초과를 방지하기 위해 IndexedDB에 별도로 보관합니다.
- 원고와 편집 설정은 현재 브라우저의 로컬 초안으로 저장됩니다.
- 실제 서비스 운영 시에는 브라우저에서 전달된 키의 취급 정책, 요청 로그, 사용량 제한과 개인정보처리방침을 별도로 검토해야 합니다.

## 테스트 범위

현재 자동 테스트는 다음 동작을 확인합니다.

- 50P, 100P, 200P, 300P 책등 두께 계산
- 재단 여백과 날개를 포함한 전체 전개도 계산
- mm에서 300 DPI 픽셀로의 변환
- 표지 줌 최소·최대 범위
- 가져온 이미지의 비율과 해상도 검사
- PDF 파일 헤더, 이미지 객체와 실제 MediaBox 구조
- PAGEONE 서버 렌더링
- 줌, 편집 도구, 300 DPI PNG와 인쇄용 PDF 버튼 노출
- AI 이미지 모델 설정의 회귀 검사

## 배포

현재 V1.0.0은 다음 주소에 공개 배포되어 있습니다.

**https://pageone-book-studio.go-lebi.chatgpt.site**

Cloudflare Workers 호환 빌드는 다음 명령으로 생성합니다.

```bash
npm run build
```

## 릴리즈

### V1.0.0 — Initial Public Release

PAGEONE의 첫 정식 공개 버전입니다.

#### 포함된 기능

- 종이책과 전자책 제작을 위한 3단계 작업 흐름
- 46판, A5, B5, A4 판형 선택
- 50~300페이지 책등 두께 자동 계산
- 책 날개와 폭 설정
- OpenAI, Gemini, Claude API 설정·테스트·저장·삭제
- AI 표지 생성과 AI 글쓰기 지원
- Canva 가이드, MCP 작업 지시서, 결과물 가져오기
- 텍스트, 이미지, 색상, 정렬과 줌 편집 도구
- 책등 제목과 선택형 작가명 타이포그래피
- 300 DPI PNG 출력
- 실제 물리 규격의 인쇄용 표지 PDF 출력
- 브라우저 초안 및 대용량 이미지 저장
- 인쇄 규격과 렌더링 자동 테스트
- 공개 프로덕션 배포

## 개발자

<table>
  <tr>
    <td><strong>Developer</strong></td>
    <td><strong>Lebi (cybereun)</strong></td>
  </tr>
  <tr>
    <td>GitHub</td>
    <td><a href="https://github.com/cybereun">@cybereun</a></td>
  </tr>
  <tr>
    <td>Release</td>
    <td>V1.0.0</td>
  </tr>
</table>

---

<div align="center">
  <strong>PAGEONE — 당신의 생각이 한 권의 책이 되는 곳</strong><br />
  Developed by <a href="https://github.com/cybereun">Lebi (cybereun)</a>
</div>
