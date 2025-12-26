import React from 'react'
import { useI18n } from '../hooks/useI18n'

const languageFlags: Record<string, string> = {
  'zh-CN': '🇨🇳',
  'en-US': '🇺🇸',
  'ja-JP': '🇯🇵'
}

interface LanguageSwitcherProps {
  className?: string
  showFlag?: boolean
  compact?: boolean
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  showFlag = true,
  compact = false
}) => {
  const { language, changeLanguage, languages, t } = useI18n()
  
  if (compact) {
    return (
      <div className={`language-switcher-compact ${className}`}>
        {languages.map(lng => (
          <button
            key={lng}
            onClick={() => changeLanguage(lng)}
            className={`language-option ${language === lng ? 'active' : ''}`}
            title={t(`languages.${lng}`, { ns: 'common' })}
          >
            {showFlag ? languageFlags[lng] : lng.split('-')[0].toUpperCase()}
          </button>
        ))}
      </div>
    )
  }
  
  return (
    <select 
      value={language} 
      onChange={(e) => changeLanguage(e.target.value)}
      className={`language-switcher ${className}`}
    >
      {languages.map(lng => (
        <option key={lng} value={lng}>
          {showFlag && languageFlags[lng]} {t(`languages.${lng}`, { ns: 'common' })}
        </option>
      ))}
    </select>
  )
}