// 상태값(enum 문자열)을 화면에 보여줄 한국어·색으로 바꾸는 표

import type { ClaimType } from "@/types/claim";
import type { OrderStatus } from "@/types/order";
import type { StockStatus } from "@/types/product";
import type { ShipmentStatus } from "@/types/shipment";

// 백엔드 OrderStatus 의 label 과 같다
export const orderStatusLabel: Record<OrderStatus, string> = {
  ORDERED: "주문완료",
  PACKING: "포장",
  SHIPPED: "출고",
  IN_TRANSIT: "배송중",
  DELIVERED: "배송완료",
  CANCELED: "취소",
  RETURNING: "회수중",
  RETURNED: "회수완료",
};

// 주문 상태 배지 색
export const orderStatusColor: Record<OrderStatus, string> = {
  ORDERED: "bg-gray-100 text-gray-700",
  PACKING: "bg-yellow-100 text-yellow-800",
  SHIPPED: "bg-blue-100 text-blue-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELED: "bg-red-100 text-red-700",
  RETURNING: "bg-orange-100 text-orange-700",
  RETURNED: "bg-gray-200 text-gray-600",
};

// 화면에 보여줄 주문 상태 순서 (필터 버튼 등)
export const orderStatuses: OrderStatus[] = [
  "ORDERED",
  "PACKING",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELED",
  "RETURNING",
  "RETURNED",
];

// 백엔드 ShipmentStatus 의 label 과 같다
export const shipmentStatusLabel: Record<ShipmentStatus, string> = {
  PREPARING: "상품준비",
  SHIPPED: "출고",
  IN_TRANSIT: "배송중",
  DELIVERED: "배송완료",
  CANCELED: "취소",
  RETURNING: "회수중",
  RETURNED: "회수완료",
};

export const stockStatusLabel: Record<StockStatus, string> = {
  AVAILABLE: "구매 가능",
  LOW_STOCK: "품절 임박",
  SOLD_OUT: "품절",
};

export const claimTypeLabel: Record<ClaimType, string> = {
  CANCEL: "취소",
  RETURN: "회수(반품)",
};

// 배송 타임라인에 표시할 순서 (취소·회수는 타임라인 대신 안내 문구로 보여준다)
export const shipmentSteps: ShipmentStatus[] = ["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED"];

// 관리자가 누르는 "다음 단계" 버튼: 현재 주문 상태 → 바꿀 상태와 버튼 글자
// (취소·회수 요청은 고객만 할 수 있어서 관리자 버튼에는 없다. 백엔드 AdminOrderService 와 같은 규칙)
export const adminNextStep: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  ORDERED: { status: "PACKING", label: "포장 시작" },
  PACKING: { status: "SHIPPED", label: "출고 처리" },
  SHIPPED: { status: "IN_TRANSIT", label: "배송 시작" },
  IN_TRANSIT: { status: "DELIVERED", label: "배송 완료" },
  RETURNING: { status: "RETURNED", label: "회수 완료" },
};
