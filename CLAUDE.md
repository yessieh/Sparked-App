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
