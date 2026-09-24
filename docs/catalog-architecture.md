# Product catalog and versioned menus

The catalog keeps reusable product identity separate from menu offers. Pizza is the first product type; drinks and burgers use the same management, publishing, pricing and checkout infrastructure.

## Ownership

| Model             | Owns                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `Product`         | Stable identity, type, global lifecycle status and current revision pointer                                 |
| `ProductRevision` | Immutable name, description, media, ingredients, allergens, typed attributes and preparation profile        |
| `Menu`            | Name, description, on/off status and atomic published-version pointer                                       |
| `MenuVersion`     | A version of the menu, notes and publication schedule                                                       |
| `Category`        | Display grouping within one menu version; independent of product type                                       |
| `MenuItem`        | Pinned product revision, price, configured variants/options, availability, categories and display order     |
| `OrderLine`       | Ordered identity/revision, name, final price, selected options, attributes and preparation/recipe snapshots |

The existing `menu_items` content fields are a materialized compatibility view of the pinned revision. Product edits create a new revision; they do not rewrite existing menu items. `PATCH /catalog/items/:id` with `productRevisionId` explicitly adopts a revision. Existing legacy item-content edits create a revision and adopt it only for that item. Editing offers in a published version remains supported for compatibility; use clone/edit/publish when changes should be staged together.

Variants, option constraints and their prices are offer-owned. A product can therefore be offered with different prices/choices in different menus. IDs for configured variants/options survive cloning. The generic `ProductCustomization` types retain `PizzaCustomization` aliases for existing consumers.

Global product status, menu status, item status, category visibility and time availability are checked independently. A product must be active to appear publicly or pass checkout validation. A product in more than one category remains visible if at least one assigned category is active. Archived products cannot be reactivated or attached, but their history remains readable. Delete endpoints soft-delete menu entities; historical order/quality lookup deliberately retains access to those records.

Each menu can publish its own version. A single atomic `Menu.publishedVersionId` switch selects its live version; legacy `published` flags are maintained for older integrations. Version numbers remain globally unique because checkout currently sends a numeric `menuVersion`. `/catalog/menu` without a menu ID serves the legacy default menu; new menus are selected with `?menuId=...`.

## API

All paths below start with `/api/v1`. Management requires an authenticated admin; delegated staff use `catalog:read` / `catalog:write`. Only `GET /catalog/menu` is public.

| Method               | Path                                  | Behavior                                                               |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| GET / POST           | `/products`                           | Page products / create a product and its first revision                |
| GET / PATCH / DELETE | `/products/:id`                       | Detail / new revision / archive                                        |
| PATCH                | `/products/:id/status`                | Set `status`: `draft`, `active`, `inactive`, `archived`                |
| GET                  | `/products/types`                     | Supported type definitions and attribute rules                         |
| GET                  | `/products/:id/revisions`             | Page immutable revision history                                        |
| GET                  | `/products/:id/revisions/:revisionId` | Read one revision belonging to this product                            |
| GET / POST           | `/menus`                              | Page menus / create                                                    |
| GET / PATCH / DELETE | `/menus/:id`                          | Detail / update / soft-delete                                          |
| PATCH                | `/menus/:id/status`                   | `{ "isActive": true }` or `false`                                      |
| GET / POST           | `/menus/:id/versions`                 | List / create versions belonging to a menu                             |
| GET / POST           | `/catalog/versions`                   | Legacy version list / create, accepting optional `menuId`              |
| GET / PATCH / DELETE | `/catalog/versions/:id`               | Full detail / update notes / delete an unpublished version             |
| POST                 | `/catalog/versions/:id/publish`       | Publish this version within its menu                                   |
| POST                 | `/catalog/versions/:id/clone`         | Copy offers/categories while preserving product/revision references    |
| POST                 | `/catalog/versions/:id/schedule`      | Set or clear `scheduledPublishAt` using the existing contract          |
| GET / POST           | `/catalog/versions/:id/categories`    | Page categories / create                                               |
| GET / PATCH / DELETE | `/catalog/categories/:id`             | Detail / update / soft-delete an empty category                        |
| PATCH                | `/catalog/categories/:id/status`      | Activate or deactivate                                                 |
| GET / POST           | `/catalog/versions/:id/items`         | Page offers / legacy create-product-and-offer (pizza by default)       |
| POST                 | `/catalog/versions/:id/products`      | Attach an existing product/revision, or create a product and attach it |
| GET / PATCH / DELETE | `/catalog/items/:id`                  | Detail / update or adopt revision / soft-delete                        |
| PATCH                | `/catalog/items/:id/status`           | Activate or deactivate                                                 |
| GET                  | `/catalog/menu?menuId=:id`            | Public menu projection                                                 |

Paginated list responses use `{ data, total, page, limit }`, default page 1 and limit 20, maximum limit 100. Product lists support `type`, `status`, `q`; offer lists support `type`, `categoryId`, `isActive`, `q`; menu/category lists support `isActive`, `q`. Revision lists use `page` and `limit`. Queries are literal substring searches rather than client-provided regex patterns.

Product create/detail/update responses contain `{ product, revision }`. Persisted documents include `_id`; menu entities additionally expose the compatibility `id`. Product update requires `expectedRevisionId`; stale or concurrent updates return 409. Attributes and preparation are replaced as complete objects when supplied; omission keeps previous values. Null is not a clearing operation. Use `[]` or `{}` for optional collections.

