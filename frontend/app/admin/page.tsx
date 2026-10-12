"use client";

import { useEffect, useState } from "react";
import DailyOrdersChart from "@/components/admin/DailyOrdersChart";
import SummaryCard from "@/components/admin/SummaryCard";
import { getDashboardSummary } from "@/lib/api";
import type { DashboardSummary } from "@/types/admin";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getDashboardSummary().then(setSummary);
  }, []);

  if (!summary) {
    return <p className="p-8 text-gray-500">불러오는 중...</p>;
  }

  const weekTotal = summary.dailyOrders.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 요약 카드 4개 */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="전체 주문" value={summary.totalOrders} unit="건" />
        <SummaryCard label="배송중" value={summary.shippingCount} unit="건" />
        <SummaryCard label="재고 부족" value={summary.lowStockCount} unit="건" warning />
        <SummaryCard label="지연 배송" value={summary.delayedCount} unit="건" warning />
      </div>

      {/* 최근 7일 주문량 */}
      <section className="mt-8 rounded-lg border bg-white p-6">
        <h2 className="font-semibold">최근 7일 주문량</h2>
        <p className="text-sm text-gray-500">합계 {weekTotal}건</p>

        <div className="mt-8">
          <DailyOrdersChart data={summary.dailyOrders} />
        </div>

        {/* 같은 데이터를 표로도 보여준다 */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                {summary.dailyOrders.map((d) => (
                  <th key={d.date} className="py-2 font-normal">
                    {d.date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {summary.dailyOrders.map((d) => (
                  <td key={d.date} className="py-2">
                    {d.count}건
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
