# DrivEv Nexus — Telematics · Battery Life · CO₂ Savings · Rewards

A connected-EV engagement platform that turns raw telematics into **real-world
benefit and stickiness** for DrivEv drivers. It couples a realistic telematics
feed with live financial, environmental and battery-health models, then wraps the
whole thing in a loyalty + rewards loop so opening the app every day pays off.

> Rebuilt on the lightweight "no database needed" architecture of the original
> project: an Express API with file-backed JSON storage and a single-file
> dashboard, so it still deploys for free on Render / Railway.

## Why it drives stickiness

| Pillar | What the driver gets | Why they come back |
|---|---|---|
| **Telematics & eco-score** | Every trip graded A+→E on efficiency + smoothness | Gamified self-improvement |
| **Battery life** | Live State of Health, warranty tracking, personalised pack-care tips | Asset protection — protect resale value |
| **CO₂ & cost savings** | kg CO₂ avoided, trees-equivalent, litres of fuel + $ saved | Tangible daily payoff |
| **Loyalty & rewards** | Eco-Credits, tiers (Bronze→Platinum), redeemable perks | Real, spendable value |
| **Stickiness mechanics** | Streaks, weekly challenges, badges, community leaderboard | Habit formation + competition |

## The Simulator Lab (the hook)

The headline view is an **interactive Simulator Lab**. Drag the sliders —
distance, average speed, driving aggression, **regenerative braking**, and
**ambient parking temperature** — and watch energy use, CO₂ saved, money saved,
eco-score and Eco-Credits recompute in real time:

- **Regen Incentive Loop** — cranking up regen offsets the penalty of aggressive
  driving, recovering range *and* multiplying credits.
- **Asset-protection nudges** — push parking temp past 35 °C and a battery-health
  warning fires, shifting behaviour from passive tracking to active care.
- **Tangible value mapping** — efficiency is mapped straight to fuel-cost
  displacement and spendable points.

Hit **“Log this drive”** to persist the exact configured trip; battery cycles,
points, streaks and the leaderboard all update.

## Architecture

```
server.js              Express API (telematics, battery, CO2, rewards, leaderboard)
lib/
  config.js            All domain tunables (emissions factors, tiers, battery model)
  store.js             File-backed JSON store (data/drivev.json)
  simulator.js         Telematics simulator (random + parameter-driven trips)
  scoring.js           Eco-driving score + coaching feedback
  battery.js           State of Health, care score, warranty, projections
  co2.js               CO2 + fuel-cost savings model
  rewards.js           Points, tiers, streaks, badges, challenges, catalogue
  seed.js              Demo driver + peer fleet for the leaderboard
public/index.html      Single-file React dashboard (7 views + Simulator Lab)
data/drivev.json       Auto-created & auto-seeded on first boot
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/me` | Full dashboard profile (impact, battery, loyalty) |
| GET | `/api/trips` | Trip history with eco feedback |
| POST | `/api/trips/simulate` | Log a trip — pass `{params:{...}}` from the Lab, or random |
| GET | `/api/battery/:vehicleId` | Battery deep-dive |
| GET | `/api/impact` | CO₂ / cost savings summary |
| GET | `/api/rewards` | Catalogue + balance + redemptions |
| POST | `/api/rewards/redeem` | Redeem a reward |
| GET | `/api/challenges` | Active challenges + badges |
| GET | `/api/leaderboard?metric=` | Ranked fleet (`points`/`co2SavedKg`/`avgEco`/`distanceKm`) |
| POST | `/api/reset` | Reset & re-seed demo data |

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

## Deploy (free)

- **Render**: connect the repo — `render.yaml` is preconfigured with a persistent
  disk for `data/`. Click *Create Web Service*.
- **Docker**: `docker build -t drivev . && docker run -p 3000:3000 drivev`

## Configuration

Set per-market factors via env vars (see `lib/config.js`):

- `GRID_CO2_PER_KWH` — local grid carbon intensity (default `0.233`).
