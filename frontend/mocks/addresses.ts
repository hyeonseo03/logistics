import type { Address } from "@/types/user";

// 회원마다 기본 배송지(isDefault: true)는 1개
export const addresses: Address[] = [
  { id: 1, userId: 1, label: "집", receiverName: "정현서", receiverPhone: "010-1234-5678", address: "서울시 강남구 테헤란로 123", isDefault: true },
  { id: 2, userId: 1, label: "회사", receiverName: "정현서", receiverPhone: "010-1234-5678", address: "서울시 중구 을지로 100, 8층", isDefault: false },
  { id: 3, userId: 2, label: "집", receiverName: "이준호", receiverPhone: "010-2345-6789", address: "부산시 해운대구 센텀로 45", isDefault: true },
  { id: 4, userId: 3, label: "회사", receiverName: "관리자", receiverPhone: "010-0000-0000", address: "서울시 중구 세종대로 1", isDefault: true },
];
