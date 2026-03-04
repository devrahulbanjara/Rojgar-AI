import type { Metadata } from "next";
import { Poppins, Lato, Geist_Mono } from "next/font/google";
import StoreProvider from "@/providers/StoreProvider";
import LenisProvider from "@/providers/LenisProvider";
import MainLayout from "@/components/layout/MainLayout";
// ToasterNoSSR is a Client Component that uses dynamic(ssr:false) internally,
// which is the correct pattern for Server Component layouts.
import ToasterNoSSR from "@/components/common/ToasterNoSSR";
import "@/app/globals.css";
import "@/styles/main.scss";
import "react-toastify/dist/ReactToastify.css";

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ConvexHire",
  description:
    "ConvexHire is a job board for software engineers built with Next.js and Convex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${lato.variable} ${geistMono.variable}`}
      >
        <StoreProvider>
          <LenisProvider>
            <MainLayout>{children}</MainLayout>
          </LenisProvider>
          <ToasterNoSSR />
        </StoreProvider>
      </body>
    </html>
  );
}
