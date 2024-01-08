import {
    addTrafficMonitoringSearchParamsForProCDN,
    createFallbackErrorResponse,
    getAgentScriptPath,
} from '../utils'

function makeDownloadScriptRequest(request: Request): Promise<Response> {
    const url = new URL(request.url)
    url.pathname = getAgentScriptPath(url.searchParams)
    addTrafficMonitoringSearchParamsForProCDN(url)

    const newRequest = new Request(url.toString(), request)
    newRequest.headers.delete('Cookie')

    console.log(`Downloading script from cdnEndpoint ${url.toString()}...`)
    return fetch(newRequest, {backend: 'fpcdn' })
}

export async function handleDownloadScript(request: Request): Promise<Response> {
    try {
        return await makeDownloadScriptRequest(request)
    } catch (e) {
        return createFallbackErrorResponse(e)
    }
}
