# drivEV — Compliance, Governance & Strategic-Alignment Research

**Subject:** The drivEV connected-EV engagement platform (telematics + battery-health + CO₂-savings + Eco-Credits rewards, EV-only BEV/PHEV/HEV) by Yinson GreenTech, sibling to chargEV.
**Question:** Is it (1) aligned with Yinson GreenTech / Yinson Holdings' direction, (2) compliant with Malaysian law, and (3) sound on governance?
**Date:** 2026-06-15 · **Status:** Internal research — not legal advice. Confirm with Malaysian counsel (PDPA, FSA, MACC) before launch.

---

## Method & confidence

Five parallel research streams (company direction; data protection; telematics/insurance; loyalty/e-money/EV-policy; governance/anti-corruption/anti-greenwashing), each running multiple web searches and cross-checking every claim across 2–4 independent publishers (regulators, Bursa/SC, and Malaysian law firms). Direct page fetches were blocked by this environment's proxy (HTTP 403), so findings rest on cross-checked search snippets and law-firm briefings; the primary URLs are cited for verification and load normally in a browser. Confidence is flagged per claim (High / Medium). Legal-interpretation calls are explicitly marked.

## Headline verdict

| Pillar | Verdict |
|---|---|
| **1. Strategic alignment** | **Strong.** The platform is a natural extension of an already-stated YGT strategy (drivEV "Smart eFleet" telematics, chargEV app/roaming, digitalEV interoperability, GoCar B2C). It advances Yinson's decarbonisation goals and Malaysia's NETR. |
| **2. Malaysian compliance** | **Achievable with specific, non-trivial controls.** No blockers, but PDPA 2024, profiling/ADMP, e-money classification of Eco-Credits, insurance-reward licensing, and consumer-credit (leasing) rules each require deliberate design. |
| **3. Governance** | **Must be embedded from day one.** As a Bursa-listed group, Yinson carries MCCG, NSRF/ISSB reporting, MACC §17A third-party liability, and anti-greenwashing substantiation duties that this data platform directly touches. |

---

## 1 · Strategic alignment with Yinson GreenTech direction — *Strong*

- **Yinson Holdings (Bursa: 7293)** is diversifying from oil-based FPSO toward renewables/green-tech, targeting **1,300 MW renewable capacity by end-2027** and **30% of equity investment in non-oil FPSO by 2030**, with **carbon-neutral (Scope 1&2) by 2030 and net-zero by 2050** commitments. *(High — Yinson Integrated Annual Report 2025, ar.yinson.com/2025; Yinson Climate Report 2024.)*
- **Yinson GreenTech (YGT)** runs transport electrification through **chargEV** (charging), **drivEV** (EV leasing + fleet electrification), **marinEV**, all on a **digitalEV** digital layer. *(High — yinson-greentech.com; ygt.yinson.com/technologies.)*
- **drivEV already operates a data/engagement platform:** **"Smart eFleet"** (launched at Malaysia Autoshow 2024) provides digital keys plus telematics dashboards for **real-time location, driving behaviour, charging, utilisation and carbon reporting**. *(High — paultan.org, 27 May 2024; BusinessToday, 24 May 2024.)* **This is the single strongest alignment signal: our platform extends an existing drivEV capability, not a net-new bet.**
- **chargEV** is at scale and strategically backed: **366 chargers (FY2025), 3,000 by 2030**; a **2023 ComfortDelGro-ENGIE** tie-up created a >1,000-point MY-SG network with app roaming (target 8,000 by 2030); and **Khazanah Nasional invested (Mar 2025)** to scale nationally, explicitly aligned with **NETR** and MITI's 10,000-charge-point goal. *(High — yinson.com/news; The Edge; DealStreetAsia; electrive.com.)*
- **digitalEV integrated Hubject Plug&Charge (ISO 15118)** for automated auth/payment — a standards-based interoperability posture our rewards/charging integration can build on. *(High — Hubject, 2024.)*
- **Real deployments** validate the fleet thesis: **Pos Malaysia** (143 + 136 e-vans), and a **GoCar** EV car-sharing partnership (Dec 2024) for B2C. *(High — yinson.com/news; paultan.org.)*
- **Policy tailwind:** Malaysia's **NETR** (Jul 2023) names green mobility a transition pillar; the **Low Carbon Mobility Blueprint 2021–2030** targets **≥15% xEV of sales by 2030, 38% by 2040** (NETR cites ~80% of TIV by 2050). *(High — MIDA; paultan.org; PwC.)*

