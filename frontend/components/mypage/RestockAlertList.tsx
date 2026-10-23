"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductImage from "@/components/product/ProductImage";
import StockBadge from "@/components/product/StockBadge";
import { deleteRestockAlert, getMyRestockAlerts } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { RestockAlert } from "@/types/product";

// 재입고 알림 신청 목록 + 알림 해제
export default function RestockAlertList() {
  const [alerts, setAlerts] = useState<RestockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null); // 해제 중인 알림
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false); // 상품 재고 정보를 못 불러왔는지 (예: 백엔드 서버가 꺼져 있음)

  useEffect(() => {
    getMyRestockAlerts()
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }, []);

  async function handleDelete(alertId: number) {
    setDeletingId(alertId);
    setError("");
    try {
      await deleteRestockAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (error) {
      setError(error instanceof Error ? error.message : "알림 해제에 실패했습니다.");
    }
    setDeletingId(null);
  }

  if (loading) return <p className="text-gray-500">불러오는 중...</p>;

  if (loadError) {
    return (
      <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
        재입고 알림 목록을 불러올 수 없습니다. 백엔드 서버가 켜져 있는지 확인해 주세요.
      </p>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-500">신청한 재입고 알림이 없습니다.</p>
        <p className="mt-1 text-sm text-gray-400">품절 상품 상세 페이지에서 알림을 신청할 수 있어요.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <ul className="divide-y rounded-lg border bg-white">
        {alerts.map((alert) => {
          const product = alert.product;
          const restocked = product.stockStatus !== "SOLD_OUT";

          return (
            <li key={alert.id} className="flex items-center gap-4 p-4">
              <Link href={`/products/${product.id}`} className="w-16 shrink-0">
                <ProductImage
                  imageUrl={product.imageUrl}
                  name={product.name}
                  categoryName={product.categoryName}
                  size="small"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/products/${product.id}`} className="font-semibold hover:underline">
                  {product.name}
                </Link>
                <p className="text-sm">{formatPrice(product.price)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <StockBadge status={product.stockStatus} quantity={product.totalStock} />
                  {restocked && <span className="font-semibold text-green-700">재입고되었어요!</span>}
                  <span className="text-gray-400">신청일 {formatDateTime(alert.createdAt)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(alert.id)}
                disabled={deletingId === alert.id}
                className="shrink-0 rounded border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {deletingId === alert.id ? "해제 중..." : "알림 해제"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
