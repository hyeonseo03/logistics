package com.logistics.backend.shipment.dto;

import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.warehouse.entity.WarehouseRegion;

import java.time.LocalDateTime;

// 도착 예상 시각 계산에 필요한 값 (EtaService 의 입력)
// 나중에 AI 모델로 바꿀 때도 같은 입력을 쓰면 되도록 엔티티가 아닌 값만 담는다
public record EtaRequest(
        OrderStatus status,
        LocalDateTime orderedAt,
        LocalDateTime shippedAt,    // 센터 출발 (출고 전이면 null)
        LocalDateTime inTransitAt,  // 캠프 도착 (아직이면 null)
        LocalDateTime deliveredAt,  // 배송 완료 (아직이면 null)
        WarehouseRegion fromRegion, // 출고 센터 지역
        WarehouseRegion toRegion,   // 배송지 지역
        LocalDateTime now           // 기준 시각 (테스트에서 고정할 수 있게 밖에서 넣는다)
) {
}
