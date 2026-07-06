# Booking Service — сводка решений (учебный проект)

Курс: полный цикл разработки веб-приложения с ИИ-агентами. Design First подход:
контракт → фронтенд → бэкенд → (далее) тесты → деплой.

Инструмент разработки: **OpenCode** (не Claude Code), с MCP-серверами
(Mantine MCP для документации компонентов).

---

## 1. Проектирование / контракт (шаг завершён, смёржен в main)

**Инструмент:** TypeSpec → генерирует OpenAPI 3.0 (`api/openapi.yaml`).

**Сущности:**

- `EventType`: id (uuid), title, description, durationMinutes (int32)
- `Slot`: startTime, endTime (utcDateTime) — вычисляемый, не хранится отдельно
- `Booking`: id, eventTypeId, startTime, endTime, guestName, guestEmail, createdAt
- `EventTypeCreate`, `BookingCreate` — модели для POST-запросов
- `ErrorResponse`: code, message — помечена `@error`

**Эндпоинты (6 шт.):**

| Метод | Путь                    | Коды ответов                                               |
| ----- | ----------------------- | ---------------------------------------------------------- |
| POST  | /event-types            | 201                                                        |
| GET   | /event-types            | 200                                                        |
| GET   | /event-types/{id}       | 200, 404                                                   |
| GET   | /event-types/{id}/slots | 200 (только, без 404 даже для несуществующего id)          |
| POST  | /bookings               | 201, 409 (конфликт слота)                                  |
| GET   | /bookings               | 200 (только предстоящие, startTime >= now, сортировка ASC) |

**Ключевые решения по контракту:**

- Все id — uuid, через переиспользуемый `scalar Uuid extends string` с `@format("uuid")`
- Без пагинации (масштаб маленький)
- 400 нигде явно не смоделирован — валидация обязательных полей через `required` в схеме, оставлена на уровень реализации
- `emitter-output-dir` в tspconfig.yaml — генерирует сразу в `api/openapi.yaml` без промежуточной вложенной папки
- `.gitignore`: `node_modules/`, `tsp-output/`, `.tsp-cache/`. `api/openapi.yaml` — коммитится (это контракт, не мусор)
- Корневой `AGENTS.md` содержит "Contract usage rules": api/openapi.yaml — единственный источник правды, редактируется только через .tsp-файлы, фронт и бэк не читают код друг друга

**Git-паттерн, принятый на всех шагах:** `feature/<step-name>` → PR на GitHub → merge через сайт.

---

## 2. Фронтенд (шаг завершён, смёржен в main)

**Стек:** TypeScript + Vite + React + Mantine 9 (последняя стабильная) +
react-router-dom + RTK Query + React Hook Form + Zod + Prism (mock-сервер для dev)

**Обоснование выбора:**

- RTK Query вместо react-query — пользователь уже знаком с RTK Query
- Zod — **только** для валидации форм (guestEmail, guestName, durationMinutes и т.д.), НЕ для типизации API — для этого используется `openapi-typescript`, генерирующий TS-типы прямо из `api/openapi.yaml` (единый источник правды, нет дублирования)
- Mantine выбран сознательно (пользователь не работал с ним раньше, но предпочёл), есть Mantine MCP server для агента

**Структура:**

```
frontend/
  src/
    api/
      generated-types.ts   — сгенерировано через openapi-typescript, не редактировать
      apiSlice.ts            — RTK Query, 6 endpoints
    schemas/                — zod-схемы ТОЛЬКО для форм
    features/
      event-types/
        EventTypesListPage.tsx
        EventTypeBookingPage.tsx   — трёхколоночная раскладка (см. ниже)
      admin/
        AdminBookingsPage.tsx
        AdminEventTypesPage.tsx
    components/AppLayout.tsx
    app/store.ts, router.tsx
  AGENTS.md   — стек, контракт как источник правды, подсказка про Mantine MCP
```

**Роуты:**

- `/` — список типов событий (гость)
- `/event-types/:id` — детали + слоты + форма бронирования
- `/admin` — список всех бронирований
- `/admin/event-types` — создание + список типов событий

**Dev-окружение:**

- Vite proxy `/api` → Prism (`localhost:4010`) в раннем dev, затем переключено на реальный бэкенд (`localhost:3000`) через `loadEnv` + `VITE_BACKEND_URL` в `.env.development`
- `rewrite: (path) => path.replace(/^\/api/, '')` — снимает префикс `/api` при проксировании на бэкенд
- **Важный технический нюанс:** `process.env.X` в `vite.config.ts` НЕ читает `.env.development` автоматически — нужен явный `loadEnv(mode, process.cwd(), '')`
- npm-скрипт `dev` — только Vite (без Prism), `mock-server` — Prism отдельно, `generate:api-types` — openapi-typescript

