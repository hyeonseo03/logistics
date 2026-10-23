"use client";

import { useState } from "react";
import type { InventoryCell } from "@/types/admin";

// 재고 표의 칸 하나: 판매가능재고를 보여주고, [조정] 을 누르면 현재재고(실물)를 바꿀 수 있다
// 이 센터에서 취급하지 않는 상품(quantity === null)은 [+ 입고] 로 새로 넣을 수 있다
export default function InventoryCellEditor({
  cell,
  label,
  onSave,
}: {
  cell: InventoryCell;
  label: string; // 화면 읽기용 이름 (예: "무선 이어폰 · 서울 물류센터")
  onSave: (quantity: number) => Promise<boolean>; // 저장 성공하면 true
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(String(cell.quantity ?? 0));
    setError("");
    setEditing(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = Number(value);
    if (value.trim() === "" || !Number.isInteger(quantity) || quantity < 0) {
      setError("0 이상의 정수");
      return;
    }
    if (quantity < cell.reservedQuantity) {
      setError(`예약 ${cell.reservedQuantity}개 이상`);
      return;
    }
    setSaving(true);
    const ok = await onSave(quantity);
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col items-end gap-1">
        <div className="flex gap-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            autoFocus
            aria-label={`${label} 현재재고`}
            className="w-16 rounded border px-2 py-1 text-right"
          />
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:bg-gray-400">
            {saving ? "…" : "저장"}
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded border px-2 py-1 text-xs">
            취소
          </button>
        </div>
        <span className="text-xs font-normal text-gray-400">현재재고(실물)를 입력</span>
        {error && <span className="text-xs font-normal text-red-600">{error}</span>}
      </form>
    );
  }

  if (cell.quantity === null) {
    return (
      <button type="button" onClick={startEdit} className="text-xs text-gray-400 hover:text-blue-600" aria-label={`${label} 입고`}>
        - <span className="underline">+ 입고</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <span>
        {cell.availableQuantity}
        {/* 색만으로 구분하지 않도록 글자도 붙인다 */}
        {cell.lowStock && <span className="ml-1 text-xs">(부족)</span>}
      </span>
      <span className="text-xs font-normal text-gray-400">
        현재 {cell.quantity} / 예약 {cell.reservedQuantity}
      </span>
      <button
        type="button"
        onClick={startEdit}
        className="mt-1 rounded border px-2 py-0.5 text-xs font-normal text-gray-600 hover:bg-white"
        aria-label={`${label} 재고 조정`}
      >
        조정
      </button>
    </div>
  );
}
