import Image from "next/image";
import { imageSrc } from "@/lib/api";

// 카테고리별 일러스트 색과 아이콘 (사진이 없는 상품에 보여준다)
const categoryStyles: Record<string, { background: string; color: string; icon: React.ReactNode }> = {
  식품: {
    background: "bg-gradient-to-br from-green-50 to-green-100",
    color: "text-green-600",
    icon: (
      <>
        <path d="M12 7c-1.5-1.5-5-1.6-6 1.4-1 3 .5 8 3 9.6 1.2.8 2 .3 3 .3s1.8.5 3-.3c2.5-1.6 4-6.6 3-9.6-1-3-4.5-2.9-6-1.4z" />
        <path d="M12 7c0-2 1-3.5 3-4" />
      </>
    ),
  },
  생활용품: {
    background: "bg-gradient-to-br from-sky-50 to-sky-100",
    color: "text-sky-600",
    icon: (
      <>
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
  },
  전자기기: {
    background: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    color: "text-indigo-600",
    icon: (
      <>
        <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
        <rect x="3" y="14" width="4" height="6" rx="1.5" />
        <rect x="17" y="14" width="4" height="6" rx="1.5" />
      </>
    ),
  },
  패션: {
    background: "bg-gradient-to-br from-pink-50 to-pink-100",
    color: "text-pink-600",
    icon: <path d="M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z" />,
  },
};

// 모르는 카테고리일 때 (상자 아이콘)
const defaultStyle = {
  background: "bg-gradient-to-br from-gray-50 to-gray-100",
  color: "text-gray-500",
  icon: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </>
  ),
};

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

  const style = (categoryName && categoryStyles[categoryName]) || defaultStyle;
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

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`relative ${sizeStyle.icon}`}
        aria-hidden="true"
      >
        {style.icon}
      </svg>
      {size !== "small" && categoryName && (
        <span className={`relative font-semibold ${sizeStyle.text}`}>{categoryName}</span>
      )}
    </div>
  );
}
