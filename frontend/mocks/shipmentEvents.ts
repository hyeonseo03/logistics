import type { ShipmentEvent } from "@/types/shipment";

// shipment_events 테이블: 배송 1건마다 여러 줄의 이력이 쌓인다
export const shipmentEvents: ShipmentEvent[] = [
  // 배송 1: 배송 완료
  { id: 1, shipmentId: 1, status: "PREPARING", location: "경기 물류센터", description: "상품을 준비하고 있습니다.", occurredAt: "2026-09-02T10:00:00+09:00" },
  { id: 2, shipmentId: 1, status: "SHIPPED", location: "경기 물류센터", description: "상품이 출고되었습니다.", occurredAt: "2026-09-02T17:00:00+09:00" },
  { id: 3, shipmentId: 1, status: "IN_TRANSIT", location: "대전 허브터미널", description: "간선 이동 중입니다.", occurredAt: "2026-09-03T02:00:00+09:00" },
  { id: 4, shipmentId: 1, status: "IN_TRANSIT", location: "서울 강남 대리점", description: "배송 기사가 배송을 시작했습니다.", occurredAt: "2026-09-03T09:00:00+09:00" },
  { id: 5, shipmentId: 1, status: "DELIVERED", location: "서울 강남구", description: "배송이 완료되었습니다.", occurredAt: "2026-09-03T14:20:00+09:00" },
  // 배송 2: 이동 중
  { id: 6, shipmentId: 2, status: "PREPARING", location: "서울 물류센터", description: "상품을 준비하고 있습니다.", occurredAt: "2026-09-24T12:00:00+09:00" },
  { id: 7, shipmentId: 2, status: "SHIPPED", location: "서울 물류센터", description: "상품이 출고되었습니다.", occurredAt: "2026-09-24T17:30:00+09:00" },
  { id: 8, shipmentId: 2, status: "IN_TRANSIT", location: "옥천 허브터미널", description: "간선 이동 중입니다.", occurredAt: "2026-09-25T01:10:00+09:00" },
  // 배송 3: 출고 완료
  { id: 9, shipmentId: 3, status: "PREPARING", location: "부산 물류센터", description: "상품을 준비하고 있습니다.", occurredAt: "2026-09-26T09:00:00+09:00" },
  { id: 10, shipmentId: 3, status: "SHIPPED", location: "부산 물류센터", description: "상품이 출고되었습니다.", occurredAt: "2026-09-26T16:00:00+09:00" },
  // 배송 4, 5: 상품 준비 중
  { id: 11, shipmentId: 4, status: "PREPARING", location: "경기 물류센터", description: "상품을 준비하고 있습니다.", occurredAt: "2026-09-28T11:00:00+09:00" },
  { id: 12, shipmentId: 5, status: "PREPARING", location: "서울 물류센터", description: "상품을 준비하고 있습니다.", occurredAt: "2026-09-29T09:00:00+09:00" },
  // 배송 6: 배송 완료 (부산 → 서울)
  { id: 13, shipmentId: 6, status: "PREPARING", location: "부산 물류센터", description: "상품을 준비하고 있습니다.", occurredAt: "2026-09-09T09:00:00+09:00" },
  { id: 14, shipmentId: 6, status: "SHIPPED", location: "부산 물류센터", description: "상품이 출고되었습니다.", occurredAt: "2026-09-09T16:00:00+09:00" },
  { id: 15, shipmentId: 6, status: "IN_TRANSIT", location: "대전 허브터미널", description: "간선 이동 중입니다.", occurredAt: "2026-09-10T03:00:00+09:00" },
  { id: 16, shipmentId: 6, status: "DELIVERED", location: "서울 중구", description: "배송이 완료되었습니다.", occurredAt: "2026-09-11T13:30:00+09:00" },
];
