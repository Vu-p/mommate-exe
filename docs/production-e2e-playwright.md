# MomMate production Playwright E2E

This suite provides low-traffic, full-role functional checks for the MomMate production user and admin applications. It is isolated from the existing localhost/mock Playwright tests by `front-end/playwright.production.config.ts` and `front-end/tests/e2e/production`.

## Environment setup

Create the ignored repository-root file `.env.e2e.production.local` from `.env.e2e.example`. Populate only dedicated production E2E accounts and synthetic test data.

Required keys:

```text
USER_APP_URL
ADMIN_APP_URL
API_BASE_URL
E2E_USER_EMAIL
E2E_USER_PASSWORD
E2E_CARER_EMAIL
E2E_CARER_PASSWORD
E2E_ADMIN_EMAIL
E2E_ADMIN_PASSWORD
E2E_ACCOUNT_PREFIX
E2E_TEST_PHONE
E2E_TEST_ADDRESS
E2E_PAYMENT_TEST_MODE
E2E_RUN_DESTRUCTIVE
E2E_CLEANUP
```

Production-safe defaults are:

```text
E2E_PAYMENT_TEST_MODE=false
E2E_RUN_DESTRUCTIVE=false
E2E_CLEANUP=true
```

The loader rejects missing values, non-boolean safety flags, and non-HTTPS production URLs. It never prints environment values.

## Architecture

- `auth.setup.ts` logs in with dedicated accounts and writes per-role state to ignored `playwright/.auth` files.
- `guest.spec.ts` covers public navigation, listings, details, information pages, NotFound, responsive overflow, and invalid-login error handling.
- `user.spec.ts` covers profile, password page, discovery, booking form validation, requests, and conditional record-backed pages.
- `carer.spec.ts` covers verified profile, application pages without resubmission, bookings, conditional detail, and unsigned contract rendering.
- `admin.spec.ts` covers admin routing and read-only operational pages without clicking mutation actions.
- `full-journey.spec.ts` covers safe discovery and booking-form navigation, while explicitly guarding state-changing journey stages.

## Running smoke checks

From `front-end`:

```powershell
npm run e2e:prod:smoke
```

Smoke checks still authenticate real dedicated E2E accounts and send minimal production traffic. Review the production risk plan before running them.

## Running the full non-destructive suite

```powershell
npm run e2e:prod:full
```

With `E2E_RUN_DESTRUCTIVE=false`, mutation tests skip. Missing E2E-owned bookings or conversations also skip without failing unrelated role coverage.

## Guarded destructive checks

```powershell
npm run e2e:prod:destructive
```

The command alone does not authorize mutations. `E2E_RUN_DESTRUCTIVE=true` and `E2E_CLEANUP=true` are both required. Payment-related work additionally requires `E2E_PAYMENT_TEST_MODE=true`. Booking creation remains skipped until a proven E2E-only cleanup endpoint exists. Payment, refund, approval, rejection, ban, deletion, contract signing, and external notification/provider actions remain manual unless a later prompt explicitly establishes a safe reversible flow.

## Reports and traces

```powershell
npm run e2e:prod:report
```

The production config uses HTML reports, trace-on-first-retry, screenshots only on failure, and videos retained on failure. These artifacts can contain private page data and must remain local. Delete them after investigation when retention is unnecessary.

## Never commit

- `.env*` files containing values
- `.vercel`
- `playwright/.auth` or browser cookies
- `test-results`, `playwright-report`, or `blob-report`
- screenshots, videos, traces, ZIP archives, or HAR files
- logs or fixtures containing credentials, tokens, production record identifiers, or private user data

## Known skips and limitations

- Booking detail, payment, review, incident, and message checks require a suitable E2E-owned record and skip when none exists.
- No real payment is submitted.
- Reviews and incidents are not submitted by the non-destructive suite.
- Contracts are rendered but never signed.
- Admin pages are read-only; no approval, rejection, deletion, refund, ban, or status-change action is clicked.
- Full booking creation is intentionally blocked because the current API does not expose a proven safe cleanup contract.
