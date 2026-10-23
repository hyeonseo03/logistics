"use client";

import { useState } from "react";
import { verifyPassword } from "@/lib/api";

// 내 정보를 보기 전에 비밀번호를 한 번 더 확인하는 화면
export default function PasswordCheck({ onVerified }: { onVerified: () => void }) {
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    setChecking(true);
    setError("");
    try {
      await verifyPassword(password);
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 확인에 실패했습니다.");
      setChecking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm rounded-lg border bg-white p-6">
      <h2 className="font-semibold">비밀번호 확인</h2>
      <p className="mt-1 text-sm text-gray-500">
        개인정보 보호를 위해 비밀번호를 다시 한 번 입력해 주세요.
      </p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        autoComplete="current-password"
        autoFocus
        className="mt-4 w-full rounded border px-3 py-2"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={checking}
        className="mt-4 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {checking ? "확인 중..." : "확인"}
      </button>
    </form>
  );
}
