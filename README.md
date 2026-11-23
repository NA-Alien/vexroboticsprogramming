# VEX Robotics Programming

Twelve written VEXcode C++ guides for VEX V5: VS Code setup, C++ basics, reading sensors, simple autonomous functions, X-drive programming, intakes and arms, color sorting, PID, odometry, driving to coordinates, wall resets, and debugging. Includes local search, section links, copyable examples, SVG diagrams, cited references, and CoderSponge video links.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```sh
npm run build
npm run preview
```

Run unit checks with `npm test`. After building, run `npm run check:pages` to verify the generated HTML, internal links, metadata, sitemap, and error page.

## Edit the content

- `src/content/guides.js`: guide text, sections, reference IDs, and tables.
- `src/content/extraGuides.js`: C++ basics, sensors, mechanisms, coordinate navigation, and debugging.
- `src/content/snippets.js`: original VEXcode C++ examples.
- `src/content/extraSnippets.js`: examples used by the additional guides.
- `src/content/colorSorting.js`: optical color filtering and timed intake rejection.
- `src/content/sources.js`: source titles, URLs, and context.
- `src/styles.css`: stone-gray, charcoal, and burgundy design tokens and responsive styling.
- `src/components/Diagrams.jsx`: accessible, code-native technical drawings.
- `src/content/navigation.js`: topic groups and direct function-reference links.
- `src/components/Home.jsx`: compact documentation index and reference column.
- `src/hooks/useActiveSection.js`: current-section indication while reading.
- `src/lib/metadata.js`: production domain, per-page titles, descriptions, and canonical URLs.
- `src/lib/routes.js`: normal page URLs and conversion of old hash links.
- `scripts/prerender.mjs`: HTML pages, sitemap.xml, and robots.txt generated after the Vite build.

Use `/` or Ctrl/Cmd K to open search. Code blocks have a Wrap lines control; wrapping does not change the copied C++ text. Longer examples can be expanded to use page scrolling instead of a nested scroll area. Related guides link directly to supporting topics. The article contents list indicates the current section, and Back to top returns to the article header.

The odometry guide includes tracker mounting and wiring, a top-view layout, wheel-diameter calibration, sign checks, and a setup checklist before the position-update code.

Guides use normal URLs such as `/guides/odometry/`; sections use anchors such as `/guides/odometry/#offsets`. Every content page has its own generated HTML file, so guide text, code, links, and citations are present before JavaScript runs. React hydrates the page to enable search, copy controls, and the mobile guide menu. Existing links such as `/#/guides/odometry/offsets` convert to their new addresses in the browser.

Upload the entire contents of `dist/`, including the guide directories and `404.html`. The guides are static. The build emits 16 content pages, a noindex 404 page, `sitemap.xml`, and `robots.txt`. Unknown URLs must return HTTP 404.

## Robot examples

Read the shared configuration in Getting started before copying later snippets. The snippets use example ports, motor directions, dimensions, gains, and limits that must be checked on your robot. PROS and LemLib references are conceptual references, not dependencies.

Examples have been reviewed against the cited documentation. They have not been compiled with the VEX toolchain or run on a physical robot. The website build and browser tests do not validate robot motion or sensor behavior.

This is an independent educational resource and is not affiliated with VEX Robotics.

## Deploy

### Connect the community forum

Without forum configuration, `/forum/` shows labeled, read-only examples. To enable sign-in and posting:

1. On a new Supabase project with the Data API enabled, run `supabase/forum.sql`, `supabase/forum-safety.sql`, and `supabase/forum-moderation.sql` in the SQL Editor, in that order. On an existing database, run only the scripts that have yet to be applied.
2. Enable email sign-in and update the Magic Link and Confirm sign up email templates to include `{{ .Token }}` as the sign-in code. Configure custom SMTP before opening email sign-in to the public.
3. Set `VITE_SUPABASE_URL` to the project's HTTPS URL on `supabase.co` and `VITE_SUPABASE_PUBLISHABLE_KEY` to its `sb_publishable_` key in your local `.env.local` and hosting environment. Rebuild after changing these values. Only the publishable key belongs in the browser.
4. After the moderator signs in once, set `forum_moderator` to `true` in that account's Auth app metadata using a trusted admin environment. Have them sign out and back in to load the new permissions.

