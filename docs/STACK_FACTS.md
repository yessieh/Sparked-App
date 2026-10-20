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
| `event_categories_select_public` | `event_categories` | `events`, via subquery | WAS BROKEN — unexercised; fixed by 0033 |
| `event_vendors_select_public` | `event_vendors` | `events`, via subquery | WAS BROKEN — live defect 2026-08-16 → 2026-09-21; fixed by 0033 |

`event_categories_select_public` carried the identical defect and was invisible
only because nothing on a consumer path read `event_categories` directly. The
first thing that did would have failed identically.

**RESOLVED 2026-09-21, migration 0033.** `app.is_event_member(p_event_id uuid,
p_roles text[])`, SECURITY DEFINER, resolves the event's `workspace_id` inside
its own body and delegates to `app.is_member`; both policies were ALTERed to
call it with `e.id` — a column every role reads — in place of
`app.is_member(e.workspace_id, …)`, one substitution each, nothing else
changed. Verified per role and per policy branch by
`scripts/qa-0033-event-member-predicate.sql` (12/12, 18/18): anon reads both
tables on a published Plus event (`n=2`, was `ERR 42501`); anon on a draft gets
0 rows and no error. **The fact this entry teaches is unchanged and still
true**: the mechanism did not go away, the policies stopped exercising it. Any
future cross-table policy that names a column some admitted role cannot read
will fail exactly this way, and the six `_members` siblings are one
`authenticated` revoke from doing so (tracker).

**Consequence here.** Any consumer read of a table whose policy reaches into
`events` must either go through a SECURITY DEFINER function — which is what
0028 did for every read path except `event_vendors` — or the policy itself
must not name a column the caller cannot read (a definer predicate helper,
which is what 0033 did). Granting `anon` `events.workspace_id` is NOT the fix:
it reverses 0029's privacy ruling, and the error's own hint proposes a
still-wider version of the same mistake (entry 2).

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

---

## RN Web forwards `inert` as a plain prop

**Evidence, react-native-web 0.21.2 + react-dom 19.2.3** (read 2026-09-28,
screen-focus recon C2): `inert` is in RNW's forwarded accessibility props
(`dist/modules/forwardedProps/index.js:58`), `View` forwards that list
(`dist/exports/View/index.js:26`), `createDOMProps` passes it through in the
rest props (`dist/modules/createDOMProps/index.js:148`), and React 19 treats it
as a boolean attribute (`react-dom/cjs/react-dom-client.development.js:20218`).
Observed live (`ac14fac`): `inert` present on every non-focused tab screen,
absent on the focused one.

