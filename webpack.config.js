const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const esbuild = require('esbuild')

class AddGlobalFunctionsPlugin {
  constructor(globalFunctionDefinitions) {
    this.globalFunctionDefinitions = globalFunctionDefinitions
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('AddGlobalFunctionsPlugin', (compilation, callback) => {
      // Loop through all compiled assets
      for (const filename in compilation.assets) {
        // Only modify the main output file
        if (filename === 'index.js') {
          // Get the existing source code
          const source = compilation.assets[filename].source()
          // Append the global functions to the source code
          const updatedSource = source + '\n' + this.globalFunctionDefinitions
          // Update the asset with the new source
          compilation.assets[filename] = {
            source: () => updatedSource,
            size: () => updatedSource.length,
          }
        }
      }
      callback()
    })
  }
}

// Helper to check if a file or directory exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath)
  } catch (err) {
    return false
  }
}

// Function to sanitize plugin names
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_') // Replace invalid characters
}

// Function to transpile TypeScript to JavaScript in memory using esbuild
function transpileTsInMemory(tsFilePath) {
  const result = esbuild.transformSync(fs.readFileSync(tsFilePath, 'utf-8'), {
    loader: 'ts',
    format: 'cjs', // Output as CommonJS
    target: 'esnext', // Target ES2020
  })

  const outputLines = result.code.split('\n')
  const moduleExportIndex = outputLines.findIndex((line) =>
    line.includes('module.exports = __toCommonJS(stdin_exports);')
  )

  // Get the lines after the module export
  const relevantLines = moduleExportIndex >= 0 ? outputLines.slice(moduleExportIndex + 1) : []

  return relevantLines.join('\n')
}

let globalFunctionDefinitions = ''

// Function to load all plugins and inject them into the global state
function loadPlugins() {
  const pluginDir = path.resolve(__dirname, './plugins')
  const organizations = fs.readdirSync(pluginDir)
  const plugins = []

  organizations.forEach((org) => {
    const orgPath = path.resolve(pluginDir, org)
    const pluginNames = fs.readdirSync(orgPath)

    pluginNames.forEach((pluginName) => {
      const pluginPath = path.resolve(orgPath, pluginName)
      const pluginJsonPath = path.resolve(pluginPath, 'plugin.json')
      const indexFile = path.resolve(pluginPath, 'index.ts')

      if (fileExists(pluginJsonPath)) {
        const pluginData = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'))

        if (fileExists(indexFile)) {
          // Transpile the TypeScript file to JavaScript in memory
          const transpiledHandlerCode = transpileTsInMemory(indexFile)

          // Sanitize the function name
          const sanitizedName = `plugin_${sanitizeName(pluginData.name)}`

          globalFunctionDefinitions += `\n${transpiledHandlerCode.replace('stdin_default', sanitizedName)}\n`

          plugins.push({
            name: pluginData.name,
            type: pluginData.type,
            handler: sanitizedName,
          })
        }
      }
    })
  })

  return plugins
}

// Load plugins synchronously during build
const plugins = loadPlugins()

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'build'),
    library: {
      name: 'MyLibrary', // Change this to your library name
      type: 'umd', // Universal Module Definition
    },
  },
  target: ['browserslist:> 0.25%, not dead'],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: [
    ({ request }, callback) => {
      if (request && request.startsWith('fastly:')) {
        return callback(null, 'commonjs ' + request)
      }
      callback()
    },
  ],
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      plugins: JSON.stringify(plugins), // Keep as JSON string for later use
    }),
    new AddGlobalFunctionsPlugin(globalFunctionDefinitions),
  ],
}