**Conclusion:** A connected driver+fleet engagement app that increases lease retention/LTV, fleet utilisation, and chargEV session demand is squarely on-strategy and ESG-accretive.

---

## 2 · Data protection & privacy (PDPA 2010 + 2024 amendment) — *Highest-effort area*

Telematics, GPS/location and driver-behaviour data are **personal data** (they identify a driver indirectly), so the full PDPA applies. *(High — Lexology automotive-data note; pdp.gov.my.)*

**The 2024 amendment (Act A1734)** — gazetted 17 Oct 2024, phased in over 2025 — materially raises the bar:
- **Penalties up** for breaching the data-protection principles: **RM1,000,000 and/or 3 years** (from RM300k/2yr). Processors now carry direct security obligations. *(High — Christopher & Lee Ong; One Asia Lawyers.)*
- **Mandatory DPO:** required where there is **regular and systematic monitoring (expressly incl. tracking, profiling, connected devices)**, or processing of **>20,000 data subjects** (or sensitive data of >10,000). **A telematics app triggers this.** DPO must be **registered with the Commissioner within 21 days**, Malaysia-contactable, BM+English proficient. *(High — Securiti; Hogan Lovells; effective 1 Jun 2025.)*
- **Mandatory breach notification:** to the Commissioner **within 72 hours**; to affected data subjects **within 7 days** where significant harm is likely; notifiable where **>1,000 data subjects** or significant harm. Non-compliance: up to **RM250,000 / 2 years**. *(High — CMS Law-Now; DLA Piper; Hogan Lovells.)*
- **Cross-border transfers overhauled:** the country "whitelist" is abolished; transfers allowed where the destination is **"substantially similar"/adequate**, else rely on a **Transfer Impact Assessment, explicit consent, BCRs or SCCs**. Commissioner's guidelines issued **29 Apr 2025**. Relevant if telematics flows to OEM/cloud abroad. *(High — Mayer Brown; CMS.)*
- **Data portability** right from Jun 2025; **biometric data** (incl. *behavioural* characteristics) now **sensitive** and needs **explicit consent**. *(High — Christopher & Lee Ong; Deloitte.)* **Legal-interpretation risk:** driver-behaviour "fingerprints" could be argued to be behavioural-biometric/sensitive — design for explicit consent to be safe. *(Medium.)*
- **Profiling/ADMP:** JPDP's draft **Automated Decision-Making & Profiling** guideline and **DPIA** guidance propose a right to object to **solely-automated decisions with significant effect** and DPIAs above the same volume thresholds. **Eco-scoring that drives pricing/eligibility is classic ADMP** → expect transparency, human-in-the-loop and opt-out. *(High that the guidance exists/consultation ran; not yet final law — Medium on final form. pdp.gov.my PCP 3/2025.)*

**Notice:** privacy notice in **Bahasa Malaysia + English**, per-purpose granular consent (no bundling), recordable consent, and an in-app withdrawal mechanism. *(High — Baker McKenzie; Tay & Partners.)*

---

## 3 · Telematics / UBI & any "insurance discount" reward — *Permitted, but watch licensing*

- Malaysia **liberalised motor tariffs** (Phase 1 Jul 2016, Phase 2 Jul 2017); insurers may price on risk factors **including mileage, time-on-road and geographical location** — i.e., **telematics/UBI is regulatorily welcomed**. *(High — BNM; insurer FAQs.)*
- **It already exists locally:** **AXA FlexiDrive** (Jul 2017) gave up to **20% safe-driving discount**; **Digi Connected Cars** bundled it — precedent for **a non-insurer app partnering with a licensed insurer** to deliver a telematics discount. *(High — paultan.org; CarSifu.)*
- **Licensing boundary (FSA 2013):** insurance business/broking/advice needs BNM authorisation. **A pure score-and-refer app generally sits outside licensed activity**, but advising/arranging/transacting crosses into broking. Lower-risk structure: **partner with a licensed insurer / registered agent (PIAM/LIAM), keep drivEV to scoring + referral.** Referral economics are constrained by BNM rules. Improper conduct exposure under FSA Sch. 7: up to **RM10m / 5 years**. *(Medium-High; fact-specific — confirm with BNM. Baker McKenzie; Lexology.)*

