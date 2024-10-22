import { createClient } from '../utils/createClient'

export function purgeCache(service_id: string) {
  return createClient('purge').purgeAll({
    service_id,
  })
}
