"use client";

// [-] 3 [+] 모양의 수량 선택기
export default function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded border">
      <button
        type="button"
        className="px-3 py-1 disabled:text-gray-300"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
      >
        -
      </button>
      <span className="w-10 text-center">{value}</span>
      <button
        type="button"
        className="px-3 py-1 disabled:text-gray-300"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
