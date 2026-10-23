# 시연 순서 (DEMO)

> 고객 화면과 관리자 화면을 오가므로 **브라우저 창 2개**를 쓰면 편하다.
> 예) 일반 창 = 고객, 시크릿 창 = 관리자 (로그인 정보는 브라우저별 localStorage 에 저장된다)

## 준비
1. PostgreSQL 실행, `logistics` 데이터베이스 생성
2. 백엔드 실행 (`backend/.env` 에 `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) → http://localhost:8080
   - 처음 실행하면 관리자 계정, 상품 12개·물류센터 3곳·재고, 샘플 주문 8건이 자동으로 만들어진다
3. 프론트 실행 (`npm run dev`) → http://localhost:3000
4. 시연할 상품: **콜드브루 원액 1L** (서울 물류센터 재고, 서울 주소로 주문하면 당일 출고)
   - 관리자 창에서 `/admin/inventory` 를 열어 콜드브루의 서울 물류센터 "현재 / 예약" 숫자를 미리 적어 둔다

## 시연 순서

| # | 누가 | 화면 (주소) | 할 일 | 확인할 것 |
|---|---|---|---|---|
| 1 | 고객 | `/` → [회원가입] | 이메일·비밀번호(확인)·이름·전화번호 입력 → [가입하기] | 형식이 틀리면 칸 아래 빨간 안내, 같은 이메일이면 "이미 가입된 이메일입니다." / 가입 즉시 자동 로그인, 헤더에 "이름님 · 로그아웃" |
| 2 | 고객 | [로그아웃] → [장바구니] 클릭 | 로그인 안 된 상태로 장바구니 누르기 | `/login?redirect=%2Fcart` 로 이동 → 로그인하면 **장바구니로 돌아옴** |
| 3 | 고객 | `/` → 카테고리 [식품] → 콜드브루 | 홈 배너·차별점·"오늘 출고 가능" 섹션 확인 후 상품 상세 | 재고 배지, "당일 출고", "오늘/내일(요일) 도착 예정", 사진이 없으면 카테고리 일러스트 |
| 4 | 고객 | 상품 상세 → [장바구니 담기] (수량 2) → `/cart` | 수량 바꾸기, 선택/해제 | 헤더 장바구니 숫자, 결제 예정 금액·배송비(3만원 이상 무료) |
| 5 | 고객 | `/cart` → [주문하기] → `/checkout` | 주소 `서울시 강남구 테헤란로 1` → [결제하기] | "주문이 완료되었습니다", 주문 번호 / 관리자 재고 화면에서 **예약 +2** (현재는 그대로) |
| 6 | 관리자 | `/login` (관리자 계정) → `/admin/orders` | 방금 주문에 [포장 시작] → [출고 처리] | 초록 알림 + 목록 즉시 새로고침, 운송장 번호 발급 / 재고 화면: **현재 -2, 예약 -2** |
| 7 | 고객 | `/tracking/{주문번호}` (주문 완료 화면의 [배송 조회]) | 배송 조회 | 4단계 타임라인 "출고", 도착 예상 시각 + 구간별(고속도로·캠프·집 앞) 설명 |
| 8 | 고객 | `/mypage/orders` | [취소(회수 요청)] → 확인 창 문구 읽기 → 확인 | "이미 출고되어 … 회수합니다" 안내, 상태 "회수중", `/mypage/returns` 에 회수중 내역 |
| 9 | 관리자 | `/admin/orders` → 필터 [회수중] | [회수 완료] → 확인 | 상태 "회수완료", "환불됨" 표시 |
| 10 | 관리자 | `/admin/inventory` | 콜드브루 서울 칸 확인 | **현재재고가 처음 숫자로 복구** (출고로 빠진 2개가 돌아옴), 대시보드·통계의 회수 건수 증가 |
| 11 | 고객 | `/ai` | "내 주문 어디쯤이야?", "지금 취소하면 어떻게 돼?", "감귤 있어?" | 최근 주문 상태(회수완료), 취소 안내, 상품 검색 결과 링크 |

추가로 보여주면 좋은 것
- 일반 회원으로 `/admin` 주소에 들어가기 → "권한이 없습니다" 안내 후 2초 뒤 홈
- 관리자 `/admin/products` → [수정] → [사진 고르기] → 미리보기 → [수정 저장] → 상품 목록·장바구니·주문 내역에 사진 반영
  (gif 나 5MB 넘는 파일은 "jpg, png, webp … 5MB 이하" 안내)
- 관리자 `/admin/inventory` → 칸의 [조정] 으로 재고 0 → 고객 상품 상세에 "품절" + [재입고 알림 신청] → `/mypage/restock-alerts`
- 출고 **전**에 취소하면 즉시 취소 + 예약 재고만 풀림 (`/mypage/cancellations`)

---

## 코드 점검 결과 (2026-10-23)

각 단계가 어떤 화면 코드 → 어떤 API → 어떤 백엔드 코드로 이어지는지 따라가며 확인했다.
같은 순서를 백엔드 테스트 **`backend/src/test/java/com/logistics/backend/DemoScenarioTest.java`** 가 HTTP 요청으로 그대로 재현하고, 통과한다.

| # | 프론트 (화면 → `lib/api.ts`) | 백엔드 API → 서비스 | 테스트에서 확인한 값 |
|---|---|---|---|
| 1 회원가입 | `components/common/SignupForm.tsx` → `signup()` → `login()` | `POST /api/auth/signup` → `AuthService.signup` | 201, `users` 에 저장(BCrypt), 동시 가입은 `SignupTest` |
| 2 로그인 | `LoginForm.tsx` → `login()` (토큰 저장) / `RequireLogin.tsx` 가 `?redirect=` 처리 | `POST /api/auth/login`, `GET /api/auth/me` | 토큰으로 내 정보 조회 |
| 3 상품 보기 | `ProductBrowser.tsx`, `ProductDetail.tsx` → `getProducts()`, `getProduct()` | `GET /api/products(/{id})`, `/inventories` | 재고 합계 = 처음 재고 |
| 4 장바구니 | `ProductDetail` → `CartContext.addItem()` → `addCartItem()` / `/cart` → `getCart()` | `POST /api/cart/items`, `GET /api/cart` → `CartService` | 수량 2, 상품금액 30,000원, 배송비 0 |
| 5 주문 | `app/(shop)/checkout/page.tsx` → `createOrder({ productIds })` | `POST /api/orders` → `OrderService.createOrder` → `InventoryService.reserve` | `ORDERED`, `PAID`, 예약 +2, 장바구니에서 빠짐 |
| 6 출고 처리 | `app/admin/orders/page.tsx` → `updateOrderStatus()` | `PATCH /api/admin/orders/{id}/status` → `OrderTransitionService` (`SHIPPED` 에서 `InventoryService.ship`) | 운송장 발급, 현재 -2·예약 -2 |
| 7 배송 조회 | `ShipmentTracking.tsx` → `getTracking()` | `GET /api/orders/{id}/tracking` → `ShipmentService` + `RuleBasedEtaService` | 상태 `SHIPPED`, ETA 메시지 |
| 8 고객 취소(회수) | `OrderList.tsx` → `cancelOrder()` (버튼 문구는 `cancelInfo.type`) | `POST /api/orders/{id}/cancel` → `OrderCancelFacade` → `RETURNING` + `returns` 생성 | `RETURN_REQUESTED`, 회수 내역 `IN_PROGRESS` |
| 9 회수 완료 | `app/admin/orders/page.tsx` [회수 완료] → `updateOrderStatus(id, "RETURNED")` | 같은 API → `RETURNED` 에서 `InventoryService.restock` + 환불 | `RETURNED`, `REFUNDED` |
| 10 재고 복구 | `app/admin/inventory/page.tsx` → `getInventoryTable()` | `GET /api/admin/inventories` | 현재재고 = 처음 재고, 예약 0, 회수 내역 `COMPLETED` |
| 11 AI 도우미 | `components/ai/ChatWindow.tsx` → `askAi()` | `POST /api/assistant/chat` → `KeywordAssistantService` | `ORDER_STATUS`(최근 주문 = 회수완료), `PRODUCT_SEARCH` |

점검하면서 고친 것
- `lib/api.ts`: 401 응답이면 무조건 로그인 토큰을 지우던 것을, **토큰이 잘못된 경우(`INVALID_TOKEN`)에만** 지우도록 수정
  (전에는 "내 정보 관리"에서 비밀번호를 틀리거나 로그인 상태에서 다른 계정 로그인에 실패하면 로그아웃되어 버렸다)

확인하지 못한 것
- 실제 PostgreSQL + 브라우저로 화면을 눌러 보는 확인은 하지 못했다 (작업 환경에 `backend/.env` 의 DB 비밀번호가 없음).
  대신 백엔드는 H2 로 전체 테스트, 프론트는 `tsc`·`lint`·`next build`(프로덕션 빌드)로 확인했다.
