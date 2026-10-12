import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, getShippingFee } from "@/lib/price";

// 장바구니 결제 요약 박스: 상품금액, 배송비, 총 결제금액, 주문하기 버튼
export default function CartSummary({
  productPrice,
  itemCount,
}: {
  productPrice: number; // 결제할 상품의 상품금액 합계
  itemCount: number; // 결제할 상품 종류 수
}) {
  const shippingFee = getShippingFee(productPrice);
  const totalPrice = productPrice + shippingFee;
  const untilFreeShipping = FREE_SHIPPING_THRESHOLD - productPrice;

  return (
    <div className="rounded-lg border bg-white p-5">
      <h2 className="text-lg font-semibold">결제 예정 금액</h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">상품금액</dt>
          <dd>{formatPrice(productPrice)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">배송비</dt>
          <dd>{productPrice > 0 && shippingFee === 0 ? "무료" : `+${formatPrice(shippingFee)}`}</dd>
        </div>
      </dl>

      {productPrice > 0 && untilFreeShipping > 0 && (
        <p className="mt-2 text-xs text-blue-700">
          {formatPrice(untilFreeShipping)} 더 담으면 무료배송
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="font-semibold">총 결제금액</span>
        <span className="text-2xl font-bold">{formatPrice(totalPrice)}</span>
      </div>

      {itemCount > 0 ? (
        <Link
          href="/checkout"
          className="mt-4 block rounded bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
        >
          주문하기 ({itemCount}개)
        </Link>
      ) : (
        <button type="button" disabled className="mt-4 w-full rounded bg-gray-300 py-3 font-semibold text-white">
          주문할 상품을 선택해 주세요
        </button>
      )}
    </div>
  );
}
