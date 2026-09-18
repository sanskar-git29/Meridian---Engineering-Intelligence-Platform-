"use client";

import React, { useState } from "react";
import { FiCpu, FiSend, FiZap, FiMessageSquare, FiTrendingDown } from "react-icons/fi";

export function CostAssistant() {
  const [inputQuery, setInputQuery] = useState("");
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    {
      role: "assistant",
      text: "Hello Alex! I am your AI Cloud Cost Assistant. You can save up to $1,907 by investigating the Aug 29 production traffic spike.",
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setInputQuery("");

    setConversation((prev) => [
      ...prev,
      { role: "user", text: userText },
      {
        role: "assistant",
        text: `Based on Acme Cloud Demo telemetry, analyzing "${userText}": EC2 instance auto-scaling accounts for 35.08% ($28,409.64) of your current monthly bill.`,
      },
    ]);
  };

  const sampleQuestions = [
    "Why did spend spike on Aug 29?",
    "How to reduce EC2 costs?",
    "RDS reserved instance savings",
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#1B55CD]/80 rounded-2xl p-6 text-white border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2265EF]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2265EF] text-white flex items-center justify-center font-bold shadow-sm shadow-[#2265EF]/40">
            <FiCpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              AI Cost Assistant
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-time infrastructure intelligence
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-[#2265EF]/30 border border-[#2265EF]/50 text-[#8CE1BC] text-[10px] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8CE1BC] animate-pulse" />
          Online
        </span>
      </div>

      {/* Message Chat Feed */}
      <div className="relative z-10 space-y-2.5 max-h-48 overflow-y-auto pr-1">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl text-xs leading-relaxed ${
              msg.role === "assistant"
                ? "bg-slate-800/90 text-slate-200 border border-slate-700/60"
                : "bg-[#2265EF] text-white ml-6 font-semibold"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Sample Quick Questions */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1">
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInputQuery(q)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-all border border-slate-700 whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="relative z-10 flex items-center gap-2 pt-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask me anything about your cloud cost..."
          className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2265EF]"
        />
        <button
          type="submit"
          className="p-2.5 bg-[#2265EF] hover:bg-[#1B55CD] text-white rounded-xl transition-all font-bold shadow-md shadow-[#2265EF]/30"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
