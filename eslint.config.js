import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'e2e']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Capitalized names are exempt: without eslint-plugin-react, components used only in JSX look unused
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', args: 'none', ignoreRestSiblings: true }],
    },
  },
  {
    // shadcn/ui generated components export style variants next to components by design.
    // Must come after the block above, which enables the rule.
    files: ['src/components/ui/**/*.{js,jsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
