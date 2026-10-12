import type { OrderClaim } from "@/types/claim";

// 정현서(userId 1)의 취소/반품/교환 신청
// 진행 중(접수·처리중): 2건 (id 2, 3)
export const orderClaims: OrderClaim[] = [
  { id: 1, orderId: 6, userId: 1, type: "CANCEL", status: "COMPLETED", reason: "단순 변심", createdAt: "2026-09-20T10:30:00+09:00", completedAt: "2026-09-20T11:00:00+09:00" },
  { id: 2, orderId: 5, userId: 1, type: "CANCEL", status: "REQUESTED", reason: "다른 옵션으로 다시 주문", createdAt: "2026-09-29T08:50:00+09:00", completedAt: null },
  { id: 3, orderId: 1, userId: 1, type: "RETURN", status: "IN_PROGRESS", reason: "포장 파손", createdAt: "2026-09-27T14:00:00+09:00", completedAt: null },
  { id: 4, orderId: 7, userId: 1, type: "EXCHANGE", status: "COMPLETED", reason: "사이즈 교환 (L → XL)", createdAt: "2026-09-12T09:00:00+09:00", completedAt: "2026-09-16T15:00:00+09:00" },
];
