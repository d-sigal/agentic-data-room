---
slug: product-overview
title: Product Overview
note: Current product, pricing, and 2026 roadmap. Source of truth for pricing.
---

# Product Overview

Probably Covered is a single API that lets a platform offer insurance inside its own checkout. This document describes the product as of October 2026, the current pricing, and the 2026 roadmap. For pricing, this document is the source of truth and supersedes any earlier pricing sheet.

## The API

A partner integrates three endpoints.

1. Quote. The partner sends context about the transaction (a trip, a shipment, a device, a shift) and receives one or more priced coverage options in under 200 milliseconds.
2. Bind. When the user accepts, the partner calls bind and we issue the policy on carrier paper, deliver the policy documents, and record the premium.
3. Claim. The user, or the partner on the user's behalf, files a claim through our hosted claims flow or the claims API. Most claims are adjudicated automatically.

Supporting capabilities include a sandbox with realistic test data, webhooks for policy and claim events, a partner dashboard with attach rate and loss ratio reporting, and white-label policy documents.

## Lines of business

- Travel: trip cancellation, trip interruption, travel delay, baggage. Live with Bookish.com and Nomadic Air.
- Gadget protection: accidental damage and theft for consumer electronics purchased through a partner. Live with eBuy.
- Shipping: loss and damage in transit. Live with eBuy and in pilot with Shopifly.
- Gig-worker coverage: occupational accident and contingent liability for drivers and couriers while on platform. Live with Yuber, exclusive to Yuber in the US.
- Parametric flight delay: scheduled for Q3 2026 (see roadmap).

## Pricing (current)

Three tiers. All take rates apply to gross written premium (GWP).

| Tier | Platform fee | Take rate | Includes |
|---|---|---|---|
| Starter | $0 | 20% | API access, sandbox, standard policy documents, email support |
| Growth | $4,000 per month | 18% | Everything in Starter plus white-label documents, dashboard, dedicated solutions engineer |
| Enterprise | $25,000 per month | 15% | Everything in Growth plus custom SLAs, custom carrier programs, quarterly business reviews |

The Growth plan costs $4,000 per month plus an 18% take rate. The Enterprise plan costs $25,000 per month plus a 15% take rate with custom SLAs. The blended take rate across the book in the financial model is 17.4%.

Pricing was updated on January 1, 2025. The 2024 pricing sheet (Growth at $3,500 per month, Enterprise at $20,000 per month) is superseded and retained only for history. Partners signed under 2024 pricing were migrated to current pricing at their first renewal.

## Claims automation

Claims are the product. A partner's users judge the insurance by whether a claim is paid quickly, and a partner judges us by whether claims generate support tickets.

- Straight-through rate: 71% of claims are adjudicated and paid with no human touch. Automated checks include policy validity, event verification (flight data, carrier tracking, device IMEI), fraud scoring, and payout.
- Median claim payout time: 41 hours from filing to funds sent.
- 2025 loss ratio: 54%.
- Human review handles the remaining 29%, concentrated in gadget theft and gig-worker injury claims.

Claims automation v2, released in Q1 2026, added document extraction for receipts and medical bills, which lifted the straight-through rate from 63% at the end of 2025 to 71% in Q3 2026.

## 2026 roadmap

| Quarter | Milestone |
|---|---|
| Q1 2026 | eBuy launch (shipping and gadget protection). Claims automation v2. |
| Q2 2026 | Dublin entity live for EU partners. First EU travel policies issued through Probably Covered Ireland Ltd. |
| Q3 2026 | Parametric flight-delay product. Automatic payout when a covered flight is delayed beyond the trigger, no claim filing required. |
| Q4 2026 | Self-serve Starter tier. Target of 20 signed distribution partners by year end. |

Q1 through Q3 milestones shipped on schedule. The self-serve Starter tier is in beta with three inbound partners as of October 2026.

## Security and compliance

SOC 2 Type II report available in the data room. Policyholder data is stored in the US for US policies and in the EU for EU policies. PC Claims Services LLC holds producer licenses in all 50 states and the District of Columbia.