---

## 4 · Eco-Credits, e-money, consumer protection & leasing — *Design closed-loop*

- **E-money classification (BNM, FSA 2013):** EMIs need BNM approval, **but** the **Financial Services (Limited Purpose Electronic Money) (Exemption) Order 2024 [P.U.(A) 463/2024]** created a **"storing rewards"** limited-purpose category. **Eco-Credits likely fall in the exempt zone if they are *earned* (not purchased with money) and redeemed only within a *closed* partner loop (chargEV, car wash, coffee, service, etc.).** Offering **cash-out or broad open-loop** redemption risks tipping into **regulated e-money**. *(Medium-High — BNM e-money PD; Lexology; Fintech News MY. Confirm exact para-4 conditions against the gazette.)*
- **Consumer Protection Act 1999 (KPDN):** no fixed statutory voucher-expiry minimum, but **misleading/deceptive conduct and "free"/discount claims are policed**; catch-all penalty up to **RM50,000 / 3 years**. Keep reward T&Cs, expiry and "free" wording clean. *(High — Act 599; KPDN.)*
- **Leasing / consumer credit (drivEV's core):** the **Hire-Purchase Act 1967** applies to vehicle HP; the **Hire-Purchase (Amendment) 2025** abolishes flat-rate/Rule-of-78 for **effective-interest reducing-balance** (new car loans ~2027). The new **Consumer Credit Act 2025 / Consumer Credit Commission (in force from Mar 2026)** brings **non-bank leasing/BNPL under licensing** — **drivEV's leasing/financing flows are in scope**; any in-app financing must comply. *(High — paultan.org; Shearn Delamore; RinggitPlus.)*
- **Charging-credit reward** interacts with **Charge Point Operator licensing** (Energy Commission, Electricity Supply Act, mandatory since 31 Mar 2023) — fine when redeemed via licensed chargEV. *(High — Motor Trader; Malay Mail.)*
- **Carbon-offset reward** should map to **Bursa Carbon Exchange (BCX) / Verra-grade** credits for credibility. *(High — Allen & Gledhill; BCX FAQs.)*

---

## 5 · Corporate governance, sustainability reporting, anti-corruption & anti-greenwashing — *Embed from day one*

- **MCCG 2021** ("apply or explain") makes the **board responsible for sustainability (Practice 4)** and for **risk/internal control incl. cyber security and sustainability (Practice 10)**. The SC's **CG Monitor 2025** signals a **MCCG revision sharpening AI/technology/cyber governance** — directly relevant to a data platform. *(High — SC; EY.)*
- **Sustainability reporting (NSRF):** launched 24 Sep 2024, adopting **ISSB IFRS S1/S2**. **Group 1 (Main Market cap ≥ RM2bn) reports for FY beginning on/after 1 Jan 2025**; Bursa amended its Listing Requirements (23 Dec 2024) for TCFD-aligned climate disclosure; **reasonable assurance on Scope 1&2 from FY2027**. **Yinson is very likely Group 1** (market cap ~RM6–7bn), so **emissions-avoided figures from the platform must be assurance-ready**. *(High on framework; Medium on Yinson's exact Group-1 designation — sensitive to 2025–26 privatisation talk. SC; Bursa; Grant Thornton.)*
- **MACC Act §17A** (corporate liability, in force 1 Jun 2020): the company is liable if an **"associated person" (incl. third parties/partners)** bribes for its benefit; penalty **≥10× the gratification or RM1m, and up to 20 years**; **directors personally deemed liable** absent due diligence. The **only defence is "adequate procedures" (T.R.U.S.T. principles)** — which **explicitly require third-party/partner due diligence**. **Reward-fulfilment and charging/insurer partners are §17A exposure** → run them through the adequate-procedures programme. *(High — HSF; ICDM; Chambers.)*
- **Anti-greenwashing:** no single statute, but the **ASA Malaysian Code of Advertising Practice (Part 11)** and the **MCMC Content Code** require environmental claims to be **substantiated** (burden on the advertiser). CO₂-savings claims are most defensible if **quantified and third-party verified to ISO 14064-1 / GHG Protocol** (and **ISO 14068-1:2023** for any "carbon-neutral" claim; PAS 2060 withdrawn from 1 Jan 2025). The SC's **SRI framework/taxonomy** signals the regulator's substantiation posture. *(High — ASA; BSI; SGS; SC.)*

---

## Singapore note (secondary)

drivEV/chargEV also operate in **Singapore**, so **Singapore's PDPA (PDPC)** applies to SG users/data — consent, purpose limitation, **mandatory data-breach notification**, and a **DPO requirement**, broadly parallel to Malaysia's amended regime. Treat MY as primary; mirror controls for SG cohorts. *(Medium — standard PDPC obligations; confirm specifics for the SG pilot.)*

---

## Prioritised action checklist — Phase-1 pilot

**P0 — before any real user data (blockers)**
1. **Appoint & register a DPO** (mandatory for telematics/profiling); register with the Commissioner within 21 days.
2. **Bilingual privacy notice (BM+EN) + granular, per-purpose consent** (separate toggles for location, driving-behaviour, charging, marketing); recordable consent; easy withdrawal.
3. **DPIA** for telematics + eco-scoring profiling; document lawful basis, retention, and **human-in-the-loop / opt-out** for any automated decision with significant effect.
4. **Breach-response runbook:** 72-hour Commissioner notification, 7-day data-subject notification; logging and severity triage.
5. **Eco-Credits scheme design memo** confirming closed-loop, earned-not-purchased structure → fits the **limited-purpose "storing rewards" e-money exemption**; no cash-out.
6. **Insurance-reward structure:** partner with a **licensed insurer/registered agent**; keep drivEV to score+refer; legal sign-off on FSA boundary.

**P1 — before scale**
7. **Cross-border transfer assessment** (TIA/SCCs) for any telematics data leaving Malaysia (OEM/cloud).
8. **§17A adequate-procedures programme** (T.R.U.S.T.) with **third-party due diligence** on all reward/charging/insurer partners; anti-bribery clauses in partner contracts.
9. **Emissions methodology** documented and **verification-ready (ISO 14064-1 / GHG Protocol)**; align grid-intensity factors to Malaysian data; substantiate every CO₂/"savings" claim (ASA Part 11).
10. **Consumer-credit alignment** for leasing/financing flows (HP Amendment EIR; Consumer Credit Act / CCC licensing).
11. **Reward T&Cs** reviewed against CPA 1999 (expiry, "free"/discount wording).

**P2 — governance & reporting**
12. **Board/Risk-Committee oversight** of the platform's cyber, data and ESG-claim risks (MCCG Practice 4 & 10); add to the risk register and SORMIC.
13. **Feed assured emissions-avoided metrics** into Yinson's **ISSB/NSRF** reporting pipeline (assurance-ready from FY2027).
14. **Mirror controls for Singapore** (PDPC) cohorts.

---

## Selected sources

PDPA & amendment: Mayer Brown (cross-border, 2025); CMS Law-Now & DLA Piper Privacy Matters & Hogan Lovells (DPO/breach, 2025); Christopher & Lee Ong; pdp.gov.my (PCP 3/2025 ADMP). Company/strategy: Yinson Integrated Annual Report 2025 (ar.yinson.com/2025); Yinson Climate Report 2024; yinson-greentech.com; paultan.org (Smart eFleet, 2024); Hubject (2024). Insurance/UBI: BNM liberalisation; paultan.org/CarSifu (AXA FlexiDrive); Baker McKenzie (distribution). E-money/credit/EV: BNM e-money PD & P.U.(A) 463/2024; Shearn Delamore / RinggitPlus (HP Amendment & Consumer Credit Act 2025); MIDA/PwC (NETR); Motor Trader (CPO licensing); Allen & Gledhill / Bursa (BCX). Governance/ESG/anti-corruption: SC (MCCG 2021, CG Monitor 2025, NSRF); Bursa LR (Dec 2024); Grant Thornton (assurance); HSF/ICDM (MACC §17A T.R.U.S.T.); ASA/BSI/SGS (greenwashing/ISO 14064-1/14068-1).

*Full per-claim URLs are retained in the research working notes. This document summarises legal/regulatory research and is **not legal advice**; obtain Malaysian counsel sign-off (PDPA, FSA, MACC) before the pilot.*
