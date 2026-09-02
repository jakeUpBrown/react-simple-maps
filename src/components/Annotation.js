import { use } from "react"

import { MapContext } from "./MapProvider"
import { createConnectorPath } from "../utils"

const Annotation = ({
  ref,
  subject,
  children,
  connectorProps,
  dx = 30,
  dy = 30,
  curve = 0,
  className = "",
  ...restProps
}) => {
  const { projection } = use(MapContext)
  const [x, y] = projection(subject)
  const connectorPath = createConnectorPath(dx, dy, curve)

  return (
    <g
      ref={ref}
      transform={`translate(${x + dx}, ${y + dy})`}
      className={`rsm-annotation ${className}`}
      {...restProps}
    >
      <path
        d={connectorPath}
        fill="transparent"
        stroke="#000"
        {...connectorProps}
      />
      {children}
    </g>
  )
}

export default Annotation
