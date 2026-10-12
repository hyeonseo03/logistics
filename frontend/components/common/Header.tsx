import Link from "next/link";
import UserMenu from "@/components/common/UserMenu";
import CartCount from "@/components/order/CartCount";

// 소비자 화면 상단 메뉴
const menus = [
  { href: "/products", label: "상품" },
  { href: "/mypage/shipments", label: "배송조회" },
  { href: "/cart", label: "장바구니" },
  { href: "/mypage", label: "MY" },
  { href: "/ai", label: "AI 도우미" },
];

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          LOGISTICS
        </Link>

        <nav className="flex gap-6">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href} className="hover:text-blue-600">
              {menu.label}
              {menu.href === "/cart" && <CartCount />}
            </Link>
          ))}
        </nav>

        <div className="flex gap-4 text-sm text-gray-500">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
