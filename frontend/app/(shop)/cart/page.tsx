"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/order/CartContext";
import CartItemRow from "@/components/order/CartItemRow";
import CartSummary from "@/components/order/CartSummary";
import { getProductsByIds } from "@/lib/api";
import type { ProductWithStock } from "@/types/product";

export default function CartPage() {
  const {
    items,
    checkoutItems,
    checkoutPrice,
    updateQuantity,
    removeItems,
    toggleSelected,
    setAllSelected,
    syncStock,
  } = useCart();
  const [products, setProducts] = useState<ProductWithStock[]>([]); // 담긴 상품들의 최신 정보
  const [stockError, setStockError] = useState(false); // 최신 재고를 못 불러왔는지 (예: 백엔드 서버가 꺼져 있음)

  // 담긴 상품 목록(id)이 바뀔 때마다 최신 재고·도착 예정일을 불러온다
  // (수량만 바뀔 때는 다시 부르지 않도록 id 들을 문자열로 묶어서 비교한다)
  const idsKey = items.map((item) => item.productId).join(",");

  useEffect(() => {
    if (idsKey === "") return;
    let ignore = false;

    getProductsByIds(idsKey.split(",").map(Number))
      .then((data) => {
        if (ignore) return;
        setProducts(data);
        setStockError(false);
        syncStock(data.map((p) => ({ productId: p.id, stock: p.totalStock })));
      })
      .catch(() => {
        if (!ignore) setStockError(true);
      });

    return () => {
      ignore = true;
    };
  }, [idsKey, syncStock]);

  // 장바구니가 비었을 때
  if (items.length === 0) {
    return <EmptyCart />;
  }

  const buyableItems = items.filter((item) => item.stock > 0); // 품절이 아닌 상품
  const soldOutIds = items.filter((item) => item.stock === 0).map((item) => item.productId);
  const selectedIds = items.filter((item) => item.selected).map((item) => item.productId);
  const allSelected = buyableItems.length > 0 && buyableItems.every((item) => item.selected);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">장바구니</h1>

      {stockError && (
        <p className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          재고 정보를 불러올 수 없습니다. 담은 상품의 재고·도착 예정일이 최신이 아닐 수 있어요.
        </p>
      )}

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
                onClick={() => removeItems(selectedIds)}
                disabled={selectedIds.length === 0}
                className="rounded border px-3 py-1 hover:bg-gray-50 disabled:text-gray-300"
              >
                선택 삭제
              </button>
              {soldOutIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => removeItems(soldOutIds)}
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
                product={products.find((p) => p.id === item.productId)}
                onToggle={() => toggleSelected(item.productId)}
                onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
                onRemove={() => removeItems([item.productId])}
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
