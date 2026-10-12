# API 위시리스트

화면별로 필요한 데이터와 API를 정리한다. 백엔드(Spring Boot)를 만들 때 이 문서를 기준으로 한다.

---

## 상품 목록 / 상품 상세 — 재고 · 출고 정보

### 화면에 보여주는 것
- 재고 상태 배지 (3단계)
  - 판매가능재고 = 현재재고(`inventory.quantity`) - 예약재고(`inventory.reserved_quantity`)
  - 10개 이상: 구매 가능 / 1~9개: 품절 임박 · N개 남음 / 0개: 품절
- 출고 센터는 고객 화면에 표시하지 않는다 (서버 내부에서 도착일 계산·주문 처리에만 사용)
- 예상 도착일 (예: "내일(수) 도착 예정")
- 품절이면 구매 버튼 비활성화 + 재입고 알림 신청 버튼

### 계산 규칙 (지금은 `lib/stock.ts`, 나중에 백엔드로 옮김)
- 배송지: 로그인한 회원의 주소 (로그인 전에는 기본값 서울)
- 가까운 센터 순서: 서울 배송지 → 서울, 경기, 부산 / 경기 → 경기, 서울, 부산 / 부산 → 부산, 경기, 서울
- 출고일: 당일 출고 센터면 오늘, 아니면 내일
- 이동 일수: 같은 지역·서울↔경기 1일, 부산↔수도권 2일
- 도착일이 일요일이면 월요일로 미룸

### 필요한 DB 변경
- `inventory` 에 `reserved_quantity` 컬럼 추가 (예약재고)
- `restock_alerts` 테이블 추가: `id`, `user_id`, `product_id`, `created_at`

### API

> **연결 상태**: 상품 API(`GET /api/products`, `GET /api/products/{id}`)와 물류센터·재고 API(`GET /api/warehouses`, `GET /api/inventories`, `GET /api/products/{id}/inventories`)는 프론트에서 **실제 백엔드를 호출**한다 (`lib/api.ts`).
> - 백엔드 주소: `.env.local` 의 `NEXT_PUBLIC_API_URL` (기본 `http://localhost:8080`)
> - 지금 백엔드 응답은 `ProductResponse` (`types/product.ts`): 상품 필드 + `categoryName` + `totalStock`. 상품이 없으면 404. 재고는 `InventoryResponse` (`types/warehouse.ts`).
> - **임시 처리 (프론트에서 하는 것, 백엔드에 생기면 지울 것)**
>   - 출고 센터·당일 출고·예상 도착일: 백엔드 재고 목록 + 물류센터 목록으로 프론트(`lib/stock.ts` 규칙)에서 계산한다 → 나중에 백엔드로 옮길 수 있음
>   - 검색어(`keyword`)·정렬(`sort`): 백엔드가 아직 `categoryId` 만 받아서 프론트에서 거른다 → 쿼리 파라미터 추가 필요
>   - `createdAt` 이 시간대 없이 와서 프론트에서 `+09:00` 을 붙인다 → 백엔드에서 `OffsetDateTime` 등으로 시간대 포함 권장
> - CORS: 백엔드 `WebConfig.java` 에서 `http://localhost:3000` 허용됨
> - 나머지 API(카테고리, 장바구니용 `?ids=`, 주문, 배송 등)는 아직 mock. 장바구니는 `GET /api/products` 전체를 받아 프론트에서 고른다

#### `GET /api/products?keyword=&categoryId=&sort=` (기존 API에 필드 추가)
#### `GET /api/products/{id}` (기존 API에 필드 추가)
- 서버가 로그인 회원의 배송지를 보고 출고 센터·도착일을 계산해서 내려준다.
- 응답 (`types/product.ts` 의 `ProductWithStock`)

