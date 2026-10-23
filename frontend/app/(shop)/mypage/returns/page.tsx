import ClaimList from "@/components/order/ClaimList";

export default function MyReturnsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">반품(회수) 내역</h1>
      <p className="mt-1 text-sm text-gray-500">
        출고 후에 취소한 주문입니다. 택배 기사님이 상품을 회수하면 환불됩니다.
      </p>
      <div className="mt-6">
        <ClaimList type="RETURN" emptyText="반품(회수) 내역이 없습니다." />
      </div>
    </div>
  );
}
