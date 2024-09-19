import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'
import { KVStore } from 'fastly:kv-store'

export async function storeUnsealedResult(requestId: string, data: EventResponse) {
  const store = new KVStore('FingerprintResults')
  return store.put(requestId, JSON.stringify(data))
}
