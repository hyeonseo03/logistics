package com.logistics.backend.order.entity;

public enum ReturnStatus {
    REQUESTED, // 회수중 (기사님이 회수하러 가는 중)
    COMPLETED  // 회수완료 (센터에 입고되어 재고 복구됨)
}
