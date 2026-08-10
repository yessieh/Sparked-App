## Section 1 — Grants

| schema | object_name           | object_type | column_name        | grantee       | privilege_type |
| ------ | --------------------- | ----------- | ------------------ | ------------- | -------------- |
| public | categories            | table       | (table-level)      | anon          | TRIGGER        |
| public | categories            | table       | (table-level)      | anon          | SELECT         |
| public | categories            | table       | (table-level)      | anon          | MAINTAIN       |
| public | categories            | table       | (table-level)      | anon          | REFERENCES     |
| public | categories            | table       | (table-level)      | anon          | TRUNCATE       |
| public | categories            | table       | (table-level)      | authenticated | TRUNCATE       |
| public | categories            | table       | (table-level)      | authenticated | SELECT         |
| public | categories            | table       | (table-level)      | authenticated | TRIGGER        |
| public | categories            | table       | (table-level)      | authenticated | REFERENCES     |
| public | categories            | table       | (table-level)      | authenticated | MAINTAIN       |
| public | curbside_quota_ledger | table       | (table-level)      | anon          | TRIGGER        |
| public | curbside_quota_ledger | table       | (table-level)      | anon          | MAINTAIN       |
| public | curbside_quota_ledger | table       | (table-level)      | anon          | TRUNCATE       |
| public | curbside_quota_ledger | table       | (table-level)      | anon          | REFERENCES     |
| public | curbside_quota_ledger | table       | (table-level)      | authenticated | SELECT         |
| public | curbside_quota_ledger | table       | (table-level)      | authenticated | TRUNCATE       |
| public | curbside_quota_ledger | table       | (table-level)      | authenticated | TRIGGER        |
| public | curbside_quota_ledger | table       | (table-level)      | authenticated | REFERENCES     |
| public | curbside_quota_ledger | table       | (table-level)      | authenticated | MAINTAIN       |
| public | event_categories      | table       | (table-level)      | anon          | REFERENCES     |
| public | event_categories      | table       | (table-level)      | anon          | TRIGGER        |
| public | event_categories      | table       | (table-level)      | anon          | TRUNCATE       |
| public | event_categories      | table       | (table-level)      | anon          | SELECT         |
| public | event_categories      | table       | (table-level)      | anon          | MAINTAIN       |
| public | event_categories      | table       | (table-level)      | authenticated | DELETE         |
| public | event_categories      | table       | (table-level)      | authenticated | SELECT         |
| public | event_categories      | table       | (table-level)      | authenticated | INSERT         |
| public | event_categories      | table       | (table-level)      | authenticated | MAINTAIN       |
| public | event_categories      | table       | (table-level)      | authenticated | TRIGGER        |
| public | event_categories      | table       | (table-level)      | authenticated | REFERENCES     |
| public | event_categories      | table       | (table-level)      | authenticated | TRUNCATE       |
| public | event_categories      | table       | (table-level)      | authenticated | UPDATE         |
| public | event_vendors         | table       | (table-level)      | anon          | TRUNCATE       |
| public | event_vendors         | table       | (table-level)      | anon          | SELECT         |
| public | event_vendors         | table       | (table-level)      | anon          | MAINTAIN       |
| public | event_vendors         | table       | (table-level)      | anon          | TRIGGER        |
| public | event_vendors         | table       | (table-level)      | anon          | REFERENCES     |
| public | event_vendors         | table       | (table-level)      | authenticated | REFERENCES     |
| public | event_vendors         | table       | (table-level)      | authenticated | TRUNCATE       |
| public | event_vendors         | table       | (table-level)      | authenticated | UPDATE         |
| public | event_vendors         | table       | (table-level)      | authenticated | SELECT         |
| public | event_vendors         | table       | (table-level)      | authenticated | INSERT         |
| public | event_vendors         | table       | (table-level)      | authenticated | DELETE         |
| public | event_vendors         | table       | (table-level)      | authenticated | MAINTAIN       |
| public | event_vendors         | table       | (table-level)      | authenticated | TRIGGER        |
| public | events                | column      | address            | anon          | SELECT         |
| public | events                | column      | address            | authenticated | SELECT         |
| public | events                | column      | address            | authenticated | UPDATE         |
| public | events                | column      | address            | authenticated | INSERT         |
| public | events                | column      | archived_at        | anon          | SELECT         |
| public | events                | column      | archived_at        | authenticated | SELECT         |
| public | events                | column      | cancelled_at       | anon          | SELECT         |
| public | events                | column      | cancelled_at       | authenticated | INSERT         |
| public | events                | column      | cancelled_at       | authenticated | UPDATE         |
| public | events                | column      | cancelled_at       | authenticated | SELECT         |
| public | events                | column      | created_at         | anon          | SELECT         |
| public | events                | column      | created_at         | authenticated | INSERT         |
| public | events                | column      | created_at         | authenticated | SELECT         |
| public | events                | column      | curbside_anonymous | anon          | SELECT         |
| public | events                | column      | curbside_anonymous | authenticated | SELECT         |
| public | events                | column      | curbside_anonymous | authenticated | UPDATE         |
| public | events                | column      | curbside_anonymous | authenticated | INSERT         |
| public | events                | column      | deleted_at         | anon          | SELECT         |
| public | events                | column      | deleted_at         | authenticated | SELECT         |
| public | events                | column      | description        | anon          | SELECT         |
| public | events                | column      | description        | authenticated | UPDATE         |
| public | events                | column      | description        | authenticated | INSERT         |
| public | events                | column      | description        | authenticated | SELECT         |
| public | events                | column      | ends_at            | anon          | SELECT         |
| public | events                | column      | ends_at            | authenticated | UPDATE         |
| public | events                | column      | ends_at            | authenticated | INSERT         |
| public | events                | column      | ends_at            | authenticated | SELECT         |
| public | events                | column      | entry_fee_cents    | anon          | SELECT         |
| public | events                | column      | entry_fee_cents    | authenticated | SELECT         |
| public | events                | column      | entry_fee_cents    | authenticated | UPDATE         |
| public | events                | column      | entry_fee_cents    | authenticated | INSERT         |
| public | events                | column      | id                 | anon          | SELECT         |
| public | events                | column      | id                 | authenticated | SELECT         |
| public | events                | column      | id                 | authenticated | INSERT         |
| public | events                | column      | location           | anon          | SELECT         |
| public | events                | column      | location           | authenticated | SELECT         |
| public | events                | column      | location           | authenticated | UPDATE         |
| public | events                | column      | location           | authenticated | INSERT         |
| public | events                | column      | rsvp_count         | anon          | SELECT         |
| public | events                | column      | rsvp_count         | authenticated | SELECT         |
| public | events                | column      | rsvp_count         | authenticated | INSERT         |
| public | events                | column      | socials            | anon          | SELECT         |
| public | events                | column      | socials            | authenticated | UPDATE         |
| public | events                | column      | socials            | authenticated | INSERT         |
| public | events                | column      | socials            | authenticated | SELECT         |
| public | events                | column      | starts_at          | anon          | SELECT         |
| public | events                | column      | starts_at          | authenticated | SELECT         |
| public | events                | column      | starts_at          | authenticated | UPDATE         |
| public | events                | column      | starts_at          | authenticated | INSERT         |
| public | events                | column      | status             | anon          | SELECT         |
| public | events                | column      | status             | authenticated | INSERT         |
| public | events                | column      | status             | authenticated | UPDATE         |
| public | events                | column      | status             | authenticated | SELECT         |
| public | events                | column      | tier_id            | anon          | SELECT         |
| public | events                | column      | tier_id            | authenticated | UPDATE         |

