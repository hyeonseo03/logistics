package com.logistics.backend.product.service;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.inventory.dto.ProductStockTotal;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.dto.RestockAlertResponse;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.entity.RestockAlert;
import com.logistics.backend.product.repository.ProductRepository;
import com.logistics.backend.product.repository.RestockAlertRepository;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
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
public class RestockAlertService {

    private final RestockAlertRepository restockAlertRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;

    // 신청: 이미 신청했으면 기존 신청을 그대로 돌려준다 (같은 버튼을 두 번 눌러도 한 건만)
    @Transactional
    public RestockAlertResponse request(Long userId, Long productId) {
        Product product = productRepository.findByIdWithCategory(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        long totalStock = inventoryRepository.sumTotalStockByProductId(productId);

        RestockAlert existing = restockAlertRepository.findByUserIdAndProductId(userId, productId).orElse(null);
        if (existing != null) {
            return RestockAlertResponse.of(existing, totalStock);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        RestockAlert alert = restockAlertRepository.save(new RestockAlert(user, product, LocalDateTime.now()));
        return RestockAlertResponse.of(alert, totalStock);
    }

    // 내 알림 목록 (상품의 현재 재고 합계도 함께 → 화면에서 "재입고되었어요!" 표시)
    public List<RestockAlertResponse> getMyAlerts(Long userId) {
        Map<Long, Long> stockByProductId = inventoryRepository.sumTotalStockGroupByProduct().stream()
                .collect(Collectors.toMap(ProductStockTotal::productId, ProductStockTotal::totalStock));

        return restockAlertRepository.findAllWithProductByUserId(userId).stream()
                .map(alert -> RestockAlertResponse.of(alert, stockByProductId.getOrDefault(alert.getProduct().getId(), 0L)))
                .toList();
    }

    // 알림 해제 (내 알림만 지울 수 있다. 다른 회원의 알림 id 면 404)
    @Transactional
    public void delete(Long userId, Long alertId) {
        RestockAlert alert = restockAlertRepository.findByIdAndUserId(alertId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESTOCK_ALERT_NOT_FOUND));
        restockAlertRepository.delete(alert);
    }
}
