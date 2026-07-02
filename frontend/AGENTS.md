# Booking Service — Frontend

## Stack

- TypeScript + Vite + React
- Mantine (UI library, v9) — **always use the Mantine MCP tool** to look up docs and props
- react-router-dom — routing
- @reduxjs/toolkit (RTK Query) — API request layer
- openapi-typescript — TS type generation from OpenAPI spec
- react-hook-form + zod + @hookform/resolvers — form validation

## Commands

```bash
npm run dev                  # start mock-server (Prism) + Vite dev server concurrently
npm run dev:vite             # Vite dev server only
npm run mock-server          # Prism mock server on port 4010
npm run generate:api-types   # regenerate src/api/generated-types.ts from contract
```

## Contract

- **Source of truth**: `../api/openapi.yaml` (generated from TypeSpec — do NOT edit by hand)
- Types are generated from the contract via `npm run generate:api-types`
- RTK Query endpoints use generated types only — no manual API type duplication

## Project structure

```
frontend/
  src/
    api/
      generated-types.ts    — auto-generated, do not edit
      apiSlice.ts            — RTK Query baseApi + endpoints
    features/
      event-types/
        EventTypesListPage.tsx
        EventTypeBookingPage.tsx
      admin/
        AdminBookingsPage.tsx
        AdminEventTypesPage.tsx
    components/
    schemas/
      bookingFormSchema.ts
      eventTypeFormSchema.ts
    app/
      store.ts
      router.tsx
    main.tsx
```

## Proxy

In development, Vite proxies `/api/*` requests to the Prism mock server (port 4010).
`VITE_API_BASE_URL=/api` is set in `.env.development`.
