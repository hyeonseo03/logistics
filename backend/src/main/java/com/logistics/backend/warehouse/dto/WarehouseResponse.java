package com.logistics.backend.warehouse.dto;

import com.logistics.backend.warehouse.entity.Warehouse;
import com.logistics.backend.warehouse.entity.WarehouseRegion;

// 프론트 types/warehouse.ts 의 Warehouse 와 같은 모양
public record WarehouseResponse(
        Long id,
        String name,
        WarehouseRegion region,
        String address,
        boolean sameDayShipping
) {

    public static WarehouseResponse from(Warehouse warehouse) {
        return new WarehouseResponse(
                warehouse.getId(),
                warehouse.getName(),
                warehouse.getRegion(),
                warehouse.getAddress(),
                warehouse.isSameDayShipping()
        );
    }
}
