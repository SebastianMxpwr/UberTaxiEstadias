import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { environment: 'node', include: ['reglas/**/*.spec.ts'], globals: true } });
