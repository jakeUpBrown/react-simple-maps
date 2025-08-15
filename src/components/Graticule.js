import React, { memo, useContext } from "react"
import PropTypes from "prop-types"
import { geoGraticule } from "d3-geo"

import { MapContext } from "./MapProvider"

const Graticule = ({
  fill = "transparent",
  stroke = "currentcolor",
  step = [10, 10],
  className = "",
  ref,
  ...restProps
}) => {
  const { path } = useContext(MapContext)
  return (
    <path
      ref={ref}
      d={path(geoGraticule().step(step)())}
      fill={fill}
      stroke={stroke}
      className={`rsm-graticule ${className}`}
      {...restProps}
    />
  )
}

Graticule.displayName = "Graticule"

Graticule.propTypes = {
  fill: PropTypes.string,
  stroke: PropTypes.string,
  step: PropTypes.array,
  className: PropTypes.string,
}

export default memo(Graticule)
