import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: '"use client";' },
});
