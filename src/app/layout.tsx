import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "DocMind - Intelligent Document Processing",
  description: "AI-powered document processing system with semantic search and natural language queries.",
  keywords: ["AI", "Document Processing", "Semantic Search", "Next.js", "TypeScript"],
  authors: [{ name: "DocMind Team" }],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
