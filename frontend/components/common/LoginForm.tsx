"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/common/AuthContext";

// 이메일·비밀번호 로그인 폼
// redirect: 로그인 후 돌아갈 주소 (없으면 관리자는 /admin, 일반 회원은 홈)
export default function LoginForm({ redirect }: { redirect: string | null }) {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const loggedInUser = await login(email.trim(), password);
      router.replace(redirect ?? (loggedInUser.role === "ADMIN" ? "/admin" : "/"));
    } catch (err) {
      // 이메일이 없을 때와 비밀번호가 틀릴 때 백엔드는 같은 메시지를 준다
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setSubmitting(false);
    }
  }

  // 회원가입 화면으로 갈 때도 돌아갈 주소를 그대로 넘긴다
  const signupHref = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup";

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="text-2xl font-bold">로그인</h1>
      {redirect && <p className="mt-2 text-sm text-gray-500">로그인하면 보던 화면으로 돌아갑니다.</p>}

      {user && (
        <p className="mt-4 rounded bg-gray-100 p-3 text-sm">
          현재 <b>{user.name}</b>님으로 로그인되어 있습니다. 다른 계정으로 로그인할 수 있어요.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3" noValidate>
        <label className="flex flex-col gap-1 text-sm">
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded border px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        아직 회원이 아니신가요?{" "}
        <Link href={signupHref} className="font-semibold text-blue-600 underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
