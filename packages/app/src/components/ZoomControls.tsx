import React from 'react'
import { useI18n } from '../hooks/useI18n'
import './ZoomControls.css'

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToCanvas: () => void
  onResetZoom: () => void
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToCanvas,
  onResetZoom,
}) => {
  const { t } = useI18n()

  const formatZoom = (zoom: number) => {
    return `${Math.round(zoom * 100)}%`
  }

  return (
    <div className="zoom-controls">
      <button
        className="zoom-btn"
        onClick={onZoomIn}
        title={`${t('canvas.zoomIn', { ns: 'ui' })} (Cmd +)`}
      >
        +
      </button>
      
      <div 
        className="zoom-display"
        onClick={onResetZoom}
        title={`${t('canvas.resetZoom', { ns: 'ui' })} (Cmd 0)`}
      >
        {formatZoom(zoom)}
      </div>
      
      <button
        className="zoom-btn"
        onClick={onZoomOut}
        title={`${t('canvas.zoomOut', { ns: 'ui' })} (Cmd -)`}
      >
        -
      </button>
      
      <div className="zoom-divider" />
      
      <button
        className="zoom-btn zoom-btn--fit"
        onClick={onFitToCanvas}
        title={t('canvas.fitToScreen', { ns: 'ui' })}
      >
        ⌂
      </button>
    </div>
  )
}

export default ZoomControls