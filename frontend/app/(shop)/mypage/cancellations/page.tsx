import ClaimList from "@/components/order/ClaimList";

export default function MyCancellationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">취소 내역</h1>
      <p className="mt-1 text-sm text-gray-500">출고 전에 취소한 주문입니다. 결제 금액은 바로 환불됩니다.</p>
      <div className="mt-6">
        <ClaimList type="CANCEL" emptyText="취소 내역이 없습니다." />
      </div>
    </div>
  );
}
