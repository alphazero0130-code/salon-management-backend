## Deployment configuration

Browser requests are allowed only from origins listed in the backend's `CORS_ORIGINS`
environment variable. Set it to a comma-separated list of frontend origins, including the scheme
and optional port but no path, for example:

```text
CORS_ORIGINS=https://your-frontend.example.com,http://localhost:5173
```

If `CORS_ORIGINS` is unset, only `http://localhost:3000` is allowed. Update this setting in the
backend deployment environment and restart/redeploy the backend after changing it. The CORS
allow-list does not authenticate callers; protected endpoints still require valid authentication.
Cross-origin cookies are not enabled.

Separately, set the frontend's API base URL in Vercel to
`https://salon-management-backend-1t3o.onrender.com` (without a trailing slash), using the
environment-variable name expected by the frontend's API client, then redeploy the frontend.
