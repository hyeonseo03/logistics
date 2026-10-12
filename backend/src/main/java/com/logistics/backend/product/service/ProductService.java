package com.logistics.backend.product.service;

import com.logistics.backend.inventory.dto.ProductStockTotal;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.dto.ProductResponse;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public List<ProductResponse> getProducts(Long categoryId) {
        List<Product> products = (categoryId == null)
                ? productRepository.findAllWithCategory()
                : productRepository.findAllWithCategoryByCategoryId(categoryId);

        // 상품마다 재고 쿼리를 날리지 않고(N+1 방지), 합계 쿼리 한 번으로 "상품 id → 재고 합계" 표를 만든다
        Map<Long, Long> totalStockByProductId = inventoryRepository.sumTotalStockGroupByProduct().stream()
                .collect(Collectors.toMap(ProductStockTotal::productId, ProductStockTotal::totalStock));

        return products.stream()
                .map(product -> ProductResponse.from(
                        product,
                        totalStockByProductId.getOrDefault(product.getId(), 0L) // 재고가 한 줄도 없으면 0
                ))
                .toList();
    }

    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다. id=" + id));

        return ProductResponse.from(product, inventoryRepository.sumTotalStockByProductId(id));
    }
}
