package com.logistics.backend.shipment.service;

import com.logistics.backend.shipment.dto.EtaRequest;
import com.logistics.backend.shipment.dto.EtaResult;
import com.logistics.backend.shipment.dto.EtaStep;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// 규칙 기반 도착 예상 시각
//
//   센터 처리 2시간 → 고속도로 이동 (출발 시각별 표) → 캠프 분류 1시간 → 집 앞 배송 1시간
//
//   고속도로 이동 시간표 (센터를 출발한 "시" 기준)
//     0~5시 55분 / 6~13시 62분 / 14~16시 73분 / 17~19시 86분 / 20~23시 58분
//
// 상태별로 "이미 지난 구간"은 빼고 남은 구간만 더한다
//   주문완료·포장 : 센터 처리 → 고속도로 → 캠프 분류 → 집 앞 배송
//   출고          : (출고 시각부터) 고속도로 → 캠프 분류 → 집 앞 배송
//   배송중        : (캠프 도착 시각부터) 캠프 분류 → 집 앞 배송
//   배송완료      : 실제 도착 시각
@Service
public class RuleBasedEtaService implements EtaService {

    static final int CENTER_PROCESSING_MINUTES = 120;
    static final int CAMP_SORTING_MINUTES = 60;
    static final int LAST_MILE_MINUTES = 60;

    @Override
    public Optional<EtaResult> estimate(EtaRequest request) {
        LocalDateTime now = request.now();

        return switch (request.status()) {
            case DELIVERED -> Optional.of(new EtaResult(
                    orNow(request.deliveredAt(), now), true, false, List.of(), "RULE_BASED", "배송이 완료되었습니다."));

            case ORDERED, PACKING -> {
                // 센터 처리: 주문 시각부터 2시간. 이미 2시간이 지났는데 아직 출고 전이면 "지금" 출발한다고 본다
                LocalDateTime processedAt = request.orderedAt().plusMinutes(CENTER_PROCESSING_MINUTES);
                List<EtaStep> steps = new ArrayList<>();
                steps.add(new EtaStep("센터 처리", CENTER_PROCESSING_MINUTES, request.orderedAt(), processedAt));
                LocalDateTime departure = processedAt.isBefore(now) ? now : processedAt;
                yield Optional.of(fromDeparture(departure, steps, now));
            }

            case SHIPPED -> Optional.of(fromDeparture(orNow(request.shippedAt(), now), new ArrayList<>(), now));

            case IN_TRANSIT -> {
                List<EtaStep> steps = new ArrayList<>();
                LocalDateTime arrival = addCampAndLastMile(orNow(request.inTransitAt(), now), steps);
                yield Optional.of(result(arrival, steps, now));
            }

            case CANCELED, RETURNING, RETURNED -> Optional.empty();
        };
    }

    // 고속도로 이동 시간 (분). 센터를 출발한 시각의 "시"로 정한다
    static int highwayMinutes(int departureHour) {
        if (departureHour <= 5) return 55;   // 0~5시: 새벽, 길이 비어 있다
        if (departureHour <= 13) return 62;  // 6~13시
        if (departureHour <= 16) return 73;  // 14~16시
        if (departureHour <= 19) return 86;  // 17~19시: 퇴근길 정체
        return 58;                           // 20~23시
    }

    // 시각 기록이 빠져 있으면(예: 예전 데이터) 지금 시각으로 대신한다
    private LocalDateTime orNow(LocalDateTime time, LocalDateTime now) {
        return (time != null) ? time : now;
    }

    private EtaResult fromDeparture(LocalDateTime departure, List<EtaStep> steps, LocalDateTime now) {
        int highway = highwayMinutes(departure.getHour());
        LocalDateTime campArrival = departure.plusMinutes(highway);
        steps.add(new EtaStep("고속도로 이동 (" + departure.getHour() + "시 출발)", highway, departure, campArrival));
        LocalDateTime arrival = addCampAndLastMile(campArrival, steps);
        return result(arrival, steps, now);
    }

    private LocalDateTime addCampAndLastMile(LocalDateTime campArrival, List<EtaStep> steps) {
        LocalDateTime sorted = campArrival.plusMinutes(CAMP_SORTING_MINUTES);
        steps.add(new EtaStep("캠프 분류", CAMP_SORTING_MINUTES, campArrival, sorted));
        LocalDateTime arrival = sorted.plusMinutes(LAST_MILE_MINUTES);
        steps.add(new EtaStep("집 앞 배송", LAST_MILE_MINUTES, sorted, arrival));
        return arrival;
    }

    private EtaResult result(LocalDateTime arrival, List<EtaStep> steps, LocalDateTime now) {
        boolean delayed = arrival.isBefore(now);
        String message = delayed
                ? "예상보다 배송이 늦어지고 있어요. 곧 도착할 예정입니다."
                : String.format("%d월 %d일 %d시 %02d분쯤 도착할 예정이에요.",
                arrival.getMonthValue(), arrival.getDayOfMonth(), arrival.getHour(), arrival.getMinute());
        return new EtaResult(arrival, false, delayed, List.copyOf(steps), "RULE_BASED", message);
    }
}
