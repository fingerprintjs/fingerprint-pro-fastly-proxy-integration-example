import {
  FingerprintDecryptionKeyName,
  FingerprintSecretStoreName,
  IntegrationEnv,
  isOpenClientResponseEnabled,
} from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createErrorResponseForIngress,
  createFallbackErrorResponse,
} from '../utils'
import { getFilteredCookies } from '../utils/cookie'
import { SecretStore } from 'fastly:secret-store'
import { unsealData } from '../utils/unsealData'
import { processOpenClientResponse } from '../utils/processOpenClientResponse'

async function makeIngressRequest(receivedRequest: Request, env: IntegrationEnv) {
  const url = new URL(receivedRequest.url)
  url.pathname = ''
  addTrafficMonitoringSearchParamsForVisitorIdRequest(url)
  const oldCookieValue = receivedRequest.headers.get('cookie')
  const newCookieValue = getFilteredCookies(oldCookieValue, (key) => key === '_iidt')
  const request = new Request(url, receivedRequest)
  if (newCookieValue) {
    request.headers.set('cookie', newCookieValue)
  } else {
    request.headers.delete('cookie')
  }
  addProxyIntegrationHeaders(request.headers, receivedRequest.url, env)

  console.log(`sending ingress request to ${url.toString()}...`)

  if (!isOpenClientResponseEnabled(env)) {
    return fetch(request, { backend: 'fpjs' })
  }

  const secretStore = new SecretStore(FingerprintSecretStoreName)
  const decryptionKey = await secretStore.get(FingerprintDecryptionKeyName).then((v) => v?.plaintext())
  if (!decryptionKey) {
    throw new Error('Decryption key not found in secret store')
  }

  try {
    const response = await fetch(request, { backend: 'fpjs' })

    // Parse the open response
    const text = await response.text()
    const event = await unsealData(JSON.parse(text).sealedResult, decryptionKey)
    void processOpenClientResponse({ event, sealedResult: JSON.parse(text).sealedResult }) // void means skip awaiting this and handle it in the background

    return new Response(text, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    })
  } catch (e) {
    console.error('ingress request failed', e)
    throw e
  }
}

function makeCacheEndpointRequest(receivedRequest: Request, routeMatches: RegExpMatchArray | undefined) {
  const url = new URL(receivedRequest.url)
  const pathname = routeMatches ? routeMatches[1] : undefined
  url.pathname = pathname ?? ''

  const request = new Request(url, receivedRequest)
  request.headers.delete('Cookie')

  console.log(`sending cache request to ${url}...`)
  return fetch(request, { backend: 'fpjs' })
}

export async function handleIngressAPI(
  request: Request,
  env: IntegrationEnv,
  routeMatches: RegExpMatchArray | undefined
) {
  if (request.method === 'GET') {
    try {
      return await makeCacheEndpointRequest(request, routeMatches)
    } catch (e) {
      return createFallbackErrorResponse(e)
    }
  }

  try {
    return await makeIngressRequest(request, env)
  } catch (e) {
    return createErrorResponseForIngress(request, e)
  }
}
