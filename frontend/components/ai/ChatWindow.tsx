"use client";

import { useState } from "react";
import { askAi } from "@/lib/api";
import type { ChatMessage } from "@/types/ai";

const firstMessage: ChatMessage = {
  id: 1,
  role: "ASSISTANT",
  content: "안녕하세요! Logistics AI 도우미입니다.\n\"내 배송 어디쯤이야?\"처럼 배송에 대해 물어보세요.",
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([firstMessage]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false); // AI 답변을 기다리는 중인지

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || waiting) return;

    // 1. 내 질문을 화면에 바로 추가
    const userMessage: ChatMessage = { id: messages.length + 1, role: "USER", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setWaiting(true);

    // 2. AI 답변 요청 (1초 걸림)
    try {
      const response = await askAi({ message: text });
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ASSISTANT", content: response.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ASSISTANT", content: "오류가 발생했어요. 잠시 후 다시 시도해 주세요." },
      ]);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border bg-white">
      {/* 메시지 목록 */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] whitespace-pre-line rounded-lg px-4 py-2 ${
              message.role === "USER" ? "self-end bg-blue-600 text-white" : "self-start bg-gray-100"
            }`}
          >
            {message.content}
          </div>
        ))}
        {waiting && (
          <div className="self-start rounded-lg bg-gray-100 px-4 py-2 text-gray-500">
            답변을 작성하고 있어요...
          </div>
        )}
      </div>

      {/* 입력창 */}
      <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={waiting || !input.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
        >
          보내기
        </button>
      </form>
    </div>
  );
}
