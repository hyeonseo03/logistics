package com.logistics.backend.order.dto;

import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.PaymentMethod;
import com.logistics.backend.order.entity.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;

// 주문 응답 (프론트 types/order.ts 의 OrderWithDetails 와 비슷한 모양)
public record OrderResponse(
        Long id,
        Long userId,
        OrderStatus status,
        String statusLabel,       // 화면 표시용 한국어 (예: "주문완료")
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        int productTotal,
        int shippingFee,
        int totalPrice,
        String receiverName,
        String receiverPhone,
        String address,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {

    public static OrderResponse of(Order order, PaymentStatus paymentStatus) {
        return new OrderResponse(
                order.getId(),
                order.getUser().getId(),
                order.getStatus(),
                order.getStatus().getLabel(),
                order.getPaymentMethod(),
                paymentStatus,
                order.getProductTotal(),
                order.getShippingFee(),
                order.getTotalPrice(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getAddress(),
                order.getCreatedAt(),
                order.getItems().stream().map(OrderItemResponse::from).toList()
        );
    }
}
