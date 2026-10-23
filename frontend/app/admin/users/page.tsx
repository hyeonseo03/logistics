"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/common/Pagination";
import { getAdminUsers } from "@/lib/api";
import { formatDateTime, maskPhone } from "@/lib/format";
import type { AdminUser, Page } from "@/types/admin";

// 회원 목록 (최근 가입 순, 20명씩). 개인정보 보호를 위해 전화번호는 가려서 보여준다
export default function AdminUsersPage() {
  const [data, setData] = useState<Page<AdminUser> | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    getAdminUsers(page)
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "회원 목록을 불러오지 못했습니다.");
      });
    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">회원 관리</h1>
      <p className="mt-1 text-sm text-gray-500">최근 가입한 회원이 위에 있습니다.</p>

      {error && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {!data ? (
        !error && <p className="mt-10 text-gray-500">불러오는 중...</p>
      ) : (
        <>
          <p className="mt-6 text-sm text-gray-500">총 {data.totalElements}명</p>
          <div className="mt-2 overflow-x-auto rounded border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3">번호</th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3">전화번호</th>
                  <th className="px-4 py-3">권한</th>
                  <th className="px-4 py-3 text-right">주문 수</th>
                  <th className="px-4 py-3">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.content.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">{maskPhone(user.phone)}</td>
                    <td className="px-4 py-3">
                      {user.role === "ADMIN" ? (
                        <span className="rounded bg-gray-800 px-2 py-0.5 text-white">관리자</span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-0.5">회원</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{user.orderCount}건</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
