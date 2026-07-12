import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsParser from '@typescript-eslint/parser'

export default [
  { ignores: ['dist', 'node_modules', 'src/vite-env.d.ts', 'vite.config.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', console: 'readonly', localStorage: 'readonly',
        navigator: 'readonly', URL: 'readonly', Blob: 'readonly', FormData: 'readonly',
        FileReader: 'readonly', confirm: 'readonly', alert: 'readonly', setTimeout: 'readonly',
        clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
        google: 'readonly', HTMLButtonElement: 'readonly', HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly', HTMLTextAreaElement: 'readonly', HTMLElement: 'readonly',
        HTMLAnchorElement: 'readonly',
      },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'off',
    },
  },
]
