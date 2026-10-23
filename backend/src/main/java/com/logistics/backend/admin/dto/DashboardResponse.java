package com.logistics.backend.admin.dto;

import com.logistics.backend.inventory.dto.InventoryResponse;
import com.logistics.backend.order.entity.OrderStatus;

import java.util.List;
import java.util.Map;

// GET /api/admin/dashboard 응답
public record DashboardResponse(
        long todayOrderCount,                 // 오늘 주문 수
        long todaySales,                      // 오늘 매출 (취소·회수완료 제외)
        Map<OrderStatus, Long> statusCounts,  // 상태별 주문 수 (0건인 상태도 포함)
        List<InventoryResponse> lowStockItems,// 품절임박 재고 (판매가능재고가 기준 미만인 센터별 재고)
        int lowStockThreshold,                // 품절임박 기준 (이 수량 미만)
        List<DailyOrderCount> dailyOrders,    // 최근 7일 일별 주문 수 (오래된 날짜부터)

        // 프론트 types/admin.ts 의 DashboardSummary 에 있는 값
        long totalOrders,
        long shippingCount,                   // 출고 + 배송중
        long lowStockCount,
        long delayedCount                     // 주문 후 3일이 지났는데 아직 배송완료 전
) {
}
