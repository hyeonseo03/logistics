package com.logistics.backend.warehouse.entity;

import java.util.List;
import java.util.Map;

// 프론트 types/warehouse.ts 의 WarehouseRegion 과 같은 값
public enum WarehouseRegion {
    SEOUL,
    GYEONGGI,
    BUSAN;

    // 배송지 지역별로 가까운 물류센터 지역 순서 (프론트 lib/stock.ts 와 같은 규칙)
    private static final Map<WarehouseRegion, List<WarehouseRegion>> NEAREST_REGIONS = Map.of(
            SEOUL, List.of(SEOUL, GYEONGGI, BUSAN),
            GYEONGGI, List.of(GYEONGGI, SEOUL, BUSAN),
            BUSAN, List.of(BUSAN, GYEONGGI, SEOUL)
    );

    // 주소 → 지역 ("부산시 해운대구 ..." → BUSAN). 모르는 지역이면 서울로 본다
    public static WarehouseRegion fromAddress(String address) {
        if (address == null) {
            return SEOUL;
        }
        String trimmed = address.trim();
        if (trimmed.startsWith("부산")) {
            return BUSAN;
        }
        if (trimmed.startsWith("경기")) {
            return GYEONGGI;
        }
        return SEOUL;
    }

    // 배송지(destination)에서 이 센터 지역까지 가까운 정도 (0 이 가장 가깝다)
    public int distanceRankFrom(WarehouseRegion destination) {
        return NEAREST_REGIONS.get(destination).indexOf(this);
    }
}
