// Organizer Profile — the PUBLIC host page and the anonymous-browse backlink
// target. Reached from an event's Organizer block and from the host's own
// Workspace screen.
//
// Root Stack, sibling of event/[id]: both are deep-linkable public content
// pages, and consistency between them beats the create-flow chrome rule, which
// is scoped to that flow. (Whether a cold deep-link arrival should get a tab
// bar is parked and applies to event/[id] identically — not decided here.)
//
// DATA: one call to `organizer_profile` (0023), anon-callable. The RPC already
// does the work this screen must not redo:
//   • archived and deleted events are filtered out SERVER-side, explicitly —
//     NOT via events_select_public, whose member branch would show a host their
//     own archived events here and whose 0022 attendee-history branch would
//     resurface an archived event for a visitor who happened to save it;
//   • anonymous Curbside posts are excluded entirely, because listing one under
//     the organizer's name would deanonymize it;
//   • past is capped at 50, most-recent-first.
// So this screen sorts nothing and filters nothing. If a future change needs
// different events, it belongs in the RPC.
//
// CONSUMER-FACING DATA ONLY (locked EventStub rule): no tier, no publish fee,
// no host economics. The payload carries tier_id; FeedEvent has no such field
// and it is deliberately never mapped.
//
// LOGO: placeholder always. `logo_path` has no storage bucket behind it, so it
// is read and ignored; the fallback is the Me hub's gradient-initials chip.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { GradientFill, SecondaryButton } from '../../../components/AuthControls';
import EventStub, { type FeedEvent } from '../../../components/EventStub';
import { useAuth } from '../../../lib/auth';
import { useEngagement } from '../../../lib/engagement';
import { socialUrl, type SocialPlatform } from '../../../lib/socialLinks';
import { supabase } from '../../../lib/supabase';
import { SOCIAL_FIELDS, useMyWorkspace } from '../../../lib/workspace';
import { brand, useTheme } from '../../../theme';

type Theme = ReturnType<typeof useTheme>;

/** One event as `organizer_profile` returns it. No organizer_name (it is the
 * same organizer for every row) and no distance_miles (this surface has no
 * origin) — both supplied or omitted when mapping to FeedEvent. */
interface ProfileEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  entry_fee_cents: number;
  rsvp_count: number;
  categories: string[] | null;
}

interface OrganizerProfile {
  id: string;
  name: string;
  bio: string | null;
  location_text: string | null;
  website: string | null;
  socials: Record<string, string>;
  logo_path: string | null;
  upcoming: ProfileEvent[];
  past: ProfileEvent[];
}

/** Up to two uppercase initials, the Me hub's derivation. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * DOMAIN ONLY for display. The previous version stripped the protocol and kept
 * everything else, so a real stored URL with a path and a query string
 * (`www.walmart.com/gic?type=gepa&storeId=1411&…`) ran off the side of a phone.
 * A visitor reads a link button to learn WHERE it goes, and the host answers
 * that; the tracking parameters answer nothing and cost the whole layout.
 *
 * Deliberately string surgery rather than `new URL()`: the server stores any
 * string up to 200 chars and does not require a scheme, so a value that URL()
 * would throw on is perfectly storable. This is total by construction.
 */
function prettyUrl(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0];
}

/**
 * The website's href. The stored value may have no scheme — nothing on the
 * server requires one — and `Linking.openURL('example.com')` has no protocol to
 * open. Same defect class as the social links this change is fixing.
 */
function websiteHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** The brand mark for each platform. Ionicons carries all four in its `logo-*`
 * namespace — `logo-x` is the X Corp mark, a different glyph from both
 * `logo-twitter` (the retired bird) and `close` (the ✕ shape) — so this needs
 * no new dependency and no hand-drawn SVG.
 *
 * Rendered MONOCHROME in the theme's text color, and that is a trademark
 * decision rather than an aesthetic one: Meta, TikTok and X all permit their
 * mark as a single-color UI element but prohibit recoloring it. Our own system
 * would happily allow brand orange on an icon — it is not ours to apply to
 * someone else's mark. */
const SOCIAL_GLYPH: Record<string, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  tiktok: 'logo-tiktok',
  x: 'logo-x',
};

