package com.logistics.backend.order;

import com.logistics.backend.TestFixtures;
import com.logistics.backend.cart.repository.CartItemRepository;
import com.logistics.backend.inventory.entity.Inventory;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class OrderFlowTest {

    static final String ORDER_BODY = "{\"receiverName\":\"홍길동\",\"receiverPhone\":\"010-1111-2222\","
            + "\"address\":\"서울시 강남구 테헤란로 1\",\"paymentMethod\":\"CARD\"}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Test
    void 장바구니로_주문하면_재고가_예약되고_장바구니가_비워진다() throws Exception {
        String token = signupAndLogin(mockMvc, "order-" + UUID.randomUUID() + "@example.com", "password123");
        Product product = fixtures.productWithStock(10000, 5);
        addToCart(token, product, 2);

        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ORDERED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.productTotal").value(20000))
                .andExpect(jsonPath("$.shippingFee").value(3000))
                .andExpect(jsonPath("$.totalPrice").value(23000))
                .andExpect(jsonPath("$.items[0].warehouseName").value("서울 물류센터"))
                .andExpect(jsonPath("$.items[0].quantity").value(2));

        Inventory inventory = fixtures.inventory(product);
        assertThat(inventory.getQuantity()).isEqualTo(5);         // 실물은 출고 전까지 그대로
        assertThat(inventory.getReservedQuantity()).isEqualTo(2); // 예약 2개
        assertThat(inventory.getAvailableQuantity()).isEqualTo(3);

        mockMvc.perform(get("/api/cart").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(get("/api/orders").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(1));

        // 장바구니가 비었으면 400
        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CART_EMPTY"));
    }

    @Test
    void 상품_하나라도_재고가_부족하면_전체가_롤백된다() throws Exception {
        String token = signupAndLogin(mockMvc, "order-" + UUID.randomUUID() + "@example.com", "password123");
        Product first = fixtures.productWithStock(10000, 5);
        Product second = fixtures.productWithStock(10000, 5);
        addToCart(token, first, 1);
        addToCart(token, second, 1);

        // 담은 뒤 두 번째 상품이 품절됨
        fixtures.setQuantity(second, 0);

        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OUT_OF_STOCK"));

        // 첫 번째 상품의 예약도 취소(롤백)되어야 하고, 장바구니도 그대로
        assertThat(fixtures.inventory(first).getReservedQuantity()).isZero();
        mockMvc.perform(get("/api/cart").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.items.length()").value(2));
        mockMvc.perform(get("/api/orders").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void 다른_회원의_주문은_조회할_수_없다() throws Exception {
        String owner = signupAndLogin(mockMvc, "order-" + UUID.randomUUID() + "@example.com", "password123");
        String other = signupAndLogin(mockMvc, "order-" + UUID.randomUUID() + "@example.com", "password123");
        Product product = fixtures.productWithStock(40000, 5);
        addToCart(owner, product, 1);

        String body = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + owner)
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(jsonPath("$.shippingFee").value(0)) // 30,000원 이상 무료배송
                .andReturn().getResponse().getContentAsString();
        int orderId = com.jayway.jsonpath.JsonPath.read(body, "$.id");

        mockMvc.perform(get("/api/orders/" + orderId).header("Authorization", "Bearer " + other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ORDER_NOT_FOUND"));
    }

    private void addToCart(String token, Product product, int quantity) throws Exception {
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + product.getId() + ",\"quantity\":" + quantity + "}"))
                .andExpect(status().isOk());
    }
}
