import type { RestockAlert } from "@/types/product";

// 재입고 알림 신청 목록 (정현서가 품절 상품 2개에 신청해 둔 상태)
export const restockAlerts: RestockAlert[] = [
  { id: 1, userId: 1, productId: 9, createdAt: "2026-09-21T20:00:00+09:00" },
  { id: 2, userId: 1, productId: 6, createdAt: "2026-09-26T13:10:00+09:00" },
];
