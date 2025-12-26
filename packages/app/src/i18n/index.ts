import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入语言资源
import zhCN from './resources/zh-CN'
import enUS from './resources/en-US'
import jaJP from './resources/ja-JP'

const resources = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    debug: true, // Explicitly set to true for debugging
    
    // 语言检测配置
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'entropy-zero-language',
    },
    
    // 插值配置
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS
      format: (value, format, lng) => {
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value)
        }
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'CNY'
          }).format(value)
        }
        return value
      }
    },
    
    // 命名空间配置
    ns: ['common', 'ui', 'task', 'error'],
    defaultNS: 'common',
    
    // 后备配置
    saveMissing: false, // 生产环境关闭
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation: ${lng}.${ns}.${key}`)
      }
    }
  })

export default i18n