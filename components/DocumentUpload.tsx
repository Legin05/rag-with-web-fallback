"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";

export interface IngestedDoc {
  name: string;
  chunks: number;
  time: string;
}

interface DocumentUploadProps {
  onIngestSuccess?: (doc: IngestedDoc) => void;
}

export default function DocumentUpload({ onIngestSuccess }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<IngestedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt" && ext !== "md") {
      setMessage({ type: "error", text: "Only PDF and TXT/MD files are supported." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newDoc: IngestedDoc = {
          name: file.name,
          chunks: data.chunksInserted || 1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setUploadedDocs((prev) => [newDoc, ...prev]);
        setMessage({
          type: "success",
          text: data.message || `Successfully ingested ${file.name}`,
        });
        if (onIngestSuccess) onIngestSuccess(newDoc);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to ingest file" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error during upload" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-5 border border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
            : "border-[#383838] bg-[#1e1f20] hover:border-[#555555] hover:bg-[#252628]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-3 py-2">
            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
            <div className="text-xs font-medium text-slate-200">
              Chunking & Embedding into Vector DB...
            </div>
            <div className="w-32 h-1 bg-[#2e2f31] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 animate-pulse w-full"></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 text-center py-2">
            <div className="p-2.5 bg-[#2e2f31] rounded-xl text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200">
                Click or drag & drop document
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF or TXT up to 25MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Feedback Toast */}
      {message && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/30 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-tight">{message.text}</span>
        </div>
      )}

      {/* Ingested Documents List */}
      {uploadedDocs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#2e2f31]">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Session Knowledge Chunks
            </span>
            <span>{uploadedDocs.length} Docs</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {uploadedDocs.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-[#1e1f20] border border-[#2e2f31] text-xs hover:border-[#444746] transition-all"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 truncate font-medium">{doc.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-slate-400">
                  <span className="px-1.5 py-0.5 bg-[#2e2f31] text-slate-200 rounded text-[10px]">
                    {doc.chunks} chunks
                  </span>
                  <span className="text-[10px] text-slate-500">{doc.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
