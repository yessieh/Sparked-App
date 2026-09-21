# Multi-part questions

If the user answers only part of a multi-part question, treat unanswered parts as unresolved and ask; never infer permission.

# Commit direct to main — do not branch, do not ask

**When asked to commit, commit to `main` and push to `main`.** Do not create a
branch first, and do not ask whether to. This is the standing answer, recorded
2026-08-25 so it stops being re-litigated once per arc.

The default agent behaviour is to branch when it finds itself on the default
branch. That default protects other contributors from unreviewed history landing
under them. **There are no other contributors here** — every commit in this repo
is direct to `main`, from one person, and a branch would create a PR flow nobody
uses and a review step nobody performs. The safety it buys is zero and the
friction is real.

What this does NOT change: commit or push only when actually asked. The rule
governs WHERE a requested commit goes, not whether an unrequested one happens.

# Verification budget

Machine-verify logic and state (typecheck, DOM/state checks, API probes). Never attempt visual verification of animations or motion via browser screenshots; list those for human feel-pass instead.

# Migrations are immutable once applied

**Never edit a migration file that has already been applied.** A migration runs exactly once; editing its file afterwards changes nothing in the database. The edit looks like a fix, passes review, and ships — while the deployed function or table still has the old definition. Corrections go in a NEW forward migration that `create or replace`s the object.

`supabase migration list` cannot catch this. It compares VERSION NUMBERS between the local folder and `schema_migrations`, never file contents, so it reports a clean all-green while the files and the database disagree. Treat an all-green list as proof that the same migrations ran — never as proof that the repo describes the live schema.

The second-order damage is worse than the missing fix: the repo now describes a schema no database has. A fresh project built from these files (a future prod) gets different definitions from dev, silently. That divergence is the reason for the rule.

Applies equally to a "harmless" comment or formatting change — if the version is in `schema_migrations`, the file is history, not source.

# Name the verification baseline

When reporting any verification, name what it was checked against and what that does not establish. "Verified byte-identical" without naming the source implies the repo is correct; it only proves the copy equals whatever the source held at that moment. Report as "checked X against Y (as of <mtime/commit/timestamp>)".

Where staleness is possible, add an independent positive check that the expected content is present — grep for a known-new marker, or compare against a count supplied by the reviewer — rather than relying on the comparison alone.

Same failure mode as **Migrations are immutable once applied** above: `supabase migration list` compares version numbers and reports all-green while file contents and the live schema disagree.

# Decision protocol

**Decide autonomously and report afterward:** reversible-in-one-commit choices with no user-visible or business effect (file locations, folder structure, equivalent-dependency picks, internal naming, config defaults). One line per call made, in the session summary.

**Stop and ask before deciding:** anything users see or feel; anything touching pricing, quotas, fees, or refunds; any schema or architecture-lock change; anything expensive to reverse. Tiebreaker: high reversal cost = ask, even if it seems minor. Quota, fee, and visibility logic is business logic, not plumbing — always ask.

# Standing grant check

Any prompt that creates or alters a table, column, function, view or policy must state in its report whether it changes the grant surface — which roles gain or lose access to which objects or columns — and name each grant it adds alongside the surface that consumes it. A schema change reported without a grant statement is an incomplete report. Implicit grants count: Postgres grants EXECUTE to PUBLIC by default on every function, so a CREATE FUNCTION with no explicit grant has granted PUBLIC access and must be named as such.

# Per-arc privilege audit gate

The query set lives at `supabase/audits/privilege_audit.sql`. It is layer 2 of a three-layer scheme: (1) the **Standing grant check** above, (2) this per-arc audit, (3) the pre-launch full security audit.

Every arc runs: **pre-arc audit → build → QA suite → post-arc audit → commit.**

- **PRE-ARC.** Run `supabase/audits/privilege_audit.sql` in the Supabase Dashboard → SQL Editor. Save the output to `supabase/audits/baselines/` as `YYYY-MM-DD-pre-<arc-name>.md`. This is a baseline, not a review — record it and change nothing.
- **QA SUITE.** Every arc ships a behavioral SQL suite in `scripts/`, following the `scripts/qa-0018-quota-ledger.sql` pattern, plus a human verification list with exact URLs and named test data.
- **POST-ARC.** Re-run the same audit, save as `YYYY-MM-DD-post-<arc-name>.md`, and DIFF it against the pre-arc baseline. Every added or changed grant, function, policy or default privilege must be named in the arc summary with the reason it exists. **An unexplained delta blocks the commit.**

**N/A FOR SQL-FREE ARCS — STATED, NEVER OMITTED.** An arc that writes no SQL and
touches no schema object has no grant surface to diff. The pre/post audit and the
`qa-NNNN` suite are N/A, and the arc report must say so explicitly — stating that
the grant surface is provably untouched and why — rather than omitting the gate.
Silence reads as a skipped gate; a stated N/A is a decision. This does not extend
to arcs that change RPC arguments, function bodies, or anything reachable from
PostgREST: **if a migration file is written, the gate applies in full.**

