package com.logistics.backend.assistant.dto;

// 답변 종류. 화면은 이 값을 보고 data 를 카드·버튼 등으로 그릴 수 있다
public enum AssistantReplyType {
    ORDER_STATUS,   // 최근 주문 배송 상태      data: OrderStatusData
    ETA,            // 도착 예상 시각            data: EtaData
    CANCEL_INFO,    // 취소하면 어떻게 되는지    data: CancelData
    PRODUCT_SEARCH, // 상품 검색 결과            data: List<ProductResponse>
    LOGIN_REQUIRED, // 로그인이 필요한 질문      data: null
    NO_ORDER,       // 주문 내역 없음            data: null
    HELP            // 사용 안내                 data: 예시 질문 목록
}
