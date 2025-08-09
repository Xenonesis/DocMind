import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "DocuMind AI - Intelligent Document Processing",
  description: "AI-powered document processing system with semantic search and natural language queries.",
  keywords: ["AI", "Document Processing", "Semantic Search", "Next.js", "TypeScript"],
  authors: [{ name: "DocuMind AI Team" }],
  openGraph: {
    title: "DocuMind AI",
    description: "Intelligent document processing with semantic understanding",
    url: "https://localhost:3000",
    siteName: "DocuMind AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocuMind AI",
    description: "Intelligent document processing with semantic understanding",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
