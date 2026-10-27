## Deployment configuration

The API allows browser requests from any origin and does not require frontend domains to be
configured in the backend. CORS does not authenticate callers; protected endpoints still require
valid authentication. Cross-origin cookies are not enabled.

Separately, set the frontend's API base URL in Vercel to
`https://salon-management-backend-1t3o.onrender.com` (without a trailing slash), using the
environment-variable name expected by the frontend's API client, then redeploy the frontend.
