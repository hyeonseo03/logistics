package com.logistics.backend.order.dto;

// 취소·회수 내역의 종류
public enum ClaimType {
    CANCEL, // 출고 전 즉시 취소
    RETURN  // 출고 후 회수(반품)
}
