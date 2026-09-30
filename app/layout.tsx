import type { Metadata } from "next";
import "./globals.css";
import favicon from "./ico/favicon.png";

export const metadata: Metadata = {
  title: "RAG AI Intelligence System - Next.js & MCP",
  description: "Full-Stack RAG Chat Application with MongoDB Vector Search and Tavily Web Fallback Orchestration.",
        icons: {
        icon: favicon.src,
        
        
      },
    };


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#131314] text-[#e3e3e3] antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
