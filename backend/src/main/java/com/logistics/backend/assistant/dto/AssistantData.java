package com.logistics.backend.assistant.dto;

import com.logistics.backend.order.dto.CancelInfo;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.shipment.dto.EtaResult;

import java.util.List;

// AssistantResponse.data 에 들어가는 값들
public final class AssistantData {

    private AssistantData() {
    }

    public record OrderStatusData(
            Long orderId,
            String productSummary, // 예: "제주 감귤 3kg 외 1건"
            OrderStatus status,
            String statusLabel,
            String trackingNumber,
            String lastLocation,   // 가장 최근 배송 이력 위치
            String lastMessage
    ) {
    }

    public record EtaData(
            Long orderId,
            String productSummary,
            EtaResult eta
    ) {
    }

    public record CancelData(
            Long orderId,
            String productSummary,
            OrderStatus status,
            CancelInfo cancelInfo
    ) {
    }

    public record HelpData(
            List<String> examples
    ) {
    }
}
