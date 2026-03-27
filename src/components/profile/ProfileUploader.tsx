"use client";

import { useState } from "react";
import { Upload, Loader2, Check, AlertCircle, Sparkles } from "lucide-react";

export default function ProfileUploader({ onSuccess }: { onSuccess: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; data: Record<string, number> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") setText(content);
    };
    reader.readAsText(file);
  }

  async function handleUpload() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setResult(data);
        onSuccess();
      }
    } catch {
      setError("Upload request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">
          Upload Trader Profile CSV or paste content
        </label>
        <label className="flex flex-col items-center justify-center w-full h-20 bg-white/40 border-2 border-dashed border-brand-light/50 rounded-xl cursor-pointer hover:border-brand-light transition-colors">
          <Upload size={18} className="text-brand mb-1" />
          <span className="text-xs text-gray-500">Click to upload CSV or TXT</span>
          <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        </label>
        {text && (
          <p className="text-[10px] text-emerald-500 mt-1">{text.split("\n").length} lines loaded</p>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Or paste profile text directly</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste the trader profile CSV content here..."
          className="w-full bg-white/40 border border-brand-light/40 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand resize-y"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200/50 rounded-xl">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500" />
            <p className="text-sm text-emerald-600 font-medium">Profile imported</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.data).map(([key, val]) => (
              <span key={key} className="text-[10px] px-2 py-0.5 bg-white/60 rounded text-gray-600">
                {val} {key}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500">{result.message}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || text.trim().length < 50}
        className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm rounded-xl transition-colors"
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" /> Parsing with AI...</>
        ) : (
          <><Sparkles size={14} /> Import Trader Profile</>
        )}
      </button>
    </div>
  );
}
