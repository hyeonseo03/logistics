package com.logistics.backend.order.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

// "지금 취소하면 어떻게 되는지" (OrderStatus.cancelType() 이 정해 준다)
@Getter
@RequiredArgsConstructor
public enum CancelType {
    IMMEDIATE_CANCEL(true, "즉시 취소", "지금 취소하면 바로 취소되고 결제 금액이 전액 환불됩니다."),
    RETURN(true, "회수", "이미 출고되어 취소하면 택배 기사님이 상품을 회수합니다. 회수가 완료되면 환불됩니다."),
    ALREADY_PROCESSED(false, "처리됨", "이미 취소 또는 회수가 진행 중이거나 완료된 주문입니다.");

    private final boolean cancelable; // 취소 버튼을 보여줄지
    private final String label;
    private final String description;
}
