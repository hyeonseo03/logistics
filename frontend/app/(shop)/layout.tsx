import Header from "@/components/common/Header";
import { CartProvider } from "@/components/order/CartContext";

// 소비자 페이지 공통 레이아웃: 상단 헤더 + 본문
// CartProvider 로 감싸서 모든 소비자 페이지가 같은 장바구니를 쓴다
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1">{children}</main>
    </CartProvider>
  );
}
