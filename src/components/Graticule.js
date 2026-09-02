import { memo, use } from "react"
import { geoGraticule } from "d3-geo"

import { MapContext } from "./MapProvider"

const Graticule = ({
  ref,
  fill = "transparent",
  stroke = "currentcolor",
  step = [10, 10],
  className = "",
  ...restProps
}) => {
  const { path } = use(MapContext)
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

export default memo(Graticule)
