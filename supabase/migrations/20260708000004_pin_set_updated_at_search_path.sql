-- ============================================================================
-- 0004 — pin search_path on app.set_updated_at (security-advisor warning:
-- "Function Search Path Mutable"). The other five 0001 functions already set
-- one. Empty search_path is safe here: the function touches only NEW.
-- ============================================================================

alter function app.set_updated_at() set search_path = '';
