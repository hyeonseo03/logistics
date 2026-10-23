package com.logistics.backend.cart.service;

import com.logistics.backend.cart.dto.CartItemRequest;
import com.logistics.backend.cart.dto.CartItemResponse;
import com.logistics.backend.cart.dto.CartResponse;
import com.logistics.backend.cart.entity.CartItem;
import com.logistics.backend.cart.repository.CartItemRepository;
import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.global.policy.ShippingFeePolicy;
import com.logistics.backend.inventory.dto.ProductStockTotal;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;

    public CartResponse getCart(Long userId) {
        List<CartItem> items = cartItemRepository.findAllWithProductByUserId(userId);

        // 상품마다 재고 쿼리를 날리지 않고 합계 쿼리 한 번으로 "상품 id → 판매가능재고" 표를 만든다
        Map<Long, Long> stockByProductId = inventoryRepository.sumTotalStockGroupByProduct().stream()
                .collect(Collectors.toMap(ProductStockTotal::productId, ProductStockTotal::totalStock));

        List<CartItemResponse> responses = items.stream()
                .map(item -> CartItemResponse.from(item, stockByProductId.getOrDefault(item.getProduct().getId(), 0L)))
                .toList();

        // 품절 상품은 결제 대상에서 빠진다
        int productTotal = responses.stream()
                .filter(item -> !item.soldOut())
                .mapToInt(CartItemResponse::lineTotal)
                .sum();
        int shippingFee = ShippingFeePolicy.calculate(productTotal);
        return new CartResponse(responses, productTotal, shippingFee, productTotal + shippingFee);
    }

    // 담기: 이미 담긴 상품이면 수량을 더한다
    @Transactional
    public CartResponse addItem(Long userId, CartItemRequest request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, product.getId()).orElse(null);
        int newQuantity = (item == null) ? request.quantity() : item.getQuantity() + request.quantity();
        checkStock(product, newQuantity);

        if (item == null) {
            User user = userRepository.getReferenceById(userId); // id 만 필요하므로 SELECT 없이 참조만 가져온다
            cartItemRepository.save(new CartItem(user, product, newQuantity));
        } else {
            item.changeQuantity(newQuantity);
        }
        return getCart(userId);
    }

    @Transactional
    public CartResponse changeQuantity(Long userId, Long productId, int quantity) {
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
        checkStock(item.getProduct(), quantity);
        item.changeQuantity(quantity);
        return getCart(userId);
    }

    @Transactional
    public CartResponse removeItems(Long userId, Collection<Long> productIds) {
        cartItemRepository.deleteByUserIdAndProductIds(userId, productIds);
        return getCart(userId);
    }

    @Transactional
    public void clear(Long userId) {
        cartItemRepository.deleteAllByUserId(userId);
    }

    // 담으려는 수량이 판매가능재고보다 많으면 거절한다 (실제 재고 차감은 주문할 때 한다)
    private void checkStock(Product product, int quantity) {
        long available = inventoryRepository.sumTotalStockByProductId(product.getId());
        if (quantity > available) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK,
                    product.getName() + "의 재고가 부족합니다. (남은 수량: " + available + "개)");
        }
    }
}
