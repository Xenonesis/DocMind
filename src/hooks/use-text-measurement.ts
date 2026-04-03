'use client'

import { useCallback, useRef, useMemo } from 'react'
import { prepare, layout } from '@chenglou/pretext'

interface TextMeasurementOptions {
  font?: string
  whiteSpace?: 'normal' | 'pre-wrap'
  maxWidth?: number
  lineHeight?: number
}

interface TextMeasurementResult {
  height: number
  lineCount: number
}

interface PreparedText {
  prepared: ReturnType<typeof prepare>
  font: string
  whiteSpace: 'normal' | 'pre-wrap'
}

export function useTextMeasurement(options: TextMeasurementOptions = {}) {
  const {
    font = '14px Inter, system-ui, sans-serif',
    whiteSpace = 'pre-wrap',
    maxWidth = 300,
    lineHeight = 20,
  } = options

  const cacheRef = useRef<Map<string, PreparedText>>(new Map())

  const measureText = useCallback(
    (text: string, width?: number): TextMeasurementResult => {
      const cacheKey = `${text}|${font}|${whiteSpace}`
      let preparedData = cacheRef.current.get(cacheKey)

      if (!preparedData) {
        const prepared = prepare(text, font, { whiteSpace })
        preparedData = { prepared, font, whiteSpace }
        cacheRef.current.set(cacheKey, preparedData)
      }

      const { height, lineCount } = layout(preparedData.prepared, width ?? maxWidth, lineHeight)
      return { height, lineCount }
    },
    [font, whiteSpace, maxWidth, lineHeight]
  )

  const invalidateCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  const getTextHeight = useCallback(
    (text: string, width?: number): number => {
      return measureText(text, width).height
    },
    [measureText]
  )

  const getLineCount = useCallback(
    (text: string, width?: number): number => {
      return measureText(text, width).lineCount
    },
    [measureText]
  )

  return useMemo(
    () => ({
      measureText,
      getTextHeight,
      getLineCount,
      invalidateCache,
    }),
    [measureText, getTextHeight, getLineCount, invalidateCache]
  )
}

export function useTextareaAutoResize(
  options: TextMeasurementOptions & { minHeight?: number; maxHeight?: number } = {}
) {
  const {
    minHeight = 56,
    maxHeight = 200,
    font = '14px Inter, system-ui, sans-serif',
    whiteSpace = 'pre-wrap',
    lineHeight = 20,
  } = options

  const measurement = useTextMeasurement({
    font,
    whiteSpace,
    lineHeight,
  })

  const calculateHeight = useCallback(
    (text: string, width: number): number => {
      const { height } = measurement.measureText(text, width)
      return Math.min(Math.max(height + 20, minHeight), maxHeight)
    },
    [measurement, minHeight, maxHeight]
  )

  return useMemo(
    () => ({
      calculateHeight,
      measurement,
    }),
    [calculateHeight, measurement]
  )
}
