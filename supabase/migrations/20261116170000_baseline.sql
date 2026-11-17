


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


-- Added by hand: a public-schema dump leaves extensions out. notes.embedding
-- needs pgvector, installed in "public" on the hosted project.
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";



CREATE TYPE "public"."alert_status" AS ENUM (
    'pending',
    'done',
    'dismissed'
);


ALTER TYPE "public"."alert_status" OWNER TO "postgres";


CREATE TYPE "public"."alert_type" AS ENUM (
    'follow_up',
    'interview_reminder',
    'custom'
);


ALTER TYPE "public"."alert_type" OWNER TO "postgres";


CREATE TYPE "public"."application_status" AS ENUM (
    'saved',
    'applied',
    'interview',
    'offer',
    'rejected',
    'on_hold'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."contact_role" AS ENUM (
    'recruiter',
    'referral',
    'interviewer',
    'other'
);


ALTER TYPE "public"."contact_role" OWNER TO "postgres";


CREATE TYPE "public"."difficulty_level" AS ENUM (
    'easy',
    'medium',
    'hard'
);


ALTER TYPE "public"."difficulty_level" OWNER TO "postgres";


CREATE TYPE "public"."interview_format" AS ENUM (
    'video',
    'onsite',
    'phone'
);


ALTER TYPE "public"."interview_format" OWNER TO "postgres";


CREATE TYPE "public"."interview_status" AS ENUM (
    'scheduled',
    'done',
    'cancelled'
);


ALTER TYPE "public"."interview_status" OWNER TO "postgres";


CREATE TYPE "public"."interview_type" AS ENUM (
    'technical',
    'behavioral',
    'system_design',
    'hr'
);


ALTER TYPE "public"."interview_type" OWNER TO "postgres";


CREATE TYPE "public"."link_status" AS ENUM (
    'suggested',
    'accepted',
    'rejected'
);


ALTER TYPE "public"."link_status" OWNER TO "postgres";


CREATE TYPE "public"."prep_detail_level" AS ENUM (
    'basic',
    'detailed'
);


ALTER TYPE "public"."prep_detail_level" OWNER TO "postgres";


CREATE TYPE "public"."question_type" AS ENUM (
    'technical',
    'behavioral',
    'system_design'
);


ALTER TYPE "public"."question_type" OWNER TO "postgres";


CREATE TYPE "public"."reminder_status" AS ENUM (
    'pending',
    'sent',
    'dismissed'
);


ALTER TYPE "public"."reminder_status" OWNER TO "postgres";


CREATE TYPE "public"."resource_type" AS ENUM (
    'article',
    'video',
    'course',
    'docs',
    'other'
);


ALTER TYPE "public"."resource_type" OWNER TO "postgres";


CREATE TYPE "public"."search_type" AS ENUM (
    'local',
    'remote',
    'international'
);


ALTER TYPE "public"."search_type" OWNER TO "postgres";


CREATE TYPE "public"."seniority_level" AS ENUM (
    'junior',
    'mid'
);


ALTER TYPE "public"."seniority_level" OWNER TO "postgres";


CREATE TYPE "public"."simulation_type" AS ENUM (
    'technical',
    'behavioral',
    'system_design'
);


ALTER TYPE "public"."simulation_type" OWNER TO "postgres";


CREATE TYPE "public"."study_status" AS ENUM (
    'pending',
    'in_progress',
    'done'
);


ALTER TYPE "public"."study_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_plan" AS ENUM (
    'free',
    'premium'
);


ALTER TYPE "public"."subscription_plan" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'active',
    'past_due',
    'canceled'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."theme_mode" AS ENUM (
    'light',
    'dark'
);


ALTER TYPE "public"."theme_mode" OWNER TO "postgres";


CREATE TYPE "public"."work_mode" AS ENUM (
    'remote',
    'hybrid',
    'onsite'
);


ALTER TYPE "public"."work_mode" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.users (id, email, auth_provider)
  values (new.id, new.email, new.raw_app_meta_data ->> 'provider');

  insert into public.profiles (user_id) values (new.id);
  insert into public.subscriptions (user_id) values (new.id);

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "alert_type" "public"."alert_type" NOT NULL,
    "message" "text" NOT NULL,
    "due_at" timestamp with time zone,
    "status" "public"."alert_status" DEFAULT 'pending'::"public"."alert_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "role_title" "text" NOT NULL,
    "status" "public"."application_status" DEFAULT 'saved'::"public"."application_status" NOT NULL,
    "applied_at" "date",
    "first_response_at" timestamp with time zone,
    "status_changed_at" timestamp with time zone,
    "job_url" "text",
    "work_mode" "public"."work_mode",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "generated_by_ai" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "website" "text",
    "industry" "text",
    "location" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "remind_at" timestamp with time zone NOT NULL,
    "message" "text",
    "status" "public"."reminder_status" DEFAULT 'pending'::"public"."reminder_status" NOT NULL,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "contact_role" "public"."contact_role",
    "email" "text",
    "phone" "text",
    "linkedin_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_simulations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "application_id" "uuid",
    "interview_type" "public"."simulation_type",
    "target_role" "text",
    "transcript" "jsonb",
    "feedback_text" "text",
    "score" integer,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_simulations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "interview_type" "public"."interview_type",
    "format" "public"."interview_format",
    "scheduled_at" timestamp with time zone,
    "interviewer_name" "text",
    "status" "public"."interview_status" DEFAULT 'scheduled'::"public"."interview_status" NOT NULL,
    "questions_asked" "text",
    "my_answers" "text",
    "improvements" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_note_id" "uuid" NOT NULL,
    "target_note_id" "uuid" NOT NULL,
    "link_status" "public"."link_status" DEFAULT 'suggested'::"public"."link_status" NOT NULL,
    "similarity_score" double precision,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."note_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "application_id" "uuid",
    "interview_id" "uuid",
    "title" "text",
    "content" "jsonb",
    "embedding" "public"."vector"(1024),
    "generated_by_ai" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text",
    "target_role" "text",
    "seniority" "public"."seniority_level",
    "search_type" "public"."search_type",
    "target_location" "text",
    "initial_active_processes" integer DEFAULT 0,
    "prep_detail_level" "public"."prep_detail_level",
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "theme" "public"."theme_mode" DEFAULT 'light'::"public"."theme_mode",
    "language" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_bank" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "public"."question_type" NOT NULL,
    "topic" "text",
    "difficulty" "public"."difficulty_level",
    "answer_hint" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."question_bank" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "title" "text",
    "items" "jsonb",
    "progress_percent" integer DEFAULT 0 NOT NULL,
    "generated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."study_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text",
    "resource_type" "public"."resource_type",
    "topic" "text",
    "study_status" "public"."study_status" DEFAULT 'pending'::"public"."study_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."study_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan" "public"."subscription_plan" DEFAULT 'free'::"public"."subscription_plan" NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'active'::"public"."subscription_status" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "auth_provider" "text",
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "week_start" "date" NOT NULL,
    "week_end" "date" NOT NULL,
    "summary_text" "text",
    "metrics_snapshot" "jsonb",
    "detected_patterns" "jsonb",
    "suggested_next_step" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."weekly_summaries" OWNER TO "postgres";


ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_reminders"
    ADD CONSTRAINT "contact_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_simulations"
    ADD CONSTRAINT "interview_simulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_links"
    ADD CONSTRAINT "note_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_links"
    ADD CONSTRAINT "note_links_source_note_id_target_note_id_key" UNIQUE ("source_note_id", "target_note_id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."question_bank"
    ADD CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_paths"
    ADD CONSTRAINT "study_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_resources"
    ADD CONSTRAINT "study_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_summaries"
    ADD CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_summaries"
    ADD CONSTRAINT "weekly_summaries_user_id_week_start_key" UNIQUE ("user_id", "week_start");



CREATE INDEX "alerts_application_id_idx" ON "public"."alerts" USING "btree" ("application_id");



CREATE INDEX "alerts_status_due_at_idx" ON "public"."alerts" USING "btree" ("status", "due_at");



CREATE INDEX "applications_company_id_idx" ON "public"."applications" USING "btree" ("company_id");



CREATE INDEX "applications_status_idx" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "checklist_items_interview_id_idx" ON "public"."checklist_items" USING "btree" ("interview_id");



CREATE INDEX "companies_user_id_idx" ON "public"."companies" USING "btree" ("user_id");



CREATE INDEX "contact_reminders_contact_id_idx" ON "public"."contact_reminders" USING "btree" ("contact_id");



CREATE INDEX "contact_reminders_status_remind_at_idx" ON "public"."contact_reminders" USING "btree" ("status", "remind_at");



CREATE INDEX "contacts_company_id_idx" ON "public"."contacts" USING "btree" ("company_id");



CREATE INDEX "interview_simulations_application_id_idx" ON "public"."interview_simulations" USING "btree" ("application_id");



CREATE INDEX "interview_simulations_user_id_idx" ON "public"."interview_simulations" USING "btree" ("user_id");



CREATE INDEX "interviews_application_id_idx" ON "public"."interviews" USING "btree" ("application_id");



CREATE INDEX "interviews_scheduled_at_idx" ON "public"."interviews" USING "btree" ("scheduled_at");



CREATE INDEX "note_links_target_note_id_idx" ON "public"."note_links" USING "btree" ("target_note_id");



CREATE INDEX "notes_application_id_idx" ON "public"."notes" USING "btree" ("application_id");



CREATE INDEX "notes_company_id_idx" ON "public"."notes" USING "btree" ("company_id");



CREATE INDEX "notes_embedding_idx" ON "public"."notes" USING "hnsw" ("embedding" "public"."vector_cosine_ops");



CREATE INDEX "notes_interview_id_idx" ON "public"."notes" USING "btree" ("interview_id");



CREATE INDEX "notes_user_id_idx" ON "public"."notes" USING "btree" ("user_id");



CREATE INDEX "study_paths_application_id_idx" ON "public"."study_paths" USING "btree" ("application_id");



CREATE INDEX "study_resources_company_id_idx" ON "public"."study_resources" USING "btree" ("company_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."alerts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."checklist_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."contact_reminders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."interview_simulations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."interviews" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."note_links" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."question_bank" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."study_paths" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."study_resources" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."weekly_summaries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_reminders"
    ADD CONSTRAINT "contact_reminders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_simulations"
    ADD CONSTRAINT "interview_simulations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_simulations"
    ADD CONSTRAINT "interview_simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_links"
    ADD CONSTRAINT "note_links_source_note_id_fkey" FOREIGN KEY ("source_note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_links"
    ADD CONSTRAINT "note_links_target_note_id_fkey" FOREIGN KEY ("target_note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_paths"
    ADD CONSTRAINT "study_paths_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_resources"
    ADD CONSTRAINT "study_resources_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_summaries"
    ADD CONSTRAINT "weekly_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "alerts_all_own" ON "public"."alerts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "alerts"."application_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "alerts"."application_id"))));



ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "applications_all_own" ON "public"."applications" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."id" = "applications"."company_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."id" = "applications"."company_id"))));



ALTER TABLE "public"."checklist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "checklist_items_all_own" ON "public"."checklist_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."interviews" "i"
  WHERE ("i"."id" = "checklist_items"."interview_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."interviews" "i"
  WHERE ("i"."id" = "checklist_items"."interview_id"))));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_all_own" ON "public"."companies" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."contact_reminders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_reminders_all_own" ON "public"."contact_reminders" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE ("c"."id" = "contact_reminders"."contact_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE ("c"."id" = "contact_reminders"."contact_id"))));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_all_own" ON "public"."contacts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."id" = "contacts"."company_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."id" = "contacts"."company_id"))));



