import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'

export async function processUnsealedResult(data: EventResponse | null): Promise<void> {
  if (!data || !data.products.identification?.data?.requestId) {
    return
  }

  const filteredPlugins = plugins.filter((t) => t.type === 'processUnsealedResult')
  for (const filteredPlugin of filteredPlugins) {
    // @ts-ignore
    eval(`${filteredPlugin.handler}(data.products.identification.data.requestId, data)`)
  }
}
