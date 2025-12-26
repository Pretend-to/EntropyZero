module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/i18n/**',
    '!**/node_modules/**'
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['i18next.t', 'i18n.t', 't'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallbackKey: function(ns, value) {
        return value;
      }
    },
    lngs: ['zh-CN', 'en-US', 'ja-JP'],
    ns: ['common', 'ui', 'task', 'error'],
    defaultLng: 'zh-CN',
    defaultNs: 'common',
    defaultValue: '__STRING_NOT_TRANSLATED__',
    resource: {
      loadPath: 'src/i18n/resources/{{lng}}/{{ns}}.json',
      savePath: 'src/i18n/resources/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },
    nsSeparator: ':',
    keySeparator: '.',
    interpolation: {
      prefix: '{{',
      suffix: '}}'
    }
  }
}