"use client";

import { useState } from "react";
import { isValidName, isValidPhone } from "@/lib/validation";
import type { AddressRequest } from "@/types/user";

// 배송지 추가/수정 폼 (추가할 때와 수정할 때 같이 쓴다)
export default function AddressForm({
  initial,
  lockDefault,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: AddressRequest; // 처음 채워둘 값
  lockDefault: boolean; // true 면 "기본 배송지" 체크를 해제할 수 없다 (지금 기본 배송지를 수정할 때)
  submitLabel: string;
  onSubmit: (request: AddressRequest) => Promise<void>; // 실패하면 에러를 던진다
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AddressRequest>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // 입력칸 하나를 바꾼다
  function change(field: keyof AddressRequest, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 입력값 검사
    if (!form.label.trim()) return setError("배송지 이름을 입력해 주세요. (예: 집, 회사)");
    if (!isValidName(form.receiverName)) return setError("받는 사람을 1~20자로 입력해 주세요.");
    if (!isValidPhone(form.receiverPhone)) return setError("전화번호를 010-1234-5678 형식으로 입력해 주세요.");
    if (!form.address.trim()) return setError("주소를 입력해 주세요.");

    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          배송지 이름
          <input
            value={form.label}
            onChange={(e) => change("label", e.target.value)}
            placeholder="집, 회사 등"
            className="rounded border bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          받는 사람
          <input
            value={form.receiverName}
            onChange={(e) => change("receiverName", e.target.value)}
            className="rounded border bg-white px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        전화번호
        <input
          value={form.receiverPhone}
          onChange={(e) => change("receiverPhone", e.target.value)}
          placeholder="010-1234-5678"
          inputMode="tel"
          className="rounded border bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        주소
        <input
          value={form.address}
          onChange={(e) => change("address", e.target.value)}
          placeholder="서울시 강남구 테헤란로 123, 101동 1001호"
          className="rounded border bg-white px-3 py-2"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          disabled={lockDefault}
          onChange={(e) => change("isDefault", e.target.checked)}
        />
        기본 배송지로 설정
        {lockDefault && <span className="text-xs text-gray-400">(다른 배송지를 기본으로 설정하면 해제됩니다)</span>}
      </label>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? "저장 중..." : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded border bg-white px-4 py-2">
          취소
        </button>
      </div>
    </form>
  );
}
