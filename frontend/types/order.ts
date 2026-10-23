import type { Shipment } from "@/types/shipment";

// orders 테이블의 주문 상태 (백엔드 OrderStatus enum 과 같다)
// 정방향:   ORDERED(주문완료) → PACKING(포장) → SHIPPED(출고) → IN_TRANSIT(배송중) → DELIVERED(배송완료)
// 되돌리기: ORDERED, PACKING → CANCELED(취소)
//          SHIPPED, IN_TRANSIT, DELIVERED → RETURNING(회수중) → RETURNED(회수완료)
export type OrderStatus =
  | "ORDERED"
  | "PACKING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELED"
  | "RETURNING"
  | "RETURNED";

export type PaymentMethod = "CARD" | "BANK_TRANSFER";

export type PaymentStatus = "PAID" | "REFUNDED";

// 지금 취소하면 어떻게 되는지: 즉시 취소 / 회수 / 이미 처리됨
export type CancelType = "IMMEDIATE_CANCEL" | "RETURN" | "ALREADY_PROCESSED";

export interface CancelInfo {
  cancelable: boolean; // 취소 버튼을 보여줄지
  type: CancelType;
  label: string; // 예: "회수"
  message: string; // 예: "이미 출고되어 취소하면 택배 기사님이 상품을 회수합니다. ..."
}

// order_items 테이블 한 줄 (백엔드 OrderItemResponse)
export interface OrderItem {
  id: number;
  orderId: number; // orders.id
  productId: number; // products.id
  productName: string;
  imageUrl: string | null; // 상품의 현재 이미지
  categoryName: string; // 이미지가 없을 때 카테고리 그림용
  warehouseId: number; // 출고 물류센터
  warehouseName: string;
  quantity: number;
  price: number; // 주문 당시 상품 1개 가격
  lineTotal: number; // price × quantity
}

// 주문 1건 (백엔드 OrderResponse: orders + order_items + shipments + 결제 상태)
export interface Order {
  id: number;
  userId: number; // users.id
  userName: string; // 주문자 이름
  status: OrderStatus;
  statusLabel: string; // 화면 표시용 한국어 (예: "주문완료")
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  productTotal: number;
  shippingFee: number;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  address: string;
  createdAt: string; // 시간대 없이 온다 (한국 시간)
  items: OrderItem[];
  shipment: Shipment | null;
  cancelInfo: CancelInfo;
}

// POST /api/orders 요청: 장바구니에 담긴 상품으로 주문한다
// 배송지는 addressId(저장된 배송지) 또는 receiverName·receiverPhone·address(직접 입력) 중 하나
export interface CreateOrderRequest {
  addressId?: number;
  receiverName?: string;
  receiverPhone?: string;
  address?: string;
  paymentMethod: PaymentMethod;
  productIds: number[]; // 장바구니에서 주문할 상품 id
}

// POST /api/orders/{id}/cancel 결과
// CANCELED: 즉시 취소됨 / RETURN_REQUESTED: 회수 요청됨 / ALREADY_PROCESSED: 이미 처리된 주문
export type CancelResult = "CANCELED" | "RETURN_REQUESTED" | "ALREADY_PROCESSED";

export interface CancelOrderResponse {
  result: CancelResult;
  message: string;
  order: Order;
}
