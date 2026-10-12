"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import type { UserRole } from "@/types/user";

// 가짜 로그인: 아이디/비밀번호 없이 역할만 골라서 로그인한다
export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(role: UserRole) {
    setSubmitting(true);
    await login(role);
    // 고객은 홈으로, 관리자는 관리자 대시보드로
    router.push(role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">로그인</h1>
      <p className="mt-2 text-sm text-gray-500">
        지금은 테스트용 가짜 로그인입니다. 역할을 골라 주세요.
      </p>

      {user && (
        <p className="mt-4 rounded bg-gray-100 p-3 text-sm">
          현재 <b>{user.name}</b>({user.role === "ADMIN" ? "관리자" : "고객"})로 로그인되어 있습니다.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleLogin("CUSTOMER")}
          className="rounded bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          고객 로그인
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleLogin("ADMIN")}
          className="rounded bg-gray-800 py-3 text-white hover:bg-gray-900 disabled:bg-gray-400"
        >
          관리자 로그인
        </button>
      </div>

      <Link href="/signup" className="mt-6 inline-block text-sm text-blue-600 underline">
        아직 회원이 아니라면? 회원가입
      </Link>
    </div>
  );
}
