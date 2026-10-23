"use client";

import { useState } from "react";
import { changePassword, updateMyProfile } from "@/lib/api";
import { PASSWORD_MIN_LENGTH, isValidName, isValidPassword, isValidPhone } from "@/lib/validation";
import type { User } from "@/types/user";

// 입력칸별 에러 메시지 (문제가 없으면 빈 문자열)
interface FormErrors {
  name: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 내 정보 수정 폼: 이름, 전화번호, 비밀번호 (이메일은 수정 불가)
export default function ProfileEditForm({
  user,
  onSaved,
  onCancel,
}: {
  user: User;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [serverError, setServerError] = useState(""); // 저장 요청이 실패했을 때
  const [saving, setSaving] = useState(false);

  // 입력값 검사. 문제가 있는 칸마다 메시지를 채운다
  function validate(): FormErrors {
    const result: FormErrors = { name: "", phone: "", currentPassword: "", newPassword: "", confirmPassword: "" };

    if (!isValidName(name)) result.name = "이름을 1~20자로 입력해 주세요.";
    if (!isValidPhone(phone)) result.phone = "010-1234-5678 형식으로 입력해 주세요.";

    // 비밀번호는 입력했을 때만 검사 (비워두면 변경하지 않음)
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        result.currentPassword = "비밀번호를 바꾸려면 현재 비밀번호를 입력해 주세요.";
      }
      if (!isValidPassword(newPassword)) {
        result.newPassword = `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
      }
      if (newPassword !== confirmPassword) {
        result.confirmPassword = "비밀번호가 일치하지 않습니다.";
      }
    }
    return result;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = validate();
    setErrors(result);
    const hasError = Object.values(result).some((message) => message !== "");
    if (hasError) return;

    setSaving(true);
    setServerError("");
    try {
      // 비밀번호를 먼저 바꾼다 (현재 비밀번호가 틀리면 여기서 멈춰서 이름·전화번호도 바뀌지 않는다)
      if (newPassword) {
        await changePassword({ currentPassword, newPassword });
      }
      await updateMyProfile({ name: name.trim(), phone });
      onSaved();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border bg-white p-6 text-sm">
      <Field label="이메일">
        <input value={user.email} disabled className="rounded border bg-gray-100 px-3 py-2 text-gray-500" />
        <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다.</p>
      </Field>

      <Field label="이름" error={errors.name}>
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded border px-3 py-2" />
      </Field>

      <Field label="전화번호" error={errors.phone}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-1234-5678"
          inputMode="tel"
          className="rounded border px-3 py-2"
        />
      </Field>

      <Field label="현재 비밀번호" error={errors.currentPassword}>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="비밀번호를 바꿀 때만 입력하세요"
          autoComplete="current-password"
          className="rounded border px-3 py-2"
        />
      </Field>

      <Field label="새 비밀번호" error={errors.newPassword}>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={`변경하지 않으려면 비워두세요 (${PASSWORD_MIN_LENGTH}자 이상)`}
          autoComplete="new-password"
          className="rounded border px-3 py-2"
        />
      </Field>

      <Field label="새 비밀번호 확인" error={errors.confirmPassword}>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="rounded border px-3 py-2"
        />
      </Field>

      {serverError && <p className="text-red-600">{serverError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded border px-6 py-2 hover:bg-gray-50">
          취소
        </button>
      </div>
    </form>
  );
}

// 라벨 + 입력칸 + 에러 메시지 묶음
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
