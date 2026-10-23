// 장바구니 (백엔드 GET /api/cart 응답. 장바구니는 서버 cart_items 테이블에 저장된다)

// 장바구니 한 줄
export interface CartItem {
  id: number;
  productId: number; // products.id
  productName: string;
  optionName: string | null;
  imageUrl: string | null;
  categoryName: string;
  price: number; // 상품 1개 현재 가격
  quantity: number;
  lineTotal: number; // price × quantity
  totalStock: number; // 모든 물류센터의 판매가능재고 합계
  soldOut: boolean; // 품절이면 주문할 수 없다
}

// 장바구니 전체 + 결제 요약 (품절 상품은 금액에서 빠진다)
export interface Cart {
  items: CartItem[];
  productTotal: number;
  shippingFee: number;
  totalPrice: number;
}
