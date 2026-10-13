import js from "@eslint/js";
import nextPlugin from "eslint-config-next";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
      "tools/render/assets/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextPlugin,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      // Card images are data URLs rendered in the browser; next/image adds nothing.
      "@next/next/no-img-element": "off",
    },
  },
  prettier,
);
