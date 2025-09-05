// @ts-check

// Enhanced ESLint configuration for Next.js 15
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
// import reactHooksPlugin from 'eslint-plugin-react-hooks'; // Temporarily disabled due to flat config compatibility
import a11yPlugin from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Basic TypeScript rules
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Next.js specific rules
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
  {
    // React specific rules
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      'react': reactPlugin,
      'jsx-a11y': a11yPlugin,
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
    },
  },
  {
    // Performance-related rules
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off', // TypeScript handles this
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      '**/*.config.js',
      '**/*.config.mjs',
      'next-env.d.ts',
      'scripts/**',
      'test-*.js',
      'test-*.tsx',
      'verify-*.js',
      'debug-*.js',
      'check-*.js',
      'clean-start.js',
      'server.js',
      'simple-server.js',
      'revert-*.js',
    ],
  }
);
