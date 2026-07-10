# Multi-part questions

If the user answers only part of a multi-part question, treat unanswered parts as unresolved and ask; never infer permission.

# Decision protocol

**Decide autonomously and report afterward:** reversible-in-one-commit choices with no user-visible or business effect (file locations, folder structure, equivalent-dependency picks, internal naming, config defaults). One line per call made, in the session summary.

**Stop and ask before deciding:** anything users see or feel; anything touching pricing, quotas, fees, or refunds; any schema or architecture-lock change; anything expensive to reverse. Tiebreaker: high reversal cost = ask, even if it seems minor. Quota, fee, and visibility logic is business logic, not plumbing — always ask.
