"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/order";

// 진행 중인 배송으로 보는 주문 상태
const IN_PROGRESS: OrderStatus[] = ["ORDERED", "PACKING", "SHIPPED", "IN_TRANSIT"];
const RETURN: OrderStatus[] = ["RETURNING", "RETURNED"];

// 로그인한 회원의 배송 목록: "배송 진행 중" / "배송 완료" / "회수" 로 나눠서 보여준다 (취소된 주문은 빼고)
export default function MyShipmentList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        setOrders(data.filter((order) => order.shipment && order.status !== "CANCELED"));
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "배송 목록을 불러오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-gray-500">불러오는 중...</p>;
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>;

  const inProgress = orders.filter((order) => IN_PROGRESS.includes(order.status));
  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const returns = orders.filter((order) => RETURN.includes(order.status));

  return (
    <div className="flex flex-col gap-8">
      <Section title="배송 진행 중" orders={inProgress} emptyText="진행 중인 배송이 없습니다." />
      <Section title="배송 완료" orders={delivered} emptyText="배송 완료된 주문이 없습니다." />
      {returns.length > 0 && <Section title="회수(반품)" orders={returns} emptyText="" />}
    </div>
  );
}

function Section({ title, orders, emptyText }: { title: string; orders: Order[]; emptyText: string }) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">
        {title} ({orders.length})
      </h2>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-white">
          {orders.map((order) => {
            const shipment = order.shipment!; // 위에서 배송이 있는 주문만 골랐다
            const title =
              order.items.length > 1
                ? `${order.items[0].productName} 외 ${order.items.length - 1}건`
                : order.items[0]?.productName;

            return (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-gray-500">
                    주문 {order.id}번 · {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {shipment.courier} {shipment.trackingNumber ?? "(운송장 발급 전)"}
                  </p>
                </div>
                <Link
                  href={`/tracking/${order.id}`}
                  className="rounded border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                >
                  {shipment.statusLabel} · 상세 보기
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
