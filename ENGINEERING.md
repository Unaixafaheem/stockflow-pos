# Engineering upgrades

## Scripts
- `npm run typecheck` — TypeScript check (strict on `.ts`/`.tsx`; JS pages migrate gradually)
- `npm run test` / `npm run test:run` — Vitest + Testing Library
- `npm run test:e2e` — Playwright login → checkout → orders
- API docs: `http://localhost:5001/api/docs` (OpenAPI at `/api/docs/openapi.json`)

## Sentry
Set `VITE_SENTRY_DSN` in `.env.local` (see `.env.example`).

## CI/CD
GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, unit tests, build, e2e.
On push to `main`/`master`, deploys to Vercel when secrets are set:
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (+ optional `VITE_SENTRY_DSN`, `VITE_API_URL`).