## Section 2 — RLS

| schema              | table_name            | rls_enabled | rls_forced | policy_count |
| ------------------- | --------------------- | ----------- | ---------- | ------------ |
| supabase_migrations | schema_migrations     | false       | false      | 0            |
| public              | categories            | true        | false      | 1            |
| public              | curbside_quota_ledger | true        | false      | 1            |
| public              | event_categories      | true        | false      | 4            |
| public              | event_vendors         | true        | false      | 4            |
| public              | events                | true        | false      | 4            |
| public              | memberships           | true        | false      | 1            |
| public              | profiles              | true        | false      | 2            |
| public              | rsvps                 | true        | false      | 3            |
| public              | saves                 | true        | false      | 3            |
| public              | tier_prices           | true        | false      | 1            |
| public              | tiers                 | true        | false      | 1            |
| public              | workspaces            | true        | false      | 4            |

## Section 3 — Matviews

No rows returned

## Section 4 — Security

| schema | function_name            | args                                                                                                | security_definer | owner    | config                              | execute_grants                                                        |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------------- | ---------------- | -------- | ----------------------------------- | --------------------------------------------------------------------- |
| app    | archive_event            | p_event_id uuid                                                                                     | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | auto_tag_curbside        |                                                                                                     | true             | postgres | search_path=public                  | PUBLIC (default - no explicit grants)                                 |
| app    | bump_rsvp_count          |                                                                                                     | true             | postgres | search_path=public                  | PUBLIC (default - no explicit grants)                                 |
| app    | check_event_category     |                                                                                                     | true             | postgres | search_path=public                  | PUBLIC (default - no explicit grants)                                 |
| app    | consume_curbside_credit  |                                                                                                     | true             | postgres | search_path=public, app             | PUBLIC (default - no explicit grants)                                 |
| app    | curbside_credits_used    | p_user_id uuid                                                                                      | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | delete_event             | p_event_id uuid                                                                                     | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | delete_workspace         | p_workspace_id uuid                                                                                 | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | enforce_curbside_span    |                                                                                                     | true             | postgres | search_path=public                  | PUBLIC (default - no explicit grants)                                 |
| app    | event_publish_fee_cents  | p_event_id uuid                                                                                     | true             | postgres | search_path=public, app             | PUBLIC:EXECUTE, postgres:EXECUTE, authenticated:EXECUTE               |
| app    | handle_new_user          |                                                                                                     | true             | postgres | search_path=public                  | PUBLIC (default - no explicit grants)                                 |
| app    | handle_new_workspace     |                                                                                                     | true             | postgres | search_path=public                  | PUBLIC (default - no explicit grants)                                 |
| app    | has_attendance           | p_event_id uuid                                                                                     | true             | postgres | search_path=public, app             | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE                 |
| app    | is_member                | ws uuid, roles text[]                                                                               | true             | postgres | search_path=public                  | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE |
| app    | organizer_profile        | p_workspace_id uuid                                                                                 | true             | postgres | search_path=public, app             | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE                 |
| app    | publish_paid_event       | p_event_id uuid, p_tz text                                                                          | true             | postgres | search_path=public, app, extensions | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | unarchive_event          | p_event_id uuid                                                                                     | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | update_workspace_profile | p_workspace_id uuid, p_name text, p_bio text, p_location_text text, p_website text, p_socials jsonb | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | workspace_event_stats    | p_workspace_id uuid                                                                                 | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | workspace_stats          | p_workspace_id uuid                                                                                 | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | duration_band            | starts_at timestamp with time zone, ends_at timestamp with time zone, tz text                       | false            | postgres | search_path=public, app             | PUBLIC (default - no explicit grants)                                 |
| app    | guard_publish_fee        |                                                                                                     | false            | postgres | search_path=public, app             | PUBLIC (default - no explicit grants)                                 |
| app    | set_updated_at           |                                                                                                     | false            | postgres | search_path=""                      | PUBLIC (default - no explicit grants)                                 |
| public | rls_auto_enable          |                                                                                                     | true             | postgres | search_path=pg_catalog              | PUBLIC (default - no explicit grants)                                 |
| public | archive_event            | event_id uuid                                                                                       | false            | postgres | (NONE - INHERITS CALLER)            | PUBLIC:EXECUTE, postgres:EXECUTE, authenticated:EXECUTE               |
| public | curbside_posts_used      |                                                                                                     | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | delete_event             | event_id uuid                                                                                       | false            | postgres | (NONE - INHERITS CALLER)            | PUBLIC:EXECUTE, postgres:EXECUTE, authenticated:EXECUTE               |
| public | delete_workspace         | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | event_detail             | event_id uuid, origin_lat double precision, origin_lng double precision                             | false            | postgres | search_path=public, extensions      | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE |
| public | event_publish_fee_cents  | event_id uuid                                                                                       | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | events_within_radius     | origin_lat double precision, origin_lng double precision, radius_miles double precision             | false            | postgres | search_path=public, extensions      | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE |
| public | organizer_profile        | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE                 |
| public | publish_paid_event       | event_id uuid, tz text                                                                              | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | unarchive_event          | event_id uuid                                                                                       | false            | postgres | (NONE - INHERITS CALLER)            | PUBLIC:EXECUTE, postgres:EXECUTE, authenticated:EXECUTE               |
| public | update_workspace_profile | workspace_id uuid, name text, bio text, location_text text, website text, socials jsonb             | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | workspace_event_stats    | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | workspace_stats          | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |

