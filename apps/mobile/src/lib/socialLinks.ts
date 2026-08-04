// Turning a stored social value into an openable URL.
//
// The server (0024) validates the KEY SET and a 100-char length cap and nothing
// else — any string inside those bounds is stored verbatim. So a host's value
// can legitimately be a full URL, a bare domain, or a handle with or without an
// `@`, and something has to decide what "open this" means for each shape.
//
// THIS IS NOT VALIDATION AND MUST NEVER GATE SAVE. `null` here means "we cannot
// build a URL we'd stand behind", which turns the editor's test button off — it
// does not mean the value is invalid, because the server says it isn't. Treating
// a null as a save-blocker would be a second, stricter implementation of a rule
// the database already owns, and the two would drift.

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'x';

/** Where a bare handle hangs. TikTok keeps the `@` — it is part of the path
 * there, not decoration, and tiktok.com/name without it 404s. */
const HANDLE_BASE: Record<SocialPlatform, string> = {
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  tiktok: 'https://tiktok.com/@',
  x: 'https://x.com/',
};

/** Domains we recognise as "this is already a link to that platform, it is just
 * missing its scheme". Legacy hosts included deliberately: a host who saved
 * `twitter.com/…` years ago should still get a working button. */
const PLATFORM_DOMAIN: Record<SocialPlatform, RegExp> = {
  instagram: /^(?:www\.)?instagram\.com(?:$|\/)/i,
  facebook: /^(?:www\.|m\.)?(?:facebook\.com|fb\.com|fb\.me)(?:$|\/)/i,
  tiktok: /^(?:www\.|m\.)?tiktok\.com(?:$|\/)/i,
  x: /^(?:www\.|mobile\.)?(?:x\.com|twitter\.com)(?:$|\/)/i,
};

/** The union of what the four platforms allow in a username: letters, digits,
 * dot, underscore, hyphen. Deliberately not per-platform — we are deciding
 * whether we can BUILD a link, not whether their account exists, and a
 * per-platform charset would reject valid handles the moment a platform
 * loosened its rules. */
const HANDLE = /^[A-Za-z0-9._-]{1,60}$/;

/**
 * The URL a stored social value points at, or `null` when no sensible one can
 * be built (empty, or neither a link nor a handle).
 *
 * A full `http(s)://` value passes through UNTOUCHED, wherever it points. The
 * button exists so a host can see where their link actually goes; silently
 * rewriting it would defeat the point.
 */
export function socialUrl(platform: SocialPlatform, raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;
  if (PLATFORM_DOMAIN[platform].test(value)) return `https://${value}`;

  const handle = value.replace(/^@+/, '');
  if (!HANDLE.test(handle)) return null;
  return HANDLE_BASE[platform] + handle;
}
