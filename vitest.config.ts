import os from 'os'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['lib/**/__tests__/**/*.test.ts'],
    environment: 'node',
    // Los tests nunca escriben PDFs ni adjuntos en storage/facturacion real
    env: { FAC_STORAGE_ROOT: path.join(os.tmpdir(), 'innovapp-fac-tests-storage') },
  },
})
