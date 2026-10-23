// categories 테이블
export interface Category {
  id: number;
  name: string;
}

// products 테이블
export interface Product {
  id: number;
  categoryId: number; // categories.id
  name: string;
  description: string;
  price: number; // 원 단위
  optionName: string | null; // 옵션 (예: "화이트 / L"). 지금은 상품마다 옵션 1개로 단순화, 없으면 null
  imageUrl: string | null; // 아직 이미지가 없으면 null
  createdAt: string;
}

// 백엔드 GET /api/products, GET /api/products/{id} 의 응답 (백엔드 ProductResponse.java 와 같은 모양)
// products 테이블 + categoryName + totalStock
// 주의: createdAt 은 시간대 없이 온다 (예: "2026-08-05T09:00:00", 한국 시간)
export interface ProductResponse extends Product {
  categoryName: string;
  totalStock: number; // 모든 물류센터의 판매가능재고 합계 (재고 상태 판단은 lib/stock.ts 가 한다)
}

// 재고 상태 (판매가능재고 기준)
// AVAILABLE: 10개 이상 / LOW_STOCK: 1~9개 (품절 임박) / SOLD_OUT: 0개
export type StockStatus = "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT";

// 물류센터별 재고 (화면 표시용)
export interface ProductStock {
  warehouseId: number;
  warehouseName: string;
  availableQuantity: number; // 판매가능재고 = 현재재고 - 예약재고
}

// 상품 목록/상세 화면용 응답 (products + categories + inventory + warehouses 를 합친 것)
export interface ProductWithStock extends Product {
  categoryName: string;
  stocks: ProductStock[]; // 이 상품을 취급하는 모든 물류센터, 배송지에서 가까운 순 (내부 계산용, 고객 화면에는 표시하지 않음)
  totalStock: number; // 모든 물류센터의 판매가능재고 합계
  stockStatus: StockStatus;
  shippingWarehouse: ProductStock | null; // 실제로 출고할 센터 (도착일·주문 계산용, 고객 화면에는 표시하지 않음). 품절이면 null
  sameDayShipping: boolean; // 출고 센터에서 오늘 바로 출고할 수 있는지
  estimatedArrivalDate: string | null; // 예상 도착일 "2026-09-30". 품절이면 null
}

// 상품 목록 정렬 방식
export type ProductSort = "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "NAME";

// 상품 목록 검색 조건 (categoryId 는 백엔드가 거르고, keyword·sort 는 lib/api.ts 에서 처리한다)
export interface ProductSearchParams {
  keyword?: string;
  categoryId?: number;
  sort?: ProductSort;
}

// restock_alerts 테이블: 재입고 알림 신청 + 상품의 현재 정보
export interface RestockAlert {
  id: number;
  userId: number; // users.id
  productId: number; // products.id
  createdAt: string;
  product: ProductWithStock;
}

// 백엔드 재입고 알림 응답 (상품은 ProductResponse 로 온다. lib/api.ts 가 ProductWithStock 으로 바꾼다)
export interface RestockAlertResponse extends Omit<RestockAlert, "product"> {
  product: ProductResponse;
}

// 관리자 상품 등록/수정 요청 (POST/PUT /api/admin/products)
export interface ProductRequest {
  categoryId: number;
  name: string;
  description: string;
  price: number;
  optionName: string | null;
  imageUrl: string | null; // 사진은 이미지 업로드 API 로 올리고, 수정할 때는 기존 값을 그대로 보낸다
}
