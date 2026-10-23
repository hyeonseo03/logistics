package com.logistics.backend.assistant.dto;

// POST /api/assistant/chat 응답 { reply, type, data }
// reply 는 사람이 읽는 문장, type·data 는 화면이 활용할 수 있는 구조화된 값
public record AssistantResponse(
        String reply,
        AssistantReplyType type,
        Object data // type 마다 모양이 다르다 (AssistantReplyType 주석 참고)
) {
}
