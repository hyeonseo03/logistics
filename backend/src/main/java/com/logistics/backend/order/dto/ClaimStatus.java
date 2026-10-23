package com.logistics.backend.order.dto;

// 취소·회수 내역의 진행 상태
public enum ClaimStatus {
    IN_PROGRESS, // 회수중
    COMPLETED    // 취소 완료 / 회수 완료
}
