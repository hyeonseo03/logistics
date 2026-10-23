# Logistics 백엔드 API

- 기본 주소: `http://localhost:8080`
- 로그인이 필요한 API는 헤더에 `Authorization: Bearer {accessToken}` 를 넣는다.
- 시간 값은 시간대 없이 한국 시간으로 온다. 예: `"2026-10-23T14:05:00"`
- 에러 응답은 항상 같은 모양이다.

```json
{ "code": "OUT_OF_STOCK", "message": "제주 감귤 3kg의 재고가 부족합니다." }
```

| HTTP | 대표 code | 언제 |
|---|---|---|
| 400 | `INVALID_INPUT`, `CART_EMPTY`, `INVALID_STOCK_QUANTITY` | 입력값 오류 |
| 401 | `UNAUTHORIZED`, `INVALID_TOKEN`, `LOGIN_FAILED`, `WRONG_PASSWORD` | 로그인 필요 / 토큰 오류 / 비밀번호 틀림 |
| 403 | `FORBIDDEN` | 권한 없음 (일반 회원이 `/api/admin/**`) |
| 404 | `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND` 등 | 없음 (다른 회원의 주문도 404) |
| 409 | `OUT_OF_STOCK`, `INVALID_STATUS_CHANGE`, `ADDRESS_CHANGE_NOT_ALLOWED`, `CONCURRENT_MODIFICATION`, `DUPLICATE_EMAIL`, `PRODUCT_IN_USE` | 업무 규칙 충돌 |

권한 요약

| 누구나 | 로그인 필요 | ADMIN 만 |
|---|---|---|
| 회원가입·로그인, 상품·카테고리·물류센터·재고 **조회(GET)**, AI 도우미 | 장바구니, 주문, 배송 조회, 내 정보, 배송지, 재입고 알림, 취소·회수 내역 | `/api/admin/**` |

---

## 1. 회원·로그인

| 메서드 | 주소 | 설명 |
|---|---|---|
| POST | `/api/auth/signup` | 회원가입 (항상 USER). 201 + `UserResponse`. 이미 가입된 이메일이면 (동시에 가입해도) 409 `DUPLICATE_EMAIL` |
| POST | `/api/auth/login` | 로그인 → JWT 발급 |
| GET | `/api/auth/me` | 내 정보 (= `GET /api/users/me`) |
| GET | `/api/users/me` | 내 정보 |
| PUT | `/api/users/me` | 이름·전화번호 수정 |
| PATCH | `/api/users/me/password` | 비밀번호 변경. 204 |
| POST | `/api/users/me/verify-password` | 비밀번호 확인 (마이페이지 진입용). 맞으면 204, 틀리면 401 |

```jsonc
// POST /api/auth/signup
{ "email": "me@example.com", "password": "password123", "name": "홍길동", "phone": "010-1234-5678" }

// POST /api/auth/login 응답
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": { "id": 1, "email": "me@example.com", "name": "홍길동", "phone": "010-1234-5678", "role": "USER", "createdAt": "..." }
}

// PUT /api/users/me
{ "name": "홍길동", "phone": "010-9999-8888" }

// PATCH /api/users/me/password
{ "currentPassword": "password123", "newPassword": "newpassword1" }
```

검사 규칙 (프론트 `lib/validation.ts` 와 같음): 이름 1~20자, 전화번호 `010-1234-5678`, 비밀번호 8자 이상.

### 재입고 알림 (`restock_alerts`)

| 메서드 | 주소 | 설명 |
|---|---|---|
| POST | `/api/products/{id}/restock-alerts` | 신청 (본문 없음). 이미 신청했으면 기존 신청을 그대로 돌려준다 |
| GET | `/api/users/me/restock-alerts` | 내 알림 목록 (최근 신청이 위로) |
| DELETE | `/api/users/me/restock-alerts/{id}` | 해제. 내 알림이 아니면 404 `RESTOCK_ALERT_NOT_FOUND`. 204 |

