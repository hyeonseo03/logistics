import type { Inventory } from "@/types/warehouse";

// 판매가능재고 = quantity(현재재고) - reservedQuantity(예약재고)
//
// 품절 (판매가능 0개)
//   - productId 6(세제): 창고에 4개 있지만 모두 예약됨 → 품절
//   - productId 9(충전기): 재고 0개
// 품절 임박 (판매가능 1~9개)
//   - productId 8(이어폰): 8 - 2 = 6개
//   - productId 10(키보드): 12 - 9 = 3개 (현재재고는 12개지만 팔 수 있는 건 3개)
//   - productId 12(조끼): 서울 0개 + 경기 8개 = 8개 → 서울이 아니라 경기에서 출고
// 부산에만 재고가 있는 상품: productId 1, 11 → 당일 출고 불가, 도착이 늦음
// productId 4(달걀): 서울은 품절, 경기에만 재고 → 경기에서 출고
export const inventory: Inventory[] = [
  { id: 1, productId: 1, warehouseId: 3, quantity: 120, reservedQuantity: 5 },
  { id: 2, productId: 2, warehouseId: 2, quantity: 50, reservedQuantity: 3 },
  { id: 3, productId: 2, warehouseId: 3, quantity: 30, reservedQuantity: 0 },
  { id: 4, productId: 3, warehouseId: 1, quantity: 40, reservedQuantity: 4 },
  { id: 5, productId: 4, warehouseId: 1, quantity: 0, reservedQuantity: 0 },
  { id: 6, productId: 4, warehouseId: 2, quantity: 25, reservedQuantity: 2 },
  { id: 7, productId: 5, warehouseId: 2, quantity: 200, reservedQuantity: 10 },
  { id: 8, productId: 5, warehouseId: 3, quantity: 80, reservedQuantity: 0 },
  { id: 9, productId: 6, warehouseId: 2, quantity: 4, reservedQuantity: 4 },
  { id: 10, productId: 7, warehouseId: 1, quantity: 15, reservedQuantity: 2 },
  { id: 11, productId: 7, warehouseId: 3, quantity: 10, reservedQuantity: 0 },
  { id: 12, productId: 8, warehouseId: 1, quantity: 8, reservedQuantity: 2 },
  { id: 13, productId: 9, warehouseId: 1, quantity: 0, reservedQuantity: 0 },
  { id: 14, productId: 10, warehouseId: 2, quantity: 12, reservedQuantity: 9 },
  { id: 15, productId: 11, warehouseId: 3, quantity: 70, reservedQuantity: 0 },
  { id: 16, productId: 12, warehouseId: 1, quantity: 5, reservedQuantity: 5 },
  { id: 17, productId: 12, warehouseId: 2, quantity: 9, reservedQuantity: 1 },
];
