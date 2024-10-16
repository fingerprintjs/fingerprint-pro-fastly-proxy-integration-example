import { ProcessOpenClientResponseContext } from './processOpenClientResponse'

export type ProcessUnsealedDataPluginFunction = (context: ProcessOpenClientResponseContext) => void | Promise<void>
type PluginType = 'processOpenClientResponse'

export type ProcessOpenClientResponsePlugin = {
  name: string
  type: PluginType
  function: ProcessUnsealedDataPluginFunction
}

export type Plugin = ProcessOpenClientResponsePlugin // This type will be union of types if more plugin/hook types gets introduced
export const plugins: Plugin[] = []

export function registerPlugin(plugin: Plugin) {
  plugins.push(plugin)
}
