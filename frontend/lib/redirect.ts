// 로그인 후 돌아갈 주소(?redirect=) 다루기

// 우리 사이트 안의 주소만 허용한다 ("/cart" 는 OK, "https://..." 나 "//evil.com" 은 안 됨)
// 다른 사이트로 보내는 주소를 넣어 사용자를 속이는 공격(오픈 리다이렉트)을 막기 위해서다
export function safeRedirect(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

// 로그인 화면 주소 만들기: loginHref("/cart") → "/login?redirect=%2Fcart"
export function loginHref(redirect: string): string {
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}
