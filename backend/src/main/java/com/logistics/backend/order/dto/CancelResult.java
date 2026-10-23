package com.logistics.backend.order.dto;

// 취소 요청을 처리한 결과
public enum CancelResult {
    CANCELED,          // 즉시 취소됨 (재고 복구 + 환불 완료)
    RETURN_REQUESTED,  // 출고 후라서 회수 요청됨 (회수 완료 후 재고 복구 + 환불)
    ALREADY_PROCESSED  // 이미 취소/회수된 주문 → 아무것도 하지 않고 성공 응답 (멱등)
}
