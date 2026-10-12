import type { Order, OrderItemWithProduct } from "@/types/order";

// order_claims 테이블: 주문 취소 / 반품 / 교환 신청
export type ClaimType = "CANCEL" | "RETURN" | "EXCHANGE";

// REQUESTED: 접수 / IN_PROGRESS: 처리중(회수중 등) / COMPLETED: 완료 / REJECTED: 거절
export type ClaimStatus = "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export interface OrderClaim {
  id: number;
  orderId: number; // orders.id
  userId: number; // users.id
  type: ClaimType;
  status: ClaimStatus;
  reason: string;
  createdAt: string;
  completedAt: string | null; // 끝나지 않았으면 null
}

// 취소·반품·교환 내역 화면용 (order_claims + orders + order_items)
export interface ClaimWithOrder extends OrderClaim {
  order: Order;
  items: OrderItemWithProduct[];
}
