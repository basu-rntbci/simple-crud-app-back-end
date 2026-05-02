// Staging environment — used when building with --configuration staging.
//
// WHY a separate staging environment?
//   Staging mirrors production as closely as possible but points to a
//   separate database and may enable extra logging or debug tooling.
//   This way you can catch bugs before they hit the production URL.
//
// API URL: '/api' works because the Kubernetes Ingress routes all /api/*
// requests to the backend service. The Angular app never hardcodes the
// backend hostname — the Ingress acts as the traffic director.
export const environment = {
  production: true,        // enable AOT, tree-shaking, minification
  staging: true,           // flag you can check in code to enable extra debug info
  apiUrl: '/api',
};
