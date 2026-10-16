// Site settings. Paste your IDs here to switch features on; leave "" to keep them off.
// (Loaded first on every page.)
window.OBIAB_CONFIG = {
  // Visitor stats with Cloudflare Web Analytics (free, no cookies).
  // Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site → copy the
  // "token" value from the JavaScript snippet it shows you.
  cloudflareAnalyticsToken: "",

  // Waitlist form with Tally (free). Make the form at tally.so, press Share and copy
  // the ID from the link: https://tally.so/r/<this part>
  tallyFormId: "",

  // Alternative to Tally: any form service that accepts a JSON POST, such as
  // Formspree (https://formspree.io/f/xxxxxxx). Only used when tallyFormId is "".
  waitlistEndpoint: "",

  // Testing only: also count visits on localhost.
  analyticsOnLocalhost: false
};
