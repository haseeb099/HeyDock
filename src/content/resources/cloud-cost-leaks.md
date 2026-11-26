---
title: "Cloud Cost Leaks Mid-Market Firms Miss | HeyDock"
h1: "Cloud cost leaks mid-market firms often miss"
description: "Common ways UK mid-market cloud bills grow: abandoned experiments, untagged spend, over-sized environments and 'temporary' resources that were never temporary."
summary: "Look for abandoned, untagged and over-sized resources before you negotiate a bigger discount."
keywords: "cloud cost leaks, unused AWS resources, Azure spend waste, mid-market FinOps"
date: "2026-11-26"
relatedServices:
- "finops-cloud-cost"
- "cloud-management-support"
- "it-cost-optimisation"
order: 4
faqs:
- q: "Is a reserved discount the first step?"
  a: "Not if you cannot see what is running. Buying a reservation for waste locks the waste in."
- q: "Can we delete idle resources immediately?"
  a: "Only after you know what they are for. Ask, then retire, with a record."
---

## See the estate before you buy a larger discount

Cloud bills in mid-market UK firms often grow in undramatic ways. An experiment from last year is still running. A development environment is sized like production, and is on all night. Logs are shipped to a store nobody reads. A proof-of-concept database has the same backup policy as a finance system, and none of it is tagged with an owner.

A bigger reserved discount will not fix that. It may make the waste cheaper and harder to question.

Start with a picture finance and engineering can both read. Group spend by product, environment and owner, and mark what cannot be attributed. Unattributed spend is a leak of a different kind: it is spend nobody can be asked about.

Then look for the boring orphans: unattached storage, unused IP addresses, forgotten test accounts, snapshots from a migration that finished. Each one is small. Together they are a line on the bill.

Over-sizing is next. It is reasonable to be cautious at go-live. It is less reasonable to still be cautious two years later with no review. Rightsizing should be approved, because turning something down can affect service.

Finally, give the picture an owner and a review date, or the same leaks will return. Our FinOps page describes how we do that work, without a promised percentage.
