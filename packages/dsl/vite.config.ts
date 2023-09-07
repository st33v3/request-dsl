import { resolve } from 'path'
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
        formats: ["es", "cjs"],
      // Could also be a dictionary or array of multiple entry points
      entry: [
        resolve(__dirname, 'src/index.ts'),
        resolve(__dirname, 'src/address.ts'),
        resolve(__dirname, 'src/headers.ts'),
        resolve(__dirname, 'src/accept.ts'),
        resolve(__dirname, 'src/recover.ts'),
      ]
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})