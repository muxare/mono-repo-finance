/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_API_BASE_URL: string
    readonly VITE_API_BASE_URL_HTTP: string
    readonly VITE_WS_URL: string
    readonly VITE_APP_VERSION: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
