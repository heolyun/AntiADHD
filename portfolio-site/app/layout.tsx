import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AntiADHD — AI 집중력 관리 플랫폼",
  description: "React Native, Spring Boot, k3s로 직접 설계·구축·운영한 AI 생산성 플랫폼 AntiADHD 포트폴리오",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "AntiADHD — 계획을 실행으로", description: "AI와 온프레미스 Kubernetes로 만든 집중력 관리 플랫폼", images: ["/og-cover.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
