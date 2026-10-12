// 필터용 둥근 버튼 (선택되면 파란색)
export default function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1 text-sm ${
        active ? "border-blue-600 bg-blue-600 text-white" : "bg-white hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
