# Galaxy of stars

Clients are shown as stars, grouped into constellations, under the line "Every client is a star in our galaxy". A pulsing "Join our galaxy" star links to the Website Builder.

## Where it appears
`GalaxySection` (`web/src/components/galaxy/GalaxySection.tsx`) is a server component that fetches `GET /api/v1/site/stars`. It is placed:

- On the home page, after testimonials.
- On `/work`, before the call-to-action band.
- On `/website-builder`.

## Managing stars
Go to Admin → **Site — Galaxy of stars** (`/admin/site-stars`). For each star:

- **What we built** sets the constellation: Websites, Apps, Polara, Velora or Custom software. A custom constellation name overrides it.
- **Brightness** goes from 1 (client) to 3 (flagship). It sets the glow size.
- **Case study** is optional. With one linked, the star's card gets a "Read the case study" link.
- **Highlight** is a one-line result shown on the card.
- **Show on website**: only publish clients who agreed to be shown.

To seed stars from existing content: `cd backend && npx ts-node scripts/migrate-stars.ts --apply`. Stars are created **hidden**, so review them before publishing.

## How it's drawn
- **Layout** (`web/src/lib/galaxy.ts`):
  - Each constellation gets a centre on a wide ellipse.
  - Stars scatter around their centre using a seeded hash of their id. The layout is deterministic: the same on server and client, and stable between visits.
  - A best-of-8 candidate search keeps stars apart.
  - The point `JOIN_POINT` is reserved for the "join" star.
- **Rendering** (`Galaxy.tsx` with `Galaxy.module.css`):
  - Background: the existing canvas `LazyStarfield`.
  - An SVG layer draws the glows, the dashed constellation lines and the labels.
  - Each client is a real `<button>` positioned over the SVG. Hover or focus opens an info card (`role="status"`).
  - Filter chips dim the other constellations.
- **Accessibility:**
  - Stars can be reached with the keyboard and are labelled "Name, industry".
  - On small screens a plain list of clients is shown below the sky.
  - Twinkle and pulse animations run only when the visitor has not asked for reduced motion (`prefers-reduced-motion: no-preference`).
- **Performance:** no new libraries. Lighthouse scores 100 in every category on /, /work and /website-builder (desktop, mock data).
