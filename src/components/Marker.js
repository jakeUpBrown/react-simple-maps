import { use, useState } from "react"

import { MapContext } from "./MapProvider"

const Marker = ({
  ref,
  coordinates,
  children,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  style = {},
  className = "",
  ...restProps
}) => {
  const { projection } = use(MapContext)
  const [isPressed, setPressed] = useState(false)
  const [isFocused, setFocus] = useState(false)

  const [x, y] = projection(coordinates)

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

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={`rsm-marker ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={
        style[
          isPressed || isFocused ? (isPressed ? "pressed" : "hover") : "default"
        ]
      }
      {...restProps}
    >
      {children}
    </g>
  )
}

export default Marker
