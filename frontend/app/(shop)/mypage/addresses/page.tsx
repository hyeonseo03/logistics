import AddressManager from "@/components/mypage/AddressManager";

export default function MyAddressesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">배송지 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        기본 배송지는 주문할 때 자동으로 채워지고, 도착 예정일 계산에도 쓰입니다.
      </p>
      <div className="mt-6">
        <AddressManager />
      </div>
    </div>
  );
}
