import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Canonical origin. Override with SITE_URL for previews; production defaults to the live domain.
const siteUrl = (process.env.SITE_URL ?? "https://saar.theshriks.space").replace(/\/+$/, "");

export default defineConfig({
  site: siteUrl,
  output: "static",
  redirects: { "/get-started": "/docs", "/status": "/docs#status" },
  integrations: [sitemap({ filter: (page) => !page.endsWith("/404/") && !page.endsWith("/404") })],
});
