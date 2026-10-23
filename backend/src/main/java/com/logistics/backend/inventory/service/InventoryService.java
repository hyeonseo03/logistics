package com.logistics.backend.inventory.service;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.inventory.dto.InventoryResponse;
import com.logistics.backend.inventory.entity.Inventory;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import com.logistics.backend.warehouse.entity.Warehouse;
import com.logistics.backend.warehouse.entity.WarehouseRegion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public List<InventoryResponse> getInventories() {
        return inventoryRepository.findAllWithProductAndWarehouse().stream()
                .map(InventoryResponse::from)
                .toList();
    }

    public List<InventoryResponse> getInventoriesByProduct(Long productId) {
        // 없는 상품이면 빈 목록 대신 404 를 돌려준다
        if (!productRepository.existsById(productId)) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "상품을 찾을 수 없습니다. id=" + productId);
        }

        return inventoryRepository.findAllWithProductAndWarehouseByProductId(productId).stream()
                .map(InventoryResponse::from)
                .toList();
    }

    // ───────── 재고 변경 (주문·취소·출고·회수에서 호출, 호출한 쪽의 트랜잭션에 함께 묶인다) ─────────

    // 주문 시 재고 예약: 배송지에서 가까운 센터부터 차례로 "원자적 UPDATE" 를 시도하고,
    // 처음 성공한 센터를 출고 센터로 돌려준다. 어느 센터에서도 안 되면 재고 부족
    // (단순화: 상품 한 줄은 한 센터에서만 출고한다. 여러 센터에 나눠 출고하지 않는다)
    @Transactional
    public Warehouse reserve(Product product, int quantity, WarehouseRegion destination) {
        List<Warehouse> candidates = inventoryRepository.findAllWithProductAndWarehouseByProductId(product.getId()).stream()
                .map(Inventory::getWarehouse)
                .sorted(Comparator.comparingInt((Warehouse w) -> w.getRegion().distanceRankFrom(destination))
                        .thenComparing(Warehouse::getId))
                .toList();

        for (Warehouse warehouse : candidates) {
            int updated = inventoryRepository.reserve(product.getId(), warehouse.getId(), quantity, LocalDateTime.now());
            if (updated == 1) {
                return warehouse;
            }
        }
        throw new BusinessException(ErrorCode.OUT_OF_STOCK, product.getName() + "의 재고가 부족합니다.");
    }

    // 출고 전 취소: 예약 해제
    @Transactional
    public void release(Long productId, Long warehouseId, int quantity) {
        int updated = inventoryRepository.release(productId, warehouseId, quantity, LocalDateTime.now());
        if (updated != 1) {
            throw new IllegalStateException("예약 재고를 풀 수 없습니다. productId=" + productId + ", warehouseId=" + warehouseId);
        }
    }

    // 출고: 현재재고·예약재고 함께 차감
    @Transactional
    public void ship(Long productId, Long warehouseId, int quantity) {
        int updated = inventoryRepository.ship(productId, warehouseId, quantity, LocalDateTime.now());
        if (updated != 1) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK, "출고할 재고가 부족합니다. (상품 id=" + productId + ")");
        }
    }

    // 회수 완료: 현재재고 복구
    @Transactional
    public void restock(Long productId, Long warehouseId, int quantity) {
        int updated = inventoryRepository.restock(productId, warehouseId, quantity, LocalDateTime.now());
        if (updated != 1) {
            throw new IllegalStateException("재고를 복구할 행이 없습니다. productId=" + productId + ", warehouseId=" + warehouseId);
        }
    }
}
