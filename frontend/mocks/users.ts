import type { User } from "@/types/user";

// 주소는 addresses 테이블(mocks/addresses.ts)로 옮겼다
export const users: User[] = [
  { id: 1, email: "minji@example.com", name: "정현서", phone: "010-1234-5678", role: "CUSTOMER", createdAt: "2026-08-01T10:00:00+09:00" },
  { id: 2, email: "junho@example.com", name: "이준호", phone: "010-2345-6789", role: "CUSTOMER", createdAt: "2026-08-10T14:30:00+09:00" },
  { id: 3, email: "admin@logistics.com", name: "관리자", phone: "010-0000-0000", role: "ADMIN", createdAt: "2026-07-01T09:00:00+09:00" },
];
