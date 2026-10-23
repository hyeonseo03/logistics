package com.logistics.backend.shipment;

import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.shipment.dto.EtaRequest;
import com.logistics.backend.shipment.dto.EtaResult;
import com.logistics.backend.shipment.service.RuleBasedEtaService;
import com.logistics.backend.warehouse.entity.WarehouseRegion;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

// 스프링 없이 순수 자바로 계산 규칙만 확인하는 단위 테스트
class RuleBasedEtaServiceTest {

    private final RuleBasedEtaService etaService = new RuleBasedEtaService();
    private static final LocalDateTime DAY = LocalDateTime.of(2026, 10, 23, 0, 0);

    @ParameterizedTest(name = "{0}시 출고 → 고속도로 {1}분")
    @CsvSource({"0,55", "5,55", "6,62", "13,62", "14,73", "16,73", "17,86", "19,86", "20,58", "23,58"})
    void 출발_시각별_고속도로_이동시간(int hour, int highwayMinutes) {
        LocalDateTime shippedAt = DAY.withHour(hour);

        EtaResult result = etaService.estimate(request(OrderStatus.SHIPPED, DAY, shippedAt, null, null, shippedAt)).orElseThrow();

        // 고속도로 + 캠프 분류 1시간 + 집 앞 배송 1시간
        assertThat(result.estimatedArrivalAt()).isEqualTo(shippedAt.plusMinutes(highwayMinutes + 120));
        assertThat(result.steps()).hasSize(3);
    }

    @Test
    void 주문완료면_센터처리_2시간부터_더한다() {
        LocalDateTime orderedAt = DAY.withHour(10); // 10:00 주문 → 12:00 센터 출발 → 62분 → 13:02 캠프 → 15:02 도착

        EtaResult result = etaService.estimate(request(OrderStatus.ORDERED, orderedAt, null, null, null, orderedAt)).orElseThrow();

        assertThat(result.estimatedArrivalAt()).isEqualTo(DAY.withHour(15).withMinute(2));
        assertThat(result.steps()).extracting(s -> s.name())
                .containsExactly("센터 처리", "고속도로 이동 (12시 출발)", "캠프 분류", "집 앞 배송");
        assertThat(result.method()).isEqualTo("RULE_BASED");
    }

    @Test
    void 센터처리가_늦어지면_지금_출발한다고_본다() {
        LocalDateTime orderedAt = DAY.withHour(10);
        LocalDateTime now = DAY.withHour(17); // 7시간째 포장 중 → 17시 출발 → 86분

        EtaResult result = etaService.estimate(request(OrderStatus.PACKING, orderedAt, null, null, null, now)).orElseThrow();

        assertThat(result.estimatedArrivalAt()).isEqualTo(now.plusMinutes(86 + 120));
        assertThat(result.delayed()).isFalse();
    }

    @Test
    void 배송중이면_캠프_도착부터_2시간() {
        LocalDateTime inTransitAt = DAY.withHour(9);

        EtaResult result = etaService.estimate(
                request(OrderStatus.IN_TRANSIT, DAY, DAY.withHour(7), inTransitAt, null, inTransitAt)).orElseThrow();

        assertThat(result.estimatedArrivalAt()).isEqualTo(DAY.withHour(11));
    }

    @Test
    void 예상시각이_지났으면_지연으로_표시() {
        LocalDateTime shippedAt = DAY.withHour(1);

        EtaResult result = etaService.estimate(
                request(OrderStatus.SHIPPED, DAY, shippedAt, null, null, DAY.withHour(10))).orElseThrow();

        assertThat(result.delayed()).isTrue();
    }

    @Test
    void 배송완료와_취소() {
        LocalDateTime deliveredAt = DAY.withHour(14);
        EtaResult delivered = etaService.estimate(
                request(OrderStatus.DELIVERED, DAY, DAY, DAY, deliveredAt, DAY.withHour(20))).orElseThrow();
        assertThat(delivered.delivered()).isTrue();
        assertThat(delivered.estimatedArrivalAt()).isEqualTo(deliveredAt);

        assertThat(etaService.estimate(request(OrderStatus.CANCELED, DAY, null, null, null, DAY))).isEmpty();
        assertThat(etaService.estimate(request(OrderStatus.RETURNING, DAY, DAY, null, null, DAY))).isEmpty();
    }

    private EtaRequest request(OrderStatus status, LocalDateTime orderedAt, LocalDateTime shippedAt,
                               LocalDateTime inTransitAt, LocalDateTime deliveredAt, LocalDateTime now) {
        return new EtaRequest(status, orderedAt, shippedAt, inTransitAt, deliveredAt,
                WarehouseRegion.SEOUL, WarehouseRegion.SEOUL, now);
    }
}
