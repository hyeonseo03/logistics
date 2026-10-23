package com.logistics.backend.shipment.dto;

import com.logistics.backend.shipment.entity.Shipment;
import com.logistics.backend.shipment.entity.ShipmentStatus;

import java.time.LocalDateTime;

// 프론트 types/shipment.ts 의 Shipment + 센터 이름
public record ShipmentResponse(
        Long id,
        Long orderId,
        Long warehouseId,
        String warehouseName,
        String courier,
        String trackingNumber, // 출고 전에는 null
        ShipmentStatus status,
        String statusLabel,
        LocalDateTime shippedAt,
        LocalDateTime inTransitAt,
        LocalDateTime deliveredAt
) {

    public static ShipmentResponse from(Shipment shipment) {
        return new ShipmentResponse(
                shipment.getId(),
                shipment.getOrder().getId(),
                shipment.getWarehouse().getId(),
                shipment.getWarehouse().getName(),
                shipment.getCourier(),
                shipment.getTrackingNumber(),
                shipment.getStatus(),
                shipment.getStatus().getLabel(),
                shipment.getShippedAt(),
                shipment.getInTransitAt(),
                shipment.getDeliveredAt()
        );
    }
}
