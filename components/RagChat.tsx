"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "ai/react";
import {
  Send,
  Bot,
  User,
  Globe,
  Database,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";

export default function RagChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleCitation = (msgId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#131314] text-[#e3e3e3] relative overflow-hidden">
      {/* Header bar - Gemini / ChatGPT style */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-[#2e2f31] bg-[#131314] z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1e1f20] rounded-xl border border-[#2e2f31] text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-wide flex items-center gap-2">
              RAG Intelligence Assistant
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2e2f31] text-slate-300 font-mono">
                MCP Hybrid
              </span>
            </h1>
            <p className="text-xs text-slate-400">MongoDB Vector DB + Tavily Web Fallback</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1e1f20] text-emerald-400 border border-[#2e2f31]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Vector Search Connected
          </div>
        </div>
      </header>

      {/* Messages Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-6 my-auto pt-12">
            <div className="p-4 bg-[#1e1f20] rounded-2xl border border-[#2e2f31] text-emerald-400">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Search uploaded documents or let the MCP Orchestrator retrieve live web answers if local knowledge is missing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg text-left pt-2">
              {[
                { title: "What is Spring Boot?", icon: Database, label: "Local Document Query" },
                { title: "Latest AI advancements in 2026", icon: Globe, label: "Triggers Web Search" },
                { title: "How does vector search work?", icon: BookOpen, label: "Hybrid Vector RAG" },
                { title: "Explain chunking with MiniLM", icon: Sparkles, label: "Tokenizer Context" },
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleInputChange({ target: { value: sample.title } } as any);
                  }}
                  className="p-3.5 rounded-2xl bg-[#1e1f20] border border-[#2e2f31] hover:border-[#444746] transition-all text-xs text-slate-300 space-y-1 text-left group"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400">
                    <span className="font-semibold">{sample.label}</span>
                    <sample.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-slate-200 font-medium">{sample.title}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.map((message, idx) => {
              const isUser = message.role === "user";
              const annotations = message.annotations as any[];
              const searchMeta = annotations?.find((a) => a.type === "search_metadata");
              const isWebFallback = searchMeta?.isWebFallback;
              const citations = searchMeta?.citations || [];

              return (
                <div
                  key={message.id || idx}
                  className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {isUser ? (
                    /* User Message: Aligned Right in sleek rounded pill bubble */
                    <div className="max-w-[80%] bg-[#2f2f2f] text-slate-100 px-5 py-3.5 rounded-3xl rounded-tr-sm text-sm font-medium leading-relaxed border border-[#3a3a3a] shadow-sm">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  ) : (
                    /* Assistant Message: Aligned Left with avatar and clean block layout */
                    <div className="w-full flex items-start gap-4 py-2 border-b border-[#222325] pb-6">
                      <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-[#333537] flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>

                      <div className="flex-1 space-y-3 min-w-0">
                        {/* Source Status Badge */}
                        {searchMeta && (
                          <div className="flex items-center gap-2">
                            {isWebFallback ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-web-fallback">
                                <Globe className="w-3.5 h-3.5" />
                                <span>🌐 Web Fallback Active</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-rag-active">
                                <Database className="w-3.5 h-3.5" />
                                <span>📚 Local RAG Match</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Assistant Response Text */}
                        <div className="text-sm leading-relaxed text-[#e3e3e3] whitespace-pre-wrap font-normal">
                          {message.content}
                        </div>

                        {/* Citations Accordion */}
                        {citations.length > 0 && (
                          <div className="pt-2">
                            <button
                              onClick={() => toggleCitation(message.id)}
                              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium bg-[#1e1f20] px-3 py-1.5 rounded-xl border border-[#2e2f31] transition-all"
                            >
                              {expandedCitations[message.id] ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {citations.length} Source Citations ({isWebFallback ? "Web Pages" : "Document Chunks"})
                              </span>
                            </button>

                            {expandedCitations[message.id] && (
                              <div className="mt-3 space-y-2 pl-3 border-l-2 border-[#383838]">
                                {citations.map((cite: any, cIdx: number) => (
                                  <div
                                    key={cIdx}
                                    className="p-3 rounded-xl bg-[#1e1f20] border border-[#2e2f31] text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between font-semibold text-slate-200">
                                      <span className="flex items-center gap-1.5 truncate">
                                        {cite.source === "web" ? (
                                          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        ) : (
                                          <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        )}
                                        {cite.title}
                                      </span>
                                      {cite.url && (
                                        <a
                                          href={cite.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                                        >
                                          Visit <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                    <p className="text-slate-400 italic text-[11px] line-clamp-2">
                                      "{cite.snippet}"
                                    </p>
                                    {cite.score && (
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        Relevance Score: {cite.score}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Copy Button */}
                        <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
                          <button
                            onClick={() => copyToClipboard(message.content, idx)}
                            className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isLoading && (
          <div className="max-w-3xl mx-auto w-full flex gap-4 items-start py-3">
            <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-[#333537] flex items-center justify-center text-emerald-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#1e1f20] border border-[#2e2f31] text-xs text-slate-300 flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="font-mono text-slate-400">
                Searching vector DB & orchestrating response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Bottom Input Area - Gemini Dark Rounded Pill */}
      <div className="p-4 md:px-8 border-t border-[#2e2f31] bg-[#131314] shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative bg-[#1e1e1e] border border-[#383838] rounded-3xl transition-all duration-300 focus-within:border-[#555555] focus-within:ring-1 focus-within:ring-[#555555]"
        >
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="Ask a question or search web..."
            rows={1}
            className="w-full bg-transparent px-5 py-3.5 pr-14 text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none overflow-hidden"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-200 text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-slate-200 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-[11px] text-slate-500 text-center mt-2">
          Press <kbd className="px-1 py-0.5 bg-[#1e1f20] border border-[#2e2f31] rounded text-slate-400 font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-[#1e1f20] border border-[#2e2f31] rounded text-slate-400 font-mono">Shift + Enter</kbd> for newline.
        </div>
      </div>
    </div>
  );
}
