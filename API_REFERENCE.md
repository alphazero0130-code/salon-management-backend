# Salon Management API Reference

This reference describes the routes currently mounted by `app.js`. Update this file whenever an API route, payload, query parameter, permission, or response contract changes.

## Base URL and authentication

- Local base URL: `http://localhost:3000`
- Send JSON request bodies with `Content-Type: application/json`.
- Protected routes require `Authorization: Bearer YOUR_JWT`.
- Routes marked **Admin** require an admin token; **Admin, staff** accepts either role.
- Self-registration is for customers. Admins create staff accounts through the staff API.

## Authentication — `/api/auth`

### `POST /register`

Register a customer and send an email verification code.

**Payload**

```json
{
  "name": "Alex Customer",
  "email": "alex@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

`role` is optional and defaults to `customer`; any other role is rejected. Password must be at least 8 characters. No authentication required.

### `POST /register/verify`

Verify the registration code. No authentication required.

**Payload**

```json
{
  "email": "alex@example.com",
  "otp": "123456"
}
```

### `POST /login`

Log in an active customer, staff member, or admin. No authentication required.

**Payload**

```json
{
  "email": "alex@example.com",
  "password": "password123"
}
```

The response contains a JWT to use for protected routes.

### `GET /user` — Admin

List users.

**Query parameters:** `page`, `limit`, `role` (`admin`, `staff`, `customer`), `status` (`active`, `inactive`), `search` (email search).

### `PATCH /user/role` — Admin

Change a user's role.

**Payload**

```json
{
  "userId": "USER_OBJECT_ID",
  "roleType": "staff"
}
```

`roleType`: `admin`, `staff`, or `customer`.

### `PATCH /user/password` — Admin

Set a user's password.

**Payload**

```json
{
  "userId": "USER_OBJECT_ID",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

Passwords must be at least 8 characters and match.

## Customers — `/api/customers`

Customer records contain personal data, so these endpoints are restricted to staff and admins. Customers cannot access the customer-management API; they self-register through `/api/auth/register`.

### `GET /` — Admin, staff

List customers.

**Query parameters:** `page`, `limit`, `search` (name search), `status` (`active`, `inactive`), `sortBy` (`name`, `createdAt`).

### `GET /:id` — Admin, staff

Fetch one customer. **Path parameter:** `id` (customer ObjectId). The `id` segment is optional; omit it to list customers.

### `POST /` — Admin, staff

Create a customer and an active customer login record.

**Payload**

```json
{
  "name": "Alex Customer",
  "phone": "1234567890",
  "email": "alex@example.com",
  "status": "active",
  "password": "password123"
}
```

Required: `name`, `phone`, `email`. `password` is optional; if provided, it must be at least 8 characters. `status` may be `active` or `inactive`.

### `PUT /:id` — Admin, staff

Update a customer. **Path parameter:** `id` (customer ObjectId).

**Payload:** JSON object with customer fields to update, such as `name`, `phone`, `email`, or `status`.

### `PATCH /:id` — Admin, staff

Partially update a customer. **Path parameter:** `id` (customer ObjectId).

**Payload:** at least one of `name`, `phone`, or `email`.

```json
{
  "phone": "9876543210"
}
```

### `DELETE /:id` — Admin

Delete a customer. **Path parameter:** `id` (customer ObjectId). No body.

## Services — `/api/services`

### `GET /` — Authenticated

List services.

**Query parameters:** `page`, `limit`, `search` (name search), `status` (`active`, `inactive`), `sortBy` (`name`, `createdAt`).

### `GET /:id` — Authenticated

Fetch one service. **Path parameter:** `id` (service ObjectId).

### `POST /` — Admin

Create a service.

**Payload**

```json
{
  "name": "Haircut",
  "description": "Wash and haircut",
  "price": 25,
  "duration": 30
}
```

Required: `name`, `price` (non-negative number), and `duration` (positive number). `description` is optional.

### `PUT /:id` — Admin

Update a service. **Path parameter:** `id` (service ObjectId).

**Payload:** JSON object with service fields, such as `name`, `description`, `price`, `duration`, or `isActive`.

### `PATCH /:id` — Admin

Partially update a service. **Path parameter:** `id` (service ObjectId).

**Payload:** at least one of `name`, `description`, `price`, `duration`, or `isActive`.

### `DELETE /:id` — Admin

Delete a service. **Path parameter:** `id` (service ObjectId). No body.

## Appointments — `/api/appointments`

### `POST /` — Admin

Create an appointment and its pending payment record.

**Payload**

```json
{
  "userId": "CUSTOMER_USER_OBJECT_ID",
  "serviceId": "SERVICE_OBJECT_ID",
  "staffId": "STAFF_OBJECT_ID",
  "appointmentDate": "2026-11-15T10:00:00.000Z",
  "notes": "Short appointment note"
}
```

Required: `userId`, `serviceId`, `appointmentDate`. `staffId` and `notes` are optional; `staffId` may be `null`.

### `GET /` — Admin, staff

List appointments.

**Query parameters:** `page`, `limit`, `search` (notes search), `status` (`booked`, `completed`, `cancelled`, `pending`), `sortBy` (`createdAt`, `appointmentDate`, `status`).

Staff see only appointments assigned to their own staff profile; admins see all appointments.

### `GET /:id` — Admin, staff

Fetch one appointment. **Path parameter:** `id` (appointment ObjectId). Staff can fetch only appointments assigned to themselves.

### `PUT /:id` — Admin

Update an appointment. **Path parameter:** `id` (appointment ObjectId).

**Payload:** JSON object containing appointment model fields, for example:

```json
{
  "appointmentDate": "2026-11-15T11:00:00.000Z",
  "staff": "STAFF_OBJECT_ID",
  "status": "booked",
  "notes": "Updated note"
}
```

Appointment status values: `booked`, `completed`, `cancelled`, `pending`.

### `PATCH /:id` — Admin, staff

Partially update an appointment. **Path parameter:** `id` (appointment ObjectId).

Admins may send one or more of `appointmentDate`, `status`, `notes`. Staff may send only `status`, and only for an appointment assigned to them.

```json
{
  "status": "completed"
}
```

### `DELETE /:id` — Admin

Delete an appointment. **Path parameter:** `id` (appointment ObjectId). No body.

### `GET /reports/revenue` — Admin

Get the all-time revenue summary from paid payments. No parameters or body.

### `GET /reports/services` — Admin

Get the all-time paid-revenue breakdown by service. No parameters or body.

## Staff — `/api/staff` — Admin

### `GET /`

List staff.

**Query parameters:** `page`, `limit`, `search` (name search), `sortBy` (`name`, `createdAt`).

### `GET /:id`

Fetch one staff member. **Path parameter:** `id` (staff ObjectId).

### `POST /`

Create a staff profile and active login account.

**Payload**

```json
{
  "name": "Sam Stylist",
  "email": "sam@example.com",
  "jobTitle": "Stylist",
  "password": "password123",
  "role": "staff"
}
```

Required: `name`, `email`, `jobTitle`, `password`. Password must be at least 8 characters. `role` is optional and defaults to `staff`; it may be `staff` or `admin`.

### `PUT /:id`

Update a staff member. **Path parameter:** `id` (staff ObjectId).

**Payload:** JSON object with staff fields, such as `name`, `email`, `jobTitle`, `isAvailable`, or `isActive`.

### `PATCH /:id`

Partially update a staff member. **Path parameter:** `id` (staff ObjectId).

**Payload:** at least one of `name`, `email`, or `jobTitle`.

### `DELETE /:id`

Delete a staff member. **Path parameter:** `id` (staff ObjectId). If appointments are linked to the staff profile, the profile is deactivated instead of deleted.

## Payments — `/api/payment` — Admin

### `GET /`

List payments.

**Query parameters:** `page`, `limit`.

### `GET /:type`

List payments filtered by type.

**Path parameter:** `type` (currently appointment payments use `appointments`).
**Query parameters:** `page`, `limit`.

### `PATCH /:id/status`

Update a payment status and, for appointment payments, synchronize the appointment's payment field.

**Path parameter:** `id` (payment ObjectId).

**Payload**

```json
{
  "status": "paid",
  "method": "cash"
}
```

`status`: `pending`, `paid`, `failed`, or `refunded`. When setting `paid`, `method` is required. This endpoint currently allows manually marking a payment as paid only with `cash`; `card` and `upi` cannot be manually confirmed here.

## Reports — `/api/reports`

### `GET /revenue` — Admin

Get the all-time summary of paid revenue and number of paid payments. No parameters or body.

## Admin dashboard — `/api/admin/dashboard`

### `GET /stats` — Admin

Get dashboard totals and today's appointment/revenue statistics. No parameters or body.

## Pagination defaults

List endpoints generally default to `page=1` and `limit=10`; the maximum limit is 100. Use the individual endpoint descriptions above for supported filters and sort fields.
