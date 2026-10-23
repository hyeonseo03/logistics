"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 마이페이지 메뉴 (섹션별로 묶음)
export const myPageSections = [
  {
    title: "쇼핑",
    menus: [
      { href: "/mypage/orders", label: "주문 목록" },
      { href: "/mypage/shipments", label: "배송 조회" },
    ],
  },
  {
    title: "취소·반품",
    menus: [
      { href: "/mypage/cancellations", label: "취소 내역" },
      { href: "/mypage/returns", label: "반품(회수) 내역" },
    ],
  },
  {
    title: "알림",
    menus: [{ href: "/mypage/restock-alerts", label: "재입고 알림 목록" }],
  },
  {
    title: "내 정보",
    menus: [
      { href: "/mypage/profile", label: "내 정보 관리" },
      { href: "/mypage/addresses", label: "배송지 관리" },
    ],
  },
];

// variant
// - "side": PC 왼쪽 사이드 메뉴 (현재 페이지 강조)
// - "list": 모바일 마이페이지 첫 화면의 목록형 메뉴 (한 줄씩 크게, 오른쪽 화살표)
export default function MyPageMenu({ variant }: { variant: "side" | "list" }) {
  const pathname = usePathname();

  if (variant === "list") {
    return (
      <nav className="flex flex-col gap-4">
        {myPageSections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-1 px-1 text-sm font-semibold text-gray-500">{section.title}</h2>
            <ul className="divide-y rounded-lg border bg-white">
              {section.menus.map((menu) => (
                <li key={menu.href}>
                  <Link href={menu.href} className="flex items-center justify-between px-4 py-3">
                    {menu.label}
                    <span className="text-gray-400">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-6">
      <Link href="/mypage" className="text-lg font-bold">
        마이페이지
      </Link>
      {myPageSections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 text-sm font-semibold">{section.title}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {section.menus.map((menu) => {
              const active = pathname === menu.href || pathname.startsWith(menu.href + "/");
              return (
                <li key={menu.href}>
                  <Link
                    href={menu.href}
                    className={active ? "font-semibold text-blue-600" : "text-gray-600 hover:text-blue-600"}
                  >
                    {menu.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
