import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">Logistics</h1>
      <p className="mt-2 text-gray-600">주문해도 되돌릴 수 있는 물류 쇼핑몰</p>
      <div className="mt-6 flex gap-3">
        <Link href="/products" className="rounded bg-blue-600 px-4 py-2 text-white">
          상품 보러 가기
        </Link>
        <Link href="/mypage/shipments" className="rounded border px-4 py-2">
          배송 조회
        </Link>
      </div>
    </div>
  );
}
