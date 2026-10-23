package com.logistics.backend.order.service;

import com.logistics.backend.order.dto.OrderResponse;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.Payment;
import com.logistics.backend.order.entity.PaymentStatus;
import com.logistics.backend.order.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// 주문 엔티티 여러 개 → 응답 DTO 로 바꾼다.
// 주문마다 결제 정보를 따로 조회하지 않고(N+1 방지) 한 번에 모아서 붙인다.
// 고객 주문 API 와 관리자 주문 API 가 같이 쓴다
@Component
@RequiredArgsConstructor
public class OrderResponseAssembler {

    private final PaymentRepository paymentRepository;

    public List<OrderResponse> toResponses(List<Order> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }
        List<Long> orderIds = orders.stream().map(Order::getId).toList();

        Map<Long, PaymentStatus> paymentStatusByOrderId = paymentRepository.findAllByOrderIdIn(orderIds).stream()
                .collect(Collectors.toMap(p -> p.getOrder().getId(), Payment::getStatus));

        return orders.stream()
                .map(order -> OrderResponse.of(order, paymentStatusByOrderId.get(order.getId())))
                .toList();
    }

    public OrderResponse toResponse(Order order) {
        return toResponses(List.of(order)).get(0);
    }
}
