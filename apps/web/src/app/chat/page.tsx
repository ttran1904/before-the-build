"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI design assistant. I can help you pick furniture, " +
        "choose color schemes, rearrange your room, and more. What would you " +
        "like to work on?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // TODO: Call Supabase edge function ai-chat
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "That's a great idea! Let me look into some options for you. " +
            "(AI integration coming soon)",
        },
      ]);
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <h1 className="mb-4 text-xl font-bold text-[#1a1a2e]">
        AI Design Chat
      </h1>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-[#e8e6e1] bg-[#f8f7f4] p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-md bg-[#2d5a3d] text-white"
                  : "rounded-bl-md border border-[#e8e6e1] bg-white text-[#4a4a5a]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          placeholder="Ask about your room design..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3 text-[#1a1a2e] outline-none focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
        />
        <button
          onClick={handleSend}
          className="rounded-xl bg-[#2d5a3d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#234a31]"
        >
          Send
        </button>
      </div>
    </div>
  );
}
