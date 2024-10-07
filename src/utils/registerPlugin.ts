import { ProcessOpenClientResponseContext } from './processOpenClientResponse'

export type ProcessUnsealedDataPluginFunction = (context: ProcessOpenClientResponseContext) => void | Promise<void>
export enum PluginType {
  ProcessOpenClientResponse = 'processOpenClientResponse',
}

export type ProcessOpenClientResponsePlugin = {
  name: string
  type: PluginType.ProcessOpenClientResponse
  function: ProcessUnsealedDataPluginFunction
}

export type Plugin = ProcessOpenClientResponsePlugin // This type will be union of types if more plugin/hook types gets introduced
export const plugins: Plugin[] = []

export function registerPlugin(plugin: Plugin) {
  plugins.push(plugin)
}
