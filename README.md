# Spaceflow Design · client showcase

One page to send prospective (foreign) clients: websites the studio designed and built, grouped by industry, each opening as a
live, scrollable, animated preview. Everything is static and in English. No build step, except the two projects that were
exported from their own stacks (Heat Society from Next.js, Grand Era copied from its repo).

## Run

```bash
npx -y http-server . -p 5190 -c-1
```

Open http://localhost:5190/ . In the Claude app the `showcase` entry in `.claude/launch.json` starts the same server.

## What is where

| Path | Industry | Content |
|---|---|---|
| `index.html` | — | Hub ("window display"): one block per industry, full-page screenshots scrolling inside portrait frames, click → iframe viewer with Desktop / Mobile toggle; "Projects ▾" nav, interactive "+" field around the pointer, pricing calculator at the bottom (market bands, scope options, size slider; "Ask for a quote" still points to `#`) |
| `softriot/` | Commerce | Studio concept for a fictional knitwear + corsetry label, built with the beyond-default workflow (3 Discover sketches in `softriot/_discover/`, direction A "The rail" chosen). Home, Collection, Product, all animated. Unsplash photos, credits in `softriot/assets/CREDITS.md` |
| `_shared/logo-mark.svg` | — | Studio logo mark made with Magnific, see `_shared/LOGO.md` |
| `yes4all/` | Commerce | Home, Services (animated) · Contact (static). Built from Figma `SYT5BNlk9KV2rKsJsi7s8q` |
| `happipie/` | Commerce | Home, Category, Product (animated) · Cart, Checkout (static). Figma `UTJ76QrwdL7dz1ldXtw5JB`, copy translated to English |
| — | Commerce | Quiet Form: external live site built in Figma Make (`curse-snout-06869884.figma.site`) |
| `delis/` | Fashion | Home, Collection, Product (animated) · Cart, Checkout (static). Figma `IB0OrN277a6mNFf1v0xQYJ`, copy translated to English |
| `heat-society/` | Fitness app | English static export of `E:\Freelance\Heat\heat-society-site` (Next.js 15); the source project is untouched |
| `grand-era/` | Real estate | Copy of github.com/spaceflow-design/grand-era-final with paths fixed and copy translated to English |
| — | Real estate | ASP Land: external live site (github.com/spaceflow-design/asp-land, published at spaceflow-design.github.io/asp-land), option 1 full site linked |
| — | Fintech | Vui App: external live site (`vuiapp.vn/en`), sends `X-Frame-Options: SAMEORIGIN` so it opens in a new tab instead of the viewer |
| — | Interiors | Doric: external live site (`doric.vn`, Vietnamese only) |
| `_shared/thumbs/` | — | Full-page captures (1440 wide) used in the hub windows |
| `_brief.md` | — | Build conventions for the Figma projects (stack, animation rules, English copy, checks) |
| `../_src/grand-era-final/` | — | Read-only clone of the Grand Era repo |

Each Figma project and `grand-era/` has a `NOTES.md`: pages, fonts, translation choices, known gaps.

## Rules

- Animation (GSAP 3.13 + ScrollTrigger + Lenis) only on main / image-heavy pages. Forms, cart, checkout load no animation
  libraries. `prefers-reduced-motion` disables everything. See `_brief.md`.
- All copy in English. Proper nouns, street addresses and VND prices are kept.
- No invented clients, numbers or testimonials beyond what the source designs contain.

## Re-capturing a window thumbnail

Headless Chrome's `--screenshot` breaks `vh`-sized heroes, so use the Puppeteer script kept in the session scratchpad
(`shot/shot.cjs`: 1440×900 viewport, scrolls the page to fire lazy loads, then `fullPage` capture as JPEG q82):

```bash
node shot.cjs http://localhost:5190/delis/index.html "_shared/thumbs/delis.jpg" 1440
```

## Re-exporting Heat Society in English

The translated working copy lives in the session scratchpad (`heat-en/`). To redo it from the source project: copy the
project (not `node_modules`, `.next`), translate `src/content/site.ts` and the hard-coded strings in `src/components` and
`src/app/*/page.tsx`, set `next.config.mjs` to `{ output: "export", basePath: "/heat-society", trailingSlash: true,
images: { unoptimized: true } }`, delete `robots.ts` and `sitemap.ts`, run `npx next build`, then rewrite `"/img/` →
`"/heat-society/img/` in the exported `.html` / `.js` / `.css` (unoptimized `next/image` drops the basePath) and delete the
RSC `.txt` files. Copy `out/` to `heat-society/`.
