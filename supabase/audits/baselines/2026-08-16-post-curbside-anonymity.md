# Post-arc privilege baseline — 2026-08-16, after the Curbside anonymity arc (0028 + 0029)

Output of `supabase/audits/privilege_audit.sql` sections 1-8, run in the
Supabase Dashboard SQL Editor against the Sparked-App project after
`20260816000029_revoke_anon_workspace_id.sql` was applied. Section 9 is
behavioral and not runnable there — it was run in two halves and is recorded at
the end of this header, together with the arc's SQL suite.

**This closes the Curbside anonymity arc: 0028 → 0029, both applied, audited and
green.** The arc's intent — a Curbside poster who selects "Post without my name"
is anonymous to the public **including over the REST API** — is met **against
the anon key**. It is NOT met against a signed-in caller, deliberately; see the
last section of this header.

## THE PRE-ARC SOURCE FOR THIS DIFF

**`supabase/audits/baselines/2026-08-15-post-wrapper-search-path.md`** — the
post-arc baseline of the preceding arc (0027), committed at `4fb7962`.

It is the correct pre-arc source rather than a substitute, for the same reason
0026 used 0025's post-baseline and 0027 used 0026's: **no migration was applied
between the two exports.** That file records the database immediately after
0027, `20260816000028` was the very next thing to touch it, and this file records
the result of that plus `20260816000029`. One arc's post-baseline IS the next
arc's pre-baseline whenever nothing runs in between.

**No `2026-08-16-pre-curbside-anonymity.md` was written, and none should be.**
Writing one now would capture the POST-0029 state and produce an empty delta — a
clean-looking run that checked nothing. That failure mode is documented at length
in the three preceding baselines. The dated file above is the real pre-0028
record.

## HOW SECTIONS 1 AND 5 WERE EXPORTED

The SQL Editor caps a result at 100 rows in every export format and gives no
indication that it has done so. Sections 1 and 5 both still exceed that and were
paged and concatenated into one continuous block each:

| Section        | Rows | Pages implied by the count |
| -------------- | ---- | -------------------------- |
| 1 — Grants     | 114  | 2 (100 + 14)               |
| 5 — Privileges | 268  | 3 (100 + 100 + 68)         |

**Both totals match numbers predicted BEFORE the export**, which is the
arithmetic completeness check sections 1A and 5A exist to provide. 0029 removes
exactly one grant and 0028 adds none, so the predictions were 115 − 1 = 114 and
268 unchanged. A truncated section 1 would have landed on 100; a truncated
section 5 on 100 or 200. Neither did.

**This diff was normalised before comparing** — split on `|`, every field
trimmed, internal whitespace collapsed, separator and repeated-header rows
dropped (section 5 carries a duplicated header from paging), then sorted and
compared as multisets. The whitespace hazard the 0026 header documents does not
bite that way regardless of column widths. Do not run a naive line diff.

## ARC RESULT — SIX DELTAS, ALL SIX NAMED

Diffed against the pre-arc source above. **Every delta traces to a statement in
0028 or 0029; there are no unexplained rows.**

| Section         | Pre | Post | Delta |
| --------------- | --- | ---- | ----- |
| 1 — Grants      | 115 | 114  | **−1 row — the target revoke** |
| 2 — RLS         | 13  | 13   | 0 — identical |
| 3 — Matviews    | 0   | 0    | 0 |
| 4 — Security    | 37  | 39   | **+2 rows, and 2 rows changed (`config` cell only)** |
| 5 — Privileges  | 268 | 268  | 0 — identical |
| 6 — Inheritance | 4   | 4    | 0 — identical |
| 7 — Schema      | 19  | 19   | 0 — identical |
| 8 — Context     | 29  | 29   | 0 — identical |

**Section 1 — one row removed, and it is the one 0029 names:**

```
- public | events | column | workspace_id | anon | SELECT
```

anon's column grants on `public.events` go **20 → 19**. `workspace_id` retains
`authenticated | INSERT` and `authenticated | SELECT` — the deliberate gap,
still present, exactly as the migration header states. **No SELECT, INSERT,
UPDATE or DELETE row was removed anywhere else**, which is what confirms the
revoke is surgical rather than a blanket denial; the signed-out storefront reads
through those grants.

