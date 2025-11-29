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