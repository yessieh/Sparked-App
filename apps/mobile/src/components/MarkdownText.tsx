// Renders the locked description markdown subset — **bold**, *italic*, and
// "- " bullets (SCHEMA_PLAN §10.6: bold/italic/bullets only, nothing else).
// Shared: Review renders the draft through this today; Event Detail's
// "Preview full listing" mode and the live detail screen use the same
// component so the formatted description is identical on every surface.
// Anything outside the subset renders as literal text — no HTML, no eval.

import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../theme';

/** Split a line into bold/italic/plain runs. **bold** wins over *italic*
 * (alternation order), so "**x**" never parses as nested italics. */
function inlineRuns(text: string): { text: string; bold?: boolean; italic?: boolean }[] {
  const runs: { text: string; bold?: boolean; italic?: boolean }[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) runs.push({ text: m[1], bold: true });
    else runs.push({ text: m[2], italic: true });
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
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
