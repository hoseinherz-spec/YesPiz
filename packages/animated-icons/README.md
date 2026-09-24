# @repo/animated-icons

The package owns the Lottie JSON files from the supplied User Interface Icon Pack V2.
Run `npm run sync-assets --workspace=@repo/animated-icons` after changing the assets.
It publishes every animation to both Capacitor apps at `/icons/ui-animated/<file-name>.json`.

Use `animatedIconPath("home-icon")` for an original file name normalized to kebab case,
or one of the semantic aliases (`home`, `check`, `bell`, `close`, `key`, and so on).
