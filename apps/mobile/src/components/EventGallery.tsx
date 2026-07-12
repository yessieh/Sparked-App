// Event Detail photo gallery — 1–3 images per the proven design (SPARKED
// STATE spec of record; the frozen reference's PhotoHero supplies the dot /
// counter / bottom-fade details, the locked description adds edge-peek and
// the gold-ringed thumbnail strip).
//
// Data-driven: each photo is { key, tint, url? } — real upload URLs (Code
// stage) drop into `url` and render instead of the tint panel; nothing else
// changes. A single photo renders as a static hero with NO gallery chrome.
// Swipe on touch; on desktop web, arrow chips + clickable dots/thumbs.
// Reduced motion: jumps are instant, no scroll animation.

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useReducedMotion } from '../lib/useReducedMotion';
import { brand, sparkGradient, useTheme } from '../theme';

export interface GalleryPhoto {
  key: string;
  /** Category-tinted placeholder fill until real uploads land. */
  tint: string;
  /** Real image URL (Code stage) — takes over from tint when present. */
  url?: string;
}

const HERO_HEIGHT = 280;
/** How much of the next slide peeks past the active one. */
const PEEK = 28;

/** One slide — tint gradient panel now, real photo later. Slides vary their
 * gradient direction by index so placeholder swipes read as distinct images. */
function Slide({ photo, index, width }: { photo: GalleryPhoto; index: number; width: number }) {
  if (photo.url) {
    return (
      <Image
        source={{ uri: photo.url }}
        style={{ width, height: HERO_HEIGHT }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }
  const dirs = [
    { x1: '0', y1: '0', x2: '1', y2: '1' },
    { x1: '1', y1: '0', x2: '0', y2: '1' },
    { x1: '0', y1: '1', x2: '1', y2: '0' },
  ];
  const d = dirs[index % dirs.length];
  return (
    <Svg width={width} height={HERO_HEIGHT}>
      <Defs>
        <LinearGradient id={`slide-${photo.key}`} {...d}>
          <Stop offset="0" stopColor={brand.deepNavy} />
          <Stop offset="1" stopColor={photo.tint} stopOpacity={0.42 + 0.18 * (index % 3)} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={HERO_HEIGHT} fill={`url(#slide-${photo.key})`} />
    </Svg>
  );
}

/** Desktop-web arrow chip. */
function ArrowChip({
  side,
  onPress,
}: {
  side: 'left' | 'right';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={side === 'left' ? 'Previous photo' : 'Next photo'}
      style={({ pressed }) => ({
        position: 'absolute',
        [side]: 12,
        top: HERO_HEIGHT / 2 - 18,
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? 'rgba(15,26,48,0.95)' : 'rgba(15,26,48,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
      })}
    >
      <Ionicons name={side === 'left' ? 'chevron-back' : 'chevron-forward'} size={17} color="#ffffff" />
    </Pressable>
  );
}

export default function EventGallery({
  photos,
  bg,
  showArrows = false,
}: {
  photos: GalleryPhoto[];
  /** Screen background for the bottom fade (title must read over any image). */
  bg: string;
  /** Desktop-web affordance; touch platforms swipe. */
  showArrows?: boolean;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const multi = photos.length > 1;
  // Active slide narrows so the next one edge-peeks (locked description).
  const slideWidth = multi ? Math.max(width - PEEK, 1) : width;

  const goTo = useCallback(
    (i: number) => {
      const clamped = Math.min(Math.max(i, 0), photos.length - 1);
      scrollRef.current?.scrollTo({ x: clamped * slideWidth, animated: !reducedMotion });
      setIndex(clamped);
    },
    [photos.length, slideWidth, reducedMotion],
  );

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height: HERO_HEIGHT, overflow: 'hidden' }}>
        {width > 0 && (
          <>
            {multi ? (
              <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={slideWidth}
                decelerationRate="fast"
                disableIntervalMomentum
                onScroll={(e) => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
                  if (i !== index && i >= 0 && i < photos.length) setIndex(i);
                }}
                scrollEventThrottle={32}
              >
                {photos.map((p, i) => (
                  <View key={p.key} style={{ width: slideWidth }}>
                    <Slide photo={p} index={i} width={slideWidth} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              photos[0] && <Slide photo={photos[0]} index={0} width={width} />
            )}

            {/* Bottom fade into the canvas (reference PhotoHero). */}
            <Svg
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
              width="100%"
              height={HERO_HEIGHT * 0.6}
            >
              <Defs>
                <LinearGradient id="hero-fade" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={bg} stopOpacity={1} />
                  <Stop offset="1" stopColor={bg} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height={HERO_HEIGHT * 0.6} fill="url(#hero-fade)" />
            </Svg>

            {multi && (
              <>
                {/* Gradient-pill dots, bottom-center (active pill widens). */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 18,
                    left: 0,
                    right: 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {photos.map((p, i) => (
                    <Pressable
                      key={p.key}
                      onPress={() => goTo(i)}
                      accessibilityLabel={`Photo ${i + 1}`}
                      hitSlop={8}
                      style={{ height: 6, width: i === index ? 20 : 6, borderRadius: 9999, overflow: 'hidden' }}
                    >
                      {i === index ? (
                        <Svg width={20} height={6}>
                          <Defs>
                            <LinearGradient id={`dot-${p.key}`} x1="0" y1="0" x2="1" y2="1">
                              {sparkGradient.stops.map((s) => (
                                <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                              ))}
                            </LinearGradient>
                          </Defs>
                          <Rect x="0" y="0" width={20} height={6} fill={`url(#dot-${p.key})`} />
                        </Svg>
                      ) : (
                        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.45)' }} />
                      )}
                    </Pressable>
                  ))}
                </View>

                {/* "1/3" counter, bottom-right. */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 9999,
                    backgroundColor: 'rgba(15,26,48,0.62)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodySemiBold,
                      fontSize: 11,
                      fontWeight: '800',
                      letterSpacing: 0.22,
                      color: '#ffffff',
                    }}
                  >
                    {index + 1}/{photos.length}
                  </Text>
                </View>

                {showArrows && index > 0 && <ArrowChip side="left" onPress={() => goTo(index - 1)} />}
                {showArrows && index < photos.length - 1 && (
                  <ArrowChip side="right" onPress={() => goTo(index + 1)} />
                )}
              </>
            )}
          </>
        )}
      </View>

      {/* Thumbnail strip — active thumb ringed in gold (locked description). */}
      {multi && (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginTop: 12 }}>
          {photos.map((p, i) => (
            <Pressable
              key={p.key}
              onPress={() => goTo(i)}
              accessibilityLabel={`Photo ${i + 1} thumbnail`}
              accessibilityState={{ selected: i === index }}
              style={{
                width: 56,
                height: 38,
                borderRadius: 8,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: i === index ? brand.ignitionGold : 'transparent',
              }}
            >
              <Slide photo={p} index={i} width={52} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
