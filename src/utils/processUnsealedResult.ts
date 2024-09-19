import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'
import { storeUnsealedResult } from './storeUnsealedResult'

export async function processUnsealedResult(data: EventResponse | null): Promise<void> {
  if (!data || !data.products.identification?.data?.requestId) {
    return
  }

  return storeUnsealedResult(data.products.identification.data.requestId, data)
}
