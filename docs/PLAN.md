# 백엔드 완성 작업 계획 (PLAN)

> 중간에 멈췄다가 다시 시작하면 이 파일에서 체크되지 않은 첫 단계부터 이어서 진행한다.
> 각 단계가 끝나면 `./gradlew build` 성공 확인 → `git commit -m "단계 이름"` (push 하지 않음).
> frontend 코드는 수정하지 않는다.

## 공통 결정 사항
- 테스트는 PostgreSQL 없이도 돌도록 H2 메모리 DB(PostgreSQL 호환 모드)를 테스트 전용으로 사용한다 (`src/test/resources/application.yml`).
- 재고 모델: 기존 `inventories.quantity`(실물) / `reserved_quantity`(예약) 를 그대로 활용한다.
  - 주문: 예약재고 += 수량 (조건: `quantity - reserved_quantity >= 주문수량`, 원자적 UPDATE)
  - 출고(SHIPPED): 실물재고 -= 수량, 예약재고 -= 수량
  - 출고 전 취소: 예약재고 -= 수량 (예약 해제) / 회수완료(RETURNED): 실물재고 += 수량
- 에러 응답은 항상 `{ "code": "...", "message": "..." }`.
- 비밀값은 환경변수: `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## 단계별 체크리스트
- [x] 0단계: 계획 수립 + 테스트 환경(H2) + 전역 예외 처리
- [x] 1단계: 회원·로그인 (Spring Security + JWT, 내 정보, 배송지)
- [x] 2단계: 장바구니
- [x] 3단계: 주문 (재고 원자적 차감, 모의 결제)
- [ ] 4단계: 되돌리기 (상태 전이, 취소/회수, 배송지 변경, 멱등·낙관적 락)
- [ ] 5단계: 배송 조회 + 도착 예상 시각 (EtaService)
- [ ] 6단계: 관리자 API
- [ ] 7단계: AI 도우미 (AssistantService)
- [ ] 8단계: 테스트·마무리 (동시성/되돌리기 테스트, 샘플 데이터, API.md, ERD.md)