```json
{ "id": 1, "userId": 3, "productId": 9, "createdAt": "2026-10-23T10:00:00",
  "product": { "...": "ProductResponse (현재 totalStock 포함 → 재입고 여부 표시)" } }
```

### 취소·회수 내역

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/users/me/claims?type=CANCEL` | 취소 내역 (상태 `CANCELED` 주문 + 결제의 환불 사유·시각) |
| GET | `/api/users/me/claims?type=RETURN` | 회수(반품) 내역 (상태 `RETURNING`/`RETURNED` 주문 + `returns` 의 사유·요청·완료 시각) |

```json
{ "orderId": 12, "type": "RETURN", "status": "IN_PROGRESS", "statusLabel": "회수중",
  "reason": "고객 취소 요청", "requestedAt": "2026-10-23T12:30:00", "completedAt": null,
  "order": { "...": "OrderResponse" } }
```

### 배송지 (`user_addresses`)

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/users/me/addresses` | 목록 (기본 배송지가 맨 위) |
| POST | `/api/users/me/addresses` | 추가. 첫 배송지는 자동으로 기본. 201 |
| PUT | `/api/users/me/addresses/{id}` | 수정. `isDefault: true` 면 기본으로 변경 |
| PATCH | `/api/users/me/addresses/{id}/default` | 기본 배송지로 설정 |
| DELETE | `/api/users/me/addresses/{id}` | 삭제. 기본을 지우면 가장 먼저 등록한 배송지가 기본. 204 |

```json
{ "label": "집", "receiverName": "홍길동", "receiverPhone": "010-1234-5678", "address": "서울시 강남구 테헤란로 1", "isDefault": false }
```

---

## 2. 상품·카테고리·물류센터·재고 (조회는 누구나)

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/products?categoryId=` | 상품 목록 (`ProductResponse[]`: 상품 + `categoryName` + `totalStock`) |
| GET | `/api/products/{id}` | 상품 상세 |
| GET | `/api/products/{id}/inventories` | 상품의 물류센터별 재고 |
| GET | `/api/categories` | 카테고리 목록 |
| GET | `/api/warehouses` | 물류센터 목록 |
| GET | `/api/inventories` | 전체 재고 목록 (프론트 상품 목록이 출고 센터 계산에 사용) |

판매가능재고 = `quantity`(실물) − `reservedQuantity`(주문됐지만 아직 출고 전).

---

## 3. 장바구니 (로그인 필요)

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/cart` | 장바구니 + 결제 요약 |
| POST | `/api/cart/items` | 담기 `{ "productId": 1, "quantity": 2 }` (이미 있으면 수량 더하기) |
| PATCH | `/api/cart/items/{productId}` | 수량 변경 `{ "quantity": 3 }` |
| DELETE | `/api/cart/items/{productId}` | 한 상품 삭제 |
| DELETE | `/api/cart/items?productIds=1,2` | 선택 삭제 |
| DELETE | `/api/cart` | 전체 비우기. 204 |

변경 API 는 모두 바뀐 장바구니 전체를 돌려준다. 각 줄에는 이미지가 없을 때 쓸 `categoryName` 도 들어 있다.

```json
{
  "items": [
    { "id": 1, "productId": 1, "productName": "제주 감귤 3kg", "optionName": null, "imageUrl": null,
      "price": 19900, "quantity": 2, "lineTotal": 39800, "totalStock": 115, "soldOut": false }
  ],
  "productTotal": 39800,
  "shippingFee": 0,
  "totalPrice": 39800
}
```

배송비: 상품금액 30,000원 이상 무료, 아니면 3,000원 (품절 상품은 계산에서 제외). 판매가능재고보다 많이 담으면 409 `OUT_OF_STOCK`.

---

## 4. 주문 (로그인 필요)

