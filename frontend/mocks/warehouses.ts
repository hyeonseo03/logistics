import type { Warehouse } from "@/types/warehouse";

export const warehouses: Warehouse[] = [
  { id: 1, name: "서울 물류센터", region: "SEOUL", address: "서울시 송파구 문정로 10", sameDayShipping: true },
  { id: 2, name: "경기 물류센터", region: "GYEONGGI", address: "경기도 이천시 마장면 물류로 20", sameDayShipping: true },
  { id: 3, name: "부산 물류센터", region: "BUSAN", address: "부산시 강서구 신항로 30", sameDayShipping: false },
];
