import React from 'react'
import './ValidationMessage.css'

interface ValidationMessageProps {
  type: 'error' | 'warning'
  message: string
  onClose?: () => void
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type,
  message,
  onClose
}) => {
  return (
    <div className={`validation-message validation-message--${type}`}>
      <div className="validation-message__content">
        <span className="validation-message__icon">
          {type === 'error' ? '⚠️' : '💡'}
        </span>
        <span className="validation-message__text">{message}</span>
        {onClose && (
          <button 
            className="validation-message__close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default ValidationMessage