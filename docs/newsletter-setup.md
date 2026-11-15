# Sender newsletter setup

This site remains static. Sender hosts the signup form, double opt-in, subscriber group and campaign delivery. A GitHub Actions workflow reads the production RSS feed each week and uses Sender’s campaign API only after live sending is explicitly enabled.

## Current free-plan check

Sender’s public Free plan currently lists 2,500 subscribers and 15,000 emails per month. It also lists signup forms, double opt-in, API access, and HTML email campaigns; Sender branding is required on the Free plan. Check the limits in your account before launch because plan terms can change. This implementation does not upgrade the account or add a paid provider.

## 1. Create the Sender audience and form

1. Create or sign in to a Sender account and stay on the Free plan.
2. Create a subscriber group named **Blog subscribers**. Keep the weekly workflow pointed at this group only.
3. Create and publish an **Embedded form**. Add only the email field.
4. In the form’s **Settings → Groups**, select only **Blog subscribers** under the groups that receive new signups.
5. Enable the required **Confirmation checkbox**. Suggested consent text: “I agree to receive occasional email digests of new articles from Ideas Are Better When They Travel. I can unsubscribe at any time.” The nearby site copy links to `/privacy/`.
6. In **Publishing settings**, enable **Double opt-in**. Customize its confirmation email and set the success view to explain: “Check your inbox and click the confirmation link. You are not subscribed until you confirm.”
7. In Sender’s form builder, set useful validation text and the pending, success and error messages. Sender’s embedded form owns email validation and submission feedback; the site never claims a visitor is subscribed on form submission.
8. Publish the form. From its publishing instructions, record the **public account ID** used by the JavaScript snippet and the form ID from `data-sender-form-id`. These are public embed identifiers, not API credentials.