**Найденные и исправленные баги (код-ревью):**

1. `getSlots` не имел `providesTags`, `createBooking` не инвалидировал теги слотов → после бронирования занятый слот не пропадал из списка. Исправлено: `tagTypes: [..., 'Slot']`, `getSlots` → `providesTags`, `createBooking` → `invalidatesTags` с `{ type: 'Slot', id: eventTypeId }`
2. Пустой `catch` в `AdminEventTypesPage.tsx` — ошибка создания типа события никак не показывалась пользователю. Исправлено по аналогии с `EventTypeBookingPage.tsx`
3. Неиспользуемый `transformErrorResponse` в `apiSlice.ts` — удалён (дублировал ручной каст ошибки в компоненте)
4. `id!` + `skip: !id` заменено на `skipToken` из `@reduxjs/toolkit/query/react` — безопаснее для рефакторинга

**Форматирование даты/времени** (`src/utils/formatDateTime.ts`):

- 24-часовой формат (`hour12: false`)
- Дата без жёстко заданной локали (`toLocaleDateString(undefined, {...})`) — подстраивается под локаль браузера
- Явное указание таймзоны браузера рядом со временем: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Причина: слоты хранятся в UTC на бэкенде, но должны показываться понятно пользователю в его локальном времени

**UI-доработка: трёхколоночная раскладка бронирования** (по мотивам Cal.com):

- Слева — инфо о типе события (title, description, duration, таймзона)
- По центру — `@mantine/dates` `Calendar`, дни без слотов — `disabled` через `getDayProps`
- Справа — слоты только для выбранной даты + форма бронирования
- `minDate`/`maxDate` — 14-дневное окно, навигация календаря заблокирована за его пределами
- Слоты группируются по дате на фронте через `useMemo` (`Map<YYYY-MM-DD, Slot[]>`) — бэкенд не менялся, отдаёт как раньше плоский список
- Найден и исправлен race condition: при первой загрузке `selectedDate` мог зафиксироваться на дне без слотов из-за порядка выполнения эффектов — исправлено вторым `useEffect`, реагирующим на пустой список слотов для текущего выбранного дня

---

## 3. Бэкенд (шаг завершён, смёржен в main)

**Стек:** TypeScript + Fastify + in-memory store (`Map`), без базы данных (по требованию задания — допустим сброс данных при рестарте)

**Обоснование:** NestJS избыточен для 2 ресурсов и одного бизнес-правила; Django отброшен из-за незнакомости и отсутствия TS-типизации; Fastify выбран за нативную TS-поддержку и меньший boilerplate.

**Структура:**

```
backend/
  src/
    types/generated-types.ts   — тот же openapi-typescript, что и на фронте
    store/inMemoryStore.ts       — Map<id, EventType>, Map<id, Booking> — синхронные операции
    services/bookingService.ts    — generateAvailableSlots, createBooking
    routes/eventTypes.ts, bookings.ts
    app.ts, server.ts (порт 3000 по умолчанию)
  AGENTS.md
```

**Бизнес-правило генерации слотов** (`generateAvailableSlots`):

- 14 дней вперёд от текущей даты
- Только будние дни (Пн–Пт, исключая Сб/Вс)
- Окно 09:00–18:00 **в UTC** (явно через `Date.UTC(...)`, не локальное время сервера)
- Шаг = `durationMinutes` конкретного типа события
- Прошедшие слоты сегодняшнего дня исключаются (`candidate.startTime > now`)
- Слот исключается, если пересекается с ЛЮБЫМ существующим бронированием (кросс-типовое правило: нельзя забронировать одно и то же время дважды, даже для разных типов событий)
- Пересечение проверяется как: `candidate.start < existing.end AND candidate.end > existing.start`

**Защита от race condition в `createBooking`:**

- `Map` синхронный, между проверкой конфликта и записью нет `await` — гонки исключены даже в асинхронном коде

**Обработка ошибок:**

- `GET /event-types/{id}/slots` для несуществующего `eventTypeId` → `200 []` (не 404 — контракт не предусматривает 404 для этого эндпоинта)
- `POST /bookings`: и "eventType не существует", и "слот занят" возвращают 409 (контракт не даёт других вариантов), но с разными `message` в `ErrorResponse` — "Event type does not exist" vs "Time slot is already booked" — для различимости при отладке

