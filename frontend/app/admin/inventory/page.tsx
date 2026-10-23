"use client";

import { useEffect, useState } from "react";
import InventoryCellEditor from "@/components/admin/InventoryCellEditor";
import { useToast } from "@/components/common/Toast";
import { adjustInventory, getInventoryTable } from "@/lib/api";
import type { InventoryTable } from "@/types/admin";

// 재고 관리: 상품 × 물류센터 표. 칸마다 [조정] 으로 현재재고(실물)를 바꾼다
export default function AdminInventoryPage() {
  const [table, setTable] = useState<InventoryTable | null>(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false); // 부족 재고만 보기
  const [error, setError] = useState(""); // 재고 정보를 못 불러왔을 때 안내 (예: 백엔드 서버가 꺼져 있음)
  const [reloadKey, setReloadKey] = useState(0); // 값을 바꾸면 표를 다시 불러온다
  const { showToast } = useToast();

  useEffect(() => {
    let ignore = false;
    getInventoryTable()
      .then((data) => {
        if (!ignore) setTable(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "재고 정보를 불러올 수 없습니다.");
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // 저장 성공하면 true (칸의 입력창을 닫는다). 성공·실패 모두 알림을 띄우고 표를 새로고침한다
  async function handleSave(productName: string, warehouseName: string, productId: number, warehouseId: number, quantity: number) {
    try {
      await adjustInventory(productId, warehouseId, quantity);
      showToast(`${productName} · ${warehouseName} 현재재고를 ${quantity}개로 바꿨습니다.`);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "재고를 바꾸지 못했습니다.", "error");
      return false;
    } finally {
      setReloadKey((key) => key + 1);
    }
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl font-bold">재고 관리</h1>
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      </div>
    );
  }

  if (!table) {
    return <p className="p-8 text-gray-500">불러오는 중...</p>;
  }

  const rows = onlyLowStock ? table.rows.filter((row) => row.cells.some((cell) => cell.lowStock)) : table.rows;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">재고 관리</h1>
      <ul className="mt-2 list-inside list-disc text-sm text-gray-500">
        <li>
          큰 숫자는 <b>판매가능재고</b> (= 현재재고 - 예약재고). {table.lowStockThreshold}개 미만이면{" "}
          <span className="font-semibold text-red-600">빨간색</span>입니다.
        </li>
        <li>[조정] 으로 물류센터의 현재재고(실물)를 바꿉니다. 주문으로 예약된 수량보다 적게는 바꿀 수 없습니다.</li>
        <li>&quot;-&quot; 는 그 물류센터에서 취급하지 않는 상품입니다. [+ 입고] 로 새로 넣을 수 있습니다.</li>
      </ul>

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
                <th key={warehouse.id} className="whitespace-nowrap px-4 py-3 text-right">
                  {warehouse.name}
                </th>
              ))}
              <th className="px-4 py-3 text-right">판매가능 합계</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.productId}>
                <td className="px-4 py-3">{row.productName}</td>
                <td className="px-4 py-3 text-gray-500">{row.categoryName}</td>
                {row.cells.map((cell, index) => {
                  const warehouse = table.warehouses[index];
                  return (
                    <td
                      key={cell.warehouseId}
                      className={`px-4 py-3 text-right align-top ${cell.lowStock ? "bg-red-50 font-bold text-red-600" : ""}`}
                    >
                      <InventoryCellEditor
                        cell={cell}
                        label={`${row.productName} · ${warehouse.name}`}
                        onSave={(quantity) =>
                          handleSave(row.productName, warehouse.name, row.productId, cell.warehouseId, quantity)
                        }
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right align-top font-semibold">{row.totalAvailable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
