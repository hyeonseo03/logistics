package com.logistics.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// POST /api/assistant/chat 요청 (프론트 types/ai.ts 의 AiChatRequest)
public record AssistantRequest(
        @NotBlank(message = "질문을 입력해 주세요.")
        @Size(max = 500, message = "질문은 500자 이하로 입력해 주세요.")
        String message
) {
}
