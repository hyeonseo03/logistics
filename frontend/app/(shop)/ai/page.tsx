import ChatWindow from "@/components/ai/ChatWindow";

export default function AiPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">AI 도우미</h1>
      <p className="mt-1 text-sm text-gray-500">
        내 주문의 배송 상태, 도착 예상 시각, 취소하면 어떻게 되는지를 물어보세요.
      </p>
      <div className="mt-6">
        <ChatWindow />
      </div>
    </div>
  );
}
