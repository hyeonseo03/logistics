"use client";

import { useEffect, useState } from "react";
import FilterButton from "@/components/common/FilterButton";
import { getAdminOrders, orderStatusChanges, updateOrderStatus } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatusLabel, shipmentStatusLabel } from "@/lib/labels";
import type { AdminOrder } from "@/types/admin";
import type { OrderStatus } from "@/types/order";

const statusFilters: OrderStatus[] = ["PAID", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED"];

// 상태 변경 버튼에 쓸 글자
const changeButtonLabel: Partial<Record<OrderStatus, string>> = {
  PREPARING: "상품 준비 시작",
  CANCELLED: "주문 취소",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined); // undefined = 전체
  const [updatingId, setUpdatingId] = useState<number | null>(null); // 상태를 바꾸는 중인 주문
  const [error, setError] = useState("");

  // 필터가 바뀔 때마다 다시 불러온다 (오래된 응답은 무시)
  useEffect(() => {
    let ignore = false;
    getAdminOrders(status).then((data) => {
      if (!ignore) {
        setOrders(data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [status]);

  function handleFilter(next: OrderStatus | undefined) {
    if (next === status) return;
    setLoading(true);
    setStatus(next);
  }

  async function handleChange(orderId: number, next: OrderStatus) {
    if (next === "CANCELLED" && !window.confirm(`주문 ${orderId}번을 취소할까요?`)) return;

    setUpdatingId(orderId);
    setError("");
    try {
      const updated = await updateOrderStatus(orderId, next);
      // 목록에서 바뀐 주문의 상태만 교체한다
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">주문 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        배송중 / 배송 완료 상태는 배송 관리에서 배송 상태를 바꾸면 자동으로 바뀝니다.
      </p>

      {/* 상태 필터 */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterButton label="전체" active={status === undefined} onClick={() => handleFilter(undefined)} />
        {statusFilters.map((s) => (
          <FilterButton key={s} label={orderStatusLabel[s]} active={status === s} onClick={() => handleFilter(s)} />
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-10 text-gray-500">불러오는 중...</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-gray-500">해당하는 주문이 없습니다.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3">주문번호</th>
                <th className="px-4 py-3">주문일시</th>
                <th className="px-4 py-3">주문자</th>
                <th className="px-4 py-3">상품</th>
                <th className="px-4 py-3 text-right">금액</th>
                <th className="px-4 py-3">주문 상태</th>
                <th className="px-4 py-3">배송 상태</th>
                <th className="px-4 py-3">상태 변경</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">{order.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">{order.userName}</td>
                  <td className="px-4 py-3">
                    {order.items.map((item) => (
                      <p key={item.id}>
                        {item.productName} × {item.quantity}
                      </p>
                    ))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPrice(order.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded px-2 py-0.5 ${
                        order.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-gray-100"
                      }`}
                    >
                      {orderStatusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.shipment ? shipmentStatusLabel[order.shipment.status] : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {orderStatusChanges[order.status].map((next) => (
                        <button
                          key={next}
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleChange(order.id, next)}
                          className={`whitespace-nowrap rounded border px-2 py-1 disabled:opacity-50 ${
                            next === "CANCELLED"
                              ? "border-red-300 text-red-600 hover:bg-red-50"
                              : "border-blue-300 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {changeButtonLabel[next]}
                        </button>
                      ))}
                      {orderStatusChanges[order.status].length === 0 && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
