/// <reference types="@fastly/js-compute" />
import {handleReq} from "./handler";
import {IntegrationEnv} from "./env";
import { ConfigStore } from "fastly:config-store";
import {returnHttpResponse} from "./utils/returnHttpResponse";
import {createFallbackErrorResponse} from "./utils";

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event: FetchEvent): Promise<Response> {
    try {
        const request = event.request;
        const clientIp = event.client.address
        const config = new ConfigStore('Fingerprint');
        const envObj: IntegrationEnv = {
            AGENT_SCRIPT_DOWNLOAD_PATH: config.get('AGENT_SCRIPT_DOWNLOAD_PATH'),
            GET_RESULT_PATH: config.get('GET_RESULT_PATH'),
            PROXY_SECRET: config.get('PROXY_SECRET')
        }
        return handleReq(request, envObj, clientIp).then(returnHttpResponse)
    } catch (e) {
        console.error(e)
        return createFallbackErrorResponse('something went wrong')
    }
}
