# beebo ng

The existing React 19 / Vite website, refined and extended with collection pages, WhatsApp enquiries and a private owner studio. Original hero and collection images are preserved. No checkout or invented product listings are included.

## Run locally

Use Node.js 22.12+ (tested with Node 24) and npm.

    npm ci
    cp .env.example .env.local
    npm run dev

On PowerShell, use Copy-Item .env.example .env.local instead of cp if preferred. Open the local URL printed by Vite. The storefront works with the original two collections when Supabase is not configured; /admin explains the setup requirement. When Supabase is configured, its database becomes the catalogue source. A failed connection shows a retry message and never silently replaces your live catalogue with example data.

## Supabase setup

1. Create a Supabase project. Run supabase/schema.sql once in the SQL editor of a new project. It creates collections, products, owner permissions, row-level security, and the public catalog-images storage bucket (JPG/PNG/WebP, 5 MB maximum). It seeds Éclat (9 dresses) and Resurgence (8 dresses), using the existing bundled covers until you replace them.
2. In Authentication, disable public sign-ups. Create the owner's email/password account in the Supabase dashboard; confirm its email. Copy its user UUID.
3. Grant that account owner access in the SQL editor:

       insert into public.admin_users (user_id) values ('OWNER-USER-UUID');

   Do not use user-editable metadata for authorisation. All catalogue changes and image uploads are protected by the owner allowlist, enforced in Postgres. Removing the allowlist row revokes writes even for an existing session.

4. In .env.local, set VITE_SUPABASE_URL to the project HTTPS URL and VITE_SUPABASE_PUBLISHABLE_KEY to the public publishable key. The legacy public anon key also works in that variable. NEVER add a secret or service-role key to a VITE variable: every VITE variable is visible in the browser.
5. Set VITE_WHATSAPP_NUMBER to the brand's real international number, digits only, including country code. Ordering links remain disabled and the footer omits WhatsApp while a valid number is missing. Email and Instagram are preserved from the original project in src/data/settings.js; verify ownership before launch.
6. Restart Vite. Open /admin and sign in. Add the real 8 Resurgence and 9 Éclat dresses, each with its name, price in naira, photograph, optional description and visibility. The original project supplies only 3 hero images and 2 collection covers: individual product photos, names and prices still need to be supplied. Product counts use published dresses once added; the initial campaign counts are not fake listings.
7. Set the Supabase Auth Site URL to your final HTTPS origin. Configure password requirements and email delivery in Supabase. The studio uses email/password sign-in; password resets and owner account recovery are managed by the website administrator through Supabase Authentication. There is no public registration.
8. Run supabase/security-check.sql. Verify signed-out and ordinary non-owner accounts cannot read hidden rows, add/update/delete records, upload images, or grant themselves owner access. Test the owner with one temporary dress, including upload, edit, hide and delete, before adding the catalogue.

Official references: [password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [uploads](https://supabase.com/docs/reference/javascript/storage-from-upload).

## Owner guide

- Visit /admin and sign in. Dashboard shows collection and dress totals.
- Products → Add product: enter the name, collection and price, select a photo, then Save dress. A preview appears before saving.
- Edit changes price, copy, image or visibility. Uncheck Show this dress to hide it. Hiding a collection hides all its dresses.
- Collections supports adding, editing and changing covers. Addresses use lowercase letters/numbers/hyphens; keep existing addresses stable so shared links continue working.
- Delete asks for confirmation. Collections with dresses cannot be deleted: move or remove their dresses first.
- Changes appear on the next storefront load. Sign out after use on a shared device.
- Replaced/deleted images are retained in Storage to avoid breaking other references. Uploads that fail to save are removed where possible. Periodically remove unreferenced files through the Supabase dashboard after checking all product/collection references. Images are publicly accessible; hiding a product does not revoke a previously shared image URL.

## Checks and production build

    npm run lint
    npm test
    npm run build
    npm run preview

Playwright tests use installed Microsoft Edge (channel msedge); alternatively install Chromium with npx playwright install chromium and change the test channel. Tests cover all requested widths, routes, menu keyboard interaction, catalogue failures, product links and simulated Supabase owner workflows. Mocked tests are not a substitute for validating live credentials and RLS in your own Supabase project.

## Deploy

Build command: npm run build. Output: dist. Add the same three environment variables to the hosting provider BEFORE building. Rebuild after changing environment variables. Deploy as a site at the domain root. Netlify's SPA fallback is in public/_redirects; Vercel's fallback is in vercel.json. Other hosts must serve index.html for unknown frontend paths, while serving real assets normally. This is required for direct URLs such as /collections/resurgence and /admin. GitHub Pages needs a separate SPA fallback/base-path strategy; GitHub itself can simply hold the source repository.

Use HTTPS. Do not commit .env.local, node_modules, test artifacts or dist. The project has no Git repository yet; initialise one when ready and commit the source and package-lock.json. No deployment or account credentials are included.

## Structure

- src/components: preserved Navbar, Hero, FeaturedCollections, Footer; ProductCard added.
- src/pages/CollectionPage.jsx: collection browsing and empty/not-found states.
- src/pages/admin: lazy-loaded owner studio, login/access checks, lists and forms.
- src/lib: Supabase client and catalogue/storage operations.
- src/data: original collections and centralised contact/ordering helpers.
- src/hooks: catalogue loading and retry.
- supabase: schema, policies and security checks.
- tests: browser regression tests using isolated API fixtures, never real account secrets.

No original photography was removed or renamed. Empty products/navigation data stubs and unused starter icons were removed. Original homepage components and styling files were refined in place, and the original slogan and concise collection descriptions were retained.
