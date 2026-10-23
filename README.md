# LOGISTICS — 주문해도 되돌릴 수 있는 물류

AI 물류·유통 플랫폼 학습 프로젝트입니다.
쇼핑몰(상품 → 장바구니 → 주문)과 물류(센터별 재고 → 출고 → 배송 → 도착 예측)를 한 흐름으로 연결하고,
**주문한 뒤에도 배송 단계에 맞게 되돌릴 수 있는 것**(출고 전 즉시 취소 / 출고 후 회수)을 핵심으로 만들었습니다.

```
frontend/  Next.js 쇼핑몰 + 관리자 화면 (http://localhost:3000)
backend/   Spring Boot REST API (http://localhost:8080)
docs/      API.md(API 목록), ERD.md(테이블), DEMO.md(시연 순서), PLAN*.md(작업 기록)
```

## 주요 기능

**고객**
- 회원가입·로그인 (JWT). 로그인이 필요한 화면은 `/login?redirect=원래주소` 로 갔다가 로그인 후 돌아온다
- 상품 목록(검색·카테고리·정렬)·상세: 재고 배지(구매 가능 / 품절 임박 / 품절), 당일 출고, 예상 도착일, 사진이 없으면 카테고리 일러스트
- 장바구니(서버 저장), 주문/결제(모의 결제), 저장된 배송지 선택
- **단계별 되돌리기**: 주문완료·포장 단계면 즉시 취소+환불, 출고 이후면 회수 요청 → 회수 완료 시 재고 복구+환불. 버튼을 누르기 전에 "지금 취소하면 어떻게 되는지"를 보여준다
- 배송 조회: 4단계 타임라인, 배송 이력, **도착 예상 시각**(센터 처리 → 고속도로 이동 → 캠프 분류 → 집 앞 배송 구간별 계산)
- 마이페이지: 주문 목록, 배송 조회, 취소 내역, 반품(회수) 내역, 재입고 알림, 내 정보(비밀번호 재확인 후 수정), 배송지 관리
- AI 도우미: "내 주문 어디쯤이야?", "언제 도착해?", "지금 취소하면?", 상품 검색 (규칙 기반, 나중에 AI 모델로 교체할 수 있게 인터페이스로 분리)

**관리자** (`/admin`, ADMIN 만)
- 대시보드: 오늘 주문·매출, 상태별 주문 수, 품절 임박 재고, 지연 배송, 최근 7일 차트
- 상품 등록·수정·삭제 + 사진 업로드(jpg·png·webp, 5MB 이하, 미리보기)
- 물류센터별 재고 조정, 주문 상태 변경(포장 → 출고 → 배송중 → 배송완료, 회수 완료), 배송 목록(예상 도착·지연), 회원 목록, 통계 분석

**백엔드에서 신경 쓴 점**
- 동시 주문에도 정확한 재고: "판매가능재고 ≥ 주문 수량" 조건을 넣은 UPDATE 한 줄로 예약 → 마지막 1개에 100명이 동시에 주문해도 1명만 성공 (`StockConcurrencyTest`)
- 고객 취소와 관리자 출고가 동시에 오면 `@Version` 낙관적 락으로 한쪽만 성공, 같은 취소 요청이 여러 번 와도 한 번만 처리(멱등)
- 같은 이메일로 동시에 가입해도 500 이 아니라 409 (`SignupTest`)
- 에러 응답은 항상 `{ "code": "...", "message": "..." }`

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| 백엔드 | Java 21, Spring Boot 4.1, Spring Data JPA, Spring Security + JWT(jjwt 0.12), Bean Validation, Lombok, Gradle |
| 데이터베이스 | PostgreSQL (실행), H2 메모리 DB (테스트 전용, PostgreSQL 호환 모드) |

## 실행 방법

### 1. PostgreSQL
`logistics` 데이터베이스를 만든다. (사용자 `postgres`, 포트 5432)
```sql
CREATE DATABASE logistics;
```
테이블은 서버가 처음 켜질 때 엔티티에 맞춰 자동으로 만든다 (`ddl-auto: update`).

### 2. 백엔드 (http://localhost:8080)
```bash
cd backend
cp .env.example .env      # 값을 채운다 (아래 "환경변수" 참고). .env 는 git 에 올라가지 않는다
./gradlew bootRun         # Windows: gradlew.bat bootRun
```
처음 실행하면 자동으로 만들어지는 것
- 관리자 계정 (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- 카테고리 4개, 상품 12개, 물류센터 3곳(서울·경기·부산)과 재고
- 샘플 주문 8건 (`orders` 가 비어 있을 때만. 샘플 고객은 로그인할 수 없으니 화면 확인은 직접 회원가입해서 한다)

### 3. 프론트엔드 (http://localhost:3000)
```bash
cd frontend
npm install
cp .env.example .env.local   # 백엔드 주소가 기본값(http://localhost:8080)이면 생략 가능
npm run dev
```

### 4. 테스트
```bash
cd backend && ./gradlew build             # 전체 테스트 (H2 사용, PostgreSQL 없어도 됨)
cd frontend && npx tsc --noEmit && npm run lint
```

시연 순서는 [`docs/DEMO.md`](docs/DEMO.md) 를 보면 된다.

## 환경변수

비밀번호·키는 코드에 쓰지 않고 모두 환경변수로 받는다.

| 위치 | 이름 | 설명 |
|---|---|---|
| `backend/.env` | `DB_PASSWORD` | PostgreSQL `postgres` 계정 비밀번호 |
| | `JWT_SECRET` | 로그인 토큰 서명 키 (32자 이상의 임의 문자열) |
| | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | 서버 시작 시 만들 관리자 계정 (비우면 만들지 않음, 이미 있으면 건너뜀) |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | 백엔드 주소 (기본 `http://localhost:8080`) |

- 백엔드는 `http://localhost:3000` 에서 오는 요청만 허용한다 (CORS, `SecurityConfig`).
- 관리자가 올린 상품 사진은 `backend/uploads/` 에 저장되고 `/uploads/**` 주소로 제공된다 (git 에 올리지 않음).

## 화면 주소

| 고객 | 관리자 |
|---|---|
| `/` 홈, `/products`, `/products/{id}` | `/admin` 대시보드 |
| `/login`, `/signup` | `/admin/products` 상품 (사진 업로드) |
| `/cart`, `/checkout` | `/admin/inventory` 재고 조정 |
| `/tracking/{주문번호}` 배송 조회 | `/admin/orders` 주문 상태 변경 |
| `/mypage` (orders, shipments, cancellations, returns, restock-alerts, profile, addresses) | `/admin/shipments` 배송 |
| `/ai` AI 도우미 | `/admin/users` 회원, `/admin/analytics` 통계 |

## 문서
- [`docs/API.md`](docs/API.md) — REST API 목록과 요청·응답 예시
- [`docs/ERD.md`](docs/ERD.md) — 테이블 관계와 재고가 움직이는 시점
- [`docs/DEMO.md`](docs/DEMO.md) — 시연 순서와 코드 점검 결과
- [`docs/PLAN.md`](docs/PLAN.md), [`docs/PLAN-POLISH.md`](docs/PLAN-POLISH.md) — 단계별 작업 기록
