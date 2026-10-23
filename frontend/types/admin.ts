// 관리자 화면용 응답 타입들 (백엔드 /api/admin/** 응답과 같은 모양)

import type { OrderStatus } from "@/types/order";
import type { Shipment, ShipmentEvent } from "@/types/shipment";
import type { UserRole } from "@/types/user";
import type { InventoryResponse, Warehouse } from "@/types/warehouse";

// 페이지 단위로 나눠 받는 목록 (백엔드 PageResponse)
export interface Page<T> {
  content: T[];
  page: number; // 현재 페이지 (0부터)
  size: number;
  totalElements: number;
  totalPages: number;
}

// 하루치 주문 수 (대시보드 차트용)
export interface DailyOrderCount {
  date: string; // "2026-10-23"
  count: number;
}

// GET /api/admin/dashboard
export interface DashboardSummary {
  todayOrderCount: number;
  todaySales: number; // 오늘 매출 (취소·회수완료 제외)
  statusCounts: Record<OrderStatus, number>; // 상태별 주문 수 (0건인 상태도 포함)
  lowStockItems: InventoryResponse[]; // 판매가능재고가 기준 미만인 센터별 재고
  lowStockThreshold: number;
  dailyOrders: DailyOrderCount[]; // 최근 7일 (오래된 날짜부터)
  totalOrders: number;
  shippingCount: number; // 출고 + 배송중
  lowStockCount: number;
  delayedCount: number; // 주문 후 3일이 지났는데 아직 배송완료 전
}

// GET /api/admin/shipments 한 줄
export interface AdminShipment {
  shipment: Shipment;
  orderStatus: OrderStatus;
  receiverName: string;
  address: string;
  lastEvent: ShipmentEvent | null; // 가장 최근 배송 이력
  estimatedArrivalAt: string | null; // 예상 도착 시각 (취소·회수면 null)
  delayed: boolean;
}

// GET /api/admin/users 한 줄
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  orderCount: number;
}

// 재고 현황 표의 칸 하나 (상품 1개 × 물류센터 1개)
export interface InventoryCell {
  warehouseId: number;
  quantity: number | null; // 현재재고. 이 센터에서 취급하지 않는 상품이면 null
  reservedQuantity: number; // 예약재고 (주문됐지만 아직 출고 전)
  availableQuantity: number; // 판매가능재고 = 현재재고 - 예약재고
  lowStock: boolean; // 판매가능재고가 기준 미만인지
}

// 재고 현황 표의 한 줄 (상품 1개)
export interface InventoryRow {
  productId: number;
  productName: string;
  categoryName: string;
  cells: InventoryCell[]; // warehouses 순서와 같다
  totalAvailable: number; // 판매가능재고 합계
}

// 재고 현황 표 전체 (GET /api/admin/products + /api/admin/warehouses + /api/admin/inventories 를 합친 것)
export interface InventoryTable {
  warehouses: Warehouse[];
  rows: InventoryRow[];
  lowStockThreshold: number;
}

// GET /api/admin/analytics (매출·판매 수량은 환불된 주문 제외)
export interface Analytics {
  dailySales: { date: string; orderCount: number; sales: number }[]; // 최근 14일
  categorySales: { categoryName: string; quantity: number; sales: number }[];
  topProducts: { productId: number; productName: string; quantity: number; sales: number }[];
  warehouses: { warehouseName: string; quantity: number }[];
  totalOrders: number;
  canceledOrders: number;
  returnedOrders: number;
}