/**
 * One social brand chip. ICON-ONLY, which is what lets four of them sit in a
 * row on a phone where four text pills wrapped onto three lines.
 *
 * Icon-only means the label has to be carried by `accessibilityLabel` — the
 * glyph is a font character and a screen reader announces nothing useful from
 * it, so without this the row is four unlabelled buttons.
 *
 * 44x44 is the floor, not the aesthetic target: it is the minimum comfortable
 * touch target, and the glyph inside is sized well under it so the mark keeps
 * its clear space.
 */
function SocialIconLink({
  theme,
  label,
  glyph,
  url,
}: {
  theme: Theme;
  label: string;
  glyph: keyof typeof Ionicons.glyphMap;
  url: string | null;
}) {
  const active = url !== null;
  return (
    <Pressable
      onPress={() => url && Linking.openURL(url)}
      disabled={!active}
      accessibilityRole="link"
      accessibilityState={{ disabled: !active }}
      // Icon-only: this string IS the button's name.
      accessibilityLabel={active ? label : `${label} — link unavailable`}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: theme.radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderStrong,
        backgroundColor: pressed && active ? theme.colors.surfaceHover : theme.colors.cardBg,
        opacity: active ? 1 : 0.4,
      })}
    >
      <Ionicons name={glyph} size={20} color={theme.colors.text} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Header — logo chip + name + location + bio, then the secondary link row.
