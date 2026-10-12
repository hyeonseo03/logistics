import Image from "next/image";

// 정사각형 상품 이미지
// imageUrl 이 없으면 회색 박스에 "이미지 준비중" 을 보여준다. (상품 사진은 나중에 넣을 예정)
// 크기는 감싸는 쪽에서 className 으로 정한다 (예: "w-20" / "w-full")
export default function ProductImage({
  imageUrl,
  name,
  className = "",
  textSize = "text-sm",
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
  textSize?: string; // "이미지 준비중" 글자 크기 (작은 썸네일에서는 작게)
}) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded bg-gray-100 ${className}`}>
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
      ) : (
        <div className={`flex h-full items-center justify-center p-1 text-center text-gray-400 ${textSize}`}>
          이미지 준비중
        </div>
      )}
    </div>
  );
}
