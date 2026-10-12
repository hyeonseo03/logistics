"use client";

import Link from "next/link";
import QuantitySelector from "@/components/common/QuantitySelector";
import type { CartItem } from "@/components/order/CartContext";
import ProductImage from "@/components/product/ProductImage";
import StockBadge from "@/components/product/StockBadge";
import { formatArrival, formatPrice } from "@/lib/format";
import type { ProductWithStock } from "@/types/product";

// 장바구니의 상품 한 줄
// [체크박스] [이미지] 상품명 / 옵션 / 재고 배지 · 도착 예정일 / 수량 · 가격  [삭제]
export default function CartItemRow({
  item,
  product,
  onToggle,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  product: ProductWithStock | undefined; // 서버에서 받은 최신 상품 정보 (불러오는 중이면 undefined)
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const soldOut = item.stock === 0;
  const detailHref = `/products/${item.productId}`;

  return (
    <li className="flex gap-3 p-4 sm:gap-4">
      <input
        type="checkbox"
        checked={item.selected && !soldOut}
        disabled={soldOut}
        onChange={onToggle}
        aria-label={`${item.name} 선택`}
        className="mt-1 h-4 w-4 shrink-0"
      />

      {/* 품절이면 흐리게 */}
      <div className={`flex flex-1 gap-3 sm:gap-4 ${soldOut ? "opacity-50" : ""}`}>
        <Link href={detailHref} className="w-20 shrink-0 sm:w-24">
          <ProductImage imageUrl={product?.imageUrl ?? null} name={item.name} textSize="text-xs" />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link href={detailHref} className="font-semibold hover:underline">
            {item.name}
          </Link>
          {product?.optionName && <p className="text-sm text-gray-500">옵션: {product.optionName}</p>}

          {/* 재고 상태 + 예상 도착일 */}
          {product && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <StockBadge status={product.stockStatus} quantity={product.totalStock} />
              {product.estimatedArrivalDate && (
                <span className="text-blue-700">{formatArrival(product.estimatedArrivalDate)}</span>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {soldOut ? (
              <p className="text-sm text-gray-500">품절되어 결제에서 제외됩니다</p>
            ) : (
              <QuantitySelector value={item.quantity} max={item.stock} onChange={onQuantityChange} />
            )}
            <div className="text-right">
              <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-400">개당 {formatPrice(item.price)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`${item.name} 삭제`}
        className="h-6 w-6 shrink-0 rounded text-gray-400 hover:bg-gray-100 hover:text-red-600"
      >
        ✕
      </button>
    </li>
  );
}
