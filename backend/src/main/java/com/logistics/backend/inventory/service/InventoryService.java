package com.logistics.backend.inventory.service;

import com.logistics.backend.inventory.dto.InventoryResponse;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다. id=" + productId);
        }

        return inventoryRepository.findAllWithProductAndWarehouseByProductId(productId).stream()
                .map(InventoryResponse::from)
                .toList();
    }
}
