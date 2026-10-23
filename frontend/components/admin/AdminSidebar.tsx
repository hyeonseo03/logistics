"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import { useToast } from "@/components/common/Toast";

// 관리자 화면 메뉴
const menus = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "주문 관리" },
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/inventory", label: "재고 관리" },
  { href: "/admin/shipments", label: "배송 관리" },
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/analytics", label: "통계 분석" },
];

// PC: 왼쪽 세로 메뉴 / 모바일: 위쪽 가로 메뉴 (가로 스크롤)
export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  // 대시보드(/admin)는 정확히 같을 때만, 나머지는 하위 주소까지 현재 메뉴로 본다
  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  async function handleLogout() {
    await logout();
    showToast("로그아웃되었습니다.");
    router.push("/");
  }

  return (
    <aside className="bg-gray-900 text-white md:flex md:min-h-screen md:w-56 md:shrink-0 md:flex-col md:p-4">
      <div className="flex items-center justify-between px-4 py-3 md:mb-6 md:block md:p-0">
        <Link href="/admin" className="text-lg font-bold">
          LOGISTICS 관리자
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white md:hidden">
          쇼핑몰로 →
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:p-0">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className={`shrink-0 whitespace-nowrap rounded px-3 py-2 text-sm md:text-base ${
              isActive(menu.href) ? "bg-blue-600 font-semibold" : "hover:bg-gray-700"
            }`}
          >
            {menu.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto hidden flex-col gap-2 border-t border-gray-700 pt-4 text-sm md:flex">
        {user && <p className="px-3 text-gray-400">{user.name}님</p>}
        <Link href="/" className="px-3 py-1 text-gray-400 hover:text-white">
          ← 쇼핑몰로 돌아가기
        </Link>
        <button type="button" onClick={handleLogout} className="px-3 py-1 text-left text-gray-400 hover:text-white">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