**Ручное тестирование через реальный бэкенд (не Prism):**
Проверено: создание типа события реально появляется в списке (в отличие от stateless Prism), полный сценарий гость→бронь→admin, исчезновение забронированного слота из списка, конфликт при параллельном бронировании в двух вкладках, 404 на несуществующий event type на фронте.

---

## 4. Общие паттерны, важные для новых чатов/шагов

- **Единый источник правды** — `api/openapi.yaml`, генерируется из `.tsp`-файлов, не редактируется руками
- **openapi-typescript** используется одинаково и во фронтенде, и в бэкенде — синхронизирует типы без дублирования
- **AGENTS.md** — три файла: корневой (контракт), `frontend/AGENTS.md`, `backend/AGENTS.md` — каждый со своим стеком/командами + правилами использования контракта
- **Mantine MCP server** подключен в OpenCode (`opencode.json`, `mcp.mantine`) — агент должен использовать его вместо памяти при работе с компонентами
- **Git-flow:** ветка `feature/<step>` → PR → merge через сайт, для каждого крупного шага курса
- Пользователь предпочитает: сначала обсудить план/вопросы агента вместе с Claude, потом формулировать финальный промпт, затем ревьюить код перед мержем

---

## 5. E2E-тесты, CI, Conventional Commits, release-please (шаг завершён, смёржен в main, релиз v1.1.0)

### E2E-тесты (`e2e/` — отдельный пакет)

**Стек:** TypeScript + Playwright. 19 тестов:
- **API-тесты** (11, без браузера, через `request` fixture): event types CRUD, слоты, бронирования, конфликты, сортировка
- **UI-тесты** (8, Chromium): полный путь бронирования, календарь, конфликты, админка

**Ключевые решения:**

- `webServer` в `playwright.config.ts` сам поднимает backend (`npm run start:test` → `tsx src/server.ts` без watch, порт 3000) и frontend (`npm run dev:vite`, порт 5173, `VITE_BACKEND_URL=http://localhost:3000`). В CI серверы стартуют заново, локально переиспользуются (`reuseExistingServer: !CI`)
- API-тесты вызывают backend напрямую (порт 3000) — быстрее, не зависят от фронта
- UI-тесты идут через фронт (5173), который проксирует `/api/*` на backend
- `fullyParallel: false`, `workers: 1` — из-за общего in-memory store тесты влияют друг на друга через кросс-типовые конфликты слотов
- Тестовые данные (event types) создаются через API в `beforeEach` — без предзаполненного стора

**Технические нюансы, найденные при написании тестов:**

1. **Селектор календаря Mantine:** дни имеют класс `.mantine-Calendar-day`, а не `data-mantine-day`. Скрытые дни (`hideOutsideDates`) имеют `data-hidden="true"` и фильтруются: `button.mantine-Calendar-day:not([data-hidden])`
2. **Слот-карточки:** добавлен `data-testid="slot-card"` и `data-start-time` в компонент — без них селектор `[class*="mantine-Card-root"]` с `has: text('→')` матчил контейнерную карточку, а не индивидуальный слот
3. **Конфликт-тест:** слот для бронирования берётся из атрибута `data-start-time` DOM-элемента (не из предзапроса API) — это гарантирует, что UI отправляет именно тот слот, который был забронирован в фоне

**Добавлен бэкенд-скрипт `start:test`** (`tsx src/server.ts` без watch) — для использования в CI. Watch-режим в CI создаёт лишний file-watcher и может осложнять чистое завершение процесса.

### CI (GitHub Actions)

4 workflow:

| Workflow | Файл | Триггер | Что делает |
|---|---|---|---|
| E2E Tests | `.github/workflows/e2e.yml` | push/PR в main | Установка deps → Playwright → прогон → artifact при падении |
| Commit Lint | `.github/workflows/commitlint.yml` | PR | `wagoid/commitlint-github-action` — проверка всех коммитов в ветке |
| PR Title Check | `.github/workflows/pr-title.yml` | PR: opened/edited/sync | `amannn/action-semantic-pull-request` — проверка заголовка PR |
| Release Please | `.github/workflows/release-please.yml` | push в main | `release-please-action` → создаёт release PR с CHANGELOG |

### Conventional Commits