**Section 4 — the two new `app` definers (0028):**

```
+ app | event_detail         | p_event_id uuid, p_origin_lat double precision, p_origin_lng double precision       | true | postgres | search_path=public, app, extensions | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE
+ app | events_within_radius | p_origin_lat double precision, p_origin_lng double precision, p_radius_miles double precision | true | postgres | search_path=public, app, extensions | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE
```

Two things to read here. **`extensions` is on the search_path** — PostGIS moved
there in 0003, and without it `st_dwithin` / `st_distance` / `st_setsrid` /
`st_makepoint` do not resolve and the feed returns nothing with no obvious cause.
**Neither carries `PUBLIC:EXECUTE`** — Postgres mints that implicitly on CREATE
of a NEW function, and the `revoke all … from public` preceding each grant is
what removed it. That trap does not apply to `create or replace` (0027's
finding); it applies here precisely because these are new objects.

**Section 4 — the two `public` wrappers, `config` cell only:**

```
- public | event_detail         | … | false | postgres | search_path=public, extensions | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE
+ public | event_detail         | … | false | postgres | search_path=public, app        | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE
- public | events_within_radius | … | false | postgres | search_path=public, extensions | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE
+ public | events_within_radius | … | false | postgres | search_path=public, app        | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE
```

The wrapper bodies no longer touch PostGIS — each calls one schema-qualified
function and nothing else — so `public, app` matches the sibling wrappers
(`workspace_stats`, `organizer_profile`). Signatures, argument names,
`security_definer=false` and volatility are unchanged.

**`(NONE - INHERITS CALLER)` still appears NOWHERE in section 4.** The property
0027 established holds through this arc.

## THE ACL QUESTION — ASKED AGAIN, ANSWERED AGAIN: PRESERVED

0028 replaced both public wrappers with `create or replace` and **wrote no
defensive re-grants**, for 0027's reason: re-stating the grants would make the
outcome unobservable, since the diff would come back clean whether the ACL was
preserved or silently reset.

**It answered: preserved.** `execute_grants` reads
`PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE` on both
rows, before and after, byte-identical. Had it reset, anonymous browse would
today be depending on the PUBLIC default rather than on its explicit anon grant —
working, but for the wrong reason, and one `revoke … from public` away from an
outage nobody would predict.

**Noted, not acted on:** these two wrappers still carry `PUBLIC:EXECUTE`, unlike
the three 0019 wrappers that 0025 stripped. That is a pre-existing condition, not
something this arc introduced, and removing it is a revoke — out of scope for a
conversion arc. Candidate for the next grant-hardening pass.

## BEHAVIORAL VERIFICATION (SECTION 9) — RUN 2026-08-16, BOTH HALVES PASSED

**This arc does not get the exemption 0025 and 0026 took.** Those were revokes
only. 0028 REPLACES function definitions and, more seriously, **moves a
visibility rule out of an RLS policy and into a function body** — a change that
fails in ways a revoke cannot, and fails invisibly to every catalog check.

**Anon half — machine-verified through the REST API** against the linked project
from the running dev server, session confirmed signed out (no auth token, zero
console errors).

Five probes on the closed path, all as intended:

| Probe | Result |
| ----- | ------ |
| `events?select=id,curbside_anonymous,workspace_id` | **42501** |
| the full deanonymization query from the 0029 header | **42501** |
| forward embed `events?select=workspaces(name)` | **42501** |
| **reverse** embed `workspaces?select=events(id)` | **42501** |
| CONTROL `events?select=id,title,starts_at` | **200, rows** |

The reverse-embed probe confirmed a claim the 0029 header asserted and nothing
had checked — both embed directions resolve through the same FK column. The
control is what distinguishes a surgical revoke from a broken table.

Storefront and masking chain, same run: feed returns 11 rows with PostGIS
distances computing (0.4 / 1.2 / 3.38 mi — which independently confirms the
`extensions` search_path entry); `event_detail` returns **null `organizer_name`
AND null `workspace_id`** on an anonymous post and both populated on a named one;
`organizer_profile` still reachable from the id `event_detail` hands back; the
archived event by direct id returns **zero rows rather than an error**. The feed
RPC returned exactly **3 masked rows** while the rendered DOM showed exactly
**3 "Local host" cards** — two independent surfaces agreeing, which is a check a
single-source assertion cannot give you.

