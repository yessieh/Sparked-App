// The confirmation-dialog surface — ONE definition, so the dialogs cannot
// drift apart again. Taken from LeaveConfirm (the standard, 2026-11-13).
//
// Why it exists: Workspace's event-delete dialog had its own copy built on
// `cardBg`, which is rgba(255,255,255,0.04) in dark mode — a see-through card
// with the listing bleeding through it. A dialog card sits over arbitrary
// content, so its surface must be OPAQUE: `bgDeep`, never `cardBg`.
//
// Surface only: callers keep their own layout (width, padding, radius).

import { type Theme } from '../theme';

/** Dimmed layer behind every confirmation dialog. */
export const DIALOG_BACKDROP = 'rgba(3,8,20,0.72)';

/** Body (explanatory) text colour inside a confirmation dialog: the BODY text
 *  colour, not textMuted. On the dialog card textMuted measured 4.71:1 in
 *  dark mode but 3.74:1 in light (2026-11-13), below 4.5:1; `text` is 15.3:1
 *  dark and ~14:1 light. Ruling (Jas, 2026-11-13): use the body colour. */
export function dialogBodyColor(theme: Theme): string {
  return theme.colors.text;
}

/** Opaque card surface + border + elevation for a confirmation dialog. */
export function dialogCardSurface(theme: Theme) {
  return {
    backgroundColor: theme.colors.bgDeep,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    boxShadow: theme.shadows.elevated,
  } as const;
}
