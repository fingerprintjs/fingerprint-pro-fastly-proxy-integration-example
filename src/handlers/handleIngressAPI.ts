import { IntegrationEnv } from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createErrorResponseForIngress,
  createFallbackErrorResponse,
} from '../utils'
import { getFilteredCookies } from '../utils/cookie'
import { SecretStore } from 'fastly:secret-store'
import { unsealData } from '../utils/unsealData'

async function makeIngressRequest(receivedRequest: Request, env: IntegrationEnv) {
  // Get decryption key from secret store
  const secretStore = new SecretStore('FingerprintSecrets')
  const decryptionKey = await secretStore.get('decryptionKey').then((v) => v?.plaintext())
  if (!decryptionKey) {
    throw new Error('Decryption key not found in secret store')
  }

  const url = new URL(receivedRequest.url)
  url.pathname = ''
  addTrafficMonitoringSearchParamsForVisitorIdRequest(url)
  const oldCookieValue = receivedRequest.headers.get('cookie')
  const newCookieValue = getFilteredCookies(oldCookieValue, (key) => key === '_iidt')
  const request = new Request(url, receivedRequest as any)
  if (newCookieValue) {
    request.headers.set('cookie', newCookieValue)
  } else {
    request.headers.delete('cookie')
  }
  addProxyIntegrationHeaders(request.headers, receivedRequest.url, env)

  console.log(`sending ingress request to ${url.toString()}...`)

  try {
    const response = await fetch(request, { backend: 'fpjs' })

    // Parse the open response
    const text = await response.text()
    const json = JSON.parse(text)
    const data = await unsealData(json.sealedResult, decryptionKey)

    return new Response(JSON.stringify(data), {
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

  const request = new Request(url, receivedRequest as any)
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
