import React, { createContext, useContext } from "react"
import PropTypes from "prop-types"

const ZoomPanContext = createContext()

// Separate context for the imperative controls. Its value is stable across
// renders, so consumers that only fly/read/subscribe never re-render on
// zoom/pan motion — unlike ZoomPanContext, which updates (at most once per
// animation frame) as the position moves.
const ZoomPanControlsContext = createContext(null)

const defaultValue = {
  x: 0,
  y: 0,
  k: 1,
  transformString: "translate(0 0) scale(1)",
}

const ZoomPanProvider = ({
  value = defaultValue,
  controls = null,
  children,
  ...restProps
}) => {
  return (
    <ZoomPanContext.Provider value={value} {...restProps}>
      <ZoomPanControlsContext.Provider value={controls}>
        {children}
      </ZoomPanControlsContext.Provider>
    </ZoomPanContext.Provider>
  )
}

ZoomPanProvider.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  k: PropTypes.number,
  transformString: PropTypes.string,
  controls: PropTypes.object,
}

const useZoomPanContext = () => {
  return useContext(ZoomPanContext)
}

// { zoomTo, cancelZoom, getPosition, subscribe } — or null outside a
// ZoomableGroup. See useZoomPan for the zoomTo target/options contract.
const useZoomPanControls = () => {
  return useContext(ZoomPanControlsContext)
}

export {
  ZoomPanContext,
  ZoomPanControlsContext,
  ZoomPanProvider,
  useZoomPanContext,
  useZoomPanControls,
}
