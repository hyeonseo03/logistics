package com.logistics.backend.order.service;

import com.logistics.backend.order.dto.ClaimResponse;
import com.logistics.backend.order.dto.ClaimStatus;
import com.logistics.backend.order.dto.ClaimType;
import com.logistics.backend.order.dto.OrderResponse;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderReturn;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.Payment;
import com.logistics.backend.order.entity.ReturnStatus;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.order.repository.OrderReturnRepository;
import com.logistics.backend.order.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

// 마이페이지 "취소 내역", "반품(회수) 내역"
// 따로 테이블을 두지 않고, 이미 있는 데이터에서 만든다
//  - 취소: 상태가 CANCELED 인 주문 + 결제(payments)의 환불 사유·환불 시각
//  - 회수: 상태가 RETURNING/RETURNED 인 주문 + 회수(returns)의 사유·요청·완료 시각
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClaimService {

    private static final Set<OrderStatus> RETURN_STATUSES = EnumSet.of(OrderStatus.RETURNING, OrderStatus.RETURNED);

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderReturnRepository returnRepository;
    private final OrderResponseAssembler assembler;

    public List<ClaimResponse> getMyClaims(Long userId, ClaimType type) {
        List<Order> orders = orderRepository.findAllByUserIdOrderByLatest(userId).stream()
                .filter(order -> type == ClaimType.CANCEL
                        ? order.getStatus() == OrderStatus.CANCELED
                        : RETURN_STATUSES.contains(order.getStatus()))
                .toList();
        if (orders.isEmpty()) {
            return List.of();
        }

        List<Long> orderIds = orders.stream().map(Order::getId).toList();
        Map<Long, OrderResponse> responseById = assembler.toResponses(orders).stream()
                .collect(Collectors.toMap(OrderResponse::id, Function.identity()));

        List<ClaimResponse> result = new ArrayList<>();
        if (type == ClaimType.CANCEL) {
            for (Payment payment : paymentRepository.findAllByOrderIdIn(orderIds)) {
                result.add(new ClaimResponse(
                        payment.getOrder().getId(),
                        ClaimType.CANCEL,
                        ClaimStatus.COMPLETED,
                        "취소완료",
                        payment.getRefundReason(),
                        payment.getRefundedAt(),
                        payment.getRefundedAt(),
                        responseById.get(payment.getOrder().getId())
                ));
            }
        } else {
            for (OrderReturn orderReturn : returnRepository.findAllByOrderIdIn(orderIds)) {
                boolean completed = orderReturn.getStatus() == ReturnStatus.COMPLETED;
                result.add(new ClaimResponse(
                        orderReturn.getOrder().getId(),
                        ClaimType.RETURN,
                        completed ? ClaimStatus.COMPLETED : ClaimStatus.IN_PROGRESS,
                        completed ? "회수완료" : "회수중",
                        orderReturn.getReason(),
                        orderReturn.getRequestedAt(),
                        orderReturn.getCompletedAt(),
                        responseById.get(orderReturn.getOrder().getId())
                ));
            }
        }

        // 최근 신청이 위로
        result.sort(Comparator.comparing(ClaimResponse::requestedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }
}
