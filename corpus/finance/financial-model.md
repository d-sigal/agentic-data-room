---
slug: finance-financial-model
title: Financial Model (v12)
note: Three-layer extraction of financial_model.xlsx. One section per tab with purpose, key values observed, and narrative. Base case unless stated.
---

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