| 메서드 | 주소 | 설명 |
|---|---|---|
| POST | `/api/orders` | 장바구니 → 주문 (모의 결제: 즉시 결제완료). 201 |
| GET | `/api/orders` | 내 주문 목록 (최신순). `/api/orders/me` 도 같음 |
| GET | `/api/orders/{id}` | 내 주문 상세 |
| POST | `/api/orders/{id}/cancel` | 취소 (상태에 따라 즉시 취소 또는 회수) |
| PATCH | `/api/orders/{id}/address` | 배송지 변경 (출고 전만) |
| GET | `/api/orders/{id}/tracking` | 배송 타임라인 + 도착 예상 시각 |

### POST /api/orders

```jsonc
// 저장된 배송지로
{ "addressId": 3, "paymentMethod": "CARD" }
// 직접 입력 + 장바구니 일부만
{ "receiverName": "홍길동", "receiverPhone": "010-1111-2222", "address": "서울시 강남구 테헤란로 1",
  "paymentMethod": "BANK_TRANSFER", "productIds": [1, 4] }
```

한 트랜잭션에서: 배송지 결정 → 상품마다 출고 센터 선택 + 재고 예약 → 주문·주문상품 저장 → 결제(PAID) 기록 → 상태 이력·배송 생성 → 주문한 상품을 장바구니에서 삭제. 하나라도 실패하면 전부 롤백.

출고 센터: 배송지 지역에서 가까운 센터부터(서울 → 서울·경기·부산 / 경기 → 경기·서울·부산 / 부산 → 부산·경기·서울) 재고가 있는 첫 센터.

### 주문 응답 (`OrderResponse`)

```json
{
  "id": 12, "userId": 3, "userName": "홍길동",
  "status": "SHIPPED", "statusLabel": "출고",
  "paymentMethod": "CARD", "paymentStatus": "PAID",
  "productTotal": 20000, "shippingFee": 3000, "totalPrice": 23000,
  "receiverName": "홍길동", "receiverPhone": "010-1111-2222", "address": "서울시 강남구 테헤란로 1",
  "createdAt": "2026-10-23T10:00:00",
  "items": [
    { "id": 20, "orderId": 12, "productId": 3, "productName": "콜드브루 원액 1L", "imageUrl": null, "categoryName": "식품",
      "warehouseId": 1, "warehouseName": "서울 물류센터", "quantity": 2, "price": 10000, "lineTotal": 20000 }
  ],
  "shipment": {
    "id": 12, "orderId": 12, "warehouseId": 1, "warehouseName": "서울 물류센터", "courier": "Logistics 자체배송",
    "trackingNumber": "LG20261023000012", "status": "SHIPPED", "statusLabel": "출고",
    "shippedAt": "2026-10-23T12:00:00", "inTransitAt": null, "deliveredAt": null
  },
  "cancelInfo": {
    "cancelable": true, "type": "RETURN", "label": "회수",
    "message": "이미 출고되어 취소하면 택배 기사님이 상품을 회수합니다. 회수가 완료되면 환불됩니다."
  }
}
```

`cancelInfo` = "지금 취소하면 어떻게 되는지". `type`: `IMMEDIATE_CANCEL`(즉시 취소) / `RETURN`(회수) / `ALREADY_PROCESSED`(이미 처리됨).

### 주문 상태와 전이 규칙 (`OrderStatus` enum 한 곳에 정의)

```
ORDERED(주문완료) → PACKING(포장) → SHIPPED(출고) → IN_TRANSIT(배송중) → DELIVERED(배송완료)
ORDERED, PACKING ───────────────→ CANCELED(취소)          : 예약재고 해제 + 환불
SHIPPED, IN_TRANSIT, DELIVERED ─→ RETURNING(회수중) → RETURNED(회수완료) : 회수 완료 시 재고 복구 + 환불
```

### POST /api/orders/{id}/cancel

요청 본문은 생략 가능: `{ "reason": "단순 변심" }`

```json
{ "result": "CANCELED", "message": "주문이 취소되었습니다. 결제 금액이 환불됩니다.", "order": { "...": "OrderResponse" } }
```

