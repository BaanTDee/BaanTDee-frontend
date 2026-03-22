/**
 * Lightweight client-side recommendation engine.
 * Tracks which provinces and listing types the user views,
 * then surfaces listings that match their inferred preferences.
 */

const STORAGE_KEY = "btd_prefs";
const MAX_SLUGS = 50; // cap history size

interface Prefs {
  provinces: Record<string, number>;
  types: Record<string, number>;
  viewed_slugs: string[];
}

function loadPrefs(): Prefs {
  if (typeof window === "undefined")
    return { provinces: {}, types: {}, viewed_slugs: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { provinces: {}, types: {}, viewed_slugs: [] };
    return JSON.parse(raw) as Prefs;
  } catch {
    return { provinces: {}, types: {}, viewed_slugs: [] };
  }
}

function savePrefs(prefs: Prefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors (e.g. private browsing)
  }
}

/** Record that the user viewed a listing — call this on listing detail page. */
export function recordView(slug: string, province: string, type: string): void {
  const prefs = loadPrefs();

  prefs.provinces[province] = (prefs.provinces[province] ?? 0) + 1;
  prefs.types[type] = (prefs.types[type] ?? 0) + 1;

  // Deduplicate: move slug to front, keep cap
  const slugs = [slug, ...prefs.viewed_slugs.filter((s) => s !== slug)];
  prefs.viewed_slugs = slugs.slice(0, MAX_SLUGS);

  savePrefs(prefs);
}

/** Return the top-N provinces by view count. */
export function getTopProvinces(n = 2): string[] {
  const prefs = loadPrefs();
  return Object.entries(prefs.provinces)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([province]) => province);
}

/** Return the top-N types by view count. */
export function getTopTypes(n = 2): string[] {
  const prefs = loadPrefs();
  return Object.entries(prefs.types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([type]) => type);
}

/** Return recently viewed slugs (to exclude from recommendations). */
export function getViewedSlugs(): string[] {
  return loadPrefs().viewed_slugs;
}

/** True if the user has any saved preference history. */
export function hasPrefs(): boolean {
  const prefs = loadPrefs();
  return (
    Object.keys(prefs.provinces).length > 0 ||
    Object.keys(prefs.types).length > 0
  );
}
