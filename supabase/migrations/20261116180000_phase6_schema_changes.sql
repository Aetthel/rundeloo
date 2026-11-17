-- Phase 6 schema changes (task 7). See docs/database.md, "Pending migration".


-- 1. notes.pinned_at: pinned notes sort first. The 3-pin limit is enforced in the server.
ALTER TABLE "public"."notes" ADD COLUMN "pinned_at" timestamp with time zone;

CREATE INDEX "notes_pinned_idx" ON "public"."notes" USING "btree" ("user_id", "pinned_at" DESC)
  WHERE "pinned_at" IS NOT NULL;


-- 2. applications.deadline: powers the Deadlines metric and the calendar.
ALTER TABLE "public"."applications" ADD COLUMN "deadline" "date";


-- 3. profiles.timezone: IANA name (e.g. America/New_York), detected on sign-up.
-- Validated with Zod in the server; Postgres has no immutable check for zone names.
ALTER TABLE "public"."profiles" ADD COLUMN "timezone" "text";


-- 4. profiles.theme: null means "follow the device", so no default.
ALTER TABLE "public"."profiles" ALTER COLUMN "theme" DROP DEFAULT;


-- 5. application_status_history: one row per status change, written only by the trigger below.
-- Immutable by design, so no updated_at column or trigger.
CREATE TABLE "public"."application_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    -- null on the first row: the application was created with to_status.
    "from_status" "public"."application_status",
    "to_status" "public"."application_status" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id")
      REFERENCES "public"."applications"("id") ON DELETE CASCADE,
    CONSTRAINT "application_status_history_status_changed" CHECK ("from_status" IS DISTINCT FROM "to_status")
);

-- Activity card: latest events of one application.
CREATE INDEX "application_status_history_application_id_changed_at_idx"
  ON "public"."application_status_history" USING "btree" ("application_id", "changed_at" DESC);

-- Read-only for users: ownership through application → company → user_id.
ALTER TABLE "public"."application_status_history" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_status_history_select_own" ON "public"."application_status_history"
  FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."applications" "a"
     JOIN "public"."companies" "c" ON (("c"."id" = "a"."company_id")))
  WHERE (("a"."id" = "application_status_history"."application_id")
    AND ("c"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

-- Default privileges hand every new table REFERENCES, TRIGGER, TRUNCATE and MAINTAIN
-- to anon and authenticated. Reset them: users only read, anon gets nothing.
REVOKE ALL ON TABLE "public"."application_status_history" FROM "anon", "authenticated";
GRANT SELECT ON TABLE "public"."application_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."application_status_history" TO "service_role";

-- Backfill: one row per existing application with its current status, so the
-- Activity card isn't empty for data created before this migration.
INSERT INTO "public"."application_status_history" ("application_id", "from_status", "to_status", "changed_at")
SELECT "id", NULL, "status", COALESCE("status_changed_at", "created_at")
FROM "public"."applications";

-- Records every status change, whatever code path makes it. SECURITY DEFINER so it
-- can insert although users have no INSERT grant; search_path pinned for safety.
CREATE OR REPLACE FUNCTION "public"."record_application_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_status_history (application_id, from_status, to_status)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status);
  end if;

  return new;
end;
$$;

ALTER FUNCTION "public"."record_application_status_change"() OWNER TO "postgres";

-- Trigger-only function: nobody should call it directly.
REVOKE ALL ON FUNCTION "public"."record_application_status_change"() FROM PUBLIC, "anon", "authenticated";

CREATE TRIGGER "record_status_change" AFTER INSERT OR UPDATE OF "status" ON "public"."applications"
  FOR EACH ROW EXECUTE FUNCTION "public"."record_application_status_change"();
