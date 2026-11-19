# Roadmap

Last updated: 2026-11-19.

The project follows an 8-phase methodology. One phase at a time; a phase is not left until it is closed.

| # | Phase | Status |
|---|---|---|
| 1 | From fuzzy idea to real problem | Done |
| 2 | Requirements | Done |
| 3 | Environment setup | Done |
| 4 | Technical design and architecture | Done |
| 5 | Wireframes and visual design | Done (2026-11-04) |
| 6 | **Development** | **In progress** |
| 7 | Production environment | Pending |
| 8 | Feedback, bugs, iteration | Pending (ongoing) |

Target launch (not final): realistic **2026-12-15** · optimistic 2026-11-20 · conservative 2026-12-28.

## Phase 6 — task order

1. ~~Base project: Next.js 16.4, first push to `main`~~ Done.
2. ~~Branching strategy~~ Done (2026-11-04). `develop` is the default branch; rulesets protect `main` and `develop`.
3. ~~Folder structure~~ Done (2026-11-09). Includes `CLAUDE.md`, `docs/` and the Claude Code setup in `.claude/` (rules, skills, hooks, reviewer agent, settings).
4. ~~Design system in code~~ Done (2026-11-11) on `feat/design-system`: shadcn/ui, tokens in `globals.css`, light and dark themes. See `docs/design.md`.
5. ~~Supabase connection for Next.js 16~~ Done (2026-11-11) on `chore/supabase-connection`: reviewed `proxy.ts` and the three clients, onboarding redirect, code translated to English, Prettier and Vitest.
6. ~~i18n base~~ Done (2026-11-16) on `feat/i18n-base`: `next-intl` without locale routing, locale synced from `profiles.language` in the proxy, typed messages and enum labels. The visual language switcher ships with the screens (task 9).
7. ~~Migration~~ Done (2026-11-17) on `chore/schema-migration`: Supabase CLI 3.1.0, baseline plus phase 6 migration applied to the remote project, types regenerated. See `docs/database.md`.
8. ~~Authentication and route protection~~ Done (2026-11-18) on `feat/auth`: sign-up, sign-in, sign-out, password recovery, screens 02–04 and reset password, `auth_hardening` migration, `security` agent. Sign-out button and language switcher ship with the app shell (task 9).
9. **Core screens** — in progress. Part 1 done (2026-11-19) on `feat/app-shell`: app shell, shared states and placeholders for every app route. Next parts: applications, companies and contacts, dashboard and calendar, the rest. Core screens from the wireframes (`docs/screens.md`), plus `/privacy` and `/terms`. Logo from `public/brand/`, mobile bottom bar.
10. **Written spec of the AI onboarding — mandatory before coding it.** Topics already known: experience, what the user is looking for, sector. May add `profiles` columns in a second migration.
11. AI provider layer (Ollama in development), AI onboarding, notes editor (TipTap), auto-linking, weekly summary, Pro features, Stripe.
12. Manual testing, Playwright end-to-end tests and visual consistency review on the real app.

## Phase 7 — production

Cloudflare domain (.com), **the only accepted cost** · hosting on a free tier that allows a commercial product with payments (check Vercel Hobby's terms; EU region; **Production Branch = `main` set explicitly**) · free production AI provider · production-ready checklist per feature · Friday release cadence · cron for the weekly summary · Supabase free plan pauses after 7 days idle: solve before launch.

## Phase 8 — parked items

See "Parked" in `docs/database.md`, plus bug tracking, performance tests, public demo and LinkedIn demo.

## Open items

- AI onboarding spec (steps, questions, what it generates). Task 10.
- Production AI provider and hosting, both free (Phase 7).
- Simulator `score` scale (recommendation: 0–10).
- Reverse image search of the logo (stacked bars are a common motif).
