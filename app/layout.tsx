import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAGEONE — 생각을 한 권의 책으로",
  description: "AI 표지 생성부터 본문 편집, PDF 출판까지 이어지는 셀프 퍼블리싱 스튜디오",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "PAGEONE — 생각을 한 권의 책으로",
    description: "AI와 함께 종이책과 전자책을 완성하세요.",
    images: [{ url: "/og.png", width: 1734, height: 907 }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
