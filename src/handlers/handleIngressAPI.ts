import {IntegrationEnv} from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createErrorResponseForIngress,
  createFallbackErrorResponse,
} from '../utils'
import {getFilteredCookies} from "../utils/cookie";
import {inflateRaw} from "pako";
import {gcm} from "@noble/ciphers/aes";
import {KVStore} from 'fastly:kv-store'
import {SecretStore} from 'fastly:secret-store'
import {EventResponse} from "@fingerprintjs/fingerprintjs-pro-server-api";


// Utility function that converts base64 string to Uint8Array
function base64StrToUint8Array(str: string) {
  const binary = atob(str)
  const data = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i)
  }

  return data
}

const SEALED_HEADER = new Uint8Array([0x9e, 0x85, 0xdc, 0xed])

// Decrypts data using "@noble/ciphers/aes" package, because default node encryption API is not available in edge runtime
function decrypt(sealedData: Uint8Array, decryptionKey: Uint8Array) {
  const nonceLength = 12
  const nonce = sealedData.slice(SEALED_HEADER.length, SEALED_HEADER.length + nonceLength)
  const ciphertext = sealedData.slice(SEALED_HEADER.length + nonceLength)

  const aes = gcm(decryptionKey, nonce)
  const data = aes.decrypt(ciphertext)
  const decompressed = inflateRaw(data)

  return new TextDecoder().decode(decompressed)
}


async function unsealData(rawSealedData: string, rawKey: string): Promise<EventResponse | null> {
  try {
    const sealedData = base64StrToUint8Array(rawSealedData);
    const key = base64StrToUint8Array(rawKey)

    const result = decrypt(sealedData, key)

    return JSON.parse(result)
  } catch (e) {
    console.error('failed to unseal data', e)

    return null
  }
}


async function makeIngressRequest(
  receivedRequest: Request,
  env: IntegrationEnv,
) {
  // Get decryption key from secret store
  const secretStore = new SecretStore('identificationSecret')
  const decryptionKey = await secretStore.get('decryptionKey').then(v => v?.plaintext())
  if(!decryptionKey) {
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
    const response = await fetch(request, {backend: 'fpjs'})
    // Parse the open response
    const text = await response.text()
    const json = JSON.parse(text)

    const data = await unsealData(json.sealedResult, decryptionKey)
    if(data?.products?.identification?.data) {
      // Example use-case: store unsealed data in KV store
      const store = new KVStore('FingerprintResults')
      await store.put(data.products.identification.data.requestId, JSON.stringify(data))

      // Read stored entry
      const entry = await store.get(data.products.identification.data.requestId)
      if(entry) {
        console.log('kv store entry', await entry.json())
      }

      // Example use-case: add visitor id to response headers
      response.headers.set('visitor-id', data.products.identification.data.visitorId)
      response.headers.set('request-id', data.products.identification.data.requestId)
    }

    // Return response received from Fingerprint API
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

  const request = new Request(url, receivedRequest as any)
  request.headers.delete('Cookie')

  console.log(`sending cache request to ${url}...`)
  return fetch(request, {backend: 'fpjs'})
}

export async function handleIngressAPI(request: Request, env: IntegrationEnv, routeMatches: RegExpMatchArray | undefined) {
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
