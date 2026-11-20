# Investor Data Room: Corpus Index

This is the consolidated corpus loaded as the cached system-prompt block in the investor Q&A app. Each document below is delimited by `<doc id="slug">` tags. When citing a fact, emit `[doc:slug]`.

# Section: Overview

<doc id="overview-investor-memo" title="Investor Memo (October 2026)">
# Investor Memo (October 2026)

Prepared for prospective Series B investors in Probably Covered Inc. All figures in US dollars. Data as of September 30, 2026 unless stated.

## Summary

Probably Covered sells embedded insurance infrastructure to platforms that already own the moment of risk. A ride-hailing app, a travel booking site, or a marketplace integrates our API once and can then offer insurance at checkout without becoming an insurer. We handle quoting, issuance, claims, and carrier capacity. In 2025 we processed $212.0M of gross written premium (GWP) and earned $41.6M of net revenue at a 71% gross margin. We are raising $40.0M at a $320.0M pre-money valuation.

## Why now

Three things changed between 2021 and 2026.

First, platforms learned that embedded financial products carry higher margins than their core business. Embedded payments proved the model; insurance is the next line.

Second, carriers want distribution they do not have to build. Our six carrier partners treat us as a single integration that reaches 14 platforms. Alpha Mutual, our lead carrier, has committed $300M of annual GWP capacity under a two-year agreement beginning January 1, 2026.

Third, claims automation became practical. Our straight-through rate is 71%, which means most claims are adjudicated and paid with no human touch. That is what makes small-ticket policies (average premium $62) economic.

## The business today

- 14 signed distribution partners, 22 more in negotiation, 9 at contract stage.
- Blended attach rate 11.4%. Yuber 19.8%, Bookish.com 9.1%, eBuy 7.6%.
- 3.41 million policies issued in 2025. 1.62 million in Q3 2026.
- Net revenue retention 131%. CAC per distribution partner $38,000 with 7.2 months payback.
- 84 FTEs. Cash at December 31, 2025 was $31.2M.

The 2026 plan calls for $68.0M of net revenue, growing to $112.0M in 2027 and $176.0M in 2028, with net income turning positive at $5.8M in 2028.

## Risks

We want investors to see the risks the way we see them.

### Carrier concentration

Alpha Mutual underwrites 58% of our GWP. If Alpha Mutual reduced capacity or exited the relationship, we would need to re-paper a majority of our book with Beacon Re, Northgate Specialty, Tidewater Insurance Co, and our two unnamed carriers. The Alpha Mutual agreement includes a loss ratio corridor of 45% to 65%; our 2025 loss ratio of 54% sits inside it. We are actively working to bring Alpha Mutual below 50% of GWP by the end of 2027 by shifting new lines to other carriers.

### Partner concentration

Yuber represents 34% of GWP. Yuber is our largest and highest-attach partner (19.8%), and the gig-worker line is exclusive to them in the US under our distribution agreement. Loss of Yuber would cut revenue materially. Mitigants: a three-year term from May 1, 2025 with automatic one-year renewals, deep product integration, and a 25% revenue share that aligns Yuber's incentives with policy volume. As eBuy and Bookish.com scale, Yuber's share declines in the base case.

### Regulatory

US insurance is regulated state by state. We hold producer licenses in all 50 states and the District of Columbia through PC Claims Services LLC, but every new line of business requires new filings, and some states have begun scrutinizing embedded sales flows. A change in how a large state treats checkout disclosures could require product changes with limited notice. Our Dublin entity, Probably Covered Ireland Ltd, brings EU regulatory exposure as EU partners go live.

### Other risks

Loss ratio volatility (a bad travel season or a gadget fraud ring can move quarterly loss ratios by several points), competition from Kovr and carrier-direct APIs, and the execution risk of nearly doubling headcount from 84 to 134 by the end of 2027.

## Use of proceeds

45% engineering and product, 25% go-to-market, 20% claims automation and carrier integrations, 10% working capital. We expect the Series B to fund the company through profitability in 2028 in the base case.

## Prior financing

Series A of $18.0M at a $95.0M post-money valuation, closed June 14, 2024, led by Cloudmont Ventures. Original issue price $4.12 per share.
</doc>

<doc id="overview-pitch-deck" title="Series B Pitch Deck">
# Series B Pitch Deck