| 현재 상태 | result | 일어나는 일 |
|---|---|---|
| 주문완료, 포장 | `CANCELED` | 즉시 취소, 예약재고 해제, 결제 REFUNDED |
| 출고, 배송중, 배송완료 | `RETURN_REQUESTED` | RETURNING + `returns` 생성 (관리자가 회수완료 처리하면 재고 복구 + 환불) |
| 취소, 회수중, 회수완료 | `ALREADY_PROCESSED` | 아무것도 안 함, 200 성공 (멱등) |

- 같은 주문에 취소가 동시에 여러 번 와도 한 번만 처리되고 나머지는 `ALREADY_PROCESSED`.
- 고객 취소와 관리자 출고가 동시에 오면 `@Version` 낙관적 락으로 한쪽만 성공. 진 쪽은 409 `CONCURRENT_MODIFICATION`.

### PATCH /api/orders/{id}/address

주문할 때와 같은 모양 (`addressId` 또는 `receiverName`·`receiverPhone`·`address`). 출고 이후면 409 `ADDRESS_CHANGE_NOT_ALLOWED`.

### GET /api/orders/{id}/tracking

```json
{
  "orderId": 12, "orderStatus": "SHIPPED", "orderStatusLabel": "출고",
  "receiverName": "홍길동", "address": "서울시 강남구 테헤란로 1",
  "shipment": { "...": "ShipmentResponse" },
  "events": [
    { "id": 1, "shipmentId": 12, "status": "PREPARING", "statusLabel": "상품준비", "location": "서울 물류센터",
      "message": "주문이 접수되어 상품을 준비하고 있습니다.", "occurredAt": "2026-10-23T10:00:00" },
    { "id": 3, "shipmentId": 12, "status": "SHIPPED", "statusLabel": "출고", "location": "서울 물류센터",
      "message": "상품이 출고되었습니다. (운송장 LG20261023000012)", "occurredAt": "2026-10-23T12:00:00" }
  ],
  "eta": {
    "estimatedArrivalAt": "2026-10-23T15:02:00", "delivered": false, "delayed": false,
    "steps": [
      { "name": "고속도로 이동 (12시 출발)", "minutes": 62, "startAt": "...", "endAt": "..." },
      { "name": "캠프 분류", "minutes": 60, "startAt": "...", "endAt": "..." },
      { "name": "집 앞 배송", "minutes": 60, "startAt": "...", "endAt": "..." }
    ],
    "method": "RULE_BASED",
    "message": "10월 23일 15시 02분쯤 도착할 예정이에요."
  }
}
```

도착 예상 시각 규칙 (`EtaService` 인터페이스 → `RuleBasedEtaService`):
센터 처리 2시간 + 고속도로 이동(출발 시각별: 0~5시 55분, 6~13시 62분, 14~16시 73분, 17~19시 86분, 20~23시 58분) + 캠프 분류 1시간 + 집 앞 배송 1시간.
상태별로 지난 구간은 빼고 계산한다. 취소·회수 주문은 `eta: null`.

---

## 5. AI 도우미 (누구나, 로그인하면 내 주문으로 답함)

| 메서드 | 주소 | 설명 |
|---|---|---|
| POST | `/api/assistant/chat` | `{ "message": "내 주문 어디쯤이야?" }` → `{ reply, type, data }`. `/api/ai/chat` 도 같음 |

| 질문에 들어 있는 말 | type | data |
|---|---|---|
| 취소, 환불, 반품 | `CANCEL_INFO` | 최근(취소 가능한) 주문의 `cancelInfo`. 실제로 취소하지는 않음 |
| 언제, 도착, 몇 시 | `ETA` | 진행 중인 주문의 `eta` |
| 주문, 배송, 어디, 택배 | `ORDER_STATUS` | 최근 주문의 상태·운송장·마지막 위치 |
| 상품 이름의 단어 (예: "감귤") | `PRODUCT_SEARCH` | `ProductResponse[]` (최대 5개) |
| 그 외 | `HELP` | 예시 질문 |
| 로그인 안 하고 주문 질문 | `LOGIN_REQUIRED` | null |
| 주문 없음 | `NO_ORDER` | null |

---

