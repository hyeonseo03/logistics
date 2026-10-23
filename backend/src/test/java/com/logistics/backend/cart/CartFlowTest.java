package com.logistics.backend.cart;

import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static com.logistics.backend.TestAuth.signupAndLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CartFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void 담기_수량변경_삭제() throws Exception {
        String token = signupAndLogin(mockMvc, "cart-" + UUID.randomUUID() + "@example.com", "password123");
        Product product = productRepository.findAll().stream() // 샘플 상품 (판매가능재고 115개)
                .filter(p -> p.getName().equals("제주 감귤 3kg"))
                .findFirst().orElseThrow();

        // 담기 2개 → 39,800원, 무료배송
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + product.getId() + ",\"quantity\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.productTotal").value(product.getPrice() * 2))
                .andExpect(jsonPath("$.shippingFee").value(0));

        // 같은 상품을 또 담으면 수량이 더해진다
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + product.getId() + ",\"quantity\":1}"))
                .andExpect(jsonPath("$.items[0].quantity").value(3));

        // 수량 1개로 변경 → 19,900원 + 배송비 3,000원
        mockMvc.perform(patch("/api/cart/items/" + product.getId()).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1}"))
                .andExpect(jsonPath("$.items[0].quantity").value(1))
                .andExpect(jsonPath("$.shippingFee").value(3000))
                .andExpect(jsonPath("$.totalPrice").value(product.getPrice() + 3000));

        // 품절 상품(고속 충전기 65W, 판매가능재고 0)을 담으면 409 OUT_OF_STOCK
        Product soldOut = productRepository.findAll().stream()
                .filter(p -> p.getName().equals("고속 충전기 65W"))
                .findFirst().orElseThrow();
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + soldOut.getId() + ",\"quantity\":1}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OUT_OF_STOCK"));

        // 삭제
        mockMvc.perform(delete("/api/cart/items/" + product.getId()).header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.items.length()").value(0))
                .andExpect(jsonPath("$.totalPrice").value(0));

        // 로그인 없이 → 401
        mockMvc.perform(get("/api/cart")).andExpect(status().isUnauthorized());
    }
}
