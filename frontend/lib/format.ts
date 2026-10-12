// 12000 → "12,000원"
export function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

// Date → "2026-09-29" (브라우저 시간 기준)
export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-09-30" → "내일(수) 도착 예정" / "모레(목) 도착 예정" / "10/2(금) 도착 예정"
export function formatArrival(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const arrival = new Date(y, m - 1, d);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((arrival.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let day = `${m}/${d}`;
  if (diffDays === 0) day = "오늘";
  if (diffDays === 1) day = "내일";
  if (diffDays === 2) day = "모레";

  return `${day}(${weekdays[arrival.getDay()]}) 도착 예정`;
}

// "2026-09-25T01:10:00+09:00" → "2026. 09. 25. 01:10"
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 개인정보 가리기: "minji@example.com" → "min***@example.com"
export function maskEmail(email: string) {
  const [id, domain] = email.split("@");
  const visible = id.length > 3 ? id.slice(0, 3) : id.slice(0, 1);
  return `${visible}***@${domain}`;
}

// 개인정보 가리기: "010-1234-5678" → "010-****-5678"
export function maskPhone(phone: string) {
  const parts = phone.split("-");
  if (parts.length !== 3) return phone.slice(0, 3) + "****" + phone.slice(-4);
  return `${parts[0]}-****-${parts[2]}`;
}
