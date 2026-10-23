"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ShipmentTimeline from "@/components/shipment/ShipmentTimeline";
import { getTracking } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Tracking } from "@/types/shipment";

// 배송 조회: 4단계 타임라인 + 도착 예상 시각(구간별 설명) + 배송 이력
export default function ShipmentTracking({ orderId }: { orderId: number }) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTracking(orderId)
      .then((data) => {
        setTracking(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "배송 정보를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return <p className="p-8 text-gray-500">불러오는 중...</p>;
  }

  if (error || !tracking) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">배송 조회</h1>
        <p className="mt-6 text-gray-700">
          {error || `주문 ${orderId}번의 배송 정보를 찾을 수 없습니다. 주문 번호를 다시 확인해 주세요.`}
        </p>
        <Link href="/mypage/shipments" className="mt-4 inline-block text-blue-600 underline">
          내 배송 목록 보기
        </Link>
      </div>
    );
  }

  const { shipment, eta } = tracking;
  const canceledOrReturn = ["CANCELED", "RETURNING", "RETURNED"].includes(shipment.status);
  // 최신 이력이 위로 오도록 뒤집어서 보여준다
  const eventsNewestFirst = [...tracking.events].reverse();

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">배송 조회</h1>

      {/* 기본 정보 */}
      <div className="mt-4 rounded border bg-white p-4 text-sm">
        <p className="font-semibold">
          주문 {tracking.orderId}번 · {tracking.orderStatusLabel}
        </p>
        <p className="mt-1 text-gray-500">
          {shipment.courier} · 운송장 {shipment.trackingNumber ?? "출고 후 발급"} · 출고지 {shipment.warehouseName}
        </p>
        <p className="mt-1 text-gray-500">
          받는 곳: {tracking.receiverName} · {tracking.address}
        </p>
      </div>

      {/* 도착 예상 시각 */}
      {eta && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            eta.delivered ? "border-green-200 bg-green-50" : eta.delayed ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"
          }`}
        >
          <p className="text-sm text-gray-600">{eta.delivered ? "도착 완료" : "도착 예상 시각"}</p>
          <p className="mt-1 text-lg font-bold">{eta.message}</p>
          {eta.delayed && !eta.delivered && (
            <p className="mt-1 text-sm text-orange-700">예상보다 늦어지고 있어요. 조금만 기다려 주세요.</p>
          )}
          {!eta.delivered && eta.steps.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-gray-700">
              {eta.steps.map((step) => (
                <li key={step.name} className="flex justify-between gap-2">
                  <span>{step.name}</span>
                  <span className="whitespace-nowrap text-gray-500">
                    {step.minutes}분 · {formatDateTime(step.endAt)} 완료 예정
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 4단계 타임라인 (취소·회수 주문은 안내 문구) */}
      <div className="mt-8">
        {canceledOrReturn ? (
          <p className="rounded border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
            {shipment.status === "CANCELED"
              ? "취소된 주문입니다. 결제 금액은 환불되었습니다."
              : shipment.status === "RETURNING"
                ? "회수 요청이 접수되었습니다. 택배 기사님이 상품을 회수한 뒤 환불됩니다."
                : "회수가 완료되어 환불되었습니다."}
          </p>
        ) : (
          <ShipmentTimeline status={shipment.status} />
        )}
      </div>

      {/* 상세 이력 */}
      <h2 className="mt-10 font-semibold">배송 이력</h2>
      <ul className="mt-4 border-l-2 border-gray-200 pl-6">
        {eventsNewestFirst.map((event, index) => (
          <li key={event.id} className="relative mb-6">
            {/* 세로선 위의 점 (가장 최신 이력은 파란색) */}
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${index === 0 ? "bg-blue-600" : "bg-gray-300"}`}
            />
            <p className="text-sm text-gray-500">{formatDateTime(event.occurredAt)}</p>
            <p className="font-semibold">
              {event.statusLabel} · {event.location}
            </p>
            <p className="text-sm text-gray-700">{event.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
