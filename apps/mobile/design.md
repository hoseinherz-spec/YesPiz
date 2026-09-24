# Yespiz mobile onboarding design system

## Supporting screens (September 2026)

The approved home, authentication, onboarding, menu and product-detail screens are the visual reference. Account, settings, orders, checkout, rewards, referrals, group ordering and support reuse their navy canvas, Poppins typography, phosphor primary actions and semantic light/dark tokens.

- `AppFrame/SupportingScreens.module.css` opts secondary routes into shared styling; approved reference routes are excluded. The map-led tracking screen keeps its dedicated layout.
- Use 20 px page gutters (16 px at very narrow widths), 26 px surface corners, 18 px fields and capsule actions. Primary actions are at least 52 px high; icon controls are at least 44 px.
- `ScreenHeader` centers the title between equal 48 px action columns. `PageIntro` provides an optional 64 px symbol, compact display headline and muted description, following the authentication hierarchy.
- Profile and notification modules use the page background behind grouped surface cards. Text accents use `--selection-ink` so they remain readable in light mode. Order statuses use semantic success/danger colors; primary order actions use the same accent as the menu.
- Supporting route styling is deliberately scoped: do not move its overrides into the shared theme or change the approved reference compositions to accommodate a secondary screen.

## Intent and source

This system translates the supplied Luma onboarding screens into **Yespiz**. Preserve the reference's generous spacing, floating artwork, collapsing welcome panel, centered form headers, rounded inputs, quiet utility actions, and progressive account setup. Use the existing Yespiz theme and Pizzacraft illustrations for brand identity.

The implementation lives in `src/app/onboarding/page.tsx` and `src/app/onboarding/onboarding.module.css`. It runs inside the existing Next.js + Capacitor mobile app. `src/app/page.tsx` reuses the splash styling and retains the app's onboarding/auth routing.

Screenshots establish visual composition and states; they do not establish animation duration. Motion values below describe the implemented reconstruction.

## Color system

Use semantic CSS variables from `src/app/globals.css` and `@repo/theme`. Never introduce a separate onboarding palette or force light mode. The component follows the active app theme.

| Role                        | Token                                                    | Dark theme                                      | Light theme               |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| Page canvas                 | `--background`                                           | `#031126`                                       | `#f5f7fa`                 |
| Primary action              | `--accent`                                               | `oklch(0.933 0.226 119)`                        | same                      |
| Surfaces                    | `--surface`, `--surface-secondary`, `--surface-tertiary` | OKLCH lightness .205 / .245 / .29, blue hue 258 | white / white / cool gray |
| Secondary text              | `--muted`                                                | `oklch(0.72 0.028 255)`                         | `oklch(0.49 0.025 255)`   |
| Focus                       | `--focus`                                                | lime                                            | `oklch(0.46 0.12 125)`    |
| Status and remaining tokens | Shared HeroUI tokens                                     | See `packages/theme/src/styles.css`             | See shared palette        |

Values are the final overrides in the mobile stylesheet. Tokens, rather than copied values, are authoritative. Dark/light variants must change together when the shared theme changes.

