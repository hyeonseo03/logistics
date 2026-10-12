import { stockStatusLabel } from "@/lib/labels";
import type { StockStatus } from "@/types/product";

// 재고 상태별 배지 색
const badgeColor: Record<StockStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  LOW_STOCK: "bg-orange-100 text-orange-700",
  SOLD_OUT: "bg-gray-200 text-gray-600",
};

// 재고 상태 배지: "구매 가능" / "품절 임박 · N개 남음" / "품절"
export default function StockBadge({
  status,
  quantity,
}: {
  status: StockStatus;
  quantity: number; // 판매가능재고
}) {
  const text =
    status === "LOW_STOCK" ? `${stockStatusLabel[status]} · ${quantity}개 남음` : stockStatusLabel[status];

  return <span className={`rounded px-2 py-0.5 font-medium ${badgeColor[status]}`}>{text}</span>;
}
