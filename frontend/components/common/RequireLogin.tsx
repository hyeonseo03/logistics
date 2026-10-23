"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/common/AuthContext";
import { loginHref } from "@/lib/redirect";

// 로그인이 필요한 화면을 감싼다
// 로그인하지 않았으면 /login?redirect=지금주소 로 보내고, 로그인에 성공하면 이 화면으로 돌아온다
// (로그아웃 버튼을 누른 경우에는 로그인 화면이 아니라 홈으로 간다 → UserMenu 가 처리)
export default function RequireLogin({ children }: { children: React.ReactNode }) {
  const { user, loading, logoutPath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const needLogin = !loading && !user && logoutPath !== pathname;

  useEffect(() => {
    if (needLogin) {
      // 주소 뒤의 ?검색조건 까지 그대로 돌려받는다 (예: /mypage/orders?page=2)
      router.replace(loginHref(pathname + window.location.search));
    }
  }, [needLogin, pathname, router]);

  if (loading) return <p className="p-8 text-gray-500">불러오는 중...</p>;
  if (!user) {
    return <p className="p-8 text-gray-500">로그인이 필요합니다. 로그인 화면으로 이동합니다...</p>;
  }
  return <>{children}</>;
}