```json
{
  "id": 12,
  "name": "경량 패딩 조끼",
  "price": 49000,
  "categoryName": "패션",
  "stocks": [
    { "warehouseId": 1, "warehouseName": "서울 물류센터", "availableQuantity": 0 },
    { "warehouseId": 2, "warehouseName": "경기 물류센터", "availableQuantity": 8 }
  ],
  "totalStock": 8,
  "stockStatus": "LOW_STOCK",
  "shippingWarehouse": { "warehouseId": 2, "warehouseName": "경기 물류센터", "availableQuantity": 8 },
  "sameDayShipping": true,
  "estimatedArrivalDate": "2026-09-30"
}
```

- `stockStatus`: `"AVAILABLE" | "LOW_STOCK" | "SOLD_OUT"`
- `stocks`: 배송지에서 가까운 순서, 재고 0인 센터도 포함
- 품절이면 `shippingWarehouse`, `estimatedArrivalDate` 는 `null`

#### `POST /api/products/{id}/restock-alerts` (신규)
- 로그인 필요 (안 했으면 401)
- 요청 본문 없음
- 응답: `{ "id": 1, "userId": 1, "productId": 9, "createdAt": "..." }`
- 이미 신청했으면 기존 신청을 그대로 돌려준다 (중복 신청 방지)

---

## 장바구니

### 화면에 보여주는 것
- 상품 줄: 정사각형 썸네일(없으면 "이미지 준비중" 회색 박스), 상품명, 옵션, 가격, 수량 조절, 삭제
- 재고 상태 배지 + 예상 도착일 (상품 목록과 같은 계산 규칙)
- 품절 상품: 흐리게 표시, 선택 불가, 결제 대상에서 자동 제외, "품절된 상품 삭제"
- 전체 선택 / 선택 삭제
- 결제 요약: 상품금액, 배송비, 총 결제금액, 주문하기

### 계산 규칙 (지금은 `lib/price.ts`, 나중에 백엔드로 옮김)
- 배송비: 상품금액 30,000원 이상이면 무료, 아니면 3,000원
- 주문 총 금액(`orders.total_price`) = 상품금액 + 배송비

### 필요한 DB 변경
- `products` 에 `image_url`, `option_name` 컬럼 (지금은 상품마다 옵션 1개로 단순화.
  옵션별 가격·재고가 필요해지면 `product_options` 테이블로 분리)

### API

#### `GET /api/products?ids=1,2,3` (신규 조회 조건)
- 장바구니에 담긴 상품들의 최신 정보를 한 번에 조회
- 응답: `ProductWithStock[]` (상품 목록 API와 같은 형태, `imageUrl`, `optionName` 포함)
- 없는(삭제된) 상품은 응답에서 빠진다

#### (나중에) 서버 장바구니
- 지금은 장바구니를 브라우저 메모리에만 저장한다 (새로고침하면 사라짐).
- 로그인 회원의 장바구니를 저장하려면 아래 API와 `cart_items` 테이블(`id`, `user_id`, `product_id`, `quantity`, `selected`)이 필요하다.
  - `GET /api/cart` / `POST /api/cart/items` / `PATCH /api/cart/items/{productId}` / `DELETE /api/cart/items?productIds=1,2`

---

## 마이페이지

### 화면 구성 (각각 별도 페이지)
| 주소 | 화면 | 사용하는 API |
|---|---|---|
| `/mypage` | 인사말 + 요약 카드 (개인정보 없음) | `GET /api/users/me/summary` |
| `/mypage/orders` | 주문 목록 | `GET /api/orders/me` |
| `/mypage/shipments` | 배송 조회 (진행 중 / 완료) | `GET /api/orders/me` |
| `/mypage/cancellations` | 취소 내역 | `GET /api/users/me/claims?types=CANCEL` |
| `/mypage/returns` | 반품/교환 내역 | `GET /api/users/me/claims?types=RETURN,EXCHANGE` |
| `/mypage/restock-alerts` | 재입고 알림 목록 + 해제 | `GET`, `DELETE /api/users/me/restock-alerts` |
| `/mypage/profile` | 비밀번호 확인 → 내 정보 (가림 처리) → 수정 | `POST /api/users/me/verify-password`, `GET`, `PATCH /api/users/me` |
| `/mypage/addresses` | 배송지 추가/수정/삭제/기본 설정 | `/api/users/me/addresses` 묶음 |

