/// <reference types="@fastly/js-compute" />
import { handleReq } from './handler'
import { IntegrationEnv } from './env'
import { ConfigStore } from 'fastly:config-store'
import { returnHttpResponse } from './utils/returnHttpResponse'
import { createFallbackErrorResponse } from './utils'

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)))

async function handleRequest(event: FetchEvent): Promise<Response> {
  try {
    const request = event.request
    const envObj = getEnvObject()
    return handleReq(request, envObj).then(returnHttpResponse)
  } catch (e) {
    console.error(e)
    return createFallbackErrorResponse('something went wrong')
  }
}

function getEnvObject(): IntegrationEnv {
  let config
  try {
    config = new ConfigStore('Fingerprint')
  } catch (e) {
    console.error(e)
  }

  if (config == null) {
    return {
      AGENT_SCRIPT_DOWNLOAD_PATH: null,
      GET_RESULT_PATH: null,
      PROXY_SECRET: null,
      FPJS_CDN_URL: null,
      FPJS_INGRESS_BASE_HOST: null,
    }
  }

  return {
    AGENT_SCRIPT_DOWNLOAD_PATH: config.get('AGENT_SCRIPT_DOWNLOAD_PATH'),
    GET_RESULT_PATH: config.get('GET_RESULT_PATH'),
    PROXY_SECRET: config.get('PROXY_SECRET'),
    FPJS_CDN_URL: config.get('FPJS_CDN_URL'),
    FPJS_INGRESS_BASE_HOST: config.get('FPJS_INGRESS_BASE_HOST'),
  }
}
