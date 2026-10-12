import type { Product } from "@/types/product";

// 상품 사진은 나중에 넣을 예정. 지금은 모두 null → 화면에 "이미지 준비중" 회색 박스로 보여준다
export const products: Product[] = [
  { id: 1, categoryId: 1, name: "제주 감귤 3kg", description: "새콤달콤한 제주산 햇감귤입니다.", price: 19900, optionName: null, imageUrl: null, createdAt: "2026-08-05T09:00:00+09:00" },
  { id: 2, categoryId: 1, name: "유기농 현미 10kg", description: "국내산 유기농 현미입니다.", price: 38000, optionName: null, imageUrl: null, createdAt: "2026-08-08T09:00:00+09:00" },
  { id: 3, categoryId: 1, name: "콜드브루 원액 1L", description: "물이나 우유에 타서 마시는 커피 원액입니다.", price: 15900, optionName: null, imageUrl: null, createdAt: "2026-08-20T09:00:00+09:00" },
  { id: 4, categoryId: 1, name: "무항생제 달걀 30구", description: "무항생제 인증을 받은 신선한 달걀입니다.", price: 12900, optionName: null, imageUrl: null, createdAt: "2026-09-10T09:00:00+09:00" },
  { id: 5, categoryId: 2, name: "3겹 롤화장지 30롤", description: "부드럽고 도톰한 3겹 화장지입니다.", price: 21900, optionName: null, imageUrl: null, createdAt: "2026-08-02T09:00:00+09:00" },
  { id: 6, categoryId: 2, name: "대용량 세탁세제 3L", description: "드럼·일반 세탁기 겸용 액체 세제입니다.", price: 17500, optionName: null, imageUrl: null, createdAt: "2026-08-15T09:00:00+09:00" },
  { id: 7, categoryId: 2, name: "스테인리스 텀블러 500ml", description: "보온·보냉이 되는 텀블러입니다.", price: 24000, optionName: "실버", imageUrl: null, createdAt: "2026-09-01T09:00:00+09:00" },
  { id: 8, categoryId: 3, name: "무선 이어폰", description: "노이즈 캔슬링을 지원하는 블루투스 이어폰입니다.", price: 89000, optionName: "블랙", imageUrl: null, createdAt: "2026-08-25T09:00:00+09:00" },
  { id: 9, categoryId: 3, name: "고속 충전기 65W", description: "노트북과 휴대폰을 함께 충전할 수 있습니다.", price: 39000, optionName: null, imageUrl: null, createdAt: "2026-09-05T09:00:00+09:00" },
  { id: 10, categoryId: 3, name: "블루투스 키보드", description: "기기 3대까지 연결되는 무선 키보드입니다.", price: 54000, optionName: "화이트 / 한글 자판", imageUrl: null, createdAt: "2026-09-12T09:00:00+09:00" },
  { id: 11, categoryId: 4, name: "기본 반팔 티셔츠", description: "매일 입기 좋은 면 100% 티셔츠입니다.", price: 15000, optionName: "화이트 / L", imageUrl: null, createdAt: "2026-08-12T09:00:00+09:00" },
  { id: 12, categoryId: 4, name: "경량 패딩 조끼", description: "가볍고 따뜻한 간절기용 패딩 조끼입니다.", price: 49000, optionName: "그레이 / FREE", imageUrl: null, createdAt: "2026-09-18T09:00:00+09:00" },
];
