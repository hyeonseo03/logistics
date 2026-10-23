package com.logistics.backend.shipment.dto;

import com.logistics.backend.order.entity.OrderStatus;

import java.util.List;

// GET /api/orders/{id}/tracking 응답: 배송 정보 + 타임라인 + 도착 예상 시각
public record TrackingResponse(
        Long orderId,
        OrderStatus orderStatus,
        String orderStatusLabel,
        String receiverName,
        String address,
        ShipmentResponse shipment,
        List<ShipmentEventResponse> events, // 오래된 순서
        EtaResult eta                       // 취소·회수 주문이면 null
) {
}
