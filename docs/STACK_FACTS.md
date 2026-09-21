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

A policy that reads ANOTHER table requires the CALLER to hold privileges on
every column it touches there. The policy is not evaluated as the table owner
and gets no privilege exemption — for other tables. (For columns of the
policy's OWN table the rule is different; see entry 8, without which this entry
appears to contradict itself.)

Official statement: "Policy expressions are run as part of the query and with
the privileges of the user running the query"
(https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

**Evidence, 2026-09-21** (MEASURED; supersedes the 2026-09-18 evidence and its
explanation), Supabase Dashboard -> SQL Editor, dev:

```sql
begin; set local role anon;
select e.id, e.status, e.archived_at from public.events e limit 1;
rollback;
-- SUCCEEDS: returns a row

begin; set local role anon;
select e.workspace_id from public.events e limit 1;
rollback;
-- ERROR: 42501: permission denied for table events
```

`anon` reads `events` columns fine — through `events_select_public`, under
RLS. **The failure is ONE COLUMN: `workspace_id`**, revoked from `anon` by
migration 0029 on 2026-08-16. `event_vendors_select_public` is a permissive
`PUBLIC` SELECT policy whose predicate is `EXISTS (SELECT 1 FROM events e
WHERE ... app.is_member(e.workspace_id, ...))`. That subquery is the caller's
own query against `events`, every column it names is privilege-checked, and
`e.workspace_id` is the one `anon` no longer holds. Postgres reports it as
"permission denied for table events" — the message names the table, not the
column, which is what made the earlier reading ("no table-level grant") look
right. It was wrong: `anon` has held column grants on `events` since 0011 (18
then, 19 today) and never needed a table-level one.

**THE DEFECT DATES FROM 0029 (2026-08-16), NOT 0011.** Before 0029 the
subquery's columns were all granted and the policy worked. 0029's header says
"no object created or replaced, no policy or function touched" — accurate
about objects, and silent about the two policies that read the column it
revoked. Recorded in the tracker's corrections index.

**Blast radius — three PUBLIC policies read `events.workspace_id`** (Section 8
of `2026-09-17-post-drop-3arg.md`, the only three `| PUBLIC |` rows whose
predicate contains it):

| policy | table it guards | reads `workspace_id` on | for `anon` |
| --- | --- | --- | --- |
| `events_select_public` | `events` | its OWN table | FINE — entry 8 |
| `event_categories_select_public` | `event_categories` | `events`, via subquery | BROKEN — unexercised |
| `event_vendors_select_public` | `event_vendors` | `events`, via subquery | BROKEN — live defect |

`event_categories_select_public` carries the identical defect and is invisible
only because nothing on a consumer path reads `event_categories` directly. The
first thing that does will fail identically.

**Consequence here.** Any consumer read of a table whose policy reaches into
`events` must either go through a SECURITY DEFINER function — which is what
0028 did for every read path except `event_vendors` — or the policy itself
must stop naming the revoked column (a definer predicate helper both policies
call; migration 0033, tracked). Granting `anon` `events.workspace_id` is NOT
the fix: it reverses 0029's privacy ruling, and the error's own hint proposes
a still-wider version of the same mistake (entry 2).

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

---

## A policy's references to columns of ITS OWN table are not privilege-checked; references to OTHER tables are

This is the other half of entry 1, and the only thing that explains why three
policies reading the same revoked column split two broken, one fine.

**Evidence, MEASURED, three observations on one column:**

1. `events_select_public` reads `events.workspace_id` (branch 1:
   `app.is_member(workspace_id, ...)`) and `anon` does not hold that column.
   `select e.id, e.status, e.archived_at from public.events e limit 1` as
   `anon` **returns a row** (2026-09-21, entry 1). The policy ran, read the
   column, and no privilege check fired.
2. `event_vendors_select_public` reads the SAME column on a DIFFERENT table
   (`events`, from a subquery inside a policy on `event_vendors`) and raises
   `42501` (2026-09-21, entry 1).
3. The 0021 incident, in SPARKED_STATE's own words: "An RLS POLICY expression
   is evaluated internally and needs no caller column privilege — which is why
   0019's policy had referenced these columns for anon since it shipped — but a
   **SECURITY INVOKER function body is the caller's own query**, and every
   column it touches is privilege-checked, including ones that appear only in
   a WHERE clause." `anon` lacked `deleted_at`/`archived_at`; the policy on
   `events` referencing them worked; the invoker RPC bodies failed.

**Status of the WHY — argued, not quoted.** The official row-security page
says only that policy expressions run "with the privileges of the user running
the query" (https://www.postgresql.org/docs/current/ddl-rowsecurity.html) and
says nothing about the policy's own table; `rowsecurity.c` carries no comment on
it either. What the docs DO say is that "You must have SELECT privilege on each
column used in a SELECT **command**"
(https://www.postgresql.org/docs/current/sql-select.html) — and a policy qual
is not part of the command the user wrote. The mechanism consistent with all
three observations: the executor checks the column set the PARSER marked from
the user's query (`ExecCheckOneRelPerms` / `ExecCheckRTEPerms`, entry 2), and
row-security quals are attached later, at rewrite, so a Var they add on the
guarded table is never in that set — whereas a subquery inside a policy is a
new range-table entry whose columns the executor checks like any other. Treat
the RULE as measured and the MECHANISM as the best reading of the source until
someone quotes a line that states it.

**Consequence here.** A policy may safely test columns of the table it guards
that the caller cannot read — that is what lets `events_select_public` hide
rows on `workspace_id` from the very role that cannot see `workspace_id`. A
policy that reaches into another table may only name columns EVERY role that
policy admits can read, or it must reach through a SECURITY DEFINER helper.
0029 revoked a column that two cross-table policies named, and nothing in the
gate could see it: the catalog showed every grant and policy intact.
