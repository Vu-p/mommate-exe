# GA4 setup for MomMate

## Google configuration

1. Create or select a GA4 property and web data stream.
2. Copy the stream Measurement ID (`G-...`) to the public frontend environment as `VITE_GA4_MEASUREMENT_ID`.
3. Enable the Google Analytics Data API in a Google Cloud project.
4. Create a service account and add its email to the GA4 property with Viewer access.

## Backend environment

Set `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, and `GA4_PRIVATE_KEY`. Preserve private-key line breaks as escaped `\n` characters when the hosting provider stores the value on one line.

Alternatively, set one of these values instead of email/private key:

- `GA4_SERVICE_ACCOUNT_PATH` for a local credential file outside source control
- `GA4_SERVICE_ACCOUNT_JSON`
- `GA4_SERVICE_ACCOUNT_BASE64`

Never add real credentials to `.env.example`, frontend variables, source control, screenshots, or browser-visible responses.

For this workspace, the local backend uses `GA4_SERVICE_ACCOUNT_PATH=../docs/mommate-501007-998c61a999dc.json`. The file is explicitly ignored by Git. Production should use a hosting secret or mounted secret file instead of committing this JSON.

## GA4 property settings

MomMate sends SPA page views manually with `send_page_view: false`. Disable automatic history-change page views in Enhanced Measurement so routes are not counted twice. Keep automatic page-load tracking disabled if the property is configured through another tag manager.

Mark `booking_request_submitted`, `payment_success`, and `review_submitted` as key events when they should appear in the conversion KPI. GA4 may take time to expose newly collected dimensions and events in core reports; use DebugView for immediate verification.

## Verification

1. Start the public app with a test Measurement ID and clear `mommate.analytics.consent` from local storage.
2. Confirm no Google Analytics script or request appears before consent.
3. Accept analytics cookies and navigate through multiple routes.
4. Verify one `page_view` per route and inspect the funnel events in DebugView.
5. Start the admin app, open `/admin/ga4`, and verify Overview, Realtime, and Data Explorer.
