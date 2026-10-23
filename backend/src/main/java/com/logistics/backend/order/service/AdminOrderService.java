package com.logistics.backend.order.service;

import com.logistics.backend.global.dto.PageResponse;
import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.order.dto.OrderResponse;
import com.logistics.backend.order.dto.OrderStatusHistoryResponse;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.order.repository.OrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrderService {

    // 관리자가 바꿀 수 있는 상태 (취소·회수 요청은 고객이 하는 일이라 여기서는 막는다)
    private static final Set<OrderStatus> ADMIN_STATUSES = EnumSet.of(
            OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.RETURNED);

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final OrderTransitionService transitionService;
    private final OrderResponseAssembler assembler;

    // GET /api/admin/orders?status=SHIPPED&page=0&size=20 (최신 주문이 위로)
    public PageResponse<OrderResponse> getOrders(OrderStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<Order> orders = (status == null)
                ? orderRepository.findAll(pageable)
                : orderRepository.findAllByStatus(status, pageable);

        List<OrderResponse> content = assembler.toResponses(orders.getContent());
        return PageResponse.from(new PageImpl<>(content, pageable, orders.getTotalElements()));
    }

    public OrderResponse getOrder(Long orderId) {
        return assembler.toResponse(findOrder(orderId));
    }

    public List<OrderStatusHistoryResponse> getHistory(Long orderId) {
        findOrder(orderId); // 없는 주문이면 404
        return historyRepository.findAllByOrderIdOrderByIdAsc(orderId).stream()
                .map(OrderStatusHistoryResponse::from)
                .toList();
    }

    // PATCH /api/admin/orders/{id}/status
    // 포장 → 출고 → 배송중 → 배송완료, 회수중 → 회수완료. 규칙에 어긋나면 409.
    // 같은 주문을 고객이 동시에 취소하면 @Version 으로 한쪽만 성공한다
    @Transactional
    public OrderResponse changeStatus(Long orderId, OrderStatus next, Long adminId) {
        if (!ADMIN_STATUSES.contains(next)) {
            throw new BusinessException(ErrorCode.INVALID_STATUS_CHANGE,
                    "'" + next.getLabel() + "' 상태는 관리자가 바꿀 수 없습니다. (고객 취소 요청으로만 가능)");
        }
        Order order = transitionService.changeStatus(orderId, next, adminId);
        return assembler.toResponse(order);
    }

    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }
}
