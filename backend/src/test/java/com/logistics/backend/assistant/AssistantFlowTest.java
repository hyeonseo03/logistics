package com.logistics.backend.assistant;

import com.logistics.backend.TestFixtures;
import com.logistics.backend.product.entity.Product;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static com.logistics.backend.TestAuth.signupAndLogin;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class AssistantFlowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;

    @Test
    void 로그인_없이_상품검색과_안내() throws Exception {
        chat(null, "감귤 있어?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("PRODUCT_SEARCH"))
                .andExpect(jsonPath("$.data[0].name").value("제주 감귤 3kg"));

        chat(null, "안녕").andExpect(jsonPath("$.type").value("HELP"));
        chat(null, "내 배송 어디야?").andExpect(jsonPath("$.type").value("LOGIN_REQUIRED"));
    }

    @Test
    void 로그인하면_내_주문으로_답한다() throws Exception {
        String token = signupAndLogin(mockMvc, "ai-" + UUID.randomUUID() + "@example.com", "password123");
        chat(token, "내 주문 어디쯤이야?").andExpect(jsonPath("$.type").value("NO_ORDER"));

        Product product = fixtures.productWithStock(10000, 5);
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + product.getId() + ",\"quantity\":1}"));
        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(TestFixtures.ORDER_BODY))
                .andExpect(status().isCreated());

        chat(token, "내 주문 어디쯤이야?")
                .andExpect(jsonPath("$.type").value("ORDER_STATUS"))
                .andExpect(jsonPath("$.data.status").value("ORDERED"))
                .andExpect(jsonPath("$.data.lastLocation").value("서울 물류센터"));

        chat(token, "언제 도착해?")
                .andExpect(jsonPath("$.type").value("ETA"))
                .andExpect(jsonPath("$.data.eta.estimatedArrivalAt").exists())
                .andExpect(jsonPath("$.reply").value(containsString("도착할 예정")));

        chat(token, "주문 취소하면 어떻게 돼?")
                .andExpect(jsonPath("$.type").value("CANCEL_INFO"))
                .andExpect(jsonPath("$.data.cancelInfo.type").value("IMMEDIATE_CANCEL"));

        // 도우미는 안내만 하고 실제로 취소하지 않는다
        mockMvc.perform(get("/api/orders").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].status").value("ORDERED"));

        // 프론트 주석의 /api/ai/chat 주소도 같은 동작
        mockMvc.perform(post("/api/ai/chat").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"배송 어디\"}"))
                .andExpect(jsonPath("$.type").value("ORDER_STATUS"));

        // 빈 질문 → 400
        chat(token, " ").andExpect(status().isBadRequest());
    }

    private ResultActions chat(String token, String message) throws Exception {
        var request = post("/api/assistant/chat").contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"" + message + "\"}");
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(request);
    }
}
