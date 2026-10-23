# 시연 가능한 완성 상태 만들기 (PLAN-POLISH)

> 중간에 멈췄다가 다시 시작하면 이 파일에서 체크되지 않은 첫 단계부터 이어서 진행한다.
> 단계마다 백엔드 `./gradlew build`, 프론트 `npx tsc --noEmit` + `npm run lint` 통과 → `git commit` (push 하지 않음).
> 이번 작업은 backend, frontend 둘 다 수정한다. 비밀번호·키는 코드에 쓰지 않고 환경변수를 유지한다.

## 시작 시점 상태 (2026-10-23)
- 백엔드: 8단계까지 완성 (회원·JWT, 장바구니, 주문, 취소/회수, 배송 조회+ETA, 관리자, AI 도우미). 테스트 통과.
- 프론트: 상품 목록/상세, 재고 화면만 백엔드에 연결. 나머지는 `mocks/` 데이터로 동작.
- "이전 프론트 작업의 남은 문제" 문서는 따로 없어서, `frontend/docs/api-wishlist.md` 의 "임시 처리" 메모를 남은 문제로 보고 함께 처리한다.
  - 장바구니가 `GET /api/products` 전체를 받아 프론트에서 고름 → 서버 장바구니(`/api/cart`)로 교체
  - 재입고 알림·취소/반품 내역·마이페이지 요약이 mock → 백엔드 API 추가 후 연결
  - 백엔드와 프론트의 상태값(주문 8단계, 권한 USER/ADMIN)이 다름 → 프론트 타입을 백엔드에 맞춤

## 단계별 체크리스트
- [x] 1단계: "준비중" 전부 없애기 (모든 화면 실제 API 연결)
- [x] 2단계: 로그인·회원가입 흐름
- [x] 3단계: 상품 사진
- [x] 4단계: 홈 꾸미기
- [x] 5단계: 관리자 전체 작동
- [ ] 6단계: 최종 점검 (테스트, DEMO.md, README.md)

---

## 1단계 대상 목록 (검색: `PagePlaceholder`, `준비중`, `준비 중`, `mock`)

### "준비 중" 화면 (PagePlaceholder)
| 화면 | 파일 | 처리 |
|---|---|---|
| 홈 `/` | `app/(shop)/page.tsx` | 실제 상품 데이터로 홈 구성 (4단계에서 꾸미기) |
| 회원가입 `/signup` | `app/(shop)/signup/page.tsx` | `POST /api/auth/signup` 연결 (2단계에서 검사·흐름 보강) |
| 관리자 상품 관리 `/admin/products` | `app/admin/products/page.tsx` | `/api/admin/products` 목록·등록·수정·삭제 |
| 관리자 회원 관리 `/admin/users` | `app/admin/users/page.tsx` | `GET /api/admin/users` |
| 관리자 통계 분석 `/admin/analytics` | `app/admin/analytics/page.tsx` | 백엔드 `GET /api/admin/analytics` **신규** |
| (공통 컴포넌트) | `components/common/PagePlaceholder.tsx` | 사용처가 없어지면 삭제 |

### "이미지 준비중" 문구
| 위치 | 처리 |
|---|---|
| `components/product/ProductImage.tsx` | 1단계에서 바로 카테고리 일러스트로 교체 (3단계는 업로드에 집중) |

