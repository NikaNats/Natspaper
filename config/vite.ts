import tailwindcss from "@tailwindcss/vite";

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