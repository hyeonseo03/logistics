@AGENTS.md

# Logistics 프론트엔드

## 프로젝트 개요
- AI 물류·유통 플랫폼의 프론트엔드. 지금은 백엔드 없이 mock 데이터로만 동작한다.
- 나중에 Spring Boot 백엔드(REST API)와 연결할 예정이다.
- 나는 비전공자 초보 개발자다. 코드는 단순하고 읽기 쉽게 쓰고, 어려운 패턴은 피한다.

## 기술
- Next.js (App Router) + React + TypeScript + Tailwind CSS
- 추가 라이브러리는 꼭 필요할 때만, 설치 전에 이유를 말해줄 것

## 폴더 규칙
- types/ : 데이터 타입 정의 (나중에 백엔드 DTO와 일치시킬 것)
- mocks/ : 가짜 데이터
- lib/api.ts : 화면은 반드시 여기 함수만 호출한다. 지금은 mock을 반환하고, 나중에 fetch로 교체한다.
- components/ : common, product, order, shipment, admin, ai 로 나눈다
- 페이지 컴포넌트에서 mocks를 직접 import하지 않는다

## 데이터 규칙
- mock 데이터는 DB 테이블처럼 id로 서로 참조한다 (예: order_items.productId)
- 상태값은 enum 문자열 타입 사용 (예: "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED")
- 테이블: users, categories, products, warehouses, inventory, orders, order_items, shipments, shipment_events

## 작업 방식
- 한 번에 너무 많이 만들지 말고 단계별로 진행한다
- 작업이 끝나면 무엇을 만들었는지, 어떤 파일을 봐야 하는지 한국어로 짧게 설명한다
- 화면을 만들 때마다 docs/api-wishlist.md 에 "이 화면에 필요한 데이터와 API"를 추가한다