// ---------------------------------------------------------------------------
function ProfileHeader({ theme, profile }: { theme: Theme; profile: OrganizerProfile }) {
  // Driven by SOCIAL_FIELDS rather than Object.entries, for two reasons: the
  // order becomes the locked display order instead of whatever order the jsonb
  // happened to serialize in, and an unrecognised key can no longer reach the
  // glyph map. (0024 already restricts the key set server-side; this means the
  // UI does not depend on that holding.)
  const socialEntries = SOCIAL_FIELDS.map(({ key, label }) => ({
    key,
    label,
    value: (profile.socials ?? {})[key] ?? '',
  })).filter((s) => s.value.trim().length > 0);

  return (
    <View style={{ marginBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {/* Placeholder always — logo_path has no pipeline behind it yet. Same
            anatomy as the Me hub's avatar so the two read as one system. */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows.cta,
          }}
        >
          <GradientFill />
          <Text
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 24,
              letterSpacing: -0.24,
              color: brand.navy,
            }}
          >
            {initialsOf(profile.name) || '·'}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: theme.fonts.bodySemiBold,
              fontSize: theme.fontSizes.eyebrow,
              fontWeight: '900',
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: brand.brightOrange,
            }}
          >
            Organizer
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 22,
              letterSpacing: -0.22,
              color: theme.colors.text,
              marginTop: 2,
            }}
          >
            {profile.name}
          </Text>
          {!!profile.location_text && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
              <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: theme.fonts.bodyMedium,
                  fontSize: 13,
                  color: theme.colors.textMuted,
                }}
              >
                {profile.location_text}
              </Text>
            </View>
          )}
        </View>
      </View>

      {!!profile.bio && (
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.bodySm,
            lineHeight: 21,
            color: theme.colors.textMuted,
            marginTop: 16,
          }}
        >
          {profile.bio}
        </Text>
      )}

      {/* Secondary outline, never gradient: the gradient is reserved for host
          and monetization ACTIONS, and an outbound link is neither.
          The website keeps its text button (a domain is the point of it) and
          the socials became icon chips beside it — four marks in one row, where
          four text pills wrapped and the labels were raw jsonb keys anyway. */}
      {(!!profile.website || socialEntries.length > 0) && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            marginTop: 18,
          }}
        >
          {!!profile.website && (
            // No minWidth and no flex: the button now sizes to a domain, and a
            // fixed floor is what let the old full-URL label push the row wide.
            <SecondaryButton onPress={() => Linking.openURL(websiteHref(profile.website as string))}>
              {prettyUrl(profile.website)}
            </SecondaryButton>
          )}
          {/* The icons are their OWN non-wrapping row nested in the wrapping
              one, so the group is atomic: at a width where everything fits they
              sit beside the website button, and where it doesn't the four drop
              together rather than three staying put and the fourth stranded on
              the next line by itself. Measured at 375pt: the four chips are
              206pt against 327pt of content width, so they always share a line
              with each other — it is the website pill they cannot also fit
              beside. */}
          {socialEntries.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {socialEntries.map(({ key, label, value }) => (
                <SocialIconLink
                  key={key}
                  theme={theme}
                  label={label}
                  glyph={SOCIAL_GLYPH[key]}
                  // ONE definition of "where does this handle point", shared
                  // with the editor's test button. Two implementations would
                  // mean the host could verify a link that the public page then
                  // builds differently, which makes the test button theater.
                  url={socialUrl(key as SocialPlatform, value)}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
export default function OrganizerProfileScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();

  // WHO IS ALLOWED TO EDIT THIS PAGE. No new read path: `useMyWorkspace` is the
  // existing own-rows `memberships` query the Workspace screen and the editor
  // already run, and `role` here is the SAME `memberships.role` that
  // `app.is_member(ws, ['owner','editor'])` gates `update_workspace_profile`
  // with (0024) — so the control cannot appear for anyone the RPC would refuse.
  //
  // ANONYMOUS IS STRUCTURALLY SAFE, not merely filtered: the hook short-circuits
  // on a null user id and never issues the query at all, so `workspaces` is null
  // for a signed-out visitor and `canEdit` is false before any row is consulted.
  // The `id` match matters as much as the role — a host viewing SOMEONE ELSE'S
  // profile is a member of a workspace, just not this one.
  const { workspaces: myWorkspaces } = useMyWorkspace();
  const canEdit = !!myWorkspaces?.some((w) => w.id === id && w.role !== 'viewer');

  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Session-only and collapsed by default — the same contract as Saved's and
  // Workspace's Past sections.
  const [pastOpen, setPastOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data, error: rpcError } = await supabase.rpc('organizer_profile', {
      workspace_id: id,
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    // Zero rows is the RPC's 404: a real workspace always yields exactly one.
    const row = ((data ?? []) as OrganizerProfile[])[0] ?? null;
    setError(null);
    setNotFound(row === null);
    setProfile(row);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
      refresh();
    }, [load, refresh]),
  );

  // Anonymous engagement taps invite an account rather than failing — the same
  // progressive gating Explore uses. The feed never gates; neither does this.
  const gated = useCallback(
    (action: () => void) => () => {
      if (session) action();
      else router.push({ pathname: '/auth', params: { mode: 'signup' } });
    },
    [session],
  );

  const toFeedEvent = useCallback(
    (e: ProfileEvent): FeedEvent => ({
      id: e.id,
      title: e.title,
      // The RPC omits organizer_name — one organizer for the whole page — so
      // it comes from the header. Same as the Workspace listings.
      organizer_name: profile?.name ?? null,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      venue_name: e.venue_name,
      entry_fee_cents: e.entry_fee_cents,
      rsvp_count: (e.rsvp_count ?? 0) + rsvpDelta(e.id),
      categories: e.categories,
      // distance_miles deliberately absent: no origin on this surface.
    }),
    [profile?.name, rsvpDelta],
  );

  const upcoming = useMemo(
    () => (profile?.upcoming ?? []).map(toFeedEvent),
    [profile?.upcoming, toFeedEvent],
  );
  const past = useMemo(
    () => (profile?.past ?? []).map(toFeedEvent),
    [profile?.past, toFeedEvent],
  );

  const renderStub = (e: FeedEvent) => (
    <EventStub
      key={e.id}
      event={e}
      variant="compact"
      saved={savedIds.has(e.id)}
      going={goingIds.has(e.id)}
      onToggleSave={gated(() => toggleSave(e.id))}
      onToggleGoing={gated(() => toggleRsvp(e.id))}
      onTap={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
    />
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Back chip only — no eyebrow here, the profile header carries it.
          GEOMETRY MATCHES EVENT DETAIL'S FLOATING BACK CHIP: 40x40 at radius
          12, top edge at 12, inset 20. Event Detail's cannot move — it is
          absolutely positioned over the photo hero and paired with the Save
          chip — so this one aligns to it, and the control stays put when a
          visitor goes from a ticket to the organizer behind it.
          The STYLE is deliberately not copied: Event Detail's chip is
          translucent dark with a white glyph because it sits on a photograph,
          and the same treatment here would be a dark blob on a plain
          background. Same place, same size, readable in both contexts. */}
      <View
        style={{
          // Mirrors Event Detail's floating header container exactly —
          // alignSelf-centred at maxWidth 640 with a 20 inset — so the chip
          // lands on the same x at every width. Insetting 20 from a FULL-width
          // container instead would align only on phones and drift 320px apart
          // on desktop, which is precisely the jump this is meant to remove.
          alignSelf: 'center',
          width: '100%',
          maxWidth: 640,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={back}
          accessibilityLabel="Back"
          hitSlop={4}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.iconChipBg,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
          }}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
        </Pressable>

        {/* THE EDIT AFFORDANCE LIVES ON THE PROFILE, for owners and editors
            only. One page with a control the people who can edit it can see,
            rather than two sibling rows in Workspace — the second row was a
            menu entry for a page that can carry its own verb.
            Labelled, not a bare pencil: it is the only host action on an
            otherwise entirely consumer-facing page, and it should not have to
            be guessed at. Secondary treatment, never gradient — the gradient is
            reserved for actions, and this is navigation to a form. Same 40pt
            height and radius as the back chip, so the row reads as one pair. */}
        {canEdit && (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/workspace/edit', params: { id } })
            }
            accessibilityRole="link"
            accessibilityLabel="Edit public profile"
            hitSlop={4}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              height: 40,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: theme.colors.iconChipBg,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.text} />
            <Text
              style={{
                fontFamily: theme.fonts.bodySemiBold,
                fontSize: theme.fontSizes.bodySm,
                fontWeight: '700',
                color: theme.colors.text,
              }}
            >
              Edit profile
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 48,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {error ? (
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 13,
              lineHeight: 19,
              color: theme.colors.danger,
              paddingVertical: 24,
            }}
          >
            Couldn&apos;t load this organizer: {error}
          </Text>
        ) : notFound ? (
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 13,
              color: theme.colors.textMuted,
              paddingVertical: 24,
            }}
          >
            This organizer isn&apos;t available.
          </Text>
        ) : profile === null ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={brand.brightOrange} />
          </View>
        ) : (
          <>
            <ProfileHeader theme={theme} profile={profile} />

            {upcoming.length === 0 && past.length === 0 ? (
              // The profile header still stands: an organizer with nothing
              // listed is a real organizer, not an error.
              <Text
                style={{
                  fontFamily: theme.fonts.bodyMedium,
                  fontSize: 13,
                  color: theme.colors.textFaint,
                  paddingVertical: 8,
                }}
              >
                No public events right now.
              </Text>
            ) : (
              <View style={{ gap: 26 }}>
                {upcoming.length > 0 && (
                  <View>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fonts.displayBlack,
                          fontWeight: '900',
                          fontSize: 13,
                          letterSpacing: 1.8,
                          textTransform: 'uppercase',
                          color: brand.brightOrange,
                        }}
                      >
                        Upcoming
                      </Text>
                      <Text
                        style={{
                          fontFamily: theme.fonts.displayExtraBold,
                          fontSize: 11,
                          color: theme.colors.textFaint,
                        }}
                      >
                        {upcoming.length}
                      </Text>
                      <View
                        style={{ flex: 1, height: 1, backgroundColor: 'rgba(252,163,17,0.25)' }}
                      />
                    </View>
                    <View style={{ gap: 16 }}>{upcoming.map(renderStub)}</View>
                  </View>
                )}

                {/* PAST — muted rather than brand-orange, collapsed by default:
                    a reference drawer, not a section competing for attention.
                    Server already ordered it most-recent-first and capped it. */}
                {past.length > 0 && (
                  <View>
                    <Pressable
                      onPress={() => setPastOpen((o) => !o)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: pastOpen }}
                      accessibilityLabel={`Past, ${past.length} ${past.length === 1 ? 'event' : 'events'}`}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingVertical: 6,
                        marginBottom: pastOpen ? 13 : 0,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fonts.displayBlack,
                          fontWeight: '900',
                          fontSize: 13,
                          letterSpacing: 1.8,
                          textTransform: 'uppercase',
                          color: theme.colors.textMuted,
                        }}
                      >
                        Past
                      </Text>
                      <Text
                        style={{
                          fontFamily: theme.fonts.displayExtraBold,
                          fontSize: 11,
                          color: theme.colors.textFaint,
                        }}
                      >
                        {past.length}
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
                      <Ionicons
                        name={pastOpen ? 'chevron-up' : 'chevron-down'}
                        size={15}
                        color={theme.colors.textFaint}
                      />
                    </Pressable>
                    {pastOpen && <View style={{ gap: 16 }}>{past.map(renderStub)}</View>}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
