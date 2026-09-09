import { memo, useId, useState } from "react"

// SVG has no stroke alignment, so an inset stroke is a stroke of twice the
// width with its outer half clipped away.
function doubleStrokeWidth(width) {
  const n = typeof width === "number" ? width : parseFloat(width)
  return Number.isFinite(n) ? n * 2 : width
}

const Geography = ({
  ref,
  geography,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  style = {},
  className = "",
  insetStroke = false,
  strokeWidth,
  ...restProps
}) => {
  const [isPressed, setPressed] = useState(false)
  const [isFocused, setFocus] = useState(false)
  const reactId = useId()

  function handleMouseEnter(evt) {
    setFocus(true)
    if (onMouseEnter) onMouseEnter(evt)
  }

  function handleMouseLeave(evt) {
    setFocus(false)
    if (isPressed) setPressed(false)
    if (onMouseLeave) onMouseLeave(evt)
  }

  function handleFocus(evt) {
    setFocus(true)
    if (onFocus) onFocus(evt)
  }

  function handleBlur(evt) {
    setFocus(false)
    if (isPressed) setPressed(false)
    if (onBlur) onBlur(evt)
  }

  function handleMouseDown(evt) {
    setPressed(true)
    if (onMouseDown) onMouseDown(evt)
  }

  function handleMouseUp(evt) {
    setPressed(false)
    if (onMouseUp) onMouseUp(evt)
  }

  const stateStyle =
    style[
      isPressed || isFocused ? (isPressed ? "pressed" : "hover") : "default"
    ]

  // React 19 ids carry «» or : delimiters, neither usable inside url(#…).
  const clipId = insetStroke
    ? `rsm-clip-${reactId.replace(/[^A-Za-z0-9_-]/g, "")}`
    : undefined

  const path = (
    <path
      ref={ref}
      tabIndex="0"
      className={`rsm-geography ${className}`}
      d={geography.svgPath}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={
        insetStroke && stateStyle && stateStyle.strokeWidth !== undefined
          ? {
              ...stateStyle,
              strokeWidth: doubleStrokeWidth(stateStyle.strokeWidth),
            }
          : stateStyle
      }
      strokeWidth={
        insetStroke && strokeWidth !== undefined
          ? doubleStrokeWidth(strokeWidth)
          : strokeWidth
      }
      clipPath={insetStroke ? `url(#${clipId})` : undefined}
      {...restProps}
    />
  )

  if (!insetStroke) return path

  // A clipPath is never painted, so it needs no defs, and the default
  // clipPathUnits="userSpaceOnUse" resolves in the path's own coordinates.
  return (
    <>
      <clipPath id={clipId}>
        <path d={geography.svgPath} />
      </clipPath>
      {path}
    </>
  )
}

export default memo(Geography)
