# Finna Bók Typography

_Started 2026-04-25 10:55 UTC_

---

## User

On the front page it should say "Finna bók", that could have some style to it and can take up more space then just a common label.

## Assistant

I'll design this carefully. Let me think through the system before building.

**Aesthetic direction** (declaring up front since no design system provided):
- **Type**: "Fraktur" feel is overdone — instead, pair **Newsreader** (warm, literary serif, excellent with Icelandic diacritics: ð, þ, æ, ó) for the hero "Finna bók" wordmark and book titles, with **Inter** for UI/body. Clean, not overly stylized.
- **Color**: warm neutral base — paper-cream `oklch(0.97 0.01 80)` light / deep ink `oklch(0.18 0.01 80)` dark. One signal accent: **moss green** `oklch(0.55 0.12 145)` for "Tiltækt núna" / available status. Muted slate for "í útláni".
- **Layout**: single column, generous breathing room, "Finna bók" as a large editorial display headline on home (your callout) — not a tiny label.
- **System**: 4px grid, 16px gutters, 12px radius cards, hairline `1px` dividers in `oklch(... / 0.08)`.
- 6 artboards on a design canvas: Home / Results / Detail × Light / Dark.

Let me set up.

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: read_file]_

Good, I have what I need. Now let me build the design.

_[tool: write_file]_

Now the screens. I'll build them as React components in a single JSX file, then mount in the design canvas.

_[tool: write_file]_

Now the three screens:

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Designed three screens (Home, Results, Detail) in light + dark on a design canvas.

**Visual system declared up front:**
- Newsreader (italic) for the editorial "*Finna bók.*" wordmark + book titles; Inter for UI; JetBrains Mono for call numbers
- Warm paper-cream / deep ink base, moss-green availability accent (`oklch(0.48 0.105 145)`)
- "Finna bók." set as an 88px display headline with a moss underline under "bók" — gives the home screen its weight

**Highlights:**
- Home: scope picker top-left, wordmark mid-screen, search field + recent searches below
- Results: grouped Tiltækt núna / Allt í útláni — green dot + count pills make availability the loudest thing on screen
- Detail: hero with cover-derived radial tint, italic serif author, branch table with `Skáldverk · 823.91 LAX` call numbers and per-row return dates

Open the canvas to compare; drag any artboard fullscreen with the expand control. Let me know if you want a flow prototype next, or different palettes/type pairings explored as Tweaks.