### mock 데이터를 쓰는 곳 (`lib/api.ts` 가 `mocks/` 12개 파일을 import)
| 화면 / 기능 | `lib/api.ts` 함수 | 연결할 백엔드 API |
|---|---|---|
| 로그인 | `login`, `logout`, `getCurrentUser` | `POST /api/auth/login`, `GET /api/auth/me` (JWT) |
| 카테고리 필터 | `getCategories` | `GET /api/categories` |
| 상품 상세 재입고 알림 | `requestRestockAlert` | `POST /api/products/{id}/restock-alerts` **신규** |
| 장바구니 (`components/order/CartContext.tsx` 메모리 장바구니) | `getProductsByIds` | `/api/cart` 묶음 |
| 주문/결제 | `createOrder` | `POST /api/orders` |
| 마이페이지 주문 목록·배송 목록 | `getMyOrders` | `GET /api/orders` (+ 취소 `POST /api/orders/{id}/cancel`) |
| 배송 조회 상세 | `getShipment` | `GET /api/orders/{id}/tracking` |
| 마이페이지 요약 카드 | `getMyPageSummary` | `GET /api/orders` + 재입고 알림 목록으로 계산 |
| 취소 내역 / 반품 내역 | `getMyClaims` | `GET /api/users/me/claims?type=` **신규** |
| 재입고 알림 목록 | `getMyRestockAlerts`, `deleteRestockAlert` | `GET/DELETE /api/users/me/restock-alerts` **신규** |
| 내 정보 관리 | `verifyPassword`, `updateMyProfile` | `POST /api/users/me/verify-password`, `PUT /api/users/me`, `PATCH /api/users/me/password` |
| 배송지 관리 | `getMyAddresses` 외 4개 | `/api/users/me/addresses` 묶음 |
| AI 도우미 | `askAi` | `POST /api/assistant/chat` |
| 관리자 대시보드 | `getDashboardSummary` | `GET /api/admin/dashboard` |
| 관리자 주문 관리 | `getAdminOrders`, `updateOrderStatus` | `GET /api/admin/orders`, `PATCH /api/admin/orders/{id}/status` |
| 관리자 배송 관리 | `getAdminShipments`, `updateShipmentStatus` | `GET /api/admin/shipments` + 주문 상태 변경 API |
| 관리자 재고 관리 | `getInventoryTable` (공개 API 사용) | `GET /api/admin/inventories` (+ 5단계에서 `PUT` 조정) |
| 비밀번호 확인 화면 | "테스트용 비밀번호: 1234" 문구 | 삭제 |

### 결정 사항
- 로그인 토큰(JWT)은 브라우저 `localStorage` 에 저장하고 요청마다 `Authorization: Bearer` 헤더로 보낸다.
- 프론트 `types/` 의 상태값을 백엔드 enum 에 맞춘다 (`USER/ADMIN`, 주문 8단계, 배송 7단계).
- 배송 조회 주소 `/tracking/{id}` 의 id 는 **주문 번호**로 바꾼다 (백엔드가 주문 번호로 조회하므로).
- "교환"은 백엔드에 없는 기능이라 메뉴를 "반품(회수) 내역"으로 바꾼다.
- 작업이 끝나면 `mocks/` 폴더는 삭제한다.

### 1단계 결과
- 백엔드 신규 API: 재입고 알림 3개, 취소·회수 내역 1개, 관리자 통계 1개 (+ `MyPageFlowTest` 2개)
- 백엔드 응답 보강: 장바구니 줄에 `categoryName`, 주문 상품에 `imageUrl`·`categoryName`
- 프론트: `lib/api.ts` 전체를 실제 API 호출로 교체(JWT 저장·전송, `{code,message}` 에러 처리), 장바구니를 서버 장바구니로 교체,
  관리자 상품·회원·통계 화면 신규, 회원가입·이메일 로그인, `mocks/`·`PagePlaceholder` 삭제
- 재검색 결과: `PagePlaceholder|준비중|준비 중|@/mocks|mock` → **0건** (`app`, `components`, `lib`, `types`)

### 2단계 결과
- 로그인 필요 화면(장바구니, 주문/결제, MY 전체, 배송 조회, AI 도우미)을 `RequireLogin` 으로 감쌈
  → 로그인 안 했으면 `/login?redirect=원래주소` → 로그인/회원가입 성공 시 원래 화면으로
  - 다른 사이트 주소로 보내는 공격을 막으려고 `redirect` 는 `/` 로 시작하는 우리 사이트 주소만 허용 (`lib/redirect.ts`)
  - 로그아웃 버튼을 누른 화면에서는 로그인 화면이 아니라 홈으로 이동
- 헤더: 로그인 전 [로그인][회원가입], 로그인 후 "이름님 · 로그아웃", 관리자는 [관리자] 메뉴. 모바일에서는 메뉴가 아래 줄로 내려감
- 회원가입: 이메일·비밀번호(확인)·이름·전화번호 형식 검사, 칸별 에러, 이미 가입된 이메일(409)은 이메일 칸에 표시, 성공 시 자동 로그인
- 백엔드: 같은 이메일 동시 가입 시 500 → 409 `DUPLICATE_EMAIL` (`AuthService` 에서 unique 제약 위반을 잡음)
  - 수정 전 `SignupTest` 로 재현: 10명 동시 가입 → `[201, 500 × 9]` / 수정 후 `[201, 409 × 9]`, DB 에 1명만 저장
  - 새로 가입한 회원이 `users` 테이블에 저장되는지(BCrypt 암호화, USER 권한) 테스트로 확인

