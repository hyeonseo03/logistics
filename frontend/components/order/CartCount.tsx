"use client";

import { useCart } from "@/components/order/CartContext";

// 헤더의 "장바구니" 옆에 담긴 개수를 보여준다
export default function CartCount() {
  const { totalCount } = useCart();
  if (totalCount === 0) return null;

  return (
    <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
      {totalCount}
    </span>
  );
}