### Create pizza and offer

```http
POST /api/v1/products
Content-Type: application/json

{
  "type": "pizza",
  "status": "active",
  "name": "Pepperoni",
  "attributes": {
    "shape": "round",
    "doughThickness": "thin",
    "baseCrispiness": "crispy",
    "innerTexture": "soft",
    "crustType": "puffy"
  }
}
```

```http
POST /api/v1/catalog/versions/<versionId>/products
Content-Type: application/json

{
  "productId": "<product._id>",
  "productRevisionId": "<revision._id>",
  "categoryId": "<categoryId>",
  "priceCents": 1200,
  "isActive": true
}
```

Omit `productRevisionId` to pin the current revision at attachment time. For one-form creation, replace `productId` with a `product` object containing the create-product body. Supplying both is rejected. A newly created product defaults to `draft`; set `status: "active"` explicitly when it is ready for sale.

### Add a food type

1. Register its versioned attribute rules and default preparation mode in `src/catalog/products/product-types.ts`.
2. Use `GET /products/types` for form controls or add a specialized editor. Category names do not select product type.
3. Use offer variants/options for customer choices and price changes. Fixed characteristics belong in product attributes.
4. Add tests for its attribute constraints and any genuinely new preparation behavior.

No CRUD, category, publication or order-schema changes are needed for a type that fits these contracts. A new attribute schema version must have an explicit validator/migration; unsupported versions are rejected rather than reinterpreted. Current built-ins are pizza, drink and burger.

Checkout applies the legacy size/extra and half-and-half rules only to pizza. Other types use their offer price or server-priced configured variants/options. Recipe and quality requirements come from the preparation profile. Existing inventory remains measured-recipe based: inventory-enabled kitchens still require complete measured recipe coverage. Packaged-product SKU/unit stock accounting is not introduced by this catalog change.

## Migration and rollout

Existing records continue working through legacy fields and `pizzaId` aliases. Run the migration against a backup/staging copy first, with catalog writes paused:

```sh
npm run migrate:catalog --workspace=api
```

The script creates the default menu, attaches previously unowned versions, and converts each legacy classified item into a product/revision reference. Shared `pizzaId` values retain shared product identity; distinct historical content is stored in separate revisions. It retains original IDs, fields, offer prices, categories, recipe choices and order records. Already-linked items are skipped on subsequent runs. `unclassified` items stay hidden and are not guessed into a food type. The script stops scheduled jobs in its own process; other application instances must be paused separately.

The migration is incremental, not one cross-database transaction. A failed run can leave an unreferenced imported revision; no existing menu item points at missing product content, and rerunning can finish the remaining links. Product creation persists content before publishing its identity and cleans up the revision on an ordinary creation failure. Product updates use compare-and-swap plus a unique revision index. Do not hard-delete historical product revisions.

No production migration is run automatically on application startup. The existing admin/mobile screens retain their current pizza workflows; this change adds the backend model, APIs and shared TypeScript clients for building additional product editors.

## Customer ingredient changes

Offers now own `ingredientOptions` and an optional `toppingBaseImageUrl`. In the admin ingredient editor, **Included in pizza** defines the base recipe ingredient list and **Customer can change** enables a customer choice. A base ingredient may be removed; an ingredient outside the base list may be added. Unchecked ingredients cannot be changed by customers. Rules are per offer, so a shared product can have different extras in different menus.

Each write rule contains `ingredientId`, `priceCents` (additional price), `portionGrams` (the added recipe quantity), and optional `toppingImageUrl`. The server resolves the ingredient name/image and derives `includedByDefault`; clients must not write those resolved fields. Send `ingredientOptions: []` to disable all ingredient choices. Ingredient deletion is blocked while offers reference it.

Customer order lines send `ingredientChanges: [{ ingredientId, action: "add" | "remove" }]`. Checkout validates against the current offer, rejects unknown/duplicate/invalid choices, calculates prices on the server, and freezes the selected ingredient names and measured quantities into the order. Default ingredient removal does not discount the pizza. Added ingredient prices are flat per pizza across sizes. Removing a base ingredient removes its full measured quantity from the selected size recipe; unmatched recipe removal marks inventory coverage incomplete. Half-and-half orders currently reject ingredient changes rather than silently ignoring them. Reordering customized lines requires customer review.

The mobile pizza detail supports dragging an ingredient onto the pizza, tapping to toggle it, keyboard activation, and reduced-motion preferences. Selected extras scatter into an animated topping layer and persist through cart, checkout, and group-order requests. Use transparent ingredient cutouts for convincing topping animation. A clean `toppingBaseImageUrl` without the configurable ingredients allows those ingredients to disappear visually when removed. Without this image, the original product photo remains intact and only extras are overlaid; removal still applies to the ordered recipe.

## Test coverage

`catalog-architecture.spec.ts` exercises HTTP authorization/validation, independent menus, pinned revisions, lifecycle visibility, soft deletion, category membership, drink offers, migration and concurrent updates against a temporary MongoDB. `order-item.spec.ts` checks generic checkout pricing and frozen product snapshots. Existing catalog, order, payment and quality tests cover compatibility.
