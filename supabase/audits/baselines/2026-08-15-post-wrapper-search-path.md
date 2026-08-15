# Post-arc privilege baseline — 2026-08-15, after the wrapper search_path arc (0027)

Output of `supabase/audits/privilege_audit.sql` sections 1-8, run in the
Supabase Dashboard SQL Editor against the Sparked-App project after
`20260815000027_wrapper_search_path_pins.sql` was applied. Section 9 is
behavioral and not runnable there — it was run by hand and is recorded at the
end of this header.

**This closes the privilege hardening arc: 0025 → 0026 → 0027, all three
applied, audited and green.**

## THE PRE-ARC SOURCE FOR THIS DIFF

**`supabase/audits/baselines/2026-08-13-post-default-privileges.md`** — the
post-arc baseline of the preceding arc (0026), committed at `a23d920`.

It is the correct pre-arc source rather than a substitute, for the same reason
0026 used 0025's post-baseline: no migration was applied between the two
exports. That file records the database immediately after 0026,
`20260815000027` was the very next thing to touch it, and this file records the
result. One arc's post-baseline IS the next arc's pre-baseline whenever nothing
runs in between.

**No `2026-08-15-pre-wrapper-search-path.md` was written, and none should be.**
Writing one now would capture the POST-0027 state and produce an empty delta —
a clean-looking run that checked nothing. That is the failure mode this gate
exists to prevent, and it is documented at length in the two preceding
baselines. The dated file above is the real pre-0027 record.

## HOW SECTIONS 1 AND 5 WERE EXPORTED

The SQL Editor caps a result at 100 rows in every export format and gives no
indication that it has done so. Sections 1 and 5 both still exceed that and
were paged and concatenated into one continuous block each:

| Section        | Rows | Pages implied by the count |
| -------------- | ---- | -------------------------- |
| 1 — Grants     | 115  | 2 (100 + 15)               |
| 5 — Privileges | 268  | 3 (100 + 100 + 68)         |

**Both totals are unchanged from the pre-arc file**, which is the completeness
check for this arc specifically: 0027 replaces three function definitions and
touches no grant, so the predicted totals were 115 and 268 — the same numbers
0026 arrived at. A truncated section 1 would have landed on 100 and a truncated
section 5 on 100 or 200; neither did.

**A note for whoever diffs the next one.** The whitespace hazard the 0026
header documents did NOT materialise between that file and this one — these two
exports are byte-identical outside the three changed rows, so a naive `diff`
happens to work here. Do not read that as the hazard being gone. It is a
property of these two exports having identical column widths, not a property of
the process; normalise (split on `|`, trim every field) before comparing
anyway.

## ARC RESULT — THREE CELLS CHANGED, NOTHING ADDED, NOTHING REMOVED

Diffed against the pre-arc source above, both whitespace-normalised and raw.
**Zero rows added, zero rows removed, in any section.** The entire delta is
three `config` cells:

| Section         | Pre | Post | Delta |
| --------------- | --- | ---- | ----- |
| 1 — Grants      | 115 | 115  | 0 — byte-identical |
| 2 — RLS         | 13  | 13   | 0 — byte-identical |
| 3 — Matviews    | 0   | 0    | 0 |
| 4 — Security    | 37  | 37   | **3 rows changed, `config` cell only** |
| 5 — Privileges  | 268 | 268  | 0 — byte-identical |
| 6 — Inheritance | 4   | 4    | 0 — byte-identical |
| 7 — Schema      | 19  | 19   | 0 — byte-identical |
| 8 — Context     | 29  | 29   | 0 — byte-identical |

The three rows, before and after:

```
- public | archive_event   | event_id uuid | false | postgres | (NONE - INHERITS CALLER) | postgres:EXECUTE, authenticated:EXECUTE
+ public | archive_event   | event_id uuid | false | postgres | search_path=public, app  | postgres:EXECUTE, authenticated:EXECUTE
- public | delete_event    | event_id uuid | false | postgres | (NONE - INHERITS CALLER) | postgres:EXECUTE, authenticated:EXECUTE
+ public | delete_event    | event_id uuid | false | postgres | search_path=public, app  | postgres:EXECUTE, authenticated:EXECUTE
- public | unarchive_event | event_id uuid | false | postgres | (NONE - INHERITS CALLER) | postgres:EXECUTE, authenticated:EXECUTE
+ public | unarchive_event | event_id uuid | false | postgres | search_path=public, app  | postgres:EXECUTE, authenticated:EXECUTE
```

