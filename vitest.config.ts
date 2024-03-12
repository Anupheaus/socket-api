import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.tests.ts', 'src/**/*.tests.tsx'],
  }
});
