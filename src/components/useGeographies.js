import { use, useMemo, useState, useEffect } from "react"
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
  const { path } = use(MapContext)
  const [fetched, setFetched] = useState(null)

  // Only a URL has to land in state. An object/array geography is used
  // directly during render, so `geographies` always matches the geography
  // prop of the render it is returned from. Routing it through state instead
  // meant a consumer that rebuilds its topology got one render whose features
  // still belonged to the previous topology -- stale ids reaching children
  // that had already moved on to the new data.
  useEffect(() => {
    if (typeof window === `undefined`) return
    if (!geography || !isString(geography)) return

    let cancelled = false

    fetchGeographies(geography).then((geos) => {
      if (geos && !cancelled) setFetched({ url: geography, data: geos })
    })

    return () => {
      cancelled = true
    }
  }, [geography])

  // The response is tagged with the URL it was fetched from. Without that tag
  // a switch from one URL to another kept rendering the previous response
  // until the new one landed -- the same stale-features-under-a-new-prop
  // problem the object/array path above avoids by deriving during render.
  const source = isString(geography)
    ? fetched && fetched.url === geography
      ? fetched.data
      : null
    : geography || null

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
