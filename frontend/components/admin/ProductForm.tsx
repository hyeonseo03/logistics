"use client";

import { useState } from "react";
import ImagePicker from "@/components/admin/ImagePicker";
import type { Category, ProductRequest } from "@/types/product";

// 관리자 상품 등록/수정 폼 (등록할 때와 수정할 때 같이 쓴다)
// 사진을 고르면 "저장" 할 때 상품 정보와 함께 올라간다 (onSubmit 의 두 번째 값)
export default function ProductForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  categories: Category[];
  initial: ProductRequest; // 처음 채워둘 값 (imageUrl 은 지금 등록된 사진)
  submitLabel: string;
  onSubmit: (request: ProductRequest, imageFile: File | null) => Promise<void>; // 실패하면 에러를 던진다
  onCancel: () => void;
}) {
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(String(initial.price));
  const [optionName, setOptionName] = useState(initial.optionName ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null); // 새로 고른 사진
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 입력값 검사 (백엔드도 한 번 더 검사한다)
    const priceNumber = Number(price);
    if (!categoryId) return setError("카테고리를 선택해 주세요.");
    if (!name.trim()) return setError("상품 이름을 입력해 주세요.");
    if (name.trim().length > 100) return setError("상품 이름은 100자 이하로 입력해 주세요.");
    if (!description.trim()) return setError("상품 설명을 입력해 주세요.");
    if (!Number.isInteger(priceNumber) || priceNumber < 0) return setError("가격은 0 이상의 정수로 입력해 주세요.");

    setSaving(true);
    setError("");
    try {
      await onSubmit(
        {
          categoryId,
          name: name.trim(),
          description: description.trim(),
          price: priceNumber,
          optionName: optionName.trim() || null,
          imageUrl: initial.imageUrl, // 사진은 이미지 업로드 API 로만 바꾼다 (수정할 때 기존 사진 유지)
        },
        imageFile
      );
      // 저장에 성공하면 고른 사진은 올라갔으므로 비운다
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            카테고리
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="rounded border px-3 py-2"
            >
              <option value={0}>선택하세요</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            상품 이름
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1">
            가격 (원)
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            옵션 (선택)
            <input
              value={optionName}
              onChange={(e) => setOptionName(e.target.value)}
              placeholder="예: 화이트 / L"
              className="rounded border px-3 py-2"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          상품 설명
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded border px-3 py-2"
          />
        </label>

        <ImagePicker
          currentImageUrl={initial.imageUrl}
          productName={name}
          categoryName={categories.find((c) => c.id === categoryId)?.name}
          preview={imagePreview}
          onSelect={(file, preview) => {
            setImageFile(file);
            setImagePreview(preview);
          }}
          onClear={() => {
            setImageFile(null);
            setImagePreview(null);
          }}
        />

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? "저장 중..." : submitLabel}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className="rounded border px-4 py-2 hover:bg-gray-50">
            닫기
          </button>
        </div>
      </form>
    </div>
  );
}
