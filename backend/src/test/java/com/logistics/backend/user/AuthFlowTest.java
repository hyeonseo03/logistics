package com.logistics.backend.user;

import com.jayway.jsonpath.JsonPath;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 회원가입 → 로그인(JWT) → 내 정보 → 권한 확인 → 배송지까지 실제 HTTP 요청처럼 확인한다
@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void 회원가입_로그인_내정보_배송지() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        String token = signupAndLogin(mockMvc, email, "password123");

        // 내 정보
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());

        // 내 정보 수정
        mockMvc.perform(put("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"새이름\",\"phone\":\"010-9999-8888\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("새이름"));

        // 비밀번호 변경: 현재 비밀번호가 틀리면 401
        mockMvc.perform(patch("/api/users/me/password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"wrong-password\",\"newPassword\":\"newpassword1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("WRONG_PASSWORD"));

        // 배송지: 첫 배송지는 자동으로 기본
        String body = mockMvc.perform(post("/api/users/me/addresses").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(addressJson("집", false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isDefault").value(true))
                .andReturn().getResponse().getContentAsString();
        int firstId = JsonPath.read(body, "$.id");

        // 두 번째 배송지를 기본으로 추가하면 첫 번째는 기본 해제
        mockMvc.perform(post("/api/users/me/addresses").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(addressJson("회사", true)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/users/me/addresses").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].label").value("회사"))
                .andExpect(jsonPath("$[0].isDefault").value(true))
                .andExpect(jsonPath("$[1].isDefault").value(false));

        mockMvc.perform(delete("/api/users/me/addresses/" + firstId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void 로그인_실패와_권한() throws Exception {
        // 로그인 없이 내 정보 → 401
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        // 잘못된 토큰 → 401 INVALID_TOKEN
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer not-a-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_TOKEN"));

        // 일반 회원이 관리자 API → 403
        String token = signupAndLogin(mockMvc, "user-" + UUID.randomUUID() + "@example.com", "password123");
        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // 비밀번호 틀림
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("LOGIN_FAILED"));

        // 입력값 검사 실패 → 400 INVALID_INPUT
        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"bad\",\"password\":\"1\",\"name\":\"\",\"phone\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_INPUT"));

        // 상품 조회는 로그인 없이 가능
        mockMvc.perform(get("/api/products")).andExpect(status().isOk());
        mockMvc.perform(get("/api/categories")).andExpect(status().isOk());
    }

    private static String addressJson(String label, boolean isDefault) {
        return "{\"label\":\"" + label + "\",\"receiverName\":\"홍길동\",\"receiverPhone\":\"010-1111-2222\","
                + "\"address\":\"서울시 강남구 테헤란로 1\",\"isDefault\":" + isDefault + "}";
    }
}
