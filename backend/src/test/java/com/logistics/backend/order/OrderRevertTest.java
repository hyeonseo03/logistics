package com.logistics.backend.order;

import com.jayway.jsonpath.JsonPath;
import com.logistics.backend.TestFixtures;
import com.logistics.backend.inventory.entity.Inventory;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.PaymentStatus;
import com.logistics.backend.order.entity.ReturnStatus;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.order.repository.OrderReturnRepository;
import com.logistics.backend.order.repository.OrderStatusHistoryRepository;
import com.logistics.backend.order.repository.PaymentRepository;
import com.logistics.backend.order.service.OrderTransitionService;
import com.logistics.backend.product.entity.Product;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static com.logistics.backend.TestAuth.signupAndLogin;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 되돌리기: 상태별 취소 결과와 재고 복구 확인
// (관리자 상태 변경은 OrderTransitionService 를 직접 호출해서 흉내 낸다)
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class OrderRevertTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private OrderTransitionService transitionService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private OrderReturnRepository returnRepository;
    @Autowired private OrderStatusHistoryRepository historyRepository;

    @Test
    void 주문완료에서_취소하면_즉시취소되고_예약재고가_풀린다_두번_눌러도_한번만() throws Exception {
        Setup s = orderOf(5, 2);
        assertThat(fixtures.inventory(s.product).getReservedQuantity()).isEqualTo(2);

        cancel(s)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("CANCELED"))
                .andExpect(jsonPath("$.order.status").value("CANCELED"))
                .andExpect(jsonPath("$.order.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.order.cancelInfo.cancelable").value(false));

        Inventory inventory = fixtures.inventory(s.product);
        assertThat(inventory.getReservedQuantity()).isZero();
        assertThat(inventory.getQuantity()).isEqualTo(5);

        // 두 번째 클릭: 아무 변화 없이 성공
        cancel(s)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("ALREADY_PROCESSED"));
        assertThat(fixtures.inventory(s.product).getReservedQuantity()).isZero(); // 두 번 풀리지 않는다
        assertThat(historyRepository.findAllByOrderIdOrderByIdAsc(s.orderId)).hasSize(2); // ORDERED, CANCELED
    }

    @Test
    void 포장중에_취소해도_즉시취소() throws Exception {
        Setup s = orderOf(5, 1);
        transitionService.changeStatus(s.orderId, OrderStatus.PACKING, null);

        cancel(s).andExpect(jsonPath("$.result").value("CANCELED"));
        assertThat(fixtures.inventory(s.product).getAvailableQuantity()).isEqualTo(5);
    }

    @Test
    void 출고후_취소하면_회수중이_되고_회수완료시_재고와_환불이_복구된다() throws Exception {
        Setup s = orderOf(5, 2);
        transitionService.changeStatus(s.orderId, OrderStatus.PACKING, null);
        transitionService.changeStatus(s.orderId, OrderStatus.SHIPPED, null);

        // 출고: 실물 5 → 3, 예약 2 → 0
        Inventory shipped = fixtures.inventory(s.product);
        assertThat(shipped.getQuantity()).isEqualTo(3);
        assertThat(shipped.getReservedQuantity()).isZero();

        cancel(s)
                .andExpect(jsonPath("$.result").value("RETURN_REQUESTED"))
                .andExpect(jsonPath("$.order.status").value("RETURNING"))
                .andExpect(jsonPath("$.order.paymentStatus").value("PAID")); // 회수 완료 전에는 환불 안 됨
        assertThat(returnRepository.findByOrderId(s.orderId)).get()
                .extracting(r -> r.getStatus()).isEqualTo(ReturnStatus.REQUESTED);
        assertThat(fixtures.inventory(s.product).getQuantity()).isEqualTo(3); // 아직 돌아오지 않음

        // 관리자 회수 완료
        transitionService.changeStatus(s.orderId, OrderStatus.RETURNED, null);
        assertThat(fixtures.inventory(s.product).getQuantity()).isEqualTo(5);
        assertThat(paymentRepository.findByOrderId(s.orderId)).get()
                .extracting(p -> p.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(returnRepository.findByOrderId(s.orderId)).get()
                .extracting(r -> r.getStatus()).isEqualTo(ReturnStatus.COMPLETED);

        cancel(s).andExpect(jsonPath("$.result").value("ALREADY_PROCESSED"));
    }

    @Test
    void 배송완료_후_취소도_회수() throws Exception {
        Setup s = orderOf(5, 1);
        for (OrderStatus next : new OrderStatus[]{OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED}) {
            transitionService.changeStatus(s.orderId, next, null);
        }
        cancel(s).andExpect(jsonPath("$.result").value("RETURN_REQUESTED"));
    }

    @Test
    void 배송지는_출고_전에만_바꿀_수_있다() throws Exception {
        Setup s = orderOf(5, 1);
        String body = "{\"receiverName\":\"김철수\",\"receiverPhone\":\"010-3333-4444\",\"address\":\"부산시 해운대구 1\"}";

        mockMvc.perform(patch("/api/orders/" + s.orderId + "/address").header("Authorization", "Bearer " + s.token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiverName").value("김철수"));

        transitionService.changeStatus(s.orderId, OrderStatus.PACKING, null);
        transitionService.changeStatus(s.orderId, OrderStatus.SHIPPED, null);

        mockMvc.perform(patch("/api/orders/" + s.orderId + "/address").header("Authorization", "Bearer " + s.token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ADDRESS_CHANGE_NOT_ALLOWED"));
    }

    @Test
    void 허용되지_않은_상태변경은_거절된다() throws Exception {
        Setup s = orderOf(5, 1);
        // 주문완료 → 출고 (포장 건너뛰기) 불가
        assertThatThrownBy(() -> transitionService.changeStatus(s.orderId, OrderStatus.SHIPPED, null))
                .hasMessageContaining("바꿀 수 없습니다");
        assertThat(orderRepository.findById(s.orderId)).get()
                .extracting(o -> o.getStatus()).isEqualTo(OrderStatus.ORDERED);
    }

    // ───────── 도우미 ─────────

    record Setup(String token, Product product, Long orderId) {
    }

    // 재고 stock 개인 새 상품을 quantity 개 주문한 상태를 만든다
    private Setup orderOf(int stock, int quantity) throws Exception {
        String token = signupAndLogin(mockMvc, "revert-" + UUID.randomUUID() + "@example.com", "password123");
        Product product = fixtures.productWithStock(10000, stock);
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + product.getId() + ",\"quantity\":" + quantity + "}"));
        String body = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(OrderFlowTest.ORDER_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cancelInfo.type").value("IMMEDIATE_CANCEL"))
                .andReturn().getResponse().getContentAsString();
        return new Setup(token, product, ((Integer) JsonPath.read(body, "$.id")).longValue());
    }

    private org.springframework.test.web.servlet.ResultActions cancel(Setup s) throws Exception {
        return mockMvc.perform(post("/api/orders/" + s.orderId + "/cancel").header("Authorization", "Bearer " + s.token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"단순 변심\"}"));
    }
}