## 6. 관리자 (`/api/admin/**`, ADMIN 만)

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/admin/dashboard` | 대시보드 |
| GET | `/api/admin/products` | 상품 목록 |
| POST | `/api/admin/products` | 상품 등록. 201 |
| PUT | `/api/admin/products/{id}` | 상품 수정 |
| DELETE | `/api/admin/products/{id}` | 상품 삭제. 주문 이력이 있으면 409 `PRODUCT_IN_USE`. 204 |
| GET | `/api/admin/inventories` | 재고 목록 |
| PUT | `/api/admin/inventories` | 재고 조정 `{ "productId": 1, "warehouseId": 2, "quantity": 50 }` (비관적 락) |
| GET | `/api/admin/warehouses` | 물류센터 목록 |
| GET | `/api/admin/orders?status=&page=0&size=20` | 주문 목록 (상태 필터, 페이징, 최신순) |
| GET | `/api/admin/orders/{id}` | 주문 상세 |
| GET | `/api/admin/orders/{id}/history` | 상태 변경 이력 |
| PATCH | `/api/admin/orders/{id}/status` | 상태 변경 `{ "status": "PACKING" }` — `PACKING`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`, `RETURNED` 만 |
| GET | `/api/admin/shipments?status=&page=0&size=20` | 배송 목록 (마지막 이력, 예상 도착, 지연 여부) |
| GET | `/api/admin/users?page=0&size=20` | 회원 목록 (주문 수 포함) |
| GET | `/api/admin/analytics` | 통계: 최근 14일 일별 주문·매출, 카테고리별 매출, 인기 상품 TOP 5, 센터별 출고 수량, 취소·회수 건수 |

```jsonc
// POST/PUT /api/admin/products
{ "categoryId": 1, "name": "새 상품", "description": "설명", "price": 12000, "optionName": null, "imageUrl": null }

// GET /api/admin/dashboard
{
  "todayOrderCount": 2,
  "todaySales": 45900,
  "statusCounts": { "ORDERED": 1, "PACKING": 1, "SHIPPED": 1, "IN_TRANSIT": 1, "DELIVERED": 1, "CANCELED": 1, "RETURNING": 1, "RETURNED": 1 },
  "lowStockItems": [ { "...": "InventoryResponse (판매가능재고 10개 미만)" } ],
  "lowStockThreshold": 10,
  "dailyOrders": [ { "date": "2026-10-17", "count": 1 }, "... 7일" ],
  "totalOrders": 8, "shippingCount": 2, "lowStockCount": 9, "delayedCount": 1
}

// 페이징 응답 공통 모양
{ "content": [ ... ], "page": 0, "size": 20, "totalElements": 8, "totalPages": 1 }
```

관리자 상태 변경 시 자동으로 일어나는 일: 상태 이력(`order_status_history`) 기록, 배송 상태·배송 이력(`shipment_events`) 기록, 출고 시 실물재고 차감·운송장 번호 발급, 회수완료 시 재고 복구·환불.

---

## 프론트 타입과 다른 점 (프론트 수정 시 참고)

| 항목 | 프론트 (`types/`) | 백엔드 |
|---|---|---|
| 회원 권한 | `CUSTOMER` / `ADMIN` | `USER` / `ADMIN` |
| 주문 상태 | `PAID`, `PREPARING`, `SHIPPING`, `DELIVERED`, `CANCELLED` | `ORDERED`, `PACKING`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`, `CANCELED`, `RETURNING`, `RETURNED` |
| 주문 생성 | `items` 배열을 직접 보냄 | 장바구니(`cart_items`)에서 주문, `productIds` 로 일부 선택 |
| 배송 이력 설명 | `description` | `message` |
| 배송 조회 | `GET /api/shipments/{id}` | `GET /api/orders/{id}/tracking` |
| 내 정보 수정 | `PATCH /api/users/me` (+`newPassword`) | `PUT /api/users/me` + `PATCH /api/users/me/password` |
| 로그인 | 역할 선택 (mock) | 이메일·비밀번호 → JWT |