**The rule this enforces:** a grant is written once and reviewed once, at creation. Features change around it and nobody re-reads it. Four privilege incidents in this build traced to exactly that, and all four were found incidentally. The diff is what makes finding them non-incidental.

# Unverified premises are labelled, never asserted

A build prompt states facts about the stack — what an API returns, what a
library does, what a role can read. **Any such premise is either verified with a
command before the prompt is written, or carried in the prompt as `UNVERIFIED:`
alongside the check that would settle it.** An unlabelled wrong premise becomes
a wrong instruction, and the cost lands at build time or later.

**Scope: the label belongs on claims about CODE NOBODY HERE WROTE** — a
library, a database engine, a role's privileges, an external API. It does NOT
belong on claims about this repo, which the builder can open and read; labelling
those is noise, and noise is how a label loses its force. The boundary sits
there because every premise that has been wrong so far was about Postgres,
PostgREST or React Native Web, and none was about Sparked.

Not hypothetical. A brief asserted that React Native Web gives a pressable
`Text` the same keyboard activation it gives a `Pressable`. It does not, and
building to that sentence as written would have shipped a focusable, inert link
— the exact defect the arc existed to remove. A second brief asserted an
expected row count that a correct run would have reported as a failure.

A premise that arrives labelled UNVERIFIED is the first step of the arc, and the
answer goes in the report whichever way it falls.

# A comment asserting a privilege property cites its evidence

Any comment claiming who can read or write something — an RLS outcome, a grant,
an anonymous-access property — names the migration or the verification that
established it, with a date. A bare assertion is worse than no comment: it
answers the question before anyone thinks to ask it.

`(tabs)/event/[id].tsx` carried `// event_vendors RLS lets anon read rows of any
publicly-visible event, so no RPC is needed.` It was false. Anonymous users
could not read that table at all, the Plus tier's vendor pins were invisible to
every signed-out visitor, and that sentence is the reason nobody checked for a
month.

# Catalog-verified is not behaviour-verified

The per-arc privilege audit proves that grants, policies and functions EXIST
with the shape recorded. It cannot prove that a given role can actually complete
a given read. Those are different claims, and the gate only makes the first.

**Any arc that adds or changes a read path owes one behavioural check per role
AND per policy branch meant to admit it** — a driven read as that role, reaching
that branch, not a clean Section 1. Where the role is `anon`, that is a `set
local role anon` probe in the SQL Editor or an anonymous request against the
endpoint.

Per branch, not only per role, because a role is not an outcome: a signed-in
member and a signed-in stranger are both `authenticated` and get different RLS
results, and the `event_vendors` policy has a branch for each. A per-role-only
rule passes by checking whichever branch is easier to reach — usually the
member's, since that is who is testing — and the storefront branch is the one
that fails.

Found the hard way: `anon` held SELECT on `event_vendors` in all eleven
baselines ever captured, its policy was a permissive PUBLIC SELECT, every audit
was clean — and anonymous users could not read the table. See
`docs/STACK_FACTS.md`. This extends **Name the verification baseline** above:
naming what you checked against is necessary, and insufficient when what you
checked was the catalog.

# A defect's boundary is its shape, not its name

Two searches, at two moments. Both are mechanical — a grep, not a judgement.

**Before diagnosing, search the record by SYMPTOM as well as by object** — the
error code, the HTTP status, the observed behaviour. A defect is filed under the
object where it was found, and the same defect in a sibling object is invisible
to anyone searching for that sibling's name.

**Before scoping a fix, enumerate every object sharing the defect's shape.** One
grep for the failing construct, not the failing object. A defect found in one
instance of a shared shape is a defect in the shape until proven otherwise.

This project already applies the second half to components — `Pill.tsx` was
treated as a three-screen blast radius, `EventStub` as five — and has not been
applying it to schema objects.

**The incident.** On 2026-09-02 the 0030 suite found that `anon` could not read
`public.event_categories`, and diagnosed it correctly and completely: a
cross-table subquery inside a policy is privilege-checked against the caller,
branch 1 passes `e.workspace_id` to `app.is_member`, and 0029 revoked exactly
that column — with a discriminating query and a control. It then scoped the
impact to that one table ("no app path reads it as anon") and nobody grepped for
another policy with the same body. `event_vendors_select_public` has that body
byte-for-byte and IS read directly, at `(tabs)/event/[id].tsx:109`. The Plus
tier's vendor pins have been invisible to every signed-out visitor since
2026-08-16, and the read fails silently — the caller takes only `data`, so the
error falls through `?? []` and renders as "this event has no vendors."

Found again on 2026-09-21, from scratch, through three wrong theories, by
someone who HAD grepped the tracker for `event_vendors` and found nothing —
because the item is titled `event_categories`. A search for `42501` would have
returned it in one command, before any theorising.

**A correct diagnosis with a wrong blast radius is more dangerous than no
diagnosis**, because the written record then reads as "known, assessed, not a
problem" and stops the next person from looking.
