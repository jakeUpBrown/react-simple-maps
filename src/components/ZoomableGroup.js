import React, { useContext, forwardRef, useCallback } from "react"
import PropTypes from "prop-types"

import { MapContext } from "./MapProvider"
import { ZoomPanProvider } from "./ZoomPanProvider"
import useZoomPan from "./useZoomPan"

const ZoomableGroup = forwardRef(
  (
    {
      center = [0, 0],
      zoom = 1,
      minZoom = 1,
      maxZoom = 8,
      translateExtent,
      filterZoomEvent,
      onMoveStart,
      onMove,
      onMoveEnd,
      className,
      ...restProps
    },
    ref
  ) => {
    const { width, height } = useContext(MapContext)

    const { mapRef, groupRef, transformString, position, controls } =
      useZoomPan({
        center,
        filterZoomEvent,
        onMoveStart,
        onMove,
        onMoveEnd,
        scaleExtent: [minZoom, maxZoom],
        translateExtent,
        zoom,
      })

    const setGroupRef = useCallback(
      (node) => {
        groupRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
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
)

ZoomableGroup.displayName = "ZoomableGroup"

ZoomableGroup.propTypes = {
  center: PropTypes.array,
  zoom: PropTypes.number,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  translateExtent: PropTypes.arrayOf(PropTypes.array),
  onMoveStart: PropTypes.func,
  onMove: PropTypes.func,
  onMoveEnd: PropTypes.func,
  className: PropTypes.string,
}

export default ZoomableGroup
