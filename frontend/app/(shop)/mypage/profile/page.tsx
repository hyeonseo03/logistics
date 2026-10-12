"use client";

import { useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import PasswordCheck from "@/components/mypage/PasswordCheck";
import ProfileEditForm from "@/components/mypage/ProfileEditForm";
import ProfileInfo from "@/components/mypage/ProfileInfo";

// 내 정보 관리
// 1) 비밀번호 확인 → 2) 내 정보 보기 (가림 처리) ⇄ 3) 수정 폼
// 비밀번호 확인 여부는 이 화면에만 기억한다 (다른 메뉴로 갔다 오면 다시 확인)
export default function MyProfilePage() {
  const { user, refreshUser } = useAuth(); // 로그인 확인은 layout.tsx 에서 했다
  const [verified, setVerified] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(""); // 저장 완료 안내

  async function handleSaved() {
    await refreshUser(); // 헤더의 이름 등도 바뀐 정보로
    setEditing(false);
    setMessage("저장되었습니다.");
  }

  if (!user) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">내 정보 관리</h1>

      <div className="mt-6">
        {!verified ? (
          <PasswordCheck onVerified={() => setVerified(true)} />
        ) : editing ? (
          <ProfileEditForm user={user} onSaved={handleSaved} onCancel={() => setEditing(false)} />
        ) : (
          <>
            {message && (
              <p className="mb-4 rounded bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>
            )}
            <ProfileInfo
              user={user}
              onEdit={() => {
                setMessage("");
                setEditing(true);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
