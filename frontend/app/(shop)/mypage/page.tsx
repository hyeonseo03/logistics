"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import MyPageMenu from "@/components/mypage/MyPageMenu";
import { getMyPageSummary } from "@/lib/api";
import type { MyPageSummary } from "@/types/user";

// 마이페이지 첫 화면: 인사말 + 요약 카드 (+ 모바일에서는 메뉴 목록)
// 개인정보(이메일, 전화번호, 주소)는 여기서 보여주지 않는다 → "내 정보 관리"에서 비밀번호 확인 후 확인
export default function MyPage() {
  const { user } = useAuth(); // 로그인 확인은 layout.tsx 에서 했다
  const [summary, setSummary] = useState<MyPageSummary | null>(null);

  useEffect(() => {
    getMyPageSummary().then(setSummary);
  }, []);

  const cards = [
    { label: "배송중", count: summary?.shippingCount, href: "/mypage/shipments" },
    { label: "취소/반품 진행", count: summary?.claimInProgressCount, href: "/mypage/returns" },
    { label: "재입고 알림", count: summary?.restockAlertCount, href: "/mypage/restock-alerts" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">{user?.name}님, 안녕하세요</h1>
      <p className="mt-1 text-sm text-gray-500">오늘도 Logistics 를 이용해 주셔서 감사합니다.</p>

      {/* 요약 카드 */}
      <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              href={card.href}
              className="block rounded-lg border bg-white p-3 text-center hover:border-blue-400 sm:p-5"
            >
              <p className="text-xs text-gray-500 sm:text-sm">{card.label}</p>
              <p className="mt-1 text-2xl font-bold">
                {card.count ?? "-"}
                <span className="ml-0.5 text-sm font-normal text-gray-500">건</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* 모바일 전용 목록형 메뉴 (PC 에서는 왼쪽 사이드 메뉴가 있으므로 숨긴다) */}
      <div className="mt-8 md:hidden">
        <MyPageMenu variant="list" />
      </div>
    </div>
  );
}
