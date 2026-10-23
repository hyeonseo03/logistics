"use client";

import { useEffect, useState } from "react";
import DailyOrdersChart from "@/components/admin/DailyOrdersChart";
import SummaryCard from "@/components/admin/SummaryCard";
import { getAnalytics } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Analytics } from "@/types/admin";

// 통계 분석: 최근 14일 매출, 카테고리별 매출, 인기 상품, 물류센터별 출고, 취소·회수 비율
// (매출·판매 수량은 취소·회수완료로 환불된 주문을 뺀 값)
export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "통계를 불러오지 못했습니다."));
  }, []);

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl font-bold">통계 분석</h1>
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      </div>
    );
  }
  if (!data) return <p className="p-8 text-gray-500">불러오는 중...</p>;

  const totalSales = data.dailySales.reduce((sum, d) => sum + d.sales, 0);
  const totalCount = data.dailySales.reduce((sum, d) => sum + d.orderCount, 0);
  const percent = (value: number) => (data.totalOrders === 0 ? 0 : Math.round((value / data.totalOrders) * 100));
  const maxCategorySales = Math.max(1, ...data.categorySales.map((c) => c.sales));
  const maxWarehouse = Math.max(1, ...data.warehouses.map((w) => w.quantity));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">통계 분석</h1>
      <p className="mt-1 text-sm text-gray-500">매출과 판매 수량은 취소·회수완료(환불)된 주문을 뺀 값입니다.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="최근 14일 매출" value={totalSales} unit="원" format />
        <SummaryCard label="최근 14일 주문" value={totalCount} unit="건" />
        <SummaryCard label={`취소율 (${data.canceledOrders}건)`} value={percent(data.canceledOrders)} unit="%" />
        <SummaryCard label={`회수율 (${data.returnedOrders}건)`} value={percent(data.returnedOrders)} unit="%" />
      </div>

      <section className="mt-8 rounded-lg border bg-white p-4 sm:p-6">
        <h2 className="font-semibold">최근 14일 일별 매출</h2>
        <div className="mt-8">
          <DailyOrdersChart data={data.dailySales.map((d) => ({ date: d.date, count: d.sales }))} unit="원" />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* 카테고리별 매출: 가로 막대 */}
        <section className="rounded-lg border bg-white p-4 sm:p-6">
          <h2 className="font-semibold">카테고리별 매출</h2>
          {data.categorySales.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">판매 기록이 없습니다.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {data.categorySales.map((c) => (
                <li key={c.categoryName} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span>{c.categoryName}</span>
                    <span className="text-gray-600">
                      {formatPrice(c.sales)} · {c.quantity}개
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-gray-100">
                    <div className="h-2 rounded bg-blue-600" style={{ width: `${(c.sales / maxCategorySales) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 인기 상품 TOP 5 */}
        <section className="rounded-lg border bg-white p-4 sm:p-6">
          <h2 className="font-semibold">많이 팔린 상품 TOP 5</h2>
          {data.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">판매 기록이 없습니다.</p>
          ) : (
            <ol className="mt-4 flex flex-col divide-y text-sm">
              {data.topProducts.map((p, index) => (
                <li key={p.productId} className="flex items-center gap-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">{p.productName}</span>
                  <span className="whitespace-nowrap text-gray-600">
                    {p.quantity}개 · {formatPrice(p.sales)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* 물류센터별 출고 수량 */}
        <section className="rounded-lg border bg-white p-4 sm:p-6 lg:col-span-2">
          <h2 className="font-semibold">물류센터별 출고 수량 (주문 상품 기준)</h2>
          {data.warehouses.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">출고 기록이 없습니다.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {data.warehouses.map((w) => (
                <li key={w.warehouseName} className="text-sm">
                  <div className="flex justify-between">
                    <span>{w.warehouseName}</span>
                    <span className="text-gray-600">{w.quantity}개</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-gray-100">
                    <div className="h-2 rounded bg-green-600" style={{ width: `${(w.quantity / maxWarehouse) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