ALTER TABLE "public"."interview_simulations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interview_simulations_all_own" ON "public"."interview_simulations" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("application_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "interview_simulations"."application_id"))))));



ALTER TABLE "public"."interviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interviews_all_own" ON "public"."interviews" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "interviews"."application_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "interviews"."application_id"))));



ALTER TABLE "public"."note_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "note_links_all_own" ON "public"."note_links" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."notes" "n"
  WHERE ("n"."id" = "note_links"."source_note_id")))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."notes" "n"
  WHERE ("n"."id" = "note_links"."source_note_id"))) AND (EXISTS ( SELECT 1
   FROM "public"."notes" "n"
  WHERE ("n"."id" = "note_links"."target_note_id")))));



ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notes_all_own" ON "public"."notes" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("company_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."id" = "notes"."company_id")))) AND (("application_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "notes"."application_id")))) AND (("interview_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."interviews" "i"
  WHERE ("i"."id" = "notes"."interview_id"))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_all_own" ON "public"."profiles" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."question_bank" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "question_bank_select_all" ON "public"."question_bank" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."study_paths" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "study_paths_all_own" ON "public"."study_paths" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "study_paths"."application_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE ("a"."id" = "study_paths"."application_id"))));



ALTER TABLE "public"."study_resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "study_resources_all_own" ON "public"."study_resources" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."id" = "study_resources"."company_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."id" = "study_resources"."company_id"))));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_own" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."weekly_summaries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "weekly_summaries_select_own" ON "public"."weekly_summaries" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_items" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."contact_reminders" TO "anon";
GRANT ALL ON TABLE "public"."contact_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_reminders" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."interview_simulations" TO "anon";
GRANT ALL ON TABLE "public"."interview_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_simulations" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."interviews" TO "anon";
GRANT ALL ON TABLE "public"."interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."interviews" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."note_links" TO "anon";
GRANT ALL ON TABLE "public"."note_links" TO "authenticated";
GRANT ALL ON TABLE "public"."note_links" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."question_bank" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."question_bank" TO "authenticated";
GRANT ALL ON TABLE "public"."question_bank" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_paths" TO "anon";
GRANT ALL ON TABLE "public"."study_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."study_paths" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_resources" TO "anon";
GRANT ALL ON TABLE "public"."study_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."study_resources" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."subscriptions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."users" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."weekly_summaries" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."weekly_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_summaries" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";







-- Added by hand: this trigger lives on auth.users, so a public-schema dump leaves it out.
-- It creates the users, profiles and subscriptions rows on every sign-up.
CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
