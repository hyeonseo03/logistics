package com.logistics.backend.order.service;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.inventory.service.InventoryService;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderItem;
import com.logistics.backend.order.entity.OrderReturn;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.OrderStatusHistory;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.order.repository.OrderReturnRepository;
import com.logistics.backend.order.repository.OrderStatusHistoryRepository;
import com.logistics.backend.order.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// 주문 상태를 바꾸는 유일한 통로. 고객 취소와 관리자 상태 변경이 모두 여기를 지난다.
// 상태가 바뀔 때 함께 일어나야 하는 일(재고, 환불, 회수, 이력)을 한 곳에서 처리한다
//
//   → CANCELED  : 예약재고 해제 + 환불
//   → SHIPPED   : 실물재고 차감 (예약 → 실제 출고)
//   → RETURNING : 회수(returns) 생성
//   → RETURNED  : 실물재고 복구 + 회수 완료 + 환불
//   모든 변경   : 상태 이력(order_status_history) 기록
@Service
@RequiredArgsConstructor
public class OrderTransitionService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final OrderReturnRepository returnRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryService inventoryService;

    // 주문 id 로 상태 변경 (관리자 상태 변경 API 에서 사용)
    @Transactional
    public Order changeStatus(Long orderId, OrderStatus next, Long changedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        changeStatus(order, next, changedBy, null);
        return order;
    }

    @Transactional
    public void changeStatus(Order order, OrderStatus next, Long changedBy, String reason) {
        OrderStatus previous = order.getStatus();
        order.changeStatus(next); // 허용되지 않는 변경이면 여기서 예외

        // 주문 UPDATE 를 바로 DB 에 보낸다 (saveAndFlush).
        // 이때 "where version = ?" 검사가 실행되므로, 같은 주문을 다른 요청이 먼저 바꿨다면
        // 재고·환불을 건드리기 전에 여기서 바로 실패한다 (낙관적 락)
        orderRepository.saveAndFlush(order);

        LocalDateTime now = LocalDateTime.now();
        switch (next) {
            case CANCELED -> {
                for (OrderItem item : order.getItems()) {
                    inventoryService.release(item.getProduct().getId(), item.getWarehouse().getId(), item.getQuantity());
                }
                refund(order, reasonOr(reason, "주문 취소"), now);
            }
            case SHIPPED -> {
                for (OrderItem item : order.getItems()) {
                    inventoryService.ship(item.getProduct().getId(), item.getWarehouse().getId(), item.getQuantity());
                }
            }
            case RETURNING -> returnRepository.save(new OrderReturn(order, reasonOr(reason, "고객 취소 요청"), now));
            case RETURNED -> {
                for (OrderItem item : order.getItems()) {
                    inventoryService.restock(item.getProduct().getId(), item.getWarehouse().getId(), item.getQuantity());
                }
                returnRepository.findByOrderId(order.getId()).ifPresent(r -> r.complete(now));
                refund(order, "회수 완료 후 환불", now);
            }
            default -> {
                // PACKING, IN_TRANSIT, DELIVERED: 상태와 이력만 바뀐다
            }
        }

        historyRepository.save(new OrderStatusHistory(order, previous, next, changedBy, now));
    }

    private void refund(Order order, String reason, LocalDateTime now) {
        paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "결제 정보가 없습니다. 주문 id=" + order.getId()))
                .refund(reason, now);
    }

    private String reasonOr(String reason, String defaultReason) {
        return (reason == null || reason.isBlank()) ? defaultReason : reason.trim();
    }
}
