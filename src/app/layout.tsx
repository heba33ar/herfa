import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "حِرفة | Hirfa — سوق المشاريع المنزلية النسائية",
    template: "%s · حِرفة",
  },
  description:
    "منصة رقمية تجمع المشاريع المنزلية النسائية في مكان واحد: اكتشفي المنتجات والخدمات المحلية، اطلبي بسهولة، وأديري متجرك وطلباتك ومبيعاتك.",
  keywords: ["حِرفة", "Hirfa", "مشاريع منزلية", "النقب", "رهط", "سوق محلي"],
  openGraph: {
    title: "حِرفة | Hirfa",
    description: "من المطبخ وغرفة الجلوس — إلى سوق مهني ومنظّم.",
    type: "website",
    locale: "ar",
  },
};

export const viewport: Viewport = {
  themeColor: "#7A3350",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={arabic.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
