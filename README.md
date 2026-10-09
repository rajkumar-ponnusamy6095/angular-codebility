# Codebility Angular

This is an Angular 20 admin application for managing accounts, user records, authentication, and profile settings. It is structured as a standalone SPA with route-based access control and a responsive dashboard layout.

## Current implementations

### Authentication and account flows
- Login page with email/password validation and JWT-based authentication
- Registration page with user creation form and validation
- Forgot password flow
- Reset password flow using token validation
- Email verification flow
- Protected routes using an auth guard and token storage
- Request layer with automatic authentication headers and API error handling

### Dashboard
- Protected dashboard landing screen
- KPI overview cards showing:
  - total users
  - active users
  - admin users
- Data loaded through combined API requests
- Loading and error states for each overview section

### User management
- User listing page with:
  - search
  - filtering by role, status, and department
  - sorting by column
  - pagination
  - configurable page size
- Create user form
- Edit user form
- Delete user confirmation flow
- User model and request/response parsing utilities

### Profile management
- Profile details page for the signed-in user
- Editable profile form with validation
- Change password form with confirmation checks
- Current account data loaded from the backend and synced with auth state

### Application shell and UX
- App layout with header and sidebar navigation
- Responsive mobile navigation behavior
- Theme selection support (blue, orange, pink, green, yellow)
- Bootstrap and Bootstrap Icons styling
- Standard error pages for 400, 401, 403, 404, and 500 routes

### API integration
- Centralized `ApiService` wrapper for HTTP calls
- Base URL configured through environment variables
- JSON parsing and consistent API error conversion

## Project structure

```text
src/
  app/
    core/
      auth/               # auth guard, interceptor, token storage, auth service
      layout/             # app shell, header, sidebar, navbar
      models/             # account and department models
      services/           # shared API layer
      theme.service.ts    # theme switcher
    pages/
      dashboard/          # overview dashboard
      login/              # sign-in page
      register/           # registration page
      forgot-password/    # password reset request
      reset-password/     # token-based reset form
      verify-email/       # email verification page
      profile/            # current user profile editor
      users/              # user listing and CRUD forms
      errors/             # error pages
```

## Available routes

- `/login`
- `/register`
- `/forgot-password`
- `/account/reset-password`
- `/account/verify-email`
- `/dashboard`
- `/users`
- `/users/create`
- `/users/:id/edit`
- `/profile`
- `/400`, `/401`, `/403`, `/404`, `/500`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Update the API base URL in the environment file if your backend runs on a different host or port:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:4000/api',
};
```

For runtime overrides in the browser, you can also set:

```ts
window.__APP_CONFIG__ = {
  apiBaseUrl: 'http://localhost:4000/api',
};
```

3. Start the Angular app:

```bash
npm start
```

The app runs in development mode and is usually available at:

```text
http://localhost:4200/
```

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

## Notes

- This app expects a backend API that supports account authentication, user listing, creation, update, deletion, password reset, and email verification flows.
- The authentication layer is implemented with token-based session handling and route guards.
- App styling is driven by Bootstrap 5 and custom Angular component CSS.
