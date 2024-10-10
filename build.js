const esbuild = require('esbuild')

// Load environment variables from process.env
const configStoreName = process.env.CONFIG_STORE_NAME || 'Fingerprint'

const replacePlugin = {
  name: 'replace',
  setup(build) {
    build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
      const fs = require('fs')
      const source = await fs.promises.readFile(args.path, 'utf8')

      // Replace the string __CONFIG_STORE_NAME__ with the actual value from the env
      const replacedSource = source.replace(/__CONFIG_STORE_NAME__/g, configStoreName)

      return {
        contents: replacedSource,
        loader: 'ts',
      }
    })
  },
}

esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    outdir: './build',
    bundle: true,
    format: 'cjs',
    external: ['fastly:*'],
    plugins: [replacePlugin],
  })
  .catch(() => process.exit(1))
