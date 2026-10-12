import type { OrderItem } from "@/types/order";

// order_items 테이블. price 는 주문 당시 가격이다.
export const orderItems: OrderItem[] = [
  { id: 1, orderId: 1, productId: 5, quantity: 1, price: 21900 },
  { id: 2, orderId: 1, productId: 6, quantity: 2, price: 17500 },
  { id: 3, orderId: 2, productId: 8, quantity: 1, price: 89000 },
  { id: 4, orderId: 2, productId: 3, quantity: 2, price: 15900 },
  { id: 5, orderId: 3, productId: 1, quantity: 2, price: 19900 },
  { id: 6, orderId: 3, productId: 11, quantity: 1, price: 15000 },
  { id: 7, orderId: 4, productId: 10, quantity: 1, price: 54000 },
  { id: 8, orderId: 5, productId: 12, quantity: 1, price: 49000 },
  { id: 9, orderId: 5, productId: 7, quantity: 1, price: 24000 },
  { id: 10, orderId: 6, productId: 2, quantity: 1, price: 38000 },
  { id: 11, orderId: 7, productId: 11, quantity: 2, price: 15000 },
];
