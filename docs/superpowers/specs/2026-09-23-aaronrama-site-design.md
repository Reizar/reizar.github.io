# aaronrama.com — Design

**Date:** 2026-09-23
**Status:** Approved in conversation; awaiting spec review
**Direction:** B2 "Inside the network" (chosen from live mockups)

## Goal

A single-screen personal site positioning Aaron Rama as an AI-native CTO. It should feel futuristic and sleek, not like boilerplate AI design (no serif fonts, status dots, mono eyebrow labels). The only call to action is LinkedIn.

## Constraints

- Hosted on GitHub Pages at `aaronrama.com`.
- Static files only. No build step, no npm, no bundler.
- Three.js loaded from `cdn.jsdelivr.net` via an import map, pinned to `three@0.170.0`.
- Nothing is pushed to a remote; Aaron handles GitHub.

## Content

| Element | Copy |
|---|---|
| Name (h1) | Aaron Rama |
| Tagline | **AI-native CTO.** Co-founder of Keyhook. ("AI-native CTO." in accent) |
| CTA | Get in touch on LinkedIn → `https://www.linkedin.com/in/aaronrama/` |
| Timeline | Keyhook 2020 – now · DeltaSift 2019 – 2020 · Algo → Meltwater 2015 – 2019 |

No other links. No scrolling: everything fits in one viewport.

## Visual system

- Background `#04050a`, text `#eef0f4`, dim text `#838894`, accent `#5aa9ff`.
- Font: Inter Tight (400, 500) from Google Fonts.
- Name: centred, `clamp(56px, 11vw, 176px)`, weight 500, letter-spacing -0.06em.
- CTA: 1px hairline border (`#ffffff2a`), 2px radius, border turns accent on hover and focus-visible.
- Timeline: 13px, bottom-centred, stacks vertically below 760px.

## 3D scene

- Camera at the origin (fov 70) inside a shell of nodes, radius 1.6–9.1.
- Desktop: 1500 nodes. Mobile (< 760px wide or coarse pointer): 900 nodes.
- Each node links to up to 2 later neighbours within distance 1.15, drawn as thin lines (base alpha 0.1).
- About 28% of the links carry blue pulses that travel along them.
- Nodes are round additive sprites. They grow and turn accent-coloured near the cursor (screen-space radius 0.35).
- Depth fade: nodes and lines fade out towards distance 9.
- Motion: the group rotates slowly (y 0.00004, x 0.00001 rad/ms). The camera eases toward the pointer (±0.12 rad yaw, ±0.08 rad pitch).
- Pixel ratio capped at 2 (desktop) and 1.5 (mobile).

## Load sequence

1. The page renders with the text hidden and the canvas at opacity 0.
2. Once the scene is built, the canvas fades in over 1.2s.
3. The text fades and rises in 0.5s after that.

Without JS or WebGL, the text is shown immediately.

## Resilience and accessibility

- **`prefers-reduced-motion: reduce`:** render one static frame. No rotation, pulses, fade-in or pointer effects.
- **WebGL unavailable or throws:** skip the scene and show the text over a CSS radial gradient.
- **Animation pausing:** stop the loop on `visibilitychange` (hidden) and on window `blur`; resume on return.
- **Touch devices:** no pointer tracking. The slow auto-rotation continues.
- **Semantics:** the canvas is `aria-hidden`. The content is real HTML (`main`, `h1`, `p`, `a`, `footer`). Text colours meet WCAG AA contrast.

## Files

```
index.html       markup, meta/OG/Twitter tags, import map
style.css        all styles
js/main.js       renderer, camera, loop, pointer, pause, reduced motion, fallback
js/network.js    node/link generation + shader materials (pure: takes params, returns Object3Ds)
favicon.svg      small blue node-graph mark
og.png           1200×630 hero screenshot
CNAME            aaronrama.com
.nojekyll
```

## Metadata

- **Title:** "Aaron Rama — AI-native CTO".
- **Description:** "Aaron Rama is the co-founder and CTO of Keyhook, building AI-native software from Wellington, New Zealand."
- Open Graph and Twitter large-image tags pointing at `https://aaronrama.com/og.png`. Canonical URL `https://aaronrama.com/`.

## Verification

No test framework (static page). Before calling the work done:

- Headless Chrome screenshots at 1440×900 and 390×844 match the design.
- No console errors.
- Reduced-motion emulation renders a static frame.
- A forced WebGL failure shows the fallback.
- Lighthouse scores ≥ 90 for performance, accessibility, best practices and SEO.

## Out of scope

Blog, multiple pages, analytics, contact form, CMS, GitHub/X links, remote push and DNS setup.
