import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000,
    // Specs share one Postgres database (truncated per test), so files must
    // run serially — same reason Express wipes tables in beforeEach.
    fileParallelism: false,
  },
});