**`(NONE - INHERITS CALLER)` no longer appears anywhere in section 4.** These
three were the last unpinned functions in the database, unfixed since 0019
shipped them on 2026-07-30. Every function in `app` and `public` now pins
`search_path`, so the audit's own finding condition for this shape
(`security_definer=false AND config='(NONE)' -> convention break`) returns
nothing — which is what makes a future exception visible on sight.

## THE ACL QUESTION — ASKED IN THE MIGRATION HEADER, ANSWERED HERE: PRESERVED

0027's header left this open deliberately and refused to guard against it:
`create or replace function` is documented to preserve an existing ACL, but if
it had not, 0025's revoke of PUBLIC EXECUTE on these same three wrappers would
have silently undone itself and section 4 would show `PUBLIC:EXECUTE` back on
all three. No defensive revokes were written into 0027, precisely so this diff
could answer the question instead of hiding it.

**It answered: preserved.** The `execute_grants` column reads
`postgres:EXECUTE, authenticated:EXECUTE` on all three rows, before and after,
unchanged. Confirmed independently in the catalog on 2026-08-15 — `proacl` is
`{postgres=X/postgres,authenticated=X/postgres}` on each, with **no bare
`=X/postgres` entry**, which is the form a PUBLIC grant takes.

Recorded because the negative result is the useful one: a replacement of a
function whose privileges were hardened in an earlier migration does not
re-open them, and the next arc that replaces a hardened function can rely on
that rather than re-deriving it.

## BEHAVIORAL VERIFICATION (SECTION 9) — RUN 2026-08-15, PASSED

**0027 does not get the exemption 0025 and 0026 took.** Those two were revokes
only — they removed privileges and asserted no new behavior, so the post-arc
diff plus a section 9 sweep were their whole verification. 0027 REPLACES three
function definitions, and a replacement can fail in ways a revoke cannot: a
drifted body, a changed signature, an argument name PostgREST routes on.

Run by hand, signed in as the workspace owner, through the app: **archive →
the event left the storefront → unarchive → it returned → delete → gone.** All
three wrappers work. No behavior change.

**The direct numeric verification is the advisor count, and it moved as
predicted: 0 errors / 3 warnings, down from 6.** The three
`function_search_path_mutable` warnings on these wrappers are gone. The three
that remain are the long-accepted ones — two `rls_auto_enable` platform entries
and leaked-password protection, Pro-gated on the Free plan and deferred to the
launch-prep upgrade (SCHEMA_PLAN §10.7, DECIDED 2026-07-09).

**The advisor baseline is now honest for the first time since 0019.**
SPARKED_STATE recorded 0/3 from 2026-07-09 and every later entry carried that
number forward without rechecking it; the true figure was 0/6 from the day 0019
shipped these three wrappers unpinned. The correction landed in the 0025 arc,
and this arc is what makes the corrected number true rather than merely
accurate.

## Section 1 — Grants

