import type { ProductResponse } from "@/types/product";

// AI 도우미 채팅 메시지 한 개 (화면에서 쓰는 타입)
export interface ChatMessage {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  products?: ProductResponse[]; // 상품 검색 답변이면 상품 링크를 함께 보여준다
}

// POST /api/assistant/chat 요청
export interface AiChatRequest {
  message: string;
}

// 답변 종류 (백엔드 AssistantReplyType)
export type AiReplyType =
  | "ORDER_STATUS"
  | "ETA"
  | "CANCEL_INFO"
  | "PRODUCT_SEARCH"
  | "LOGIN_REQUIRED"
  | "NO_ORDER"
  | "HELP";

// AI 도우미 답변 { reply, type, data }
// data 는 type 마다 모양이 달라서, 화면에서는 PRODUCT_SEARCH 의 상품 목록만 꺼내 쓴다
export interface AiChatResponse {
  reply: string;
  type: AiReplyType;
  data: unknown;
}
