# Multi-part questions

If the user answers only part of a multi-part question, treat unanswered parts as unresolved and ask; never infer permission.

# Verification budget

Machine-verify logic and state (typecheck, DOM/state checks, API probes). Never attempt visual verification of animations or motion via browser screenshots; list those for human feel-pass instead.

# Migrations are immutable once applied

**Never edit a migration file that has already been applied.** A migration runs exactly once; editing its file afterwards changes nothing in the database. The edit looks like a fix, passes review, and ships — while the deployed function or table still has the old definition. Corrections go in a NEW forward migration that `create or replace`s the object.

`supabase migration list` cannot catch this. It compares VERSION NUMBERS between the local folder and `schema_migrations`, never file contents, so it reports a clean all-green while the files and the database disagree. Treat an all-green list as proof that the same migrations ran — never as proof that the repo describes the live schema.

The second-order damage is worse than the missing fix: the repo now describes a schema no database has. A fresh project built from these files (a future prod) gets different definitions from dev, silently. That divergence is the reason for the rule.

Applies equally to a "harmless" comment or formatting change — if the version is in `schema_migrations`, the file is history, not source.

# Decision protocol

**Decide autonomously and report afterward:** reversible-in-one-commit choices with no user-visible or business effect (file locations, folder structure, equivalent-dependency picks, internal naming, config defaults). One line per call made, in the session summary.

**Stop and ask before deciding:** anything users see or feel; anything touching pricing, quotas, fees, or refunds; any schema or architecture-lock change; anything expensive to reverse. Tiebreaker: high reversal cost = ask, even if it seems minor. Quota, fee, and visibility logic is business logic, not plumbing — always ask.
