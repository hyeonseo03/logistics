"use client";

import Link from "next/link";
import { useState } from "react";
import RequireLogin from "@/components/common/RequireLogin";
import { useCart } from "@/components/order/CartContext";
import CartItemRow from "@/components/order/CartItemRow";
import CartSummary from "@/components/order/CartSummary";

// 로그인하지 않았으면 로그인 화면으로 보냈다가 돌아온다
export default function CartPage() {
  return (
    <RequireLogin>
      <CartContent />
    </RequireLogin>
  );
}

function CartContent() {
  const {
    items,
    loading,
    error,
    checkoutItems,
    checkoutPrice,
    isSelected,
    updateQuantity,
    removeItems,
    toggleSelected,
    setAllSelected,
  } = useCart();
  const [actionError, setActionError] = useState(""); // 삭제 실패 안내

  if (loading) return <p className="p-8 text-gray-500">장바구니를 불러오는 중...</p>;

  if (error && items.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl font-bold">장바구니</h1>
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      </div>
    );
  }

  // 장바구니가 비었을 때
  if (items.length === 0) {
    return <EmptyCart />;
  }

  const buyableItems = items.filter((item) => !item.soldOut); // 품절이 아닌 상품
  const soldOutIds = items.filter((item) => item.soldOut).map((item) => item.productId);
  const selectedIds = buyableItems.filter((item) => isSelected(item.productId)).map((item) => item.productId);
  const allSelected = buyableItems.length > 0 && selectedIds.length === buyableItems.length;

  async function handleRemove(productIds: number[]) {
    setActionError("");
    try {
      await removeItems(productIds);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">장바구니</h1>

      {actionError && <p className="mt-4 text-sm text-red-600">{actionError}</p>}

      {/* 모바일: 목록 아래에 결제 요약 / 큰 화면: 오른쪽에 결제 요약 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          {/* 전체 선택 / 선택 삭제 / 품절된 상품 삭제 */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border bg-white px-4 py-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                disabled={buyableItems.length === 0}
                onChange={() => setAllSelected(!allSelected)}
                className="h-4 w-4"
              />
              전체 선택 ({checkoutItems.length}/{buyableItems.length})
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleRemove(selectedIds)}
                disabled={selectedIds.length === 0}
                className="rounded border px-3 py-1 hover:bg-gray-50 disabled:text-gray-300"
              >
                선택 삭제
              </button>
              {soldOutIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemove(soldOutIds)}
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                >
                  품절된 상품 삭제 ({soldOutIds.length})
                </button>
              )}
            </div>
          </div>

          {soldOutIds.length > 0 && (
            <p className="border-x bg-gray-50 px-4 py-2 text-sm text-gray-600">
              품절된 상품 {soldOutIds.length}개는 결제에서 자동으로 제외됩니다.
            </p>
          )}

          <ul className="divide-y rounded-b-lg border bg-white">
            {items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                selected={isSelected(item.productId)}
                onToggle={() => toggleSelected(item.productId)}
                onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
                onRemove={() => handleRemove([item.productId])}
              />
            ))}
          </ul>
        </section>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <CartSummary productPrice={checkoutPrice} itemCount={checkoutItems.length} />
        </aside>
      </div>
    </div>
  );
}

// 장바구니가 비었을 때의 화면
function EmptyCart() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">장바구니</h1>
      <div className="mt-6 flex flex-col items-center rounded-lg border bg-white px-4 py-16 text-center">
        {/* 장바구니 아이콘 */}
        <svg viewBox="0 0 24 24" className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.3" />
          <circle cx="17" cy="20" r="1.3" />
        </svg>
        <p className="mt-4 text-lg font-semibold">장바구니가 비어 있어요</p>
        <p className="mt-1 text-sm text-gray-500">마음에 드는 상품을 담아보세요.</p>
        <Link href="/products" className="mt-6 rounded bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
          상품 보러 가기
        </Link>
      </div>
    </div>
  );
}
