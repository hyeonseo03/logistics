// AI 도우미 채팅 메시지 한 개 (화면에서 쓰는 타입)
export interface ChatMessage {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
}

// AI 도우미에게 보내는 질문 (나중에 POST /api/ai/chat 의 body)
export interface AiChatRequest {
  message: string;
}

// AI 도우미 답변
export interface AiChatResponse {
  reply: string;
}
