# Logistics 백엔드

## 프로젝트 개요
- AI 물류·유통 플랫폼 Logistics의 백엔드. 프론트엔드(Next.js, ../frontend)는 mock 데이터로 이미 만들어져 있다.
- 프론트의 types/ 와 docs/api-wishlist.md 가 API 설계 기준이다. 응답 JSON 모양을 프론트 타입과 맞춘다.
- 나는 비전공자 초보 개발자고 목표는 백엔드 취업이다. 단순하고 교과서적인 Spring 구조로 작성한다.

## 기술
- Java 21, Spring Boot, Spring Data JPA, PostgreSQL, Gradle, Lombok
- 새 의존성은 꼭 필요할 때만, 추가 전에 이유를 설명할 것

## 패키지 규칙 (기능별)
com.logistics.backend 아래에 global, product, category, user, order, inventory, warehouse, shipment
각 기능 안에 controller, service, repository, entity, dto

## 코드 규칙
- Controller는 요청/응답만, 업무 로직은 Service, DB 접근은 Repository
- Entity를 그대로 응답하지 않고 DTO로 변환
- API 주소는 /api 로 시작
- DB 비밀번호는 코드에 쓰지 않고 환경변수 DB_PASSWORD 로 받는다

## 작업 방식
- 한 번에 기능 하나씩
- 작업 후 만든 파일과 요청 흐름을 한국어로 짧게 설명하고, 핵심 개념 2~3개를 초보자 눈높이로 알려줄 것
