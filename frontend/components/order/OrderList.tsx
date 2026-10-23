"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductImage from "@/components/product/ProductImage";
import { cancelOrder, getMyOrders } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatusColor } from "@/lib/labels";
import type { Order } from "@/types/order";

// 로그인한 회원의 주문 내역 + 취소(또는 회수 요청) 버튼
// (로그인한 상태에서만 이 컴포넌트를 보여줘야 한다)
export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ orderId: number; text: string; failed: boolean } | null>(null);

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "주문 내역을 불러오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  // 취소: 출고 전이면 즉시 취소, 출고 후면 회수 요청 (어떻게 되는지는 order.cancelInfo 가 알려준다)
  async function handleCancel(order: Order) {
    if (!window.confirm(`주문 ${order.id}번을 취소할까요?\n\n${order.cancelInfo.message}`)) return;

    setCancelingId(order.id);
    setNotice(null);
    try {
      const result = await cancelOrder(order.id);
      // 바뀐 주문으로 교체 (상태, 취소 가능 여부 등)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? result.order : o)));
      setNotice({ orderId: order.id, text: result.message, failed: false });
    } catch (err) {
      setNotice({
        orderId: order.id,
        text: err instanceof Error ? err.message : "취소하지 못했습니다.",
        failed: true,
      });
    } finally {
      setCancelingId(null);
    }
  }

  if (loading) return <p className="text-gray-500">불러오는 중...</p>;
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-500">주문 내역이 없습니다.</p>
        <Link href="/products" className="mt-3 inline-block text-sm text-blue-600 underline">
          상품 보러 가기
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              주문 {order.id}번 · {formatDateTime(order.createdAt)}
            </p>
            <span className={`rounded px-2 py-0.5 text-sm ${orderStatusColor[order.status]}`}>
              {order.statusLabel}
            </span>
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <Link href={`/products/${item.productId}`} className="w-12 shrink-0">
                  <ProductImage
                    imageUrl={item.imageUrl}
                    name={item.productName}
                    categoryName={item.categoryName}
                    size="small"
                  />
                </Link>
                <span className="min-w-0 flex-1">
                  {item.productName} × {item.quantity}
                </span>
                <span className="whitespace-nowrap text-gray-600">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className="font-semibold">
              {formatPrice(order.totalPrice)}
              {order.paymentStatus === "REFUNDED" && (
                <span className="ml-2 text-sm font-normal text-red-600">환불 완료</span>
              )}
            </p>

            <div className="flex flex-wrap gap-2">
              {order.cancelInfo.cancelable && (
                <button
                  type="button"
                  onClick={() => handleCancel(order)}
                  disabled={cancelingId === order.id}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelingId === order.id
                    ? "처리 중..."
                    : order.cancelInfo.type === "RETURN"
                      ? "취소(회수 요청)"
                      : "주문 취소"}
                </button>
              )}
              <Link
                href={`/tracking/${order.id}`}
                className="rounded border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
              >
                배송조회{order.shipment ? ` (${order.shipment.statusLabel})` : ""}
              </Link>
            </div>
          </div>

          {notice?.orderId === order.id && (
            <p className={`mt-2 text-sm ${notice.failed ? "text-red-600" : "text-green-700"}`}>{notice.text}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