## Section 5 — Privileges

| granting_role  | schema     | object_type | grantee       | privilege_type |
| -------------- | ---------- | ----------- | ------------- | -------------- |
| postgres       | public     | functions   | postgres      | EXECUTE        |
| postgres       | public     | sequences   | postgres      | UPDATE         |
| postgres       | public     | sequences   | postgres      | USAGE          |
| postgres       | public     | sequences   | postgres      | SELECT         |
| postgres       | public     | tables      | anon          | TRUNCATE       |
| postgres       | public     | tables      | anon          | TRIGGER        |
| postgres       | public     | tables      | anon          | REFERENCES     |
| postgres       | public     | tables      | anon          | MAINTAIN       |
| postgres       | public     | tables      | authenticated | REFERENCES     |
| postgres       | public     | tables      | authenticated | TRIGGER        |
| postgres       | public     | tables      | authenticated | MAINTAIN       |
| postgres       | public     | tables      | authenticated | TRUNCATE       |
| postgres       | public     | tables      | postgres      | INSERT         |
| postgres       | public     | tables      | postgres      | MAINTAIN       |
| postgres       | public     | tables      | postgres      | UPDATE         |
| postgres       | public     | tables      | postgres      | REFERENCES     |
| postgres       | public     | tables      | postgres      | TRIGGER        |
| postgres       | public     | tables      | postgres      | DELETE         |
| postgres       | public     | tables      | postgres      | SELECT         |
| postgres       | public     | tables      | postgres      | TRUNCATE       |
| postgres       | public     | tables      | service_role  | TRIGGER        |
| postgres       | public     | tables      | service_role  | MAINTAIN       |
| postgres       | public     | tables      | service_role  | TRUNCATE       |
| postgres       | public     | tables      | service_role  | REFERENCES     |
| postgres       | storage    | functions   | anon          | EXECUTE        |
| postgres       | storage    | functions   | authenticated | EXECUTE        |
| postgres       | storage    | functions   | postgres      | EXECUTE        |
| postgres       | storage    | functions   | service_role  | EXECUTE        |
| postgres       | storage    | sequences   | anon          | USAGE          |
| postgres       | storage    | sequences   | anon          | UPDATE         |
| postgres       | storage    | sequences   | anon          | SELECT         |
| postgres       | storage    | sequences   | authenticated | USAGE          |
| postgres       | storage    | sequences   | authenticated | UPDATE         |
| postgres       | storage    | sequences   | authenticated | SELECT         |
| postgres       | storage    | sequences   | postgres      | UPDATE         |
| postgres       | storage    | sequences   | postgres      | USAGE          |
| postgres       | storage    | sequences   | postgres      | SELECT         |
| postgres       | storage    | sequences   | service_role  | SELECT         |
| postgres       | storage    | sequences   | service_role  | USAGE          |
| postgres       | storage    | sequences   | service_role  | UPDATE         |
| postgres       | storage    | tables      | anon          | REFERENCES     |
| postgres       | storage    | tables      | anon          | TRUNCATE       |
| postgres       | storage    | tables      | anon          | DELETE         |
| postgres       | storage    | tables      | anon          | SELECT         |
| postgres       | storage    | tables      | anon          | INSERT         |
| postgres       | storage    | tables      | anon          | UPDATE         |
| postgres       | storage    | tables      | anon          | TRIGGER        |
| postgres       | storage    | tables      | anon          | MAINTAIN       |
| postgres       | storage    | tables      | authenticated | TRIGGER        |
| postgres       | storage    | tables      | authenticated | MAINTAIN       |
| postgres       | storage    | tables      | authenticated | REFERENCES     |
| postgres       | storage    | tables      | authenticated | TRUNCATE       |
| postgres       | storage    | tables      | authenticated | DELETE         |
| postgres       | storage    | tables      | authenticated | UPDATE         |
| postgres       | storage    | tables      | authenticated | SELECT         |
| postgres       | storage    | tables      | authenticated | INSERT         |
| postgres       | storage    | tables      | postgres      | MAINTAIN       |
| postgres       | storage    | tables      | postgres      | TRIGGER        |
| postgres       | storage    | tables      | postgres      | REFERENCES     |
| postgres       | storage    | tables      | postgres      | TRUNCATE       |
| postgres       | storage    | tables      | postgres      | DELETE         |
| postgres       | storage    | tables      | postgres      | UPDATE         |
| postgres       | storage    | tables      | postgres      | INSERT         |
| postgres       | storage    | tables      | postgres      | SELECT         |
| postgres       | storage    | tables      | service_role  | MAINTAIN       |
| postgres       | storage    | tables      | service_role  | REFERENCES     |
| postgres       | storage    | tables      | service_role  | TRUNCATE       |
| postgres       | storage    | tables      | service_role  | DELETE         |
| postgres       | storage    | tables      | service_role  | UPDATE         |
| postgres       | storage    | tables      | service_role  | SELECT         |
| postgres       | storage    | tables      | service_role  | INSERT         |
| postgres       | storage    | tables      | service_role  | TRIGGER        |
| supabase_admin | extensions | functions   | postgres      | EXECUTE        |
| supabase_admin | extensions | sequences   | postgres      | UPDATE         |
| supabase_admin | extensions | sequences   | postgres      | SELECT         |
| supabase_admin | extensions | sequences   | postgres      | USAGE          |
| supabase_admin | extensions | tables      | postgres      | MAINTAIN       |
| supabase_admin | extensions | tables      | postgres      | INSERT         |
| supabase_admin | extensions | tables      | postgres      | SELECT         |
| supabase_admin | extensions | tables      | postgres      | REFERENCES     |
| supabase_admin | extensions | tables      | postgres      | DELETE         |
| supabase_admin | extensions | tables      | postgres      | TRUNCATE       |
| supabase_admin | extensions | tables      | postgres      | TRIGGER        |
| supabase_admin | extensions | tables      | postgres      | UPDATE         |
| supabase_admin | graphql    | functions   | anon          | EXECUTE        |
| supabase_admin | graphql    | functions   | authenticated | EXECUTE        |
| supabase_admin | graphql    | functions   | postgres      | EXECUTE        |
| supabase_admin | graphql    | functions   | service_role  | EXECUTE        |
| supabase_admin | graphql    | sequences   | anon          | UPDATE         |
| supabase_admin | graphql    | sequences   | anon          | SELECT         |
| supabase_admin | graphql    | sequences   | anon          | USAGE          |
| supabase_admin | graphql    | sequences   | authenticated | UPDATE         |
| supabase_admin | graphql    | sequences   | authenticated | USAGE          |
| supabase_admin | graphql    | sequences   | authenticated | SELECT         |
| supabase_admin | graphql    | sequences   | postgres      | UPDATE         |
| supabase_admin | graphql    | sequences   | postgres      | SELECT         |
| supabase_admin | graphql    | sequences   | postgres      | USAGE          |
| supabase_admin | graphql    | sequences   | service_role  | SELECT         |
| supabase_admin | graphql    | sequences   | service_role  | UPDATE         |
| supabase_admin | graphql    | sequences   | service_role  | USAGE          |

