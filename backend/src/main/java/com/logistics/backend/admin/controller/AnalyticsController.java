package com.logistics.backend.admin.controller;

import com.logistics.backend.admin.dto.AnalyticsResponse;
import com.logistics.backend.admin.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 관리자 통계 분석 (일별 매출, 카테고리별 매출, 인기 상품, 센터별 출고, 취소·회수 비율)
@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public AnalyticsResponse getAnalytics() {
        return analyticsService.getAnalytics();
    }
}
