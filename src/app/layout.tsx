import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "DocMind - Intelligent Document Processing",
  description: "AI-powered document processing system with semantic search and natural language queries.",
  keywords: ["AI", "Document Processing", "Semantic Search", "Next.js", "TypeScript"],
  authors: [{ name: "DocMind Team" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "DocMind",
    description: "Intelligent document processing with semantic understanding",
    url: "https://localhost:3000",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
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
