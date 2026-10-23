package com.logistics.backend.shipment.dto;

import java.time.LocalDateTime;
import java.util.List;

// 도착 예상 시각 (EtaService 의 결과)
public record EtaResult(
        LocalDateTime estimatedArrivalAt, // 예상 도착 시각 (배송완료면 실제 도착 시각)
        boolean delivered,                // 이미 도착했는지
        boolean delayed,                  // 계산한 시각이 이미 지났는지 (늦어지는 중)
        List<EtaStep> steps,              // 남은 구간별 소요 시간 (화면에서 "왜 이 시각인지" 설명용)
        String method,                    // 계산 방식 (예: "RULE_BASED", 나중에 "AI_MODEL")
        String message                    // 사용자에게 보여줄 한 줄 설명
) {
}
