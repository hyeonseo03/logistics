import type { Shipment } from "@/types/shipment";

// orders 테이블
export type OrderStatus = "PAID" | "PREPARING" | "SHIPPING" | "DELIVERED" | "CANCELLED";

export type PaymentMethod = "CARD" | "BANK_TRANSFER";

export interface Order {
  id: number;
  userId: number; // users.id
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  address: string;
  createdAt: string;
}

// order_items 테이블
export interface OrderItem {
  id: number;
  orderId: number; // orders.id
  productId: number; // products.id
  quantity: number;
  price: number; // 주문 당시 상품 1개 가격
}

// 주문 상품 + 상품 이름 (화면 표시용)
export interface OrderItemWithProduct extends OrderItem {
  productName: string;
}

// 내 주문 내역 화면용 응답 (orders + order_items + shipments 를 합친 것)
export interface OrderWithDetails extends Order {
  items: OrderItemWithProduct[];
  shipment: Shipment | null; // 아직 배송이 만들어지지 않았으면 null
}

// 주문 생성 요청 (나중에 POST /api/orders 의 body 가 된다)
export interface CreateOrderRequest {
  items: { productId: number; quantity: number }[];
  receiverName: string;
  receiverPhone: string;
  address: string;
  paymentMethod: PaymentMethod;
}
