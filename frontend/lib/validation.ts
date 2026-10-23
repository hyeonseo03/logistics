// 입력값 검사 규칙 (화면의 입력 폼에서 쓴다)
// 백엔드도 같은 규칙으로 한 번 더 검사한다. (화면 검사는 우회할 수 있으므로)

export const PASSWORD_MIN_LENGTH = 8;

// 이메일: "아이디@도메인.최상위" 모양인지만 간단히 본다
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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
