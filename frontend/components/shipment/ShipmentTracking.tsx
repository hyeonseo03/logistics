"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ShipmentTimeline from "@/components/shipment/ShipmentTimeline";
import { getShipment } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { shipmentStatusLabel } from "@/lib/labels";
import type { ShipmentDetail } from "@/types/shipment";

export default function ShipmentTracking({ shipmentId }: { shipmentId: number }) {
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShipment(shipmentId).then((data) => {
      setShipment(data);
      setLoading(false);
    });
  }, [shipmentId]);

  if (loading) {
    return <p className="p-8 text-gray-500">불러오는 중...</p>;
  }

  if (!shipment) {
    return (
      <div className="p-8">
        <p>배송 정보를 찾을 수 없습니다.</p>
        <Link href="/mypage/shipments" className="mt-4 inline-block text-blue-600 underline">
          배송 조회로
        </Link>
      </div>
    );
  }

  // 최신 이력이 위로 오도록 뒤집어서 보여준다
  const eventsNewestFirst = [...shipment.events].reverse();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">배송 조회</h1>

      {/* 기본 정보 */}
      <div className="mt-4 rounded border bg-white p-4 text-sm">
        <p>
          주문 {shipment.order.id}번 ·{" "}
          {shipment.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
        </p>
        <p className="mt-1 text-gray-500">
          {shipment.courier} · 운송장 {shipment.trackingNumber ?? "출고 후 발급"} · 출고지{" "}
          {shipment.warehouseName}
        </p>
        <p className="mt-1 text-gray-500">받는 곳: {shipment.order.address}</p>
      </div>

      {/* 4단계 타임라인 */}
      <div className="mt-8">
        <ShipmentTimeline status={shipment.status} />
      </div>

      {/* 상세 이력 */}
      <h2 className="mt-10 font-semibold">배송 이력</h2>
      <ul className="mt-4 border-l-2 border-gray-200 pl-6">
        {eventsNewestFirst.map((event, index) => (
          <li key={event.id} className="relative mb-6">
            {/* 세로선 위의 점 (가장 최신 이력은 파란색) */}
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${
                index === 0 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <p className="text-sm text-gray-500">{formatDateTime(event.occurredAt)}</p>
            <p className="font-semibold">
              {shipmentStatusLabel[event.status]} · {event.location}
            </p>
            <p className="text-sm text-gray-700">{event.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
