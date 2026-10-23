"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DailyOrdersChart from "@/components/admin/DailyOrdersChart";
import SummaryCard from "@/components/admin/SummaryCard";
import { getDashboardSummary } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { orderStatusColor, orderStatusLabel, orderStatuses } from "@/lib/labels";
import { getAvailableQuantity } from "@/lib/stock";
import type { DashboardSummary } from "@/types/admin";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "대시보드를 불러오지 못했습니다."));
  }, []);

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return <p className="p-8 text-gray-500">불러오는 중...</p>;
  }

  const weekTotal = summary.dailyOrders.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 요약 카드 */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard label="오늘 주문" value={summary.todayOrderCount} unit="건" />
        <SummaryCard label="오늘 매출" value={summary.todaySales} unit="원" format />
        <SummaryCard label="배송중" value={summary.shippingCount} unit="건" />
        <SummaryCard label="품절 임박 재고" value={summary.lowStockCount} unit="건" warning />
        <SummaryCard label="지연 배송" value={summary.delayedCount} unit="건" warning />
      </div>

      {/* 상태별 주문 수 */}
      <section className="mt-8 rounded-lg border bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">상태별 주문 (전체 {summary.totalOrders}건)</h2>
          <Link href="/admin/orders" className="text-sm text-blue-600 underline">
            주문 관리로
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {orderStatuses.map((status) => (
            <li key={status} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span className={`rounded px-2 py-0.5 ${orderStatusColor[status]}`}>{orderStatusLabel[status]}</span>
              <span className="font-bold">{summary.statusCounts[status] ?? 0}건</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* 최근 7일 주문량 */}
        <section className="rounded-lg border bg-white p-4 sm:p-6">
          <h2 className="font-semibold">최근 7일 주문량</h2>
          <p className="text-sm text-gray-500">합계 {weekTotal}건</p>
          <div className="mt-8">
            <DailyOrdersChart data={summary.dailyOrders} />
          </div>
        </section>

        {/* 품절 임박 재고 */}
        <section className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">품절 임박 재고 (판매가능 {summary.lowStockThreshold}개 미만)</h2>
            <Link href="/admin/inventory" className="text-sm text-blue-600 underline">
              재고 조정하기
            </Link>
          </div>
          {summary.lowStockItems.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">품절 임박 재고가 없습니다.</p>
          ) : (
            <div className="mt-4 max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500">
                  <tr className="border-b">
                    <th className="py-2 text-left font-normal">상품</th>
                    <th className="py-2 text-left font-normal">센터</th>
                    <th className="py-2 text-right font-normal">판매가능</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summary.lowStockItems.map((item) => {
                    const available = getAvailableQuantity(item.quantity, item.reservedQuantity);
                    return (
                      <tr key={item.id}>
                        <td className="py-2">{item.productName}</td>
                        <td className="py-2 text-gray-500">{item.warehouseName}</td>
                        <td className={`py-2 text-right font-semibold ${available === 0 ? "text-red-600" : "text-orange-600"}`}>
                          {available === 0 ? "품절" : `${available}개`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <p className="mt-6 text-xs text-gray-400">오늘 매출: {formatPrice(summary.todaySales)} (취소·회수완료 주문 제외)</p>
    </div>
  );
}
