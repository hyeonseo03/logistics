import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

// 관리자 페이지 공통 레이아웃: PC 는 왼쪽 메뉴 + 본문, 모바일은 위쪽 메뉴 + 본문
// AdminGuard 로 감싸서 관리자가 아니면 막는다 (로그인 안 함 → 로그인 화면, 일반 회원 → 권한 없음 안내 후 홈)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1 bg-gray-50">{children}</main>
      </div>
    </AdminGuard>
  );
}
