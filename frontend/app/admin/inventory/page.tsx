"use client";

import { useEffect, useState } from "react";
import { getInventoryTable } from "@/lib/api";
import type { InventoryTable } from "@/types/admin";

export default function AdminInventoryPage() {
  const [table, setTable] = useState<InventoryTable | null>(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false); // 부족 재고만 보기

  useEffect(() => {
    getInventoryTable().then(setTable);
  }, []);

  if (!table) {
    return <p className="p-8 text-gray-500">불러오는 중...</p>;
  }

  const rows = onlyLowStock
    ? table.rows.filter((row) => row.cells.some((cell) => cell.lowStock))
    : table.rows;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">재고 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        재고가 {table.lowStockThreshold}개 미만이면 <span className="font-semibold text-red-600">빨간색</span>
        으로 표시됩니다. &quot;-&quot; 는 해당 물류센터에서 취급하지 않는 상품입니다.
      </p>

      <label className="mt-6 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyLowStock} onChange={(e) => setOnlyLowStock(e.target.checked)} />
        부족 재고가 있는 상품만 보기
      </label>

      <div className="mt-4 overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">상품</th>
              <th className="px-4 py-3 text-left">카테고리</th>
              {table.warehouses.map((warehouse) => (
                <th key={warehouse.id} className="px-4 py-3 text-right">
                  {warehouse.name}
                </th>
              ))}
              <th className="px-4 py-3 text-right">합계</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.productId}>
                <td className="px-4 py-3">{row.productName}</td>
                <td className="px-4 py-3 text-gray-500">{row.categoryName}</td>
                {row.cells.map((cell) => (
                  <td
                    key={cell.warehouseId}
                    className={`px-4 py-3 text-right ${cell.lowStock ? "bg-red-50 font-bold text-red-600" : ""}`}
                  >
                    {cell.quantity === null ? (
                      <span className="text-gray-300">-</span>
                    ) : (
                      <>
                        {cell.quantity}
                        {/* 색만으로 구분하지 않도록 글자도 붙인다 */}
                        {cell.lowStock && <span className="ml-1 text-xs">(부족)</span>}
                      </>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold">{row.totalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
