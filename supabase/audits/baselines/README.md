# Privilege baselines — what they are and how to compare two of them

## 1. What these files are

Each file is the output of `supabase/audits/privilege_audit.sql`, run in
**Supabase Dashboard → SQL Editor** against the DEV project, on the date in the
filename. They are **layer 2 of the three-layer privilege scheme** in
`CLAUDE.md` — (1) the standing grant check on every prompt that touches a
schema object, (2) this per-arc pre/post pair and its diff, (3) the pre-launch
full audit.

A baseline is a **record, not a review**. Nothing is changed to produce one,
and nothing in one is ever changed afterwards — see §5 for what happens when
one turns out to be defective. The date is the CAPTURE date, the day the query
ran, even when the migration it brackets applied earlier (`b9f5dfa` set that
rule; `0d75cca` applied it a second time). A pre-arc file is taken before the
arc's first migration; a post-arc file after its last. When no migration ran
between one arc's post file and the next arc's start, the previous post file IS
the new pre file — the 0026, 0027 and 0028 entries in `SPARKED_STATE.md` each
say so, because a freshly captured "pre" file taken after the migration
would diff clean against itself and report a passing gate while checking
nothing.

## 2. Comparing two baselines — in this order

The order matters because each step answers a question the next one cannot,
and doing them backwards produces confident wrong answers.

### a. `cmp` or `md5sum` FIRST

```bash
md5sum supabase/audits/baselines/*.md
```

**The export is byte-reproducible.** An unchanged privilege surface produces an
identical file, so a matching hash means nothing changed and there is nothing
further to read. This was checked for deliberately, not observed by accident:
`2026-09-15-pre-drop-3arg.md` was re-run in the SQL Editor on 2026-09-15 and
compared with `cmp` against `2026-09-09-post-date-bounds.md`, because the only
commit between the two, `017c9c5`, was SQL-free and touched no schema object —
so the two captures SHOULD describe the same database, and the check was
whether they did. They do, to the byte (`28b926d`; both files still share
`3e5ef18b…` today, and no other pair does). That is the property that makes a
hash match sufficient: it is not "the files look the same", it is "the same
query against the same catalog wrote the same bytes twice, six days apart."

Do this step even when you expect a delta. A match where you expected a change
means the migration did not apply, and that is the finding.

### b. `diff` the sections when the hashes differ

Every baseline has the same eight headings, in this order, and they are the
stable anchors for a section-aware diff:

```
## Section 1 — Grants
## Section 2 — RLS
## Section 3 — Matviews
## Section 4 — Security
## Section 5 — Privileges
## Section 6 — Inheritance
## Section 7 — Schema
## Section 8 — Context
```

**Normalise before diffing.** Sections 1 and 5 exceed the SQL Editor's silent
100-row cap and are paged and concatenated, and the markdown column widths can
differ between pages; a naive line diff then reports dozens of whitespace-only
changes, including apparent removals of SELECT rows that were never touched.
Split each row on `|`, trim every field, sort within the section, then compare.
The 0026 post-arc diff produced exactly that false alarm on its first pass
(`SPARKED_STATE.md`, 0026 entry, "Two export traps"), which is why this is a
step and not a tip.

Every added, removed or changed row must be named in the arc summary with the
statement that caused it. An unexplained delta blocks the commit.

### c. Row counts LAST

A count summarises a diff; it does not replace one. "Section 4: 42 → 40" is a
sentence for the commit message once the two removed rows have been named. It
is not evidence on its own — two rows out and two different rows in is also
"no change" by count. Counts also cannot see a defective export (§5): a
truncated row is still a row.

## 3. The counting convention — a "row" is a DATA row

Every section renders as a markdown table:

```
| schema | function_name | args | … |       ← header row       — NOT a row
| ------ | ------------- | ---- | … |       ← separator          — NOT a row
| app    | archive_event | …    | … |       ← data row           — 1
```

When a count is stated anywhere — a commit message, `SPARKED_STATE.md`, the
tracker, an arc summary — it is the number of DATA rows. The header and the
`| --- |` separator are not counted.

**Why this is written down at all:** a count that includes the header is off
by exactly one at BOTH ends of a comparison, so "41 → 43" and "40 → 42"
describe the same delta and both look internally consistent. The error does
not show up as a wrong difference; it shows up only when two people compare
absolute figures taken under different conventions and one of them appears to
have lost a row. That is the failure §4 records. An off-by-one that stays
self-consistent is the kind that survives review, which is why the convention
is stated here rather than left to be inferred from whichever commit message
the reader opened first.

## 4. Corrections — figures that are wrong in places that cannot be edited

| where | says | convention | true (data rows) |
| --- | --- | --- | --- |
| `6ae8374` (0031 applied) | Section 4: `41 → 43` | counted the header row | **40 → 42** |
| `0d75cca` (post-drop-3arg baseline) | Section 4: `42 → 40 data rows` | correct | **42 → 40** |

**The true Arc C Section 4 sequence, measured from the four files on
2026-09-17:** `2026-09-09-pre-date-bounds` **40** → `2026-09-09-post-date-bounds`
**42** → `2026-09-15-pre-drop-3arg` **42** → `2026-09-17-post-drop-3arg`
**40**. The two 42s are the same bytes (§2a). Read side by side, the two
commit messages appear to show a function vanishing between 2026-09-09 and
2026-09-15 with no migration between; **neither describes a lost grant.** Two
conventions in two messages, one week apart, and the files agree with each
other exactly.

Both figures stand where they are. A commit message cannot be corrected without
rewriting history, which is the same class of mistake as editing an applied
migration — the record would then describe an event that never happened. **This
file is where the true number lives.** A future reader who meets `41 → 43`
should come here, not to the commit.

This section is for baselines and the commit messages about them. Corrections
to comments inside applied MIGRATION files are a separate index, tracked in the
tracker's DOC RECONCILIATION section ("ADD A 'CORRECTIONS TO APPLIED
MIGRATIONS' SECTION"); same principle, different artifacts, kept apart on
purpose.

## 5. Known-defective baseline — `2026-09-02-pre-curbside-history.md`

Two export defects, neither a privilege change:

- **A truncated row.** Line 104,
  `| public | workspaces | column | id | authenticated |`, ends with no
  `privilege_type`. It is the only incomplete row in that file's Section 1 and
  it reads in a diff as `authenticated` losing SELECT on `workspaces.id`. It
  did not.
- **Section 7 appears twice.** Once at line 464 prefixed with a TAB, so it does
  not register as a heading and its 20 rows attach to Section 6; again cleanly
  at line 487.

**Usable as a diff reference for Sections 1–5 and 8. Unreliable for Sections
6 and 7, and for the one `workspaces.id` row.**

**Not amended, deliberately.** A baseline records what the database said at a
moment; rewriting one makes it describe a capture that never happened, which
is exactly what the immutability of applied migrations exists to prevent, in
a second artifact. The remedy, if it ever matters, is a NEW dated export that
supersedes it — never an edit in place. The cause, the ruling and what it
costs are in `SPARKED_CODE_STAGE_TRACKER.md`, STANDING PROCEDURES, "THE
2026-09-02 PRE-ARC BASELINE HAS TWO EXPORT DEFECTS"; this section points there
and does not restate it.
