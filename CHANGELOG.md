
# Changelog

## v4.0.0

React 19 only. See the migration notes below for the breaking changes.

- **Breaking:** requires React 19.2+ (`peerDependencies` is now `^19.2.0`)
- **Breaking:** dropped the `prop-types` peer dependency and removed every
  `propTypes` block — React 19 ignores `propTypes` on function components
  entirely, so they were dead code that only added bundle weight
- **Breaking:** dropped the UMD build and the `browser` field; React 19 no
  longer publishes UMD builds of its own, so a global-`React` bundle can't work
- **Breaking:** added an `exports` map, which stops deep imports into
  `react-simple-maps/dist/*`. The ES module output moved from
  `dist/index.es.js` to `dist/index.mjs` so Node resolves it as real ESM
- Replaced `forwardRef` with React 19's plain `ref` prop on all nine
  components; `ref` behaves exactly as before for consumers
- `ZoomableGroup` now honours ref cleanup functions when merging a consumer's
  ref, matching React 19 ref-callback semantics
- Builds with the [React Compiler](https://react.dev/learn/react-compiler);
  every component and hook compiles with no bailouts
- `useZoomPan` no longer writes refs during render. The d3 zoom callbacks,
  projection and dimensions are read through `useEffectEvent`, which is both
  concurrent-safe and what unblocked the compiler
- The zoom behavior is no longer torn down and re-bound when `width`/`height`
  or any of the `onMove*` callbacks change
- Switched to the automatic JSX runtime and `use()` for context reads
- Added an ESLint setup (`npm run lint`) with `eslint-plugin-react-hooks`, so
  a future rules-of-React violation shows up instead of silently turning the
  compiler off for that component
- Fixed: changing `geography` from one URL to another no longer renders the
  previous URL's features while the new request is in flight. The fetched
  response is now tagged with the URL it came from
- Fixed: the `test` script matched no files on Windows (single quotes survive
  `cmd.exe`), so `npm test` reported success without running anything. Also
  swapped the deprecated `--compilers` for `--require`

## v3.0.0 2022-07-25

- Added `forwardRef` to mapping components
- Added `ZoomPanContext` and `ZoomPanProvider`
- Added `useZoomPanContext` and `useMapContext` hooks
- Added support for React 18
