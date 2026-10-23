package com.logistics.backend.assistant.controller;

import com.logistics.backend.assistant.dto.AssistantRequest;
import com.logistics.backend.assistant.dto.AssistantResponse;
import com.logistics.backend.assistant.service.AssistantService;
import com.logistics.backend.global.security.LoginUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// AI 도우미. 로그인하지 않아도 쓸 수 있고(상품 검색·안내), 로그인했으면 내 주문 정보로 답한다
@RestController
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService; // 인터페이스에만 의존 → 구현체를 바꿔도 이 코드는 그대로

    // POST /api/assistant/chat  { "message": "내 주문 어디쯤이야?" }
    // (프론트 lib/api.ts 주석의 POST /api/ai/chat 도 같은 동작)
    @PostMapping({"/api/assistant/chat", "/api/ai/chat"})
    public AssistantResponse chat(@AuthenticationPrincipal LoginUser loginUser,
                                  @Valid @RequestBody AssistantRequest request) {
        Long userId = (loginUser == null) ? null : loginUser.id();
        return assistantService.chat(userId, request.message());
    }
}
