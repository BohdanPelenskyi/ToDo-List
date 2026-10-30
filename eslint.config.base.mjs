import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default function createBaseConfig(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ['dist/**', '.next/**', 'coverage/**', 'next-env.d.ts'] },
    js.configs.recommended,
    {
      files: ['**/*.cjs'],
      languageOptions: { sourceType: 'commonjs', globals: globals.node },
    },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
    {
      // Mocked methods are always referenced unbound, e.g. expect(Model.create).toHaveBeenCalled().
      files: ['**/*.test.{ts,tsx}'],
      rules: { '@typescript-eslint/unbound-method': 'off' },
    },
    prettier,
  );
}
