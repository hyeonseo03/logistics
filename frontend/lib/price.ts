// 결제 금액 계산 규칙
// 나중에 백엔드(Spring Boot)가 생기면 이 규칙도 서버로 옮긴다. (금액은 최종적으로 서버가 계산)

// 상품금액이 이 금액 이상이면 무료배송
export const FREE_SHIPPING_THRESHOLD = 30000;
// 기본 배송비
export const SHIPPING_FEE = 3000;

// 상품금액 → 배송비 (주문할 상품이 없으면 0원)
export function getShippingFee(productPrice: number): number {
  if (productPrice === 0) return 0;
  if (productPrice >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEE;
}
