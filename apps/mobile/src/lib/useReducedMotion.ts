// OS reduced-motion preference. When true, animated flourishes apply their
// end state instantly (locked feel rule: state changes still happen, motion
// doesn't). RN-web backs this with prefers-reduced-motion; native reads the
// system setting.

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduced(Boolean(v));
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) =>
      setReduced(Boolean(v)),
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
