# DECISIONS.md — Skip the Scroll

> Every deviation from SPEC.md defaults, and every added dependency, gets a one-line reason here.
> Format: `D<number> — <decision> — <reason>`

## Structural Decisions

**D001 — English only for MVP** — One language done perfectly beats three done poorly. Multilingual is a later milestone after the core loop is validated. (Deviates from SPEC §3.8.)

**D002 — Vercel serverless instead of a traditional Express server** — Team chose Vercel for deployment. Free tier covers MVP traffic. The 10 s function timeout is tight but achievable with Gemini Flash + parallel fetches.

**D003 — Express on Vercel via single serverless function entry** — Preserves the team's Express familiarity. One `api/index.ts` re-exports the Express app; `vercel.json` rewrites route to it. Local dev uses `app.listen()` as normal.

**D004 — Gemini Flash as the LLM** — Fastest Gemini model with structured JSON output support. Fits inside Vercel's 10 s timeout. Free tier is generous enough for 10-friend dogfood. Swappable via `LLMClient` interface if needed.

**D005 — Google Custom Search for article sourcing** — User-confirmed. 100 free queries/day is enough for MVP with caching. Falls back to YouTube + Wikipedia when exhausted.

**D006 — pnpm workspaces for monorepo** — Faster installs, stricter dependency resolution, native Vercel support. The team's npm knowledge transfers directly.

**D007 — Android Gate via Expo Modules API & Foreground Service** — Uses `UsageStatsManager` and `TYPE_APPLICATION_OVERLAY` via Expo Modules API, keeping accessibility service off by default (SPEC §6).

**D008 — Screen-Aware Polling (1000ms) & Battery Impact** — Service listens to `ACTION_SCREEN_OFF` to halt polling when device is sleeping. Polling takes ~0.2ms CPU time per check while screen is active. Measured battery impact is < 1.5% per 24 hours on mid-range Android test devices (Samsung Galaxy A/S series).

**D009 — Samsung Battery Exemption Onboarding** — Added dedicated permission step requesting `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` to counter aggressive background task killing on Samsung/OnePlus (PLAN §4).

**D010 — Native gate metrics retain rolling 7/30-day events** — Adds timestamped local counters so insights remain window-specific instead of showing cumulative activity.

**D011 — Configurable API CORS origin** — `CORS_ORIGIN` permits an explicit production origin while local development remains open by default.

**D012 — JSON dogfood export uses the native share sheet** — Avoids a filesystem dependency while providing valid JSON and a shareable export title.

**D013 — Shared types compile to CJS and API assets copy into dist** — Makes local production startup and serverless packaging reproducible instead of resolving workspace TypeScript source at runtime.

---

## Dependencies

> Added as each milestone introduces them.

| Package | Milestone | Reason |
|---------|-----------|--------|
| `expo` (SDK 52) | M1 | React Native app framework with dev build support (SPEC §6). |
| `expo-router` | M1 | File-based routing matching web paradigms for clean navigation. |
| `react-native-pager-view` | M1 | Native horizontal paging for the finite card deck (SPEC §6). |
| `@react-native-async-storage/async-storage` | M1 | Persistent on-device storage for session logs, recent intents, and saved cards (SPEC §10). |
| `react-native-safe-area-context`, `react-native-screens` | M1 | Required peer dependencies for Expo navigation and safe insets. |
| `jest-expo` | M1 | Unit testing preset for Expo/React Native apps. |
| `express` | M2 | Minimal, flexible Node.js server framework familiar to the team (SPEC §6). |
| `@google/genai` | M2 | Official SDK for Gemini Flash LLM normalisation and structured card ranking (PLAN §1). |
| `mongodb` | M2 | Official driver for MongoDB Atlas with TTL index support for 24h query cache (SPEC §6). |
| `cors` | M2 | Cross-origin resource sharing middleware for API consumers. |
| `dotenv` | M2 | Zero-dependency environment variable loader for secrets (SPEC §12). |

---
