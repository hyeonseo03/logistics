import Image from "next/image";
import CategoryIcon, { getCategoryStyle } from "@/components/product/CategoryIcon";
import { imageSrc } from "@/lib/api";

// 크기별 아이콘·글자 크기
const sizeStyles = {
  small: { icon: "h-8 w-8", text: "" }, // 장바구니·주문 내역 썸네일 (글자 없이 아이콘만)
  medium: { icon: "h-14 w-14", text: "text-xs" }, // 상품 목록 카드
  large: { icon: "h-24 w-24", text: "text-sm" }, // 상품 상세
};

// 정사각형 상품 이미지. 상품 목록·상세·장바구니·주문 내역에서 모두 이 컴포넌트를 쓴다
// - 사진이 있으면 사진
// - 사진이 없으면 카테고리별 색과 아이콘이 들어간 일러스트 카드
// 크기는 감싸는 쪽에서 정한다 (예: 감싸는 div 에 "w-20" / "w-full")
export default function ProductImage({
  imageUrl,
  name,
  categoryName,
  size = "medium",
  className = "",
}: {
  imageUrl: string | null;
  name: string;
  categoryName?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative aspect-square overflow-hidden rounded bg-gray-100 ${className}`}>
        {/* unoptimized: 백엔드(다른 주소)에 있는 사진을 그대로 불러온다 */}
        <Image
          src={imageSrc(imageUrl)}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
    );
  }

  const style = getCategoryStyle(categoryName);
  const sizeStyle = sizeStyles[size];

  return (
    <div
      role="img"
      aria-label={`${name} (${categoryName ?? "상품"} 일러스트)`}
      className={`relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded ${style.background} ${style.color} ${className}`}
    >
      {/* 배경 장식 원 */}
      <span className="absolute -right-6 -top-6 h-1/2 w-1/2 rounded-full bg-white/40" aria-hidden="true" />
      <span className="absolute -bottom-8 -left-8 h-1/2 w-1/2 rounded-full bg-white/30" aria-hidden="true" />

      <CategoryIcon categoryName={categoryName} className={`relative ${sizeStyle.icon}`} />
      {size !== "small" && categoryName && (
        <span className={`relative font-semibold ${sizeStyle.text}`}>{categoryName}</span>
      )}
    </div>
  );
}