| schema | object_name           | object_type | column_name        | grantee       | privilege_type |
| ------ | --------------------- | ----------- | ------------------ | ------------- | -------------- |
| public | categories            | table       | (table-level)      | anon          | SELECT         |
| public | categories            | table       | (table-level)      | authenticated | SELECT         |
| public | curbside_quota_ledger | table       | (table-level)      | authenticated | SELECT         |
| public | event_categories      | table       | (table-level)      | anon          | SELECT         |
| public | event_categories      | table       | (table-level)      | authenticated | DELETE         |
| public | event_categories      | table       | (table-level)      | authenticated | INSERT         |
| public | event_categories      | table       | (table-level)      | authenticated | SELECT         |
| public | event_categories      | table       | (table-level)      | authenticated | UPDATE         |
| public | event_vendors         | table       | (table-level)      | anon          | SELECT         |
| public | event_vendors         | table       | (table-level)      | authenticated | DELETE         |
| public | event_vendors         | table       | (table-level)      | authenticated | INSERT         |
| public | event_vendors         | table       | (table-level)      | authenticated | SELECT         |
| public | event_vendors         | table       | (table-level)      | authenticated | UPDATE         |
| public | events                | column      | address            | anon          | SELECT         |
| public | events                | column      | address            | authenticated | INSERT         |
| public | events                | column      | address            | authenticated | SELECT         |
| public | events                | column      | address            | authenticated | UPDATE         |
| public | events                | column      | archived_at        | anon          | SELECT         |
| public | events                | column      | archived_at        | authenticated | SELECT         |
| public | events                | column      | cancelled_at       | anon          | SELECT         |
| public | events                | column      | cancelled_at       | authenticated | INSERT         |
| public | events                | column      | cancelled_at       | authenticated | SELECT         |
| public | events                | column      | cancelled_at       | authenticated | UPDATE         |
| public | events                | column      | created_at         | anon          | SELECT         |
| public | events                | column      | created_at         | authenticated | INSERT         |
| public | events                | column      | created_at         | authenticated | SELECT         |
| public | events                | column      | curbside_anonymous | anon          | SELECT         |
| public | events                | column      | curbside_anonymous | authenticated | INSERT         |
| public | events                | column      | curbside_anonymous | authenticated | SELECT         |
| public | events                | column      | curbside_anonymous | authenticated | UPDATE         |
| public | events                | column      | deleted_at         | anon          | SELECT         |
| public | events                | column      | deleted_at         | authenticated | SELECT         |
| public | events                | column      | description        | anon          | SELECT         |
| public | events                | column      | description        | authenticated | INSERT         |
| public | events                | column      | description        | authenticated | SELECT         |
| public | events                | column      | description        | authenticated | UPDATE         |
| public | events                | column      | ends_at            | anon          | SELECT         |
| public | events                | column      | ends_at            | authenticated | INSERT         |
| public | events                | column      | ends_at            | authenticated | SELECT         |
| public | events                | column      | ends_at            | authenticated | UPDATE         |
| public | events                | column      | entry_fee_cents    | anon          | SELECT         |
| public | events                | column      | entry_fee_cents    | authenticated | INSERT         |
| public | events                | column      | entry_fee_cents    | authenticated | SELECT         |
| public | events                | column      | entry_fee_cents    | authenticated | UPDATE         |
| public | events                | column      | id                 | anon          | SELECT         |
| public | events                | column      | id                 | authenticated | INSERT         |
| public | events                | column      | id                 | authenticated | SELECT         |
| public | events                | column      | location           | anon          | SELECT         |
| public | events                | column      | location           | authenticated | INSERT         |
| public | events                | column      | location           | authenticated | SELECT         |
| public | events                | column      | location           | authenticated | UPDATE         |
| public | events                | column      | rsvp_count         | anon          | SELECT         |
| public | events                | column      | rsvp_count         | authenticated | SELECT         |
| public | events                | column      | socials            | anon          | SELECT         |
| public | events                | column      | socials            | authenticated | INSERT         |
| public | events                | column      | socials            | authenticated | SELECT         |
| public | events                | column      | socials            | authenticated | UPDATE         |
| public | events                | column      | starts_at          | anon          | SELECT         |
| public | events                | column      | starts_at          | authenticated | INSERT         |
| public | events                | column      | starts_at          | authenticated | SELECT         |
| public | events                | column      | starts_at          | authenticated | UPDATE         |
| public | events                | column      | status             | anon          | SELECT         |
| public | events                | column      | status             | authenticated | INSERT         |
| public | events                | column      | status             | authenticated | SELECT         |
| public | events                | column      | status             | authenticated | UPDATE         |
| public | events                | column      | tier_id            | anon          | SELECT         |
| public | events                | column      | tier_id            | authenticated | INSERT         |
| public | events                | column      | tier_id            | authenticated | SELECT         |
| public | events                | column      | tier_id            | authenticated | UPDATE         |
| public | events                | column      | title              | anon          | SELECT         |
| public | events                | column      | title              | authenticated | INSERT         |
| public | events                | column      | title              | authenticated | SELECT         |
| public | events                | column      | title              | authenticated | UPDATE         |
| public | events                | column      | updated_at         | anon          | SELECT         |
| public | events                | column      | updated_at         | authenticated | SELECT         |
| public | events                | column      | venue_name         | anon          | SELECT         |
| public | events                | column      | venue_name         | authenticated | INSERT         |
| public | events                | column      | venue_name         | authenticated | SELECT         |
| public | events                | column      | venue_name         | authenticated | UPDATE         |
| public | events                | column      | workspace_id       | anon          | SELECT         |
| public | events                | column      | workspace_id       | authenticated | INSERT         |
| public | events                | column      | workspace_id       | authenticated | SELECT         |
| public | events                | table       | (table-level)      | authenticated | DELETE         |
| public | memberships           | table       | (table-level)      | authenticated | SELECT         |
| public | profiles              | table       | (table-level)      | authenticated | SELECT         |
| public | rsvps                 | table       | (table-level)      | authenticated | DELETE         |
| public | rsvps                 | table       | (table-level)      | authenticated | INSERT         |
| public | rsvps                 | table       | (table-level)      | authenticated | SELECT         |
| public | saves                 | table       | (table-level)      | authenticated | DELETE         |
| public | saves                 | table       | (table-level)      | authenticated | INSERT         |
| public | saves                 | table       | (table-level)      | authenticated | SELECT         |
| public | tier_prices           | table       | (table-level)      | anon          | SELECT         |
| public | tier_prices           | table       | (table-level)      | authenticated | SELECT         |
| public | tiers                 | table       | (table-level)      | anon          | SELECT         |
| public | tiers                 | table       | (table-level)      | authenticated | SELECT         |
| public | workspaces            | column      | bio                | anon          | SELECT         |
| public | workspaces            | column      | bio                | authenticated | SELECT         |
| public | workspaces            | column      | created_at         | anon          | SELECT         |
| public | workspaces            | column      | created_at         | authenticated | SELECT         |
| public | workspaces            | column      | id                 | anon          | SELECT         |
| public | workspaces  | column      | id            | authenticated | SELECT         |
| public | workspaces  | column      | location_text | anon          | SELECT         |
| public | workspaces  | column      | location_text | authenticated | SELECT         |
| public | workspaces  | column      | logo_path     | anon          | SELECT         |
| public | workspaces  | column      | logo_path     | authenticated | SELECT         |
| public | workspaces  | column      | name          | anon          | SELECT         |
| public | workspaces  | column      | name          | authenticated | SELECT         |
| public | workspaces  | column      | socials       | anon          | SELECT         |
| public | workspaces  | column      | socials       | authenticated | SELECT         |
| public | workspaces  | column      | updated_at    | anon          | SELECT         |
| public | workspaces  | column      | updated_at    | authenticated | SELECT         |
| public | workspaces  | column      | website       | anon          | SELECT         |
| public | workspaces  | column      | website       | authenticated | SELECT         |
| public | workspaces  | table       | (table-level) | authenticated | DELETE         |
| public | workspaces  | table       | (table-level) | authenticated | INSERT         |

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

