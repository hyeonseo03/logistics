"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 홈: 배송 조회 빠른 입력창 (주문 번호 → /tracking/{주문번호})
// 로그인하지 않았으면 배송 조회 화면이 로그인 화면으로 보냈다가 다시 돌아온다
export default function TrackingQuickForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = orderId.trim();
    if (!/^\d+$/.test(value) || Number(value) <= 0) {
      setError("주문 번호를 숫자로 입력해 주세요. (주문 목록에서 확인할 수 있어요)");
      return;
    }
    setError("");
    router.push(`/tracking/${Number(value)}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="quick-order-id" className="text-sm font-medium text-gray-700">
        주문 번호
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="quick-order-id"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          inputMode="numeric"
          placeholder="예: 12"
          className="min-w-0 flex-1 rounded-lg border px-3 py-2"
        />
        <button type="submit" className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          조회
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
