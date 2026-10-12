import ChatWindow from "@/components/ai/ChatWindow";

export default function AiPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">AI 도우미</h1>
      <p className="mt-1 text-sm text-gray-500">
        배송에 대해 물어보세요. (지금은 연습용 가짜 AI 입니다)
      </p>
      <div className="mt-6">
        <ChatWindow />
      </div>
    </div>
  );
}
