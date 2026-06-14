import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    tailwindcss(),
    preact(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['src/**/*.test.*', 'src/**/*.d.ts'],
      tsconfigPath: './tsconfig.json',
      skipDiagnostics: true,
    }),
  ],
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'RuleFlowEditor',
      formats: ['es', 'cjs'],
      fileName: (format) => `ruleflow-edit.${format}.js`,
    },
    rollupOptions: {
      external: ['preact', 'preact/hooks', 'preact/compat', '@preact/signals', '@logicflow/core', '@logicflow/extension'],
      output: {
        globals: {
          preact: 'preact',
          'preact/hooks': 'preactHooks',
          'preact/compat': 'preactCompat',
          '@preact/signals': 'preactSignals',
          '@logicflow/core': 'LogicFlow',
          '@logicflow/extension': 'LogicFlowExtension',
        },
      },
    },
  },
})
