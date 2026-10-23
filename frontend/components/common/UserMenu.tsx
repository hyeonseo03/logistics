"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import { useToast } from "@/components/common/Toast";

// 헤더 오른쪽
// - 로그인 전: [로그인] [회원가입]
// - 로그인 후: 이름님 · [로그아웃]  (관리자면 [관리자] 메뉴도)
export default function UserMenu() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // 로그인 정보를 확인하는 동안에는 자리만 차지한다 (버튼이 깜빡이지 않게)
  if (loading) return <span className="inline-block h-8 w-28" aria-hidden="true" />;

  if (!user) {
    // 로그인·회원가입 후 지금 보던 화면으로 돌아오게 한다 (로그인·회원가입 화면 자신은 제외)
    const stayHere = pathname !== "/" && pathname !== "/login" && pathname !== "/signup";
    const query = stayHere ? `?redirect=${encodeURIComponent(pathname)}` : "";
    return (
      <>
        <Link href={`/login${query}`} className="rounded border px-3 py-1.5 hover:bg-gray-50">
          로그인
        </Link>
        <Link href={`/signup${query}`} className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
          회원가입
        </Link>
      </>
    );
  }

  async function handleLogout() {
    await logout();
    showToast("로그아웃되었습니다.");
    router.push("/");
  }

  return (
    <>
      {user.role === "ADMIN" && (
        <Link href="/admin" className="rounded bg-gray-800 px-3 py-1.5 text-white hover:bg-gray-900">
          관리자
        </Link>
      )}
      <span className="max-w-[8rem] truncate text-gray-700">
        <b>{user.name}</b>님
      </span>
      <span className="text-gray-300" aria-hidden="true">
        ·
      </span>
      <button type="button" onClick={handleLogout} className="text-gray-500 hover:text-blue-600">
        로그아웃
      </button>
    </>
  );
}
