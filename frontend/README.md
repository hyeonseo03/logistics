# Logistics 프론트엔드

Next.js 쇼핑몰 + 관리자 화면. 프로젝트 소개·실행 방법·환경변수는 [저장소 루트 README](../README.md) 를 본다.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL (기본 http://localhost:8080)
npm run dev                  # http://localhost:3000
```

- 화면은 `lib/api.ts` 의 함수만 호출한다 (모든 함수가 백엔드 REST API 를 부른다)
- 화면별로 필요한 데이터와 API: [`docs/api-wishlist.md`](docs/api-wishlist.md)
