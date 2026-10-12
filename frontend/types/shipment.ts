import type { Order, OrderItemWithProduct } from "@/types/order";

// shipments 테이블
export type ShipmentStatus = "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

export interface Shipment {
  id: number;
  orderId: number; // orders.id
  warehouseId: number; // warehouses.id (출고 물류센터)
  courier: string; // 택배사
  trackingNumber: string | null; // 출고 전에는 null
  status: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
}

// shipment_events 테이블: 배송 이력 한 줄
export interface ShipmentEvent {
  id: number;
  shipmentId: number; // shipments.id
  status: ShipmentStatus;
  location: string;
  description: string;
  occurredAt: string;
}

// 배송 조회 화면용 응답 (shipments + shipment_events + warehouses + orders 를 합친 것)
export interface ShipmentDetail extends Shipment {
  warehouseName: string;
  events: ShipmentEvent[]; // 오래된 순서
  order: Order;
  items: OrderItemWithProduct[];
}
