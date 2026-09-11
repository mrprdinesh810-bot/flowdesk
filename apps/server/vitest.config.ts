import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    server: {
      deps: {
        external: [/^node:/, 'node:sqlite'],
      },
    },
  },
});
