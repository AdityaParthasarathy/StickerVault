import { useEffect, useRef, useState } from 'react'
import type { FC, MouseEvent as ReactMouseEvent } from 'react'
import type { Sticker } from '@shared/types'
import { CloseIcon } from './icons'
import { removeBackground } from '../lib/removeBackground'
import { STICKER_FONTS } from '../lib/stickerFonts'
import './StickerEditor.css'

interface StickerEditorProps {
  sticker: Sticker
  onClose: () => void
  onSaved: (sticker: Sticker) => void
}

interface TextLayer {
  id: string
  text: string
  color: string
  fontFamily: string
  size: number
  x: number
  y: number
}

const CANVAS_MAX_DIMENSION = 520

function createLayerId(): string {
  return Math.random().toString(36).slice(2)
}

const StickerEditor: FC<StickerEditorProps> = ({ sticker, onClose, onSaved }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseImageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ layerId: string; offsetX: number; offsetY: number } | null>(null)

  const [baseImageUrl, setBaseImageUrl] = useState(
    `stickervault-media://originals/${sticker.filename}`
  )
  const [isImageReady, setIsImageReady] = useState(false)
  const [isRemovingBackground, setIsRemovingBackground] = useState(false)
  const [bgProgress, setBgProgress] = useState(0)
  const [bgError, setBgError] = useState<string | null>(null)
  const [hasRemovedBackground, setHasRemovedBackground] = useState(false)
  const [textLayers, setTextLayers] = useState<TextLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const selectedLayer = textLayers.find((layer) => layer.id === selectedLayerId) ?? null

  // Load whichever image is currently "current" (original, or the
  // background-removed cutout) into an offscreen <img> the canvas draws
  // from, sizing the canvas to match once it's ready.
  useEffect(() => {
    setIsImageReady(false)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      baseImageRef.current = image
      const canvas = canvasRef.current
      if (canvas) {
        const scale = Math.min(1, CANVAS_MAX_DIMENSION / Math.max(image.width, image.height))
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
      }
      setIsImageReady(true)
    }
    image.src = baseImageUrl
  }, [baseImageUrl])

  const draw = (showSelection: boolean): void => {
    const canvas = canvasRef.current
    const image = baseImageRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    for (const layer of textLayers) {
      ctx.font = `${layer.size}px ${layer.fontFamily}`
      ctx.fillStyle = layer.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(layer.text, layer.x, layer.y)

      if (showSelection && layer.id === selectedLayerId) {
        const width = ctx.measureText(layer.text).width
        ctx.save()
        ctx.strokeStyle = '#7c6cf6'
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 4])
        ctx.strokeRect(
          layer.x - width / 2 - 8,
          layer.y - layer.size / 2 - 6,
          width + 16,
          layer.size + 12
        )
        ctx.restore()
      }
    }
  }

  useEffect(() => {
    if (isImageReady) draw(true)
  }, [isImageReady, textLayers, selectedLayerId])

  const hitTestLayer = (x: number, y: number): TextLayer | null => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return null

    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i]
      ctx.font = `${layer.size}px ${layer.fontFamily}`
      const width = ctx.measureText(layer.text).width
      const left = layer.x - width / 2 - 8
      const right = layer.x + width / 2 + 8
      const top = layer.y - layer.size / 2 - 6
      const bottom = layer.y + layer.size / 2 + 6
      if (x >= left && x <= right && y >= top && y <= bottom) return layer
    }
    return null
  }

  const canvasPoint = (event: ReactMouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const handleCanvasMouseDown = (event: ReactMouseEvent<HTMLCanvasElement>): void => {
    const point = canvasPoint(event)
    const hit = hitTestLayer(point.x, point.y)
    setSelectedLayerId(hit?.id ?? null)
    if (hit) {
      dragRef.current = { layerId: hit.id, offsetX: point.x - hit.x, offsetY: point.y - hit.y }
    }
  }

  const handleCanvasMouseMove = (event: ReactMouseEvent<HTMLCanvasElement>): void => {
    const drag = dragRef.current
    if (!drag) return
    const point = canvasPoint(event)
    setTextLayers((current) =>
      current.map((layer) =>
        layer.id === drag.layerId
          ? { ...layer, x: point.x - drag.offsetX, y: point.y - drag.offsetY }
          : layer
      )
    )
  }

  const handleCanvasMouseUp = (): void => {
    dragRef.current = null
  }

  const handleAddText = (): void => {
    const canvas = canvasRef.current
    const newLayer: TextLayer = {
      id: createLayerId(),
      text: 'Text',
      color: '#ffffff',
      fontFamily: STICKER_FONTS[0].family,
      size: Math.round((canvas?.height ?? 300) * 0.14),
      x: (canvas?.width ?? 300) / 2,
      y: (canvas?.height ?? 300) / 2
    }
    setTextLayers((current) => [...current, newLayer])
    setSelectedLayerId(newLayer.id)
  }

  const updateSelectedLayer = (patch: Partial<TextLayer>): void => {
    if (!selectedLayerId) return
    setTextLayers((current) =>
      current.map((layer) => (layer.id === selectedLayerId ? { ...layer, ...patch } : layer))
    )
  }

  const handleDeleteLayer = (): void => {
    if (!selectedLayerId) return
    setTextLayers((current) => current.filter((layer) => layer.id !== selectedLayerId))
    setSelectedLayerId(null)
  }

  const handleRemoveBackground = async (): Promise<void> => {
    setBgError(null)
    setIsRemovingBackground(true)
    setBgProgress(0)
    try {
      const blob = await removeBackground(baseImageUrl, setBgProgress)
      const url = URL.createObjectURL(blob)
      setBaseImageUrl(url)
      setHasRemovedBackground(true)
    } catch {
      setBgError('Background removal failed. Try again, or check your internet connection.')
    } finally {
      setIsRemovingBackground(false)
    }
  }

  const handleSave = (): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsSaving(true)
    draw(false)
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsSaving(false)
        return
      }
      const bytes = new Uint8Array(await blob.arrayBuffer())
      const newSticker = await window.api.importGeneratedSticker(
        bytes,
        `${sticker.displayName} edited`
      )
      setIsSaving(false)
      onSaved(newSticker)
    }, 'image/png')
  }

  return (
    <div
      className="editor-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="editor" role="dialog" aria-modal="true" aria-label="Edit sticker">
        <div className="editor__header">
          <h2>Edit Sticker</h2>
          <button type="button" className="editor__close" title="Close" onClick={onClose}>
            <CloseIcon className="editor__close-icon" />
          </button>
        </div>

        <div className="editor__body">
          <div className="editor__canvas-pane">
            <canvas
              ref={canvasRef}
              className="editor__canvas"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {isRemovingBackground && (
              <div className="editor__overlay">
                <div className="editor__spinner" />
                <p>
                  Removing background…
                  {bgProgress > 0 && ` ${Math.round(bgProgress * 100)}%`}
                </p>
                <p className="editor__overlay-hint">
                  The first time can take a bit longer while a small ML model downloads.
                </p>
              </div>
            )}
          </div>

          <div className="editor__sidebar">
            <div className="editor__section">
              <button
                type="button"
                className="editor__action"
                onClick={handleRemoveBackground}
                disabled={isRemovingBackground}
              >
                {hasRemovedBackground ? 'Remove Background Again' : 'Remove Background'}
              </button>
              {bgError && <p className="editor__error">{bgError}</p>}
            </div>

            <div className="editor__section">
              <button type="button" className="editor__action" onClick={handleAddText}>
                + Add Text
              </button>
            </div>

            {selectedLayer && (
              <div className="editor__section editor__text-controls">
                <span className="editor__section-label">Text</span>
                <input
                  type="text"
                  value={selectedLayer.text}
                  onChange={(event) => updateSelectedLayer({ text: event.target.value })}
                />

                <span className="editor__section-label">Color</span>
                <input
                  type="color"
                  value={selectedLayer.color}
                  onChange={(event) => updateSelectedLayer({ color: event.target.value })}
                />

                <span className="editor__section-label">Font</span>
                <select
                  value={selectedLayer.fontFamily}
                  onChange={(event) => updateSelectedLayer({ fontFamily: event.target.value })}
                >
                  {STICKER_FONTS.map((font) => (
                    <option key={font.label} value={font.family} style={{ fontFamily: font.family }}>
                      {font.label}
                    </option>
                  ))}
                </select>

                <span className="editor__section-label">Size</span>
                <input
                  type="range"
                  min={16}
                  max={120}
                  value={selectedLayer.size}
                  onChange={(event) =>
                    updateSelectedLayer({ size: Number(event.target.value) })
                  }
                />

                <button type="button" className="editor__delete-layer" onClick={handleDeleteLayer}>
                  Delete text
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="editor__footer">
          <button type="button" className="editor__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="editor__save"
            onClick={handleSave}
            disabled={isSaving || isRemovingBackground}
          >
            {isSaving ? 'Saving…' : 'Save as new sticker'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StickerEditor
