package com.logistics.backend.assistant.service;

import com.logistics.backend.assistant.dto.AssistantResponse;

// AI 도우미 (인터페이스)
//
// 지금은 외부 AI API 키 없이 동작하는 KeywordAssistantService(키워드 규칙) 하나만 있다.
// 나중에 LLM 으로 바꾸려면 이 인터페이스를 구현한 새 클래스(예: LlmAssistantService)를 만들고 빈으로 등록하면 된다.
// 컨트롤러는 이 인터페이스만 알기 때문에 코드를 바꿀 필요가 없다
public interface AssistantService {

    // userId: 로그인했으면 회원 id, 안 했으면 null
    AssistantResponse chat(Long userId, String message);
}
