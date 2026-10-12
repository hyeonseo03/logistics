// users 테이블
// (비밀번호는 화면에 내려주지 않으므로 이 타입에 없다. mocks/userPasswords.ts 참고)
export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string; // ISO 날짜 문자열 (예: "2026-09-01T10:00:00+09:00")
}

// 내 정보 수정 요청 (나중에 PATCH /api/users/me 의 body)
export interface UpdateProfileRequest {
  name: string;
  phone: string;
  newPassword?: string; // 비우면 비밀번호는 바꾸지 않는다
}

// addresses 테이블: 회원의 배송지 (회원 1명이 여러 개 가질 수 있다)
export interface Address {
  id: number;
  userId: number; // users.id
  label: string; // 배송지 이름 (예: "집", "회사")
  receiverName: string;
  receiverPhone: string;
  address: string;
  isDefault: boolean; // 기본 배송지 (회원마다 1개)
}

// 배송지 추가/수정 요청
export type AddressRequest = Omit<Address, "id" | "userId">;

// 마이페이지 첫 화면 요약 카드
export interface MyPageSummary {
  shippingCount: number; // 배송중인 주문 수
  claimInProgressCount: number; // 진행 중인 취소/반품/교환 수
  restockAlertCount: number; // 신청한 재입고 알림 수
}
