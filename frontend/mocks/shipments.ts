import type { Shipment } from "@/types/shipment";

export const shipments: Shipment[] = [
  { id: 1, orderId: 1, warehouseId: 2, courier: "CJ대한통운", trackingNumber: "501234567890", status: "DELIVERED", shippedAt: "2026-09-02T17:00:00+09:00", deliveredAt: "2026-09-03T14:20:00+09:00" },
  { id: 2, orderId: 2, warehouseId: 1, courier: "CJ대한통운", trackingNumber: "501234567891", status: "IN_TRANSIT", shippedAt: "2026-09-24T17:30:00+09:00", deliveredAt: null },
  { id: 3, orderId: 3, warehouseId: 3, courier: "한진택배", trackingNumber: "420098765432", status: "SHIPPED", shippedAt: "2026-09-26T16:00:00+09:00", deliveredAt: null },
  { id: 4, orderId: 4, warehouseId: 2, courier: "CJ대한통운", trackingNumber: null, status: "PREPARING", shippedAt: null, deliveredAt: null },
  { id: 5, orderId: 5, warehouseId: 1, courier: "CJ대한통운", trackingNumber: null, status: "PREPARING", shippedAt: null, deliveredAt: null },
  // 주문 6 은 출고 전에 취소되어 배송이 없다
  { id: 6, orderId: 7, warehouseId: 3, courier: "한진택배", trackingNumber: "420011112222", status: "DELIVERED", shippedAt: "2026-09-09T16:00:00+09:00", deliveredAt: "2026-09-11T13:30:00+09:00" },
];
