// Renders the locked description markdown subset — **bold**, *italic*, and
// "- " bullets (SCHEMA_PLAN §10.6: bold/italic/bullets only, nothing else).
// Shared: Review renders the draft through this today; Event Detail's
// "Preview full listing" mode and the live detail screen use the same
// component so the formatted description is identical on every surface.
// Anything outside the subset renders as literal text — no HTML, no eval.

import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../theme';

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Split a line into bold/italic/plain runs.
 *
 * Pairing is BALANCE-AWARE, which the original regex (`\*\*([^*]+)\*\*|…`)
 * was not: it matched greedily with no notion of an opening delimiter, so any
 * unconsumed marker stole the next one and formatted the span between them.
 * "note: ** real text **bold** here" bolded " real text " and destroyed the
 * host's actual bold run — and that is reachable by typing "**", changing
 * your mind, and formatting something later. Descriptions are stored markdown
 * shown on live Event Detail, so the damage reached consumers, not just the
 * wizard.
 *
 * Now: the line is tokenized into asterisk-runs and text, and a delimiter
 * only opens a run when a LATER delimiter of the same width closes it, with
 * real content between. Anything unmatched — a stray "**", an odd "*", a run
 * of three or more (bold+italic is outside the locked subset) — renders as
 * the literal characters the host typed. Nothing is ever silently eaten.
 */
export function inlineRuns(text: string): InlineRun[] {
  // Keeps the delimiters: "a **b** c" → ['a ', '**', 'b', '**', ' c']
  const tokens = text.split(/(\*+)/).filter((t) => t !== '');
  const isDelim = (t: string) => /^\*+$/.test(t) && t.length <= 2;

  const runs: InlineRun[] = [];
  const push = (t: string, style?: { bold?: boolean; italic?: boolean }) => {
    if (!t) return;
    const prev = runs[runs.length - 1];
    // Merge adjacent plain text so literal markers read as one run.
    if (prev && !prev.bold && !prev.italic && !style?.bold && !style?.italic) {
      prev.text += t;
      return;
    }
    runs.push({ text: t, ...style });
  };

  // Flanking rules, borrowed from CommonMark and the thing that actually
  // disambiguates three delimiters in a line: an opener may not be followed by
  // whitespace, a closer may not be preceded by it. Without these, the stray
  // "**" in "note: ** real text **bold** here" pairs with the user's OPENING
  // marker and bolds " real text ". With them, the stray is rejected as an
  // opener (a space follows it) and the intended run pairs correctly.
  const opens = (i: number) => tokens[i + 1] !== undefined && !/^\s/.test(tokens[i + 1]);
  const closes = (j: number) => tokens[j - 1] !== undefined && !/\s$/.test(tokens[j - 1]);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!isDelim(tok) || !opens(i)) {
      push(tok); // literal: not a delimiter, or not a legal opener
      continue;
    }
    // j starts at i+2 so there is always real content inside the pair.
    let close = -1;
    for (let j = i + 2; j < tokens.length; j++) {
      if (tokens[j] === tok && closes(j)) {
        close = j;
        break;
      }
    }
    if (close > -1) {
      push(tokens.slice(i + 1, close).join(''), tok.length === 2 ? { bold: true } : { italic: true });
      i = close;
    } else {
      push(tok); // unmatched — literal, exactly as typed
    }
  }
  return runs;
}

export default function MarkdownText({ value, size = 15 }: { value: string; size?: number }) {
  const theme = useTheme();
  if (!value.trim()) return null;
  const lines = value.split('\n');
  return (
    <View style={{ gap: 5 }}>
      {lines.map((line, i) => {
        const isBullet = /^\s*[-*]\s+/.test(line);
        const content = isBullet ? line.replace(/^\s*[-*]\s+/, '') : line;
        if (!content.trim()) return null; // blank lines collapse
        const body = (
          <Text
            style={{
              flex: 1,
              fontFamily: theme.fonts.bodyMedium,
              fontSize: size,
              lineHeight: size * 1.6,
              color: theme.colors.textMuted,
            }}
          >
            {inlineRuns(content).map((r, j) => (
              <Text
                key={j}
                style={{
                  fontFamily: r.bold ? theme.fonts.bodySemiBold : theme.fonts.bodyMedium,
                  fontWeight: r.bold ? '700' : '400',
                  fontStyle: r.italic ? 'italic' : 'normal',
                  color: r.bold ? theme.colors.text : theme.colors.textMuted,
                }}
              >
                {r.text}
              </Text>
            ))}
          </Text>
        );
        if (!isBullet) return <View key={i}>{body}</View>;
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: 2 }}>
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: size, lineHeight: size * 1.6, color: theme.colors.textFaint }}>
              •
            </Text>
            {body}
          </View>
        );
      })}
    </View>
  );
}
