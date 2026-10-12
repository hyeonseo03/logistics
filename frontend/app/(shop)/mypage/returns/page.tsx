import ClaimList from "@/components/order/ClaimList";

export default function MyReturnsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">반품/교환 내역</h1>
      <div className="mt-6">
        <ClaimList types={["RETURN", "EXCHANGE"]} emptyText="반품/교환 내역이 없습니다." />
      </div>
    </div>
  );
}
