"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatusLabel, shipmentStatusLabel } from "@/lib/labels";
import type { OrderWithDetails } from "@/types/order";

// 로그인한 회원의 주문 내역 + 배송 상태 목록
// (로그인한 상태에서만 이 컴포넌트를 보여줘야 한다)
export default function OrderList() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-gray-500">불러오는 중...</p>;
  }

  if (orders.length === 0) {
    return <p className="text-gray-500">주문 내역이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              주문 {order.id}번 · {formatDateTime(order.createdAt)}
            </p>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-sm">
              {orderStatusLabel[order.status]}
            </span>
          </div>

          <ul className="mt-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.productName} × {item.quantity}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{formatPrice(order.totalPrice)}</p>

            {order.shipment && (
              <Link
                href={`/tracking/${order.shipment.id}`}
                className="rounded border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
              >
                배송조회 ({shipmentStatusLabel[order.shipment.status]})
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
