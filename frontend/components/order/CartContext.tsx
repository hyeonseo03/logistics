"use client";

// 장바구니 상태를 여러 화면(헤더, 상품 상세, 장바구니, 주문)에서 함께 쓰기 위한 Context
// 지금은 브라우저 메모리에만 저장되므로 새로고침하면 비워진다.

import { createContext, useCallback, useContext, useState } from "react";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  stock: number; // 담을 수 있는 최대 수량 (판매가능재고). 0 이면 품절
  quantity: number;
  selected: boolean; // 결제할 상품으로 체크했는지
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number; // 담긴 상품 개수 합계
  checkoutItems: CartItem[]; // 실제로 결제할 상품 (체크했고 품절이 아닌 상품)
  checkoutPrice: number; // 결제할 상품의 상품금액 합계 (배송비 제외)
  addItem: (item: Omit<CartItem, "quantity" | "selected">, quantity: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItems: (productIds: number[]) => void;
  toggleSelected: (productId: number) => void;
  setAllSelected: (selected: boolean) => void;
  syncStock: (stocks: { productId: number; stock: number }[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(newItem: Omit<CartItem, "quantity" | "selected">, quantity: number) {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === newItem.productId);

      // 처음 담는 상품이면 새로 추가 (결제 대상으로 체크된 상태)
      if (!existing) {
        return [...prev, { ...newItem, quantity: Math.min(quantity, newItem.stock), selected: true }];
      }

      // 이미 담긴 상품이면 수량만 더한다 (재고를 넘지 않게)
      return prev.map((item) =>
        item.productId === newItem.productId
          ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
          : item
      );
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
          : item
      )
    );
  }

  // 여러 상품을 한 번에 삭제 (1개만 지울 때도 [productId] 로 넘긴다)
  function removeItems(productIds: number[]) {
    setItems((prev) => prev.filter((item) => !productIds.includes(item.productId)));
  }

  function toggleSelected(productId: number) {
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, selected: !item.selected } : item))
    );
  }

  // 전체 선택 / 전체 해제 (품절 상품은 선택하지 않는다)
  function setAllSelected(selected: boolean) {
    setItems((prev) => prev.map((item) => ({ ...item, selected: selected && item.stock > 0 })));
  }

  // 서버에서 받은 최신 재고로 바꾼다 (담아둔 사이에 재고가 줄었을 수 있으므로)
  // - 수량이 재고보다 많으면 재고만큼으로 줄인다
  // - 품절이 되었으면 선택을 해제한다 (결제 대상에서 자동 제외)
  // useCallback: 화면의 useEffect 안에서 불러도 매번 새 함수가 만들어지지 않게 한다
  const syncStock = useCallback((stocks: { productId: number; stock: number }[]) => {
    setItems((prev) =>
      prev.map((item) => {
        const latest = stocks.find((s) => s.productId === item.productId);
        if (!latest || latest.stock === item.stock) return item;
        return {
          ...item,
          stock: latest.stock,
          quantity: Math.max(1, Math.min(item.quantity, latest.stock)),
          selected: latest.stock > 0 && item.selected,
        };
      })
    );
  }, []);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutItems = items.filter((item) => item.selected && item.stock > 0);
  const checkoutPrice = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        checkoutItems,
        checkoutPrice,
        addItem,
        updateQuantity,
        removeItems,
        toggleSelected,
        setAllSelected,
        syncStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// 화면에서는 const { items, addItem } = useCart(); 처럼 꺼내 쓴다
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart 는 CartProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
