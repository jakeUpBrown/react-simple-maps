import { babel } from "@rollup/plugin-babel";

import pkg from "./package.json";

const bundled = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

// Match subpath imports too, so `react/jsx-runtime` (automatic JSX runtime)
// and `react/compiler-runtime` (emitted by the React Compiler) stay external
// instead of being inlined into the bundle.
const external = (id) =>
  bundled.some((name) => id === name || id.startsWith(`${name}/`));

export default [
  {
    input: "src/index.js",
    external,
    output: [
      {
        file: pkg.main,
        format: "cjs",
        exports: "named",
      },
      {
        file: pkg.module,
        format: "es",
      },
    ],
    plugins: [babel({ babelHelpers: "bundled" })],
  },
];
