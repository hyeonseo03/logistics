// 재고 / 출고 센터 / 예상 도착일 계산 규칙
// 화면에서는 직접 부르지 않고, lib/api.ts 가 이 함수들로 계산한 결과를 돌려준다.
// 나중에 백엔드(Spring Boot)가 생기면 이 파일의 규칙을 그대로 서버로 옮긴다.

import type { StockStatus } from "@/types/product";
import type { WarehouseRegion } from "@/types/warehouse";

// 판매가능재고가 이 수량보다 적으면 "품절 임박"
export const LOW_STOCK_THRESHOLD = 10;

// 판매가능재고 = 현재재고 - 예약재고 (음수가 되지 않게 0 으로 맞춘다)
export function getAvailableQuantity(quantity: number, reservedQuantity: number): number {
  return Math.max(0, quantity - reservedQuantity);
}

// 판매가능재고 → 재고 상태
export function getStockStatus(availableQuantity: number): StockStatus {
  if (availableQuantity <= 0) return "SOLD_OUT";
  if (availableQuantity < LOW_STOCK_THRESHOLD) return "LOW_STOCK";
  return "AVAILABLE";
}

// 주소 → 지역 ("서울시 강남구 ..." → "SEOUL")
// 모르는 지역이면 서울로 본다 (지금은 센터가 서울/경기/부산뿐이라 단순하게 처리)
export function getRegionFromAddress(address: string): WarehouseRegion {
  if (address.startsWith("부산")) return "BUSAN";
  if (address.startsWith("경기")) return "GYEONGGI";
  return "SEOUL";
}

// 배송지 지역별로 가까운 물류센터 지역 순서
const nearestRegions: Record<WarehouseRegion, WarehouseRegion[]> = {
  SEOUL: ["SEOUL", "GYEONGGI", "BUSAN"],
  GYEONGGI: ["GYEONGGI", "SEOUL", "BUSAN"],
  BUSAN: ["BUSAN", "GYEONGGI", "SEOUL"],
};

// 배송지에서 가까운 정도 (0 이 가장 가깝다)
export function getDistanceRank(from: WarehouseRegion, to: WarehouseRegion): number {
  return nearestRegions[from].indexOf(to);
}

// 출고 센터에서 배송지까지 걸리는 날 수 (출고한 날 기준)
// 같은 지역이거나 서울↔경기는 다음 날, 부산↔수도권은 이틀
export function getTransitDays(from: WarehouseRegion, to: WarehouseRegion): number {
  if (from === to) return 1;
  if (from === "BUSAN" || to === "BUSAN") return 2;
  return 1;
}

// 예상 도착일 계산
// - 당일 출고 센터면 오늘 출고, 아니면 내일 출고
// - 출고일 + 이동 일수 = 도착일
// - 일요일에는 배송하지 않으므로 월요일로 미룬다
export function getEstimatedArrivalDate(
  warehouseRegion: WarehouseRegion,
  sameDayShipping: boolean,
  destinationRegion: WarehouseRegion,
  today: Date = new Date()
): Date {
  const arrival = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const shipDelay = sameDayShipping ? 0 : 1;
  arrival.setDate(arrival.getDate() + shipDelay + getTransitDays(warehouseRegion, destinationRegion));

  if (arrival.getDay() === 0) {
    arrival.setDate(arrival.getDate() + 1);
  }
  return arrival;
}
