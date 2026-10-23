package com.logistics.backend.order.entity;

// 결제 수단 (프론트 types/order.ts 의 PaymentMethod 와 같은 값). 실제 결제 연동은 하지 않는다 (모의 결제)
public enum PaymentMethod {
    CARD,
    BANK_TRANSFER
}
