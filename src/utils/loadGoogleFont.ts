/**
 * LRU (Least Recently Used) Font Cache to prevent unbounded memory growth.
 * Limits to 20 font entries (~2MB max) across multiple font families and weights.
 *
 * Why LRU?
 * - Simple Map cache grows unbounded (5-10MB after 100 builds in dev)
 * - Serverless functions accumulate fonts across invocations
 * - LRU evicts least-used fonts when limit reached
 */
class LRUFontCache {
  private readonly cache = new Map<string, ArrayBuffer>();
  private accessOrder: string[] = [];
  private readonly maxSize = 20;

  get(key: string): ArrayBuffer | undefined {
    if (this.cache.has(key)) {
      // Move to end (mark as recently used)
      const index = this.accessOrder.indexOf(key);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, value: ArrayBuffer): void {
    // If new entry and cache full, evict LRU
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }

    // Remove from access order if exists
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to cache and mark as recently used
    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
}

/**
 * Font loading cache with bounded memory (max 20 fonts, ~2MB)
 * Prevents memory bloat in dev servers and serverless functions
 */
const fontCache = new LRUFontCache();

/**
 * Track in-flight font requests to deduplicate concurrent identical requests.
 * Uses a Map to prevent multiple simultaneous fetches of the same font.
 */
const fontLoadingPromises = new Map<string, Promise<ArrayBuffer>>();

/**
 * Delay utility for exponential backoff retry logic.
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout protection.
 * Prevents indefinite hangs on slow network connections.
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Response or throws on timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch CSS from Google Fonts with timeout and error handling.
 */
async function fetchGoogleFontCss(
  font: string,
  text: string,
  weight: number,
  timeoutMs: number
): Promise<string> {
  const API = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;

  const cssResponse = await fetchWithTimeout(
    API,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    },
    timeoutMs
  );

  if (!cssResponse.ok) {
    throw new Error(
      `Failed to fetch Google Fonts CSS. Status: ${cssResponse.status}`
    );
  }

  return cssResponse.text();
}

/**
 * Extract font URL from CSS and fetch the font file.
 */
async function fetchFontFileFromCss(
  css: string,
  timeoutMs: number
): Promise<ArrayBuffer> {
  const fontUrlPattern = /src: url\((.+?)\) format\('(opentype|truetype)'\)/;
  const match = fontUrlPattern.exec(css);

  if (!match?.[1]) {
    throw new Error("Failed to parse Google Fonts CSS - no font URL found");
  }

  const fontResponse = await fetchWithTimeout(match[1], {}, timeoutMs);

  if (!fontResponse.ok) {
    throw new Error(
      `Failed to download font file. Status: ${fontResponse.status}`
    );
  }

  const fontBuffer = await fontResponse.arrayBuffer();
  if (fontBuffer.byteLength === 0) {
    throw new Error("Downloaded font file is empty");
  }

  return fontBuffer;
}

/**
 * Load a single Google Font with retry logic and timeout protection.
 * Implements exponential backoff for resilience against network failures.
 * Uses async locking to prevent race conditions in concurrent builds.
 *
 * @param font - Font name (URL-encoded)
 * @param text - Text to optimize font subset for
 * @param weight - Font weight (400, 700, etc.)
 * @param maxRetries - Maximum number of retry attempts
 * @returns Font ArrayBuffer
 * @throws Error if all retry attempts fail
 */
async function loadGoogleFont(
  font: string,
  text: string,
  weight: number,
  maxRetries: number = 3
): Promise<ArrayBuffer> {
  const cacheKey = `${font}-${weight}`;

  // Check persistent cache first (successfully loaded fonts)
  const cachedFont = fontCache.get(cacheKey);
  if (cachedFont) {
    return cachedFont;
  }

  // Check if we already have an in-flight promise for this font
  // This prevents duplicate fetches if multiple requests come in simultaneously
  const existingPromise = fontLoadingPromises.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  // Create a new loading promise
  const loadingPromise = (async () => {
    const timeoutMs = 10000;
    let lastError: Error = new Error("Unknown error");

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const css = await fetchGoogleFontCss(font, text, weight, timeoutMs);
        const fontBuffer = await fetchFontFileFromCss(css, timeoutMs);

        // Add to persistent cache
        fontCache.set(cacheKey, fontBuffer);
        return fontBuffer;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt) * 1000;
          await delay(backoffMs);
        }
      }
    }

    throw new Error(
      `Failed to load font "${font}" after ${maxRetries} attempts: ${lastError.message}`
    );
  })();

  // Store the promise so concurrent requests can reuse it
  fontLoadingPromises.set(cacheKey, loadingPromise);

  try {
    // Await and return the result
    const result = await loadingPromise;
    return result;
  } finally {
    // Always clean up the promise tracking when done
    // Use setTimeout to ensure cleanup happens after all awaits
    setTimeout(() => {
      fontLoadingPromises.delete(cacheKey);
    }, 0);
  }
}

/**
 * Load multiple Google Fonts concurrently with caching.
 * Fonts are deduplicated to avoid redundant requests.
 * @param text - Text to optimize font subsets for
 * @returns Array of font configurations with loaded data
 */
async function loadGoogleFonts(
  text: string
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const fontsConfig = [
    {
      name: "IBM Plex Mono",
      font: "IBM+Plex+Mono",
      weight: 400,
      style: "normal",
    },
    {
      name: "IBM Plex Mono",
      font: "IBM+Plex+Mono",
      weight: 700,
      style: "bold",
    },
  ];

  const fonts = await Promise.all(
    fontsConfig.map(async ({ name, font, weight, style }) => {
      const data = await loadGoogleFont(font, text, weight);
      return { name, data, weight, style };
    })
  );

  return fonts;
}

export default loadGoogleFonts;
