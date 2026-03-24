import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocMind - Intelligent Document Processing",
  description: "AI-powered document processing system with semantic search and natural language queries.",
  keywords: ["AI", "Document Processing", "Semantic Search", "Next.js", "TypeScript"],
  authors: [{ name: "DocMind Team" }],

  openGraph: {
    title: "DocMind",
    description: "Intelligent document processing with semantic understanding",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://docmind.app",
    siteName: "DocMind",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocMind",
    description: "Intelligent document processing with semantic understanding",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`antialiased bg-background text-foreground ${bricolage.variable} ${spaceMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
