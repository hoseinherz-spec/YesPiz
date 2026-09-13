# Authentication layout references

The customer app authentication screens use the existing Yespiz lime, navy,
surface, field, and text theme tokens. The layout references are:

- [Glovo welcome screen](https://mobbin.com/screens/cd28edfc-6fe3-47b5-baa8-f2580d78c997): branded food header, rounded content sheet, grouped sign-in options.
- [Glovo email screen](https://mobbin.com/screens/4aca822f-b7f2-4c14-b827-6c2706ceea80): left-aligned heading, supporting icon, outlined field, bottom primary action.

`AuthScreen` scopes these patterns to login, signup, forgot-password, and
reset-password. Account editing screens retain their existing layout.
The existing password, OTP, social authentication, and recovery handlers are retained.

Validation: customer-app TypeScript and targeted ESLint pass. Browser checks
covered required-field errors, email/phone switching, signup navigation, and
recovery/reset layouts at 393px and 320px phone widths. Live authentication and
email delivery were not exercised. Google and Apple buttons are disabled in the
current local environment because their provider configuration is absent.

## Main customer screens

The supplied Glovo screenshots also inform the home category illustrations,
menu list and category controls, branded profile header and account rows,
explicit light/dark appearance choices, referral introduction and code action,
and the cart continuation section in Orders. Cart, checkout, saved items,
notifications, support, credit, feedback, address/payment forms, and privacy use
the same scoped surface and spacing treatment. Existing service calls and
business rules remain in place; no Glovo subscription or reward terms were added.

Browser checks covered home/profile layouts, menu search and no-results reset,
light/dark selection, and Orders/referrals at 320px. The local catalog fell back
to saved items because the API was unavailable. Authenticated referral rewards,
checkout submissions, and live order actions were not exercised.
