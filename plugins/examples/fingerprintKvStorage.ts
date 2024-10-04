// To enable this plugin, please move it to: <project-root>./plugins/fingerprintKvStorage.ts
// Don't forget to replace import paths after moving

import { KVStore } from 'fastly:kv-store'
import { PluginType, registerPlugin } from '../src/utils/registerPlugin'
import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'
async function fingerprintProcessUnsealedResult(requestId: string, data: EventResponse | null) {
  const store = new KVStore('FingerprintResults')
  await store.put(requestId, JSON.stringify(data))
}

registerPlugin({
  name: 'Fingerprint Process Unsealed Result with Fastly KV Storage',
  function: fingerprintProcessUnsealedResult,
  type: PluginType.ProcessUnsealedResult,
})
