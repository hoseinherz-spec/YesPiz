# Yespiz onboarding adapted from the Luma reference

Implemented in the existing Next.js + Capacitor app (`apps/mobile`). No Expo dependency or standalone mobile project is needed.

- Normal entry: `/onboarding/`
- Visual reference walkthrough: `/onboarding/?preview=1`
- Preview verification code: **123456**. Any other six-digit code displays the reference error toast.

The supplied 15 Luma PNGs define layout and flow. The final interface uses Yespiz semantic theme colors, Poppins, and original Pizzacraft illustrations. See `../../../design.md` from this folder for the design system. Native DOM inputs, six-digit OTP, button loading/disabled states, retry, back/skip, swipe-to-collapse welcome, passkey information, profile editing, and a photo picker are interactive. Artwork uses independent Pizzacraft image tiles; no screenshot artwork is rendered. Native software keyboards are provided by iOS/Android; the Mobbin export footer and screenshot status bars are excluded.

Motion is reconstructed from still images, not verified against a recording. CSS respects reduced-motion preferences and the form uses the visual viewport to keep the action above the mobile keyboard.

## Existing services

Normal phone sign-in uses the existing `sendOtp` and `loginWithOtp` context methods. Existing social sign-in and passkey authentication are reused. Passkey enrollment uses the same password confirmation and registration endpoints as `/security/`; no authentication requirement was weakened.

The API does not support email OTP. Normal email entry uses email/password directly within onboarding, with password recovery and signup links. `/login/` redirects to `/onboarding/?signin=1` and preserves the validated `next` destination. Successful real password, phone, social, and passkey sign-in completes onboarding and returns to that destination. Preview mode never sends an OTP, sets an auth token, changes the real user's profile, or marks onboarding complete. It may enter the existing public home screen as a guest after the profile walkthrough.

Profile names use the app's existing `updateLocalUser` editing model; name/bio drafts use separate real/preview local-storage keys. Selected photos are displayed for the current walkthrough only. This is not a new server-side profile/photo API.

## Validation

TypeScript and ESLint checks target the changed mobile files. Browser checks cover the reference layout, email loading, invalid code/reset, both preview verification stages, optional phone skip, passkey preview, and profile save/navigation. No live SMS, external account creation, or real passkey enrollment is performed during preview testing.

Mobile colors inherit the shared HeroUI semantic palette; duplicate mobile color overrides have been removed.
