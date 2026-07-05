# Booking Service — E2E Tests

## Stack

- TypeScript + Playwright
- API tests: Playwright `request` fixture (no browser)
- UI tests: Chromium browser

## Commands

```bash
npm run test              # run all tests
npm run test:api          # API tests only (backend direct calls)
npm run test:ui           # UI tests only (browser)
```

## How the environment is started

Playwright's `webServer` config auto-starts before tests:

1. **Backend**: `npm run start:test` from `../backend` → port 3000
2. **Frontend**: `npm run dev:vite` from `../frontend` → port 5173
   - `VITE_BACKEND_URL=http://localhost:3000` is set so Vite proxy points to real backend

## Test structure

```
tests/
  api/                     # Backend-only, no browser, fast
    event-types.spec.ts    # CRUD + slots
    bookings.spec.ts       # Book + conflict + list
  ui/                      # Full browser, real frontend + backend
    booking-flow.spec.ts   # Guest booking journey
    admin.spec.ts          # Admin pages
```

## Design decisions

- API tests call backend directly (`http://localhost:3000`) — faster, independent of frontend
- UI tests go through frontend (`http://localhost:5173`) which proxies `/api/*` to backend
- Test data (event types) is created via API in `test.beforeEach` for UI tests — no pre-seeded data
- Backend uses in-memory store — each test run starts with a clean slate
- `reuseExistingServer: !CI` — local runs reuse already-running servers, CI starts fresh
