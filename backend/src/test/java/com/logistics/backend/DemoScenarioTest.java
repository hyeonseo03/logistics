package com.logistics.backend;

import com.jayway.jsonpath.JsonPath;
import com.logistics.backend.inventory.entity.Inventory;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// docs/DEMO.md 의 시연 순서를 그대로 HTTP 요청으로 따라간다 (프론트가 부르는 API 와 같은 순서)
// 회원가입 → 로그인 → 상품 보기 → 장바구니 → 주문 → 관리자 출고 처리
// → 고객 취소(회수) → 관리자 회수 완료 → 재고 복구 확인 → AI 도우미 질문
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class DemoScenarioTest {

    private static final int STOCK = 20;   // 시연 상품의 처음 재고 (서울 물류센터)
    private static final int QUANTITY = 2; // 주문 수량

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void 시연_순서대로_끝까지_동작한다() throws Exception {
        Product product = fixtures.productWithStock(15000, STOCK);
        String adminToken = adminToken();

        // 1. 회원가입 (프론트: /signup → signup())
        String email = "demo-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"demo-password1\",\"name\":\"시연고객\",\"phone\":\"010-5555-6666\"}"))
                .andExpect(status().isCreated());

        // 2. 로그인 (프론트: 가입 후 자동 로그인 → login())
        String token = TestAuth.login(mockMvc, email, "demo-password1");
        perform(get("/api/auth/me"), token).andExpect(jsonPath("$.name").value("시연고객"));

        // 3. 상품 보기 (프론트: /products, /products/{id} → getProducts(), getProduct())
        mockMvc.perform(get("/api/products")).andExpect(status().isOk());
        mockMvc.perform(get("/api/products/" + product.getId()))
                .andExpect(jsonPath("$.totalStock").value(STOCK));
        mockMvc.perform(get("/api/products/" + product.getId() + "/inventories"))
                .andExpect(jsonPath("$[0].quantity").value(STOCK));

        // 4. 장바구니 담기 (프론트: 상품 상세 [장바구니 담기] → addCartItem(), /cart → getCart())
        perform(post("/api/cart/items").contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + product.getId() + ",\"quantity\":" + QUANTITY + "}"), token)
                .andExpect(status().isOk());
        perform(get("/api/cart"), token)
                .andExpect(jsonPath("$.items[0].productId").value(product.getId()))
                .andExpect(jsonPath("$.items[0].quantity").value(QUANTITY))
                .andExpect(jsonPath("$.productTotal").value(30000))
                .andExpect(jsonPath("$.shippingFee").value(0)); // 30,000원 이상 무료배송

        // 5. 주문 (프론트: /checkout → createOrder({ productIds }))
        String orderBody = perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiverName\":\"시연고객\",\"receiverPhone\":\"010-5555-6666\","
                                + "\"address\":\"서울시 강남구 테헤란로 1\",\"paymentMethod\":\"CARD\",\"productIds\":[" + product.getId() + "]}"),
                token)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ORDERED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.cancelInfo.type").value("IMMEDIATE_CANCEL"))
                .andReturn().getResponse().getContentAsString();
        int orderId = JsonPath.read(orderBody, "$.id");

        Inventory afterOrder = fixtures.inventory(product);
        assertThat(afterOrder.getQuantity()).isEqualTo(STOCK);             // 실물은 그대로
        assertThat(afterOrder.getReservedQuantity()).isEqualTo(QUANTITY);  // 예약만 잡힘
        perform(get("/api/cart"), token).andExpect(jsonPath("$.items.length()").value(0)); // 주문한 상품은 장바구니에서 빠짐

        // 6. 관리자 출고 처리 (프론트: /admin/orders [포장 시작] → [출고 처리] → updateOrderStatus())
        changeStatus(adminToken, orderId, "PACKING");
        perform(patch("/api/admin/orders/" + orderId + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"SHIPPED\"}"), adminToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"))
                .andExpect(jsonPath("$.shipment.trackingNumber").isNotEmpty());

        Inventory afterShip = fixtures.inventory(product);
        assertThat(afterShip.getQuantity()).isEqualTo(STOCK - QUANTITY); // 창고에서 실제로 나감
        assertThat(afterShip.getReservedQuantity()).isZero();

        // 배송 조회 (프론트: /tracking/{주문번호} → getTracking())
        perform(get("/api/orders/" + orderId + "/tracking"), token)
                .andExpect(jsonPath("$.shipment.status").value("SHIPPED"))
                .andExpect(jsonPath("$.eta.message").isNotEmpty());

        // 7. 고객 취소 → 이미 출고되어 회수 요청 (프론트: /mypage/orders [취소(회수 요청)] → cancelOrder())
        perform(get("/api/orders"), token)
                .andExpect(jsonPath("$[0].cancelInfo.type").value("RETURN"));
        perform(post("/api/orders/" + orderId + "/cancel").contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"시연용 단순 변심\"}"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("RETURN_REQUESTED"))
                .andExpect(jsonPath("$.order.status").value("RETURNING"));
        perform(get("/api/users/me/claims?type=RETURN"), token)
                .andExpect(jsonPath("$[0].orderId").value(orderId))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

        // 8. 관리자 회수 완료 (프론트: /admin/orders [회수 완료])
        perform(patch("/api/admin/orders/" + orderId + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"RETURNED\"}"), adminToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"))
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"));

        // 9. 재고 복구 확인 (프론트: /admin/inventory, 상품 상세의 재고 배지)
        Inventory afterReturn = fixtures.inventory(product);
        assertThat(afterReturn.getQuantity()).isEqualTo(STOCK);
        assertThat(afterReturn.getReservedQuantity()).isZero();
        mockMvc.perform(get("/api/products/" + product.getId()))
                .andExpect(jsonPath("$.totalStock").value(STOCK));
        perform(get("/api/users/me/claims?type=RETURN"), token)
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));

        // 10. AI 도우미 질문 (프론트: /ai → askAi())
        perform(post("/api/assistant/chat").contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"내 주문 어디쯤이야?\"}"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ORDER_STATUS"))
                .andExpect(jsonPath("$.data.orderId").value(orderId))
                .andExpect(jsonPath("$.data.status").value("RETURNED"));
        perform(post("/api/assistant/chat").contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"" + product.getName() + " 있어?\"}"), token) // 상품 이름의 단어가 들어 있으면 검색
                .andExpect(jsonPath("$.type").value("PRODUCT_SEARCH"));
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private void changeStatus(String adminToken, int orderId, String status) throws Exception {
        perform(patch("/api/admin/orders/" + orderId + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\"}"), adminToken)
                .andExpect(status().isOk());
    }

    private String adminToken() throws Exception {
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        userRepository.save(new User(email, passwordEncoder.encode("admin-password"), "관리자", "010-0000-0000", Role.ADMIN));
        return TestAuth.login(mockMvc, email, "admin-password");
    }
}
