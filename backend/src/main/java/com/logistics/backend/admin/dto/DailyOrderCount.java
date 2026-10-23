package com.logistics.backend.admin.dto;

import java.time.LocalDate;

// 하루치 주문 수 (대시보드 차트용, 프론트 types/admin.ts 의 DailyOrderCount)
public record DailyOrderCount(
        LocalDate date, // "2026-10-23"
        long count
) {
}
