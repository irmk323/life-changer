import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts because this suite needs a running Firestore emulator —
// see `npm run test:rules`. Kept out of the normal `npm test` run entirely.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/services/firebase/firestore.rules.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
