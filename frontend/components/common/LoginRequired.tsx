import Link from "next/link";

// 로그인이 필요한 화면에서 로그인하지 않았을 때 보여주는 안내
export default function LoginRequired({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-6 text-gray-500">로그인이 필요합니다.</p>
      <Link href="/login" className="mt-4 inline-block text-blue-600 underline">
        로그인하러 가기
      </Link>
    </div>
  );
}
