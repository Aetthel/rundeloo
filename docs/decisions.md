# Decision log

Binding decisions. This file is the single source of truth (the Notion Decision Log is no longer kept in sync). Newest phase last. If a task needs to change one of these, stop and ask Alex first.

## Product

- Two entities, **Company 1:N Application**.
- Freemium: free = organization, Pro = active AI. Pro features are **visible but locked** for free users and open a paywall; the real gate is on the server.
- App is **bilingual (English and Spanish)** with i18n from day one.
- **Landing in v1**, in the same repo as the app.
- **No global contacts screen**: contacts live inside each company.
- **Calendar has no events of its own**: only derived from interviews, deadlines, alerts and (Pro) contact reminders. No Google Calendar sync in v1.
- **Alerts are a bell dropdown**, not a page. Snooze updates `due_at`; dismiss sets `status = dismissed`.
- **Pinned notes in the sidebar**, max 3, ordered by `notes.pinned_at`.
- **Onboarding:** completion flag in `profiles.onboarding_completed`; step progress in `localStorage` (v1). Login with onboarding incomplete → back to onboarding. **A written spec is mandatory before coding it.**
- Responsive web only (basic). No native app in v1.
- Figma work ended 2026-11-04: the design system and high fidelity are built in code.

## Database

- Supabase in **Europe** (`eu-central-1`).
- "Automatically expose new tables" **off**; manual `GRANT`s; `anon` has no table access.
- Date-times are **`timestamptz`**.
- Only `companies`, `notes` and user-level Pro tables carry `user_id`; others resolve ownership through foreign keys.
- `subscriptions`, `weekly_summaries`, `question_bank` are **read-only for the client**.
- Free/Pro limits enforced in the **server layer**, not the database.
- `embedding` is **`vector(1024)`**. The embedding model must output 1024 dimensions (candidate: Ollama `mxbai-embed-large`; Voyage AI was the earlier choice). Changing the model means re-embedding everything.
- `on delete cascade` in the business chain, `set null` for note anchors and simulations.
- **Pipeline order needs an explicit priority map** (offer, interview, applied, saved, on_hold, rejected). Never `ORDER BY status`: it silently sorts by enum creation order.
- New columns: `notes.pinned_at timestamptz` and `applications.deadline date` (both nullable). `application_status_history` added in task 7 (see "Schema migration").

## Stack and code

- **Next.js 16.4** (App Router, TypeScript, `src/`, Turbopack). Session and route protection in **`src/proxy.ts`** (not `middleware.ts`).
- Tailwind CSS v4 with tokens in `globals.css` (`@theme`); shadcn/ui; TipTap.
- **Reads in Server Components, writes in Server Actions, Route Handlers only for webhooks, cron, AI streaming and the auth callback. No tRPC.** (Narrows the earlier "API Routes or tRPC".)
- Server-only code in `src/server/` with `import "server-only"`. Three Supabase clients; the admin client only for the Stripe webhook, cron and `question_bank`.
- Zod validation shared by client and server.
- Schema changes as versioned migrations in `supabase/migrations/`.
- In Vercel, pin the function region to Europe.

## Git

- `main` (production) and `develop` (integration, **default branch** on GitHub). Branches `feat/`, `fix/`, `chore/` from `develop`.
- **Squash merge into `develop`; merge commit from `develop` into `main`** (never squash into `main`). Releases on Fridays.
- Rulesets on both branches: PR required with 0 approvals, no force push, no deletion. Bypass list empty.
- Conventional Commits in English.
- **In Vercel (Phase 7), set `main` as Production Branch explicitly**, or it would deploy `develop`.

## Claude Code tooling (2026-11-09)

- Claude Code has **read-only access to Supabase and Figma** in this repo; write tools are denied in `.claude/settings.json`. It cannot run SQL against the remote project, so it sees the schema but not row data.
- **Only Alex runs migrations and remote changes.** Claude prepares the file in `supabase/migrations/`.
- All Claude Code configuration lives in `.claude/`, with `CLAUDE.md` at the repo root.

## Companies (2026-11-19)

- **Create and edit forms open in a side sheet** (`FormSheet`), the pattern M1 reuses. Delete asks in an `AlertDialog` that names what goes with it (cascade).
- **Company logos are favicons fetched by our server** from DuckDuckGo's icon service, cached for weeks per host (`"use cache"`) and inlined as data URIs. The user's browser never contacts a third party; only the host is sent. Initials when there is none. No Route Handler needed.
- **Websites are normalized** to `https://` and only http(s) URLs are stored; LinkedIn fields must point to linkedin.com.
- **Derived columns** (best stage, counts, last activity) are computed in `listCompanies()`; best stage follows `PIPELINE_PRIORITY` in `src/lib/constants.ts`.
- Contact reminders stay a locked Pro teaser until the Pro features (task 11). The Activity card waits for applications (part 3).

## App shell (2026-11-19)

