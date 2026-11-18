# Database

Supabase project `rundeloo`, region `eu-central-1`, Postgres 17 with pgvector. Schema closed on 2026-10-14, checked against the live database on 2026-11-09 and versioned in `supabase/migrations/` since 2026-11-16.

**Never change the remote schema directly.** Schema changes are SQL migrations in `supabase/migrations/`, reviewed by Alex before they run.

## Global rules

- 18 tables, 21 enums, RLS enabled on every table (19 policies), `updated_at` trigger on all tables except the immutable `application_status_history`.
- Sign-up trigger creates the rows in `users`, `profiles` and `subscriptions`, and copies the validated `full_name`, `language` and `timezone` from the sign-up metadata into `profiles`.
- "Automatically expose new tables" is **off**. Grants are given by hand with `GRANT`. Role `anon` has no data access to any table. **A new table needs its RLS policies and grants in the same migration.**
- `anon` has no privilege on any table, and `authenticated` has no `REFERENCES`, `TRIGGER`, `TRUNCATE` or `MAINTAIN` (revoked in `auth_hardening`, also for future tables through default privileges).
- Dates with time are `timestamptz`, never `timestamp`.
- Only `companies`, `notes` and the user-level Pro tables carry `user_id`. The rest resolve ownership through the foreign-key chain (RLS joins up to `companies.user_id`).
- Read-only for the client: `subscriptions`, `weekly_summaries`, `question_bank`. Written by the server with the admin client.
- Free vs Pro limits are enforced in the server layer (`subscriptions.plan`), not in the database.
- `on delete cascade` along the business chain; `on delete set null` for note anchors and simulations.

## Ownership chain

```
users ─┬─ profiles
       ├─ subscriptions
       ├─ weekly_summaries
       ├─ interview_simulations ── application (set null)
       ├─ notes ── company / application / interview (set null)
       │     └─ note_links (source, target)
       └─ companies
             ├─ contacts ── contact_reminders
             ├─ study_resources
             └─ applications
                   ├─ application_status_history
                   ├─ interviews ── checklist_items
                   ├─ alerts
                   └─ study_paths
question_bank (global, no owner)
```

## Tables (`?` = nullable)

| Table | Columns |
|---|---|
| users | id, email, auth_provider?, last_login_at?, created_at, updated_at |
| profiles | id, user_id, full_name?, target_role?, seniority (seniority_level)?, search_type?, target_location?, initial_active_processes (int)?, prep_detail_level?, onboarding_completed (bool), theme (theme_mode, no default)?, language (text)?, timezone (text, IANA)?, created_at, updated_at |
| subscriptions | id, user_id, plan (subscription_plan), status (subscription_status), stripe_customer_id?, stripe_subscription_id?, current_period_end?, cancel_at_period_end (bool), created_at, updated_at |
| companies | id, user_id, name, website?, industry?, location?, notes?, created_at, updated_at |
| applications | id, company_id, role_title, status (application_status), applied_at (date)?, first_response_at?, status_changed_at?, job_url?, work_mode?, notes?, deadline (date)?, created_at, updated_at |
| application_status_history | id, application_id, from_status (application_status)?, to_status (application_status), changed_at |
| contacts | id, company_id, full_name, contact_role?, email?, phone?, linkedin_url?, notes?, created_at, updated_at |
| contact_reminders | id, contact_id, remind_at, message?, status (reminder_status), sent_at?, created_at, updated_at |
| study_resources | id, company_id, title, url?, resource_type?, topic?, study_status, notes?, created_at, updated_at |
| interviews | id, application_id, interview_type?, format (interview_format)?, scheduled_at?, interviewer_name?, status (interview_status), questions_asked?, my_answers?, improvements?, created_at, updated_at |
| checklist_items | id, interview_id, label, is_completed, position (int), generated_by_ai, created_at, updated_at |
| alerts | id, application_id, alert_type, message, due_at?, status (alert_status), created_at, updated_at |
| notes | id, user_id, company_id?, application_id?, interview_id?, title?, content (jsonb, TipTap)?, embedding (vector 1024)?, generated_by_ai, pinned_at?, created_at, updated_at |
| note_links | id, source_note_id, target_note_id, link_status, similarity_score (float)?, reason?, created_at, updated_at |
| question_bank | id, question, question_type, topic?, difficulty (difficulty_level)?, answer_hint?, created_at, updated_at |
| study_paths | id, application_id, title?, items (jsonb)?, progress_percent (int), generated_at?, created_at, updated_at |
| interview_simulations | id, user_id, application_id?, interview_type (simulation_type)?, target_role?, transcript (jsonb)?, feedback_text?, score (int)?, started_at?, ended_at?, created_at, updated_at |
| weekly_summaries | id, user_id, week_start (date), week_end (date), summary_text?, metrics_snapshot (jsonb)?, detected_patterns (jsonb)?, suggested_next_step?, created_at, updated_at |

