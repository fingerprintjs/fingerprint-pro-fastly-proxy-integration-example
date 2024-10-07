// To enable this plugin, please replace the suffix from `.example.ts` to `.ts`

import { KVStore } from 'fastly:kv-store'
import { ProcessOpenClientResponseContext } from '../src/utils/processOpenClientResponse'
import { PluginType, registerPlugin } from '../src/utils/registerPlugin'
async function fingerprintProcessOpenClientResponseKVStorage(context: ProcessOpenClientResponseContext) {
  const requestId = context.event?.products.identification?.data?.requestId
  if (!requestId) {
    return
  }
  const store = new KVStore('FingerprintResults')
  await store.put(requestId, JSON.stringify(context.event))
}

registerPlugin({
  name: 'Fingerprint Process Open Client Response with Fastly KV Storage',
  function: fingerprintProcessOpenClientResponseKVStorage,
  type: PluginType.ProcessOpenClientResponse,
})