Success. No rows returned

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
| app    | event_publish_fee_cents  | p_event_id uuid                                                                                     | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
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
| app    | duration_band            | starts_at timestamp with time zone, ends_at timestamp with time zone, tz text                       | false            | postgres | search_path=public, app             | postgres:EXECUTE                                                      |
| app    | guard_publish_fee        |                                                                                                     | false            | postgres | search_path=public, app             | PUBLIC (default - no explicit grants)                                 |
| app    | set_updated_at           |                                                                                                     | false            | postgres | search_path=""                      | PUBLIC (default - no explicit grants)                                 |
| public | rls_auto_enable          |                                                                                                     | true             | postgres | search_path=pg_catalog              | PUBLIC (default - no explicit grants)                                 |
| public | archive_event            | event_id uuid                                                                                       | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | curbside_posts_used      |                                                                                                     | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | delete_event             | event_id uuid                                                                                       | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | delete_workspace         | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | event_detail             | event_id uuid, origin_lat double precision, origin_lng double precision                             | false            | postgres | search_path=public, extensions      | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE |
| public | event_publish_fee_cents  | event_id uuid                                                                                       | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | events_within_radius     | origin_lat double precision, origin_lng double precision, radius_miles double precision             | false            | postgres | search_path=public, extensions      | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE |
| public | organizer_profile        | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE                 |
| public | publish_paid_event       | event_id uuid, tz text                                                                              | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | unarchive_event          | event_id uuid                                                                                       | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | update_workspace_profile | workspace_id uuid, name text, bio text, location_text text, website text, socials jsonb             | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | workspace_event_stats    | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | workspace_stats          | workspace_id uuid                                                                                   | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |

## Section 5 — Privileges

