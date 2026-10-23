package com.logistics.backend.shipment.dto;

import com.logistics.backend.shipment.entity.ShipmentEvent;
import com.logistics.backend.shipment.entity.ShipmentStatus;

import java.time.LocalDateTime;

// 배송 이력 한 줄 (프론트 types/shipment.ts 의 ShipmentEvent. description 대신 message)
public record ShipmentEventResponse(
        Long id,
        Long shipmentId,
        ShipmentStatus status,
        String statusLabel,
        String location,
        String message,
        LocalDateTime occurredAt
) {

    public static ShipmentEventResponse from(ShipmentEvent event) {
        return new ShipmentEventResponse(
                event.getId(),
                event.getShipment().getId(),
                event.getStatus(),
                event.getStatus().getLabel(),
                event.getLocation(),
                event.getMessage(),
                event.getOccurredAt()
        );
    }
}
