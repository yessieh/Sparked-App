# Sparked — stack facts

Behaviours of Postgres, PostgREST, Supabase and React Native Web that cost this
build real time, each with the evidence that established it.

**Why this file exists.** Every entry below was either asserted wrongly in a
build prompt and caught downstream, or re-derived more than once. Reasoning
about these from first principles has a bad track record here — two were stated
confidently in BOTH directions before anyone ran a command.

**The bar for an entry:** a command was run or a source file was read, and the
result is quoted. A plausible explanation is not an entry.

---

## RLS policy expressions run with the QUERYING ROLE's privileges

A policy that reads another table requires the CALLER to hold privileges on
that table. The policy is not evaluated as the table owner and gets no
privilege exemption.

**Evidence, 2026-09-18**, Supabase Dashboard -> SQL Editor, dev:

```sql
begin; set local role anon;
select count(*) from public.event_vendors;
rollback;
-- ERROR: 42501: permission denied for table events
```

`event_vendors_select_public` is a permissive `PUBLIC` SELECT policy whose
predicate is `EXISTS (SELECT 1 FROM events e WHERE ...)`. `anon` holds
table-level SELECT on `event_vendors` — every baseline confirms it — and the
read still fails, because the POLICY reaches into `events`, where `anon` holds
no table-level grant (0011 revoked it and re-granted 18 columns; 19 today —
`deleted_at`/`archived_at` added by 0021, `workspace_id` removed by 0029).

**Consequence here.** Any consumer read of a table whose policy references
`events` must go through a SECURITY DEFINER function — which is what 0028 did
for every read path except `event_vendors`.

**What made this expensive.** `event_categories_select_public` has the same
shape and appears to work. It does not: nothing in the consumer app reads
`event_categories` directly — categories arrive as `categories text[]` from the
definer RPCs. An unexercised policy proves nothing, and treating one as a
control reversed a correct conclusion.

---

## `count(*)` does NOT require TABLE-level SELECT — but the hint is still a trap

**CORRECTED 2026-09-18 in verification.** This entry originally stated that a
role holding only column-level grants cannot `count(*)`. The Postgres executor
says the opposite, in a comment naming this exact case
(`src/backend/executor/execMain.c`, `ExecCheckOneRelPerms`; identical in
`REL_15_STABLE` as `ExecCheckRTEPerms`):

> "When the query doesn't explicitly reference any columns (for example,
> SELECT COUNT(*) FROM table), allow the query if we have SELECT on any
> column of the rel, as per SQL spec."

followed by `pg_attribute_aclcheck_all(relOid, userid, ACL_SELECT,
ACLMASK_ANY)`. A column grant on ANY one column is enough for `count(*)`.

**The observation that produced the wrong rule, kept as an observation.**
On 2026-09-18, in the Dashboard as `anon`, `select count(*) from
public.events` was reported to raise `42501 permission denied for table
events` while `select count(id) ...` worked. `anon` holds SELECT on 19
columns of `events`. That result is not reproducible here and contradicts the
source above; it is UNEXPLAINED, not a rule. What would settle it: one
Dashboard run of `begin; set local role anon; select count(*) from
public.events; select count(id) from public.events; rollback;` with both
results pasted back verbatim. Until then, `count(id)` remains the safe probe
because it is correct either way.

**THE TRAP.** Postgres attaches this hint to that error:

```
HINT: Grant the required privileges to the current role with:
      GRANT SELECT ON public.events TO anon;
```

**Do not follow it.** That grant reverses migration 0011 and re-exposes
`publish_fee_cents` to anonymous clients. The error is usually the probe's
fault, not the grant's.

---

## PostgREST: a `42501` privilege failure is 401 for `anon`, 403 when authenticated

**CORRECTED 2026-09-18 in verification.** This entry originally stated that a
privilege failure always returns 403 and that 401 always means a JWT problem.
PostgREST's own error table says otherwise
(https://docs.postgrest.org/en/latest/references/errors.html, "PostgreSQL
error codes to HTTP status"):

> `42501 | if authenticated 403, else 401 | insufficient privileges`

So an ANONYMOUS request that hits `42501` comes back as **401**, not 403. The
JWT errors are separate codes: `PGRST301` (401, JWT verification) and
`PGRST302` (401, no auth when the anon role is disabled). A bare 401 on an anon
read is therefore ambiguous between "bad token" and "no privilege", and the
way to tell them apart is the body's `code`/`message` — or a `set local role
anon` probe in SQL, which returns the SQLSTATE directly.

**This repo has both halves on record for one read:** Entry 11 saw 401 on
`event_vendors` for anon over the API, and the RLS entry above saw `42501`
on the same table as `anon` in SQL. Same defect, two spellings. Reading that
401 as a grant problem was the RIGHT call; the original wording of this entry
would have sent the next reader the other way.

---

## RN Web: `Text.onPress` has no keyboard activation; `Pressable.onPress` does

**Evidence, react-native-web 0.21.2.**
`dist/modules/usePressEvents/PressResponder.js:71` —
`return key === 'Enter' || isSpacebar && isButtonish;` — and
`dist/exports/Pressable/index.js` wires that handler through. `Text` does not:
its `onPress` maps to `onClick` only.

**Consequence.** A `<Text role="link" tabIndex={0} onPress={...}>` is focusable
and INERT — keyboard users tab onto it and Enter does nothing, which is a worse
state than having no role at all. It needs an explicit `onKeyDown` (Enter for
links; Enter and Space for buttons). A `Pressable` with `role="button"` needs
nothing extra.

---

## `now()` is transaction-stable

Every row written by one statement receives an identical `timestamptz`, to the
microsecond.

**Evidence, 2026-09-18.** One `UPDATE` re-anchoring nine seeded events left all
nine at `2026-09-18 22:24:25.209454+00`.

**Why it matters here.** It is what makes a deliberate same-instant fixture pair
reliable rather than lucky — a tie that only NEARLY ties never exercises a
tiebreak, and the test then passes for the wrong reason.

---

## `CREATE OR REPLACE FUNCTION` cannot change a return type

Adding a column to a `RETURNS TABLE` requires DROP + CREATE, which resets the
function's ACL.

**Consequence, and why Arc C is shaped as it is — CORRECTED 2026-09-18 in
verification.** Arc C hit the SIBLING rule, not this one: 0031 added two
ARGUMENTS, and "it is not possible to change the name or argument types of a
function this way (if you tried, you would actually be creating a new,
distinct function)" (same docs page). 0031's header says exactly that at
lines 67–68: "adding two arguments is a new function identity, CREATE OR
REPLACE cannot do it, so DROP + CREATE with an explicit re-grant". So 0031
created the 5-argument `events_within_radius` ALONGSIDE the 3-argument one
rather than dropping it, and 0032 dropped the old pair only once the client had
moved. The return-type rule above is real and would bite the same way — "just
add a column to the RPC" is never a small request — but it is not the rule
Arc C was shaped around. Both rules end in a DROP, and a DROP resets the ACL;
`CREATE OR REPLACE` does not: "the ownership and permissions of the function
do not change."

---

## Reparenting in source is not a runtime remount

`docs/ACCESSIBILITY.md` Entry 2's rule is that a live region must not REMOUNT AT
RUNTIME — a region that arrives already holding its text announces nothing.
Wrapping that region in a new parent in the JSX changes the tree once, at build
time; the region still mounts once with the screen and stays.

**Verified in Arc E.** The filter-status region was wrapped in a row container
to seat the view switcher beside it, and still announced
`Showing 1 of 5 · Curbside, Music` on the same node.
