package com.logistics.backend.shipment.dto;

import java.time.LocalDateTime;

// 예상 시각 계산의 한 구간 (예: "고속도로 이동 62분")
public record EtaStep(
        String name,
        int minutes,
        LocalDateTime startAt,
        LocalDateTime endAt
) {
}
