import type { Order } from "@/types/order";

// 취소·회수 내역 (백엔드 GET /api/users/me/claims 응답)
// CANCEL: 출고 전 즉시 취소 / RETURN: 출고 후 회수(반품)
export type ClaimType = "CANCEL" | "RETURN";

// IN_PROGRESS: 회수중 / COMPLETED: 취소 완료·회수 완료
export type ClaimStatus = "IN_PROGRESS" | "COMPLETED";

export interface Claim {
  orderId: number;
  type: ClaimType;
  status: ClaimStatus;
  statusLabel: string; // 예: "회수중"
  reason: string | null;
  requestedAt: string | null;
  completedAt: string | null; // 진행 중이면 null
  order: Order;
}
