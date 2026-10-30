import { FlatCompat } from '@eslint/eslintrc';
import createBaseConfig from '../eslint.config.base.mjs';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...createBaseConfig(import.meta.dirname),
  ...compat.extends('next/core-web-vitals'),
];

export default config;