Sender’s current guides: [create an embedded form](https://www.sender.net/help/lead-capture/embedded-signup-form/), [connect a form to a group and consent checkbox](https://www.sender.net/help/lead-capture/connecting-forms-to-lists/), and [enable double opt-in](https://www.sender.net/help/lead-capture/double-opt-in-for-forms/).

The page loads Sender’s official `universal.js` embed with the public account and form IDs captured from the configured form (`5e61f1760a6567` and `aQWP37`) only on the homepage and article pages. These are defaults in `src/lib/sender.ts`; GitHub Actions variables can override them if the form changes. No API token is included in frontend code. The SDK’s attribution option is disabled. The email field, required consent checkbox, confirmation email, form field errors and confirmation state remain controlled by Sender. The page-level copy and privacy link are supplied by this site. If the form uses Google reCAPTCHA, its behavior-analysis and cookie processing is disclosed on the privacy page.

## 2. Verify the sending domain and account details

1. Verify a sending domain in Sender and publish the DNS records Sender provides. Configure the exact SPF and DKIM records it requests; publish a DMARC policy for the domain and review alignment before sending.
2. In Sender account settings, complete the sender/business identity and a valid postal address. The digest footer uses Sender’s `{{ account.address }}`, `{{ account.city }}` and `{{ account.country }}` variables.
3. Confirm that the sender email belongs to the verified sending domain.
4. Review Sender’s data-processing agreement, subprocessors, retention/deletion controls, tracking defaults, and transfer terms in the account. Do not rely on a marketing page alone for your account’s contractual or data-residency terms. Confirm the information in `src/pages/privacy.astro` still matches those settings.

## 3. Create an API token and find the group ID

1. Create a Sender API token with only the permissions needed to create, inspect and send campaigns.
2. Find the **Blog subscribers** group ID in Sender’s group settings or API.
3. Do not paste the API token into the site, a content file, an issue, or this chat.

The workflow uses Sender’s documented `POST /v2/campaigns`, `GET /v2/campaigns/{id}`, and `POST /v2/campaigns/{id}/send` endpoints. It sends a single `groups` ID and no segments or all-audience flag. The custom HTML contains Sender’s documented `{{ unsubscribe_link }}` and `{{ unsubscribe_text }}` variables, plus the account address variables. Keep Sender’s required Free-plan branding enabled.

## 4. Add GitHub configuration

In the repository’s **Settings → Secrets and variables → Actions**, add:

**Secret**

- `SENDER_API_TOKEN` — the Sender API token.

**Variables**

- `SENDER_GROUP_ID` — the ID of **Blog subscribers**.
- `SENDER_FROM_NAME` — verified display name, for example `Chris Ploessl`.
- `SENDER_REPLY_TO` — an address on the verified sending domain.
- `SENDER_PUBLIC_ACCOUNT_ID` — optional override for Sender’s public form SDK/account identifier (defaults to the current form’s ID in `src/lib/sender.ts`).
- `SENDER_FORM_ID` — optional override for the embedded form’s public ID (defaults to the current form’s ID in `src/lib/sender.ts`).
- `NEWSLETTER_LIVE_SEND` — leave unset or set to `false` until you approve live sends.

The public form IDs are injected into the static Pages build. They identify the public embed and are not secrets. The API token is only provided to the newsletter workflow’s live API steps and is never passed to Astro or emitted into site HTML/JavaScript.

## 5. Preview without sending

1. Merge/deploy the code and configure the public form IDs. Confirm the embedded form appears on the home page and article pages; submit a test address and verify the consent checkbox, confirmation email, and unconfirmed/confirmed statuses in Sender.
2. In GitHub, open **Actions → Weekly journal digest → Run workflow** and leave mode set to **preview**.
3. Download the `weekly-newsletter-preview` artifact from the run. It includes all articles that would be sent for the current persisted state, with titles, descriptions, dates, links and available cover images. Preview mode does not call the Sender API or modify digest state.
4. On the first run, `lastSuccessfulDigestAt` is empty, so the preview includes all articles currently in the production feed. If you do not want existing articles in the first live digest, set `initialBaselineAt` in `newsletter/state.json` to a UTC timestamp before those articles. Leave it null to include them.

You can also create a local preview with `pnpm newsletter:preview`; it reads the production RSS feed and writes `.newsletter-preview.html` without sending or changing state.

## 6. Enable and test live sending

Only do this after reviewing the preview, confirming the Sender group and form settings, and explicitly approving live sends:

1. Set repository variable `NEWSLETTER_LIVE_SEND` to `true`.
2. Use **Run workflow → mode: send** for a deliberate first live run. This sends one campaign to the configured **Blog subscribers** group, which contains only confirmed signups when the form’s double opt-in is configured correctly.
3. Verify the campaign and recipient group in Sender. The next scheduled run is automatic. Set `NEWSLETTER_LIVE_SEND` back to `false` to pause sending; preview runs remain available.

Never use a real send mode as a test until you are ready to email the confirmed group. There is no test-recipient override in the live API path; preview mode is the non-sending test.

## Schedule and state safety

The scheduled workflow runs at `08:00 UTC` every Monday. That is `09:00` in Madrid during winter time (CET) and `10:00` during summer time (CEST). GitHub Actions schedule syntax is UTC-only, so one fixed cron time cannot remain exactly 09:00 in Madrid through both daylight-saving changes. Change the cron in `.github/workflows/weekly-newsletter.yml` if you prefer a different side of the seasonal offset.

`newsletter/state.json` stores the last successful digest timestamp, processed canonical article URLs, and a pending Sender campaign. The workflow uses GitHub Actions concurrency to serialize runs and ordinary fast-forward pushes—never force-pushes—to update state.

Before sending, it creates a Sender draft campaign, records that campaign ID and its article URLs in `pendingCampaign`, and pushes that state. Only then does it call Sender’s send endpoint. It adds URLs to `processedArticleUrls` and advances `lastSuccessfulDigestAt` only after Sender confirms sending started. If a run is retried, it retrieves the same campaign: a `SENT` campaign is finalized without another send; a `DRAFT` campaign is sent using its existing ID; ambiguous statuses stop for review. If the API or state push fails before sending, the workflow fails closed. It never force-pushes newer state.

If Sender reports a status other than `DRAFT` or `SENT`, inspect the campaign in Sender before retrying. If GitHub branch protection prevents the Actions token from committing state to `main`, allow the repository’s Actions bot to push these state commits or the workflow will stop before sending.

An empty week creates no campaign and sends nothing. Draft and future-dated entries are excluded from the RSS feed itself. The digest uses that production RSS feed as its only article source. A cover image is included only when the feed contains an image enclosure. Audio links are omitted for now.

## Privacy and consent review

The form asks for only an email address and an explicit confirmation. Sender handles double opt-in and unsubscribe processing; the digest includes a working Sender unsubscribe link and an account-address footer. The site’s privacy page describes this flow. Before activation, verify Sender’s DPA, controller/processor details, subprocessors, retention/deletion and international transfer terms, plus whether the embed or campaign features enable tracking that you do not want. Sender currently lists EU data residency on its Free plan page, but confirm that claim and the governing terms for your specific account rather than relying on this guide.
