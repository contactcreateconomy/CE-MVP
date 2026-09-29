---
id: VISION
type: FOUNDER-VISION
author: Founder (Akilesh), structured by Claude
status: LIVING — founder edits only
date: 2026-09-27
---

# CEY — Product Vision

> **One line:** CEY is the creator cosmos — a Microsoft for creators, with Apple's product design.

This document is the north star. Every spec, design decision, and trade-off in `ak-redesign/` must trace back to it. When a spec conflicts with this document, this document wins, and the conflict goes to the founder.

---

## 1. The thesis

**The shift we're betting on**
- Within ~3 years, at least half of social media content will be AI-generated. Both audiences and brands will struggle with trust and conversion.
- Social marketing will collapse into **influencer marketing**. The 2–3 social giants will fragment into **micro-socials** organised around topics (think Telegram groups, not feeds).
- The creator economy is the next big market to organise. Amazon solved the **product-to-people** pipeline for e-commerce. CEY solves the **people-to-product** pipeline.

**The real product**
- The creators themselves are the product. Everything we give them is free.
- We aggregate and segment creators **by topic**, and gather **evidence of reach and conversion**.
- The output is a **report card of influence**: a measure of a creator's real influence in a topic, beyond subscriber counts and likes. This is what brands actually need, and what AI-flooded platforms can't give them.

**Why the community exists:** discussion + distribution, together. The community is where creators show up, earn trust, and generate the evidence the report card is built on.

---

## 2. The customer: creators

- **The full spectrum:** from someone who wants to create without spending a dime, to someone spending millions a month on creation. CEY is designed for all of them.
- **They are ruthless:** they go wherever a product delivers, and they switch constantly. We have to evolve fast and keep delivering.
- **They come from Reddit, X and Threads.** Their bar for experience is set by those products. If ours is worse, they stay where they are.
- **What they want emotionally:** to feel special. Appreciated, respected, and valued for what they create.

---

## 3. Business model

- **Everything required for creation is free.**
- **We monetise only community functions, only on the creator side, with a minimal premium.**
- **We don't compete on AI.** Taste and distribution are the two things AI can't do for itself. We use AI wherever it helps, and leave distribution to the creators.

---

## 4. Roadmap (as stated by the founder)

| Stage | Name | What it delivers |
|---|---|---|
| **MVP 1** *(now)* | Basics + Affiliate | The community (discussion + distribution) and a free **affiliate marketing suite**. Everything Carrd charges for, free. No custom domains yet (technical reasons); added after funding. |
| **Phase 2** | **Constellation** | E-commerce (Shopify-class) |
| | **Star Ring** | Community products (Skool / Circle.so-class) |
| | **Celesteon** | AI creation, cheapest in the market: billed at plain API cost, with discounts negotiated with providers |
| | Distribution networks | Creators start networks: clusters of people working one network. Signals are the order and the price. |
| **Phase 3** | Evolve | When something trends in tech, CEY builds the creator use case and publishes it inside the ecosystem. |
| **Phase 4** | Brands | Onboarding brands and connecting them to creators: an AdSense / Ads Manager for influence. Heavy backend work. |
| **Phase 5** | Platform | A complete influencer marketing platform, open to others too. |

**Current scope rule:** the redesign covers **MVP 1 only**. It adds polish and the functionality that supports the experience, and **no new features**. Anything needing backend changes goes through a change request with founder approval.

---

## 5. Experience principles

### The one feeling: TRUST
The moment someone sees CEY, they should think: *this is solid, this will evolve, I'll invest my time and build here.* This is why the frontend matters so much. For this audience, the experience *is* the product.

### The Apple way
Foldable phones existed for a decade, but when Apple does it, they do it perfectly: a new OS, new animations, apps built for the device. **Details matter.** We don't ship "working". We ship something better than what's out there.

### Design rules
1. **iOS philosophy:** clean, minimal, simple, and still attractive.
2. **Motion must serve a purpose.** Animation guides, confirms, or delights at a meaningful moment. Never decoration ("not an RGB light").
3. **Mobile-first, app-in-the-browser.** Most users are on phones and there is no native app, so the web must feel like one: one-thumb navigation that feels like iOS, with no website-feel.
4. **Benchmark:** Threads today. The target is Reddit + X + Threads, the one above all of them.

### Make everyone feel special
Retention isn't a growth hack. People come back where they feel special. Human emotions do the work: **appreciation, respect, love.** These must be transferred at the key moments:
- when someone **publishes a post**
- when someone **comments**
- when someone's work is **recognised** by others

Every screen should answer: *how does this make the creator feel valued?*

---

## 6. How to use this document (for every model and spec)

Each spec in `ak-redesign/specs/` must answer:
1. **Trust:** does this screen increase or decrease trust at first glance?
2. **Feel special:** where does the creator feel appreciated on this screen?
3. **Purposeful motion:** what does each animation do for the user?
4. **One thumb:** can the core action be done one-handed on a 390px screen?
5. **Benchmark:** which app does this beat, and on what?
6. **Scope:** is this MVP 1 polish, or a new feature? New features are out of scope.

---

## 7. Open questions (founder to clarify over time)

- **Celesteon:** is it the AI creation product (Phase 2) or the name of the whole ecosystem (Phase 3 mentions "the entire Celesteon Ecosystem")?
- **Distribution networks:** what exactly are "signals", and how do they set order and price?
- **Report card:** which signals inside MVP 1 already feed the future influence score? This should shape what the redesign records and shows.
- **Premium:** which community functions will carry the minimal premium, and when?

---

*"This is 10 years of understanding and working in the market. I believe this will work, so I pursue."* — Founder
