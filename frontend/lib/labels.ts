// 상태값(enum 문자열)을 화면에 보여줄 한국어로 바꾸는 표

import type { ClaimStatus, ClaimType } from "@/types/claim";
import type { OrderStatus } from "@/types/order";
import type { StockStatus } from "@/types/product";
import type { ShipmentStatus } from "@/types/shipment";

export const orderStatusLabel: Record<OrderStatus, string> = {
  PAID: "결제 완료",
  PREPARING: "상품 준비중",
  SHIPPING: "배송중",
  DELIVERED: "배송 완료",
  CANCELLED: "주문 취소",
};

export const shipmentStatusLabel: Record<ShipmentStatus, string> = {
  PREPARING: "준비중",
  SHIPPED: "출고",
  IN_TRANSIT: "운송중",
  DELIVERED: "배송완료",
};

export const stockStatusLabel: Record<StockStatus, string> = {
  AVAILABLE: "구매 가능",
  LOW_STOCK: "품절 임박",
  SOLD_OUT: "품절",
};

export const claimTypeLabel: Record<ClaimType, string> = {
  CANCEL: "취소",
  RETURN: "반품",
  EXCHANGE: "교환",
};

export const claimStatusLabel: Record<ClaimStatus, string> = {
  REQUESTED: "접수",
  IN_PROGRESS: "처리중",
  COMPLETED: "완료",
  REJECTED: "거절",
};

// 배송 타임라인에 표시할 순서
export const shipmentSteps: ShipmentStatus[] = ["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED"];
