import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { zoom as d3Zoom, zoomIdentity as d3ZoomIdentity } from "d3-zoom"
import { select as d3Select } from "d3-selection"
// Side-effect import: patches selection/transition prototypes so
// `selection.transition()` and gesture interruption exist. d3-zoom already
// depends on it, but zoomTo() below relies on it directly.
import "d3-transition"

import { MapContext } from "./MapProvider"
import { getCoords } from "../utils"

const makeTransformString = ({ x, y, k }) => `translate(${x} ${y}) scale(${k})`

// The transform is applied to the DOM imperatively inside the d3 handlers, so
// gestures and animated flights never wait on a React render. React state (and
// the ZoomPanContext built from it) is synced at most once per animation
// frame; consumers that can't afford even that use the subscription API on the
// controls object.
export default function useZoomPan({
  center,
  filterZoomEvent,
  onMoveStart,
  onMoveEnd,
  onMove,
  translateExtent = [
    [-Infinity, -Infinity],
    [Infinity, Infinity],
  ],
  scaleExtent = [1, 8],
  zoom = 1,
}) {
  const { width, height, projection } = useContext(MapContext)

  const [lon, lat] = center
  const [position, setPosition] = useState({ x: 0, y: 0, k: 1 })

  const mapRef = useRef() // outer <g> the d3-zoom behavior binds to
  const groupRef = useRef() // inner <g> that carries the transform attribute
  const zoomRef = useRef()
  const positionRef = useRef({ x: 0, y: 0, k: 1, dragging: null })
  const listenersRef = useRef(new Set())
  const rafRef = useRef(0)
  // Guards the controlled center/zoom effect: the last position the props (or
  // a settled gesture) put the map at, in lon/lat space.
  const lastPosition = useRef({ x: 0, y: 0, k: 1 })

  const [a, b] = translateExtent
  const [a1, a2] = a
  const [b1, b2] = b
  const [minZoom, maxZoom] = scaleExtent

  // Callbacks and projection are read through refs inside the d3 handlers so
  // changing them never tears down and re-binds the zoom behavior.
  const callbacksRef = useRef({})
  callbacksRef.current = { onMoveStart, onMove, onMoveEnd, filterZoomEvent }
  const projectionRef = useRef(projection)
  projectionRef.current = projection
  const boundsRef = useRef({})
  boundsRef.current = {
    width,
    height,
    translateExtent: [
      [a1, a2],
      [b1, b2],
    ],
    scaleExtent: [minZoom, maxZoom],
  }

  const applyTransform = useCallback((transform, sourceEvent) => {
    const next = {
      x: transform.x,
      y: transform.y,
      k: transform.k,
      dragging: sourceEvent || null,
    }
    positionRef.current = next
    if (groupRef.current) {
      groupRef.current.setAttribute("transform", makeTransformString(next))
    }
    listenersRef.current.forEach((listener) => listener(next))
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        setPosition(positionRef.current)
      })
    }
  }, [])

  useLayoutEffect(() => {
    if (groupRef.current) {
      groupRef.current.setAttribute(
        "transform",
        makeTransformString(positionRef.current)
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const svg = d3Select(mapRef.current)

    // sourceEvent is null for programmatic transforms (controlled props and
    // zoomTo flights). Those still render every frame — only the onMove*
    // callbacks are reserved for user gestures, matching the old bypassEvents
    // behavior without swallowing programmatic frames.
    function handleZoomStart(d3Event) {
      const { onMoveStart } = callbacksRef.current
      if (!onMoveStart || !d3Event.sourceEvent) return
      onMoveStart(
        {
          coordinates: projectionRef.current.invert(
            getCoords(width, height, d3Event.transform)
          ),
          zoom: d3Event.transform.k,
        },
        d3Event
      )
    }

    function handleZoom(d3Event) {
      const { transform, sourceEvent } = d3Event
      applyTransform(transform, sourceEvent)
      const { onMove } = callbacksRef.current
      if (!onMove || !sourceEvent) return
      onMove(
        {
          x: transform.x,
          y: transform.y,
          zoom: transform.k,
          dragging: sourceEvent,
        },
        d3Event
      )
    }

    function handleZoomEnd(d3Event) {
      const [x, y] = projectionRef.current.invert(
        getCoords(width, height, d3Event.transform)
      )
      lastPosition.current = { x, y, k: d3Event.transform.k }
      const { onMoveEnd } = callbacksRef.current
      if (!onMoveEnd || !d3Event.sourceEvent) return
      onMoveEnd({ coordinates: [x, y], zoom: d3Event.transform.k }, d3Event)
    }

    function filterFunc(d3Event) {
      const { filterZoomEvent } = callbacksRef.current
      if (filterZoomEvent) {
        return filterZoomEvent(d3Event)
      }
      return d3Event ? !d3Event.ctrlKey && !d3Event.button : false
    }

    const zoomBehavior = d3Zoom()
      .filter(filterFunc)
      .scaleExtent([minZoom, maxZoom])
      .translateExtent([
        [a1, a2],
        [b1, b2],
      ])
      .on("start", handleZoomStart)
      .on("zoom", handleZoom)
      .on("end", handleZoomEnd)

    zoomRef.current = zoomBehavior
    svg.call(zoomBehavior)

    return () => {
      svg.on(".zoom", null)
    }
  }, [width, height, a1, a2, b1, b2, minZoom, maxZoom, applyTransform])

  // d3's zoom.transform applies a transform verbatim — it does NOT enforce
  // scaleExtent/translateExtent the way gestures do. Clamping here keeps
  // programmatic flights honest: the promise lands exactly where it aimed.
  const clampTransform = useCallback((cx, cy, k) => {
    const { width: w, height: h, translateExtent: te, scaleExtent: se } =
      boundsRef.current
    const k2 = Math.max(se[0], Math.min(se[1], k))
    const [[tex0, tey0], [tex1, tey1]] = te

    const clampAxis = (t, size, e0, e1) => {
      if (!isFinite(e0) || !isFinite(e1)) return t
      const min = size - e1 * k2
      const max = -e0 * k2
      if (min > max) return (min + max) / 2
      return Math.max(min, Math.min(max, t))
    }

    const x = clampAxis(w / 2 - cx * k2, w, tex0, tex1)
    const y = clampAxis(h / 2 - cy * k2, h, tey0, tey1)
    return d3ZoomIdentity.translate(x, y).scale(k2)
  }, [])

  // zoomTo(target, options) => Promise<"complete" | "interrupted" | "noop">
  //   target: { coordinates: [lon, lat], zoom? }
  //         | { bounds: [[lon, lat], [lon, lat]], zoom?, padding? }
  //         | { projectedBounds: [[x, y], [x, y]], zoom?, padding? }
  //   options: { duration = 800, maxZoom? }
  // A duration of 0 snaps. User gestures interrupt an in-flight transition
  // natively (d3-zoom calls interrupt() on wheel/mouse/touch start), which
  // settles the promise with "interrupted".
  const zoomTo = useCallback(
    (target, options = {}) => {
      const node = mapRef.current
      const behavior = zoomRef.current
      if (!node || !behavior || !target) return Promise.resolve("noop")
      const proj = projectionRef.current
      const { width: w, height: h } = boundsRef.current
      const { duration = 800, maxZoom } = options

      const fitBounds = (p0, p1) => {
        const x0 = Math.min(p0[0], p1[0])
        const x1 = Math.max(p0[0], p1[0])
        const y0 = Math.min(p0[1], p1[1])
        const y1 = Math.max(p0[1], p1[1])
        const padding = target.padding == null ? 20 : target.padding
        const dx = Math.max(x1 - x0, 1e-6)
        const dy = Math.max(y1 - y0, 1e-6)
        return {
          cx: (x0 + x1) / 2,
          cy: (y0 + y1) / 2,
          k:
            target.zoom != null
              ? target.zoom
              : Math.min((w - padding * 2) / dx, (h - padding * 2) / dy),
        }
      }

      let cx, cy, k
      if (target.projectedBounds) {
        // Already in the projection's coordinate space — the caller computed
        // the frame from rendered geometry (e.g. d3 path bounds), which is the
        // only correct way to frame shapes under a composite projection like
        // geoAlbersUsa, where lon/lat corners of an Alaska/CONUS box project
        // discontinuously.
        const [b0, b1] = target.projectedBounds
        const fit = fitBounds(b0, b1)
        cx = fit.cx
        cy = fit.cy
        k = fit.k
      } else if (target.bounds) {
        const [[lon0, lat0], [lon1, lat1]] = target.bounds
        const p0 = proj([lon0, lat0])
        const p1 = proj([lon1, lat1])
        if (!p0 || !p1) return Promise.resolve("noop")
        const fit = fitBounds(p0, p1)
        cx = fit.cx
        cy = fit.cy
        k = fit.k
      } else if (target.coordinates) {
        const p = proj(target.coordinates)
        if (!p) return Promise.resolve("noop")
        cx = p[0]
        cy = p[1]
        k = target.zoom != null ? target.zoom : positionRef.current.k
      } else {
        return Promise.resolve("noop")
      }

      // options.maxZoom caps a *computed* fit tighter than scaleExtent allows,
      // e.g. so scripted flights stop short of a zoom level that triggers
      // max-zoom UI behavior (clampTransform still applies scaleExtent after).
      if (maxZoom != null && k > maxZoom) k = maxZoom

      const transform = clampTransform(cx, cy, k)
      const selection = d3Select(node)
      const current = positionRef.current
      // Already there (within half a pixel): settle without animating, so
      // repeated flights to the same target don't replay a no-op transition.
      const alreadyThere =
        Math.abs(current.x - transform.x) < 0.5 &&
        Math.abs(current.y - transform.y) < 0.5 &&
        Math.abs(current.k - transform.k) < 1e-3
      if (!duration || alreadyThere) {
        selection.call(behavior.transform, transform)
        return Promise.resolve("complete")
      }
      // Deliberately the default (unnamed) transition: d3-zoom's gesture
      // handlers interrupt only the default name, so a named flight would
      // keep running under the user's fingers instead of yielding to them.
      // transition.end() settles on every exit path — "end", "interrupt",
      // and the silent cancel of a transition replaced before it starts.
      return selection
        .transition()
        .duration(duration)
        .call(behavior.transform, transform)
        .end()
        .then(
          () => "complete",
          () => "interrupted"
        )
    },
    [clampTransform]
  )

  const cancelZoom = useCallback(() => {
    if (mapRef.current) {
      d3Select(mapRef.current).interrupt()
    }
  }, [])

  const getPosition = useCallback(() => positionRef.current, [])

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  // Stable across renders: consumers of the controls context never re-render
  // because of zoom/pan motion.
  const controls = useMemo(
    () => ({ zoomTo, cancelZoom, getPosition, subscribe }),
    [zoomTo, cancelZoom, getPosition, subscribe]
  )

  // Controlled center/zoom props: preserved snap behavior. Runs through the
  // behavior so handleZoom applies the transform and keeps everything in sync.
  useEffect(() => {
    if (
      lon === lastPosition.current.x &&
      lat === lastPosition.current.y &&
      zoom === lastPosition.current.k
    )
      return
    if (!zoomRef.current || !mapRef.current) return

    const coords = projection([lon, lat])
    if (!coords) return
    const x = coords[0] * zoom
    const y = coords[1] * zoom

    d3Select(mapRef.current).call(
      zoomRef.current.transform,
      d3ZoomIdentity.translate(width / 2 - x, height / 2 - y).scale(zoom)
    )

    lastPosition.current = { x: lon, y: lat, k: zoom }
  }, [lon, lat, zoom, width, height, projection])

  return {
    mapRef,
    groupRef,
    position,
    controls,
    transformString: makeTransformString(position),
  }
}
