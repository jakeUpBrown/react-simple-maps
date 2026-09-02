import { use } from "react"

import { MapContext } from "./MapProvider"
import useGeographies from "./useGeographies"

const Geographies = ({
  ref,
  geography,
  children,
  parseGeographies,
  getGeographyKey,
  mesh = false,
  className = "",
  ...restProps
}) => {
  const { path, projection } = use(MapContext)
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

export default Geographies
