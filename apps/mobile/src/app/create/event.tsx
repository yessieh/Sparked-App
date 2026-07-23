// Paid Event wizard — 5 steps: Basics → When/Where → Tier → Details → Review
// → mock checkout. All state lives in this parent, so steps persist both
// directions and back-navigation never clears. That parent-owned state is also
// what makes the locked Standard↔Plus rule true by construction: switching
// tier touches `tier` and nothing else, so no entered field can be lost.
//
// STEP ORDER IS LOAD-BEARING (moved 2026-07-16, session-3 QA). Tier sits
// between When/Where and Details because it is sandwiched by two real
// dependencies: its band price needs the dates (so it must follow When/Where),
// and Details' photo cap needs the tier (so it must precede Details). With
// Tier after Details, a host picked photos under Standard's cap of 3, upgraded
// to Plus, and was never shown the 7 slots they just bought.
//
// Pricing: duration-band totals from `tier_prices` (DB), shown as ONE clean
// total — per-day pricing is dead. The displayed price is DISPLAY ONLY;
// publish_paid_event (0010) re-reads tier_prices server-side and stamps
// publish_fee_cents itself.
//
// Fee vocabulary, kept distinct everywhere (SCHEMA LOCK 1):
//   entry_fee_cents   = what ATTENDEES pay. Consumer surfaces show this.
//   publish_fee_cents = what the HOST pays Sparked. Review + checkout only —
//                       it never reaches a card, a detail page, or a preview.
//
// Scope this session: NO real Stripe, NO site-map/vendors/amenities section,
// NO refund/cancellation flows, NO Workspace listings screen, NO real uploads.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { FormField, GradientButton, GradientFill, SecondaryButton } from '../../components/AuthControls';
import EventDetailView, { type EventDetailData, placeholderPhotos } from '../../components/EventDetailView';
import EventStub, { type FeedEvent } from '../../components/EventStub';
import MarkdownText from '../../components/MarkdownText';
import SiteMap from '../../components/SiteMap';
import { DateField, TimeField, format12h } from '../../components/pickers';
import { useAuth } from '../../lib/auth';
import { geocode, toWktPoint } from '../../lib/geocode';
import { canonicalize, isBlocked, suggestMatches, titleCase } from '../../lib/moderation';
import {
  DEFAULT_VENDOR_TYPE,
  VENDOR_TYPES,
  type Vendor,
  vendorInsert,
} from '../../lib/vendors';
import {
  TIER_COPY,
  WIZARD_TIERS,
  type Tier,
  type TierId,
  type TierPrice,
  bandLabel,
  bandName,
  eventDays,
  formatUSD,
  priceCents,
} from '../../lib/pricing';
import { supabase } from '../../lib/supabase';
import { getOrCreateWorkspace } from '../../lib/workspace';
import { brand, breakpoints, useTheme } from '../../theme';
import { categoryColor } from '../../theme/categoryColors';
import { SubHeader } from './index';

const STEPS = ['Basics', 'When & Where', 'Tier', 'Details', 'Review'] as const;
const TIER_STEP = STEPS.indexOf('Tier');
const DETAILS_STEP = STEPS.indexOf('Details');
const REVIEW_STEP = STEPS.length - 1;
const CATEGORY_SOFT_CAP = 4; // gentle warning at the 4th selection (uncapped)

