"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FilterButton from "@/components/common/FilterButton";
import { getAdminShipments, getNextShipmentStatus, updateShipmentStatus } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { shipmentStatusLabel, shipmentSteps } from "@/lib/labels";
import type { AdminShipment } from "@/types/admin";
import type { ShipmentStatus } from "@/types/shipment";

// 다음 단계로 넘기는 버튼에 쓸 글자
const nextButtonLabel: Record<ShipmentStatus, string> = {
  PREPARING: "",
  SHIPPED: "출고 처리",
  IN_TRANSIT: "운송 시작",
  DELIVERED: "배송 완료 처리",
};

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ShipmentStatus | undefined>(undefined); // undefined = 전체
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // 필터가 바뀔 때마다 다시 불러온다 (오래된 응답은 무시)
  useEffect(() => {
    let ignore = false;
    getAdminShipments(status).then((data) => {
      if (!ignore) {
        setShipments(data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [status]);

  function handleFilter(next: ShipmentStatus | undefined) {
    if (next === status) return;
    setLoading(true);
    setStatus(next);
  }

  async function handleNext(shipmentId: number, next: ShipmentStatus) {
    setUpdatingId(shipmentId);
    setError("");
    try {
      const updated = await updateShipmentStatus(shipmentId, next);
      setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">배송 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        배송 상태는 한 단계씩 진행되며, 주문 상태와 배송 이력도 함께 바뀝니다.
      </p>

      {/* 상태 필터 */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterButton label="전체" active={status === undefined} onClick={() => handleFilter(undefined)} />
        {shipmentSteps.map((s) => (
          <FilterButton key={s} label={shipmentStatusLabel[s]} active={status === s} onClick={() => handleFilter(s)} />
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-10 text-gray-500">불러오는 중...</p>
      ) : shipments.length === 0 ? (
        <p className="mt-10 text-gray-500">해당하는 배송이 없습니다.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3">배송번호</th>
                <th className="px-4 py-3">주문번호</th>
                <th className="px-4 py-3">받는 사람</th>
                <th className="px-4 py-3">출고지</th>
                <th className="px-4 py-3">운송장</th>
                <th className="px-4 py-3">배송 상태</th>
                <th className="px-4 py-3">최근 이력</th>
                <th className="px-4 py-3">상태 변경</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((shipment) => {
                const next = getNextShipmentStatus(shipment.status);
                const cancelled = shipment.orderStatus === "CANCELLED";

                return (
                  <tr key={shipment.id}>
                    <td className="px-4 py-3">
                      <Link href={`/tracking/${shipment.id}`} className="text-blue-600 underline">
                        {shipment.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{shipment.orderId}</td>
                    <td className="px-4 py-3">
                      <p>{shipment.receiverName}</p>
                      <p className="text-xs text-gray-500">{shipment.address}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{shipment.warehouseName}</td>
                    <td className="px-4 py-3">
                      <p>{shipment.courier}</p>
                      <p className="text-xs text-gray-500">{shipment.trackingNumber ?? "미발급"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5">
                        {shipmentStatusLabel[shipment.status]}
                      </span>
                      {shipment.delayed && (
                        <span className="ml-1 whitespace-nowrap rounded bg-red-100 px-2 py-0.5 text-red-700">
                          ⚠ 지연
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {shipment.lastEvent ? (
                        <>
                          <p>{shipment.lastEvent.location}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(shipment.lastEvent.occurredAt)}</p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cancelled ? (
                        <span className="text-red-600">취소된 주문</span>
                      ) : next ? (
                        <button
                          type="button"
                          disabled={updatingId === shipment.id}
                          onClick={() => handleNext(shipment.id, next)}
                          className="whitespace-nowrap rounded border border-blue-300 px-2 py-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        >
                          {updatingId === shipment.id ? "처리 중..." : nextButtonLabel[next]}
                        </button>
                      ) : (
                        <span className="text-gray-400">완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
