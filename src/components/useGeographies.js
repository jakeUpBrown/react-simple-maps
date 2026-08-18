import { useMemo, useState, useEffect, useContext } from "react"
import { MapContext } from "./MapProvider"

import {
  fetchGeographies,
  getFeatures,
  getMesh,
  prepareFeatures,
  isString,
  prepareMesh,
} from "../utils"

export default function useGeographies({
  geography,
  parseGeographies,
  getGeographyKey,
  mesh: withMesh = false,
}) {
  const { path } = useContext(MapContext)
  const [source, setSource] = useState(null)

  // Only the raw source is held in state. Parsing and preparation happen in
  // the memos below, so a caller passing an inline parseGeographies no longer
  // re-fires this effect (which previously caused a setState feedback loop).
  useEffect(() => {
    if (typeof window === `undefined`) return
    if (!geography) return

    let cancelled = false

    if (isString(geography)) {
      fetchGeographies(geography).then((geos) => {
        if (geos && !cancelled) setSource(geos)
      })
    } else {
      setSource(geography)
    }

    return () => {
      cancelled = true
    }
  }, [geography])

  const geographies = useMemo(() => {
    if (!source) return []
    return prepareFeatures(
      getFeatures(source, parseGeographies),
      path,
      getGeographyKey
    )
  }, [source, path, parseGeographies, getGeographyKey])

  // Building the mesh means two full mesh() passes plus two path
  // serializations, so it is opt-in rather than computed for every consumer.
  const { outline, borders } = useMemo(() => {
    if (!withMesh || !source) return {}
    const preparedMesh = getMesh(source) || {}
    return prepareMesh(preparedMesh.outline, preparedMesh.borders, path)
  }, [withMesh, source, path])

  return { geographies, outline, borders }
}
