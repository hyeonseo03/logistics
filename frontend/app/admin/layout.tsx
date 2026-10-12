import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

// 관리자 페이지 공통 레이아웃: 왼쪽 사이드바 + 본문
// AdminGuard 로 감싸서 관리자가 아니면 홈으로 보낸다
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </AdminGuard>
  );
}
