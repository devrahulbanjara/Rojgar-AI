import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import { defineConfig, globalIgnores } from 'eslint/config'

const RAW_ELEMENT_MESSAGE =
  'Use the shared primitive from @/components/ui (Button, Input, Select, Textarea, Table, Dialog) instead of a raw element.'

const rawElementRule = [
  'error',
  ...['button', 'select', 'textarea', 'table', 'dialog'].map((name) => ({
    selector: `JSXOpeningElement[name.name='${name}']`,
    message: RAW_ELEMENT_MESSAGE,
  })),
  {
    // Hidden file inputs are the one allowed raw input (FileUpload wraps them).
    selector:
      "JSXOpeningElement[name.name='input']:not(:has(JSXAttribute[name.name='type'][value.value='file']))",
    message: RAW_ELEMENT_MESSAGE,
  },
]

const ICON_MESSAGE = 'Import icons from @/components/icons.'

const restrictedImports = [
  'error',
  {
    paths: [{ name: '@phosphor-icons/react', message: ICON_MESSAGE }],
    patterns: [
      { group: ['@phosphor-icons/react/*'], message: ICON_MESSAGE },
      { group: ['*.scss', '*.sass'], message: 'No SCSS: use Tailwind tokens.' },
    ],
  },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'react/jsx-key': 'error',
    },
  },
  // Icons only through the registry; no SCSS anywhere.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/icons.ts'],
    rules: { 'no-restricted-imports': restrictedImports },
  },
  // Raw form/table/dialog elements only inside components/ui.
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/components/ui/**'],
    rules: { 'no-restricted-syntax': rawElementRule },
  },
  prettier, // MUST be last to disable formatting conflicts
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
])

export default eslintConfig
