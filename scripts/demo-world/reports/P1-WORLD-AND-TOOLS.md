# DEMO-WORLD — P1: The world and the facts (GATE P1)

- **Date:** 2026-10-04 · **Builder:** GLM (zcode) · **Driver:** local (addendum A2) — 0 LLM API calls, 0 images
- **Artifacts (cache, not in git):** `.demo-world-cache/p1/world.json`, `tools.json`, `events-*.json`, `batches/*.json`
- **Validation:** `node scripts/demo-world/validate.mjs .demo-world-cache/p1` → PASS (weights sum 1.000; 100 unique slugs; niche spread exactly 25/20/15/10/15/15; 27 of 29 calendar entries anchored to sourced real events; 59 full / 41 partial / 0 unverified tools)
- **Prompts (committed, driver-agnostic):** `scripts/demo-world/prompts/world-architect.md`, `fact-keeper.md`

## 1. World — niches, weights, topics

| Niche | Weight | Topics | Recurring debate angles (≥1 per niche) |
|---|---|---|---|
| video | 25% | 13 | **Which text-to-video model is actually usable for client work** — photoreal frontrunners vs affordable workhorses — no consensus<br>**AI avatar presenters and faceless channel economics** — faceless AI channels vs showing your real face — recurring fight<br>**Auto-editing tools vs manual craft in the timeline** — editors who refuse AI cuts vs those who ship 10x faster<br>**Platform rules and disclosure for AI-generated video** — should platforms label AI video by default — hot argument |
| writing | 20% | 12 | **SEO when AI answers replace clicks** — is written-for-Google content dead — unresolved<br>**Co-writing fiction with AI tools** — is AI-assisted fiction 'real' writing — the eternal forum war<br>**AI detectors and false positives for honest writers** — detectors punish non-native speakers — recurring controversy |
| design | 15% | 11 | **Template suite speed vs bespoke design craft** — Canva-speed vs designer-craft — class war of the niche<br>**Licensing and commercial use of generated assets** — indemnified outputs vs open models — legal risk argument |
| audio | 10% | 9 | **AI music for videos and podcasts** — licensed AI music vs library music vs human composers<br>**Music licensing rules for monetised content** — what counts as safe music in 2026 — constantly relitigated |
| automation | 15% | 11 | **No-code platforms vs code-first automation** — n8n self-hosters vs SaaS payers — identity-defining split<br>**Scraping and lead-gen agents: power and ethics** — outbound agents — growth hack or spam machine |
| monetisation | 15% | 11 | **Courses vs cohorts vs communities** — evergreen course vs live cohort — margin vs energy<br>**Sponsorships when AI content floods feeds** — does human-made content command a premium — core debate<br>**Owned platforms vs algorithmic reach** — email list purists vs short-form reach maximizers |

Full topic lists (67 topics, all evergreen, slugs stable for P3 planning) are in `world.json`.

**Rhythm:** weekday multiplier 1.0, weekend 0.55 (weekends quieter), two quiet stretches (late-summer lull ~offset −57 for 4 days; pre-September dip ~−36 for 3 days), spikes derived from calendar intensity. All times are offsets from world end — never absolute (re-anchoring design, P0 report §H).

## 2. The 60-day calendar (world end reference 2026-10-04)

Every dated entry that states a fact carries a source. Evergreen/community beats carry none by design.

