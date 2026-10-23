"use client";

import Link from "next/link";
import { useState } from "react";
import QuantitySelector from "@/components/common/QuantitySelector";
import ProductImage from "@/components/product/ProductImage";
import StockBadge from "@/components/product/StockBadge";
import { formatPrice } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import type { CartItem } from "@/types/cart";

// 장바구니의 상품 한 줄
// [체크박스] [이미지] 상품명 / 옵션 / 재고 배지 / 수량 · 가격  [삭제]
export default function CartItemRow({
  item,
  selected,
  onToggle,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  selected: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => Promise<void>; // 실패하면 에러를 던진다 (예: 재고 부족)
  onRemove: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false); // 수량 변경 요청 중
  const detailHref = `/products/${item.productId}`;

  async function handleQuantity(quantity: number) {
    setBusy(true);
    setError("");
    try {
      await onQuantityChange(quantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수량을 바꾸지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex gap-3 p-4 sm:gap-4">
      <input
        type="checkbox"
        checked={selected && !item.soldOut}
        disabled={item.soldOut}
        onChange={onToggle}
        aria-label={`${item.productName} 선택`}
        className="mt-1 h-4 w-4 shrink-0"
      />

      {/* 품절이면 흐리게 */}
      <div className={`flex flex-1 gap-3 sm:gap-4 ${item.soldOut ? "opacity-50" : ""}`}>
        <Link href={detailHref} className="w-20 shrink-0 sm:w-24">
          <ProductImage
            imageUrl={item.imageUrl}
            name={item.productName}
            categoryName={item.categoryName}
            size="small"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link href={detailHref} className="font-semibold hover:underline">
            {item.productName}
          </Link>
          {item.optionName && <p className="text-sm text-gray-500">옵션: {item.optionName}</p>}

          <div className="text-xs">
            <StockBadge status={getStockStatus(item.totalStock)} quantity={item.totalStock} />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {item.soldOut ? (
              <p className="text-sm text-gray-500">품절되어 결제에서 제외됩니다</p>
            ) : (
              <div className={busy ? "pointer-events-none opacity-60" : ""}>
                <QuantitySelector
                  value={item.quantity}
                  max={Math.min(item.totalStock, 99)}
                  onChange={handleQuantity}
                />
              </div>
            )}
            <div className="text-right">
              <p className="font-bold">{formatPrice(item.lineTotal)}</p>
              {item.quantity > 1 && <p className="text-xs text-gray-400">개당 {formatPrice(item.price)}</p>}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`${item.productName} 삭제`}
        className="h-6 w-6 shrink-0 rounded text-gray-400 hover:bg-gray-100 hover:text-red-600"
      >
        ✕
      </button>
    </li>
  );
}