**Signed-in half — run by hand.** The first two matter most, because they are the
paths that depend on the grant 0029 deliberately did NOT touch; if the revoke had
been mis-scoped to `authenticated`, both would 42501 immediately.

- **Saved** renders its cards and clicks through to event detail — the
  `workspaces(name)` embed at `saved.tsx:187`.
- **Workspace** stats tiles AND listings populate — the `.eq('workspace_id', …)`
  filter at `workspace.tsx:501`.
- An **archived** event opens from Workspace PAST — branch 1.
- An **ended, RSVP'd** event opens from Saved — branch 3.

## THE SQL SUITE — RUN, NOT MERELY WRITTEN: 43/43 PASS

**`scripts/qa-0028-0029-curbside-anonymity.sql`**, executed in the SQL Editor
against dev. **43 assertions, 43 passing**: 1 fixture, 2 (0021 regression guard),
3 (the revoke from the role it names), 3 (masking, both directions), 6 (the
transcribed predicate from the stranger's vantage), 3 (host / branch 1), 2
(attendee / branch 3), 2 (feed), and 21 equivalence rows.

**The 21 group-H rows are the strongest single thing in this arc's record.**
0028's central risk was that transcribing `events_select_public`'s three branches
into `app.event_detail` might not reproduce the policy. Group H does not test the
transcription against itself: it switches to the real `authenticated` role, asks
the **policy** what it admits, asks the **function** the same question, and fails
on any disagreement — **7 fixture events × 3 vantage points (stranger, host,
attendee)**, every pair agreeing. The policy remains the source of truth and the
body is proven equivalent to it rather than assumed equivalent.

Two of those fixtures — a **draft** and a **`pending_payment`** row — are
unreachable through the UI, since no draft id is ever surfaced (the wizard's URL
is `/create/event` throughout and a row id exists only after insert). They are
also exactly the rows a verbatim definer move would have leaked to anyone holding
an id. The click-through pass could not test them; the suite can, and did.

One fixture bug was found and fixed while writing the suite, by reading 0001
rather than by running it: workspace creation already seeds the owner membership
through the `on_workspace_created` trigger, so an explicit insert would have
violated the memberships PK. It is now an assertion that the trigger fired, since
every branch-1 check depends on that row.

## WHAT THIS ARC DELIBERATELY DID NOT CLOSE

**`authenticated` retains SELECT on `events.workspace_id`** — visible in section 1
above, and not an oversight. Stated plainly: **an anonymous Curbside post is now
protected against anyone holding the anon key, and remains correlatable by anyone
holding an account. Accounts are free.**

Revoking it there requires converting the host-side reads that filter or embed on
that column onto definers FIRST — `saved.tsx:187`, `workspace.tsx:501`, plus the
Me hub and checkout reads beside them — or each 42501s the moment the grant goes.
Bundling four such conversions into an arc that already carried one is how the
0020 sequence happened. Tracked in SPARKED_CODE_STAGE_TRACKER.md under the
Curbside anonymity arc as its own deferred item, to be done as its own arc with
its own pre/post audit.

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
| public | workspaces            | column      | id                 | authenticated | SELECT         |
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
| app    | event_detail             | p_event_id uuid, p_origin_lat double precision, p_origin_lng double precision                       | true             | postgres | search_path=public, app, extensions | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE                 |
| app    | event_publish_fee_cents  | p_event_id uuid                                                                                     | true             | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| app    | events_within_radius     | p_origin_lat double precision, p_origin_lng double precision, p_radius_miles double precision       | true             | postgres | search_path=public, app, extensions | postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE                 |
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
| public | event_detail             | event_id uuid, origin_lat double precision, origin_lng double precision                             | false            | postgres | search_path=public, app             | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE |
| public | event_publish_fee_cents  | event_id uuid                                                                                       | false            | postgres | search_path=public, app             | postgres:EXECUTE, authenticated:EXECUTE                               |
| public | events_within_radius     | origin_lat double precision, origin_lng double precision, radius_miles double precision             | false            | postgres | search_path=public, app             | PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE |
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
| granting_role       | schema   | object_type | grantee        | privilege_type |
| ------------------- | -------- | ----------- | -------------- | -------------- |
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