Probably Covered Inc. Tagline: "Insurance for the things you forgot to insure."

## 1. Problem

Insurance is still sold the way it was sold in 1995: a separate purchase, a separate form, a separate carrier relationship. Marketplaces, travel platforms, and fintech apps know exactly when a customer is exposed (a trip is booked, a laptop ships, a driver goes online) but have no practical way to offer coverage at that moment. Building a licensed insurance program from scratch takes 18 to 24 months and a dedicated compliance team. Most platforms never try.

The result is a coverage gap. Travelers buy no trip protection. Shippers absorb losses. Gig workers drive uninsured between rides. The platforms lose a high-margin revenue line and their customers carry risk they did not choose.

## 2. Product

Probably Covered is embedded insurance infrastructure. One API lets a platform quote, bind, and service insurance inside its own checkout. We handle quoting, policy issuance, claims automation, and carrier capacity. The partner handles the button.

Lines of business today: travel (trip cancellation, delay, baggage), gadget protection, shipping, and gig-worker coverage. Parametric flight-delay coverage ships in Q3 2026.

Our claims engine pays 71% of claims straight through with no human touch. Median claim payout time is 41 hours.

## 3. Traction (as of September 30, 2026)

- 14 signed distribution partners, including Yuber, Bookish.com, eBuy, Shopifly, Gigglr, Nomadic Air, and Rentmate.
- 6 carrier partners providing capacity, led by Alpha Mutual.
- 2025 gross written premium (GWP) of $212.0M and net revenue of $41.6M.
- 3.41 million policies issued in 2025. 1.62 million policies issued in Q3 2026 alone.
- Blended attach rate of 11.4% across partner checkouts in Q3 2026.
- Net revenue retention of 131%.
- 2025 loss ratio of 54%.

## 4. Market

Embedded insurance is the fastest-growing distribution channel in property and casualty. We estimate a $1.1T global embedded insurance GWP opportunity by 2030, concentrated in travel, e-commerce, mobility, and gig platforms. The US is the largest single market and the only market where we currently sell new business. Our Dublin entity opens the EU to existing partners starting in 2026.

## 5. Business model

We earn a take rate on GWP plus a platform fee on the larger tiers. Current pricing is Starter ($0 platform fee, 20% take rate), Growth ($4,000 per month plus 18% take rate), and Enterprise ($25,000 per month plus 15% take rate). Blended take rate in the model is 17.4%. Full pricing detail lives in the Product Overview.

## 6. Plan

| Line | 2025A | 2026E | 2027E | 2028E |
|---|---|---|---|---|
| GWP ($M) | 212.0 | 348.0 | 572.0 | 905.0 |
| Net revenue ($M) | 41.6 | 68.0 | 112.0 | 176.0 |
| Gross margin | 71% | 73% | 75% | 76% |
| Net income ($M) | (18.4) | (21.9) | (14.0) | 5.8 |

The base case reaches profitability in 2028 with $176.0M of net revenue.

## 7. Team

Founded March 2021 in Austin, TX by Dana Okafor (CEO, previously ran embedded payments at a large marketplace) and Luis Ferreira (CTO, previously built claims systems at a top-10 carrier). 84 FTEs as of September 30, 2026, with 39 in engineering and data (46%). Second office in Dublin, Ireland.

## 8. The ask

We are raising a $40.0M Series B at a $320.0M pre-money valuation ($360.0M post-money). The lead investor is in diligence.

Use of funds:

- 45% engineering and product
- 25% go-to-market
- 20% claims automation and carrier integrations
- 10% working capital

Our last round was an $18.0M Series A at a $95.0M post-money valuation, closed June 14, 2024, led by Cloudmont Ventures.
</doc>

# Section: Acquisition

<doc id="acquisition-overview" title="Go-to-Market Overview">
# Go-to-Market Overview

Probably Covered sells to platforms, not to consumers. A "customer" for us is a distribution partner: a marketplace, travel platform, fintech app, or gig company that integrates our API and offers insurance at its own checkout. The end policyholder is the partner's user. This document describes how we win partners.

## Channels

We acquire partners through three channels.

### 1. Direct enterprise sales

A team of six account executives, supported by two sales engineers, targets platforms with more than 500,000 monthly transactions. These are the deals that become Growth and Enterprise tier accounts. Typical entry point is a head of payments or head of product. Yuber, Bookish.com, and eBuy all came through direct sales.

