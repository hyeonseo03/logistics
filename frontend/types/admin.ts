// 관리자 화면용 응답 타입들 (여러 테이블을 합친 결과)

import type { OrderWithDetails } from "@/types/order";
import type { OrderStatus } from "@/types/order";
import type { Shipment, ShipmentEvent } from "@/types/shipment";
import type { Warehouse } from "@/types/warehouse";

// 하루치 주문 수 (대시보드 차트용)
export interface DailyOrderCount {
  date: string; // "2026-09-29"
  count: number;
}

// 관리자 대시보드 (나중에 GET /api/admin/dashboard)
export interface DashboardSummary {
  totalOrders: number; // 전체 주문 수
  shippingCount: number; // 배송중(출고 + 운송중) 건수
  lowStockCount: number | null; // 재고 부족 (물류센터별 재고 행 기준). 재고 정보를 불러오지 못하면 null
  delayedCount: number; // 지연 배송 건수
  dailyOrders: DailyOrderCount[]; // 최근 7일 (오래된 날짜부터)
}

// 관리자 주문 목록 한 줄 = 주문 상세 + 주문자 이름
export interface AdminOrder extends OrderWithDetails {
  userName: string;
}

// 재고 현황 표의 칸 하나 (상품 1개 × 물류센터 1개)
export interface InventoryCell {
  warehouseId: number;
  quantity: number | null; // 이 센터에서 취급하지 않는 상품이면 null
  lowStock: boolean; // 재고 부족 여부
}

// 재고 현황 표의 한 줄 (상품 1개)
export interface InventoryRow {
  productId: number;
  productName: string;
  categoryName: string;
  cells: InventoryCell[]; // warehouses 순서와 같다
  totalQuantity: number;
}

// 재고 현황 표 전체 (GET /api/products + /api/warehouses + /api/inventories 를 합친 것)
export interface InventoryTable {
  warehouses: Warehouse[];
  rows: InventoryRow[];
  lowStockThreshold: number; // 이 수량 미만이면 재고 부족
}

// 관리자 배송 목록 한 줄
export interface AdminShipment extends Shipment {
  warehouseName: string;
  orderStatus: OrderStatus;
  receiverName: string;
  address: string;
  lastEvent: ShipmentEvent | null; // 가장 최근 배송 이력
  delayed: boolean; // 지연 배송 여부
}
