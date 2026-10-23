"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyClaims } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import { claimTypeLabel } from "@/lib/labels";
import type { Claim, ClaimStatus, ClaimType } from "@/types/claim";

// 진행 상태별 배지 색
const statusColor: Record<ClaimStatus, string> = {
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-gray-100 text-gray-600",
};

// 취소 내역 / 회수(반품) 내역 목록
export default function ClaimList({ type, emptyText }: { type: ClaimType; emptyText: string }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyClaims(type)
      .then((data) => {
        setClaims(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "내역을 불러오지 못했습니다.");
        setLoading(false);
      });
  }, [type]);

  if (loading) return <p className="text-gray-500">불러오는 중...</p>;
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>;
  if (claims.length === 0) return <p className="rounded-lg border bg-white p-6 text-center text-gray-500">{emptyText}</p>;

  return (
    <ul className="flex flex-col gap-4">
      {claims.map((claim) => (
        <li key={claim.orderId} className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {claimTypeLabel[claim.type]} 신청
              {claim.requestedAt && ` · ${formatDateTime(claim.requestedAt)}`}
            </p>
            <span className={`rounded px-2 py-0.5 text-sm ${statusColor[claim.status]}`}>{claim.statusLabel}</span>
          </div>

          <ul className="mt-2 text-sm">
            {claim.order.items.map((item) => (
              <li key={item.id}>
                {item.productName} × {item.quantity}
              </li>
            ))}
          </ul>

          <dl className="mt-3 grid grid-cols-[72px_1fr] gap-y-1 text-sm">
            <dt className="text-gray-500">주문 번호</dt>
            <dd>
              <Link href={`/tracking/${claim.orderId}`} className="text-blue-600 underline">
                {claim.orderId}번
              </Link>{" "}
              ({formatPrice(claim.order.totalPrice)})
            </dd>
            <dt className="text-gray-500">사유</dt>
            <dd>{claim.reason ?? "-"}</dd>
            <dt className="text-gray-500">환불</dt>
            <dd>{claim.order.paymentStatus === "REFUNDED" ? "환불 완료" : "회수 완료 후 환불"}</dd>
            {claim.completedAt && (
              <>
                <dt className="text-gray-500">완료일</dt>
                <dd>{formatDateTime(claim.completedAt)}</dd>
              </>
            )}
          </dl>
        </li>
      ))}
    </ul>
  );
}
