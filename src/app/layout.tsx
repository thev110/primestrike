import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CTAPopup } from "@/components/cta-popup";
import { WhatsAppFAB } from "@/components/whatsapp-fab";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Prime Strike | Interactive Trading School in Chennai",
  description:
    "Learn stock market trading and options hedging strategies from Saranya. Join our live webinars and online classes in Chennai.",
  openGraph: {
    title: "Prime Strike | Interactive Trading School in Chennai",
    description:
      "Learn stock market trading and options hedging strategies from Saranya. Join our live webinars and online classes in Chennai.",
    url: "https://www.primestrike.in",
    siteName: "Prime Strike",
    images: [
      {
        url: "/images/services-hero.png",
        width: 1200,
        height: 630,
        alt: "Prime Strike - Premium Trading Academy in Chennai",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Strike | Interactive Trading School in Chennai",
    description:
      "Learn stock trading from Saranya in Chennai.",
    images: ["/images/services-hero.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${poppins.variable} ${inter.variable}`}>
      <body className="font-[family-name:var(--font-inter)] bg-black text-white min-h-screen antialiased">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <CTAPopup />
          <WhatsAppFAB />
        </AuthProvider>
      </body>
    </html>
  );
}

