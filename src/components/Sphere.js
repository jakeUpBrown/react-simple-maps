import { memo, use, useMemo } from "react"

import { MapContext } from "./MapProvider"

const Sphere = ({
  ref,
  id = "rsm-sphere",
  fill = "transparent",
  stroke = "currentcolor",
  strokeWidth = 0.5,
  className = "",
  ...restProps
}) => {
  const { path } = use(MapContext)
  const spherePath = useMemo(() => path({ type: "Sphere" }), [path])
  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={spherePath} />
        </clipPath>
      </defs>
      <path
        ref={ref}
        d={spherePath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ pointerEvents: "none" }}
        className={`rsm-sphere ${className}`}
        {...restProps}
      />
    </>
  )
}

export default memo(Sphere)
