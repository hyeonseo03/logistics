import type { OrderStatus } from "@/types/order";

// shipments 테이블의 배송 상태 (백엔드 ShipmentStatus enum 과 같다)
// PREPARING(상품준비) → SHIPPED(출고) → IN_TRANSIT(배송중) → DELIVERED(배송완료)
// 취소·회수: CANCELED(취소) / RETURNING(회수중) → RETURNED(회수완료)
export type ShipmentStatus =
  | "PREPARING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELED"
  | "RETURNING"
  | "RETURNED";

// 배송 1건 (백엔드 ShipmentResponse)
export interface Shipment {
  id: number;
  orderId: number; // orders.id
  warehouseId: number; // 출고 물류센터
  warehouseName: string;
  courier: string; // 택배사
  trackingNumber: string | null; // 출고 전에는 null
  status: ShipmentStatus;
  statusLabel: string;
  shippedAt: string | null;
  inTransitAt: string | null;
  deliveredAt: string | null;
}

// shipment_events 테이블: 배송 이력 한 줄
export interface ShipmentEvent {
  id: number;
  shipmentId: number; // shipments.id
  status: ShipmentStatus;
  statusLabel: string;
  location: string;
  message: string;
  occurredAt: string;
}

// 도착 예상 시각 계산의 한 구간 (예: "고속도로 이동 62분")
export interface EtaStep {
  name: string;
  minutes: number;
  startAt: string;
  endAt: string;
}

// 도착 예상 시각 (백엔드 EtaResult)
export interface Eta {
  estimatedArrivalAt: string; // 예상 도착 시각 (배송완료면 실제 도착 시각)
  delivered: boolean;
  delayed: boolean; // 예상 시각이 지났는데 아직 도착 전
  steps: EtaStep[]; // 남은 구간별 소요 시간
  method: string; // 계산 방식 (예: "RULE_BASED")
  message: string; // 예: "10월 23일 15시 02분쯤 도착할 예정이에요."
}

// GET /api/orders/{id}/tracking 응답: 배송 조회 화면
export interface Tracking {
  orderId: number;
  orderStatus: OrderStatus;
  orderStatusLabel: string;
  receiverName: string;
  address: string;
  shipment: Shipment;
  events: ShipmentEvent[]; // 오래된 순서
  eta: Eta | null; // 취소·회수 주문이면 null
}
