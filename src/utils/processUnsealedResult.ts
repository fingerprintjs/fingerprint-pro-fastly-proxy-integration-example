import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'

export async function processUnsealedResult(data: EventResponse | null): Promise<void> {
  console.log({ data })
  // TODO: To be implemented
}
