"use client";

import Image from "next/image";
import { useState } from "react";
import ProductImage from "@/components/product/ProductImage";

// 백엔드와 같은 규칙 (ProductImageService): jpg, png, webp / 5MB 이하
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// 상품 사진 고르기 + 미리보기
// - 고른 파일은 바로 올리지 않고 부모(ProductForm)에 알려준다. "저장" 할 때 함께 올라간다
// - 파일 형식·크기는 여기서 먼저 검사하고, 백엔드가 한 번 더 검사한다
export default function ImagePicker({
  currentImageUrl,
  productName,
  categoryName,
  preview,
  onSelect,
  onClear,
}: {
  currentImageUrl: string | null; // 지금 등록된 사진 (없으면 카테고리 일러스트)
  productName: string;
  categoryName?: string;
  preview: string | null; // 새로 고른 사진의 미리보기 (data: 주소)
  onSelect: (file: File, preview: string) => void;
  onClear: () => void;
}) {
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 onChange 가 불리도록 비운다
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("jpg, png, webp 형식의 이미지만 올릴 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError(`이미지는 5MB 이하만 올릴 수 있습니다. (고른 파일: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    // 파일을 화면에 보여줄 수 있는 주소(data:...)로 읽는다
    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      onSelect(file, String(reader.result));
    };
    reader.onerror = () => setError("파일을 읽지 못했습니다.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <span>상품 사진 (선택)</span>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-28 shrink-0">
          {preview ? (
            <div className="relative aspect-square overflow-hidden rounded border-2 border-blue-400">
              <Image src={preview} alt="새 사진 미리보기" fill unoptimized className="object-cover" />
            </div>
          ) : (
            <ProductImage imageUrl={currentImageUrl} name={productName || "새 상품"} categoryName={categoryName} />
          )}
          <p className="mt-1 text-center text-xs text-gray-500">
            {preview ? "새 사진 (저장 시 반영)" : currentImageUrl ? "현재 사진" : "사진 없음"}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="inline-block cursor-pointer rounded border bg-white px-3 py-2 text-center hover:bg-gray-50">
            사진 고르기
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChange}
              className="sr-only"
            />
          </label>
          {preview && (
            <button type="button" onClick={onClear} className="rounded border px-3 py-2 text-gray-600 hover:bg-gray-50">
              선택 취소
            </button>
          )}
          <p className="text-xs text-gray-500">jpg, png, webp · 5MB 이하</p>
        </div>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
