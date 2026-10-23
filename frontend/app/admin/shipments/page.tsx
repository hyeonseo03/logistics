"use client";

import { useEffect, useState } from "react";
import FilterButton from "@/components/common/FilterButton";
import Pagination from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";
import { getAdminShipments, updateOrderStatus } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { adminNextStep, orderStatusLabel, shipmentStatusLabel } from "@/lib/labels";
import type { AdminShipment, Page } from "@/types/admin";
import type { OrderStatus } from "@/types/order";
import type { ShipmentStatus } from "@/types/shipment";

const statusFilters: ShipmentStatus[] = ["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RETURNING", "RETURNED", "CANCELED"];

export default function AdminShipmentsPage() {
  const [data, setData] = useState<Page<AdminShipment> | null>(null);
  const [status, setStatus] = useState<ShipmentStatus | undefined>(undefined); // undefined = 전체
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const { showToast } = useToast();

  const [reloadKey, setReloadKey] = useState(0); // 값을 바꾸면 목록을 다시 불러온다 (상태 변경 후 새로고침)

  // 필터·페이지가 바뀌거나 reloadKey 가 바뀔 때마다 불러온다 (오래된 응답은 무시)
  useEffect(() => {
    let ignore = false;
    getAdminShipments(status, page)
      .then((result) => {
        if (ignore) return;
        setData(result);
        setLoadError("");
      })
      .catch((err) => {
        if (!ignore) setLoadError(err instanceof Error ? err.message : "배송 목록을 불러오지 못했습니다.");
      });
    return () => {
      ignore = true;
    };
  }, [status, page, reloadKey]);

  function handleFilter(next: ShipmentStatus | undefined) {
    if (next === status) return;
    setData(null);
    setStatus(next);
    setPage(0);
  }

  // 배송 상태는 주문 상태를 바꾸면 함께 바뀐다 (백엔드 PATCH /api/admin/orders/{id}/status)
  async function handleNext(row: AdminShipment, next: OrderStatus) {
    const orderId = row.shipment.orderId;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, next);
      showToast(`주문 ${orderId}번을 '${orderStatusLabel[next]}'(으)로 바꿨습니다.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "상태 변경에 실패했습니다.", "error");
    } finally {
      setUpdatingId(null);
      setReloadKey((key) => key + 1);
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">배송 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        배송 상태는 한 단계씩 진행되며, 주문 상태와 배송 이력도 함께 바뀝니다. 예상 도착 시각이 지났는데 도착 전이면
        &quot;지연&quot;으로 표시됩니다.
      </p>

      {/* 상태 필터 */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterButton label="전체" active={status === undefined} onClick={() => handleFilter(undefined)} />
        {statusFilters.map((s) => (
          <FilterButton key={s} label={shipmentStatusLabel[s]} active={status === s} onClick={() => handleFilter(s)} />
        ))}
      </div>

      {loadError && <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}

      {!data ? (
        !loadError && <p className="mt-10 text-gray-500">불러오는 중...</p>
      ) : data.content.length === 0 ? (
        <p className="mt-10 text-gray-500">해당하는 배송이 없습니다.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-gray-500">총 {data.totalElements}건</p>
          <div className="mt-2 overflow-x-auto rounded border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3">주문번호</th>
                  <th className="px-4 py-3">받는 사람</th>
                  <th className="px-4 py-3">출고지</th>
                  <th className="px-4 py-3">운송장</th>
                  <th className="px-4 py-3">배송 상태</th>
                  <th className="px-4 py-3">예상 도착</th>
                  <th className="px-4 py-3">최근 이력</th>
                  <th className="px-4 py-3">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.content.map((row) => {
                  const shipment = row.shipment;
                  const next = adminNextStep[row.orderStatus];
                  return (
                    <tr key={shipment.id}>
                      <td className="px-4 py-3">{shipment.orderId}</td>
                      <td className="px-4 py-3">
                        <p>{row.receiverName}</p>
                        <p className="text-xs text-gray-500">{row.address}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{shipment.warehouseName}</td>
                      <td className="px-4 py-3">
                        <p>{shipment.courier}</p>
                        <p className="text-xs text-gray-500">{shipment.trackingNumber ?? "미발급"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5">{shipment.statusLabel}</span>
                        {row.delayed && (
                          <span className="ml-1 whitespace-nowrap rounded bg-red-100 px-2 py-0.5 text-red-700">⚠ 지연</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.estimatedArrivalAt ? formatDateTime(row.estimatedArrivalAt) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {row.lastEvent ? (
                          <>
                            <p>{row.lastEvent.location}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(row.lastEvent.occurredAt)}</p>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {next ? (
                          <button
                            type="button"
                            disabled={updatingId === shipment.orderId}
                            onClick={() => handleNext(row, next.status)}
                            className="whitespace-nowrap rounded border border-blue-300 px-2 py-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            {updatingId === shipment.orderId ? "처리 중..." : next.label}
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
