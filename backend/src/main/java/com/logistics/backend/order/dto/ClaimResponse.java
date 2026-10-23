package com.logistics.backend.order.dto;

import java.time.LocalDateTime;

// GET /api/users/me/claims 응답 한 줄: 취소 또는 회수 내역 + 주문 정보
public record ClaimResponse(
        Long orderId,
        ClaimType type,
        ClaimStatus status,
        String statusLabel,        // 화면 표시용 (예: "취소완료", "회수중")
        String reason,             // 취소·회수 사유 (없으면 null)
        LocalDateTime requestedAt, // 신청 시각
        LocalDateTime completedAt, // 완료 시각 (진행 중이면 null)
        OrderResponse order
) {
}