- **shadcn `Sidebar`** is the base of the shell; the design is iterated on it.
- **One background tone** for sidebar, top bar and content (`bg-sidebar`). Only the Pro upgrade card stands out: `bg-steel` with a fixed light button, in both themes.
- **Containers inside screens use the `surface` token** (white in light, steel in dark, never black), with lighter inner borders in dark. Applies to every future screen.
- **Theme and language switchers live in the account menu.** The theme is saved in `profiles.theme` (`system` = null).
- **Mobile:** bottom bar (Dashboard, Applications, Calendar, Notes, More); "More" opens the sidebar sheet.
- **`DEV_PREVIEW_NO_AUTH`** allows browsing the app without signing in, only under `next dev`.
- **`accessibility` subagent** (`.claude/agents/accessibility.md`) reviews UI branches before the PR.

## Authentication (2026-11-18)

- **Email confirmation on.** Supabase's built-in SMTP is enough for development; a free production SMTP is chosen in Phase 7.
- **Sign-up data travels as user metadata** and `handle_new_user()` stores it after validating it. The metadata is client-controlled: never trust it without that check.
- **No user enumeration** in sign-up or password reset, and auth errors are mapped to i18n keys.
- **Email links come from `NEXT_PUBLIC_SITE_URL`**, never from request headers.
- **Social sign-in (Google or LinkedIn) is pending** (2026-11-18): the login shows both buttons disabled with "Coming soon". Pick one and wire it up in a later task; until then, email + password only.
- **Login and sign-up use the shadcn `login-04` / `signup-04` layout** (form + brand panel, shared in `AuthSplitCard`). Sign-up asks to confirm the password. The panel shows the theme-aware logo on the muted background until the brand PNG is added.
- **`security` subagent** (`.claude/agents/security.md`) reviews branches that touch auth, migrations, billing, Route Handlers or AI before the PR.

## Schema migration (2026-11-17)

- **`application_status_history` is written by a database trigger** (`SECURITY DEFINER`), not by Server Actions: no code path can skip it. Users have `SELECT` only, so history can't be forged or edited. No `updated_at`: rows are immutable.
- **Backfilled** with one row per existing application (current status, `changed_at = coalesce(status_changed_at, created_at)`).
- **Baseline from `db dump`, not `db pull`:** `db pull` writes the remote migration history. Remote writes (`migration repair`, `db push`) are always run by Alex, with `--remote`.

## Design system (2026-11-11)

- The Pro **locked** color is **Slate in light and Mist in dark** (was Mist in both). Mist on white is 2.6:1 and fails WCAG AA for text.
- `cn()` uses **`clsx` + `tailwind-merge`**, not the `cn` package that `shadcn init` installs (0.x, released days before). Check imports after every `shadcn add`.

## i18n base (2026-11-16)

- **`next-intl`** (without its locale routing) for translations, ICU plurals and date/number formatting. Message keys are typed from `en.json`, the source of truth.
- **`src/proxy.ts` mirrors `profiles.language` into the `NEXT_LOCALE` cookie**, using the profile query it already makes. `src/i18n/request.ts` reads only cookie → `Accept-Language`, never the database. Any code that changes `profiles.language` must also set the cookie (see `setLocale`).
- **The root layout renders `<html>` inside `<Suspense>`**, because the locale comes from cookies and Cache Components forbids that outside a boundary. Consequence of option B: pages that were static are now dynamic, the landing included. Revisit before launch if landing performance or SEO suffers.

## Context review (2026-11-11)

- **Zero running cost.** The only expense is the domain. Every service (hosting, AI, email, database) must fit a free tier that allows a commercial product. Stripe's per-payment fee is accepted.
- **AI behind a provider layer** in `src/server/ai/`: features never call a vendor SDK directly. **Ollama in development**; the production provider is chosen in Phase 7 and must be free. Replaces "Claude API for all AI features".
- **Free plan has no quantity limits.** Free = unlimited organization; Pro = AI features.
- **Notifications are in-app only in v1** (alerts bell and dashboard). Reminder `sent` means shown in the app. Email is reserved for future product-wide announcements, which will need explicit opt-in and an unsubscribe link.
- **`profiles.timezone`** (IANA name, e.g. `America/New_York`), detected from the browser on sign-up and editable in Settings. The server uses it for "today", weeks, the calendar and the weekly summary schedule.
- **`profiles.theme` has no default:** null means "follow the device", set only when the user picks light or dark.
- **Mobile navigation:** bottom bar with Dashboard, Applications, Calendar, Notes and "More" (Companies, Question bank, Weekly summary, Settings). Revisit as the product grows.
- **Legal pages** `/privacy` and `/terms` in `(marketing)`, drafted by Claude and reviewed by Alex before real payments (Stripe and GDPR need them).
- **All code, comments, error messages and prompts in English.** Existing Spanish code is translated in task 5.
- **Tooling:** Prettier and Vitest from task 5, Playwright end-to-end tests in task 12, Supabase CLI as a dev dependency (task 7).

## Structure and routing (2026-11-09)

- Three route groups: `(marketing)` landing, `(auth)` login/register/forgot/reset/onboarding (no sidebar), `(app)` authenticated app.
- New screen **`/reset-password`**, required by the Supabase recovery flow.
- Detail tabs are **nested routes**, header in `layout.tsx`. Exception: notes editor uses `?tab=` to keep TipTap mounted.
- View toggles are query params (`?view=board|table`, `?view=month|week`).
- Components organized by feature.
- **i18n without locale in the URL (option B).** Priority: `profiles.language` → cookie → `Accept-Language` → English. Changed in Settings. Drives UI, AI responses, date formats and first day of the week. User content is never translated.
