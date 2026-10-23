"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import { ApiError, signup } from "@/lib/api";
import { PASSWORD_MIN_LENGTH, isValidEmail, isValidName, isValidPassword, isValidPhone } from "@/lib/validation";

// 입력칸별 에러 메시지 (문제가 없으면 빈 문자열)
interface FormErrors {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
}

const noErrors: FormErrors = { email: "", password: "", passwordConfirm: "", name: "", phone: "" };

// 회원가입 폼: 가입에 성공하면 자동으로 로그인하고 원래 보던 화면(redirect)으로 이동한다
export default function SignupForm({ redirect }: { redirect: string | null }) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<FormErrors>(noErrors);
  const [serverError, setServerError] = useState(""); // 입력칸과 관계없는 실패 (서버 연결 실패 등)
  const [submitting, setSubmitting] = useState(false);

  // 입력값 검사 (백엔드도 같은 규칙으로 한 번 더 검사한다)
  function validate(): FormErrors {
    const result: FormErrors = { ...noErrors };
    if (!isValidEmail(email)) result.email = "이메일 형식이 올바르지 않습니다. (예: me@example.com)";
    if (!isValidPassword(password)) result.password = `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
    if (password !== passwordConfirm) result.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!isValidName(name)) result.name = "이름을 1~20자로 입력해 주세요.";
    if (!isValidPhone(phone)) result.phone = "010-1234-5678 형식으로 입력해 주세요.";
    return result;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = validate();
    setErrors(result);
    setServerError("");
    if (Object.values(result).some((message) => message !== "")) return;

    setSubmitting(true);
    try {
      await signup({ email: email.trim(), password, name: name.trim(), phone });
    } catch (err) {
      // 이미 가입된 이메일(409)은 이메일 칸 아래에 보여준다
      if (err instanceof ApiError && err.code === "DUPLICATE_EMAIL") {
        setErrors({ ...noErrors, email: err.message });
      } else {
        setServerError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
      }
      setSubmitting(false);
      return;
    }

    // 가입 성공 → 바로 로그인 → 원래 화면으로
    try {
      await login(email.trim(), password);
      router.replace(redirect ?? "/");
    } catch {
      // 가입은 됐는데 로그인만 실패한 경우 (드물다) → 로그인 화면으로
      router.replace(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
    }
  }

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="text-2xl font-bold">회원가입</h1>
      <p className="mt-2 text-sm text-gray-500">가입하면 바로 로그인되어 쇼핑을 이어갈 수 있어요.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-sm" noValidate>
        <Field label="이메일" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="me@example.com"
            autoComplete="email"
            className="rounded border px-3 py-2"
          />
        </Field>

        <Field label="비밀번호" error={errors.password}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`${PASSWORD_MIN_LENGTH}자 이상`}
            autoComplete="new-password"
            className="rounded border px-3 py-2"
          />
        </Field>

        <Field label="비밀번호 확인" error={errors.passwordConfirm}>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            className="rounded border px-3 py-2"
          />
        </Field>

        <Field label="이름" error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="rounded border px-3 py-2"
          />
        </Field>

        <Field label="전화번호" error={errors.phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            inputMode="tel"
            autoComplete="tel"
            className="rounded border px-3 py-2"
          />
        </Field>

        {serverError && <p className="text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? "가입하는 중..." : "가입하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        이미 회원이신가요?{" "}
        <Link href={loginHref} className="font-semibold text-blue-600 underline">
          로그인
        </Link>
      </p>
    </div>
  );
}

// 라벨 + 입력칸 + 에러 메시지 묶음
function Field({ label, error, children }: { label: string; error: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
