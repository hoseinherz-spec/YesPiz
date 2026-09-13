# UI libraries and motion

Use existing YesPiz colors, typography, radii and semantics when adapting external components. Shared interactive primitives live in `packages/ui`; shared CSS motion tokens live in `packages/theme/src/motion.css`.

## Integrated

- Motion Primitives Animated Background: adapted for controlled selection in customer navigation and menu category, sorting and price filters. Original handlers remain intact, so draft filters still apply only after confirmation. Source and MIT notice are in `packages/ui/THIRD-PARTY-NOTICES.md`.
- Customer and courier page transitions share the 360ms page token and the same easing curve. Existing route-specific directions remain intact.
- Customer product interactions, controls, drawer timing and tracking progress use shared timing. Progress uses a transform instead of animating width.
- Reduced motion disables CSS transitions and decorative animation; the selection primitive also observes the operating system preference.

## Selection policy

| Resource | Appropriate use / status |
| --- | --- |
| https://motion-primitives.com/ | Integrated selection primitive; inspect source before adding further components. |
| https://beui.dev/ | Candidate for stateful buttons, sheets and notifications. Registry retrieval was blocked by the environment; nothing installed. |
| https://ui.bklit.com/ | Likely intended by “blkit ui”; candidate for panels with real chart data. No chart added without a matching feature. |
| https://smoothui.dev/docs/components | Candidate components should reuse shared motion and theme tokens. Not installed. |
| https://ui.watermelon.sh/ | Source was unavailable during this change; not installed. |
| https://openui.com/ | Source was unavailable during this change; not installed. |
| https://amicro.vercel.app/ | No component source verified during this change; not installed. |
| https://www.ripplix.com/ | Interaction references; not a runtime dependency. |
| https://freefrontend.com/ui-micro-interaction/ | Inspect individual demo source and license before reuse; page access was blocked. |

## Timing

Use `--app-motion-control` (220ms) for selection/color feedback, `--app-motion-fast` (140ms) for short feedback, and `--app-motion-page` (360ms) for route/sheet/progress movement. All use `--app-motion-ease`. Avoid `transition-all`, layout-property animation, independent spring presets and hard-coded colors in new components. Keep loaders and gesture-driven motion meaningful to the actual state.

The website's separate GSAP storytelling sequences have not been migrated. This change integrates customer app interactions and the existing shared customer/courier page transition layer.

## Page transitions

All five apps use `MobilePageTransition` at the provider boundary. This is a React View Transitions adaptation of the SSGOI navigation patterns (https://ssgoi.dev/docs/transitions), not an installation of SSGOI. The native integration preserves Next.js routing and falls back to immediate navigation in unsupported browsers.

Rules live in `packages/ui/src/route-motion.tsx`:

- Slide: ordered customer/courier tabs and admin/provider sections.
- Axis: customer checkout steps and authentication screens.
- Sheet: cart, address/payment creation, profile editing, feedback, chat, and calls.
- Drill: product/tracking details, nested routes, and sections opened from tabs.
- Zoom: partner pages and success screens reached outside the ordered checkout flow.
- Strip: entering/leaving onboarding.
- Hero: matching primary pizza images on product cards and detail pages.
- Scroll: website route sequence. Fade: unrelated or future routes.

Pairs reverse on return navigation. Tab direction comes from fixed visual order, not whether the page was visited before. Heroes require matching content in the navigation commit; unloaded detail content still gets its page transition. Query-only changes retain the page boundary. CSS uses shared timing tokens and disables all snapshot animation for reduced motion. Fixed controls stay in their normal layout because transforms apply to browser snapshots.

Validate route precedence and reversals with `node --import tsx --test packages/ui/src/route-motion.test.ts`.
