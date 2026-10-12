"use client";

import { useState } from "react";
import { maskEmail, maskPhone } from "@/lib/format";
import type { User } from "@/types/user";

// 내 정보 보기 (이메일, 전화번호는 가려서 보여주고 "보기" 버튼으로 표시)
export default function ProfileInfo({ user, onEdit }: { user: User; onEdit: () => void }) {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="rounded-lg border bg-white p-6">
      <dl className="grid grid-cols-[80px_1fr] items-center gap-y-4 text-sm">
        <dt className="text-gray-500">이름</dt>
        <dd>{user.name}</dd>

        <dt className="text-gray-500">이메일</dt>
        <dd className="flex flex-wrap items-center gap-2">
          <span>{showEmail ? user.email : maskEmail(user.email)}</span>
          <ShowButton shown={showEmail} onClick={() => setShowEmail(!showEmail)} />
          <span className="text-xs text-gray-400">수정 불가</span>
        </dd>

        <dt className="text-gray-500">전화번호</dt>
        <dd className="flex flex-wrap items-center gap-2">
          <span>{showPhone ? user.phone : maskPhone(user.phone)}</span>
          <ShowButton shown={showPhone} onClick={() => setShowPhone(!showPhone)} />
        </dd>

        <dt className="text-gray-500">비밀번호</dt>
        <dd>••••••••</dd>
      </dl>

      <button
        type="button"
        onClick={onEdit}
        className="mt-6 rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        수정
      </button>
    </div>
  );
}

function ShowButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
    >
      {shown ? "숨기기" : "보기"}
    </button>
  );
}
