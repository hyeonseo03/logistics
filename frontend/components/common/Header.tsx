import Link from "next/link";
import UserMenu from "@/components/common/UserMenu";
import CartCount from "@/components/order/CartCount";

// 소비자 화면 상단 메뉴
// 장바구니·배송조회·MY·AI 도우미는 로그인이 필요한 화면이라, 로그인 전에 누르면 로그인 화면으로 갔다가 돌아온다
const menus = [
  { href: "/products", label: "상품" },
  { href: "/mypage/shipments", label: "배송조회" },
  { href: "/cart", label: "장바구니" },
  { href: "/mypage", label: "MY" },
  { href: "/ai", label: "AI 도우미" },
];

// PC: [로고] [메뉴] [로그인] 한 줄 / 모바일: [로고] [로그인] 아래 줄에 [메뉴] (가로 스크롤)
export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-blue-700">
          LOGISTICS
        </Link>

        <nav className="order-last -mx-1 flex w-full gap-5 overflow-x-auto px-1 pb-1 text-sm md:order-none md:w-auto md:pb-0 md:text-base">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href} className="shrink-0 whitespace-nowrap hover:text-blue-600">
              {menu.label}
              {menu.href === "/cart" && <CartCount />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
