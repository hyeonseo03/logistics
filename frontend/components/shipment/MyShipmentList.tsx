"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { shipmentStatusLabel } from "@/lib/labels";
import type { OrderWithDetails } from "@/types/order";

// 로그인한 회원의 배송 목록: "배송 진행 중" 과 "배송 완료" 로 나눠서 보여준다
export default function MyShipmentList() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders().then((data) => {
      // 배송이 만들어졌고 취소되지 않은 주문만
      setOrders(data.filter((order) => order.shipment && order.status !== "CANCELLED"));
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">불러오는 중...</p>;

  const inProgress = orders.filter((order) => order.shipment?.status !== "DELIVERED");
  const delivered = orders.filter((order) => order.shipment?.status === "DELIVERED");

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 font-semibold">배송 진행 중 ({inProgress.length})</h2>
        {inProgress.length === 0 ? (
          <p className="text-sm text-gray-500">진행 중인 배송이 없습니다.</p>
        ) : (
          <ShipmentRows orders={inProgress} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">배송 완료 ({delivered.length})</h2>
        {delivered.length === 0 ? (
          <p className="text-sm text-gray-500">배송 완료된 주문이 없습니다.</p>
        ) : (
          <ShipmentRows orders={delivered} />
        )}
      </section>
    </div>
  );
}

function ShipmentRows({ orders }: { orders: OrderWithDetails[] }) {
  return (
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
              href={`/tracking/${shipment.id}`}
              className="rounded border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
            >
              {shipmentStatusLabel[shipment.status]} · 상세 보기
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
