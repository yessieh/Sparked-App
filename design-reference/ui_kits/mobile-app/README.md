# Sparked — Mobile App UI Kit

A click-thru prototype of the core Sparked mobile experience.

## Files

- `index.html` — main demo page; renders three iPhone frames side-by-side.
- `Components.jsx` — small reusable primitives: `SparkLogo`, `SparkButton`, `Eyebrow`, `InterestPill`, `LiveBadge`, `Tag`, `EventCard`, `MetaRow`, `Icon`, `PhoneFrame`, `StatusBar`, `TabBar`.
- `Screens.jsx` — full-screen compositions: `LandingScreen`, `ExploreScreen`, `EventDetailScreen`, `WorkspaceScreen`.

## Source of truth

Components are visual recreations based on:

- `src/pages/landing/LandingPage.tsx` — hero, eyebrow pills, dual-CTA stack
- `src/pages/explore/ExploreLayout.tsx`, `ExploreInterestStrip.tsx` — interest strip, view toggle, tab bar
- `src/pages/workspace/WorkspacePage.tsx` — Workspace demo (stats + listings)
- `src/shared/components/SparkedLogo.tsx`, `InterestPill.tsx` — atomic components

Implementation is cosmetic-only; routing, geolocation, supabase data, etc. are stubbed.

## Notes

- Three phones illustrate the click-thru flow (Landing → Explore → Event detail) plus the Workspace demo and a static Event Detail reference.
- The middle "Workspace" phone is intentionally aspirational — matches the user's note that Workspace is a future offering surfaced as a demo today.
