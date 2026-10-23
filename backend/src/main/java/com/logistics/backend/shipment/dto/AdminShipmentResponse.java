package com.logistics.backend.shipment.dto;

import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderStatus;

import java.time.LocalDateTime;

// 관리자 배송 목록 한 줄 (프론트 types/admin.ts 의 AdminShipment 와 비슷한 모양)
public record AdminShipmentResponse(
        ShipmentResponse shipment,
        OrderStatus orderStatus,
        String receiverName,
        String address,
        ShipmentEventResponse lastEvent,      // 가장 최근 배송 이력 (없으면 null)
        LocalDateTime estimatedArrivalAt,     // 예상 도착 시각 (취소·회수면 null)
        boolean delayed                       // 예상 시각이 지났는데 아직 도착 전
) {

    public static AdminShipmentResponse of(ShipmentResponse shipment, Order order, ShipmentEventResponse lastEvent,
                                           EtaResult eta) {
        return new AdminShipmentResponse(
                shipment,
                order.getStatus(),
                order.getReceiverName(),
                order.getAddress(),
                lastEvent,
                eta == null ? null : eta.estimatedArrivalAt(),
                eta != null && eta.delayed()
        );
    }
}
