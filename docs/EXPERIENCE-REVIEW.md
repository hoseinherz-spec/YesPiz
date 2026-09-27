# Experience improvements and competitor references

The customer app remains the visual reference: dark navy, lime accent, rounded surfaces, generous spacing and shared motion tokens. Admin and kitchen workspaces default to the same dark palette, with a persistent light/dark appearance control. Both operational shells share one dashboard layout: a floating icon rail with the Yespizz badge on top, tooltips for each workspace, a rounded top search bar with live workspace suggestions, and grouped card surfaces. Customer screens retain one YesPizz identity; kitchen identity stays private.

## References and implementation

| Reference | Observed pattern | YesPizz implementation |
|---|---|---|
| [Uber Eats order management](https://merchants.ubereats.com/us/en/academy/orders/) | Busy preparation management and pausing incoming work | Kitchen preparation override, pause/resume, capacity and opening hours |
| [DoorDash Merchant Portal](https://merchants.doordash.com/en-us/products/merchant-portal) | Orders, menu availability and operational management in one workspace | Kitchen board, incoming offers, stock, courier handoff and settlements |
| [Snoonu tracking on Mobbin](https://mobbin.com/screens/4ffa7407-deb9-42c8-8ae1-e38d0c9dfab6) | Clear ETA, progress and courier contact | Stage journey, ETA, courier vehicle, customer chat and honest GPS freshness |
| [Zomato preparation on Mobbin](https://mobbin.com/screens/c388e8a5-5103-4746-8cac-213d1c9fbc41) | Preparation status, address, instructions and help | Waiting journey, address snapshot, instructions, help and optional pizza matching game |

These are feature references, not a claim that YesPizz reproduces the competitors' entire products. The existing blind marketplace, quality checks, sealed handoff and delivery PIN remain the product's defining flow.

## Functional changes

- New orders have zero delivery fee. Historical paid receipts retain their recorded values.
- Customers see active eligible coupons from the API, including conditions and expiration. Codes are validated in the server quote; copying a code does not apply it automatically.
- Loyalty progress comes from fulfilled paid orders. The waiting game does not fabricate wallet credit; its setting persists on the device.
- Kitchen–courier pickup chat is separate from customer delivery chat and visible only to the assigned participants. Duplicate retries do not duplicate messages. New messages invalidate the two participants’ private socket feeds immediately; polling remains a fallback.
- Courier profiles support car, motorcycle, scooter and bicycle. Tracking shows the saved vehicle type.
- Kitchen and courier screens refresh from authenticated socket events, reconnect/visibility refresh and polling. Customer GPS freshness is based on the actual location timestamp.
- Menu images prefer the managed API image URL. Featured sections use catalog tags, not fixed slices or fake counts.

## Demo and production boundaries

The local demo uses real database records and normal business API transitions with fictional accounts and catalog assets. It is not a connection to real restaurants or external dispatch. Card payments use the existing local payment simulator unless a Stripe sandbox is configured. GPS simulation in the scenario setup is labelled by its freshness; the app does not keep moving a fake courier.

The demo launcher never uses the developer's database or production credentials. Restarting it recreates the disposable dataset. Real product photography, live restaurant integration and production payment/provider credentials must be supplied through the existing management/integration routes.
