package com.logistics.backend.inventory.dto;

import com.logistics.backend.inventory.entity.Inventory;

import java.time.LocalDateTime;

// 프론트 types/warehouse.ts 의 Inventory 필드 + productName, warehouseName, updatedAt
// 품절/품절임박 판단은 프론트 lib/stock.ts 가 하므로 여기서는 수량만 보낸다
public record InventoryResponse(
        Long id,
        Long productId,
        String productName,
        Long warehouseId,
        String warehouseName,
        int quantity,
        int reservedQuantity,
        LocalDateTime updatedAt
) {

    public static InventoryResponse from(Inventory inventory) {
        return new InventoryResponse(
                inventory.getId(),
                inventory.getProduct().getId(),
                inventory.getProduct().getName(),
                inventory.getWarehouse().getId(),
                inventory.getWarehouse().getName(),
                inventory.getQuantity(),
                inventory.getReservedQuantity(),
                inventory.getUpdatedAt()
        );
    }
}
