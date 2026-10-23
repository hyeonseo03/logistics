"use client";

// 장바구니 상태를 여러 화면(헤더, 상품 상세, 장바구니, 주문)에서 함께 쓰기 위한 Context
// 장바구니 내용은 백엔드(cart_items 테이블)에 저장되므로 새로고침하거나 다른 기기에서 로그인해도 남아 있다.
// "결제할 상품 선택(체크박스)"만 화면에서 기억한다.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import * as api from "@/lib/api";
import type { Cart, CartItem } from "@/types/cart";

interface CartContextValue {
  items: CartItem[]; // 로그인하지 않았으면 빈 배열
  loading: boolean;
  error: string; // 장바구니를 불러오지 못했을 때 안내
  totalCount: number; // 담긴 상품 개수 합계 (헤더 배지)
  checkoutItems: CartItem[]; // 실제로 결제할 상품 (체크했고 품절이 아닌 상품)
  checkoutPrice: number; // 결제할 상품의 상품금액 합계 (배송비 제외)
  isSelected: (productId: number) => boolean;
  addItem: (productId: number, quantity: number) => Promise<void>; // 실패하면 에러를 던진다 (예: 재고 부족)
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItems: (productIds: number[]) => Promise<void>;
  toggleSelected: (productId: number) => void;
  setAllSelected: (selected: boolean) => void;
  reload: () => Promise<void>; // 주문 후처럼 서버에서 장바구니가 바뀌었을 때 다시 불러온다
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unselectedIds, setUnselectedIds] = useState<number[]>([]); // 체크를 해제한 상품 (새로 담은 상품은 체크된 상태)

  const reload = useCallback(async () => {
    try {
      setCart(await api.getCart());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "장바구니를 불러오지 못했습니다.");
    }
  }, []);

  // 로그인한 회원이 바뀔 때마다 그 회원의 장바구니를 불러온다 (로그아웃하면 비운다)
  const userId = user?.id;
  useEffect(() => {
    if (userId === undefined) return;
    let ignore = false;

    api
      .getCart()
      .then((data) => {
        if (ignore) return;
        setCart(data);
        setError("");
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "장바구니를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
      // 회원이 바뀌거나 로그아웃하면 이전 회원의 장바구니를 비운다
      setCart(null);
      setUnselectedIds([]);
      setLoading(true);
    };
  }, [userId]);

  async function addItem(productId: number, quantity: number) {
    setCart(await api.addCartItem(productId, quantity));
    setUnselectedIds((prev) => prev.filter((id) => id !== productId)); // 다시 담으면 체크
  }

  async function updateQuantity(productId: number, quantity: number) {
    setCart(await api.updateCartQuantity(productId, quantity));
  }

  async function removeItems(productIds: number[]) {
    if (productIds.length === 0) return;
    setCart(await api.removeCartItems(productIds));
  }

  function toggleSelected(productId: number) {
    setUnselectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  // 전체 선택 / 전체 해제
  function setAllSelected(selected: boolean) {
    setUnselectedIds(selected ? [] : (cart?.items ?? []).map((item) => item.productId));
  }

  const items = user ? (cart?.items ?? []) : [];
  const isSelected = (productId: number) => !unselectedIds.includes(productId);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutItems = items.filter((item) => !item.soldOut && isSelected(item.productId));
  const checkoutPrice = checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading: user ? loading : false,
        error,
        totalCount,
        checkoutItems,
        checkoutPrice,
        isSelected,
        addItem,
        updateQuantity,
        removeItems,
        toggleSelected,
        setAllSelected,
        reload,
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
