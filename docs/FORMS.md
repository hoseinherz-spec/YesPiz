# Forms

Customer, admin, restaurant and courier form controls use `@repo/ui/forms`.
The shared controls compose HeroUI v3 with React Hook Form `useController`;
each submission boundary has a `useForm` instance and a Zod resolver.

## Building a form

- Use `Form` for a normal form and a HeroUI `Button type="submit"`. Submit
  handlers run only after RHF/Zod validation succeeds. Keep navigation,
  cancel and add/remove-row buttons explicitly `type="button"`.
- For an inline editor, place its fields and `FormAction` inside their own
  `FormScope`. Independent actions need independent scopes. For example,
  creating a menu version does not require filling the publication date.
- Use the shared `Input`, `TextArea`, `Select`, `RadioField`,
  `CheckboxGroupField`, `SwitchField` and `SearchField`. `Select searchable`
  uses HeroUI ComboBox for catalog and courier lists.
- Supply a visible `label` or an accessible name. Account screens use
  `labelClassName="sr-only"` while retaining their existing placeholders.
- Required, length, pattern, email, numeric bounds/step and date constraints
  are evaluated by Zod in `form-schemas.tsx`. Errors appear through HeroUI
  `FieldError`; RHF manages blur, revalidation and focus.
- `FormValue` registers a domain object and its Zod schema for cross-field
  checks. Current examples include pizza customization, opening periods,
  discount dates and password confirmation. Keep previews in a separate
  scope so preview choices cannot prevent saving an admin menu definition.

Existing API handlers and draft state remain responsible for their business
behavior, including server refreshes and live pizza previews. Controlled field
values synchronize with RHF when those drafts change. Unmounted dynamic fields
unregister, so removed rows no longer participate in validation. Server-side
validation and authorization remain authoritative.

Stripe's Payment Element owns card details and payment validation. The outer
form uses the shared form wrapper; card fields are never copied into RHF or
custom HeroUI inputs. Image uploads use HeroUI Input and validate file size and
MIME type before calling the existing upload handler.

## Verification

```sh
npm run test:forms --workspace=@repo/ui
YESPIZZ_FEATURE_SURFACE=admin npm exec -- playwright test --config=playwright.features.config.ts --grep 'admin Zod|admin dynamic pizza'
YESPIZZ_FEATURE_SURFACE=mobile npm exec -- playwright test --config=playwright.features.config.ts --grep 'customer Zod|customer dynamic pizza'
npm exec -- playwright test --config=playwright.forms.config.ts
```

Browser tests use disposable API fixtures and isolated Next output directories.
They cover blocked invalid submissions, dynamic pizza editing, menu creation,
searchable selectors, customer choices, address selection and checkout.
