package com.logistics.backend.order.dto;

import com.logistics.backend.order.entity.CancelType;
import com.logistics.backend.order.entity.OrderStatus;

// "지금 취소하면 어떻게 되는지" 미리보기. 주문 응답마다 들어 있어서 화면이 취소 버튼 문구를 정할 수 있다
// 예) { "cancelable": true, "type": "RETURN", "label": "회수", "message": "이미 출고되어 ..." }
public record CancelInfo(
        boolean cancelable,
        CancelType type,
        String label,
        String message
) {

    public static CancelInfo from(OrderStatus status) {
        CancelType type = status.cancelType();
        return new CancelInfo(type.isCancelable(), type, type.getLabel(), type.getDescription());
    }
}
