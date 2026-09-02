import { use } from "react"

import { MapContext } from "./MapProvider"

const Line = ({
  ref,
  from = [0, 0],
  to = [0, 0],
  coordinates,
  stroke = "currentcolor",
  strokeWidth = 3,
  fill = "transparent",
  className = "",
  ...restProps
}) => {
  const { path } = use(MapContext)

  const lineData = {
    type: "LineString",
    coordinates: coordinates || [from, to],
  }

  return (
    <path
      ref={ref}
      d={path(lineData)}
      className={`rsm-line ${className}`}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      {...restProps}
    />
  )
}

export default Line
