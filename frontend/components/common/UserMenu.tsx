"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

// 헤더 오른쪽: 로그인 상태에 따라 "로그인" 또는 "이름 + 로그아웃"을 보여준다
export default function UserMenu() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    return (
      <Link href="/login" className="hover:text-blue-600">
        로그인
      </Link>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <>
      <span>{user.name}님</span>
      {user.role === "ADMIN" && (
        <Link href="/admin" className="hover:text-blue-600">
          관리자
        </Link>
      )}
      <button type="button" onClick={handleLogout} className="hover:text-blue-600">
        로그아웃
      </button>
    </>
  );
}
