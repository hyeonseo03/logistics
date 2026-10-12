// warehouses 테이블
export type WarehouseRegion = "SEOUL" | "GYEONGGI" | "BUSAN";

export interface Warehouse {
  id: number;
  name: string;
  region: WarehouseRegion;
  address: string;
  sameDayShipping: boolean; // 이 센터에서 당일 출고가 가능한지
}

// inventory 테이블: 어떤 상품이 어느 물류센터에 몇 개 있는지
export interface Inventory {
  id: number;
  productId: number; // products.id
  warehouseId: number; // warehouses.id
  quantity: number; // 현재 재고 (창고에 실제로 있는 수량)
  reservedQuantity: number; // 예약 재고 (주문은 들어왔지만 아직 출고되지 않은 수량)
}

// 백엔드 GET /api/inventories, GET /api/products/{id}/inventories 의 응답 한 줄
// (백엔드 InventoryResponse.java 와 같은 모양: inventory 테이블 + 상품 이름, 물류센터 이름)
// 품절/품절임박 판단은 백엔드가 아니라 lib/stock.ts 가 한다
export interface InventoryResponse extends Inventory {
  productName: string;
  warehouseName: string;
  updatedAt: string; // 시간대 없이 온다 (예: "2026-10-12T09:00:00", 한국 시간)
}
