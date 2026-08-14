"use client";

import Sidebar from "@/components/Sidebar";
import RagChat from "@/components/RagChat";

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#131314]">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main GPT Chat Interface */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <RagChat />
      </div>
    </main>
  );
}
