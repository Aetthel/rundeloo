-- Task 8: sign-up stores the user's choices, and anon loses the leftover table privileges.


-- 1. Sign-up trigger reads full_name, language and timezone from the sign-up metadata.
-- The metadata is set by the client, so every value is validated and invalid ones become null.
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_full_name text := nullif(left(btrim(meta ->> 'full_name'), 100), '');
  v_language text := meta ->> 'language';
  v_timezone text := meta ->> 'timezone';
begin
  if v_language is not null and v_language not in ('en', 'es') then
    v_language := null;
  end if;

  if v_timezone is not null
     and not exists (select 1 from pg_catalog.pg_timezone_names where name = v_timezone) then
    v_timezone := null;
  end if;

  insert into public.users (id, email, auth_provider)
  values (new.id, new.email, new.raw_app_meta_data ->> 'provider');

  insert into public.profiles (user_id, full_name, language, timezone)
  values (new.id, v_full_name, v_language, v_timezone);

  insert into public.subscriptions (user_id) values (new.id);

  return new;
end;
$$;

-- Trigger-only function: nobody should call it through the API.
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC, "anon", "authenticated";


-- 2. Supabase's default privileges gave anon and authenticated REFERENCES, TRIGGER,
-- TRUNCATE and MAINTAIN on every table. TRUNCATE ignores RLS. None of them are needed.
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "anon";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON ALL TABLES IN SCHEMA "public" FROM "authenticated";

-- And for tables created from now on.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES FROM "authenticated";
