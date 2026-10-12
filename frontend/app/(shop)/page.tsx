import Link from "next/link";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export default function HomePage() {
  return (
    <PagePlaceholder title="홈">
      <Link href="/products" className="text-blue-600 underline">
        상품 보러 가기
      </Link>
    </PagePlaceholder>
  );
}
