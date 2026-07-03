import { useState } from 'react'

const DESIGN_IMAGES = Array.from({ length: 8 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return `/images/products/design-${n}.jpg`
})

interface ImagePickerProps {
  current: string | null
  onSelect: (url: string) => void
  onClose: () => void
}

/** Overlay for choosing a window's artwork: shipped designs or a custom URL. */
export default function ImagePicker({ current, onSelect, onClose }: ImagePickerProps) {
  const [custom, setCustom] = useState('')

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div className="picker" onClick={e => e.stopPropagation()}>
        <div className="picker-head">
          <span>Choose artwork</span>
          <button className="owner-btn ghost small" onClick={onClose}>Close</button>
        </div>
        <div className="picker-grid">
          {DESIGN_IMAGES.map(src => (
            <button
              key={src}
              className={`picker-thumb ${current === src ? 'active' : ''}`}
              onClick={() => onSelect(src)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <div className="picker-custom">
          <input
            type="url"
            placeholder="Or paste an image URL"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && custom && onSelect(custom)}
          />
          <button
            className="owner-btn solid small"
            disabled={!custom}
            onClick={() => custom && onSelect(custom)}
          >
            Use
          </button>
        </div>
      </div>
    </div>
  )
}
