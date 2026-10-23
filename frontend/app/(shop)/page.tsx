import Link from "next/link";
import HomeCategories from "@/components/home/HomeCategories";
import HomeProductSections from "@/components/home/HomeProductSections";
import TrackingQuickForm from "@/components/home/TrackingQuickForm";

// 주문 상태 흐름 (배너 오른쪽 그림)
const flowSteps = ["주문완료", "포장", "출고", "배송중", "배송완료"];

// 차별점 3가지
const features = [
  {
    title: "단계별 취소·회수",
    description: "출고 전이면 바로 취소·환불, 출고 후면 택배 기사님이 회수한 뒤 환불해요. 지금 취소하면 어떻게 되는지 미리 알려드려요.",
    color: "bg-orange-100 text-orange-600",
    icon: (
      <>
        <path d="M9 14L4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </>
    ),
  },
  {
    title: "동시 주문에도 정확한 재고",
    description: "마지막 1개에 100명이 동시에 주문해도 딱 1명만 성공해요. 초과 판매 없이 재고를 지켜요.",
    color: "bg-green-100 text-green-600",
    icon: (
      <>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M9 14l2 2 4-4" />
      </>
    ),
  },
  {
    title: "도착 시간 예측",
    description: "센터 처리, 고속도로 이동, 캠프 분류, 집 앞 배송까지 구간별로 계산해 몇 시쯤 도착할지 알려드려요.",
    color: "bg-blue-100 text-blue-600",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      {/* 1) 상단 배너 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 py-10 text-white sm:px-10 sm:py-14">
        {/* 배경 장식 원 */}
        <span className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
        <span className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-white/5" aria-hidden="true" />

        <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-blue-100">AI 물류·유통 플랫폼 LOGISTICS</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              주문해도
              <br />
              되돌릴 수 있는 물류
            </h1>
            <p className="mt-4 max-w-md text-blue-100">
              가까운 물류센터에서 빠르게 출고하고, 마음이 바뀌면 배송 단계에 맞게 취소·회수해 드려요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-lg bg-white px-5 py-3 font-semibold text-blue-700 shadow hover:bg-blue-50">
                상품 보러가기
              </Link>
              <Link
                href="/mypage/shipments"
                className="rounded-lg border border-white/60 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                배송 조회
              </Link>
            </div>
          </div>

          {/* 주문 흐름 + 되돌리기 그림 */}
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold text-blue-100">주문 이후 흐름</p>
            <ol className="mt-3 flex flex-col gap-2">
              {flowSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-700">
                    {index + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                  {index === 1 && <span className="ml-auto rounded bg-white/20 px-2 py-0.5 text-xs">← 여기까지 즉시 취소</span>}
                  {index === 2 && <span className="ml-auto rounded bg-white/20 px-2 py-0.5 text-xs">여기부터는 회수</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 2) 카테고리 바로가기 */}
      <section>
        <h2 className="text-xl font-bold">카테고리</h2>
        <div className="mt-4">
          <HomeCategories />
        </div>
      </section>

      {/* 3) 차별점 3가지 */}
      <section>
        <h2 className="text-xl font-bold">LOGISTICS 가 다른 점</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-white p-6">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  {feature.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4) 오늘 출고 가능 / 품절 임박 상품 */}
      <HomeProductSections />

      {/* 5) 배송 조회 빠른 입력 + AI 도우미 바로가기 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">배송 조회</h2>
          <p className="mt-1 text-sm text-gray-500">주문 번호로 지금 어디쯤인지, 몇 시쯤 도착할지 확인하세요.</p>
          <div className="mt-4">
            <TrackingQuickForm />
          </div>
        </div>

        <Link
          href="/ai"
          className="group flex flex-col justify-between rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 hover:shadow-md"
        >
          <div>
            <h2 className="text-lg font-bold">AI 도우미에게 물어보기</h2>
            <p className="mt-1 text-sm text-gray-600">
              &quot;내 주문 어디쯤이야?&quot;, &quot;언제 도착해?&quot;, &quot;지금 취소하면 어떻게 돼?&quot;
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 font-semibold text-blue-700">
            AI 도우미 열기 <span className="transition group-hover:translate-x-1">→</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