## Section 6 — Inheritance

| role          | member_of                         | bypasses_rls | is_superuser |
| ------------- | --------------------------------- | ------------ | ------------ |
| anon          | (none)                            | false        | false        |
| authenticated | (none)                            | false        | false        |
| authenticator | anon, authenticated, service_role | false        | false        |
| service_role  | (none)                            | true         | false        |

## Section 7 — Schema

| schema             | grantee       | privilege_type |
| ------------------ | ------------- | -------------- |
| app                | anon          | USAGE          |
| app                | authenticated | USAGE          |
| auth               | anon          | USAGE          |
| auth               | authenticated | USAGE          |
| extensions         | anon          | USAGE          |
| extensions         | authenticated | USAGE          |
| graphql            | anon          | USAGE          |
| graphql            | authenticated | USAGE          |
| graphql_public     | anon          | USAGE          |
| graphql_public     | authenticated | USAGE          |
| information_schema | PUBLIC        | USAGE          |
| pg_catalog         | PUBLIC        | USAGE          |
| public             | PUBLIC        | USAGE          |
| public             | anon          | USAGE          |
| public             | authenticated | USAGE          |
| realtime           | anon          | USAGE          |
| realtime           | authenticated | USAGE          |
| storage            | anon          | USAGE          |
| storage            | authenticated | USAGE          |

