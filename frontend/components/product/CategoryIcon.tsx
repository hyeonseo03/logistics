// 카테고리별 색과 아이콘 (상품 이미지 일러스트, 홈 카테고리 바로가기에서 같이 쓴다)

interface CategoryStyle {
  background: string; // 배경 (연한 그라데이션)
  color: string; // 아이콘·글자 색
  icon: React.ReactNode; // 24x24 선 아이콘 (svg 안에 들어갈 path)
}

const categoryStyles: Record<string, CategoryStyle> = {
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
const defaultStyle: CategoryStyle = {
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

export function getCategoryStyle(categoryName: string | undefined): CategoryStyle {
  return (categoryName && categoryStyles[categoryName]) || defaultStyle;
}

// 카테고리 아이콘 하나 (크기는 className 으로: 예 "h-8 w-8")
export default function CategoryIcon({ categoryName, className = "" }: { categoryName?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {getCategoryStyle(categoryName).icon}
    </svg>
  );
}
