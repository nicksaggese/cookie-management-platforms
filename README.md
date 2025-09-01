# Consent Cookie Registry & Decoder

This repo maintains a registry of common Consent Management Platform (CMP) cookies and provides a reference decoder to normalize them into a **universal consent object**.

## Why?

Every CMP encodes consent preferences differently — often in opaque cookies. This makes it hard to check whether a given user has opted into **marketing, analytics, functional, or strictly necessary** cookies.

This project aims to:

- Maintain a **machine-readable JSON registry** of common CMP cookie formats.
- Provide a **decoder library** to normalize consent into a shared schema.
- Help developers implement compliant tracking and personalization logic.

## Universal Schema

All decoded consent maps to:

    {
      "marketing": true | false | null,
      "analytics": true | false | null,
      "functional": true | false | null,
      "necessary": true
    }

- `true` → consent given
- `false` → consent denied
- `null` → unknown / not set
- `necessary` is always `true` (baseline category)

## Registry Format

`registry.json` describes cookies by CMP vendor:

    {
      "onetrust": {
        "cookies": ["OptanonConsent", "OptanonAlertBoxClosed"],
        "description": "OneTrust consent preferences. 'groups' key encodes category opt-ins."
      },
      "cookiebot": {
        "cookies": ["CookieConsent"],
        "description": "JSON with keys: preferences, statistics, marketing."
      },
      "didomi": {
        "cookies": ["didomi_token"],
        "description": "Base64/JWT-like token containing 'purposes_consent' map."
      },
      "termly": {
        "cookies": ["termly-consent"],
        "description": "JSON with booleans for functional, analytics, advertising."
      },
      "iab_tcf": {
        "cookies": ["euconsent-v2"],
        "description": "IAB Transparency & Consent Framework string. Requires TCF parser."
      }
    }

### Notes on values

- **OneTrust (`OptanonConsent`)**

  - Look for the `groups=` pair. Example: `groups=C0001:1,C0002:0,C0003:0,C0004:1`
  - Typical mapping (tenants may customize):
    - `C0001`: Strictly Necessary
    - `C0002`: Performance/Analytics
    - `C0003`: Functional/Preferences
    - `C0004`: Targeting/Advertising

- **Cookiebot (`CookieConsent`)**

  - URL-encoded JSON with booleans, e.g.
    - `necessary`, `preferences`, `statistics`, `marketing`

- **Didomi (`didomi_token`)**

  - JWT-like payload; decode base64 middle segment for JSON fields such as:
    - `purposes_consent`, `vendors_consent`, `created`, `updated`

- **Termly (`termly-consent`)**

  - JSON with category booleans, often including:
    - `functional`, `analytics`, `advertising` (names can vary by setup)

- **IAB TCF (`euconsent-v2`)**
  - Encodes purpose- and vendor-level consent according to the TCF v2 spec.
  - Use a TCF parser library to interpret (e.g., `@iabtcf/core` in JS).

## Decoder Library

Example JS decoder: `consentDecoder.js` (best-effort parsing without vendor SDKs). Usage:

    import { parseCookieString, decodeConsent } from "./consentDecoder.js";

    const cookies = parseCookieString(document.cookie);
    const consent = decodeConsent(cookies);

    console.log(consent);
    // { marketing: true, analytics: false, functional: true, necessary: true }

## Extending

1. Add new CMPs to `registry.json`.
2. Implement parsing logic in `consentDecoder.js`.
3. Include sample cookie values (anonymized) in tests.
4. Open a PR — contributions welcome.

## Roadmap

- [ ] Add Python server-side decoder
- [ ] Add test suite with real-world cookie samples
- [ ] Integrate IAB TCF parsing library
- [ ] Document tenant-specific OneTrust group mappings and overrides

---

**Disclaimer:** This repo is **not legal advice**. Always verify implementation and disclosures with your legal/privacy team. Category names and cookie formats can vary by tenant/configuration — confirm against your CMP configuration.