## Section 8 — Context

| schema | table_name            | policy_name                      | command | roles         | using_expr                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | with_check_expr                                                                                                                                            |
| ------ | --------------------- | -------------------------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public | categories            | categories_select_public         | SELECT  | PUBLIC        | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | null                                                                                                                                                       |
| public | curbside_quota_ledger | curbside_quota_ledger_select_own | SELECT  | authenticated | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | null                                                                                                                                                       |
| public | event_categories      | event_categories_delete_members  | DELETE  | authenticated | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_categories.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text]))))                                                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                       |
| public | event_categories      | event_categories_insert_members  | INSERT  | authenticated | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_categories.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text])))) |
| public | event_categories      | event_categories_select_public   | SELECT  | PUBLIC        | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_categories.event_id) AND (((e.deleted_at IS NULL) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text, 'viewer'::text])) OR ((e.deleted_at IS NULL) AND (e.archived_at IS NULL) AND (e.status = ANY (ARRAY['published'::text, 'cancelled'::text]))) OR ((e.status = ANY (ARRAY['published'::text, 'cancelled'::text])) AND (COALESCE(e.ends_at, (e.starts_at + '03:00:00'::interval)) < now()) AND app.has_attendance(e.id)))))) | null                                                                                                                                                       |
| public | event_categories      | event_categories_update_members  | UPDATE  | authenticated | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_categories.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text]))))                                                                                                                                                                                                                                                                                                                                                    | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_categories.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text])))) |
| public | event_vendors         | event_vendors_delete_members     | DELETE  | authenticated | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_vendors.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text]))))                                                                                                                                                                                                                                                                                                                                                       | null                                                                                                                                                       |
| public | event_vendors         | event_vendors_insert_members     | INSERT  | authenticated | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_vendors.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text]))))    |
| public | event_vendors         | event_vendors_select_public      | SELECT  | PUBLIC        | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_vendors.event_id) AND (((e.status = ANY (ARRAY['published'::text, 'cancelled'::text])) AND (e.archived_at IS NULL)) OR app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text, 'viewer'::text])))))                                                                                                                                                                                                                                     | null                                                                                                                                                       |
| public | event_vendors         | event_vendors_update_members     | UPDATE  | authenticated | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_vendors.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text]))))                                                                                                                                                                                                                                                                                                                                                       | (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_vendors.event_id) AND app.is_member(e.workspace_id, ARRAY['owner'::text, 'editor'::text]))))    |
| public | events                | events_delete_owner              | DELETE  | authenticated | app.is_member(workspace_id, ARRAY['owner'::text])                                                                                                                                                                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                       |
| public | events                | events_insert_members            | INSERT  | authenticated | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | app.is_member(workspace_id, ARRAY['owner'::text, 'editor'::text])                                                                                          |
| public | events                | events_select_public             | SELECT  | PUBLIC        | (((deleted_at IS NULL) AND app.is_member(workspace_id, ARRAY['owner'::text, 'editor'::text, 'viewer'::text])) OR ((deleted_at IS NULL) AND (archived_at IS NULL) AND (status = ANY (ARRAY['published'::text, 'cancelled'::text]))) OR ((status = ANY (ARRAY['published'::text, 'cancelled'::text])) AND (COALESCE(ends_at, (starts_at + '03:00:00'::interval)) < now()) AND app.has_attendance(id)))                                                                                                          | null                                                                                                                                                       |
| public | events                | events_update_members            | UPDATE  | authenticated | app.is_member(workspace_id, ARRAY['owner'::text, 'editor'::text])                                                                                                                                                                                                                                                                                                                                                                                                                                             | app.is_member(workspace_id, ARRAY['owner'::text, 'editor'::text])                                                                                          |
| public | memberships           | memberships_select_own           | SELECT  | PUBLIC        | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | null                                                                                                                                                       |
| public | profiles              | profiles_select_own              | SELECT  | PUBLIC        | (id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                       |
| public | profiles              | profiles_update_own              | UPDATE  | PUBLIC        | (id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | (id = auth.uid())                                                                                                                                          |
| public | rsvps                 | rsvps_delete_own                 | DELETE  | authenticated | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | null                                                                                                                                                       |
| public | rsvps                 | rsvps_insert_own                 | INSERT  | authenticated | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | (user_id = auth.uid())                                                                                                                                     |
| public | rsvps                 | rsvps_select_own                 | SELECT  | authenticated | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | null                                                                                                                                                       |
| public | saves                 | saves_delete_own                 | DELETE  | authenticated | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | null                                                                                                                                                       |
| public | saves                 | saves_insert_own                 | INSERT  | authenticated | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | (user_id = auth.uid())                                                                                                                                     |
| public | saves                 | saves_select_own                 | SELECT  | authenticated | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | null                                                                                                                                                       |
| public | tier_prices           | tier_prices_select_public        | SELECT  | PUBLIC        | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | null                                                                                                                                                       |
| public | tiers                 | tiers_select_public              | SELECT  | PUBLIC        | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | null                                                                                                                                                       |
| public | workspaces            | workspaces_delete_owner          | DELETE  | authenticated | app.is_member(id, ARRAY['owner'::text])                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | null                                                                                                                                                       |
| public | workspaces            | workspaces_insert_auth           | INSERT  | authenticated | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | (created_by = auth.uid())                                                                                                                                  |
| public | workspaces            | workspaces_select_public         | SELECT  | PUBLIC        | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | null                                                                                                                                                       |
| public | workspaces            | workspaces_update_owner          | UPDATE  | authenticated | app.is_member(id, ARRAY['owner'::text])                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | app.is_member(id, ARRAY['owner'::text])                                                                                                                    |