The forum exposes display names and post content publicly. Email addresses stay in Supabase Auth.
The database enforces an eight-second cooldown between posts or replies and rejects email addresses and common private credential formats in submitted text. The filter catches common patterns and moderation remains available for other posts.

The moderation migration blocks common profanity in new submissions and hides older matches for review. Signed-in members can flag a discussion or reply. Moderators can review flags, remove or restore posts, and permanently delete items after removal. Deleting a discussion also deletes its replies.

For Vercel, import this project, select the Vite framework, and use the checked-in `vercel.json`. Install with `npm ci`, build with `npm run build`, and deploy `dist`. Add the forum environment variables above to enable live discussions.

For a static host supporting `_headers` (such as Netlify), build and upload `dist/`; `public/_headers` is copied into that directory. Other hosts must configure equivalent response headers themselves. A plain file upload to a host that ignores `_headers` will not apply those protections.

## Domain and search setup

The production domain is configured as `https://vexroboticsprogramming.com` in `src/lib/metadata.js`. Canonical URLs, sharing metadata, the sitemap, and the robots sitemap address all use that value. If the domain changes, update it and rebuild before deploying.

Connect the domain to your hosting provider, enable HTTPS, and choose the non-www address above as the primary domain. Redirect www and provider-domain copies to the primary domain using your host’s domain settings. The included Vercel configuration uses trailing slashes to match the generated directory pages.

After publishing, verify domain ownership in Google Search Console and submit `https://vexroboticsprogramming.com/sitemap.xml`. Inspect a guide URL to confirm Google can retrieve the page, then monitor indexing, search queries, and clicks. These repository changes do not register the domain, deploy the site, verify Search Console ownership, or guarantee rankings.

Sources: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Vite static rendering](https://vite.dev/guide/ssr.html), [React hydration](https://react.dev/reference/react-dom/client/hydrateRoot).

Both configurations include a restrictive Content Security Policy, framing restrictions, MIME-sniffing protection, referrer/privacy policies, and HTTPS transport policy. The CSP allows same-origin resources and analytics requests, plus HTTPS API requests to Supabase project domains for the forum. Clipboard writing remains available for the explicit Copy code control. Local `npm run preview` serves the same policy for testing. Development mode omits that CSP because Vite needs its development tooling.

After deployment, confirm HTTPS and inspect the actual response headers. Test guide links, search, fonts, diagrams and Copy code against the deployed site. Unrelated third-party scripts or preview toolbars may be blocked by this intentionally restrictive policy. Add only narrowly scoped permissions if you intentionally introduce a feature that needs them.

Keep deployment account access protected with MFA, keep dependencies updated, and keep credentials out of `public/`. This static site requires no application secrets; files placed in `public/` are published. `.env` and provider-local directories are ignored by Git, but ignoring a file is not a substitute for rotating a credential that was already committed.

Security configuration references: [Vercel project configuration](https://vercel.com/docs/project-configuration), [Netlify custom headers](https://docs.netlify.com/manage/routing/headers/), [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy).


## Visitor analytics

Vercel Web Analytics is installed through @vercel/analytics/react in App.jsx and runs only in production builds. No analytics API key is needed. The security policy permits the same-origin script and collection requests.

In the Vercel project dashboard, open Analytics and enable Web Analytics if it is not already enabled. Deploy this source, then visit a few pages and check the Analytics dashboard. Local preview does not provide Vercel's /_vercel/insights endpoints, so it cannot verify live collection. Content blockers can prevent tracking.

Setup reference: https://vercel.com/docs/analytics/quickstart
