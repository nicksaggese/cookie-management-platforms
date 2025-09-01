import registry from "./registry.json";

/**
 * Normalize CMP consent into a universal schema:
 * {
 *   marketing: true/false,
 *   analytics: true/false,
 *   functional: true/false,
 *   necessary: true/false
 * }
 */

export function decodeConsent(cookies) {
  const result = {
    marketing: null,
    analytics: null,
    functional: null,
    necessary: true, // usually always required/true
  };

  // OneTrust
  if (cookies["OptanonConsent"]) {
    const consent = decodeURIComponent(cookies["OptanonConsent"]);
    const groups = Object.fromEntries(
      consent
        .split("&")
        .filter((p) => p.startsWith("groups="))
        .flatMap((p) =>
          p
            .replace("groups=", "")
            .split(",")
            .map((pair) => {
              const [key, val] = pair.split(":");
              return [key, val === "1"];
            })
        )
    );

    result.analytics = groups["C0002"] ?? result.analytics;
    result.functional = groups["C0003"] ?? result.functional;
    result.marketing = groups["C0004"] ?? result.marketing;
  }

  // Cookiebot
  if (cookies["CookieConsent"]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookies["CookieConsent"]));
      result.analytics = parsed.statistics ?? result.analytics;
      result.functional = parsed.preferences ?? result.functional;
      result.marketing = parsed.marketing ?? result.marketing;
    } catch {}
  }

  // Didomi
  if (cookies["didomi_token"]) {
    try {
      const payload = JSON.parse(
        atob(cookies["didomi_token"].split(".")[1]) // like JWT
      );
      result.marketing =
        payload.purposes_consent?.marketing ?? result.marketing;
      result.analytics =
        payload.purposes_consent?.analytics ?? result.analytics;
      result.functional =
        payload.purposes_consent?.functional ?? result.functional;
    } catch {}
  }

  // Termly
  if (cookies["termly-consent"]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookies["termly-consent"]));
      result.analytics = parsed.analytics ?? result.analytics;
      result.functional = parsed.functional ?? result.functional;
      result.marketing = parsed.advertising ?? result.marketing;
    } catch {}
  }

  // IAB TCF (euconsent-v2)
  if (cookies["euconsent-v2"]) {
    // Needs full TCF string parser — third-party libraries exist:
    // https://www.npmjs.com/package/@iabtcf/core
    // Example: const tcModel = TCString.decode(cookies["euconsent-v2"])
    result.marketing = null; // leave undecoded unless parser is used
  }

  return result;
}

/**
 * Helper: get cookies into an object {name: value}
 */
export function parseCookieString(cookieString = document.cookie) {
  return Object.fromEntries(
    cookieString.split(";").map((c) => {
      const [k, v] = c.trim().split("=");
      return [k, v];
    })
  );
}
