package com.logistics.backend.admin.service;

import com.logistics.backend.admin.dto.AnalyticsResponse;
import com.logistics.backend.admin.dto.AnalyticsResponse.CategorySales;
import com.logistics.backend.admin.dto.AnalyticsResponse.DailySales;
import com.logistics.backend.admin.dto.AnalyticsResponse.ProductSales;
import com.logistics.backend.admin.dto.AnalyticsResponse.WarehouseShipments;
import com.logistics.backend.order.dto.OrderStatusCount;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderItem;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.repository.OrderItemRepository;
import com.logistics.backend.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

// 관리자 통계 분석
// 데이터가 많지 않은 학습용 프로젝트라서, 필요한 행을 한 번에 읽어 온 뒤 자바 코드로 묶어서 센다
// (데이터가 많아지면 group by 쿼리로 옮기면 된다)
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    static final int DAYS = 14;
    static final int TOP_PRODUCT_COUNT = 5;

    // 환불된 주문은 매출에서 뺀다
    private static final Set<OrderStatus> REFUNDED_STATUSES = EnumSet.of(OrderStatus.CANCELED, OrderStatus.RETURNED);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public AnalyticsResponse getAnalytics() {
        List<OrderItem> soldItems = orderItemRepository.findAllForAnalytics(REFUNDED_STATUSES);

        // 상태별 주문 수 (취소율·회수율 계산용)
        Map<OrderStatus, Long> statusCounts = new LinkedHashMap<>();
        for (OrderStatusCount row : orderRepository.countGroupByStatus()) {
            statusCounts.put(row.status(), row.count());
        }
        long totalOrders = statusCounts.values().stream().mapToLong(Long::longValue).sum();
        long canceled = statusCounts.getOrDefault(OrderStatus.CANCELED, 0L);
        long returned = statusCounts.getOrDefault(OrderStatus.RETURNING, 0L)
                + statusCounts.getOrDefault(OrderStatus.RETURNED, 0L);

        return new AnalyticsResponse(
                dailySales(LocalDate.now()),
                categorySales(soldItems),
                topProducts(soldItems),
                warehouseShipments(soldItems),
                totalOrders,
                canceled,
                returned
        );
    }

    // 최근 14일: 주문 수는 모든 주문, 매출은 환불되지 않은 주문만
    private List<DailySales> dailySales(LocalDate today) {
        LocalDate firstDay = today.minusDays(DAYS - 1);
        List<Order> orders = orderRepository.findAllByCreatedAtGreaterThanEqual(firstDay.atStartOfDay());

        List<DailySales> result = new ArrayList<>();
        for (LocalDate day = firstDay; !day.isAfter(today); day = day.plusDays(1)) {
            long count = 0;
            long sales = 0;
            for (Order order : orders) {
                if (!order.getCreatedAt().toLocalDate().equals(day)) {
                    continue;
                }
                count++;
                if (!REFUNDED_STATUSES.contains(order.getStatus())) {
                    sales += order.getTotalPrice();
                }
            }
            result.add(new DailySales(day, count, sales));
        }
        return result;
    }

    private List<CategorySales> categorySales(List<OrderItem> items) {
        Map<String, long[]> byCategory = new LinkedHashMap<>(); // 카테고리 이름 → [수량, 매출]
        for (OrderItem item : items) {
            long[] sum = byCategory.computeIfAbsent(item.getProduct().getCategory().getName(), key -> new long[2]);
            sum[0] += item.getQuantity();
            sum[1] += item.getLineTotal();
        }
        return byCategory.entrySet().stream()
                .map(e -> new CategorySales(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .sorted(Comparator.comparingLong(CategorySales::sales).reversed())
                .toList();
    }

    private List<ProductSales> topProducts(List<OrderItem> items) {
        Map<Long, ProductSales> byProduct = new LinkedHashMap<>();
        for (OrderItem item : items) {
            Long productId = item.getProduct().getId();
            ProductSales before = byProduct.getOrDefault(productId,
                    new ProductSales(productId, item.getProduct().getName(), 0, 0));
            byProduct.put(productId, new ProductSales(productId, before.productName(),
                    before.quantity() + item.getQuantity(), before.sales() + item.getLineTotal()));
        }
        return byProduct.values().stream()
                .sorted(Comparator.comparingLong(ProductSales::quantity).reversed()
                        .thenComparing(Comparator.comparingLong(ProductSales::sales).reversed()))
                .limit(TOP_PRODUCT_COUNT)
                .toList();
    }

    private List<WarehouseShipments> warehouseShipments(List<OrderItem> items) {
        Map<String, Long> byWarehouse = new LinkedHashMap<>();
        for (OrderItem item : items) {
            byWarehouse.merge(item.getWarehouse().getName(), (long) item.getQuantity(), Long::sum);
        }
        return byWarehouse.entrySet().stream()
                .map(e -> new WarehouseShipments(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(WarehouseShipments::quantity).reversed())
                .toList();
    }
}