Use phosphor as a primary-action fill with dark text. Standalone emphasized copy uses `--selection-ink` so it stays readable in light mode. The welcome canvas is solid `--background` (#031126 in dark mode), without gradient overlays. Orange, red, and green inside original illustrations retain their natural colors.

## Typography

Use the app's bundled **Poppins** via `--font-poppins`, then system sans-serif fallbacks. Form inputs inherit the same family. Use a monospace face only for verification digits.

| Element                 | Size / line height                 | Weight  | Treatment                                |
| ----------------------- | ---------------------------------- | ------- | ---------------------------------------- |
| Yespiz wordmark         | 25 / 30 px                         | 800     | −1.5 px tracking; selection-ink; small ® |
| Welcome headline        | `clamp(36px, 10.2vw, 44px)` / 1.03 | 600     | Centered, −1 px tracking; three lines    |
| Compact-height headline | 34 px / 1.03                       | 600     | Used below 720 px viewport height        |
| Form title              | 22 / 28 px                         | 600     | Centered, −0.45 px tracking              |
| Supporting paragraph    | 15.5 / 21 px                       | 400     | Centered; muted                          |
| Benefit title           | 18 / 24 px                         | 500     | Left aligned                             |
| Button / field / label  | 17 / 24–25 px                      | 400–600 | Labels 600; buttons 500                  |
| Verification code       | 29 px                              | 500     | Monospace, six equal positions           |
| Legal line              | 11.5 px                            | 400     | Quiet, centered                          |
| Error toast             | 14 / 19 px                         | 400     | Icon and short message                   |

Copy is specific to pizza ordering: “Great pizza. / Good times. / start here”, delivery updates, and courier contact. Keep sentences short enough to preserve the reference's spacing. Do not show event-management language or Luma legal links in the Yespiz interface.

## Layout and spacing

- Single-column mobile canvas, centered above phone widths, maximum **473 px** (`APP_MAX_WIDTH`).
- Full viewport height. Forms track `window.visualViewport.height` so the footer remains above a software keyboard.
- Top safe area: `max(48px, env(safe-area-inset-top))`; compact heights use 24 px minimum.
- Bottom safe area: `max(24px, env(safe-area-inset-bottom))`; compact heights use 16 px minimum.
- Main horizontal gutter: **20 px**; toolbar gutter: **16 px**.
- Default rhythm: **4, 8, 12, 16, 24, 38 px**, aligned with `src/constants/theme.ts`.
- Common local gaps: 9 px title-to-description, 16 px badge-to-title, 28–29 px description-to-input, 24 px profile field groups.
- Welcome hero: 100% height initially; **62.4%** when sign-in options open. The remaining 37.6% contains scrollable actions.
- Welcome copy moves from **66.6vh** to **38vh** during collapse. Keep the artwork above it.
- Authentication screen: toolbar → scrollable content → fixed flex footer. Do not place the button at an absolute screen coordinate.

## Shape and depth

Shared radius scale: **12 / 18 / 26 / 42 / 999 px**. Illustrations have no surrounding boxes or corner radius. Apply approximately 26–28 px to text fields, 42 px to the collapsed hero corners, and full capsules to actions.

Use `--reference-shadow` for buttons, utility actions, avatar, and hero. Artwork floats directly on the canvas with no card fill, border, inset highlight, or box shadow. A subtle drop shadow follows only the transparent image silhouette.

## Illustration system

All rendered brand illustrations come from `public/images/pizzacraft`. They are transparent PNGs, displayed with `object-fit: contain`, preserving the supplied artwork. Do not stretch, recolor, replace with emoji, or use full-screen screenshot crops.

| Asset                      | Placement                                  |
| -------------------------- | ------------------------------------------ |
| `Pizza.png`                | Centered 150 px splash; main welcome tile  |
| `Pizza Chef.png`           | Upper welcome tile; default profile avatar |
| `Pizza Box.png`            | Upper-right welcome tile                   |
| `Scooter.png`              | Left-middle welcome tile                   |
| `Fresh Ingredients.png`    | Right-middle welcome tile                  |
| `Tomatoes.png`             | Partially cropped lower-left welcome tile  |
| `Digital Food Receipt.png` | Lower-center welcome tile                  |

Welcome artwork uses ten independent transparent illustration layers. Widths range from **21–40%** of the canvas, rotations from **−12° to +12°**, with intentional edge clipping. Each tile has its own position in the expanded and collapsed arrangements. Tiles animate individually; imagery is not a static collage. Keep the center pizza visually dominant and preserve a clear area around the headline.

Profile avatar: **82 px** circular surface with chef artwork at 82% contain, plus a **33 px** accent photo action. A selected photo uses cover cropping. No reference watermark or pre-rendered keyboard/status bar is part of the app UI.

## Components and states

### Primary action

49 px minimum height, full width, pill radius, accent fill, accent-foreground text. Press scales to 0.97. Disabled uses surface-tertiary with muted text and no shadow. Loading shows a 19 px spinner at the left while retaining the label and preventing duplicate submission.

### Secondary and utility actions

Secondary actions use surface-secondary, foreground, and border. Back/close/check are 44 px circular buttons. Skip is a short pill aligned to the right. Social actions share a 49 px row; the passkey action is a 49 px circle.

### Input

49 px minimum height, 16 px horizontal padding, field-background, placeholder token, pill radius, and no permanent border. Use real `email`, `tel`, and password inputs with relevant autocomplete. Names and bio allow normal text selection. The operating system supplies the keyboard.

### Verification code

220 × 62 px capsule with six 20 px positions separated by 10 px. Empty positions show muted dashes; focused position gets a blinking caret. Numeric input accepts pasted/autofilled codes and strips non-digits. The sixth digit submits once. Error clears the code and leaves a retryable field.

### Error toast

Danger-colored capsule near the top safe area, maximum canvas width minus 48 px. Use `role="alert"`, an alert icon, readable text, and a brief entrance/exit. Errors clear after 5.5 seconds. Preserve the input state needed to recover.

### Passkey benefits

Three rows: password-free, security, cross-device. Each has a 23 px line icon, 16 px horizontal gap, short title, and muted explanatory text. Do not add card wrappers. Enrollment preserves the existing Yespiz password-confirmation requirement.

### Profile

Chef avatar → centered title and subtitle → name → multiline bio. Name is required to enable the top-right save action. Bio is limited to 500 characters, name to 80. Photo picker accepts images up to 10 MB and previews the selection. A faint theme-accent dot texture may sit behind the header.

## Motion

| Interaction                           | Specification                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Splash                                | 1,150 ms display; artwork scale 1 → 1.06 over 2 s, alternating                                                            |
| Welcome collapse / tile rearrangement | Spring: stiffness 155, damping 25, mass 1.05                                                                              |
| Artwork entrance / rearrangement      | Stagger 28 ms per image; spring stiffness 180, damping 24, mass 0.85–1.05; entrance scale 0.88 → 1 with rise and rotation |
| Artwork idle float                    | Independent 4.2–6.15 s loops; 13 px lift, ±3° sway, subtle scale pulse; staggered phases                                  |
| Screen change                         | 230 ms fade; incoming +28 px, outgoing −16 px                                                                             |
| Sign-in options entrance              | Fade + 35 px rise, delayed 120 ms                                                                                         |
| Button feedback                       | `--app-motion-control` (220 ms), `--app-motion-ease`                                                                      |
| Code caret                            | 1.05 s step-end blink                                                                                                     |
| Loading spinner                       | 800 ms linear rotation                                                                                                    |

Both the arrow and a vertical swipe open the options; the handle or downward swipe expands the welcome panel. Respect `prefers-reduced-motion`: disable looping animations, delays, and positional transitions.

## Flow and service boundaries

```text
Splash → Welcome → Sign-in options
  Email → Email code → Optional phone → Phone code → Passkey → Profile → Home
  Phone → Phone code → Passkey → Profile → Home
  Existing social / passkey sign-in → Profile → Home
```

Back returns to the previous relevant input. Skip bypasses optional phone or passkey setup. Close returns email entry to sign-in options.

The visual preview (`/onboarding/?preview=1`) uses `123456` and never creates an authenticated session. Production phone sign-in reuses the existing app context. Email OTP is not supported by the current API; normal email entry signs in with a password directly on the onboarding screen. Do not silently substitute a demo success for a real account operation.

## Accessibility and verification

Provide accessible names for icon buttons, real labels for inputs, visible theme-aware keyboard focus, modal focus containment, disabled/busy semantics, and live errors. Decorative illustration tiles are hidden from assistive technology. Minimum touch target is 44 px.

Check welcome, collapsed options, empty/filled/loading contact fields, empty/partial/error code, phone skip, passkey, and profile. Verify at phone widths including 320 and 393 px, shorter viewports, and both theme token sets. On-device validation is required for software keyboard and passkey system dialogs.

### Additional floating artwork

- `Pizza Slice.png`: upper-center accent.
- `Mushroom.png`: partially cropped left-side accent.
- `Cheese Block.png`: lower-right accent.

The preview-code badge is not displayed on the canvas. All interface text uses bundled Poppins; verification digits retain their monospace treatment.

### First-load performance

Onboarding uses 640 px WebP derivatives of the original artwork. Decode all ten during the splash before revealing the scene, with a four-second maximum wait so slow requests cannot block navigation. Entrance starts at 0.88 scale with a 24–34 px rise and ±6° rotation; damping 24 settles the spring. Idle motion begins after 0.9–1.53 seconds, following the entrance.

### Animated interface icons

Selected Lottie JSON assets from User Interface Icon Pack V1 live in `public/icons/animated/`. The shared `AnimatedIcon` component lazy-loads lottie-web, reserves its size, and retains a static SVG fallback until ready. Email, phone, verification, passkey, Face ID, and profile-photo icons play once on entry. Offscreen or hidden-document players pause; unmount destroys them. Reduced motion displays frame zero. SVG strokes and fills inherit the surrounding theme color. Navigation controls remain static.

## Unified sign-in and refined theme

The shared HeroUI palette is the source of truth: deep navy #031126, progressively lighter blue surfaces, phosphor primary actions, and higher-contrast muted text. Light mode uses a darker focus ring. Danger foreground is dark on the dark theme’s light coral. Mobile no longer duplicates the shared color definitions.

Onboarding is the single sign-in entry. Existing `/login/` links redirect to the options state and preserve a validated `next` destination. Real email uses password authentication in-place with recovery and signup links; successful real authentication returns to the intended destination. Email OTP and profile walkthrough remain explicit preview behavior. Guest browsing remains available.

### Email-only entry

The sign-in options screen offers a single primary action, Continue with Email. Phone, social, and passkey sign-in entry buttons are removed. Guest browsing remains available. The email preview continues directly to profile, without a phone step. Existing backend authentication APIs are unchanged.

### Signup and social sign-in

Signup reuses the onboarding screen, toolbar, animated badge, fields, typography, and bottom action. The guest link is replaced by an “or” divider and real configured social providers on onboarding; signup uses the same provider component. Google uses its official pill-shaped SDK button and passes its credential and nonce to the existing API. Apple renders only when its client ID and redirect URI are configured. Sign-in and signup preserve the validated return destination.

### Compact social provider tiles

Apple, Facebook, Google appear in a centered 64 px tile row with 18 px corners and 16 px gaps. Provider colors follow the supplied reference. Google retains its official SDK icon button. Facebook uses its JS SDK and server-side token introspection (app, user, type, expiration). Apple verifies its signed identity token. Unconfigured providers report that email is available; no local success is simulated. Facebook requires frontend app ID/API version plus server FACEBOOK_APP_ID, FACEBOOK_APP_SECRET and FACEBOOK_API_VERSION. Apple requires its existing client ID and redirect configuration.
