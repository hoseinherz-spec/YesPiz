# Landing animation review — 2026-09-11

Scope: the production `/` landing page in `apps/website`, including hero, craft sequence, pizza menu, promise, FAQ, download, and footer. The separate `/dev/yesplz` demo was not changed. Existing unrelated work was preserved.

## Changes

- Re-encoded 144 craft frames at 1280 × 720, JPEG quality 75. Total file bytes fell from 53,309,350 to 15,359,222 (71.2%). This trades some full-screen sharpness for transfer and decode cost.
- Deferred frame loading until the craft section is within 600 CSS pixels of the viewport; limited concurrent fetch/decode workers to four. Aborts pending requests and closes decoded bitmaps on cleanup.
- Stores decoded bitmaps at 960 × 540 on desktop and 640 × 360 on mobile. Raw frame pixels require approximately 285 MiB / 127 MiB respectively, versus approximately 2,025 MiB at the original resolution; these are calculated pixel budgets, not measured browser process memory.
- Capped canvas device pixel ratio at 1.5; batched resizing through ResizeObserver and requestAnimationFrame; removed the duplicate no-op frame geometry tween and per-update synchronous canvas measurement. The intentional docking animation still changes the media column dimensions and therefore still incurs layout.
- Pauses hero badge and menu animation when outside the viewport, when the document is hidden, or when reduced motion is requested. Removes menu particles when stopped.
- Batches floater geometry reads before transform writes and normalizes motion by elapsed frame time. Removed the competing CSS transform transition and animated blur.
- Preserves ingredient DOM identity through flavor changes, scopes GSAP event animations for cleanup, and prevents overlapping pizza spins.
- Makes the mobile/tablet menu flow vertically with natural height, avoiding overlap of the product, description, and cards.
- Supports reduced motion with a single craft frame, no extended scroll runway, immediate flavor changes, and MotionConfig for Motion components. CSS reserves the reduced-motion runway before hydration to avoid a scroll jump.
- Removes footer blur animations. Uses a local, sized, optimized hero thumbnail rather than a remote request.

## Validation

- Website TypeScript check: passed.
- Website ESLint: no errors; two existing unused-variable warnings in accordion and the unused pizza slider.
- `git diff --check`: passed.
- Headless Chrome against the Next.js development server: desktop 1440 × 1000 and mobile 390 × 844 at DPR 3.
- Both viewport checks: zero initial craft-frame requests before approaching the section; craft renders; Garden Veggie selection completes; ingredient DOM identity remains stable; no page errors; no horizontal overflow; FAQ opens.
- Leaving menu: animation inactive, zero particle elements, and product transform unchanged across an additional 400 ms.
- Reduced motion at load: one frame requested; craft height 844 px for an 844 px viewport; menu animation inactive; flavor selection works.
- Enabling reduced motion after loading the normal sequence: craft height changes to the viewport height.

A four-second desktop scroll sample recorded 121 frame intervals: median 33.3 ms, p95 33.4 ms, and zero intervals above 50 ms. The idle control measured the same 33.3 / 33.4 ms cadence, so this environment ran at about 30 FPS even without scrolling. These numbers show no additional cadence degradation in this sample, not a 60 FPS guarantee.

This is not a production Lighthouse run or a low-end physical-device benchmark. Real-device testing is still needed before claiming consistent 60 FPS on all devices. The frame sequence remains a significant download; a video or a smaller frame cache would be a separate visual/architecture tradeoff.