## Enums

| Enum | Values (creation order) |
|---|---|
| application_status | saved, applied, interview, offer, rejected, on_hold |
| alert_status | pending, done, dismissed |
| alert_type | follow_up, interview_reminder, custom |
| contact_role | recruiter, referral, interviewer, other |
| difficulty_level | easy, medium, hard |
| interview_format | video, onsite, phone |
| interview_status | scheduled, done, cancelled |
| interview_type | technical, behavioral, system_design, hr |
| link_status | suggested, accepted, rejected |
| prep_detail_level | basic, detailed |
| question_type | technical, behavioral, system_design |
| reminder_status | pending, sent, dismissed |
| resource_type | article, video, course, docs, other |
| search_type | local, remote, international |
| seniority_level | junior, mid |
| simulation_type | technical, behavioral, system_design |
| study_status | pending, in_progress, done |
| subscription_plan | free, premium |
| subscription_status | active, past_due, canceled |
| theme_mode | light, dark |
| work_mode | remote, hybrid, onsite |

## Gotchas

- **Pipeline order ≠ enum order.** Display priority: offer, interview, applied, saved, on_hold, rejected (then `status_changed_at desc`). Use the map in `src/lib/constants.ts`; never `ORDER BY status`.
- **Kanban column order** is the funnel: saved, applied, interview, offer, on_hold, rejected (last two dimmed).
- `interview_type` has `hr`, which `question_type` doesn't. For HR interviews show `behavioral` questions.
- `interview_simulations` links to an **application**, not an interview. There is no difficulty column.
- `study_resources` belong to a **company**, not an application.
- `subscription_plan` value is `premium`; the UI label is "Pro".
- When an application's status changes, update `status_changed_at`. The trigger `record_status_change` writes `application_status_history` by itself (on insert and on every real status change); users can only read it.
- Derived values, not columns: "Next step", "Best stage", app/contact counts, "Last activity", calendar events.
- Calendar has no events table. It shows `interviews.scheduled_at`, `applications.deadline`, `alerts.due_at` and (Pro) `contact_reminders.remind_at`.
- Alert snooze = update `due_at`; dismiss = `status = dismissed`.

## Migrations

| File | Content |
|---|---|
| `20261116170000_baseline.sql` | Schema as it was on 2026-11-16 (`db dump --schema public`), plus the `vector` extension and the `on_auth_user_created` trigger added by hand |
| `20261116180000_phase6_schema_changes.sql` | `notes.pinned_at`, `applications.deadline`, `profiles.timezone`, no `profiles.theme` default, `application_status_history` with its trigger and backfill |
| `20261118120000_auth_hardening.sql` | `handle_new_user()` reads the sign-up metadata; leftover table privileges revoked from `anon` and `authenticated` |

Workflow: Claude writes the file and tests it on the local stack (`npx supabase start`, Docker). Alex applies it with `npx supabase db push --dry-run --remote`, then `npx supabase db push --remote`. CLI v3 targets the **local** database unless `--remote` is passed. Types: `npx supabase gen types typescript --remote --schema public > src/types/database.ts` (the local generator drops `PostgrestVersion`).

The `rls_auto_enable` event trigger exists on the hosted project but is not in the baseline: migrations enable RLS explicitly.

Possibly later (task 10, onboarding spec): sector and years of experience in `profiles`, in a separate migration.

## Parked for Phase 8

1. Context consistency of notes (anchors pointing to unrelated entities).
2. `note_links` constraints: source ≠ target, ordered pair uniqueness.
3. Integrity of `study_paths.items` (jsonb shape).
4. `users.email` vs Supabase Auth (editable email in the mirror table).
5. Redundant `user_id` on child tables to simplify RLS.

## Decisions to make in code

- Simulator `score` scale (recommended 0–10).
- Questions per simulation session: constant `5`.
