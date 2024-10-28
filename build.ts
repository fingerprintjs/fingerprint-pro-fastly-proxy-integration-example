import { build } from 'esbuild'
import { readdirSync, writeFileSync, unlinkSync } from 'fs'
import { join, extname, basename } from 'path'

const configStoreName = process.env.CONFIG_STORE_NAME || 'Fingerprint'

function getPluginEntries(folder: string) {
  const dirPath = join(__dirname, folder)
  return readdirSync(dirPath)
    .filter((file) => extname(file) === '.ts' && !basename(file).endsWith('.example.ts'))
    .map((file) => `import '${join(dirPath, file).replace(/\\/g, '/')}';`)
}

const virtualEntry = './virtual-entry.ts'
const pluginImports = getPluginEntries('./plugins').join('\n')
const entryContent = `import './src/index.ts';\n${pluginImports}`

writeFileSync(virtualEntry, entryContent)

build({
  entryPoints: [virtualEntry],
  outfile: './build/index.js',
  bundle: true,
  format: 'cjs',
  external: ['fastly:*'],
  define: { 'process.env.CONFIG_STORE_NAME': `"${configStoreName}"` },
  platform: 'node',
  target: 'esnext',
})
  .then(() => {
    unlinkSync(virtualEntry)
  })
  .catch((error) => {
    console.error('Build failed:', error)
    process.exit(1)
  })
