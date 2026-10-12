import Link from "next/link";

// 관리자 화면 왼쪽 메뉴
const menus = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "주문 관리" },
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/inventory", label: "재고 관리" },
  { href: "/admin/shipments", label: "배송 관리" },
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/analytics", label: "통계 분석" },
];

export default function AdminSidebar() {
  return (
    <aside className="flex w-56 flex-col bg-gray-900 p-4 text-white">
      <Link href="/admin" className="mb-6 text-lg font-bold">
        LOGISTICS 관리자
      </Link>

      <nav className="flex flex-col gap-1">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="rounded px-3 py-2 hover:bg-gray-700"
          >
            {menu.label}
          </Link>
        ))}
      </nav>

      <Link href="/" className="mt-auto px-3 py-2 text-sm text-gray-400 hover:text-white">
        ← 쇼핑몰로 돌아가기
      </Link>
    </aside>
  );
}
