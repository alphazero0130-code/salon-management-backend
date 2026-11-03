# Prompt: Update the frontend to match the Salon Management API

Use this prompt in the AI tool after opening the **frontend project**. Also give the AI
`API_REFERENCE.md` from the backend repository (or make that repository available in the
workspace) so it can verify the exact API contract.

---

You are working in the existing salon-management frontend. Update the frontend so its
features, API requests, authentication, user roles, and displayed data work with the
Salon Management backend.

## Before changing code

1. Inspect the frontend project structure, framework, existing UI, API client, environment
   configuration, and tests. Preserve the current design and conventions where possible.
2. Read the backend's `API_REFERENCE.md`. If the backend source is also available, compare
   the reference with the mounted routes, controllers, and models when a contract is
   unclear or appears inconsistent. Do not invent endpoints, fields, roles, or response
   shapes.
3. Make the changes in the existing frontend project. Do not rewrite or modify the backend
   unless explicitly asked.

## Backend connection

- Local backend base URL: `http://localhost:3000`
- Deployed backend base URL: `https://salon-management-backend-1t3o.onrender.com`
- Use the environment-variable convention already used by the frontend to configure the
  base URL. Do not hardcode the deployed URL in application code.
- The backend allows browser origins configured in its `CORS_ORIGINS` environment
  variable. If a browser request is blocked by CORS, report the required backend setting;
  do not work around it with a public proxy.
- JSON requests should use `Content-Type: application/json`.
- Protected requests must send `Authorization: Bearer <JWT>`. Use the token returned by
  login, store it using the frontend's existing secure/session conventions, and handle
  expired or rejected authentication consistently.

## API areas to integrate

Use `API_REFERENCE.md` for the current paths, methods, payloads, query parameters, roles,
and response details. The backend includes:

- Authentication and user administration: `/api/auth`
- Customer management: `/api/customers`
- Services: `/api/services`
- Appointments and appointment revenue/service reports: `/api/appointments`
- Staff: `/api/staff`
- Payments: `/api/payment`
- Revenue reports: `/api/reports`
- Role-aware dashboard: `/api/dashboard`

The API reference documents endpoint-specific permissions. Reflect those permissions in
the UI, but always treat the backend as authoritative: hiding a control in the frontend is
not authorization. Show useful feedback for `400`, `401`, `403`, `404`, `409`, and server
errors.

## Implementation requirements

- Reuse or improve the existing API client rather than scattering raw URLs and fetch logic.
- Keep request/response data typed or validated according to the frontend's existing
  language and conventions.
- Match request fields and enum values exactly. Do not silently rename backend fields.
- Support pagination and filters only where the corresponding endpoint supports them.
- Show loading, empty, success, and error states for data-driven screens and mutations.
- Keep customer, staff, and admin experiences aligned with their backend permissions and
  data. Do not expose another user's private records.
- Use the dashboard endpoint's documented role-specific response. Do not assume placeholder
  features such as rewards, coupons, membership, or notifications are backed by real
  functionality.
- Preserve unrelated frontend functionality and styling.
- Update relevant frontend documentation and environment examples if needed. Never include
  real credentials, tokens, or secrets in source control.

## Verify before finishing

Run the frontend's existing lint, type-check, build, and focused tests where available.
Fix failures caused by your changes. Then report:

1. What screens and flows were updated.
2. Which environment variable configures the API base URL and how to set it locally and
   for deployment.
3. Validation commands run and their results.
4. Any backend contract mismatch or deployment configuration that still needs attention.

Do not claim an endpoint or flow works unless it has been checked against the backend
contract or exercised successfully.
