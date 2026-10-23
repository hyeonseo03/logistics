"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { askAi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { ChatMessage } from "@/types/ai";
import type { ProductResponse } from "@/types/product";

const firstMessage: ChatMessage = {
  id: 1,
  role: "ASSISTANT",
  content:
    "안녕하세요! Logistics AI 도우미입니다.\n주문·배송·도착 시간·취소에 대해 물어보거나, 상품 이름으로 검색해 보세요.",
};

// 눌러서 바로 물어볼 수 있는 예시 질문
const exampleQuestions = ["내 주문 어디쯤이야?", "언제 도착해?", "지금 취소하면 어떻게 돼?", "감귤 있어?"];

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([firstMessage]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false); // AI 답변을 기다리는 중인지
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, waiting]);

  async function send(text: string) {
    if (!text || waiting) return;

    // 1. 내 질문을 화면에 바로 추가
    setMessages((prev) => [...prev, { id: prev.length + 1, role: "USER", content: text }]);
    setInput("");
    setWaiting(true);

    // 2. AI 답변 요청 (로그인했으면 내 주문 기준으로 답한다)
    try {
      const response = await askAi({ message: text });
      // 상품 검색 답변이면 상품 목록을 함께 보여준다
      const products = response.type === "PRODUCT_SEARCH" ? (response.data as ProductResponse[]) : undefined;
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ASSISTANT", content: response.reply, products },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "ASSISTANT",
          content: err instanceof Error ? err.message : "오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setWaiting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input.trim());
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border bg-white">
      {/* 메시지 목록 */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] whitespace-pre-line rounded-lg px-4 py-2 ${
              message.role === "USER" ? "self-end bg-blue-600 text-white" : "self-start bg-gray-100"
            }`}
          >
            {message.content}
            {message.products && message.products.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {message.products.map((product) => (
                  <li key={product.id}>
                    <Link href={`/products/${product.id}`} className="text-blue-700 underline">
                      {product.name}
                    </Link>{" "}
                    <span className="text-sm text-gray-600">{formatPrice(product.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {waiting && (
          <div className="self-start rounded-lg bg-gray-100 px-4 py-2 text-gray-500">답변을 작성하고 있어요...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 예시 질문 */}
      <div className="flex gap-2 overflow-x-auto border-t px-3 pt-3">
        {exampleQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => send(question)}
            disabled={waiting}
            className="shrink-0 rounded-full border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      {/* 입력창 */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          maxLength={500}
          className="min-w-0 flex-1 rounded border px-3 py-2"
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
