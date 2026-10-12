"use client";

import { useEffect, useState } from "react";
import { getMyClaims } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import { claimStatusLabel, claimTypeLabel } from "@/lib/labels";
import type { ClaimStatus, ClaimType, ClaimWithOrder } from "@/types/claim";

// 진행 상태별 배지 색
const statusColor: Record<ClaimStatus, string> = {
  REQUESTED: "bg-orange-100 text-orange-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-700",
};

// 취소 / 반품·교환 내역 목록
// types 로 어떤 종류를 보여줄지 정한다 (예: ["CANCEL"] 또는 ["RETURN", "EXCHANGE"])
export default function ClaimList({ types, emptyText }: { types: ClaimType[]; emptyText: string }) {
  const [claims, setClaims] = useState<ClaimWithOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // 배열은 매번 새로 만들어지므로 문자열로 바꿔서 비교한다
  const typesKey = types.join(",");

  useEffect(() => {
    getMyClaims(typesKey.split(",") as ClaimType[]).then((data) => {
      setClaims(data);
      setLoading(false);
    });
  }, [typesKey]);

  if (loading) return <p className="text-gray-500">불러오는 중...</p>;
  if (claims.length === 0) return <p className="text-gray-500">{emptyText}</p>;

  return (
    <ul className="flex flex-col gap-4">
      {claims.map((claim) => (
        <li key={claim.id} className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {claimTypeLabel[claim.type]} 신청 · {formatDateTime(claim.createdAt)}
            </p>
            <span className={`rounded px-2 py-0.5 text-sm ${statusColor[claim.status]}`}>
              {claimTypeLabel[claim.type]} {claimStatusLabel[claim.status]}
            </span>
          </div>

          <ul className="mt-2 text-sm">
            {claim.items.map((item) => (
              <li key={item.id}>
                {item.productName} × {item.quantity}
              </li>
            ))}
          </ul>

          <dl className="mt-3 grid grid-cols-[72px_1fr] gap-y-1 text-sm">
            <dt className="text-gray-500">주문 번호</dt>
            <dd>
              {claim.order.id}번 ({formatPrice(claim.order.totalPrice)})
            </dd>
            <dt className="text-gray-500">사유</dt>
            <dd>{claim.reason}</dd>
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
