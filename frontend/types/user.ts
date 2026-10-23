// users 테이블 (백엔드 UserResponse 와 같은 모양. 비밀번호는 응답에 들어 있지 않다)
// USER: 일반 회원 / ADMIN: 관리자
export type UserRole = "USER" | "ADMIN";

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string; // 시간대 없이 온다 (예: "2026-10-23T10:00:00", 한국 시간)
}

// POST /api/auth/login 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/login 응답 (백엔드 LoginResponse)
export interface LoginResponse {
  accessToken: string; // 이후 요청마다 "Authorization: Bearer {accessToken}" 헤더로 보낸다
  tokenType: string; // 항상 "Bearer"
  expiresIn: number; // 토큰 유효 시간 (초)
  user: User;
}

// POST /api/auth/signup 요청
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

// PUT /api/users/me 요청 (이름, 전화번호. 이메일은 바꿀 수 없다)
export interface UpdateProfileRequest {
  name: string;
  phone: string;
}

// PATCH /api/users/me/password 요청
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// user_addresses 테이블: 회원의 배송지 (회원 1명이 여러 개 가질 수 있다)
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
  shippingCount: number; // 배송중인 주문 수 (출고 + 배송중)
  returningCount: number; // 회수가 진행 중인 주문 수
  restockAlertCount: number; // 신청한 재입고 알림 수
}
