"use client"

import type { CellTag, PixelTemplate } from "@/lib/pet/templates"
import type { PetPalette } from "@/lib/pet/colors"

interface PixelPetCanvasProps {
  template: PixelTemplate
  palette: PetPalette
  size?: number
}

function getCellColor(tag: CellTag, palette: PetPalette): string | null {
  switch (tag) {
    case "body":
      return palette.body
    case "accent":
      return palette.accent
    case "eye":
      return palette.eye
    case "mouth":
      return palette.mouth
    case "cheek":
      return palette.cheek
    case "outline":
      return palette.outline
    case "ear-inner":
      return palette.earInner
    case "accessory-slot":
      return palette.accent
    case "empty":
    default:
      return null
  }
}

export function PixelPetCanvas({ template, palette, size = 64 }: PixelPetCanvasProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      {template.map((row, y) =>
        row.map((cell, x) => {
          const color = getCellColor(cell, palette)
          if (!color) return null
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={color}
            />
          )
        })
      )}
    </svg>
  )
}
