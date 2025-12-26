import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'

export interface UseI18nReturn {
  t: (key: string, options?: any) => string
  language: string
  changeLanguage: (lng: string) => Promise<any>
  languages: string[]
  isRTL: boolean
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string
  formatRelativeTime: (date: Date) => string
}

export const useI18n = (): UseI18nReturn => {
  const { t, i18n } = useTranslation()
  
  const isRTL = useMemo(() => {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur']
    return rtlLanguages.includes(i18n.language.split('-')[0])
  }, [i18n.language])
  
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(date)
  }
  
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(number)
  }
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second')
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
    }
  }
  
  return {
    t,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
    languages: Object.keys(i18n.options.resources || {}),
    isRTL,
    formatDate,
    formatNumber,
    formatRelativeTime
  }
}