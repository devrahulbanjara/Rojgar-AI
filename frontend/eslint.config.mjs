import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import { defineConfig, globalIgnores } from 'eslint/config'

import { LEGACY_LUCIDE, LEGACY_RAW_ELEMENTS, LEGACY_SCSS_ROUTES } from './eslint.legacy.mjs'

// Design-system code: the shared product components and every migrated screen.
const NEW_CODE = [
  'src/components/app/**',
  'src/components/public/**',
  'src/components/me/**',
  'src/components/today/**',
]

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

const LEGACY_COMPONENT_IMPORTS = [
  '@/components/common/header',
  '@/components/common/header/*',
  '@/components/common/footer',
  '@/components/common/footer/*',
  '@/components/common/Loader',
  '@/components/common/Loader/*',
  '@/components/common/SegmentedControl',
  '@/components/common/SegmentedControl/*',
  '@/components/common/Toolbar',
  '@/components/common/Toolbar/*',
  '@/components/sections/*',
  '@/components/layout/DashNavbar',
]

const ICON_MESSAGE = 'Import icons from @/components/icons.'

function imports({ icons = false, scss = false, legacy = false }) {
  return [
    'error',
    {
      paths: icons
        ? [
            { name: 'lucide-react', message: ICON_MESSAGE },
            { name: '@phosphor-icons/react', message: ICON_MESSAGE },
          ]
        : [],
      patterns: [
        ...(icons ? [{ group: ['@phosphor-icons/react/*'], message: ICON_MESSAGE }] : []),
        ...(scss
          ? [{ group: ['*.scss'], message: 'No SCSS in new code: use Tailwind tokens.' }]
          : []),
        ...(legacy
          ? [{ group: LEGACY_COMPONENT_IMPORTS, message: 'Legacy component: use components/app.' }]
          : []),
      ],
    },
  ]
}

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
  // Icons from one module, no SCSS in new routes, no legacy chrome in new code.
  // `no-restricted-imports` blocks override each other, so the file sets are disjoint.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/app/**', ...NEW_CODE, 'src/components/icons.ts', ...LEGACY_LUCIDE],
    rules: { 'no-restricted-imports': imports({ icons: true }) },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    ignores: [...LEGACY_LUCIDE, ...LEGACY_SCSS_ROUTES],
    rules: { 'no-restricted-imports': imports({ icons: true, scss: true }) },
  },
  {
    files: LEGACY_LUCIDE.filter((file) => file.startsWith('src/app/')),
    ignores: LEGACY_SCSS_ROUTES,
    rules: { 'no-restricted-imports': imports({ scss: true }) },
  },
  {
    files: LEGACY_SCSS_ROUTES,
    ignores: LEGACY_LUCIDE,
    rules: { 'no-restricted-imports': imports({ icons: true }) },
  },
  {
    files: NEW_CODE,
    rules: { 'no-restricted-imports': imports({ icons: true, scss: true, legacy: true }) },
  },
  // Raw form/table/dialog elements only inside components/ui.
  {
    files: ['src/app/**/*.tsx', ...NEW_CODE],
    ignores: LEGACY_RAW_ELEMENTS,
    rules: { 'no-restricted-syntax': rawElementRule },
  },
  prettier, // MUST be last to disable formatting conflicts
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
])

export default eslintConfig