**Consequence.** No ref or DOM mutation is needed — `<View inert>` works. RN
0.86's `ViewProps` does not TYPE it, so it is passed as an untyped spread
(`components/ScreenFocus.tsx`, the same shim as `Pill.tsx`'s `aria-pressed`).

---

## On web, BottomTabView never hides unfocused tab screens — `aria-hidden` only

**Evidence, expo-router 57.0.4's vendored React Navigation** (read 2026-09-28):
`BottomTabView` wraps each screen in `MaybeScreen`, which renders
react-native-screens' `Screen` only when `screensEnabled()` is true and a plain
`View` otherwise (`build/react-navigation/bottom-tabs/views/ScreenFallback.js:21-26`).
`screensEnabled()` is false off-native (`react-native-screens/src/core.ts:10,36`)
and nothing in expo-router or `src/` calls `enableScreens`, so the
`display:none` branch (`react-native-screens/src/components/Screen.web.tsx:24-32`)
is never reached. `detachInactiveScreens` defaults true on web and has no effect.
Measured live (against `6eb3da3`): unfocused tab screens `display:flex`,
`z-index:-1`, `aria-hidden="true"`, still tabbable — 13 to 39 tabbable elements
across hidden screens. The root Stack is different: unfocused screens get
`display:none` (`build/react-navigation/native-stack/views/NativeStackView.js:88-93`).

**Consequence.** On web, `aria-hidden` on a tab screen hides nothing from Tab.
Hidden tab screens need `inert` (entry above) — not unmounting, which would
lose session state.

---

## TabRouter `backBehavior: 'history'` de-duplicates a revisited route

**Evidence, expo-router 57.0.4's vendored React Navigation** (read 2026-10-09):
the default is `'firstRoute'` (`build/react-navigation/routers/TabRouter.js:96`),
which sends Back from any href:null tab route to the first tab. Under
`'history'`, `changeIndex` removes the revisited route's earlier entry before
appending it (`TabRouter.js:63-65`). Observed live (`9376036`): Event A →
Organizer → Event B → Back → Back lands on Organizer, then **Explore** — not
Event B, because every event is the one `event/[id]` route.

**Consequence.** Two levels deep inside a reused route, Back skips to the
first route. Expo-router's linking mirrors this in the URL: opening Event B
REPLACED Organizer's browser-history entry, so Chrome ← from B goes to A while
in-app Back goes to Organizer. Fixing either needs per-tab stacks, not an
option.

---

## Expo-router answers `popstate` with a RESET, and echoes in-app Back into `history.go`

**Evidence, expo-router 57.0.4** (read and observed 2026-10-12): on a browser
traversal, expo-router's linking applies the remembered state with
`resetRoot()` (`build/fork/useLinking.js:148-222`), and `resetRoot` DISPATCHES
a `RESET` action (`build/react-navigation/core/BaseNavigationContainer.js:135-145`)
— so Chrome ← does produce a navigation action, contrary to a first reading.
An in-app `GO_BACK` goes the other way: the state changes first, then linking
syncs the URL with `history.go(...)` (`build/fork/useLinking.js:342, :348`),
which fires a `popstate` of the app's own AFTER the screen changed. The
container's `__unsafe_action__` event fires before the new state is applied
(`build/react-navigation/core/useOnAction.js:72-79`).

**Consequence.** Code that classifies navigation must treat a `RESET` just
after a `popstate` as a back traversal, and a `popstate` just after an action as
an echo — the focus controller's 1-second windows
(`components/ScreenFocus.tsx`). Also observed: Chrome ← back to `/` REMOUNTS
Explore (a new screen instance), confirmed on `8c870fe` before any focus code.

---

## Fast Refresh keeps an old module version's DOM listeners attached

**Observed, 2026-10-14.** A module that adds `document` / `window` /
navigation-container listeners at install time keeps them after Fast Refresh
loads a new version: the new copy gets fresh module state and installs again,
and the old copy's listeners never come off. A mid-edit version of
`components/ScreenFocus.tsx` — an assignment to `lastActionAt` saved one edit
before its `let` — threw "lastActionAt is not defined" on every navigation in a
tab left open, though the file on disk was correct; a hard refresh cleared it.

**Consequence.** A module-level installer must tear down its predecessor. The
controller keeps its teardown on `globalThis` and calls the previous one first;
verified with two real Fast Refreshes: the old style tag removed, a new one
added, one controller, no error. Dev only — production loads the module once.

---

*The entries below were established in the per-tab stacks arc
(`35db3e9..a1500f3`, 2026-10-14 → 2026-10-20). Paths are under
`node_modules/expo-router/build/`, expo-router 57.0.4.*

## A shared route's cold link goes to the FIRST group in config order

**Read and measured, 2026-10-15.** One file in an array group
(`(explore,saved,me)/event/[id].tsx`) becomes one route per group, and a URL
like `/event/<id>` matches all of them. The sorter ranks them
(`fork/getStateFromPath-forks.js`):
1. **Group similarity to the CURRENT segments** (:267-279). In-app pushes pass
   the current segments (`getLinkingConfig.js:90-91`), so a push opens the
   copy in the tab you are in.
2. On a cold link there are no current segments, so: **`isInitial`** (the
   route is its navigator's anchor), then **part count**, then **original
   config order** (:347-367).
3. **Group segments are not parts** (:75-86), so no extra group folder can
   change the count.

Measured: cold `/event/<id>`, `/organizer/<id>`, `/published` and
`/settings/interests` all opened in `(explore)`, the first group.

**Consequence.** The only per-route lever is `isInitial`, and the source marks
it unfinished ("TODO: We don't differentiate between the default initialRoute
and group specific default routes", :347-360). Rely on config order, not on
`isInitial` (SPARKED_STATE → PER-TAB STACKS, the cold `/settings/interests`
edge).

---

## A tab's link is built from its group route's PARAMS, falling back to the group's first screen by FILE ORDER

**Read and measured, 2026-10-15.** The tab bar builds each tab's `href` with
`buildHref(route.name, route.params)`
(`react-navigation/bottom-tabs/views/BottomTabBar.js:288`), i.e.
`getPathFromState` over the group route with NO nested state
(`react-navigation/native/useLinkBuilder.js:53-96`). That path falls back to
`params.screen`, else `index`, else **the group's first screen**
(`fork/getPathFromState.js:153-185`). The anchor / `initialRouteName` is never
read. A group's screens are its DIRECT files in `require.context` key order,
then its subdirectories (`getRoutesCore.js:481-494`), and the linking config
keeps that order (`getReactNavigationConfig.js:69-71`).

Measured: with the shared folder named `(explore,me)`, the Me tab's link read
`/create` — the anchor was already `'me'`. Renamed `(me,explore)`, `)` sorts
before `,`, so `(me)/me.tsx` came first: `/me`.

**Consequence.** A file added directly in `(me)/` that sorts before `me.tsx`
changes the Me tab's link. `initialParams={{ screen }}` is not a fix: tab
presses rebuild the params object every time
(`react-navigation/routers/createParamsFromAction.js:4-11`), so the tab's
Stack would push a second main page.

---

## Deep-link params are copied onto the anchor AND the ancestor routes

**Read and measured, 2026-10-15.** When a deep link builds an anchored Stack,
the anchor gets the link's params:
`{ name: initialRoute, params: route.params }`
(`fork/getStateFromPath.js:474`, :488). Measured on cold `/event/<id>`: the
`(tabs)` route, the `(explore)` group route and the anchored `index` all
carried `{ id }`. Back then landed on `/?id=<id>`, and the Explore tab's link
read `/?id=<id>` (the link is built from the group route's params, entry
above). Dropping the anchors does not stop the ancestor copy.

**Consequence.** `components/TabStack.tsx` strips them: main pages keep no
params, and group routes keep only the keys used to address a nested screen.

---

## The Tabs router treats REPLACE as a jump and has NO `POP_TO` — `dismissTo` across tabs is silently dropped

**Read and measured, 2026-10-14.** expo-router's Tabs navigator state has
`type: 'tab'`, not `'expo-tab'`, so the action-type rewrite in
`global-state/getNavigationAction.js:51-55` does not apply. Its router
handles `REPLACE` as a `JUMP_TO` that drops the previous history entry
(`react-navigation/routers/TabRouter.js:325-345`), and has no `POP_TO` case.
Measured: `router.dismissTo('/(tabs)')` from a cold `/event/<id>` changed
nothing and logged no error; `router.replace('/(tabs)')` worked.

---

## A jump INTO a tab's Stack arrives as a NAVIGATE without `pop` — it pushes a duplicate main page

**Read, 2026-10-14; measured, 2026-10-15.** A jump to another tab carries the
target screen as `params.screen`
(`global-state/stateUtils.js:10-30`). The tab's Stack turns that into
`CommonActions.navigate({ …, pop: route.params.pop })`
(`react-navigation/core/useNavigationBuilder.js:415-433`), and expo-router
never sets `pop`. A NAVIGATE without `pop` to a screen that is not on top
pushes a new copy (`react-navigation/routers/StackRouter.js:186-195`, kept by
expo-router's override, `layouts/StackClient.js:84-104`).

**Consequence.** Landing on a tab's main page must pop that tab's Stack FIRST
(`POP_TO_TOP` aimed at its key), then jump — `useGoToMain` in
`lib/navigation.ts`.

---

## `replace` / `navigate` to `(tabs)` from a root-Stack screen mounts a SECOND `(tabs)`

**Measured by console probe, 2026-10-14 (against `d2de327`).** With
`settings/*` pushed over `(tabs)` in the root Stack,
`router.replace('/(tabs)/me')` and `router.navigate('/(tabs)')` each left two
`(tabs)` routes in the root Stack (`#XOFn` over `#nCCx`; `#dYkh` over
`#jVsK`). `router.dismissTo` is `POP_TO` (`global-state/router.js:77-78`): it
pops back to the existing `(tabs)` (same key), and with nothing beneath it,
replaces the current screen (`react-navigation/routers/StackRouter.js:334-376`).

Still live: checkout → `replace('/published')` is this shape and mounts a
second `(tabs)` (measured 2026-10-15; tracker).

---

## The first history entry holds the keyless URL-parsed state

**Read and measured, 2026-10-20.** expo-router's `store.state` starts as the
state parsed from the URL (`global-state/useStore.js:65`) and is handed to
`NavigationContainer` as `initialState` (`ExpoRoot.js:135`). React Navigation
does not fire `onStateChange` on first mount
(`react-navigation/core/BaseNavigationContainer.js:305-306`), so
`store.state` stays that parse. `useLinking` writes the first history entry
from it (`fork/useLinking.js:268-287`). Measured on a cold `/`: record 0's
state WAS `store.state` (same object), every route `NOKEY`, Explore branch
only. A browser traversal to that entry resets with it
(`fork/useLinking.js:161-165`), and rehydration gives every keyless route a
new key (`react-navigation/routers/StackRouter.js:81`), so every screen
remounts.

Any state change after mount makes `onStateChange` rewrite the current entry
with the keyed state (`fork/useLinking.js:359`, :365). That is why cold
`/event/<id>` was already immune (`TabStack`'s param strip is such a change),
and it is how `ColdEntryHistoryFix` (`app/_layout.tsx`) fixes the rest.
Upstream: expo/expo#50317 (Sep 27 comment), #45588.

---

## Generated typed routes can be stale, so `tsc` can pass falsely

**Observed, 2026-10-20.** With `experiments.typedRoutes`, the dev server
regenerates `.expo/types/router.d.ts` from the route tree. After the per-tab
restructure, prompts 2 and 3 reported `tsc` clean; on 2026-10-20, with the
types regenerated, `tsc` failed at that same HEAD (`8f08034`) —
`lib/navigation.ts` still passed `'/(tabs)'`, no longer a typed route.
Runtime was unaffected (the group path still resolved).

**Consequence.** A `tsc` result after a route move counts only once the
dev server has regenerated the types against the current tree (CLAUDE.md →
"Name the verification baseline").
