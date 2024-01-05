export type IntegrationEnv = {
    AGENT_SCRIPT_DOWNLOAD_PATH: string | null
    GET_RESULT_PATH: string | null
    PROXY_SECRET: string | null
}

const Defaults: IntegrationEnv = {
    AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
    GET_RESULT_PATH: 'getResult',
    PROXY_SECRET: null,
}

function getVarOrDefault(variable: keyof IntegrationEnv, defaults: IntegrationEnv): (env: IntegrationEnv) => string | null {
    return function (env: IntegrationEnv): string | null {
        return (env[variable] || defaults[variable]) as string | null
    }
}

function isVarSet(variable: keyof IntegrationEnv): (env: IntegrationEnv) => boolean {
    return function (env: IntegrationEnv): boolean {
        return !!env[variable]
    }
}

export const agentScriptDownloadPathVarName = 'AGENT_SCRIPT_DOWNLOAD_PATH'
const getAgentPathVar = getVarOrDefault(agentScriptDownloadPathVarName, Defaults)
export const isScriptDownloadPathSet = isVarSet(agentScriptDownloadPathVarName)

export function getScriptDownloadPath(env: IntegrationEnv): string {
    const agentPathVar = getAgentPathVar(env)
    return `/${agentPathVar}`
}

export const getResultPathVarName = 'GET_RESULT_PATH'
const getGetResultPathVar = getVarOrDefault(getResultPathVarName, Defaults)
export const isGetResultPathSet = isVarSet(getResultPathVarName)

export function getGetResultPath(env: IntegrationEnv): string {
    const getResultPathVar = getGetResultPathVar(env)
    return `/${getResultPathVar}(/.*)?`
}

export const proxySecretVarName = 'PROXY_SECRET'
const getProxySecretVar = getVarOrDefault(proxySecretVarName, Defaults)
export const isProxySecretSet = isVarSet(proxySecretVarName)

export function getProxySecret(env: IntegrationEnv): string | null {
    return getProxySecretVar(env)
}

export function getStatusPagePath(): string {
    return `/status`
}
