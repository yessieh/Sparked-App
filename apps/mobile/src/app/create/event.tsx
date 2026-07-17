// Paid Event wizard — STRUCTURE (Create Event session 2). 4 steps
// Basics → When/Where → Details → Review, per the design-reference
// CreateEventScreen with doc-locks applied and the Curbside form's shared
// inputs (calendar DateField, typeable TimeField — SPARKED_STATE shared spec,
// US formats). All state lives in this parent, so steps persist both
// directions and back-navigation never clears (locked Standard↔Plus behavior).
//
// Scope this session: NO tier selection (draft defaults to Standard for photo
// caps only), NO checkout/publish, NO Plus-only site-map/vendors/amenities,
// NO real uploads. The Review CTA is a "checkout next build" placeholder.
//
// Description is markdown (SCHEMA_PLAN §10.6 lock) with a Bold/Italic/bullet
// toolbar — the RN-faithful realization of the reference's web contentEditable
// rich text (execCommand doesn't exist in RN; markdown is the storage lock).

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FormField, GradientButton, GradientFill, SecondaryButton } from '../../components/AuthControls';
import EventStub, { type FeedEvent } from '../../components/EventStub';
import MarkdownText from '../../components/MarkdownText';
import { DateField, TimeField, format12h } from '../../components/pickers';
import { supabase } from '../../lib/supabase';
import { brand, useTheme } from '../../theme';
import { SubHeader } from './index';

const STEPS = ['Basics', 'When & Where', 'Details', 'Review'] as const;
const DEFAULT_PHOTO_CAP = 3; // Standard tier fallback until tiers fetch lands
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

function eventDays(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${end || start}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}
const bandLabel = (days: number) => (days <= 1 ? 'Single-day event' : `${days}-day event`);

interface Category {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Step-bar indicator — 4 segments, gradient fill through the current step.
// ---------------------------------------------------------------------------
function StepBar({ step }: { step: number }) {
  const theme = useTheme();
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
// Collapsible live-preview rail (steps 0–2). Review shows the full stub.
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
// ---------------------------------------------------------------------------
function DescriptionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  const sel = useRef({ start: value.length, end: value.length });

  const wrap = (marker: string) => {
    const { start, end } = sel.current;
    const next = `${value.slice(0, start)}${marker}${value.slice(start, end)}${marker}${value.slice(end)}`;
    onChange(next);
  };
  const bullet = () => {
    const { start } = sel.current;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    onChange(`${value.slice(0, lineStart)}- ${value.slice(lineStart)}`);
  };

  const ToolBtn = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) => (
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
      <Ionicons name={icon} size={15} color={theme.colors.text} />
    </Pressable>
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
        <ToolBtn icon="text" label="Bold" onPress={() => wrap('**')} />
        <ToolBtn icon="text-outline" label="Italic" onPress={() => wrap('*')} />
        <ToolBtn icon="list" label="Bullet list" onPress={bullet} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSelectionChange={(e) => {
          sel.current = e.nativeEvent.selection;
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
            borderColor: i === 0 ? 'rgba(252,163,17,0.45)' : theme.colors.cardBorder,
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12, color: theme.colors.textFaint }}>{label}</Text>
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12.5, color: theme.colors.text, flex: 1, textAlign: 'right' }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function EventWizard() {
  const theme = useTheme();
  const [step, setStep] = useState(0);

  // ---- form state (persists across steps + back navigation) ----
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
  const [entryFeeOn, setEntryFeeOn] = useState(false);
  const [entryFee, setEntryFee] = useState('10');
  const [catWarn, setCatWarn] = useState(false);
  const catWarnedRef = useRef(false); // fires exactly once per session
  const [checkoutNote, setCheckoutNote] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [photoCap, setPhotoCap] = useState(DEFAULT_PHOTO_CAP);

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
    // Draft defaults to Standard: read its photo cap (no tier SELECTION here).
    supabase
      .from('tiers')
      .select('max_photos')
      .eq('id', 'standard')
      .single()
      .then(({ data }) => {
        if (data) setPhotoCap(data.max_photos);
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

  const preview: FeedEvent = useMemo(
    () => ({
      id: 'preview',
      title: title.trim() || 'Your event title',
      organizer_name: null,
      starts_at: combine(startDate, startTime),
      ends_at: combine(endDate, endTime),
      venue_name: venueName.trim() || address.trim() || null,
      entry_fee_cents: feeCents,
      categories: cats.length ? cats : null,
    }),
    [title, startDate, startTime, endDate, endTime, venueName, address, feeCents, cats],
  );

  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;

  const back = () => {
    if (step === 0) {
      router.canGoBack() ? router.back() : router.replace('/create');
    } else {
      setStep((s) => s - 1);
    }
  };
  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else setCheckoutNote(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubHeader crumb={`Create · Step ${step + 1} of ${STEPS.length}`} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 24 }}>
          <StepBar step={step} />
          {step < 3 && <PreviewRail event={preview} />}

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

          {/* ---- STEP 2: DETAILS ---- */}
          {step === 2 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles(theme).h2}>Details</Text>
              <Text style={styles(theme).fieldLabel}>Photos · first is your cover · up to {photoCap}</Text>
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
            </View>
          )}

          {/* ---- STEP 3: REVIEW ---- */}
          {step === 3 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles(theme).h2}>Review</Text>
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 10 }}>
                Live preview
              </Text>
              <EventStub event={preview} />

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
                <SummaryRow label="Entry" value={feeCents > 0 ? `$${(feeCents / 100).toFixed(2).replace(/\.00$/, '')} per person` : 'Free'} />
                <SummaryRow label="Tier" value="Standard (default this build)" />
              </View>

              {checkoutNote && (
                <View style={{ marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(252,163,17,0.10)', borderWidth: 1, borderColor: 'rgba(252,163,17,0.35)' }}>
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12.5, lineHeight: 18, color: brand.brightOrange }}>
                    Checkout — tier selection, duration-band pricing, and payment — lands in the
                    next build. Your entered details are all here and ready.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ---- NAV ---- */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
            <View style={{ minWidth: 110 }}>
              <SecondaryButton onPress={back}>{step === 0 ? 'Cancel' : 'Back'}</SecondaryButton>
            </View>
            <View style={{ flex: 1 }}>
              <GradientButton onPress={next}>
                {step < STEPS.length - 1 ? 'Continue' : 'Continue to payment'}
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
