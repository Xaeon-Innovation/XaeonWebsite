# Builder payments

Code lives in `backend/src/services/payments/`:

- `types.ts`: the `PaymentProvider` interface.
- `kashier.ts` and `polar.ts`: the two providers.
- `index.ts`: picks the provider.

Order and webhook handling: `backend/src/controllers/builder.controller.ts` (`createOrder`, `paymentWebhook`, `markOrderPaid`).

## Country first
- Step 1 of the wizard asks **where the business is**. The country decides the market:

  | Country | Currency |
  |---|---|
  | Egypt | EGP |
  | UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman | AED (the Gulf price list) |
  | Jordan or another country | USD |

  The list is in `COUNTRY_MARKET` (`backend/src/models/builderShared.ts`), mirrored in `web/src/lib/builder.ts`.
- The server derives the currency from `order.country` and ignores any `market` sent by the browser.
- `GET /builder/catalog` returns `payments: { EGP|AED|USD: { online, provider?, methods[] } }`. The wizard uses it to show the payment options for the customer's country:
  - right after they pick it;
  - in the review step;
  - on the submit button ("Continue to payment" or "Send my order").
- A country with no online provider gets the invoice/bank-transfer message, and the quote shows "Deposit (invoiced)".

## Flow
1. `POST /api/v1/builder/orders` computes the quote and saves the order and its lead.
2. If the deposit is above 0 and `providerFor(currency)` finds a configured provider:
   - `createCheckout` runs, the order becomes `awaiting_payment`, and the response includes `checkoutUrl`.
   - The browser redirects the customer to the checkout.
3. The provider sends the customer back to `https://xaeons.com[/ar]/website-builder/success?ref=…&token=…`. That page polls `GET /api/v1/builder/orders/:ref/status?token=…` (the token is an HMAC of the ref).
4. The provider calls `POST /api/v1/builder/payments/<provider>/webhook`:
   - The signature is checked. A bad signature gets 401.
   - A paid event runs `markOrderPaid`: order → `paid`, lead stage → `won`, and staff and customer get emails.
   - Replays are ignored.
5. With no provider (or a failed checkout start), the order stays `submitted`. Staff send an invoice and use **Mark deposit paid** in Admin → Website Builder → Orders.

Raw request bytes for `/payments/` URLs are kept in `app.ts` (the `express.json` `verify` option) because signatures are computed over them.

## Kashier (EGP, also USD)

| Env | Value |
|---|---|
| `PAYMENT_PROVIDERS` | `kashier` (or `kashier,polar`) |
| `KASHIER_MERCHANT_ID` | e.g. `MID-xxxx-xxx` |
| `KASHIER_API_KEY` | Payment API key from the Kashier dashboard |
| `KASHIER_MODE` | `test` or `live` |
| `KASHIER_CURRENCIES` | Currencies enabled on your Kashier account (default `EGP,USD`). Add `AED` if Kashier enables it for you; Gulf customers then pay online too. |
| `KASHIER_METHODS` | HPP `allowedMethods` shown to customers (default `card,wallet`; e.g. `card,wallet,bank_installments`) |

**Checkout:** the Hosted Payment Page, `https://payments.kashier.io/?merchantId&orderId&amount&currency&hash&mode&merchantRedirect&serverWebhook…`.
The `hash` is HMAC-SHA256 (hex) of `/?payment=<mid>.<orderId>.<amount>.<currency>`, keyed with the API key. Amount is formatted like `7500.00`.

**Webhook:** Kashier POSTs `{ event: "pay", data }` with the header `x-kashier-signature`. The signature is HMAC-SHA256 (hex) of the query string built from `data[k]` for the sorted `data.signatureKeys`, RFC 3986 encoded.
`data.merchantOrderId` carries our order ref, and `data.status` is `SUCCESS` or `FAILURE`.

⚠️ **Before going live:**
- Check both formats against Kashier's current docs and run one sandbox payment end to end.
- Also set the webhook URL in the Kashier dashboard: `https://api.xaeons.com/api/v1/builder/payments/kashier/webhook`.

## Polar (USD, merchant of record)

| Env | Value |
|---|---|
| `POLAR_ACCESS_TOKEN` | Organisation access token |
| `POLAR_WEBHOOK_SECRET` | From the webhook endpoint settings |
| `POLAR_DEPOSIT_PRODUCT_ID` | A **pay-what-you-want** product named e.g. "Website deposit"; the deposit is sent as `amount` |
| `POLAR_MODE` | `sandbox` or `live` |

**Webhook endpoint:** `https://api.xaeons.com/api/v1/builder/payments/polar/webhook`. Subscribe to `order.paid`.
**Signature:** Standard Webhooks, using the `webhook-id`, `webhook-timestamp` and `webhook-signature: v1,<base64>` headers, with a 5-minute tolerance.

## Tests
`backend/test/builder.test.ts` → "payments" covers:
- the Kashier checkout URL, plus bad and good signatures and replay;
- falling back when no provider supports the currency;
- Polar signatures;
- unknown providers.

## Not yet
- Recurring subscriptions (monthly plan billing) are manual.
- Refunds are handled in the provider dashboards.
- A Paymob or Tap adapter can be added: implement `PaymentProvider` and register it in `index.ts`.
