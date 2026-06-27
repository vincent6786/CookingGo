import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeApplier from "@/components/ThemeApplier";

// Runs before React hydrates so the page paints with the correct palette
// — avoids a one-frame light-mode flash for users who picked dark.
const themeBootScript = `(function(){try{var raw=localStorage.getItem('cooking-routine-store-v1');var t=raw?(JSON.parse(raw).state||{}).settings?.theme:undefined;t=t||'system';var dark=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`;

// Fonts are self-hosted (variable woff2) so the app builds and runs fully
// offline — no Google Fonts fetch at build time or runtime.
const display = localFont({
  src: "./fonts/SpaceGrotesk.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "300 700",
});
const sans = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});
const mono = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 800",
});

export const metadata: Metadata = {
  title: "Galley — cooking routine",
  description:
    "Pre-flight your week of meals: plan, shop, cook, and manage leftovers with the fewest decisions.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Galley",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#102A2C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeApplier />
        <ServiceWorkerRegister />
        <main className="mx-auto w-full max-w-2xl px-4 pt-5 lg:max-w-4xl">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
