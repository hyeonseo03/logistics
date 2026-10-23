package com.logistics.backend;

import com.jayway.jsonpath.JsonPath;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 여러 테스트에서 같이 쓰는 도우미: 회원가입 후 로그인해서 JWT 토큰을 돌려준다
public final class TestAuth {

    private TestAuth() {
    }

    public static String signupAndLogin(MockMvc mockMvc, String email, String password) throws Exception {
        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password
                                + "\",\"name\":\"테스트\",\"phone\":\"010-1234-5678\"}"))
                .andExpect(status().isCreated());
        return login(mockMvc, email, password);
    }

    public static String login(MockMvc mockMvc, String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }
}
