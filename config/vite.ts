import tailwindcss from "@tailwindcss/vite";

/**
 * Vite Configuration
 *
 * Returns Vite plugin and build configuration.
 * Note: Type assertion is required due to Tailwind CSS Vite plugin version
 * compatibility with Astro's bundled Vite version. The plugin works correctly
 * at runtime despite the type mismatch.
 */
export function getViteConfig() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any],
    build: {
      sourcemap: true,
      // CSP: never inline processed <script> chunks into HTML.
      // Astro inlines small hoisted scripts as `<script type="module">…`, and
      // when a page contains one, the ClientRouter appends a
      // `<script type="module" src="data:application/javascript,">` sentinel on
      // every client-side navigation to await it. Keeping scripts external
      // (cacheable, `'self'`) removes that sentinel, which lets script-src drop
      // `data:` entirely and shrinks the per-page hash list.
      // Returning `undefined` keeps Vite's default 4 KiB rule for every
      // non-JS asset (images, fonts, CSS).
      assetsInlineLimit: (filePath: string) =>
        /\.m?js$/.test(filePath) ? false : undefined,
    },
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
    resolve: {
      alias: {
        "@tests": "/tests",
      },
    },
  };
}