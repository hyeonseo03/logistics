// 입력값 검사 규칙
// 화면(입력 폼)과 lib/api.ts(서버 역할) 양쪽에서 같이 쓴다.
// 나중에 백엔드에서도 같은 규칙으로 한 번 더 검사해야 한다. (화면 검사는 우회할 수 있으므로)

export const PASSWORD_MIN_LENGTH = 8;

// 휴대폰 번호 형식: 010-1234-5678 (가운데는 3~4자리)
export function isValidPhone(phone: string): boolean {
  return /^01[016789]-\d{3,4}-\d{4}$/.test(phone);
}

// 이름: 비어 있지 않고 20자 이하
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 20;
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}
