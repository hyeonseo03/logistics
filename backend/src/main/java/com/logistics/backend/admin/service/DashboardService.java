package com.logistics.backend.admin.service;

import com.logistics.backend.admin.dto.DailyOrderCount;
import com.logistics.backend.admin.dto.DashboardResponse;
import com.logistics.backend.inventory.dto.InventoryResponse;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.order.dto.OrderStatusCount;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// 관리자 대시보드: 여러 테이블의 집계를 한 번에 모아 준다
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    static final int LOW_STOCK_THRESHOLD = 10; // 프론트 lib/stock.ts 와 같은 기준 (판매가능재고 10개 미만 = 품절임박)
    static final int DELAY_DAYS = 3;           // 주문 후 이 일수가 지나도 배송완료가 아니면 지연

    private static final Set<OrderStatus> REFUNDED_STATUSES = EnumSet.of(OrderStatus.CANCELED, OrderStatus.RETURNED);
    private static final Set<OrderStatus> IN_PROGRESS_STATUSES = EnumSet.of(
            OrderStatus.ORDERED, OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT);

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    public DashboardResponse getDashboard() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();

        long todayOrderCount = orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(todayStart, tomorrowStart);
        long todaySales = orderRepository.sumSales(todayStart, tomorrowStart, REFUNDED_STATUSES);

        // 상태별 주문 수: 0건인 상태도 화면에 보이도록 모든 상태를 0으로 채운 뒤 덮어쓴다
        Map<OrderStatus, Long> statusCounts = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            statusCounts.put(status, 0L);
        }
        for (OrderStatusCount row : orderRepository.countGroupByStatus()) {
            statusCounts.put(row.status(), row.count());
        }

        List<InventoryResponse> lowStockItems = inventoryRepository.findLowStock(LOW_STOCK_THRESHOLD).stream()
                .map(InventoryResponse::from)
                .toList();

        long totalOrders = statusCounts.values().stream().mapToLong(Long::longValue).sum();
        long shippingCount = statusCounts.get(OrderStatus.SHIPPED) + statusCounts.get(OrderStatus.IN_TRANSIT);
        long delayedCount = orderRepository.countByStatusInAndCreatedAtBefore(
                IN_PROGRESS_STATUSES, LocalDateTime.now().minusDays(DELAY_DAYS));

        return new DashboardResponse(
                todayOrderCount,
                todaySales,
                statusCounts,
                lowStockItems,
                LOW_STOCK_THRESHOLD,
                dailyOrders(today),
                totalOrders,
                shippingCount,
                lowStockItems.size(),
                delayedCount
        );
    }

    // 최근 7일(오늘 포함) 날짜별 주문 수. 주문이 없는 날은 0
    private List<DailyOrderCount> dailyOrders(LocalDate today) {
        LocalDate firstDay = today.minusDays(6);
        Map<LocalDate, Long> countByDate = orderRepository.findCreatedAtSince(firstDay.atStartOfDay()).stream()
                .collect(Collectors.groupingBy(LocalDateTime::toLocalDate, Collectors.counting()));

        List<DailyOrderCount> result = new ArrayList<>();
        for (LocalDate day = firstDay; !day.isAfter(today); day = day.plusDays(1)) {
            result.add(new DailyOrderCount(day, countByDate.getOrDefault(day, 0L)));
        }
        return result;
    }
}
