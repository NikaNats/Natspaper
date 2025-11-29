import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // 1. Base Configurations
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // 2. Global Rules (TypeScript & JS)
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }], // Allow warnings/errors
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-unused-expressions": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    // 3. Astro Specific Overrides
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      // Astro-specific rules
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // 4. Test Environment Relaxations
    files: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // 5. Global Ignores
    ignores: [
      "dist/**",
      ".astro/**",
      ".vercel/**",
      ".sonda/**",
      "public/pagefind/**",
      "scripts/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
    ],
  },
];