- `.commitlintrc.json` — `@commitlint/config-conventional` с типами: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `style`, `perf`
- `.husky/commit-msg` — `npx commitlint --edit $1` для локальной обратной связи (хотя основная проверка — в CI)
- **Squash-merge** в `main`: заголовок PR становится итоговым коммитом → **заголовок PR ОБЯЗАН быть в формате Conventional Commits**
- `pr-title.yml` блокирует мерж, если заголовок PR не соответствует формату

### release-please

- `release-please-config.json`: `release-type: "simple"`, единая версия на весь репозиторий (без npm publish)
- После мёрджа в main анализирует squash-коммиты (читает заголовки PR) → генерирует CHANGELOG → предлагает версию
- Пример: `feat:` → минорная версия, `fix:` → патч

### Git-flow (обновлено)

- **Merge-стратегия:** squash merge. Заголовок PR = сообщение коммита в main.
- **Агент всегда предлагает заголовок PR** в конце задачи — пользователь копирует его при создании PR на GitHub

**Проблемы, найденные после первого мёрджа (важно для будущих шагов):**

1. **`package-lock.json` рассинхронизирован с `package.json`** — после добавления husky/commitlint в корневой `package.json` вручную, `package-lock.json` не был пересобран. `npm ci` в CI падает с `EUSAGE`/"Missing: ... from lock file". Решение: всегда `npm install` (не ручная правка) после изменения зависимостей, коммитить обновлённый lock-файл.
2. **`.release-please-manifest.json` отсутствовал** — `release-please-config.json` без манифеста не работает: release-please не знает текущую версию, от которой считать бамп. Обязательный файл в корне для `release-type: simple`: `{ ".": "1.0.0" }`.
3. **GitHub Actions по умолчанию не может создавать PR** — `release-please-action` падает с "GitHub Actions is not permitted to create or approve pull requests" пока не включена настройка репозитория: Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests". Это настройка репозитория, не код — не сохраняется через git, при создании нового репозитория на курсе нужно будет включить заново.
4. **PR от release-please требует ручного approve** — GitHub требует подтверждения запуска workflow для PR, открытых не напрямую человеком (в т.ч. через `release-please-action`). Нормально, подтверждается в интерфейсе Actions разово на PR.

---

## 6. Что дальше (по программе курса)

Судя по структуре пройденных шагов, вероятные следующие шаги:

- Подготовка к деплою (Docker-образ — требование было заявлено в самом начале курса: "приложение должно собираться в Docker-образ и запускаться в контейнере")

---

## 7. Деплой (шаг завершён, смёржен в main)

**Платформа:** [Render](https://render.com) (PaaS), Web Service с runtime Docker

**Публичный URL:** [booking-service-uc8t.onrender.com](https://booking-service-uc8t.onrender.com)

**Параметры деплоя:**
- **Runtime:** Docker (автоопределение Dockerfile в корне репозитория)
- **Регион:** Frankfurt (EU)
- **План:** Free
- **Ветка:** `feature/docker-deploy`
- **Auto-deploy:** включён (деплой при пуше в ветку)

**Архитектура Docker-образа (multi-stage):**

```
Stage 1 (frontend-build): node:22-alpine
  npm ci → vite build → frontend/dist
Stage 2 (backend-build):  node:22-alpine
  npm ci → tsc → backend/dist
Stage 3 (production):     node:22-alpine
  ENV NODE_ENV=production
  npm ci --omit=dev (только production-зависимости)
  backend/dist + frontend/dist → public/
  CMD ["node", "server.js"]
```

**Ключевые адаптации для продакшена:**
- Бэкенд (Fastify) раздаёт статику фронтенда через `@fastify/static` + SPA-fallback (`setNotFoundHandler` → `index.html` для всех не-API GET-запросов)
- RTK Query использует `import.meta.env.PROD ? '' : import.meta.env.VITE_API_BASE_URL` — в проде `baseUrl = ''` (относительные пути на том же origin), в dev — `/api` (Vite proxy → `localhost:3000`)
- CORS регистрируется только при `NODE_ENV !== 'production'` (в проде фронт и бэк на одном origin)
- Render автоматически передаёт `PORT` — бэкенд слушает `process.env.PORT` (fallback 3000 для локального запуска)
- `ENV NODE_ENV=production` в финальной стадии Dockerfile активирует production-режим во всех упомянутых проверках

**Проверка деплоя:**
- `GET /event-types` → 200 `[]`
- `GET /bookings` → 200 `[]`
- `GET /` → 200 (SPA index.html)
- `GET /admin` → 200 (SPA fallback)
- `POST /event-types` → 201