| ≈ Day (offset → date) | Niche | Kind | Event | Intensity | Source |
|---|---|---|---|---|---|
| -55 → 2026-08-10 | audio | pricing | Suno download caps + ToS update announced (effective Sep 3) | 1.4 | [link](https://suno.com) |
| -53 → 2026-08-12 | audio | policy | Suno x BMG global licensing partnership | 1.3 | [link](https://help.suno.com) |
| -53 → 2026-08-12 | automation | other | Lovable raises $400M Series C at $13.3B | 1.2 | [link](https://lovable.dev/blog/series-c) |
| -46 → 2026-08-19 | automation | launch | Cursor ships Cloud Agents + agent harness updates | 1.3 | [link](https://www.cursor.com/changelog) |
| -45 → 2026-08-20 | monetisation | launch | Patreon launches 30 creator features (Clips, discovery, Niches) | 1.5 | [link](https://techcrunch.com/2026/08/20/patreon-launches-30-new-creator-features-including-short-form-clips-and-revamped-discovery/) |
| -40 → 2026-08-25 | monetisation | other | Acast x Kit partnership: podcasts + newsletters crossover | 1.1 | [link](https://www.acast.com/en/press-room/acast-and-kit-partner-to-fuel-creator-expansion-across-podcasts-and-newsletters) |
| -38 → 2026-08-27 | writing | launch | Google Workspace drop: Gemini quiz gen, Meet notes, Studio skills | 1.1 | [link](https://workspace.google.com/blog/product-announcements/august-2026-workspace-feature-drop) |
| -34 → 2026-08-31 | video | launch | Runway announces Solaris 'Interface World Model' research preview | 1.4 | [link](https://runway.com/research) |
| -33 → 2026-09-01 | design | launch | Figma expands generative plugins + shaders on canvas | 1.3 | [link](https://www.figma.com) |
| -31 → 2026-09-03 | writing | launch | OpenAI debuts GPT-6 Astra (staged ChatGPT rollout) | 1.6 | [link](https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/) |
| -26 → 2026-09-08 | video | launch | Adobe AI innovations for Premiere/AE ahead of IBC | 1.2 | [link](https://blog.adobe.com) |
| -26 → 2026-09-08 | audio | policy | Suno x Believe/TuneCore partnership | 1.1 | [link](https://suno.com) |
| -25 → 2026-09-09 | audio | launch | Suno v6 launches (licensed catalogs, old models retiring) | 1.6 | [link](https://suno.com/pricing) |
| -24 → 2026-09-10 | audio | policy | UMG x ElevenLabs multi-year licensing agreement | 1.5 | [link](https://elevenlabs.io) |
| -24 → 2026-09-10 | automation | launch | Cursor Projects: coordinator agent for long-running work | 1.2 | [link](https://www.cursor.com/changelog) |
| -20 → 2026-09-14 | audio | launch | ElevenLabs Music v2.5 released | 1.2 | [link](https://elevenlabs.io) |
| -19 → 2026-09-15 | video | launch | Synthesia AI Assistant auto-b-roll free on all plans | 1.0 | [link](https://www.synthesia.io) |
| -15 → 2026-09-19 | audio | policy | Suno hit by UMG/Sony ~$9B suit targeting v6 (week of Sep 18) | 1.5 | [link](https://theblitz.com) |
| -12 → 2026-09-22 | writing | pricing | Claude Opus 5.5 (−20% price) + GPT-6 Sol/Luna (~−50% API price) same day | 1.6 | [link](https://www.anthropic.com/news/claude-opus-5-5) |
| -11 → 2026-09-23 | video | launch | Filmora 16 release (camera tracking, 360 reframe) | 1.0 | [link](https://filmora.wondershare.com/whats-new-in-filmora-video-editor.html) |
| -10 → 2026-09-24 | video | shutdown | OpenAI permanently shuts down Sora 2 models + Videos API | 1.7 | [link](https://help.openai.com) |
| -6 → 2026-09-28 | writing | launch | Claude Sonnet 5.5 (30% faster, cheaper per task) | 1.2 | [link](https://www.anthropic.com/news) |
| -6 → 2026-09-28 | audio | launch | Eleven v4 voice model released | 1.2 | [link](https://elevenlabs.io) |
| -4 → 2026-09-30 | audio | other | ElevenLabs valuation doubles to $22B via tender | 1.2 | [link](https://biz.chosun.com) |
| -3 → 2026-10-01 | automation | launch | GitHub Copilot gains computer use | 1.1 | [link](https://github.blog/changelog/) |
| -2 → 2026-10-02 | automation | shutdown | Copilot deprecates four models incl. Claude Opus 4.7 | 1.0 | [link](https://github.blog/changelog/2026-10-02-selected-models-in-github-copilot-deprecated/) |
| -30 → 2026-09-04 | writing | debate | Recurring spike: EU AI Act transparency duties bite for EU-based writers (in force since Aug 2) | 1.2 | [link](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) |
| -57 → 2026-08-08 | all | seasonal | Late-summer lull: audits, tool-stack reviews, planning posts | 0.7 | — |
| -17 → 2026-09-17 | all | community | Community 'show your stack' week (organic, no external trigger) | 1.2 | — |

Anchored: 27 of 29. The two biggest story arcs the crowd will react to across P3–P4: **the Suno licensing whirlwind** (BMG → Believe/TuneCore → v6 launch → UMG/Sony lawsuit, offsets −53…−15) and **the September model-price war** (GPT-6 Astra → Opus 5.5 + Sol/Luna same day → Sonnet 5.5, offsets −31…−6), plus the **Sora shutdown** (−10) as the video niche's shock event.

## 3. The tools — full list (100, web-verified 2026-10-04)

Verification levels: **full** = official pricing page read + corroborating sources; **partial** = structure confirmed, some figures from third-party 2026 sources (official page JS-rendered/bot-blocked) — such rows are marked and P3 authors may not state their exact prices as fact; **none** = 0 rows. Two tools are recorded as **shut down** (Sora, Relay.app) and four as **pivoted** (Copy.ai, Writesonic, BrandWell, Podcastle→Async) — they stay in the sheet as facts and are excluded from member tool-use lists downstream.

| # | Tool | Niche | Category | Pricing model | Pricing (as of 2026-10-04, truncated) | Verified |
|---|---|---|---|---|---|---|
| 1 | Adobe Podcast Enhance Speech | audio | speech enhancement | freemium | Partially verified as of 2026-10-04: core Enhance Speech is free — files up to 30 min, ~500MB upload, with ~1… | partial |
| 2 | Descript | audio | text-based audio/video editing | freemium | As of 2026-10-04 (official pricing page): Free $0 (60 media min/mo, 100 one-time AI credits, watermarked 720p… | full |
| 3 | ElevenLabs | audio | voice synthesis/dubbing | freemium | As of 2026-10-04 (official pricing page): Free $0 (10k credits/mo); Starter $6/mo (30k credits); Creator $22 … | full |
| 4 | Krisp | audio | noise cancellation/transcription | subscription | As of 2026-10-04 (official pricing page): 7-day free trial (no card) then per-user plans — Core $16/mo monthl… | full |
| 5 | Murf AI | audio | AI voiceover | freemium | Partially verified as of 2026-10-04 — official pricing page is JS-rendered and returned no content; figures f… | partial |
| 6 | Podcastle (now Async) | audio | podcast recording/editing platform | freemium | As of 2026-10-04 — official page (async.com/pricing, reached via 308 redirect from podcastle.ai) renders plan… | partial |
| 7 | Riverside | audio | remote recording + AI editing | freemium | As of 2026-10-04 (official pricing page at riverside.com): Free $0 (one-off 2 hrs separate-track recording, 7… | full |
| 8 | Suno | audio | AI music generation | freemium | As of 2026-10-04 (official pricing page): Free $0 (50 credits/day, v6-mini, shared queue, no commercial right… | full |
| 9 | Udio | audio | AI music generation | subscription | Partially verified as of 2026-10-04 — official pricing page renders via JS and returned no numbers. Third-par… | partial |
| 10 | Wondercraft | audio | AI podcast studio | freemium | As of 2026-10-04 (official pricing page): Free $0 (150 credits, limited AI models, 720p exports); Creator $25… | full |
| 11 | Airtable AI | automation | database + AI | freemium | Free $0; Team $20/user/mo annual; Business $45/user/mo annual; Enterprise Scale custom. AI credits metered se… | full |
| 12 | Claude Code | automation | agentic coding CLI | subscription | Included in Claude Pro $20/mo ($17 annual), Max $100/$200/mo (5x/20x usage), Team seats $25/mo (Standard) / $… | full |
| 13 | Cursor | automation | AI code editor | freemium | Hobby free; Individual $20/mo (Pro), $60 (Pro+), $200 (Ultra) with dollar-denominated usage pools + arrears-b… | full |
| 14 | GitHub Copilot | automation | code assistant | freemium | Free $0 (2,000 completions/50 chat); Pro $10/mo ($10 AI credits + $5 flex); Pro+ $39/mo ($39 credits + $31 fl… | full |
| 15 | Gumloop | automation | AI workflow builder | freemium | Partially verified as of 2026-10-04 — official pricing page renders no content to bots. Third-party sources (… | partial |
| 16 | Lindy | automation | AI agents | subscription | As of 2026-10-04 (official pricing page): no permanent free plan — 7-day trial with $50 free credits, no card… | full |
| 17 | Lovable | automation | AI app builder | freemium | Free: 5 daily build credits (cap 30/mo) + 20 Cloud credits/mo; Pro ~$25/mo and Business ~$50/mo (annual ~$21/… | partial |
| 18 | Make | automation | visual automation platform | usage | Partially verified as of 2026-10-04 — official page returned 403 to fetch; from third-party pricing trackers … | partial |
| 19 | n8n | automation | source-available automation platform | freemium | As of 2026-10-04 (official pricing page): Free self-hosted Community Edition; free cloud trial (1,000 executi… | full |
| 20 | Relay.app | automation | workflow automation | unverified | Shut down — plans discontinued. Free users lost access 2026-08-15; paid users lost access 2026-09-14 (dailyai… | full |
| 21 | Relevance AI | automation | AI agent workforce | unverified | As of 2026-10-04 the official pricing page shows only Enterprise (custom, talk-to-sales) — self-serve tiers n… | partial |
| 22 | Replit Agent | automation | app building agent | freemium | Free tier (limited daily credits, ~30h chat Free Mode); Core $20/mo ($18 annual) with $20 towards models; Pro… | full |
| 23 | Retell AI | automation | voice AI agents | usage | Pay-as-you-go, no contracts: $10 free credits; voice agents $0.07-$0.31/min (infra $0.055 + TTS $0.015 + tele… | full |
| 24 | Vapi | automation | voice AI agents | usage | No-cost tier: $5 free credits, $0.05/min platform fee, models at cost (~$82-129/mo example at 1,000 min); Cor… | full |
| 25 | Zapier | automation | no-code automation + AI | usage | As of 2026-10-04 (official pricing page): Free $0 (100 tasks/mo, 2-step Zaps, 400 Agent activities); Pro from… | full |
| 26 | Adobe Express | design | quick-design-suite | freemium | as of 2026-10-04: Free plan (no card, 5GB storage, limited AI); Premium $9.99/mo on annual plan (~250 generat… | partial |
| 27 | Adobe Firefly | design | generative-suite | freemium | as of 2026-10-04 (restructured 2026 plans; official page JS-dynamic): Free; Standard $9.99/mo (2,000 credits)… | partial |
| 28 | Canva (Magic Studio) | design | design-suite | freemium | as of 2026-10-04 (US; sources conflict after successive price rises): Free; Pro ~$18/mo or ~$144-180/yr (aima… | partial |
| 29 | Figma AI | design | collaborative-design | freemium | as of 2026-10-04: seat-based — Starter free; Professional full seat $16/mo (annual, ~3,000 AI credits incl.);… | partial |
| 30 | Framer AI | design | website-builder | freemium | as of 2026-10-04 (official pricing page, yearly billing): Free (500 AI credits, framer.app domain); Basic $10… | full |
| 31 | Google Stitch | design | ui-design | free | as of 2026-10-04: free during Google Labs preview (no paid tier, no card required); reported caps ~350 standa… | full |
| 32 | Ideogram | design | image-generation | freemium | as of 2026-10-04: Free (10 slow credits/week); Plus $20/mo ($180/yr, 1,000 priority credits + unlimited slow)… | full |
| 33 | Krea | design | realtime-image-video-generation | freemium | as of 2026-10-04 (official pricing page): Free (100 compute units/day); Pro $35/mo ($21 annual, 20,000 units/… | full |
| 34 | Leonardo AI | design | image-generation | freemium | as of 2026-10-04: Free (150 fast tokens/day); Apprentice $12/mo (8,500 tokens); Artisan $30/mo (25,000 tokens… | partial |
| 35 | Logo Diffusion | design | logo-brand | freemium | as of 2026-10-04: Free plan (no downloads, no vector export, no commercial rights); paid from ~$24/mo per Sep… | partial |
| 36 | Looka | design | logo-brand | one-time | as of 2026-10-04: Basic $20 one-time (logo only); Premium $65 one-time (full files incl. vector); Brand Kit $… | partial |
| 37 | Midjourney | design | image-generation | subscription | as of 2026-10-04: Basic $10/mo (~3.3 fast GPU hrs); Standard $30/mo (15 fast hrs + unlimited Relax); Pro $60/… | partial |
| 38 | Recraft | design | vector-brand-image-generation | freemium | as of 2026-10-04: Free (images public, no commercial rights); Basic ~$10-12/mo (1,000 credits; raster=1, vect… | partial |
| 39 | Reloom | design | website-sitemap-generation | unverified | unverified — official site reloom.ai returning Cloudflare 521 (origin server down) on 2026-10-04; no Wayback … | partial |
| 40 | Uizard | design | ui-mockups | freemium | as of 2026-10-04 (official pricing page, annual-billing prices only shown): Free (3 AI generations/mo, 2 proj… | full |
| 41 | Beehiiv | monetisation | newsletter platform | freemium | Free up to 2,500 subs; Lite $49/mo (up to 100K subs); Pro $95/mo (up to 250K) — yearly billing, unlimited sen… | full |
| 42 | Etsy | monetisation | marketplace for handmade/vintage/digital goods | marketplace | $0.20 listing fee (per item, renews every 4 months); 6.5% transaction fee on total order incl. shipping; US p… | partial |
| 43 | Fourthwall | monetisation | creator merch, memberships & digital products | freemium | Free $0/mo: 5% fee on digital products (5 GB storage), 5% on memberships, flat catalog fee per POD item (no %… | full |
| 44 | Gumroad | monetisation | digital products marketplace | marketplace | No monthly fee; direct sales 10% + $0.50 per transaction; Discover marketplace sales 30%; payment processing … | full |
| 45 | Kajabi | monetisation | course platform | subscription | Basic $179/mo ($143 annual): 5 products, 2,500 contacts, 0 AI credits; Growth $249/mo ($199): 50 products, 25… | full |
| 46 | Kit (ConvertKit) | monetisation | creator email marketing | freemium | Free up to 10,000 subs (broadcasts, landing pages, sell products); Creator $33/mo ($390/yr) at 1K subs; Pro $… | full |
| 47 | Lemon Squeezy | monetisation | merchant of record for digital products | usage | 5% + 50¢ per transaction, no monthly fees; small extra fees possible on some non-US transactions; volume/cust… | full |
| 48 | Patreon | monetisation | membership platform | usage | Standard 10% platform fee for creators who launched on/after 2025-08-04 (+ processing ~2.9% + $0.30, higher o… | full |
| 49 | Podia | monetisation | courses & digital downloads platform | subscription | Annual-billing prices per official page (2026-10-04): Mover $42/mo ($504/yr) — 100 email subscribers, 5% txn … | partial |
| 50 | Shopify (with Shopify Magic / Sidekick) | monetisation | ecommerce platform with built-in AI | subscription | US (per Feb-Mar 2026 reviews; official page geo-varies): Basic $25/mo monthly or $19/mo annual; Grow $65/$49;… | partial |
| 51 | Stripe | monetisation | payments & billing infrastructure | usage | US standard: 2.9% + 30¢ per successful online card charge, no monthly/setup fees. Add-ons: +1.5% internationa… | full |
| 52 | Substack | monetisation | newsletter platform | usage | Free to publish; 10% of paid-subscription revenue + Stripe processing (~2.9% + $0.30) when monetization is en… | full |
| 53 | Teachable | monetisation | course platform | subscription | Starter $39/mo ($29 annual) — 5 products, 7.5% transaction fee; Builder $89/mo ($69) — 10 products, 0% fee; G… | full |
| 54 | Thinkific | monetisation | course platform | subscription | Basic $54/mo ($40 annual) — unlimited courses, 10K students, 1 community; Start $109/mo ($82) — cohorts, cert… | full |
| 55 | Whop | monetisation | digital products marketplace & seller platform | marketplace | No monthly fee. Direct sales: ~3% platform fee + ~2.7% + 30¢ processing (~5.7% all-in). Discover marketplace … | partial |
| 56 | Adobe Premiere Pro (with Firefly AI) | video | pro-video-editing | subscription | Single app US$22.99/mo (annual billed monthly, 'first year only') / ~$263.88 prepaid annual / US$34.99/mo mon… | full |
| 57 | AutoPod | video | plugin-auto-editing | subscription | Single plan $29/mo per license (30-day free trial on monthly billing) — official site unreachable from our ne… | partial |
| 58 | CapCut | video | video editing | freemium | Free tier (multi-track timeline, keyframes, chroma key, 1080p export) + CapCut Pro $19.99/mo or $179.99/yr (t… | partial |
| 59 | Captions (by Mirage) | video | ai-captioning-editing | subscription | Free (basic tools, no AI credits); Max $24.99/mo (500 credits); Frontier $69.99/mo (1,400); Frontier 2x $139.… | full |
| 60 | D-ID | video | avatar-video | subscription | Free trial (~3 min); Lite from $5.90/mo (~10 min/mo, watermark); Pro ~$29.90/mo monthly (~$16 annual, ~15 min… | partial |
| 61 | Wondershare Filmora | video | consumer-video-editing | freemium | Free (watermark); Basic US$49.99/yr; Advanced US$59.99/yr (1,000 AI credits/mo); Perpetual US$79.99 one-time … | full |
| 62 | Fliki | video | text-to-video | freemium | Free $0 (3 credits ≈5 min/mo, 720p, watermark); Standard 180 credits/mo, ~$28/mo on annual billing; Premium 6… | partial |
| 63 | Google Veo | video | AI video generation | subscription | No standalone pricing; bundled in Google AI plans (official page confirms tier structure; US prices per third… | partial |
| 64 | Hailuo AI (MiniMax) | video | AI video generation | freemium | unverified — official pricing page is client-rendered. Third-party 2026 sources report roughly: free signup c… | partial |
| 65 | HeyGen | video | avatar-video | subscription | Free $0 (3 videos/mo, 1 min max); Creator $29/mo ($24 annual) 600 credits, 1080p; Pro $49/mo 1,000 credits, 4… | full |
| 66 | InVideo AI | video | text-to-video | usage | Seat subscriptions with generation credits (official pricing page 2026-10-04): Basic $9/seat/mo (190 credits,… | full |
| 67 | Klap | video | clip repurposing | subscription | No free plan (1 free trial video, no card). Basic $29/mo ($14/mo billed yearly) 100 clips/mo; Pro $79/mo ($39… | partial |
| 68 | Kling AI | video | AI video generation | freemium | unverified — official pricing page is client-rendered and not machine-readable. Third-party 2025-26 sources r… | partial |
| 69 | Luma Dream Machine | video | AI video generation | subscription | Plus $30/mo ($25 annual) 10,000 credits; Pro $90/mo ($75 annual) 40,000 credits + 4x Agent usage; Ultra $300/… | full |
| 70 | OpenAI Sora | video | AI video generation | unverified | N/A — product discontinued. Formerly bundled into ChatGPT Plus ($20/mo, limited Sora 2) and ChatGPT Pro ($200… | full |
| 71 | Opus Clip | video | long-to-short repurposing | freemium | Free forever (60 processing min/mo, watermarked); Starter $15/mo (150 min); Pro $29/mo (~$14.50/mo annual, 30… | partial |
| 72 | Pika | video | AI video generation | freemium | Free $0 (no credits, watermark-free but no commercial license); Starter $10/mo (900 credits); Creator $35/mo … | full |
| 73 | Recut | video | silence-removal | one-time | $99 one-time perpetual license (no subscription) — official site unreachable from our network at check time; … | partial |
| 74 | Runway | video | AI video generation | freemium | Free (125 one-time credits, 5GB); Standard $12/mo billed annually ($15 monthly) 625 credits/mo; Pro $28/mo an… | full |
| 75 | Submagic | video | captions/subtitles | subscription | No free plan (trial only, no card required). Starter $19/mo ($12 annual) 45 credits/15 videos, 2-min cap; Pro… | full |
| 76 | Synthesia | video | avatar-video | freemium | Basic free (10 min/mo, 9 avatars, watermark, no downloads); Starter $29/mo monthly or $18/mo annual (1,250 cr… | full |
| 77 | Topaz Video AI | video | upscaling/restoration | subscription | Subscription-only since Oct 2025 (perpetual licenses discontinued): Video Personal ~$299/yr; Video Pro ~$699/… | full |
| 78 | Vidnoz AI | video | avatar-video | usage | Free (daily credits, 3-min videos, 720p, watermark); Starter 15 credits/mo (~$13.50-26.99/mo depending on bil… | partial |
| 79 | Vizard | video | clip repurposing | freemium | Free: 60 credits/mo (1 credit = 1 min), 720p watermarked export, 3-day storage (confirmed on official page); … | partial |
| 80 | Wisecut | video | auto-editing | freemium | Free (480p, 3-min exports, 30 min/mo processing); Starter+ $23.25/mo billed annually only ($279/yr, 1080p, 30… | full |
| 81 | Anyword | writing | performance-copy | subscription | As of 2026-10-04 (anyword.com/pricing): Starter $49/mo ($39/mo annual; 1 seat, unlimited words, 1 brand voice… | full |
| 82 | BrandWell | writing | long-form-seo | unverified | unverified — brandwell.ai/pricing is now a 'Request a Custom BrandWell Quote' page for intent data, TrafficID… | partial |
| 83 | ChatGPT | writing | general-llm-writing | freemium | As of 2026-10-04: Free $0 (with 'Sponsored' ads in US since Feb 2026; ~10 msgs/5h cap); Go ~$8/mo (ads); Plus… | partial |
| 84 | Claude | writing | general-llm-writing | freemium | As of 2026-10-04: Free $0 (limited); Pro $20/mo (~$17/mo billed annually); Max $100/mo (5x Pro usage) and $20… | partial |
| 85 | Copy.ai | writing | marketing-copy | subscription | As of 2026-10-04 (copy.ai/pricing): Chat $29/mo ($24/mo annual; 5 seats, unlimited chat words); Growth $1,000… | full |
| 86 | Google Gemini | writing | general-llm-writing | freemium | As of 2026-10-04 (US, corroborated; official page fetched showed INR region): Free $0 (Gemini 3.6 Flash + lim… | full |
| 87 | Grammarly | writing | grammar-style | freemium | As of 2026-10-04: Free $0 (grammar/tone, 100 AI prompts/mo); Pro $12/mo annual ($30 monthly; unlimited sugges… | full |
| 88 | Hypotenuse AI | writing | ecommerce-blog-copy | unverified | unverified — official pricing page (seen 2026-10-04) shows only two custom-quote tiers: Basic (1 seat, <100 p… | partial |
| 89 | Jasper | writing | marketing-copy | subscription | As of 2026-10-04 (jasper.ai/pricing): Pro $69/mo or $59/seat/mo annual (1 seat; 2 Brand Voices, 5 Knowledge a… | full |
| 90 | Lex | writing | long-form-writing-app | freemium | unverified — lex.page/pricing lists Lex Pro and Lex Teams features (premium models incl. GPT 4.1 / Claude 4, … | partial |
| 91 | Microsoft Copilot | writing | office-writing | freemium | As of 2026-10-04 (microsoft.com compare page): Free Copilot (web/Windows, limited); Microsoft 365 Personal $9… | full |
| 92 | NotebookLM | writing | research-notes-source-grounded | freemium | As of 2026-10-04: Free $0 (~50 sources/notebook, 50 chats/day, 3 audio overviews/day); higher limits ('Plus')… | full |
| 93 | Notion AI | writing | docs-writing-assist | subscription | As of 2026-10-04 (notion.com/pricing, per member/mo): Free $0 (AI limited trial); Plus $10 (AI still trial-li… | full |
| 94 | Perplexity | writing | ai-research | freemium | As of 2026-10-04: Free $0 (limited searches); Pro $20/mo or $200/yr (~$16.67/mo); Max $200/mo (highest limits… | partial |
| 95 | ProWritingAid | writing | editing-suite | freemium | As of 2026-10-04 (prowritingaid.com/plans): Free (basic); Premium Monthly $10/mo; Quarterly $20/quarter; Annu… | full |
| 96 | QuillBot | writing | paraphrasing | freemium | As of 2026-10-04 (official page blocked to fetcher; corroborated): Free $0 (paraphrase word limits, basic gra… | partial |
| 97 | Rytr | writing | budget-copywriting | freemium | As of 2026-10-04 (rytr.me/pricing, annual-billing rates): Free $0 (10K characters/mo, 1 language); Unlimited … | full |
| 98 | Sudowrite | writing | fiction-writing | subscription | As of 2026-10-04 (sudowrite.com/pricing, annual billing): Hobby & Student $10/mo (225K credits); Professional… | full |
| 99 | Wordtune | writing | rewriting | freemium | As of 2026-10-04 (wordtune.com/plans): Basic Free $0 (10 rewrites/day, 3 summaries/mo); Advanced $6.99/mo ($4… | full |
| 100 | Writesonic | writing | marketing-copy-seo | subscription | As of 2026-10-04 (writesonic.com/pricing, annual billing): Starter $79/mo (50 prompts/50 answers daily, 15 AI… | full |

Full rows (whatItDoes, 3–5 strengths, 3–5 weaknesses, recentChanges with dates, verifiedAt, sources[]) live in `.demo-world-cache/p1/tools.json`; the final accepted snapshot ships in `seed-data/demo-world/v1/` per spec §2.

**Not included (blocked, by design):** loading the tools into the M5 tool registry — that is `convex/` code and waits on the Grok re-check of the P0 fixes (A5.4). Merge rule recorded for that step: the 8 existing base-seed `demo-*` tools are kept, real tools use canonical slugs, no slug collisions exist (checked), no overwrites.

**GATE P1 deliverables per spec:** niche/topic summary ✓ (§1), the calendar ✓ (§2), the full tool list with pricing + verified status ✓ (§3).

**STOPPED AT GATE P1 — awaiting founder "go" + Grok.**
