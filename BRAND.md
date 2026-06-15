# FLUX 2.0 by DrivEv — Brand & UI Guidelines

> Proposed brand system for the FLUX 2.0 platform. Pending sign-off against
> DrivEv's master brand guidelines; values below are implemented in the live UI
> (`public/index.html` design tokens) and can be retuned centrally.

## Positioning

**FLUX 2.0** is DrivEv's connected-EV engagement platform. It turns real-world
driving into stickiness, loyalty and measurable benefit for **EV drivers only —
BEV, PHEV and HEV**. Voice: confident, clear, encouraging; never preachy.
We reward good habits, we don't lecture.

## Logo

- Mark: a rounded-square tile with a single **bolt** glyph, on the brand gradient.
- Wordmark: `FLUX` (800 weight) + `2.0` in accent green, with `BY DRIVEV` kicker.
- Clear space: ≥ half the tile height on all sides. Never recolour the gradient.

## Colour tokens

| Token | Hex | Use |
|---|---|---|
| Primary / accent | `#0AA472` | Actions, highlights, positive states |
| Accent 2 (teal) | `#108FB0` | Secondary data, regen/charging |
| Gradient | `#10C98F → #16B3D6` | Logo, primary buttons, progress |
| Ink (text) | `#0F1D2E` | Headings, body |
| Muted | `#5B6B7D` | Secondary text |
| Surface | `#FFFFFF` | Page + cards |
| Panel 2 | `#F8FAFC` | Insets |
| Line | `#E2E8F0` | Borders |
| Warn | `#C47A08` | Caution (e.g. heat warning) |
| Danger | `#DC4A5C` | Critical, expired warranty |
| Gold | `#CF9F2B` | Top loyalty tier, podium |

Tier colours: Bronze `#B08D57`, Silver `#9AA5B1`, Gold `#E0B341`, Platinum `#6AD1E3`.

## Typography

- Family: **Inter** with system-ui fallback. Single family across the product.
- Scale: H1 24, H2 22, section label 14 (uppercase, tracked), body 13–14, caption 11–12.
- Weights: 800 for numbers/headlines, 700 for emphasis, 500–600 for UI.

## Iconography

- **Line icons only, 24×24, 1.8px stroke, round caps/joins, `currentColor`.**
- **No emoji anywhere in the product** (replaced by the in-app SVG icon set).

## Powertrain badges (EV-only)

| Code | Label | Treatment |
|---|---|---|
| `BEV` | Battery Electric | bolt icon, accent tint |
| `PHEV` | Plug-in Hybrid | bolt icon, accent tint |
| `HEV` | Hybrid | car icon, accent tint |

Pure ICE vehicles are out of scope and never onboarded.

## Layout & components

- 16px grid gap, 16px card radius, soft shadow `0 10px 28px rgba(15,40,70,.06)`.
- Desktop: left sidebar nav. Mobile (≤1000px): top brand bar + fixed bottom tab bar.
- Cards group one idea; KPI "stat" cards lead with a number + line-icon chip.
- Accessibility: target ≥ 4.5:1 text contrast; 44px minimum touch targets on mobile.
