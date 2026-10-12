import ClaimList from "@/components/order/ClaimList";

export default function MyCancellationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">취소 내역</h1>
      <div className="mt-6">
        <ClaimList types={["CANCEL"]} emptyText="취소 내역이 없습니다." />
      </div>
    </div>
  );
}
