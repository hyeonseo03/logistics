// 회원 비밀번호 (mock 전용)
// 실제 백엔드에서는 users 테이블에 암호화(해시)된 비밀번호로 저장하고, 화면에는 절대 내려주지 않는다.
// 그래서 User 타입과 분리해 두었다. 처음 비밀번호는 모두 "1234".
export const userPasswords: { userId: number; password: string }[] = [
  { userId: 1, password: "1234" },
  { userId: 2, password: "1234" },
  { userId: 3, password: "1234" },
];
