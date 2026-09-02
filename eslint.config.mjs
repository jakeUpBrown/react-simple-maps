import reactHooks from "eslint-plugin-react-hooks"

// The React Compiler silently skips any component that breaks the rules of
// React, so the lint rules are the only thing that makes a bailout visible.
// `recommended-latest` turns on the compiler-powered rules alongside the
// classic exhaustive-deps/rules-of-hooks checks.
export default [
  { ignores: ["dist/**"] },
  reactHooks.configs.flat["recommended-latest"],
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        cancelAnimationFrame: "readonly",
        console: "readonly",
        fetch: "readonly",
        requestAnimationFrame: "readonly",
        window: "readonly",
      },
    },
  },
]
