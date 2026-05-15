const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
] as const;

export type UtmParamName = (typeof UTM_KEYS)[number];

export type UtmBag = Partial<Record<UtmParamName, string>> & {
  entry_timestamp?: string;
};

const SESSION_KEY = 'cg_utm_session';
const PERSIST_KEY = 'cg_utm_persist';
const PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface PersistedBag {
  bag: UtmBag;
  storedAt: number;
}

const safeParse = (raw: string | null): PersistedBag | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.bag) return parsed as PersistedBag;
  } catch {
    // ignore
  }
  return null;
};

const readFromUrl = (search: string): UtmBag => {
  const params = new URLSearchParams(search);
  const bag: UtmBag = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) bag[key] = value;
  }
  return bag;
};

const hasAnyValue = (bag: UtmBag): boolean =>
  UTM_KEYS.some((k) => typeof bag[k] === 'string' && bag[k]!.length > 0);

export const captureUtmsFromUrl = (search: string = window.location.search): UtmBag => {
  const fromUrl = readFromUrl(search);

  if (hasAnyValue(fromUrl)) {
    const bag: UtmBag = {
      ...fromUrl,
      entry_timestamp: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ bag, storedAt: Date.now() }));
      localStorage.setItem(PERSIST_KEY, JSON.stringify({ bag, storedAt: Date.now() }));
    } catch {
      // storage may be unavailable (private mode, etc.) — ignore
    }
    return bag;
  }

  const session = safeParse(sessionStorage.getItem(SESSION_KEY));
  if (session) return session.bag;

  const persisted = safeParse(localStorage.getItem(PERSIST_KEY));
  if (persisted && Date.now() - persisted.storedAt < PERSIST_TTL_MS) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(persisted));
    } catch {
      // ignore
    }
    return persisted.bag;
  }

  return {};
};

export const getUtms = (): UtmBag => {
  const session = safeParse(sessionStorage.getItem(SESSION_KEY));
  if (session) return session.bag;
  const persisted = safeParse(localStorage.getItem(PERSIST_KEY));
  if (persisted && Date.now() - persisted.storedAt < PERSIST_TTL_MS) return persisted.bag;
  return {};
};

export const clearUtms = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
  } catch {
    // ignore
  }
};
