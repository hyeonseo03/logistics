package com.logistics.backend.order;

import com.logistics.backend.TestFixtures;
import com.logistics.backend.cart.entity.CartItem;
import com.logistics.backend.cart.repository.CartItemRepository;
import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.inventory.entity.Inventory;
import com.logistics.backend.order.dto.CreateOrderRequest;
import com.logistics.backend.order.entity.PaymentMethod;
import com.logistics.backend.order.service.OrderService;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

// 재고 1개 상품에 100명이 동시에 주문 → 정확히 1건만 성공하고 재고는 0 (초과 판매 없음)
@SpringBootTest
@Import(TestFixtures.class)
class StockConcurrencyTest {

    private static final int THREADS = 100;

    @Autowired private OrderService orderService;
    @Autowired private UserRepository userRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private TestFixtures fixtures;

    @Test
    void 재고_1개에_100명이_동시에_주문하면_1명만_성공한다() throws Exception {
        Product product = fixtures.productWithStock(10000, 1);

        // 회원 100명이 각자 장바구니에 같은 상품 1개를 담아 둔다 (비밀번호는 테스트에 쓰지 않으므로 아무 값)
        List<Long> userIds = new ArrayList<>();
        for (int i = 0; i < THREADS; i++) {
            User user = userRepository.save(new User("race-" + UUID.randomUUID() + "@example.com",
                    "not-used", "동시주문" + i, "010-1234-5678", Role.USER));
            cartItemRepository.save(new CartItem(user, product, 1));
            userIds.add(user.getId());
        }

        CreateOrderRequest request = new CreateOrderRequest(
                null, "홍길동", "010-1111-2222", "서울시 강남구 테헤란로 1", PaymentMethod.CARD, null);

        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch ready = new CountDownLatch(THREADS);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(THREADS);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger outOfStock = new AtomicInteger();
        List<Throwable> unexpected = java.util.Collections.synchronizedList(new ArrayList<>());

        for (Long userId : userIds) {
            pool.submit(() -> {
                ready.countDown();
                try {
                    start.await(); // 100개 스레드가 모두 준비된 뒤 한꺼번에 출발
                    orderService.createOrder(userId, request);
                    success.incrementAndGet();
                } catch (BusinessException e) {
                    if (e.getErrorCode() == ErrorCode.OUT_OF_STOCK) {
                        outOfStock.incrementAndGet();
                    } else {
                        unexpected.add(e);
                    }
                } catch (Throwable e) {
                    unexpected.add(e);
                } finally {
                    done.countDown();
                }
            });
        }
        ready.await();
        start.countDown();
        assertThat(done.await(60, TimeUnit.SECONDS)).isTrue();
        pool.shutdown();

        assertThat(unexpected).isEmpty();
        assertThat(success.get()).isEqualTo(1);
        assertThat(outOfStock.get()).isEqualTo(THREADS - 1);

        Inventory inventory = fixtures.inventory(product);
        assertThat(inventory.getAvailableQuantity()).isZero();     // 판매가능재고 0
        assertThat(inventory.getReservedQuantity()).isEqualTo(1);  // 정확히 1개만 예약 (초과 판매 없음)
    }
}
