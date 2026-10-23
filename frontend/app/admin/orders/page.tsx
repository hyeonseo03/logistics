"use client";

import { useEffect, useState } from "react";
import FilterButton from "@/components/common/FilterButton";
import Pagination from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";
import { getAdminOrders, updateOrderStatus } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import { adminNextStep, orderStatusColor, orderStatusLabel, orderStatuses } from "@/lib/labels";
import type { Page } from "@/types/admin";
import type { Order, OrderStatus } from "@/types/order";

export default function AdminOrdersPage() {
  const [data, setData] = useState<Page<Order> | null>(null);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined); // undefined = 전체
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null); // 상태를 바꾸는 중인 주문
  const [loadError, setLoadError] = useState("");
  const { showToast } = useToast();

    const [reloadKey, setReloadKey] = useState(0); // 값을 바꾸면 목록을 다시 불러온다 (상태 변경 후 새로고침)

  // 필터·페이지가 바뀌거나 reloadKey 가 바뀔 때마다 불러온다 (오래된 응답은 무시)
  useEffect(() => {
    let ignore = false;
    getAdminOrders(status, page)
      .then((result) => {
        if (ignore) return;
        setData(result);
        setLoadError("");
      })
      .catch((err) => {
        if (!ignore) setLoadError(err instanceof Error ? err.message : "주문 목록을 불러오지 못했습니다.");
      });
    return () => {
      ignore = true;
    };
  }, [status, page, reloadKey]);

  function handleFilter(next: OrderStatus | undefined) {
    if (next === status) return;
    setData(null);
    setStatus(next);
    setPage(0);
  }

  async function handleChange(order: Order, next: OrderStatus) {
    const label = orderStatusLabel[next];
    if (next === "RETURNED" && !window.confirm(`주문 ${order.id}번 상품이 센터에 돌아왔나요?\n회수 완료하면 재고가 복구되고 환불됩니다.`)) {
      return;
    }

    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, next);
      showToast(`주문 ${order.id}번을 '${label}'(으)로 바꿨습니다.`);
    } catch (err) {
      // 예: 고객이 방금 취소해서 상태가 바뀐 경우 (409)
      showToast(err instanceof Error ? err.message : "상태 변경에 실패했습니다.", "error");
    } finally {
      setUpdatingId(null);
      setReloadKey((key) => key + 1); // 성공·실패 모두 최신 목록으로 새로고침
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">주문 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        포장 → 출고 → 배송중 → 배송완료 순서로 한 단계씩 진행합니다. 출고하면 재고가 차감되고, 회수 완료하면 재고가
        복구됩니다. 취소·회수 요청은 고객만 할 수 있습니다.
      </p>

      {/* 상태 필터 */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterButton label="전체" active={status === undefined} onClick={() => handleFilter(undefined)} />
        {orderStatuses.map((s) => (
          <FilterButton key={s} label={orderStatusLabel[s]} active={status === s} onClick={() => handleFilter(s)} />
        ))}
      </div>

      {loadError && <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}

      {!data ? (
        !loadError && <p className="mt-10 text-gray-500">불러오는 중...</p>
      ) : data.content.length === 0 ? (
        <p className="mt-10 text-gray-500">해당하는 주문이 없습니다.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-gray-500">총 {data.totalElements}건</p>
          <div className="mt-2 overflow-x-auto rounded border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3">주문번호</th>
                  <th className="px-4 py-3">주문일시</th>
                  <th className="px-4 py-3">주문자</th>
                  <th className="px-4 py-3">상품 (출고 센터)</th>
                  <th className="px-4 py-3 text-right">금액</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.content.map((order) => {
                  const next = adminNextStep[order.status];
                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-3">{order.id}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDateTime(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p>{order.userName}</p>
                        <p className="text-xs text-gray-500">{order.receiverName} · {order.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        {order.items.map((item) => (
                          <p key={item.id}>
                            {item.productName} × {item.quantity}{" "}
                            <span className="text-xs text-gray-500">({item.warehouseName})</span>
                          </p>
                        ))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {formatPrice(order.totalPrice)}
                        {order.paymentStatus === "REFUNDED" && <p className="text-xs text-red-600">환불됨</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`whitespace-nowrap rounded px-2 py-0.5 ${orderStatusColor[order.status]}`}>
                          {order.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {next ? (
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => handleChange(order, next.status)}
                            className={`whitespace-nowrap rounded border px-2 py-1 disabled:opacity-50 ${
                              next.status === "RETURNED"
                                ? "border-orange-300 text-orange-700 hover:bg-orange-50"
                                : "border-blue-300 text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {updatingId === order.id ? "처리 중..." : next.label}
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
