import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'
import { plugins, PluginType } from './registerPlugin'

export type ProcessOpenClientResponseContext = {
  event: EventResponse | null
  sealedResult: string
}

export async function processOpenClientResponse(context: ProcessOpenClientResponseContext): Promise<void> {
  const filteredPlugins = plugins.filter((t) => t.type === PluginType.ProcessOpenClientResponse)
  for (const filteredPlugin of filteredPlugins) {
    try {
      await filteredPlugin.function(context)
    } catch (e: any) {
      console.error(`Plugin[${filteredPlugin.name}]`, e)
    }
  }
}
