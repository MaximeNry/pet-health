import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Hanken Grotesk drives all UI; Instrument Serif is reserved for the wordmark
// and welcome/marketing headlines (`font-display`). See design/design-system/.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  subsets: ["latin"],
});

// Browser chrome color while the PWA loads (green-600, see globals.css).
export const viewport: Viewport = {
  themeColor: "#16704A",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: "PetHealth",
    description: t("description"),
    icons: {
      icon: "/brand/icon-192.png",
      apple: "/apple-touch-icon.png",
    },
    // iOS ignores most of the manifest: these tags drive the standalone
    // (home-screen) experience on iPhone.
    appleWebApp: {
      capable: true,
      title: "PetHealth",
      statusBarStyle: "default",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${hankenGrotesk.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Messages and locale are inherited from src/i18n/request.ts. */}
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
