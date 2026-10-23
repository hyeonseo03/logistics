"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/common/AuthContext";
import { loginHref } from "@/lib/redirect";

const GO_HOME_MS = 2000; // "권한 없음" 안내를 보여준 뒤 홈으로 가기까지 기다리는 시간

// 관리자만 볼 수 있게 막는 컴포넌트
// - 로그인 안 함: 로그인 화면으로 (로그인 후 이 관리자 화면으로 돌아온다)
// - 일반 회원: "권한 없음" 안내 → 2초 뒤 홈으로
// 주의: 화면에서 막는 것은 편의 기능이다. 진짜 권한 확인은 백엔드가 한다 (/api/admin/** 은 관리자만, 아니면 403)
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logoutPath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // 관리자 화면에서 로그아웃 버튼을 눌렀으면 UserMenu 가 홈으로 보낸다
      if (logoutPath !== pathname) router.replace(loginHref(pathname));
      return;
    }

    if (!isAdmin) {
      const timer = setTimeout(() => router.replace("/"), GO_HOME_MS);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isAdmin, logoutPath, pathname, router]);

  if (loading) return <p className="p-8 text-gray-500">권한을 확인하는 중...</p>;
  if (!user) return <p className="p-8 text-gray-500">로그인이 필요합니다. 로그인 화면으로 이동합니다...</p>;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div role="alert" className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-4xl" aria-hidden="true">
            🔒
          </p>
          <h1 className="mt-4 text-xl font-bold">권한이 없습니다</h1>
          <p className="mt-2 text-sm text-gray-600">관리자만 들어올 수 있는 화면이에요. 잠시 후 홈으로 이동합니다.</p>
          <Link href="/" className="mt-6 inline-block rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
            지금 홈으로
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
