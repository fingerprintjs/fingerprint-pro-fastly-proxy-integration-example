import {getScriptDownloadPath, getGetResultPath, IntegrationEnv, getStatusPagePath} from './env'

import {handleDownloadScript, handleIngressAPI, handleStatusPage} from './handlers'
import {createRoute} from './utils'
import {setClientIp} from "./utils/clientIp";

export type Route = {
    pathPattern: RegExp
    handler: (
        request: Request,
        env: IntegrationEnv,
        routeMatchArray: RegExpMatchArray | undefined,
    ) => Response | Promise<Response>
}

function createRoutes(env: IntegrationEnv): Route[] {
    const routes: Route[] = []
    const downloadScriptRoute: Route = {
        pathPattern: createRoute(getScriptDownloadPath(env)),
        handler: handleDownloadScript,
    }
    const ingressAPIRoute: Route = {
        pathPattern: createRoute(getGetResultPath(env)),
        handler: handleIngressAPI,
    }
    const statusRoute: Route = {
        pathPattern: createRoute(getStatusPagePath()),
        handler: (request, env) => handleStatusPage(request, env),
    }
    routes.push(downloadScriptRoute)
    routes.push(ingressAPIRoute)
    routes.push(statusRoute)

    return routes
}

function handleNoMatch(urlPathname: string): Response {
    const responseHeaders = new Headers({
        'content-type': 'application/json',
    })

    return new Response(JSON.stringify({error: `unmatched path ${urlPathname}`}), {
        status: 404,
        headers: responseHeaders,
    })
}

export function handleRequestWithRoutes(
    request: Request,
    env: IntegrationEnv,
    routes: Route[],
): Promise<Response> | Response {
    const url = new URL(request.url)
    for (const route of routes) {
        const matches = url.pathname.match(route.pathPattern)
        if (matches) {
            return route.handler(request, env, matches)
        }
    }

    return handleNoMatch(url.pathname)
}

export async function handleReq(request: Request, env: IntegrationEnv, clientIp: string): Promise<Response> {
    setClientIp(clientIp)
    const routes = createRoutes(env)
    return handleRequestWithRoutes(request, env, routes)
}
