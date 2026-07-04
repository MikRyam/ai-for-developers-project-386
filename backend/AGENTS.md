# Booking Service — Backend

## Stack

- TypeScript + Fastify v5
- openapi-typescript — TS type generation from OpenAPI spec
- @fastify/cors — CORS for frontend (localhost:5173)
- In-memory storage (Map) — data resets on restart

## Commands

```bash
npm run dev                 # start dev server with hot reload (tsx watch)
npm run generate:api-types  # regenerate src/types/generated-types.ts from contract
npm run build               # compile TypeScript to dist/
npm start                   # run compiled server
```

## Contract

- **Source of truth**: `../api/openapi.yaml` (generated from TypeSpec — do NOT edit by hand)
- Types are generated from the contract via `npm run generate:api-types`
- Route handlers use generated types only — no manual API type duplication
- If a contract change is needed, update `.tsp` files, run `tsp compile .` in root, then regenerate types

## Project structure

```
backend/
  src/
    types/
      generated-types.ts    — auto-generated, do not edit
    store/
      inMemoryStore.ts      — Map<string, EventType>, Map<string, Booking>
    services/
      bookingService.ts     — generateAvailableSlots, createBooking
    routes/
      eventTypes.ts         — 4 event-type endpoints
      bookings.ts           — 2 booking endpoints
    app.ts                  — Fastify setup: cors + route registration
    server.ts               — entry point, starts on PORT (default 3000)
```

## Configuration

- `PORT` env variable (default: 3000)
- `HOST` env variable (default: 0.0.0.0)

## Business rules

- Slots generated for 14 days ahead, working days only (Mon–Fri), 09:00–18:00 UTC
- Cross-type slot conflict: a slot overlaps with ANY existing booking (any event type)
- Bookings check conflict against ALL bookings before saving (no race conditions with in-memory store)
- GET /bookings returns only upcoming bookings (startTime >= now), sorted ascending
