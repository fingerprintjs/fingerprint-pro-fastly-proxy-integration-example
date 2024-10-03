import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'

export type ProcessUnsealedDataPluginFunction = (requestId: string, data: EventResponse | null) => void | Promise<void>
export enum PluginType {
  ProcessUnsealedResult = 'processUnsealedResult',
}

export type ProcessUnsealedResultPlugin = {
  name: string
  type: PluginType.ProcessUnsealedResult
  function: ProcessUnsealedDataPluginFunction
}

export type Plugin = ProcessUnsealedResultPlugin // This type will be union of types if more plugin/hook types gets introduced
export const plugins: Plugin[] = []

export function registerPlugin(plugin: Plugin) {
  plugins.push(plugin)
}