function todayYMD(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Local wall-clock date + 24h time → UTC ISO (single source of truth). */
function combine(ymd: string, hhmm: string): string {
  return new Date(`${ymd}T${hhmm}:00`).toISOString();
}

interface Category {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Step-bar indicator — gradient fill through the current step.
// ---------------------------------------------------------------------------
function StepBar({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
      {STEPS.map((s, i) => (
        <View key={s} style={{ flex: 1, height: 4, borderRadius: 9999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.10)' }}>
          {i <= step && <GradientFill />}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Collapsible live-preview rail (steps 0–3). Review shows the full stub.
// ---------------------------------------------------------------------------
function PreviewRail({ event }: { event: FeedEvent }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.cardBg, overflow: 'hidden', marginBottom: 8 }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
        <View style={{ width: 4, height: 26, borderRadius: 9999, overflow: 'hidden' }}>
          <GradientFill />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', color: theme.colors.textFaint }}>
            Live preview
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 13, color: theme.colors.text }}>
            {event.title}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={theme.colors.textFaint} />
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
          <EventStub event={event} />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Description — markdown field + Bold / Italic / bullet toolbar (locked spec).
// Literal **markers** stay visible while typing here (accepted); Review and
// the full-listing preview render it formatted through MarkdownText.
// ---------------------------------------------------------------------------
function DescriptionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const sel = useRef({ start: value.length, end: value.length });

  // WEB SELECTION BUG this fixes: pressing a toolbar Pressable blurs the
  // <textarea>, and react-native-web fires onSelectionChange on that blur with
  // a COLLAPSED range — clobbering sel.current before onPress runs. wrap() then
  // saw no selection and dropped stray markers at offset 0 ("no visible change /
  // stale offsets"). A textarea preserves selectionStart/End across blur, so on
  // web we read the live range straight off the DOM node instead of the ref.
  // Native has no blur-on-press and no DOM node, so it keeps using sel.current.
  const readSelection = () => {
    if (Platform.OS === 'web') {
      const node = inputRef.current as unknown as {
        selectionStart?: number | null;
        selectionEnd?: number | null;
      } | null;
      if (node && typeof node.selectionStart === 'number' && typeof node.selectionEnd === 'number') {
        return { start: node.selectionStart, end: node.selectionEnd };
      }
    }
    return sel.current;
  };
  // One-shot caret placement after a toolbar insert. THE BUG this fixes:
  // sel.current only moved on a real selection event, so a programmatic
  // insert left it pointing at pre-insert offsets — press Bold then Italic
  // and the second marker landed inside the first, producing `***` mush.
  // Setting this briefly controls the caret; the resulting selection event
  // clears it, handing the field back to the platform.
  const [forcedSel, setForcedSel] = useState<{ start: number; end: number } | null>(null);

  const place = (pos: number) => {
    sel.current = { start: pos, end: pos };
    setForcedSel({ start: pos, end: pos });
    // Web: the press blurred the field, so refocus it — otherwise the caret we
    // just placed is invisible and the next keystroke goes nowhere the host can
    // see. The selection prop (forcedSel) lands the caret; focus makes it live.
    if (Platform.OS === 'web') inputRef.current?.focus?.();
  };

  /** Wrap the selection in `marker`. Empty selection → markers with the caret
   * parked between them, so whatever is typed next lands inside.
   *
   * NO NESTING: an empty press next to an existing asterisk is ignored. The
   * locked subset has no bold+italic, and more importantly a run of 3+
   * asterisks MIS-PAIRS in MarkdownText — "note: ****** real text **bold**"
   * pairs the stray run's tail with the next marker and bolds " real text "
   * instead, destroying the host's real formatting. Cheapest place to stop
   * that is at the source. */
  const wrap = (marker: string) => {
    const { start, end } = readSelection();
    const selected = value.slice(start, end);
    if (!selected && (value[start - 1] === '*' || value[start] === '*')) return;
    onChange(`${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`);
    place(selected ? start + marker.length + selected.length + marker.length : start + marker.length);
  };

  const bullet = () => {
    const { start } = readSelection();
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    onChange(`${value.slice(0, lineStart)}- ${value.slice(lineStart)}`);
    place(start + 2); // "- " shifts everything after lineStart right by two
  };

  // Glyphs, not icons: the previous pair ("text" / "text-outline") both drew
  // an "Aa", so Bold and Italic were visually indistinguishable. B / I / •
  // are self-describing. No underline button — underline is outside the
  // locked markdown subset (bold, italic, "- " bullets only).
  const ToolBtn = ({
    label,
    glyph,
    style,
    onPress,
  }: {
    label: string;
    glyph: string;
    style?: { fontWeight?: '400' | '900'; fontStyle?: 'italic' | 'normal' };
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        width: 34,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.iconChipBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.displayBlack,
          fontSize: 14,
          lineHeight: 18,
          color: theme.colors.text,
          fontWeight: style?.fontWeight ?? '900',
          fontStyle: style?.fontStyle ?? 'normal',
        }}
      >
        {glyph}
      </Text>
    </Pressable>
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
        <ToolBtn label="Bold" glyph="B" onPress={() => wrap('**')} />
        <ToolBtn label="Italic" glyph="I" style={{ fontWeight: '400', fontStyle: 'italic' }} onPress={() => wrap('*')} />
        <ToolBtn label="Bullet list" glyph="•" onPress={bullet} />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        selection={forcedSel ?? undefined}
        onChangeText={onChange}
        onSelectionChange={(e) => {
          sel.current = e.nativeEvent.selection;
          if (forcedSel) setForcedSel(null); // release control back to the field
        }}
        multiline
        placeholder="What should people know? Vendors, lineup, parking…"
        placeholderTextColor={theme.colors.textHint}
        style={{
          minHeight: 96,
          textAlignVertical: 'top',
          backgroundColor: theme.colors.cardBg,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          borderRadius: theme.radii.lg - 2,
          paddingVertical: 13,
          paddingHorizontal: 15,
          fontFamily: theme.fonts.bodyMedium,
          fontSize: theme.fontSizes.bodySm,
          color: theme.colors.text,
        }}
      />
      <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, color: theme.colors.textFaint, marginTop: 6 }}>
        Bold, italic, and bullets only. Markdown is saved as typed.
      </Text>

      {/* Live preview — renders the SAME markdown through the SAME MarkdownText
          the Review + live listing use, so what the host sees here can't drift
          from what publishes. Absorbs the marker layer for non-technical hosts
          (they see the outcome, not the asterisks) without a rich-text editor;
          the true WYSIWYG editor is a tracked follow-up. Hidden while empty. */}
      {value.trim() ? (
        <View
          style={{
            marginTop: 12,
            padding: 13,
            borderRadius: theme.radii.lg - 2,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            backgroundColor: theme.colors.cardBg,
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.bodySemiBold,
              fontSize: 9,
              fontWeight: '900',
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: theme.colors.textFaint,
              marginBottom: 8,
            }}
          >
            Preview
          </Text>
          <MarkdownText value={value} />
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Category multi-select — pills off the canonical table (Curbside excluded),
// uncapped with a gentle warning at the 4th selection.
// ---------------------------------------------------------------------------
function CategoryPicker({
  categories,
  selected,
  onToggle,
  warn,
}: {
  categories: Category[];
  selected: string[];
  onToggle: (id: string) => void;
  warn: boolean;
}) {
  const theme = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categories.map((c) => {
          const active = selected.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => onToggle(c.id)}
              accessibilityLabel={c.label}
              accessibilityState={{ selected: active }}
              style={{
                borderRadius: 9999,
                overflow: 'hidden',
                borderWidth: active ? 0 : 1,
                borderColor: theme.colors.borderStrong,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              {active && <GradientFill />}
              <Text
                style={{
                  fontFamily: theme.fonts.bodySemiBold,
                  fontWeight: '800',
                  fontSize: 12.5,
                  color: active ? brand.navy : theme.colors.textMuted,
                }}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {warn && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
            padding: 11,
            borderRadius: 12,
            backgroundColor: 'rgba(252,163,17,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(252,163,17,0.45)',
          }}
        >
          <Ionicons name="sparkles" size={13} color={brand.brightOrange} />
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, fontWeight: '700', lineHeight: 16, color: brand.brightOrange, flex: 1 }}>
            Most events use 2–3 categories. More may crowd your card.
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Unified photo section — placeholder slots, first image = cover, tier cap.
// The cap is passed in, so it tracks the selected tier live.
// ---------------------------------------------------------------------------
function PhotoSection({ photos, cap, onChange }: { photos: number[]; cap: number; onChange: (p: number[]) => void }) {
  const theme = useTheme();
  const add = () => onChange([...photos, Date.now()]);
  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {photos.map((id, i) => (
        <View
          key={id}
          style={{
            width: '31.5%',
            aspectRatio: 1.3,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: 'rgba(129,140,248,0.18)',
            borderWidth: 1,
            // Over-cap slots read as at-risk rather than normal — the host is
            // being asked to choose which ones go.
            borderColor: i >= cap ? 'rgba(239,68,68,0.55)' : i === 0 ? 'rgba(252,163,17,0.45)' : theme.colors.cardBorder,
            justifyContent: 'flex-end',
            padding: 6,
          }}
        >
          <Pressable
            onPress={() => remove(i)}
            accessibilityLabel={`Remove photo ${i + 1}`}
            style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,11,20,0.72)' }}
          >
            <Ionicons name="close" size={11} color="#ffffff" />
          </Pressable>
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.6, color: i === 0 ? brand.brightOrange : theme.colors.textMuted }}>
            {i === 0 ? 'COVER' : `PHOTO ${i + 1}`}
          </Text>
        </View>
      ))}
      {photos.length < cap && (
        <Pressable
          onPress={add}
          accessibilityLabel="Add photo"
          style={{
            width: '31.5%',
            aspectRatio: 1.3,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(255,255,255,0.20)',
            backgroundColor: theme.colors.cardBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color={brand.brightOrange} />
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Site map & vendors — the Plus tier's second feature (site map + vendor pins).
// Collapsible, Details step, PLUS ONLY (the caller gates it; Standard renders
// nothing — no upsell nag beyond the tier card). The map image is a placeholder
// (same pattern as photos, ephemeral); only the vendor rows persist. Pins are
// placed by tapping the map with a vendor selected. Custom vendor TYPES use the
// shared substring-match + dedupe + blocklist pattern (lib/moderation).
// ---------------------------------------------------------------------------
function SiteMapVendors({
  vendors,
  onChangeVendors,
  siteMapOn,
  onToggleSiteMap,
  tint,
}: {
  vendors: Vendor[];
  onChangeVendors: (v: Vendor[]) => void;
  siteMapOn: boolean;
  onToggleSiteMap: (on: boolean) => void;
  tint: string;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoints.desktop;
  const [open, setOpen] = useState(false);
  const [vName, setVName] = useState('');
  const [vType, setVType] = useState('');
  const [vLogo, setVLogo] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // The canonical set a typed vendor type is matched against: the seed list
  // PLUS every type already used on THIS event, deduped case-insensitively.
  // Including the used ones is what stops "drink" becoming a second entry
  // beside an existing "Drink" — a near-match reuses the existing spelling.
  const typePool = useMemo(() => {
    const pool: string[] = [];
    for (const t of [...VENDOR_TYPES, ...vendors.map((v) => v.vendorType)]) {
      if (t && !pool.some((x) => x.toLowerCase() === t.toLowerCase())) pool.push(t);
    }
    return pool;
  }, [vendors]);

  const suggestions = suggestMatches(vType, typePool);

  const addVendor = () => {
    const name = vName.trim();
    if (!name) return;
    // Title-case first (so a genuinely new type saves as "Drink", not "drink"),
    // then canonicalize — the match is case-insensitive, so title-casing never
    // blocks a hit, and a hit returns the EXISTING spelling.
    const type = canonicalize(titleCase(vType), typePool) || DEFAULT_VENDOR_TYPE;
    // Blocklist gates the name AND the (possibly custom) type — the same guard
    // custom categories use — because both reach public surfaces.
    if (isBlocked(name) || isBlocked(type)) {
      setErr("That name or type isn't allowed. Please reword it.");
      return;
    }
    const next: Vendor[] = [...vendors, { name, vendorType: type, pinX: null, pinY: null, logo: vLogo }];
    onChangeVendors(next);
    setSelected(next.length - 1); // auto-select the new vendor to pin next
    setVName('');
    setVType('');
    setVLogo(false);
    setErr(null);
  };

  const removeVendor = (i: number) => {
    onChangeVendors(vendors.filter((_, idx) => idx !== i));
    setSelected((s) => (s === i ? null : s !== null && s > i ? s - 1 : s));
  };

  const placePin = (x: number, y: number) => {
    if (selected === null) return;
    onChangeVendors(vendors.map((v, idx) => (idx === selected ? { ...v, pinX: x, pinY: y } : v)));
  };

  const removeMap = () => {
    // Removing the map strips the pins it anchored (coords are meaningless
    // without it); the vendor rows themselves stay.
    onChangeVendors(vendors.map((v) => ({ ...v, pinX: null, pinY: null })));
    onToggleSiteMap(false);
    setSelected(null);
  };

  const sub = {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    color: theme.colors.textFaint,
  };

  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.cardBg, overflow: 'hidden' }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 }}>
        <Ionicons name="map-outline" size={17} color={brand.brightOrange} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 14, color: theme.colors.text }}>Site map &amp; vendors</Text>
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, color: theme.colors.textFaint, marginTop: 1 }}>
            {vendors.length} vendor{vendors.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Text style={{ ...sub, color: brand.brightOrange }}>Plus</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textFaint} />
      </Pressable>

      {open && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
          {/* "Better on desktop" note — MOBILE WIDTHS ONLY. On a desktop-width
              viewport the host is already on the machine it recommends, so the
              banner is nonsense there. Nothing is gated either way: the whole
              section stays fully usable at every width. */}
          {!isDesktop && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 11, borderRadius: 12, backgroundColor: 'rgba(252,163,17,0.08)', borderWidth: 1, borderColor: 'rgba(252,163,17,0.22)', marginBottom: 14 }}>
              <Ionicons name="desktop-outline" size={14} color={brand.brightOrange} style={{ marginTop: 1 }} />
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11.5, lineHeight: 16, color: '#ffd9a0', flex: 1 }}>
                These tools work best on desktop — you can finish on a computer anytime.
              </Text>
            </View>
          )}

          {!siteMapOn ? (
            <Pressable
              onPress={() => onToggleSiteMap(true)}
              accessibilityLabel="Upload site map image"
              style={{ height: 100, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.18)', backgroundColor: theme.colors.cardBg, alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Ionicons name="map" size={20} color={brand.brightOrange} />
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11, fontWeight: '800', color: theme.colors.textMuted }}>Upload site map image</Text>
            </Pressable>
          ) : (
            <View>
              <SiteMap vendors={vendors} tint={tint} onPlace={placePin} selectedIndex={selected} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, color: theme.colors.textFaint, flex: 1 }}>
                  {selected !== null && vendors[selected]
                    ? `Tap the map to pin ${vendors[selected].name}`
                    : 'Select a vendor below, then tap the map to pin it.'}
                </Text>
                <Pressable onPress={removeMap} accessibilityLabel="Remove site map">
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11, fontWeight: '800', color: theme.colors.textMuted }}>Remove map</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Text style={{ ...sub, marginTop: 18, marginBottom: 8 }}>Vendors</Text>
          {vendors.map((v, i) => {
            const pinned = v.pinX !== null && v.pinY !== null;
            const isSel = selected === i;
            return (
              <Pressable
                key={v.id ?? i}
                onPress={() => setSelected(isSel ? null : i)}
                accessibilityLabel={`${v.name}, ${v.vendorType}${pinned ? ', pinned' : ', not pinned'}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  backgroundColor: isSel ? 'rgba(252,163,17,0.08)' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: v.logo ? 'rgba(255,255,255,0.06)' : 'rgba(252,163,17,0.12)',
                    borderWidth: 1,
                    borderColor: v.logo ? theme.colors.cardBorder : 'rgba(252,163,17,0.28)',
                  }}
                >
                  {v.logo ? (
                    <Ionicons name="image-outline" size={13} color={theme.colors.textFaint} />
                  ) : (
                    <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 12, color: brand.brightOrange }}>
                      {(v.name[0] ?? '?').toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13, fontWeight: '700', color: theme.colors.text }}>{v.name}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, fontWeight: '600', color: theme.colors.textFaint, marginTop: 1 }}>{v.vendorType}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={pinned ? 'location' : 'location-outline'} size={12} color={pinned ? theme.colors.green : theme.colors.textFaint} />
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 10, fontWeight: '800', color: pinned ? theme.colors.green : theme.colors.textFaint }}>
                    {pinned ? 'Pinned' : isSel ? 'Tap map' : 'No pin'}
                  </Text>
                </View>
                <Pressable onPress={() => removeVendor(i)} accessibilityLabel={`Remove ${v.name}`} hitSlop={6} style={{ paddingLeft: 4 }}>
                  <Ionicons name="close" size={14} color={theme.colors.textFaint} />
                </Pressable>
              </Pressable>
            );
          })}

          {/* Add-vendor row: logo toggle · name · type · add. */}
          <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => setVLogo((l) => !l)}
              accessibilityLabel="Add vendor logo"
              style={{
                width: 42,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: vLogo ? 'rgba(252,163,17,0.16)' : theme.colors.iconChipBg,
                borderWidth: 1,
                borderStyle: vLogo ? 'solid' : 'dashed',
                borderColor: vLogo ? 'rgba(252,163,17,0.4)' : 'rgba(255,255,255,0.2)',
              }}
            >
              <Ionicons name={vLogo ? 'checkmark' : 'image-outline'} size={15} color={brand.brightOrange} />
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 7, fontWeight: '800', color: theme.colors.textFaint }}>logo</Text>
            </Pressable>
            <TextInput
              value={vName}
              onChangeText={setVName}
              placeholder="Vendor name"
              placeholderTextColor={theme.colors.textHint}
              style={{ flex: 1, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.bodySm, color: theme.colors.text }}
            />
            <TextInput
              value={vType}
              onChangeText={(t) => {
                setVType(t);
                if (err) setErr(null);
              }}
              placeholder="Type"
              placeholderTextColor={theme.colors.textHint}
              style={{ width: 88, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.bodySm, color: theme.colors.text }}
            />
            <Pressable
              onPress={addVendor}
              accessibilityLabel="Add vendor"
              style={{ width: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(252,163,17,0.14)', borderWidth: 1, borderColor: 'rgba(252,163,17,0.32)' }}
            >
              <Ionicons name="add" size={18} color={brand.brightOrange} />
            </Pressable>
          </View>

          {/* Type suggestions (substring match) — tap to fill. */}
          {suggestions.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setVType(s)}
                  style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 9999, borderWidth: 1, borderColor: theme.colors.borderStrong }}
                >
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, fontWeight: '700', color: theme.colors.textMuted }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {err && (
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11.5, color: theme.colors.danger, marginTop: 8 }}>{err}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tier card — ONE clean total for the draft's actual band ("4-day event · $20").
// No per-day math anywhere: the band IS the unit of price.
// ---------------------------------------------------------------------------
function TierCard({
  tier,
  price,
  days,
  selected,
  onPress,
}: {
  tier: Tier;
  price: number | null;
  days: number;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const isPlus = tier.id === 'plus';
  const copy = TIER_COPY[tier.id as 'standard' | 'plus'];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${tier.label} — ${price === null ? 'price unavailable' : formatUSD(price)}`}
      style={{
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: selected
          ? isPlus
            ? 'rgba(255,99,72,0.45)'
            : 'rgba(252,163,17,0.40)'
          : theme.colors.cardBorder,
        backgroundColor: selected
          ? isPlus
            ? 'rgba(255,99,72,0.08)'
            : 'rgba(252,163,17,0.07)'
          : theme.colors.cardBg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 16, color: selected ? brand.brightOrange : theme.colors.text }}>
          {tier.label}
        </Text>
        {isPlus && <Ionicons name="sparkles" size={13} color={brand.brightOrange} />}
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 18, color: theme.colors.text }}>
          {price === null ? '—' : formatUSD(price)}
        </Text>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 9999,
            borderWidth: 2,
            borderColor: selected ? brand.brightOrange : theme.colors.borderStrong,
            backgroundColor: selected ? brand.brightOrange : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <Ionicons name="checkmark" size={11} color={brand.navy} />}
        </View>
      </View>

      <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, lineHeight: 17.5, color: theme.colors.textMuted, marginTop: 6 }}>
        {copy.desc}
      </Text>

      {/* The ONE clean total — band, span, price. No "$5/day" anywhere. */}
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4, color: theme.colors.textFaint, marginTop: 8 }}>
        {bandName(days)} · {bandLabel(days)}
        {price === null ? '' : ` · ${formatUSD(price)} total`}
      </Text>

      <View style={{ marginTop: 12, gap: 6 }}>
        {copy.inheritsFrom && (
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11, fontWeight: '800', color: theme.colors.textMuted }}>
            Everything in {copy.inheritsFrom}, plus:
          </Text>
        )}
        {copy.features.map((f) => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="checkmark-circle-outline" size={13} color={brand.brightOrange} />
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11.5, color: theme.colors.textMuted, flex: 1 }}>
              {f}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12, color: theme.colors.textFaint }}>{label}</Text>
      <Text
        style={{
          fontFamily: strong ? theme.fonts.displayBlack : theme.fonts.bodySemiBold,
          fontWeight: strong ? '900' : '600',
          fontSize: strong ? 14 : 12.5,
          color: strong ? brand.brightOrange : theme.colors.text,
          flex: 1,
          textAlign: 'right',
        }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export default function EventWizard() {
  const theme = useTheme();
  const { session, loading } = useAuth();
  const [step, setStep] = useState(0);

  // ---- form state (persists across steps, back-nav, AND tier switches) ----
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(todayYMD());
  const [endDate, setEndDate] = useState(todayYMD());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<number[]>([]);
  // Plus site-map feature. `siteMap` = the placeholder image is "uploaded"
  // (ephemeral, like photos); `vendors` = the structured rows that persist.
  // Both live here so they survive step + back-nav + tier switches, exactly
  // like the rest of the wizard state.
  const [siteMap, setSiteMap] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [entryFeeOn, setEntryFeeOn] = useState(false);
  const [entryFee, setEntryFee] = useState('10');
  const [tier, setTier] = useState<TierId>('standard');
  const [catWarn, setCatWarn] = useState(false);
  const catWarnedRef = useRef(false); // fires exactly once per session

  // ---- tier/pricing data (canonical, from the DB) ----
  const [categories, setCategories] = useState<Category[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [prices, setPrices] = useState<TierPrice[]>([]);

  // ---- publish plumbing ----
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [reviewMap, setReviewMap] = useState(false); // Review card ↔ site-map toggle
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Blocks a Plus→Standard switch that would drop photos. The switch does NOT
   * happen while this is set — the host trims first (locked: warn and require
   * trimming, NEVER silently drop). */
  const [pendingDowngrade, setPendingDowngrade] = useState<TierId | null>(null);

  // Creating events is account territory (architecture lock #2: browsing is
  // anonymous, creating is not).
  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace({ pathname: '/auth', params: { mode: 'signup' } });
      return;
    }
    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        const name = profile?.display_name ?? session.user.email ?? 'My workspace';
        const ws = await getOrCreateWorkspace(session.user.id, name);
        setWorkspaceId(ws);
        const { data: wsRow } = await supabase.from('workspaces').select('name').eq('id', ws).single();
        setWorkspaceName(wsRow?.name ?? name);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [loading, session]);

  useEffect(() => {
    // Canonical taxonomy, Curbside excluded from the paid picker (locked).
    supabase
      .from('categories')
      .select('id,label,sort_order')
      .neq('id', 'curbside')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setCategories(data.map((c) => ({ id: c.id, label: c.label })));
      });
    // Tier structure + band prices: canonical, never hardcoded here.
    supabase
      .from('tiers')
      .select('id,label,sort_order,max_photos,allows_site_map,single_day_only')
      .in('id', WIZARD_TIERS)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setTiers(data as Tier[]);
      });
    supabase
      .from('tier_prices')
      .select('tier_id,duration_band,amount_cents')
      .then(({ data }) => {
        if (data) setPrices(data as TierPrice[]);
      });
  }, []);

  const toggleCat = useCallback((id: string) => {
    setCats((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = [...prev, id];
      if (next.length >= CATEGORY_SOFT_CAP && !catWarnedRef.current) {
        catWarnedRef.current = true;
        setCatWarn(true);
      }
      return next;
    });
  }, []);

  const days = eventDays(startDate, endDate);
  const feeCents = entryFeeOn ? Math.max(0, Math.round((parseFloat(entryFee) || 0) * 100)) : 0;
  const tierRow = tiers.find((t) => t.id === tier);
  const photoCap = tierRow?.max_photos ?? 3;
  const publishFeeCents = priceCents(prices, tier, days);
  const capFor = (id: TierId) => tiers.find((t) => t.id === id)?.max_photos ?? 3;

  /**
   * Tier switching. Preserves every entered field by construction — this only
   * ever writes `tier`. The one guarded direction is Plus→Standard while over
   * Standard's photo cap: refuse the switch, surface the trim requirement, and
   * let the effect below complete it once the host has chosen what to keep.
   */
  const selectTier = useCallback(
    (next: TierId) => {
      setError(null);
      if (next === tier) return;
      if (photos.length > capFor(next)) {
        setPendingDowngrade(next);
        return;
      }
      setPendingDowngrade(null);
      setTier(next);
    },
    [tier, photos.length, tiers],
  );

  // Trim satisfied → complete the switch the host already asked for.
  useEffect(() => {
    if (pendingDowngrade && photos.length <= capFor(pendingDowngrade)) {
      setTier(pendingDowngrade);
      setPendingDowngrade(null);
    }
  }, [pendingDowngrade, photos.length, tiers]);

  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;
  const startsAt = combine(startDate, startTime);
  const endsAt = combine(endDate, endTime);

  const preview: FeedEvent = useMemo(
    () => ({
      id: 'preview',
      title: title.trim() || 'Your event title',
      organizer_name: workspaceName || null,
      starts_at: startsAt,
      ends_at: endsAt,
      venue_name: venueName.trim() || address.trim() || null,
      // The CARD reads the attendee entry fee — never the publish fee.
      entry_fee_cents: feeCents,
      categories: cats.length ? cats : null,
    }),
    [title, startsAt, endsAt, venueName, address, feeCents, cats, workspaceName],
  );

  /** The draft as the real Event Detail sees it. Note publish_fee_cents has no
   * slot here at all — the consumer preview cannot leak host economics. */
  const previewDetail: EventDetailData = useMemo(
    () => ({
      id: 'preview',
      title: title.trim() || 'Your event title',
      description: desc.trim() || null,
      organizer_name: workspaceName || null,
      tier_id: tier,
      status: 'draft',
      starts_at: startsAt,
      ends_at: endsAt,
      venue_name: venueName.trim() || null,
      address: address.trim() || null,
      entry_fee_cents: feeCents,
      rsvp_count: 0,
      categories: cats.length ? cats : null,
      distance_miles: null,
      cancelled_at: null,
    }),
    [title, desc, workspaceName, tier, startsAt, endsAt, venueName, address, feeCents, cats],
  );

  const missing = [
    !title.trim() && 'a title',
    !address.trim() && 'an address',
  ].filter(Boolean) as string[];
  const canPublish = missing.length === 0 && !busy && publishFeeCents !== null;

  const back = () => {
    if (step === 0) {
      router.canGoBack() ? router.back() : router.replace('/create');
    } else {
      setStep((s) => s - 1);
    }
  };

  /**
   * Review CTA → mock checkout. Writes the draft row FIRST (status
   * pending_payment) so checkout has a real event to price and publish; the
   * fee column is deliberately left unset — publish_paid_event stamps it, and
   * the 0010 guard trigger would reject us if we tried.
   */
  const toCheckout = useCallback(async () => {
    if (!workspaceId || !canPublish) return;
    setBusy(true);
    setError(null);
    try {
      const point = await geocode(address.trim());
      // workspace_id is set ONCE at insert and is immutable: an event can never
      // change workspaces, so 0011 deliberately withholds it from
      // authenticated's UPDATE column grant. Resending it on a re-entry
      // .update() therefore fails with "permission denied for table events".
      // Keep it out of the editable payload and only spread it in on insert.
      const editable = {
        title: title.trim(),
        description: desc.trim() || null,
        tier_id: tier,
        status: 'pending_payment' as const,
        starts_at: startsAt,
        ends_at: endsAt,
        venue_name: venueName.trim() || null,
        address: address.trim(),
        location: toWktPoint(point),
        entry_fee_cents: feeCents,
      };

      // Re-entering checkout reuses the draft rather than littering rows.
      let id = draftId;
      if (id) {
        const { error: updateError } = await supabase.from('events').update(editable).eq('id', id);
        if (updateError) throw new Error(updateError.message);
        await supabase.from('event_categories').delete().eq('event_id', id);
      } else {
        const { data, error: insertError } = await supabase
          .from('events')
          .insert({ workspace_id: workspaceId, ...editable })
          .select('id')
          .single();
        if (insertError) throw new Error(insertError.message);
        id = data.id as string;
        setDraftId(id);
      }

      if (cats.length) {
        const { error: catError } = await supabase
          .from('event_categories')
          .insert(cats.map((c) => ({ event_id: id, category_id: c })));
        if (catError) throw new Error(catError.message);
      }

      // Vendors (Plus site-map feature). PLUS-GATED end to end: only a Plus
      // checkout touches event_vendors, so Standard/curbside checkout never
      // depends on this table (and never carries vendors — the consumer section
      // is Plus-gated too). Clear-then-insert like categories so a re-entry
      // replaces cleanly. (Consumer detail also gates on tier==='plus', so the
      // rare Plus→Standard-after-checkout leftover row stays invisible.)
      if (tier === 'plus') {
        await supabase.from('event_vendors').delete().eq('event_id', id);
        if (vendors.length) {
          const { error: vendorError } = await supabase
            .from('event_vendors')
            .insert(vendors.map((v, i) => vendorInsert(v, id as string, i)));
          if (vendorError) throw new Error(vendorError.message);
        }
      }

      router.push({ pathname: '/create/checkout', params: { eventId: id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [workspaceId, canPublish, address, title, desc, tier, startsAt, endsAt, venueName, feeCents, draftId, cats, vendors]);

  const next = () => {
    if (step < REVIEW_STEP) setStep((s) => s + 1);
    else toCheckout();
  };

  if (loading || !session) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={brand.brightOrange} />
      </View>
    );
  }

  // "Preview full listing" — the DRAFT through the REAL Event Detail
  // component, preview mode, no live actions (locked 2026-07-16).
  if (showPreview) {
    return (
      <EventDetailView
        event={previewDetail}
        preview
        photos={placeholderPhotos('preview', tier, categoryColor(cats), photos.length || 1)}
        vendors={vendors}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubHeader crumb={`Create · Step ${step + 1} of ${STEPS.length}`} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 24 }}>
          <StepBar step={step} />
          {step < REVIEW_STEP && <PreviewRail event={preview} />}

          {/* ---- STEP 0: BASICS ---- */}
          {step === 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles(theme).h2}>Basics</Text>
              <FormField label="Event title" value={title} onChangeText={setTitle} placeholder="e.g. Sunset Songwriters Round" />
              <Text style={styles(theme).fieldLabel}>Description</Text>
              <View style={{ marginBottom: 14 }}>
                <DescriptionEditor value={desc} onChange={setDesc} />
              </View>
              <Text style={styles(theme).fieldLabel}>Categories · {cats.length} selected</Text>
              <View style={{ marginBottom: 14 }}>
                <CategoryPicker categories={categories} selected={cats} onToggle={toggleCat} warn={catWarn} />
              </View>
            </View>
          )}

          {/* ---- STEP 1: WHEN & WHERE ---- */}
          {step === 1 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles(theme).h2}>When & Where</Text>

              <Text style={styles(theme).fieldLabel}>Date range · {bandLabel(days)}</Text>
              <View style={{ marginBottom: 6 }}>
                <DateField
                  value={startDate}
                  label="Starts"
                  min={todayYMD()}
                  onChange={(v) => {
                    setStartDate(v);
                    if (v > endDate) setEndDate(v); // End auto-follows an out-of-range Start
                  }}
                />
              </View>
              <View style={{ marginBottom: 14 }}>
                {/* End is independently controlled; min=startDate enforces End ≥ Start */}
                <DateField value={endDate} label="Ends" min={startDate} onChange={setEndDate} />
              </View>

              <Text style={styles(theme).fieldLabel}>Time · start → end</Text>
              <View style={{ gap: 8, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles(theme).timeTag}>START</Text>
                  <TimeField value={startTime} onChange={setStartTime} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles(theme).timeTag}>END</Text>
                  <TimeField value={endTime} onChange={setEndTime} />
                </View>
              </View>

              <FormField label="Venue name" value={venueName} onChangeText={setVenueName} placeholder="e.g. The Lola Loft" />
              <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Street address" autoComplete="street-address" />
            </View>
          )}

          {/* ---- STEP 2: TIER ---- (before Details: its band price needs the
               dates behind it, and Details' photo cap needs the tier ahead) */}
          {step === TIER_STEP && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles(theme).h2}>Tier</Text>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12.5, lineHeight: 19, color: theme.colors.textMuted, marginBottom: 16 }}>
                Per-event · pay once · not a subscription. Priced by how long your event runs —
                switching keeps everything you've entered.
              </Text>

              {tiers.length === 0 ? (
                <ActivityIndicator color={brand.brightOrange} />
              ) : (
                <View style={{ gap: 10 }}>
                  {tiers.map((t) => (
                    <TierCard
                      key={t.id}
                      tier={t}
                      price={priceCents(prices, t.id, days)}
                      days={days}
                      selected={tier === t.id}
                      onPress={() => selectTier(t.id)}
                    />
                  ))}
                </View>
              )}

              {/* Plus→Standard over cap: the switch is REFUSED until the host
                  picks what to keep. Photos are never dropped for them.
                  (Reachable only on backtrack now that Tier precedes Details —
                  photos don't exist yet on a first forward pass.) */}
              {pendingDowngrade && (
                <View
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.45)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name="alert-circle" size={15} color={theme.colors.danger} />
                    <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 13, color: theme.colors.danger }}>
                      Trim your photos to switch
                    </Text>
                  </View>
                  <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, lineHeight: 17.5, color: theme.colors.textMuted, marginBottom: 12 }}>
                    {tiers.find((t) => t.id === pendingDowngrade)?.label ?? 'Standard'} fits{' '}
                    {capFor(pendingDowngrade)} photos and you have {photos.length}. Remove{' '}
                    {photos.length - capFor(pendingDowngrade)} to keep — we won't choose for you.
                    You'll switch the moment you're under.
                  </Text>
                  <PhotoSection photos={photos} cap={capFor(pendingDowngrade)} onChange={setPhotos} />
                  <Pressable onPress={() => setPendingDowngrade(null)} style={{ marginTop: 12 }}>
                    <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12, fontWeight: '800', color: theme.colors.textMuted }}>
                      Never mind — stay on {tierRow?.label ?? 'Plus'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* ---- STEP 3: DETAILS ---- */}
          {step === DETAILS_STEP && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles(theme).h2}>Details</Text>
              <Text style={styles(theme).fieldLabel}>
                Photos · first is your cover · up to {photoCap} on {tierRow?.label ?? 'Standard'}
              </Text>
              <View style={{ marginBottom: 18 }}>
                <PhotoSection photos={photos} cap={photoCap} onChange={setPhotos} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: entryFeeOn ? 12 : 0 }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13.5, fontWeight: '800', color: theme.colors.text }}>Charge for entry</Text>
                  <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11.5, lineHeight: 16, color: theme.colors.textFaint, marginTop: 2 }}>
                    Shown on the card as the attendee entry fee.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setEntryFeeOn((v) => !v)}
                  accessibilityLabel="Charge for entry"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: entryFeeOn }}
                  style={{
                    width: 46,
                    height: 27,
                    borderRadius: 9999,
                    padding: 3,
                    justifyContent: 'center',
                    backgroundColor: entryFeeOn ? brand.sparkOrange : 'rgba(255,255,255,0.10)',
                  }}
                >
                  <View style={{ width: 21, height: 21, borderRadius: 11, backgroundColor: '#fff', transform: [{ translateX: entryFeeOn ? 19 : 0 }] }} />
                </Pressable>
              </View>
              {entryFeeOn && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 20, color: theme.colors.green }}>$</Text>
                  <View style={{ flex: 1 }}>
                    <FormField label="" value={entryFee} onChangeText={setEntryFee} placeholder="10" inputMode="decimal" keyboardType="decimal-pad" />
                  </View>
                  <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12.5, color: theme.colors.textFaint }}>per person</Text>
                </View>
              )}

              {/* Site map & vendors — PLUS ONLY (data-driven off the tier's
                  allows_site_map flag). Standard renders nothing here — the tier
                  card is the only upsell; no in-form nag (locked). */}
              {tierRow?.allows_site_map && (
                <View style={{ marginTop: 20 }}>
                  <SiteMapVendors
                    vendors={vendors}
                    onChangeVendors={setVendors}
                    siteMapOn={siteMap}
                    onToggleSiteMap={setSiteMap}
                    tint={categoryColor(cats)}
                  />
                </View>
              )}
            </View>
          )}

          {/* ---- STEP 4: REVIEW ---- */}
          {step === REVIEW_STEP && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles(theme).h2}>Review</Text>
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 10 }}>
                Live preview
              </Text>

              {/* Card ↔ Site map toggle — Plus events with vendors only. The
                  "map" is the SITE MAP (vendor diagram), NEVER a Google location
                  map (locked spec). */}
              {tier === 'plus' && vendors.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {(['card', 'map'] as const).map((m) => {
                    const active = (m === 'map') === reviewMap;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setReviewMap(m === 'map')}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 13,
                          paddingVertical: 7,
                          borderRadius: 9999,
                          borderWidth: 1,
                          borderColor: active ? 'rgba(252,163,17,0.45)' : theme.colors.cardBorder,
                          backgroundColor: active ? 'rgba(252,163,17,0.10)' : theme.colors.cardBg,
                        }}
                      >
                        <Ionicons
                          name={m === 'map' ? 'map-outline' : 'pricetag-outline'}
                          size={13}
                          color={active ? brand.brightOrange : theme.colors.textFaint}
                        />
                        <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12, fontWeight: '800', color: active ? brand.brightOrange : theme.colors.textMuted }}>
                          {m === 'map' ? 'Site map' : 'Card'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {reviewMap && tier === 'plus' && vendors.length > 0 ? (
                <SiteMap vendors={vendors} tint={categoryColor(cats)} />
              ) : (
                <EventStub event={preview} />
              )}

              <View style={{ marginTop: 12 }}>
                <SecondaryButton onPress={() => setShowPreview(true)}>Preview full listing</SecondaryButton>
              </View>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: theme.colors.textFaint, textAlign: 'center', marginTop: 8 }}>
                Opens your listing exactly as attendees will see it.
              </Text>

              {/* Description renders FORMATTED here — Review is a
                  "what buyers see" surface; raw asterisks would break it
                  (ruling 2026-07-16). Literal markers stay visible only in
                  the Basics editor while typing. */}
              {desc.trim() ? (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 8 }}>
                    Description
                  </Text>
                  <MarkdownText value={desc} />
                </View>
              ) : null}

              <View style={{ marginTop: 22 }}>
                <SummaryRow label="Title" value={title.trim() || '—'} />
                <SummaryRow label="Categories" value={cats.length ? cats.map(catLabel).join(', ') : '—'} />
                <SummaryRow
                  label="When"
                  value={`${days > 1 ? `${days} days` : 'Single day'} · ${format12h(startTime)}–${format12h(endTime)}`}
                />
                <SummaryRow label="Where" value={venueName.trim() || address.trim() || '—'} />
                <SummaryRow label="Photos" value={`${photos.length} of ${photoCap}`} />
                {/* ATTENDEE fee — this is the one that reaches consumers. */}
                <SummaryRow label="Entry fee (attendees pay)" value={feeCents > 0 ? `${formatUSD(feeCents)} per person` : 'Free'} />
                <SummaryRow label="Tier" value={tierRow?.label ?? '—'} />
                {/* HOST fee — Review + checkout only, never a consumer surface. */}
                <SummaryRow
                  label="Publish fee (you pay)"
                  value={publishFeeCents === null ? '—' : `${bandLabel(days)} · ${formatUSD(publishFeeCents)}`}
                  strong
                />
              </View>

              {missing.length > 0 && (
                <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: theme.colors.textFaint, marginTop: 14 }}>
                  Add {missing.join(' and ')} to continue. An address is what puts you on the
                  distance feed.
                </Text>
              )}
            </View>
          )}

          {error && (
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: theme.colors.danger, marginTop: 14 }}>
              {error}
            </Text>
          )}

          {/* ---- NAV ---- */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
            <View style={{ minWidth: 110 }}>
              <SecondaryButton onPress={back}>{step === 0 ? 'Cancel' : 'Back'}</SecondaryButton>
            </View>
            <View style={{ flex: 1 }}>
              <GradientButton onPress={next} busy={busy} disabled={step === REVIEW_STEP && !canPublish}>
                {step < REVIEW_STEP ? 'Continue' : 'Continue to payment'}
              </GradientButton>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: ReturnType<typeof useTheme>) => ({
  h2: {
    fontFamily: theme.fonts.displayBlack,
    fontWeight: '900' as const,
    fontSize: 20,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textMuted,
    marginBottom: 7,
  },
  timeTag: {
    width: 38,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1,
    color: theme.colors.textFaint,
  },
});