| granting_role  | schema     | object_type | grantee       | privilege_type |
| -------------- | ---------- | ----------- | ------------- | -------------- |
| postgres       | public     | functions   | postgres      | EXECUTE        |
| postgres       | public     | sequences   | postgres      | SELECT         |
| postgres       | public     | sequences   | postgres      | UPDATE         |
| postgres       | public     | sequences   | postgres      | USAGE          |
| postgres       | public     | tables      | postgres      | DELETE         |
| postgres       | public     | tables      | postgres      | INSERT         |
| postgres       | public     | tables      | postgres      | MAINTAIN       |
| postgres       | public     | tables      | postgres      | REFERENCES     |
| postgres       | public     | tables      | postgres      | SELECT         |
| postgres       | public     | tables      | postgres      | TRIGGER        |
| postgres       | public     | tables      | postgres      | TRUNCATE       |
| postgres       | public     | tables      | postgres      | UPDATE         |
| postgres       | public     | tables      | service_role  | MAINTAIN       |
| postgres       | public     | tables      | service_role  | REFERENCES     |
| postgres       | public     | tables      | service_role  | TRIGGER        |
| postgres       | public     | tables      | service_role  | TRUNCATE       |
| postgres       | storage    | functions   | anon          | EXECUTE        |
| postgres       | storage    | functions   | authenticated | EXECUTE        |
| postgres       | storage    | functions   | postgres      | EXECUTE        |
| postgres       | storage    | functions   | service_role  | EXECUTE        |
| postgres       | storage    | sequences   | anon          | SELECT         |
| postgres       | storage    | sequences   | anon          | UPDATE         |
| postgres       | storage    | sequences   | anon          | USAGE          |
| postgres       | storage    | sequences   | authenticated | SELECT         |
| postgres       | storage    | sequences   | authenticated | UPDATE         |
| postgres       | storage    | sequences   | authenticated | USAGE          |
| postgres       | storage    | sequences   | postgres      | SELECT         |
| postgres       | storage    | sequences   | postgres      | UPDATE         |
| postgres       | storage    | sequences   | postgres      | USAGE          |
| postgres       | storage    | sequences   | service_role  | SELECT         |
| postgres       | storage    | sequences   | service_role  | UPDATE         |
| postgres       | storage    | sequences   | service_role  | USAGE          |
| postgres       | storage    | tables      | anon          | DELETE         |
| postgres       | storage    | tables      | anon          | INSERT         |
| postgres       | storage    | tables      | anon          | MAINTAIN       |
| postgres       | storage    | tables      | anon          | REFERENCES     |
| postgres       | storage    | tables      | anon          | SELECT         |
| postgres       | storage    | tables      | anon          | TRIGGER        |
| postgres       | storage    | tables      | anon          | TRUNCATE       |
| postgres       | storage    | tables      | anon          | UPDATE         |
| postgres       | storage    | tables      | authenticated | DELETE         |
| postgres       | storage    | tables      | authenticated | INSERT         |
| postgres       | storage    | tables      | authenticated | MAINTAIN       |
| postgres       | storage    | tables      | authenticated | REFERENCES     |
| postgres       | storage    | tables      | authenticated | SELECT         |
| postgres       | storage    | tables      | authenticated | TRIGGER        |
| postgres       | storage    | tables      | authenticated | TRUNCATE       |
| postgres       | storage    | tables      | authenticated | UPDATE         |
| postgres       | storage    | tables      | postgres      | DELETE         |
| postgres       | storage    | tables      | postgres      | INSERT         |
| postgres       | storage    | tables      | postgres      | MAINTAIN       |
| postgres       | storage    | tables      | postgres      | REFERENCES     |
| postgres       | storage    | tables      | postgres      | SELECT         |
| postgres       | storage    | tables      | postgres      | TRIGGER        |
| postgres       | storage    | tables      | postgres      | TRUNCATE       |
| postgres       | storage    | tables      | postgres      | UPDATE         |
| postgres       | storage    | tables      | service_role  | DELETE         |
| postgres       | storage    | tables      | service_role  | INSERT         |
| postgres       | storage    | tables      | service_role  | MAINTAIN       |
| postgres       | storage    | tables      | service_role  | REFERENCES     |
| postgres       | storage    | tables      | service_role  | SELECT         |
| postgres       | storage    | tables      | service_role  | TRIGGER        |
| postgres       | storage    | tables      | service_role  | TRUNCATE       |
| postgres       | storage    | tables      | service_role  | UPDATE         |
| supabase_admin | extensions | functions   | postgres      | EXECUTE        |
| supabase_admin | extensions | sequences   | postgres      | SELECT         |
| supabase_admin | extensions | sequences   | postgres      | UPDATE         |
| supabase_admin | extensions | sequences   | postgres      | USAGE          |
| supabase_admin | extensions | tables      | postgres      | DELETE         |
| supabase_admin | extensions | tables      | postgres      | INSERT         |
| supabase_admin | extensions | tables      | postgres      | MAINTAIN       |
| supabase_admin | extensions | tables      | postgres      | REFERENCES     |
| supabase_admin | extensions | tables      | postgres      | SELECT         |
| supabase_admin | extensions | tables      | postgres      | TRIGGER        |
| supabase_admin | extensions | tables      | postgres      | TRUNCATE       |
| supabase_admin | extensions | tables      | postgres      | UPDATE         |
| supabase_admin | graphql    | functions   | anon          | EXECUTE        |
| supabase_admin | graphql    | functions   | authenticated | EXECUTE        |
| supabase_admin | graphql    | functions   | postgres      | EXECUTE        |
| supabase_admin | graphql    | functions   | service_role  | EXECUTE        |
| supabase_admin | graphql    | sequences   | anon          | SELECT         |
| supabase_admin | graphql    | sequences   | anon          | UPDATE         |
| supabase_admin | graphql    | sequences   | anon          | USAGE          |
| supabase_admin | graphql    | sequences   | authenticated | SELECT         |
| supabase_admin | graphql    | sequences   | authenticated | UPDATE         |
| supabase_admin | graphql    | sequences   | authenticated | USAGE          |
| supabase_admin | graphql    | sequences   | postgres      | SELECT         |
| supabase_admin | graphql    | sequences   | postgres      | UPDATE         |
| supabase_admin | graphql    | sequences   | postgres      | USAGE          |
| supabase_admin | graphql    | sequences   | service_role  | SELECT         |
| supabase_admin | graphql    | sequences   | service_role  | UPDATE         |
| supabase_admin | graphql    | sequences   | service_role  | USAGE          |
| supabase_admin | graphql    | tables      | anon          | DELETE         |
| supabase_admin | graphql    | tables      | anon          | INSERT         |
| supabase_admin | graphql    | tables      | anon          | MAINTAIN       |
| supabase_admin | graphql    | tables      | anon          | REFERENCES     |
| supabase_admin | graphql    | tables      | anon          | SELECT         |
| supabase_admin | graphql    | tables      | anon          | TRIGGER        |
| supabase_admin | graphql    | tables      | anon          | TRUNCATE       |
| supabase_admin | graphql    | tables      | anon          | UPDATE         |
| supabase_admin | graphql        | tables      | authenticated | DELETE         |
| supabase_admin | graphql        | tables      | authenticated | INSERT         |
| supabase_admin | graphql        | tables      | authenticated | MAINTAIN       |
| supabase_admin | graphql        | tables      | authenticated | REFERENCES     |
| supabase_admin | graphql        | tables      | authenticated | SELECT         |
| supabase_admin | graphql        | tables      | authenticated | TRIGGER        |
| supabase_admin | graphql        | tables      | authenticated | TRUNCATE       |
| supabase_admin | graphql        | tables      | authenticated | UPDATE         |
| supabase_admin | graphql        | tables      | postgres      | DELETE         |
| supabase_admin | graphql        | tables      | postgres      | INSERT         |
| supabase_admin | graphql        | tables      | postgres      | MAINTAIN       |
| supabase_admin | graphql        | tables      | postgres      | REFERENCES     |
| supabase_admin | graphql        | tables      | postgres      | SELECT         |
| supabase_admin | graphql        | tables      | postgres      | TRIGGER        |
| supabase_admin | graphql        | tables      | postgres      | TRUNCATE       |
| supabase_admin | graphql        | tables      | postgres      | UPDATE         |
| supabase_admin | graphql        | tables      | service_role  | DELETE         |
| supabase_admin | graphql        | tables      | service_role  | INSERT         |
| supabase_admin | graphql        | tables      | service_role  | MAINTAIN       |
| supabase_admin | graphql        | tables      | service_role  | REFERENCES     |
| supabase_admin | graphql        | tables      | service_role  | SELECT         |
| supabase_admin | graphql        | tables      | service_role  | TRIGGER        |
| supabase_admin | graphql        | tables      | service_role  | TRUNCATE       |
| supabase_admin | graphql        | tables      | service_role  | UPDATE         |
| supabase_admin | graphql_public | functions   | anon          | EXECUTE        |
| supabase_admin | graphql_public | functions   | authenticated | EXECUTE        |
| supabase_admin | graphql_public | functions   | postgres      | EXECUTE        |
| supabase_admin | graphql_public | functions   | service_role  | EXECUTE        |
| supabase_admin | graphql_public | sequences   | anon          | SELECT         |
| supabase_admin | graphql_public | sequences   | anon          | UPDATE         |
| supabase_admin | graphql_public | sequences   | anon          | USAGE          |
| supabase_admin | graphql_public | sequences   | authenticated | SELECT         |
| supabase_admin | graphql_public | sequences   | authenticated | UPDATE         |
| supabase_admin | graphql_public | sequences   | authenticated | USAGE          |
| supabase_admin | graphql_public | sequences   | postgres      | SELECT         |
| supabase_admin | graphql_public | sequences   | postgres      | UPDATE         |
| supabase_admin | graphql_public | sequences   | postgres      | USAGE          |
| supabase_admin | graphql_public | sequences   | service_role  | SELECT         |
| supabase_admin | graphql_public | sequences   | service_role  | UPDATE         |
| supabase_admin | graphql_public | sequences   | service_role  | USAGE          |
| supabase_admin | graphql_public | tables      | anon          | DELETE         |
| supabase_admin | graphql_public | tables      | anon          | INSERT         |
| supabase_admin | graphql_public | tables      | anon          | MAINTAIN       |
| supabase_admin | graphql_public | tables      | anon          | REFERENCES     |
| supabase_admin | graphql_public | tables      | anon          | SELECT         |
| supabase_admin | graphql_public | tables      | anon          | TRIGGER        |
| supabase_admin | graphql_public | tables      | anon          | TRUNCATE       |
| supabase_admin | graphql_public | tables      | anon          | UPDATE         |
| supabase_admin | graphql_public | tables      | authenticated | DELETE         |
| supabase_admin | graphql_public | tables      | authenticated | INSERT         |
| supabase_admin | graphql_public | tables      | authenticated | MAINTAIN       |
| supabase_admin | graphql_public | tables      | authenticated | REFERENCES     |
| supabase_admin | graphql_public | tables      | authenticated | SELECT         |
| supabase_admin | graphql_public | tables      | authenticated | TRIGGER        |
| supabase_admin | graphql_public | tables      | authenticated | TRUNCATE       |
| supabase_admin | graphql_public | tables      | authenticated | UPDATE         |
| supabase_admin | graphql_public | tables      | postgres      | DELETE         |
| supabase_admin | graphql_public | tables      | postgres      | INSERT         |
| supabase_admin | graphql_public | tables      | postgres      | MAINTAIN       |
| supabase_admin | graphql_public | tables      | postgres      | REFERENCES     |
| supabase_admin | graphql_public | tables      | postgres      | SELECT         |
| supabase_admin | graphql_public | tables      | postgres      | TRIGGER        |
| supabase_admin | graphql_public | tables      | postgres      | TRUNCATE       |
| supabase_admin | graphql_public | tables      | postgres      | UPDATE         |
| supabase_admin | graphql_public | tables      | service_role  | DELETE         |
| supabase_admin | graphql_public | tables      | service_role  | INSERT         |
| supabase_admin | graphql_public | tables      | service_role  | MAINTAIN       |
| supabase_admin | graphql_public | tables      | service_role  | REFERENCES     |
| supabase_admin | graphql_public | tables      | service_role  | SELECT         |
| supabase_admin | graphql_public | tables      | service_role  | TRIGGER        |
| supabase_admin | graphql_public | tables      | service_role  | TRUNCATE       |
| supabase_admin | graphql_public | tables      | service_role  | UPDATE         |
| supabase_admin | public         | functions   | anon          | EXECUTE        |
| supabase_admin | public         | functions   | authenticated | EXECUTE        |
| supabase_admin | public         | functions   | postgres      | EXECUTE        |
| supabase_admin | public         | functions   | service_role  | EXECUTE        |
| supabase_admin | public         | sequences   | anon          | SELECT         |
| supabase_admin | public         | sequences   | anon          | UPDATE         |
| supabase_admin | public         | sequences   | anon          | USAGE          |
| supabase_admin | public         | sequences   | authenticated | SELECT         |
| supabase_admin | public         | sequences   | authenticated | UPDATE         |
| supabase_admin | public         | sequences   | authenticated | USAGE          |
| supabase_admin | public         | sequences   | postgres      | SELECT         |
| supabase_admin | public         | sequences   | postgres      | UPDATE         |
| supabase_admin | public         | sequences   | postgres      | USAGE          |
| supabase_admin | public         | sequences   | service_role  | SELECT         |
| supabase_admin | public         | sequences   | service_role  | UPDATE         |
| supabase_admin | public         | sequences   | service_role  | USAGE          |
| supabase_admin | public         | tables      | anon          | DELETE         |
| supabase_admin | public         | tables      | anon          | INSERT         |
| supabase_admin | public         | tables      | anon          | MAINTAIN       |
| supabase_admin | public         | tables      | anon          | REFERENCES     |
| supabase_admin | public         | tables      | anon          | SELECT         |
| supabase_admin | public         | tables      | anon          | TRIGGER        |
| supabase_admin | public         | tables      | anon          | TRUNCATE       |
| supabase_admin | public         | tables      | anon          | UPDATE         |
| supabase_admin | public         | tables      | authenticated | DELETE         |
| supabase_admin | public         | tables      | authenticated | INSERT         |
| supabase_admin | public         | tables      | authenticated | MAINTAIN       |
| supabase_admin | public         | tables      | authenticated | REFERENCES     |
| supabase_admin      | public   | tables      | authenticated  | SELECT         |
| supabase_admin      | public   | tables      | authenticated  | TRIGGER        |
| supabase_admin      | public   | tables      | authenticated  | TRUNCATE       |
| supabase_admin      | public   | tables      | authenticated  | UPDATE         |
| supabase_admin      | public   | tables      | postgres       | DELETE         |
| supabase_admin      | public   | tables      | postgres       | INSERT         |
| supabase_admin      | public   | tables      | postgres       | MAINTAIN       |
| supabase_admin      | public   | tables      | postgres       | REFERENCES     |
| supabase_admin      | public   | tables      | postgres       | SELECT         |
| supabase_admin      | public   | tables      | postgres       | TRIGGER        |
| supabase_admin      | public   | tables      | postgres       | TRUNCATE       |
| supabase_admin      | public   | tables      | postgres       | UPDATE         |
| supabase_admin      | public   | tables      | service_role   | DELETE         |
| supabase_admin      | public   | tables      | service_role   | INSERT         |
| supabase_admin      | public   | tables      | service_role   | MAINTAIN       |
| supabase_admin      | public   | tables      | service_role   | REFERENCES     |
| supabase_admin      | public   | tables      | service_role   | SELECT         |
| supabase_admin      | public   | tables      | service_role   | TRIGGER        |
| supabase_admin      | public   | tables      | service_role   | TRUNCATE       |
| supabase_admin      | public   | tables      | service_role   | UPDATE         |
| supabase_admin      | realtime | functions   | dashboard_user | EXECUTE        |
| supabase_admin      | realtime | functions   | postgres       | EXECUTE        |
| supabase_admin      | realtime | sequences   | dashboard_user | SELECT         |
| supabase_admin      | realtime | sequences   | dashboard_user | UPDATE         |
| supabase_admin      | realtime | sequences   | dashboard_user | USAGE          |
| supabase_admin      | realtime | sequences   | postgres       | SELECT         |
| supabase_admin      | realtime | sequences   | postgres       | UPDATE         |
| supabase_admin      | realtime | sequences   | postgres       | USAGE          |
| supabase_admin      | realtime | tables      | dashboard_user | DELETE         |
| supabase_admin      | realtime | tables      | dashboard_user | INSERT         |
| supabase_admin      | realtime | tables      | dashboard_user | MAINTAIN       |
| supabase_admin      | realtime | tables      | dashboard_user | REFERENCES     |
| supabase_admin      | realtime | tables      | dashboard_user | SELECT         |
| supabase_admin      | realtime | tables      | dashboard_user | TRIGGER        |
| supabase_admin      | realtime | tables      | dashboard_user | TRUNCATE       |
| supabase_admin      | realtime | tables      | dashboard_user | UPDATE         |
| supabase_admin      | realtime | tables      | postgres       | DELETE         |
| supabase_admin      | realtime | tables      | postgres       | INSERT         |
| supabase_admin      | realtime | tables      | postgres       | MAINTAIN       |
| supabase_admin      | realtime | tables      | postgres       | REFERENCES     |
| supabase_admin      | realtime | tables      | postgres       | SELECT         |
| supabase_admin      | realtime | tables      | postgres       | TRIGGER        |
| supabase_admin      | realtime | tables      | postgres       | TRUNCATE       |
| supabase_admin      | realtime | tables      | postgres       | UPDATE         |
| supabase_auth_admin | auth     | functions   | dashboard_user | EXECUTE        |
| supabase_auth_admin | auth     | functions   | postgres       | EXECUTE        |
| supabase_auth_admin | auth     | sequences   | dashboard_user | SELECT         |
| supabase_auth_admin | auth     | sequences   | dashboard_user | UPDATE         |
| supabase_auth_admin | auth     | sequences   | dashboard_user | USAGE          |
| supabase_auth_admin | auth     | sequences   | postgres       | SELECT         |
| supabase_auth_admin | auth     | sequences   | postgres       | UPDATE         |
| supabase_auth_admin | auth     | sequences   | postgres       | USAGE          |
| supabase_auth_admin | auth     | tables      | dashboard_user | DELETE         |
| supabase_auth_admin | auth     | tables      | dashboard_user | INSERT         |
| supabase_auth_admin | auth     | tables      | dashboard_user | MAINTAIN       |
| supabase_auth_admin | auth     | tables      | dashboard_user | REFERENCES     |
| supabase_auth_admin | auth     | tables      | dashboard_user | SELECT         |
| supabase_auth_admin | auth     | tables      | dashboard_user | TRIGGER        |
| supabase_auth_admin | auth     | tables      | dashboard_user | TRUNCATE       |
| supabase_auth_admin | auth     | tables      | dashboard_user | UPDATE         |
| supabase_auth_admin | auth     | tables      | postgres       | DELETE         |
| supabase_auth_admin | auth     | tables      | postgres       | INSERT         |
| supabase_auth_admin | auth     | tables      | postgres       | MAINTAIN       |
| supabase_auth_admin | auth     | tables      | postgres       | REFERENCES     |
| supabase_auth_admin | auth     | tables      | postgres       | SELECT         |
| supabase_auth_admin | auth     | tables      | postgres       | TRIGGER        |
| supabase_auth_admin | auth     | tables      | postgres       | TRUNCATE       |
| supabase_auth_admin | auth     | tables      | postgres       | UPDATE         |

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