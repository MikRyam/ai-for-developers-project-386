# Booking Service API — TypeSpec

## Commands

```bash
npm run compile        # tsp compile . → api/openapi.yaml
docker build -t booking-service .
docker run -e PORT=3000 -p 3000:3000 booking-service
```

## Project structure

| Path | Purpose |
|---|---|
| `main.tsp` | Entry point: `@service`, `@versioned`, imports |
| `src/models.tsp` | `Uuid`, `EventType`, `Slot`, `Booking`, `*Create`, `ErrorResponse` |
| `src/event-types.tsp` | `interface EventTypes` (4 endpoints) |
| `src/bookings.tsp` | `interface Bookings` (2 endpoints) |
| `tspconfig.yaml` | Emitter: `@typespec/openapi3` → `api/openapi.yaml` |
| `Dockerfile` | Multi-stage: frontend-build → backend-build → production (node:22-alpine) |
| `backend/` | Fastify API server (port 3000, `process.env.PORT`) |
| `frontend/` | React + Vite SPA (served as static by backend in production) |

## Key conventions

- **Output path**: configured via `emitter-output-dir` under emitter options (NOT top-level `output-dir`). File lands directly in `api/openapi.yaml`, no intermediate subfolder.
- **Namespace**: each source file declares `namespace BookingService;` (blockless) to merge into the service namespace. `main.tsp` uses a block namespace (`namespace BookingService { ... }`).
- **Versioning**: `@versioned(ServiceVersions)` on namespace + `enum ServiceVersions { v1_0_0: "1.0.0" }` inside the block. Requires `@typespec/versioning`.
- **Uuid scalar**: defined as `scalar Uuid extends string` with `@format("uuid")`. Used in models and path params. In generated OpenAPI it appears as a separate `$ref` schema, not inline.
- **`@error`**: `ErrorResponse` is decorated with `@error` so OpenAPI treats it as an error schema.
- **Response unions**: `createBooking` returns `{201, Booking} | {409, ErrorResponse}` — union of explicit status code + body models.
- **`@body`** is NOT used on request body parameters — spread the model directly (`...EventTypeCreate`).
- **`@format("uuid")`** is on the scalar definition only; individual model fields use `Uuid` type directly.
- **Build artifacts**: `tsp-output/` and `.tsp-cache/` are gitignored.

## Git workflow

- **Branch naming**: `feature/<description>` for new features, `fix/<description>` for bug fixes, `chore/<description>` for maintenance.
- **Merge strategy**: PRs into `main` are **squash-merged**. The **PR title** becomes the final commit message on `main` — it MUST follow Conventional Commits.
- **Conventional Commits**: all commits and PR titles follow the format `type(scope?): description`, where `type` is one of:

  | Type | Purpose | Triggers release? |
  |---|---|---|
  | `feat` | New feature | Yes (minor bump) |
  | `fix` | Bug fix | Yes (patch bump) |
  | `chore` | Maintenance, tooling | No |
  | `docs` | Documentation only | No |
  | `test` | Adding or updating tests | No |
  | `ci` | CI/CD changes | No |
  | `refactor` | Code changes without feature/fix | No |
  | `style` | Formatting, whitespace | No |
  | `perf` | Performance improvements | No |

- **Choosing the PR title type**: when a PR combines multiple categories of changes (e.g. tests + CI + tooling), pick the type by the **most significant change** for the project. Adding testing infrastructure, CI pipelines, or release automation is a new capability → `feat:`. Pure test additions with no other changes → `test:`. Pure CI tweaks → `ci:`. The type also determines whether release-please creates a release PR: only `feat:` and `fix:` trigger version bumps. If you want a release after the merge, use `feat:` or `fix:`.

- **CI enforcement**: CI checks that:
  - All commits in a PR follow Conventional Commits (`.github/workflows/commitlint.yml`)
  - The PR title itself follows Conventional Commits (`.github/workflows/pr-title.yml`) — this is critical because of squash-merge
- **At the end of each task**, the agent MUST output a "## Git workflow" section with:
  1. Branch name suggestion (`feature/<description>` or `fix/<description>`)
  2. Commit command with Conventional Commits message
  3. Push command
  4. PR title suggestion (the user will copy it when creating the PR on GitHub)
  5. Reminder that CI checks e2e tests, commitlint, and PR title format

## Required GitHub repository settings (not in code, set once manually)

- **Settings → General → Pull Requests → Squash merge → Default commit message**: must be set to **"Pull request title"** (not "Default message") — required so the squash commit matches what `pr-title.yml` validates and what release-please parses.
- **Settings → Actions → General → Workflow permissions**: **"Allow GitHub Actions to create and approve pull requests"** must be enabled — required for `release-please-action` to open release PRs.
- `.release-please-manifest.json` must exist in repo root (`{ ".": "1.0.0" }` or current version) — `release-please-config.json` alone is not sufficient.

## Contract usage rules

- `api/openapi.yaml` is the single source of truth for both frontend and backend. It is generated, never edit it by hand.
- To change the contract: edit the `.tsp` files in `src/`, then run `npm run compile` to regenerate `api/openapi.yaml`.
- Frontend and backend are implemented as separate, independent parts based solely on `api/openapi.yaml` — do not read or depend on each other's implementation code.
- If a contract change is needed while implementing frontend or backend, stop and update the `.tsp` source first, regenerate, then continue implementation against the updated contract.

## Docker

- **Multi-stage build** (3 stages): frontend (vite build) → backend (tsc) → production (node:22-alpine, only prod deps)
- **Productions image**: backend serves frontend static files via `@fastify/static` + SPA fallback (`setNotFoundHandler` → `index.html`)
- **CORS**: disabled in production (`NODE_ENV=production`) — frontend and backend are on the same origin
- **Port**: backend listens on `process.env.PORT` (set automatically by Render, fallback 3000 locally)
- **`.dockerignore`**: excludes `node_modules`, `dist`, `.git`, `e2e`, `tsp-output`, `.tsp-cache`, env files, docs
- **Deployed at**: [booking-service-uc8t.onrender.com](https://booking-service-uc8t.onrender.com) (Render, Frankfurt, free plan)
