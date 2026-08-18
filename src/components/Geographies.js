import React, { useContext, forwardRef } from "react"
import PropTypes from "prop-types"

import { MapContext } from "./MapProvider"
import useGeographies from "./useGeographies"

const Geographies = forwardRef(
  (
    {
      geography,
      children,
      parseGeographies,
      getGeographyKey,
      mesh = false,
      className = "",
      ...restProps
    },
    ref
  ) => {
    const { path, projection } = useContext(MapContext)
    const { geographies, outline, borders } = useGeographies({
      geography,
      parseGeographies,
      getGeographyKey,
      mesh,
    })

    return (
      <g ref={ref} className={`rsm-geographies ${className}`} {...restProps}>
        {geographies &&
          geographies.length > 0 &&
          children({ geographies, outline, borders, path, projection })}
      </g>
    )
  }
)

Geographies.displayName = "Geographies"

Geographies.propTypes = {
  geography: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array,
  ]),
  children: PropTypes.func,
  parseGeographies: PropTypes.func,
  getGeographyKey: PropTypes.func,
  mesh: PropTypes.bool,
  className: PropTypes.string,
}

export default Geographies
