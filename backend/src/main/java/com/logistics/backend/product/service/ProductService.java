package com.logistics.backend.product.service;

import com.logistics.backend.cart.repository.CartItemRepository;
import com.logistics.backend.category.entity.Category;
import com.logistics.backend.category.repository.CategoryRepository;
import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.inventory.dto.ProductStockTotal;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.order.repository.OrderItemRepository;
import com.logistics.backend.product.dto.ProductRequest;
import com.logistics.backend.product.dto.ProductResponse;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final CategoryRepository categoryRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;

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
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "상품을 찾을 수 없습니다. id=" + id));

        return ProductResponse.from(product, inventoryRepository.sumTotalStockByProductId(id));
    }

    // ───────── 관리자 ─────────

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = productRepository.save(new Product(
                findCategory(request.categoryId()),
                request.name().trim(),
                request.description().trim(),
                request.price(),
                blankToNull(request.optionName()),
                blankToNull(request.imageUrl()),
                LocalDateTime.now()
        ));
        return ProductResponse.from(product, 0); // 새 상품은 재고가 없다 (재고 조정 API 로 넣는다)
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        product.update(
                findCategory(request.categoryId()),
                request.name().trim(),
                request.description().trim(),
                request.price(),
                blankToNull(request.optionName()),
                blankToNull(request.imageUrl())
        );
        return ProductResponse.from(product, inventoryRepository.sumTotalStockByProductId(id));
    }

    // 삭제: 주문된 적 있는 상품은 주문 내역이 깨지므로 지우지 않는다 (409)
    // 주문 이력이 없으면 장바구니·재고 행을 먼저 지우고 상품을 지운다
    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (orderItemRepository.existsByProductId(id)) {
            throw new BusinessException(ErrorCode.PRODUCT_IN_USE);
        }
        cartItemRepository.deleteAllByProductId(id);
        inventoryRepository.deleteAllByProductId(id);
        productRepository.delete(product);
    }

    private Category findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
