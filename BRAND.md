# drivEV by Yinson GreenTech — Brand & UI Guidelines (Interim)

> **Interim system.** These tokens are implemented in the live UI
> (`public/index.html` design tokens) and are an **interim Yinson-green palette
> pending the official drivEV / Yinson GreenTech brand guideline**. They are
> centralised so the exact brand colours, fonts and logo can be swapped in one place.

## Positioning

**drivEV** is Yinson GreenTech's e-mobility brand (EV leasing + fleet electrification);
**chargEV** is the sibling charging network. This product is the **engagement
platform / app** that compounds value across both — for **retail lease drivers and
fleet operators**. EV-only: **BEV, PHEV, HEV**. Voice: confident, clear, encouraging.

## Logo

- Mark: rounded-square tile with a single **bolt** glyph on the brand gradient.
- Wordmark: `drivEV` (the **EV** set in the accent colour) + `BY YINSON GREENTECH` kicker.
- Clear space ≥ half the tile height. Never recolour the gradient.

## Colour tokens (interim)

| Token | Hex | Use |
|---|---|---|
| Primary / accent | `#00A14B` | Actions, highlights, positive states |
| Accent 2 | `#00BFA6` | Secondary data, regen/charging |
| Gradient | `#00B255 → #00C2A8` | Logo, primary buttons, progress |
| Ink (text) | `#0E2118` | Headings, body |
| Muted | `#5A6B62` | Secondary text |
| Surface | `#FFFFFF` / panel2 `#F6FAF7` | Page + cards |
| Line | `#E3EAE5` | Borders |
| Warn | `#C47A08` | Caution (e.g. heat warning) |
| Danger | `#DC4A5C` | Critical, expired warranty |
| Gold | `#CF9F2B` | Top loyalty tier, podium |

Tier colours: Bronze `#B08D57`, Silver `#9AA5B1`, Gold `#E0B341`, Platinum `#6AD1E3`.

## Typography

- **Inter** with system-ui fallback, one family across the product.
- H1 24 · H2 22 · section label 14 (uppercase, tracked) · body 13–14 · caption 11–12.
- Weights: 800 numbers/headlines, 700 emphasis, 500–600 UI.

## Iconography

- **Line icons only, 24×24, 1.8px stroke, round caps/joins, `currentColor`.**
- **No emoji anywhere in the product.**

## Powertrain badges (EV-only)

`BEV` Battery Electric · `PHEV` Plug-in Hybrid (bolt icon) · `HEV` Hybrid (car icon).
Pure ICE vehicles are out of scope and never onboarded.

## Layout

- 16px grid gap, 16px card radius, soft shadow `0 10px 28px rgba(10,40,25,.07)`.
- Desktop: left sidebar nav. Mobile (≤1000px): top brand bar + fixed bottom tab bar.
- Accessibility: ≥ 4.5:1 text contrast; ≥ 44px touch targets on mobile.

## To finalise (on receipt of the official guideline)

1. Replace the interim hex tokens in `:root` (`public/index.html`) + chart/icon literals.
2. Drop in the official drivEV logo/wordmark assets.
3. Confirm the brand typeface and load it.
