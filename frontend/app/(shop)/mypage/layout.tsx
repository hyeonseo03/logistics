"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RequireLogin from "@/components/common/RequireLogin";
import MyPageMenu from "@/components/mypage/MyPageMenu";

// 마이페이지 공통 레이아웃
// - 로그인 확인은 여기서 한 번만 한다 (그래서 각 페이지에서는 로그인되어 있다고 보고 만든다)
//   로그인하지 않았으면 /login?redirect=지금주소 로 보낸다
// - PC: 왼쪽 사이드 메뉴 + 오른쪽 본문
// - 모바일: 사이드 메뉴 없이 본문만. 하위 페이지에서는 "← 마이페이지" 로 돌아간다
export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireLogin>
      <MyPageFrame>{children}</MyPageFrame>
    </RequireLogin>
  );
}

function MyPageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/mypage";

  return (
    <div className="flex gap-10 p-4 sm:p-8">
      <aside className="hidden w-44 shrink-0 md:block">
        <MyPageMenu variant="side" />
      </aside>

      <div className="min-w-0 flex-1">
        {!isHome && (
          <Link href="/mypage" className="mb-4 inline-block text-sm text-gray-500 md:hidden">
            ← 마이페이지
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
