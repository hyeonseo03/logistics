import LoginForm from "@/components/common/LoginForm";
import { safeRedirect } from "@/lib/redirect";

// 로그인. /login?redirect=/cart 처럼 들어오면 로그인 후 그 화면으로 돌아간다
// (Next.js 16 에서는 searchParams 를 await 해서 꺼낸다)
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return <LoginForm redirect={safeRedirect(redirect)} />;
}