### 2. Partnerships team

Three people work with payment processors, checkout providers, and vertical SaaS platforms that can introduce us to many SMB storefronts at once. The Shopifly pilot came through this channel. The partnerships team also manages the relationship side of our six carrier partners.

### 3. Inbound from API documentation

Our public API documentation and sandbox generate a steady flow of developer-led inbound. Most of these are small platforms that start on the Starter tier (no platform fee, 20% take rate). The Q4 2026 self-serve Starter tier is designed to let these partners onboard without a sales conversation.

## Sales cycle

The median sales cycle for a signed partner is 4.5 months from first qualified conversation to signed agreement. Enterprise deals with a carrier-specific program (for example, Yuber's gig-worker line, which needed a dedicated Alpha Mutual filing) run longer, up to nine months. Inbound Starter deals close in under a month.

After signature, technical integration takes four to eight weeks. Partners go live in a single state or product line first and expand from there.

## Pipeline (as of September 30, 2026)

- 14 signed distribution partners.
- 22 partners in negotiation.
- 9 of those 22 are at contract stage, meaning a term sheet or agreement is in redline.
- Target for year end 2026: 20 signed partners.

The pipeline skews toward travel and e-commerce. Two of the nine contract-stage deals are regional airlines, following the Nomadic Air signing.

## Unit economics (Q3 2026)

- Customer acquisition cost (CAC) per distribution partner: $38,000. This includes sales and partnerships compensation, sales engineering time, and allocated marketing spend, divided by partners signed in the trailing four quarters.
- CAC payback: 7.2 months on contribution margin.
- Net revenue retention: 131%. Partners grow by adding product lines, geographies, and by improving attach rate after launch.

## What drives attach rate

Attach rate (the share of partner checkouts that buy a policy) is the single most important post-sale metric. Blended attach rate was 11.4% in Q3 2026. It ranges from 19.8% at Yuber, where coverage is presented as a default-on option for drivers, to 7.6% at eBuy, where it is an optional add-on on a crowded checkout page. Our solutions team runs placement and copy experiments with each partner during the first 90 days after launch; the median partner improves attach rate by three to four points in that window.

## Go-to-market investment from the Series B

25% of Series B proceeds are allocated to go-to-market. The plan adds four account executives, two partnerships managers, and a two-person developer relations team to support the self-serve tier. Open roles as of September 30, 2026 include two sales positions.
</doc>

<doc id="acquisition-partners" title="Distribution and Carrier Partners">
# Distribution and Carrier Partners

As of September 30, 2026. Attach rate means the share of a partner's eligible checkouts that result in a purchased policy.

## Distribution partners

Probably Covered has 14 signed distribution partners. Seven are named below. The remaining 7 are mid-market platforms that have asked not to be named in diligence materials; their identities are available under NDA.

| Partner | Vertical | Lines of business | Status | Attach rate (Q3 2026) |
|---|---|---|---|---|
| Yuber | Ride-hailing | Gig-worker coverage | Live since Q2 2025 | 19.8% |
| Bookish.com | Travel | Trip cancellation, delay, baggage | Live since Q4 2024 | 9.1% |
| eBuy | Marketplace | Shipping, gadget protection | Live since Q1 2026 | 7.6% |
| Shopifly | SMB storefronts | Shipping, gadget protection | Pilot | n/a |
| Gigglr | Gig marketplace | Gig-worker coverage | Signed, integration in progress | n/a |
| Nomadic Air | Regional airline | Trip cancellation, flight delay | Signed, integration in progress | n/a |
| Rentmate | Equipment rental | Damage protection | Signed, integration in progress | n/a |
| 7 unnamed mid-market platforms | Mixed | Mixed | Mixed | n/a |

Blended attach rate across all live partners: 11.4%.

### Concentration

Yuber accounts for 34% of gross written premium (GWP). The next two largest partners, Bookish.com and eBuy, together account for roughly another third. Yuber holds US exclusivity for gig-worker coverage under its distribution agreement, which runs three years from May 1, 2025 with automatic one-year renewals.

### Policy volume

- 2025: 3.41 million policies issued.
- Q3 2026: 1.62 million policies issued in the quarter.

## Pipeline

22 distribution partners are in negotiation, of which 9 are at contract stage.

## Carrier partners

Six carriers provide underwriting capacity. Probably Covered is not the risk carrier; policies are issued on carrier paper, and we act as the program administrator and managing general agent.

| Carrier | Role | Share of GWP | Lines |
|---|---|---|---|
| Alpha Mutual | Lead carrier | 58% | Gig-worker, travel, shipping |
| Beacon Re | Reinsurance and excess capacity | Undisclosed | Travel, shipping |
| Northgate Specialty | Specialty lines | Undisclosed | Gadget protection |
| Tidewater Insurance Co | Regional travel capacity | Undisclosed | Travel |
| Unnamed carrier 1 | Backup capacity | Undisclosed | Gig-worker |
| Unnamed carrier 2 | EU capacity (Dublin entity) | Undisclosed | Travel |

The Alpha Mutual Carrier Capacity Agreement provides $300M of GWP capacity per year for a two-year term beginning January 1, 2026, with a loss ratio corridor of 45% to 65% and a 12% profit commission payable to Probably Covered when the loss ratio runs below the corridor. The 2025 loss ratio across the whole book was 54%.

## Claims performance

Claims are serviced by PC Claims Services LLC, our Texas subsidiary, on behalf of all carriers.

- Straight-through claims automation rate: 71% (claims paid with no human touch).
- Median claim payout time: 41 hours.
- 2025 loss ratio: 54%.

## Partner economics

Partners earn a revenue share on the take-rate revenue generated by their users. Yuber's share is 25% of take-rate revenue. Other partners' shares range from 10% to 25% depending on tier and exclusivity. Revenue figures in the financial model are shown net of partner revenue share.
</doc>

# Section: Product

<doc id="product-competitive-landscape" title="Competitive Landscape">
# Competitive Landscape

Embedded insurance is a young category. Most of our competition is not another startup; it is the partner deciding not to offer insurance at all, or a carrier offering a slow direct integration. This document covers the named competitors we see in deals and how we position against them.

## Named competitors

### Kovr

Kovr is the closest competitor. Like us, Kovr offers an embedded insurance API for platforms. Kovr is Europe-first, with most of its volume in the UK, Germany, and France, and it entered the US in 2025. Kovr's strongest line is travel. It does not offer gig-worker coverage and its claims process routes most claims to human adjusters. We see Kovr in roughly one in four competitive travel deals. Where we win, it is on claims automation and on having US carrier capacity already in place. Where Kovr wins, it is on EU coverage breadth, which is why the Dublin entity matters.

### Bolt-On Protect

Bolt-On Protect sells gadget protection only, primarily to electronics retailers and marketplaces. It is a focused, well-run business with deep carrier relationships in the gadget line. We compete with Bolt-On Protect at eBuy-style marketplaces. Our pitch is that a marketplace needs shipping, gadget, and eventually other lines from a single integration, and that Bolt-On Protect cannot expand beyond gadgets. Bolt-On Protect's pitch is that specialization produces better loss ratios in gadget claims. In 2025 our gadget-line loss ratio was within two points of what Bolt-On Protect publicly cites.

### Trovr

Trovr is a consumer app that lets individuals buy on-demand coverage for trips and items. It is not a B2B platform and does not sell to the partners we sell to. We include it because investors ask, and because Trovr's consumer brand shows up in partner conversations as evidence that users want on-demand coverage. Trovr is a market signal, not a direct competitor.

### Legacy carriers' direct APIs

Several large carriers now offer their own partner APIs. These are the most common alternative in enterprise deals: the partner's procurement team asks why it should not integrate directly with a carrier. The honest answer is that carrier APIs are single-carrier (no capacity diversification), slow to integrate (six to twelve months in the examples partners have shared with us), and do not include claims automation or a partner dashboard. Partners who start down this path often return to us after the first integration estimate.

## Positioning

Probably Covered is the only player with both gig-worker and travel lines on one API, combined with a 71% straight-through claims rate. In practice this means:

- A platform with more than one risk moment (a gig marketplace that also ships equipment, an airline that also sells baggage protection) integrates once.
- Users get paid in a median of 41 hours, which keeps the partner's support queue clean.
- Six carriers behind one API, so capacity does not depend on a single underwriting appetite.

## Where we are weaker

- EU breadth. Kovr has more EU carrier relationships. The Dublin entity, live since Q2 2026, is our answer, but it will take through 2027 to reach parity.
- Gadget-line depth. Bolt-On Protect has better fraud tooling for high-value electronics.
- Brand. Carriers have brands that policyholders recognize. We are invisible to the end user by design, which is a feature for partners but means we cannot lean on brand trust.

## Competitive win rate

In competitive deals closed in the trailing twelve months to September 30, 2026, we won 9 of 13 where a named competitor was present. Three of the four losses went to a carrier direct API; one went to Kovr for an EU-only travel program.
</doc>

<doc id="product-overview" title="Product Overview">
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
</doc>

<doc id="product-pricing-sheet-2024" title="Pricing Sheet (2024, superseded)">
# Pricing Sheet (2024, superseded)

This pricing sheet was in effect from January 1, 2024 through December 31, 2024. It is superseded by the pricing in the Product Overview, which took effect January 1, 2025. It is kept in the data room for historical reference only.

## 2024 tiers

| Tier | Platform fee | Take rate |
|---|---|---|
| Starter | $0 | 20% |
| Growth | $3,500 per month | 18% |
| Enterprise | $20,000 per month | 15% |

Take rates in both years apply to gross written premium (GWP).

## Notes

- Starter pricing did not change in 2025. Starter remains $0 platform fee with a 20% take rate.
- Growth moved from $3,500 per month to $4,000 per month on January 1, 2025.
- Enterprise moved from $20,000 per month to $25,000 per month on January 1, 2025, and gained custom SLAs.
- Partners signed in 2024 were migrated to 2025 pricing at their first renewal. No partner remains on 2024 pricing as of September 30, 2026.
</doc>

# Section: Finance

<doc id="finance-cap-table" title="Cap Table (September 2026)">
# Cap Table (September 2026)

Fully diluted ownership of Probably Covered Inc. as of September 30, 2026, after the Series A and before the Series B. Reporting currency is US dollars.

## Ownership (fully diluted, post Series A)

| Holder | Fully diluted ownership |
|---|---|
| Founders (Dana Okafor, Luis Ferreira) | 41.2% |
| Series A investors (led by Cloudmont Ventures) | 19.0% |
| Seed investors | 12.3% |
| ESOP pool (12.0%, of which 7.1% granted) | 12.0% |
| Angels | 15.5% |
| Total | 100.0% |

Fully diluted shares outstanding after the Series A: 23,058,252.

## Last round

- Round: Series A.
- Amount raised: $18.0M.
- Closed: June 14, 2024.
- Lead: Cloudmont Ventures.
- Original issue price: $4.12 per share.
- Post-money valuation: $95.0M.

## Valuation basis

The valuation at the last round is calculated from the Series A original issue price and the fully diluted share count:

$4.12 x 23,058,252 shares = $94,999,998, which rounds to $95.0M.

This is the USD post-money valuation and is the figure to use for all valuation references in the data room.

## Legacy reporting fields

The following cells are carried over from the company's internal cap table template and are retained for completeness only.

| Field | Value | Note |
|---|---|---|
| Post-money (USD) | $95.0M | Authoritative |
| Post-money (EUR, Dublin filing) | 87.4M EUR | Converted at the rate used for the Irish subsidiary's 2024 statutory filing. Not a valuation basis. |
| Pre-money (USD) | $77.0M | Series A pre-money |

The EUR figure exists only because Probably Covered Ireland Ltd's statutory filing required a euro-denominated parent valuation. It should not be quoted as the company's valuation.

## Proposed Series B

- Amount: $40.0M.
- Pre-money: $320.0M.
- Post-money: $360.0M.
- Status: lead investor in diligence.

The proposed Series B would increase the ESOP pool to 14.0% fully diluted post-money. Pro forma ownership will be provided once terms are final.

## Option pool

The ESOP pool is 12.0% of fully diluted shares, of which 7.1% has been granted to employees and 4.9% remains available. Grants vest over four years with a one-year cliff. No options have been exercised early. The pool was last refreshed at the Series A.

## Notes

- There are no outstanding convertible notes or SAFEs.
- There are no warrants outstanding.
- All Series A shares carry a 1x non-participating liquidation preference.
- Seed and angel shares were converted into common at the Series A.
</doc>

<doc id="finance-financial-model" title="Financial Model (v12)">
# Financial Model (v12)

This document is a structured extraction of the file financial_model.xlsx, version 12, dated October 2026. The workbook has ten tabs: Cover, P&L, Balance Sheet, Cash Flow, Assumptions, Revenue Build, Headcount, SG&A, KPIs, and Scenarios. For each tab this document gives the purpose, a small table of key values observed, and a narrative. All figures are in US dollars. "A" means actual, "E" means estimate. The fiscal year ends December 31.

The model is a static planning artifact. It cannot be re-run with different inputs from within the data room. Questions that require changing an assumption (for example, doubling the attach rate) require running the live model, which the finance team can do on request.

## Cover

### Purpose

Title page. Identifies the workbook as the Probably Covered Inc. Series B financial model, version 12, prepared by the finance team in October 2026. Lists the tab order and states that all figures are in US dollars in millions unless marked.

### Key values observed

| Item | Value |
|---|---|
| Version | v12 |
| Date | October 2026 |
| Currency | USD, millions unless marked |

### Narrative

No financial data on this tab.

## P&L

### Purpose

Income statement, 2025 actuals through 2028 estimates, with 2026 shown by quarter.

### Key values observed

| Line | 2025A | 2026E | 2027E | 2028E |
|---|---|---|---|---|
| GWP ($M) | 212.0 | 348.0 | 572.0 | 905.0 |
| Net revenue ($M) | 41.6 | 68.0 | 112.0 | 176.0 |
| Gross margin | 71% | 73% | 75% | 76% |
| Opex ($M) | 48.0 | 71.5 | 98.0 | 128.0 |
| Net income ($M) | (18.4) | (21.9) | (14.0) | 5.8 |

2026E quarterly net revenue ($M): Q1 13.9, Q2 15.8, Q3 17.9, Q4 20.4. These sum to 68.0.

### Narrative

2025 net revenue of $41.6M consists of take-rate revenue of $36.9M plus platform fees of $4.7M. Net revenue is shown after partner revenue share. Gross margin expands from 71% in 2025 to 76% in 2028 as claims automation reduces per-policy servicing cost. Opex grows from $48.0M to $128.0M, slower than revenue, so the net loss narrows from $(18.4)M in 2025 to $(14.0)M in 2027 and turns to net income of $5.8M in 2028. Projected 2028 net revenue is $176.0M.

## Balance Sheet

### Purpose

Year-end balance sheet, 2025A through 2028E.

### Key values observed

| Line | 2025A | 2026E | 2027E | 2028E |
|---|---|---|---|---|
| Cash ($M) | 31.2 | 48.6 | 33.1 | 37.4 |
| Premium receivable ($M) | 18.4 | 29.8 | 48.9 | 77.2 |
| Total assets ($M) | 56.3 | 87.9 | 92.4 | 126.0 |
| Premium payable to carriers ($M) | 22.1 | 36.0 | 59.1 | 82.0 |
| Total equity ($M) | 28.7 | 46.8 | 30.3 | 36.1 |

### Narrative

Cash at December 31, 2025 was $31.2M. The 2026E cash balance of $48.6M assumes the $40.0M Series B closes in Q4 2026. Premium receivable and premium payable to carriers grow with GWP; these are pass-through balances because policies are written on carrier paper. Equity moves with net income each year plus the Series B proceeds in 2026.

## Cash Flow

### Purpose

Annual cash flow, 2025A through 2028E.

### Key values observed

| Line | 2025A | 2026E | 2027E | 2028E |
|---|---|---|---|---|
| Operating cash flow ($M) | (15.9) | (19.1) | (12.3) | 7.1 |
| Investing cash flow ($M) | (2.3) | (3.5) | (3.2) | (2.8) |
| Financing cash flow ($M) | 0.0 | 40.0 | 0.0 | 0.0 |
| Net change in cash ($M) | (18.2) | 17.4 | (15.5) | 4.3 |
| Ending cash ($M) | 31.2 | 48.6 | 33.1 | 37.4 |

### Narrative

Operating cash burn is smaller than the net loss because of working capital timing on premium collections. The $40.0M Series B is the only financing event in the plan. The low point for cash in the base case is $33.1M at the end of 2027, which gives roughly 18 months of runway at the 2027 burn rate if the 2028 turn to profitability slipped.

## Assumptions

### Purpose

Input drivers for the Revenue Build and P&L tabs.

### Key values observed

| Assumption | 2026E | 2027E | 2028E |
|---|---|---|---|
| Attach rate (monthly input) | 11.0% | 12.5% | 13.5% |
| Blended take rate | 17.4% | 17.4% | 17.4% |
| Average premium per policy ($) | 62 | 62 | 62 |
| Gross margin per policy ($) | 9.10 | 9.60 | 10.00 |

The tab carries a text note that reads: "Attach rate is a monthly input; quarterly policy counts multiply by 3 inside the Revenue Build tab."

### Narrative

Attach rate is the share of partner checkouts that result in a purchased policy. The model enters it as a monthly rate against a monthly checkout volume per partner. Because the Revenue Build tab works in quarters, the monthly policy count is multiplied by 3 to get a quarterly policy count. The x3 is a calendar conversion from months to quarters. It is not a policy duration, a renewal factor, or a sales multiplier. The 2026E attach rate of 11.0% is slightly below the 11.4% actual blended attach rate observed in Q3 2026, which the finance team describes as deliberate conservatism. Blended take rate of 17.4% reflects the tier mix across Starter (20%), Growth (18%), and Enterprise (15%). Average premium is held flat at $62.

## Revenue Build

### Purpose

Bottom-up build of policies, GWP, and net revenue from the Assumptions tab.

### Key values observed

| Line | 2025A | Q1 2026E | Q2 2026E | Q3 2026E | Q4 2026E | 2026E |
|---|---|---|---|---|---|---|
| Monthly checkouts (M) | 2.49 | 3.31 | 3.78 | 4.26 | 4.84 | 4.05 |
| Policies (monthly attach x 3) (M) | 0.85 | 1.09 | 1.25 | 1.41 | 1.60 | 5.35 |
| GWP ($M) | 212.0 | 71.2 | 80.0 | 89.6 | 107.2 | 348.0 |
| Net revenue ($M) | 41.6 | 13.9 | 15.8 | 17.9 | 20.4 | 68.0 |

The 2025A policies figure is the quarterly average; the 2025 full-year total was 3.41 million policies.

### Narrative

The row labeled "Policies (monthly attach x 3)" takes monthly checkouts times the monthly attach rate from the Assumptions tab, then multiplies by 3 to produce a quarterly policy count. Quarterly GWP is policies times average premium with a small mix adjustment. Net revenue is GWP times blended take rate, less partner revenue share, plus platform fees. The Q3 2026E policy count of 1.41 million is below the 1.62 million actual, which is the main source of the beat against plan in Q3 2026.

## Headcount

### Purpose

Year-end headcount by function.

### Key values observed

| Function | 2025A | 2026E | 2027E | 2028E |
|---|---|---|---|---|
| Engineering and data | 33 | 45 | 63 | 80 |
| Go-to-market | 15 | 21 | 30 | 38 |
| Claims and operations | 13 | 17 | 24 | 30 |
| G&A | 10 | 13 | 17 | 22 |
| Total | 71 | 96 | 134 | 170 |

### Narrative

Headcount at December 31, 2025 was 71. The company had 84 FTEs on September 30, 2026 and plans to end 2026 at 96, reaching 134 at the end of 2027 and 170 at the end of 2028. Engineering and data remains the largest function at roughly 46% to 47% throughout.

## SG&A

### Purpose

Operating expense by category, 2025A through 2028E.

### Key values observed

| Category ($M) | 2025A | 2026E | 2027E | 2028E |
|---|---|---|---|---|
| Compensation | 31.6 | 47.8 | 66.9 | 88.4 |
| Sales and marketing (non-comp) | 5.1 | 8.2 | 11.6 | 15.4 |
| Technology and hosting | 4.9 | 6.8 | 9.1 | 11.9 |
| Other G&A | 6.4 | 8.7 | 10.4 | 12.3 |
| Total opex | 48.0 | 71.5 | 98.0 | 128.0 |

### Narrative

Compensation is roughly two thirds of opex throughout. Non-comp sales and marketing includes the CAC components that feed the $38,000 CAC per partner figure on the KPIs tab.

## KPIs

### Purpose

Summary metrics tab that the board and investors reference. Values are linked from other tabs.

### Key values observed

| KPI | Value | Period |
|---|---|---|
| Q4 2026E net revenue ($M) | 20.4 | Q4 2026E |
| 2027E gross margin | 75% | FY2027E |
| Net revenue retention | 131% | Q3 2026 |
| CAC payback (months) | 7.2 | Q3 2026 |
| CAC per distribution partner ($) | 38,000 | Q3 2026 |
| Blended attach rate | 11.4% | Q3 2026 |
| Gross margin per policy ($) | 9.10 | Q3 2026 |
| Average policy premium ($) | 62 | Q3 2026 |

### Narrative

Q4 2026E net revenue is 20.4 ($M). Gross margin for 2027E is 75%. Net revenue retention of 131% is measured on partner cohorts from the same quarter one year earlier. CAC payback of 7.2 months is on contribution margin.

## Scenarios

### Purpose

Bear, base, and bull cases for 2028 net revenue, driven by attach rate and partner count.

### Key values observed

| Scenario | 2028E net revenue ($M) | 2028E attach rate | Partners at end of 2028 |
|---|---|---|---|
| Bear | 121.0 | 11.0% | 28 |
| Base | 176.0 | 13.5% | 38 |
| Bull | 241.0 | 15.5% | 46 |

### Narrative

The base case is the plan presented throughout the data room. The bear case holds attach rate flat at the 2026 level and slows partner signings. The bull case assumes the self-serve Starter tier accelerates partner count and that parametric products lift attach rate. Any scenario outside these three requires running the live model.
</doc>

<doc id="finance-kpis" title="Key Metrics (Q3 2026)">
# Key Metrics (Q3 2026)

Operating metrics for Probably Covered Inc. for the quarter ended September 30, 2026. Dollar figures in US dollars.

## Scale

| Metric | Value |
|---|---|
| Signed distribution partners | 14 |
| Carrier partners | 6 |
| Policies issued in Q3 2026 | 1.62 million |
| Policies issued in 2025 (full year) | 3.41 million |
| 2025 gross written premium | $212.0M |
| 2025 net revenue | $41.6M |

## Unit economics

| Metric | Value |
|---|---|
| CAC per distribution partner | $38,000 |
| CAC payback | 7.2 months |
| Net revenue retention (NRR) | 131% |
| Average policy premium | $62 |
| Gross margin per policy | $9.10 |

Net revenue retention is 131%. It is calculated as the net revenue in Q3 2026 from partners that were live in Q3 2025, divided by those same partners' net revenue in Q3 2025. Expansion comes from attach rate improvement, new lines of business, and new geographies. There was no partner churn in the period.

CAC per distribution partner of $38,000 is fully loaded: sales and partnerships compensation, sales engineering, and allocated marketing, divided by partners signed in the trailing four quarters. Payback of 7.2 months is on contribution margin (net revenue less variable servicing cost).

## Attach rates

| Partner | Attach rate |
|---|---|
| Blended (all live partners) | 11.4% |
| Yuber | 19.8% |
| Bookish.com | 9.1% |
| eBuy | 7.6% |

Attach rate is the share of eligible partner checkouts that result in a purchased policy.

## Claims

| Metric | Value |
|---|---|
| 2025 loss ratio | 54% |
| Straight-through claims rate | 71% |
| Median claim payout time | 41 hours |

Straight-through rate means the share of claims adjudicated and paid with no human touch. It rose from 63% at the end of 2025 to 71% in Q3 2026 following the release of claims automation v2.

## Financial

| Metric | Value |
|---|---|
| 2025 gross margin | 71% |
| 2026E net revenue (plan) | $68.0M |
| Q3 2026E net revenue (plan) | $17.9M |
| Cash at December 31, 2025 | $31.2M |

## Team (as of September 30, 2026)

Probably Covered has 84 full-time employees. Engineering and data is the largest function.

| Function | FTEs | Share |
|---|---|---|
| Engineering and data | 39 | 46% |
| Go-to-market | 18 | 21% |
| Claims and operations | 15 | 18% |
| G&A | 12 | 14% |
| Total | 84 | 100% |

Open roles: 11 (7 engineering, 2 sales, 1 claims, 1 finance). Year-end 2026 headcount target is 96.

## Concentration

| Metric | Value |
|---|---|
| Largest partner (Yuber) share of GWP | 34% |
| Largest carrier (Alpha Mutual) share of GWP | 58% |

## Pipeline

22 distribution partners in negotiation, 9 at contract stage. Year-end 2026 target is 20 signed partners.
</doc>
