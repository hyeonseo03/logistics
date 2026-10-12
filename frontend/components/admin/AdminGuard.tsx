"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/common/AuthContext";

// 관리자만 볼 수 있게 막는 컴포넌트
// 관리자가 아니면(고객이거나 로그인 안 함) 홈으로 보낸다
// 주의: 화면에서만 막는 것이라 보안이 아니다. 진짜 권한 확인은 나중에 백엔드가 한다.
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (!isAdmin) {
    return <p className="p-8 text-gray-500">권한을 확인하는 중...</p>;
  }

  return <>{children}</>;
}
