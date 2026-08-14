"use client";

import React, { useState } from "react";
import DocumentUpload, { IngestedDoc } from "./DocumentUpload";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Cpu,
  Globe,
  Settings,
  HelpCircle,
  FileCode2,
} from "lucide-react";

interface SidebarProps {
  onIngestSuccess?: (doc: IngestedDoc) => void;
}

export default function Sidebar({ onIngestSuccess }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative h-full bg-[#1e1f20] border-r border-[#2e2f31] flex flex-col transition-all duration-300 z-20 ${
        collapsed ? "w-16" : "w-80 md:w-96"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2e2f31] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2e2f31] rounded-xl text-emerald-400 font-bold text-sm">
              RAG
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 tracking-wide">
                Control Center
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                MCP Orchestrated
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#2e2f31] transition-all mx-auto"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Sidebar Main Content */}
      {!collapsed ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {/* Document Ingestion Card */}
          <div className="p-4 rounded-2xl bg-[#131314] border border-[#2e2f31] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              Document Vector Ingestion
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload PDF or TXT files to chunk and embed into your MongoDB Vector Store.
            </p>
            <DocumentUpload onIngestSuccess={onIngestSuccess} />
          </div>

          {/* System Services Status */}
          <div className="p-4 rounded-2xl bg-[#131314] border border-[#2e2f31] space-y-3">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>System Health</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e1f20] border border-[#2e2f31]">
                <span className="flex items-center gap-2 text-slate-300">
                  <Database className="w-4 h-4 text-emerald-400" />
                  MongoDB Vector DB
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e1f20] border border-[#2e2f31]">
                <span className="flex items-center gap-2 text-slate-300">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  MCP Server
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e1f20] border border-[#2e2f31]">
                <span className="flex items-center gap-2 text-slate-300">
                  <Globe className="w-4 h-4 text-amber-400" />
                  Tavily Web Search
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                  Fallback Ready
                </span>
              </div>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2e2f31] text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" /> How Fallback Works
            </div>
            <p className="text-[11px] leading-relaxed">
              When you ask a question, the MCP orchestrator runs hybrid search. If your local vector score is below 0.02, it smoothly falls back to live web search!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center py-6 space-y-6 text-slate-400">
          <Database className="w-5 h-5 text-emerald-400" />
          <Cpu className="w-5 h-5 text-cyan-400" />
          <Globe className="w-5 h-5 text-amber-400" />
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#2e2f31] text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        {!collapsed && <span>Full-Stack RAG System</span>}
        <Settings className="w-4 h-4 text-slate-400 hover:text-slate-200 cursor-pointer" />
      </div>
    </aside>
  );
}