- 예전 `/orders` 주소는 `/mypage/orders` 로 이동시킨다.

### 필요한 DB 변경
- `users.address` 컬럼 삭제 → `addresses` 테이블로 이동
  - `addresses`: `id`, `user_id`, `label`, `receiver_name`, `receiver_phone`, `address`, `is_default`
  - 회원마다 `is_default = true` 는 1개만
- `users.password` (암호화된 해시) — 응답 DTO 에는 절대 포함하지 않는다
- `order_claims` 테이블 추가: `id`, `order_id`, `user_id`, `type`(CANCEL/RETURN/EXCHANGE), `status`(REQUESTED/IN_PROGRESS/COMPLETED/REJECTED), `reason`, `created_at`, `completed_at`

### API

#### `GET /api/users/me/summary`
```json
{ "shippingCount": 1, "claimInProgressCount": 2, "restockAlertCount": 2 }
```
- `shippingCount`: 주문 상태가 SHIPPING 인 주문 수
- `claimInProgressCount`: 상태가 REQUESTED 또는 IN_PROGRESS 인 취소/반품/교환 수

#### `GET /api/users/me/claims?types=CANCEL`
- 응답: `ClaimWithOrder[]` (`types/claim.ts`) — 신청 정보 + 주문 + 주문 상품, 최근 신청이 위로

#### `GET /api/users/me/restock-alerts`
- 응답: `RestockAlertWithProduct[]` — 알림 + 상품의 현재 재고 상태 (재입고되었는지 화면에서 표시)

#### `DELETE /api/users/me/restock-alerts/{id}`
- 알림 해제. 내 알림이 아니면 404

#### `GET /api/users/me`
- 응답: `User` (`id`, `email`, `name`, `phone`, `role`, `createdAt`) — 비밀번호 없음

#### `POST /api/users/me/verify-password`
- 요청: `{ "password": "1234" }`
- 성공: 200 + 짧은 시간(예: 10분)만 쓸 수 있는 확인 토큰. 실패: 401
- 내 정보 조회/수정 API 는 이 토큰이 있어야 동작하게 한다 (지금 mock 은 화면 상태로만 처리)

#### `PATCH /api/users/me`
- 요청 (`UpdateProfileRequest`): `{ "name": "정현서", "phone": "010-1234-5678", "newPassword": "새비밀번호" }`
  - `newPassword` 는 선택 (없으면 비밀번호 유지)
  - 이메일은 받지 않는다 (수정 불가)
- 서버 검증: 이름 1~20자, 전화번호 `010-1234-5678` 형식, 비밀번호 8자 이상 (`lib/validation.ts` 와 같은 규칙) → 실패 시 400
- 응답: 수정된 `User`

#### 배송지
| 메서드 | 주소 | 설명 |
|---|---|---|
| `GET` | `/api/users/me/addresses` | 목록 (기본 배송지가 맨 위) |
| `POST` | `/api/users/me/addresses` | 추가. 첫 배송지는 자동으로 기본 |
| `PUT` | `/api/users/me/addresses/{id}` | 수정. `isDefault: true` 면 기본으로 변경 (기본 해제는 불가) |
| `PATCH` | `/api/users/me/addresses/{id}/default` | 기본 배송지로 설정 (나머지는 자동 해제) |
| `DELETE` | `/api/users/me/addresses/{id}` | 삭제. 기본 배송지를 지우면 남은 것 중 가장 먼저 등록한 배송지가 기본 |

- 요청 body (`AddressRequest`): `{ "label": "집", "receiverName": "정현서", "receiverPhone": "010-1234-5678", "address": "...", "isDefault": false }`
- 기본 배송지는 주문서 자동 채우기, 출고 센터·도착일 계산에 사용된다
