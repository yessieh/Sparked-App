// The canonical taxonomy, read from `public.categories`.
//
// WHY THIS EXISTS. Before this arc the app read that table in exactly ONE place
// — the paid wizard's category picker (create/event.tsx) — and Explore had
// never read it at all. Search needs the same list, so the read moved here
// rather than being copy-pasted a second time.
//
// IT IS NOT THE WIZARD'S READ. The wizard filters `.neq('id','curbside')`
// because Curbside is auto-tagged by the 0001 trigger and must not be offered
// in a paid picker. SEARCH MUST NOT COPY THAT: Curbside is a real category with
// real events (sort_order 0, first in every lineup), and omitting it would make
// typing "curb" look broken. `active` is honoured; the exclusion is not.
//
// GRANT SURFACE: UNCHANGED. `anon` and `authenticated` have held `select` on
// public.categories since 0002 (20260708000002_core_spine_grants.sql:13-31),
// under RLS `categories_select_public using (true)`. Neither 0025 nor 0026
// touched it (0026 removes only truncate/trigger/references/maintain). This
// file CONSUMES an existing grant; it does not need or add one — which is why
// the anonymous Explore feed can offer filter suggestions without a session.
//
// `show_in_onboarding` is deliberately NOT selected. It is the 9-item distilled
// subset for a screen that does not exist yet, and search offers all 13.

import { useEffect, useState } from 'react';

import { supabase } from './supabase';

export interface Category {
  id: string;
  label: string;
}

/**
 * Reads once on mount and holds the result for the screen's lifetime. The
 * taxonomy is seeded by migration and only migrations may write it, so there is
 * nothing to refetch and no staleness to chase — a focus refetch here would be
 * a round trip that can never return a different answer.
 *
 * A failed read yields `[]`, which degrades to "no filter suggestions" while
 * event-title search keeps working. That is deliberate: half a search beats an
 * error state on a discovery surface.
 */
export function useCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('categories')
      .select('id,label,sort_order')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (cancelled || !data) return;
        setCategories(data.map((c) => ({ id: c.id, label: c.label })));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}
