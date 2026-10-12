import RestockAlertList from "@/components/mypage/RestockAlertList";

export default function MyRestockAlertsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">재입고 알림 목록</h1>
      <p className="mt-1 text-sm text-gray-500">상품이 다시 입고되면 알려드려요.</p>
      <div className="mt-6">
        <RestockAlertList />
      </div>
    </div>
  );
}
