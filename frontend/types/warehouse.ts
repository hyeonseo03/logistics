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
