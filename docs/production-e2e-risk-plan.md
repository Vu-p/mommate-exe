# Production E2E risk plan

This plan is the safety gate for automated checks against the MomMate production user and admin apps. It does not authorize deployment, environment changes, load testing, or use of real customer accounts or data.

## Preconditions

- Use dedicated production test accounts for user, carer, and admin roles.
- Keep credentials only in ignored `.env.e2e.production.local`; never log environment values.
- Prefix all records created by automation with `E2E_` and make them uniquely identifiable.
- Run serially with minimal traffic. Disable retries that could duplicate mutations.
- Keep `E2E_RUN_DESTRUCTIVE=false` by default and require `E2E_CLEANUP=true` for any guarded mutation.
- Do not retain storage state, cookies, tokens, traces, screenshots containing private data, or sensitive reports.

## Safe to automate in production

- Guest navigation, public page availability, routing, and non-sensitive content rendering.
- Login and logout for dedicated test accounts, with credential and token redaction.
- Read-only role and access-control checks for user, carer, and admin test accounts.
- Read-only profile, booking, service, dashboard, and list/detail views scoped to generated test data.
- Validation checks that do not submit forms or trigger external providers.

These checks should avoid screenshots on authenticated pages unless the page is known to contain only synthetic test data.

## Requires dedicated test accounts

- User profile and protected user routes.
- Carer profile, availability, assignment, attendance, and booking views.
- Admin dashboard, users, carers, bookings, incidents, reviews, reconciliation, and revenue views.
- Cross-role authorization checks and session refresh/logout behavior.

Automation must never enumerate or inspect unrelated customer records. Tests should navigate directly to known `E2E_` records where possible.

## Destructive or mutating flows

The following require `E2E_RUN_DESTRUCTIVE=true`, generated `E2E_` data, serial execution, and a verified cleanup path:

- Creating or editing profiles, addresses, care requests, availability, services, bookings, messages, reviews, or incidents.
- Changing booking state, assigning a carer, recording attendance, or changing workflow state.
- Admin changes to users, carers, services, reviews, incidents, or reconciliation records.

Permanent delete, refund, ban, reject, irreversible status transitions, and mutations of existing production records remain prohibited even when the destructive flag is enabled.

## Cleanup requirements

- Record every created identifier in memory for same-run cleanup; do not print identifiers if they expose private data.
- Cleanup only records created by the current run and carrying the expected `E2E_` marker.
- Verify ownership and current state before cleanup.
- If cleanup cannot be proven safe and reversible, skip the mutation and mark the flow as manual QA required.
- Report cleanup success as counts and status only, without payloads, cookies, or tokens.

## Manual QA only

- Real payment initiation, capture, refund, reconciliation side effects, and payment-provider callbacks.
- Email, SMS, password-reset delivery, OTP, and notification-provider delivery.
- OAuth/social-login flows that could contact external identity providers.
- Permanent deletion, bans, rejection, refunds, irreversible workflow changes, and any operation on real customer data.
- High-volume, concurrency, load, stress, or abuse testing.

Payment UI may be checked only up to the point before provider submission when a documented sandbox/test mode is confirmed. Otherwise it stays manual.

## Stop conditions

Stop immediately if a test reaches non-test customer data, an external provider could be contacted, cleanup ownership is uncertain, an unexpected mutation occurs, or a report/trace risks capturing a credential, token, cookie, or private user data.