### 3단계 결과
- 백엔드 `POST /api/admin/products/{id}/image` (multipart, 이름표 `file`, 관리자만)
  - 검사: 빈 파일, 5MB 초과(413 `IMAGE_TOO_LARGE`), 확장자 jpg/jpeg/png/webp, **파일 앞부분(매직 넘버)으로 진짜 형식 확인** (400 `INVALID_IMAGE`)
  - 저장: `backend/uploads/products/{상품id}-{무작위}.{확장자}` (사용자가 보낸 파일 이름은 쓰지 않음), 예전에 올린 사진 파일 삭제
  - 제공: `GET /uploads/**` (누구나, `WebConfig`), `products.image_url = "/uploads/products/..."`
  - `.gitignore` 에 `backend/uploads/` 추가, 테스트는 `build/test-uploads` 에 저장
  - `ProductImageTest` 3개: 저장·제공·교체 시 예전 파일 삭제, 형식·크기·빈 파일·파일 없음·없는 상품, 권한(401/403)
- 프론트: 관리자 상품 등록·수정 폼에 사진 고르기 + 미리보기 (`ImagePicker`, 형식·5MB 먼저 검사), 저장할 때 함께 업로드
- 사진 없는 상품: 카테고리별 색·아이콘 일러스트 (식품=초록·사과, 생활용품=하늘·집, 전자기기=남색·헤드폰, 패션=분홍·티셔츠)
- `ProductImage` 사용처: 상품 목록·상세, 장바구니, 주문 내역, 재입고 알림, 관리자 상품 목록

### 4단계 결과
- 홈(`/`) 구성 (`app/(shop)/page.tsx` + `components/home/`)
  1. 상단 배너: "주문해도 되돌릴 수 있는 물류", [상품 보러가기] [배송 조회], 오른쪽에 주문 흐름(즉시 취소 / 회수 구간) 그림
  2. 카테고리 바로가기 4개 → `/products?categoryId=` (상품 목록이 주소의 카테고리를 골라 둔 채로 열림)
  3. 차별점 카드 3개: 단계별 취소·회수 / 동시 주문에도 정확한 재고 / 도착 시간 예측
  4. 오늘 출고 가능한 상품(당일 출고 센터 + 재고 있음), 품절 임박 상품(1~9개, 적게 남은 순) — 실제 상품·재고 API
  5. 배송 조회 빠른 입력(주문 번호 → `/tracking/{번호}`), AI 도우미 바로가기
- 반응형: 모바일 1~2열 → PC 3~4열, 불러오는 동안 같은 크기의 회색 카드 표시
- 카테고리 색·아이콘을 `CategoryIcon` 하나로 모아 상품 일러스트와 홈 바로가기가 같은 모양을 쓰게 함

### 5단계 결과
| 관리자 화면 | 동작 | API |
|---|---|---|
| 대시보드 `/admin` | 오늘 주문·매출, 배송중, 품절 임박, 지연, 상태별 주문 수, 7일 차트, 품절 임박 목록 | `GET /api/admin/dashboard` |
| 상품 `/admin/products` | 등록·수정·삭제(주문 이력 있으면 409 안내)·사진 업로드 | `/api/admin/products` 묶음 |
| 재고 `/admin/inventory` | 칸마다 [조정]/[+ 입고] 로 센터별 현재재고 변경 (예약보다 적으면 막음) | `PUT /api/admin/inventories` |
| 주문 `/admin/orders` | 상태 필터·페이지, [포장 시작]→[출고 처리]→[배송 시작]→[배송 완료], 회수중이면 [회수 완료] | `PATCH /api/admin/orders/{id}/status` |
| 배송 `/admin/shipments` | 배송 상태 필터, 예상 도착·지연 표시, 같은 다음 단계 버튼 | `GET /api/admin/shipments` |
| 회원 `/admin/users` | 회원 목록(주문 수, 전화번호 가림), 페이지 | `GET /api/admin/users` |
| 분석 `/admin/analytics` | 14일 매출 차트, 카테고리별 매출, TOP 5, 센터별 출고, 취소율·회수율 | `GET /api/admin/analytics` |

- 상태 변경·재고 조정·상품 저장 후에는 목록을 바로 다시 불러오고, 성공(초록)/실패(빨강) 알림(`Toast`)을 띄운다
  (실패 예: 고객이 방금 취소해서 409 → 알림 후 최신 상태로 새로고침)
- `AdminGuard`: 로그인 안 함 → `/login?redirect=/admin...`, 일반 회원 → "권한이 없습니다" 안내 후 2초 뒤 홈
- 관리자 메뉴: 현재 메뉴 강조, 모바일에서는 위쪽 가로 메뉴, 사이드바에 로그아웃
