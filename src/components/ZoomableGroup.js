import { use, useCallback } from "react"

import { MapContext } from "./MapProvider"
import { ZoomPanProvider } from "./ZoomPanProvider"
import useZoomPan from "./useZoomPan"

const ZoomableGroup = ({
  ref,
  center = [0, 0],
  zoom = 1,
  minZoom = 1,
  maxZoom = 8,
  translateExtent,
  filterZoomEvent,
  onMoveStart,
  onMove,
  onMoveEnd,
  className = "",
  ...restProps
}) => {
  const { width, height } = use(MapContext)

  const { mapRef, groupRef, transformString, position, controls } = useZoomPan({
    center,
    filterZoomEvent,
    onMoveStart,
    onMove,
    onMoveEnd,
    scaleExtent: [minZoom, maxZoom],
    translateExtent,
    zoom,
  })

  // The zoomable <g> is driven imperatively, so this component needs the node
  // itself and can't just hand the consumer's ref straight to it. React 19
  // lets a ref callback return a cleanup function and skips the legacy
  // `ref(null)` detach call when it does, so merging has to honour both
  // shapes: run the consumer's cleanup if it returned one, otherwise fall
  // back to calling it with null.
  const setGroupRef = useCallback(
    (node) => {
      groupRef.current = node

      let detach
      if (typeof ref === "function") {
        const cleanup = ref(node)
        detach = typeof cleanup === "function" ? cleanup : () => ref(null)
      } else if (ref) {
        ref.current = node
        detach = () => {
          ref.current = null
        }
      }

      return () => {
        groupRef.current = null
        if (detach) detach()
      }
    },
    [groupRef, ref]
  )

  return (
    <ZoomPanProvider
      value={{ x: position.x, y: position.y, k: position.k, transformString }}
      controls={controls}
    >
      <g ref={mapRef}>
        <rect width={width} height={height} fill="transparent" />
        {/* The transform attribute is written imperatively by useZoomPan;
            React must not own it, or a late re-render would overwrite the
            live gesture/flight position with a stale value. */}
        <g
          ref={setGroupRef}
          className={`rsm-zoomable-group ${className}`}
          {...restProps}
        />
      </g>
    </ZoomPanProvider>
  )
}

export default ZoomableGroup
