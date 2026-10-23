import SignupForm from "@/components/common/SignupForm";
import { safeRedirect } from "@/lib/redirect";

// 회원가입. /signup?redirect=/cart 처럼 들어오면 가입·자동 로그인 후 그 화면으로 이동한다
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return <SignupForm redirect={safeRedirect(redirect)} />;
}
