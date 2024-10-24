const esbuild = require('esbuild')

// Load environment variables from process.env
const configStoreName = process.env.CONFIG_STORE_NAME || 'Fingerprint'

esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    outdir: './build',
    bundle: true,
    format: 'cjs',
    external: ['fastly:*'],
    define: { 'process.env.CONFIG_STORE_NAME': JSON.stringify(configStoreName) },
  })
  .catch(() => process.exit(1))
