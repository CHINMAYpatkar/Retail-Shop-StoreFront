import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Matches the admin app's setup so the two repos behave the same way.
 *
 * `.mts` because a `.ts` config is loaded as CommonJS and warns on every run.
 * The default environment is Node; specs needing a DOM opt in per file with
 * `// @vitest-environment jsdom`, which keeps pure-logic specs fast.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      exclude: ['src/test/**', '**/*.d.ts', '.next/**'],
    },
  },
});
