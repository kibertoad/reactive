import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@tanstack/react-router',
        '@tanstack/react-query',
        '@testing-library/react',
        'zustand',
        '@reactive/core',
        '@reactive/registry',
      ],
    },
    sourcemap: true,
  },
})
