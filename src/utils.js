import { feature, mesh } from "topojson-client"

export function getCoords(w, h, t) {
  const xOffset = (w * t.k - w) / 2
  const yOffset = (h * t.k - h) / 2
  return [w / 2 - (xOffset + t.x) / t.k, h / 2 - (yOffset + t.y) / t.k]
}

export function fetchGeographies(url) {
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw Error(res.statusText)
      }
      return res.json()
    })
    .catch((error) => {
      console.log("There was a problem when fetching the data: ", error)
    })
}

// Decoded features are cached at two levels:
//   - by topology, so several <Geographies> sharing one topology decode once
//   - by geometry, so a rebuilt topology that reuses geometry objects for
//     unchanged shapes keeps the same GeoJSON feature identity for them
// The geometry-level entry records the arcs/transform it was decoded against,
// so a reused geometry paired with different arcs is re-decoded rather than
// served stale.
const featuresByTopology = new WeakMap()
const featuresByGeometry = new WeakMap()

function decodeTopology(topology) {
  const cached = featuresByTopology.get(topology)
  if (cached) return cached

  const collection = topology.objects[Object.keys(topology.objects)[0]]
  let feats

  if (collection && collection.type === "GeometryCollection") {
    feats = collection.geometries.map((geometry) => {
      const hit = featuresByGeometry.get(geometry)
      if (
        hit &&
        hit.arcs === topology.arcs &&
        hit.transform === topology.transform
      ) {
        return hit.feature
      }
      const decoded = feature(topology, geometry)
      featuresByGeometry.set(geometry, {
        arcs: topology.arcs,
        transform: topology.transform,
        feature: decoded,
      })
      return decoded
    })
  } else {
    feats = feature(topology, collection).features
  }

  featuresByTopology.set(topology, feats)
  return feats
}

export function getFeatures(geographies, parseGeographies) {
  const isTopojson = geographies.type === "Topology"
  const feats = isTopojson
    ? decodeTopology(geographies)
    : geographies.features || geographies
  return parseGeographies ? parseGeographies(feats) : feats
}

const meshByTopology = new WeakMap()

export function getMesh(geographies) {
  const isTopojson = geographies.type === "Topology"
  if (!isTopojson) return null

  const cached = meshByTopology.get(geographies)
  if (cached) return cached

  const object = geographies.objects[Object.keys(geographies.objects)[0]]
  const result = {
    outline: mesh(geographies, object, (a, b) => a === b),
    borders: mesh(geographies, object, (a, b) => a !== b),
  }
  meshByTopology.set(geographies, result)
  return result
}

export function prepareMesh(outline, borders, path) {
  return outline && borders
    ? {
        outline: { ...outline, rsmKey: "outline", svgPath: path(outline) },
        borders: { ...borders, rsmKey: "borders", svgPath: path(borders) },
      }
    : {}
}

// Prepared features are cached per projection path, keyed by the source
// feature. A feature that survives a data update unchanged keeps both its
// serialized svgPath and its object identity, so memoized consumers can bail.
const preparedByPath = new WeakMap()

export function prepareFeatures(geographies, path, getKey) {
  if (!geographies) return []

  let cache = preparedByPath.get(path)
  if (!cache) {
    cache = new WeakMap()
    preparedByPath.set(path, cache)
  }

  return geographies.map((d, i) => {
    const cached = cache.get(d)
    if (cached) return cached
    const prepared = {
      ...d,
      rsmKey: getKey ? getKey(d, i) : `geo-${i}`,
      svgPath: path(d),
    }
    cache.set(d, prepared)
    return prepared
  })
}

export function createConnectorPath(dx = 30, dy = 30, curve = 0.5) {
  const curvature = Array.isArray(curve) ? curve : [curve, curve]
  const curveX = (dx / 2) * curvature[0]
  const curveY = (dy / 2) * curvature[1]
  return `M${0},${0} Q${-dx / 2 - curveX},${-dy / 2 + curveY} ${-dx},${-dy}`
}

export function isString(geo) {
  return typeof geo === "string"
}
