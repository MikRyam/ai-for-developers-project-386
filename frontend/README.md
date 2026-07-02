# Booking Service — Frontend

## Stack

- **TypeScript** + **Vite** + **React**
- **Mantine** — UI library
- **react-router-dom** — routing
- **@reduxjs/toolkit (RTK Query)** — API request layer
- **openapi-typescript** — TS type generation from `api/openapi.yaml`
- **react-hook-form** + **zod** + **@hookform/resolvers** — form validation
- **@stoplight/prism-cli** — mock server for development

## Getting started

```bash
# Install dependencies
cd frontend
npm install

# Generate TypeScript API types from the OpenAPI contract
npm run generate:api-types

# Start development (mock server + Vite dev server)
npm run dev
```

This runs two processes concurrently:
1. **Prism mock server** on `http://localhost:4010` (serving `../api/openapi.yaml`)
2. **Vite dev server** on `http://localhost:5173`

Requests from the frontend to `/api/*` are proxied by Vite to the Prism server.

> **Note:** Prism is a static mock server — it validates requests against the OpenAPI contract and returns example responses, but **does not persist state**. Created resources (bookings, event types) are not stored, so subsequent GET requests still return the original static data. For a full end-to-end test, replace Prism with the real backend.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Prism mock + Vite dev concurrently |
| `npm run dev:vite` | Vite dev server only |
| `npm run mock-server` | Prism mock server on port 4010 |
| `npm run generate:api-types` | Regenerate `src/api/generated-types.ts` from the contract |
| `npm run preview` | Preview production build |

## Project structure

```
frontend/
  src/
    api/
      generated-types.ts    — auto-generated TS types from OpenAPI
      apiSlice.ts            — RTK Query baseApi + endpoints
    features/
      event-types/
        EventTypesListPage.tsx       — public list of event types
        EventTypeBookingPage.tsx     — event type details + slots + booking form
      admin/
        AdminBookingsPage.tsx        — owner: list of upcoming bookings
        AdminEventTypesPage.tsx      — owner: create + list event types
    components/
      AppLayout.tsx                  — Mantine AppShell layout
    schemas/
      bookingFormSchema.ts           — zod schema for booking form
      eventTypeFormSchema.ts         — zod schema for event type form
    app/
      store.ts                       — Redux store
      router.tsx                     — react-router configuration
    main.tsx                         — app entry point
```

## Contract

- **Single source of truth**: `../api/openapi.yaml`
- The contract is generated from TypeSpec (`main.tsp`, `src/`) — never edit `api/openapi.yaml` by hand
- Types are kept in sync by running `npm run generate:api-types`
