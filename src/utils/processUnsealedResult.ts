import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'
import { plugins, PluginType } from './registerPlugin'

export async function processUnsealedResult(data: EventResponse | null): Promise<void> {
  if (!data || !data.products.identification?.data?.requestId) {
    return
  }

  const filteredPlugins = plugins.filter((t) => t.type === PluginType.ProcessUnsealedResult)
  for (const filteredPlugin of filteredPlugins) {
    try {
      await filteredPlugin.function(data.products.identification.data.requestId, data)
    } catch (e: any) {
      console.error(`Plugin[${filteredPlugin.name}]`, e)
    }
  }
}
