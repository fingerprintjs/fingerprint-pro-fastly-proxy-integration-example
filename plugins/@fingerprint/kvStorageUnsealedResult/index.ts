import { KVStore } from 'fastly:kv-store'
import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'

export default async function (requestId: string, data: EventResponse) {
  const store = new KVStore('FingerprintResults')
  return store.put(requestId, JSON.stringify(data))
}
