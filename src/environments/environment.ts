type AppConfig = {
  apiBaseUrl?: string;
};

const runtimeConfig = (
  typeof window !== 'undefined'
    ? (window as Window & { __APP_CONFIG__?: AppConfig }).__APP_CONFIG__ ?? {}
    : {}
) as AppConfig;

export const environment = {
  production: false,
  apiBaseUrl: runtimeConfig.apiBaseUrl ?? 'http://localhost:4000/api',
};