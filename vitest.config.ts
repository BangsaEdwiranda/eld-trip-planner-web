import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Unit tests target the pure logic (lib/* and component helpers), so the
// default Node environment is enough — no jsdom needed.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
