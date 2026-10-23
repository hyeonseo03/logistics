package com.logistics.backend.order;

import com.jayway.jsonpath.JsonPath;
import com.logistics.backend.TestFixtures;
import com.logistics.backend.inventory.entity.Inventory;
import com.logistics.backend.order.dto.CancelOrderResponse;
import com.logistics.backend.order.dto.CancelResult;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.PaymentStatus;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.order.repository.OrderStatusHistoryRepository;
import com.logistics.backend.order.repository.PaymentRepository;
import com.logistics.backend.order.service.OrderCancelFacade;
import com.logistics.backend.order.service.OrderTransitionService;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static com.logistics.backend.TestAuth.signupAndLogin;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// @Version 낙관적 락: 같은 주문을 두 요청이 동시에 바꾸면 한쪽만 성공한다
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class OrderConcurrencyCancelTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private OrderTransitionService transitionService;
    @Autowired private OrderCancelFacade orderCancelFacade;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private OrderStatusHistoryRepository historyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TransactionTemplate transactionTemplate;

    @Test
    void 고객_취소_중에_관리자가_먼저_출고하면_취소는_실패하고_출고만_반영된다() throws Exception {
        String email = "occ-" + UUID.randomUUID() + "@example.com";
        Product product = fixtures.productWithStock(10000, 5);
        Long orderId = createOrder(email, product, 1);
        transitionService.changeStatus(orderId, OrderStatus.PACKING, null);

        ExecutorService admin = Executors.newSingleThreadExecutor();
        try {
            // 고객 트랜잭션: 주문을 읽은 상태(포장, version=N)에서 잠시 멈춘다
            assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(tx -> {
                Order stale = orderRepository.findById(orderId).orElseThrow();

                // 그 사이 관리자가 다른 트랜잭션에서 출고 처리하고 커밋 (version=N+1)
                try {
                    admin.submit(() -> transitionService.changeStatus(orderId, OrderStatus.SHIPPED, 99L)).get();
                } catch (Exception e) {
                    throw new IllegalStateException(e);
                }

                // 고객은 아직 "포장" 이라고 알고 취소 시도 → UPDATE ... where version = N → 0건 → 실패
                transitionService.changeStatus(stale, OrderStatus.CANCELED, null, "동시 취소");
            })).isInstanceOf(ObjectOptimisticLockingFailureException.class);
        } finally {
            admin.shutdown();
        }

        // 출고만 반영: 실물 5 → 4, 예약 0, 환불 없음
        assertThat(orderRepository.findById(orderId)).get().extracting(Order::getStatus).isEqualTo(OrderStatus.SHIPPED);
        Inventory inventory = fixtures.inventory(product);
        assertThat(inventory.getQuantity()).isEqualTo(4);
        assertThat(inventory.getReservedQuantity()).isZero();
        assertThat(paymentRepository.findByOrderId(orderId)).get()
                .extracting(p -> p.getStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void 취소_버튼을_동시에_10번_눌러도_취소는_한번만_처리된다() throws Exception {
        String email = "occ-" + UUID.randomUUID() + "@example.com";
        Product product = fixtures.productWithStock(10000, 5);
        Long orderId = createOrder(email, product, 2);
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        int threads = 10;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<CancelOrderResponse>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(pool.submit(() -> {
                start.await();
                return orderCancelFacade.cancel(userId, orderId, "중복 클릭");
            }));
        }
        start.countDown();

        int canceled = 0;
        int alreadyProcessed = 0;
        for (Future<CancelOrderResponse> future : futures) {
            CancelOrderResponse response = future.get(); // 실패(예외)가 하나라도 있으면 여기서 테스트 실패
            if (response.result() == CancelResult.CANCELED) canceled++;
            if (response.result() == CancelResult.ALREADY_PROCESSED) alreadyProcessed++;
        }
        pool.shutdown();

        assertThat(canceled).isEqualTo(1);
        assertThat(alreadyProcessed).isEqualTo(threads - 1);
        assertThat(fixtures.inventory(product).getReservedQuantity()).isZero(); // 예약은 딱 한 번만 풀린다
        assertThat(historyRepository.findAllByOrderIdOrderByIdAsc(orderId)).hasSize(2); // ORDERED, CANCELED
    }

    private Long createOrder(String email, Product product, int quantity) throws Exception {
        String token = signupAndLogin(mockMvc, email, "password123");
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + product.getId() + ",\"quantity\":" + quantity + "}"));
        String body = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(TestFixtures.ORDER_BODY))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Integer) JsonPath.read(body, "$.id")).longValue();
    }
}
