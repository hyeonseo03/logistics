import type { Order } from "@/types/order";

export const orders: Order[] = [
  { id: 1, userId: 1, status: "DELIVERED", paymentMethod: "CARD", totalPrice: 56900, receiverName: "정현서", receiverPhone: "010-1234-5678", address: "서울시 강남구 테헤란로 123", createdAt: "2026-09-02T09:15:00+09:00" },
  { id: 2, userId: 1, status: "SHIPPING", paymentMethod: "CARD", totalPrice: 120800, receiverName: "정현서", receiverPhone: "010-1234-5678", address: "서울시 강남구 테헤란로 123", createdAt: "2026-09-24T11:40:00+09:00" },
  { id: 3, userId: 2, status: "SHIPPING", paymentMethod: "BANK_TRANSFER", totalPrice: 54800, receiverName: "이준호", receiverPhone: "010-2345-6789", address: "부산시 해운대구 센텀로 45", createdAt: "2026-09-25T15:05:00+09:00" },
  { id: 4, userId: 2, status: "PREPARING", paymentMethod: "CARD", totalPrice: 54000, receiverName: "이준호", receiverPhone: "010-2345-6789", address: "부산시 해운대구 센텀로 45", createdAt: "2026-09-28T10:20:00+09:00" },
  { id: 5, userId: 1, status: "PAID", paymentMethod: "CARD", totalPrice: 73000, receiverName: "정현서", receiverPhone: "010-1234-5678", address: "서울시 강남구 테헤란로 123", createdAt: "2026-09-28T21:30:00+09:00" },
  { id: 6, userId: 1, status: "CANCELLED", paymentMethod: "CARD", totalPrice: 38000, receiverName: "정현서", receiverPhone: "010-1234-5678", address: "서울시 강남구 테헤란로 123", createdAt: "2026-09-20T09:40:00+09:00" },
  { id: 7, userId: 1, status: "DELIVERED", paymentMethod: "CARD", totalPrice: 30000, receiverName: "정현서", receiverPhone: "010-1234-5678", address: "서울시 중구 을지로 100, 8층", createdAt: "2026-09-08T13:00:00+09:00" },
];
