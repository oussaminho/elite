# Elite — Digital Products Dashboard

## Product scope
Elite is a responsive, dark dashboard for organizing a premium digital-product inventory. The confirmed scope includes a clear Elite brand, sidebar navigation, overview metrics, product cards for Spotify Premium, Discord, Instagram, ChatGPT, Pro AI tools, Adobe Premium, Canva Pro, and Steam accounts, plus search, filters, notifications, account/profile, and modern micro-interactions.

## Design direction
- **Design movement:** Obsidian control room — a dark SaaS dashboard language with editorial spacing, glassy surfaces, and a focused crimson signal color.
- **Core principles:** (1) high-contrast hierarchy, (2) calm density with generous spacing, (3) red used as a decision/signal color, (4) every control has a clear state.
- **Color philosophy:** near-black graphite foundations create a premium, discreet feel; warm white text preserves readability; crimson red signals Elite, active inventory, and important actions without turning the UI into a loud gaming interface.
- **Layout paradigm:** a persistent rail + asymmetric content canvas. The hero summary spans the main area, while compact metrics and activity sit in offset panels rather than a generic centered grid.
- **Signature elements:** crimson edge glow on active navigation, monogram-style Elite mark, and thin red progress rails for inventory/usage states.
- **Interaction philosophy:** fast, low-friction controls. Search and category filters update the inventory immediately; cards lift subtly on hover; sidebar collapse preserves context on smaller screens.
- **Animation:** 160–220ms ease-out transitions for hover/focus; progress rails animate on first paint; modal/dropdown states use opacity + translateY rather than large motion.
- **Typography system:** Manrope for UI and headings, with tight tracking on labels and generous line-height on descriptive copy. Numeric stats use tabular-looking weight and high contrast.
- **Brand essence:** a private-feeling control center for people who manage a curated stack of premium digital access — focused, polished, reliable.
- **Brand personality:** sharp, discreet, assured.
- **Brand voice:** direct and premium. Example lines: “Everything premium, one command center.” / “Your stack is ready when you are.”
- **Wordmark & logo:** a custom geometric E made from three horizontal bars inside a rounded square, paired with the Elite wordmark.
- **Signature brand color:** Elite Crimson `#ff3d43`.

## Implementation
- Use a dependency-light Vite-style static frontend with semantic HTML, CSS, and vanilla JavaScript.
- `index.html` is the shell; `src/styles.css` owns the responsive visual system; `src/app.js` owns inventory data and UI behavior.
- Use inline SVG icon helpers to avoid a heavy icon dependency and keep the product visually consistent.
- Use a static `public/manus-routes.json` route manifest with the single dashboard route `/`.
- No account login, payments, or external service integrations are included in this visual/product prototype; product cards use sample inventory data only.
- The interface must run on the configured port 3000 and expose a clear empty-state when a search/filter returns no products.

## Project structure
- `index.html` — application shell and semantic dashboard regions.
- `src/styles.css` — tokens, layout, surfaces, responsive breakpoints, motion, and accessibility states.
- `src/app.js` — sample inventory, rendering, filters, sidebar toggle, notification/profile affordances, and interaction feedback.
- `public/manus-routes.json` — route declaration for Preview and publication.
- `app.config.ts` — project logo metadata.
- `plan.md` / `TODO.md` — approved decisions and delivery outcomes.
