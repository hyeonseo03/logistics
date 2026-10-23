package com.logistics.backend.admin.dto;

import java.time.LocalDate;
import java.util.List;

// GET /api/admin/analytics 응답: 관리자 "통계 분석" 화면
// 매출·판매 수량은 취소·회수완료(환불된) 주문을 뺀 값이다
public record AnalyticsResponse(
        List<DailySales> dailySales,         // 최근 14일 일별 주문 수·매출 (오래된 날짜부터)
        List<CategorySales> categorySales,   // 카테고리별 판매 수량·매출 (매출 큰 순)
        List<ProductSales> topProducts,      // 많이 팔린 상품 TOP 5 (판매 수량 순)
        List<WarehouseShipments> warehouses, // 물류센터별 출고 수량 (주문 상품 기준)
        long totalOrders,                    // 전체 주문 수
        long canceledOrders,                 // 출고 전 취소 수
        long returnedOrders                  // 회수중 + 회수완료 수
) {

    public record DailySales(LocalDate date, long orderCount, long sales) {
    }

    public record CategorySales(String categoryName, long quantity, long sales) {
    }

    public record ProductSales(Long productId, String productName, long quantity, long sales) {
    }

    public record WarehouseShipments(String warehouseName, long quantity) {
    }
}
