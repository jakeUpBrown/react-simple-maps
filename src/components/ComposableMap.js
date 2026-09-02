import { MapProvider } from "./MapProvider"

const ComposableMap = ({
  ref,
  width = 800,
  height = 600,
  projection = "geoEqualEarth",
  projectionConfig = {},
  className = "",
  ...restProps
}) => {
  return (
    <MapProvider
      width={width}
      height={height}
      projection={projection}
      projectionConfig={projectionConfig}
    >
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        className={`rsm-svg ${className}`}
        {...restProps}
      />
    </MapProvider>
  )
}

export default ComposableMap
