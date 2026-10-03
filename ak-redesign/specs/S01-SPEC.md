---
id: S01-SPEC
type: SPEC
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: DRAFT (auth modal display components only; landing / setup later per D-017)
date: 2026-10-03
---

# S01 — First visit & join — auth modal part — spec

**NOTES = prototype-v2** `specs/S02-refs/prototype-v2/packages/auth-ui/` (source = structure + motion; `screens/login-modal-*`, `signup-modal-*` = visual truth). It wins over `prototype/` for login/sign-up. Scope here is the **login / sign-up modal only**, as display components (D-016). `/landing`, `/signin` page and `/setup` come later ("S01 front door later", D-017). D-009 holds: sign-up is open, no gate UI.

## 1. Components (`apps/forum/src/components/auth/`, no auth calls, no Convex)

| File | Export | v2 source | Props |
|---|---|---|---|
| `auth-display-types.ts` | types | `types.ts` | `AuthMode`, `AuthSocialProvider` (google, github, facebook = `convex/auth.ts`), `LoginValues`, `SignupValues`, `EmailVerification`, `EmailVerifyState` |
| `auth-modal-view.tsx` | `AuthModalView` | `auth-modal.tsx` | `open`, `onOpenChange`, `mode`, `onModeChange`, `submitting`, `error`, `notice?`, `onLogin`, `onSignup`, `socialProviders`, `onSocial`, `onForgotPassword?`, `showRememberMe?`, `emailVerification?`, `termsHref?`, `privacyHref?`, `defaultLoginValues?`, `defaultSignupValues?` |
| `auth-login-form.tsx` | `AuthLoginForm` | `login-form.tsx` | `submitting`, `error`, `onSubmit`, `onSwitchToSignup`, `onForgotPassword?`, `showRememberMe?`, `defaultValues?` |
| `auth-signup-form.tsx` | `AuthSignupForm` | `signup-form.tsx` | `submitting`, `error`, `onSubmit`, `onSwitchToLogin`, `emailVerification?`, `termsHref?`, `privacyHref?`, `defaultValues?` |
| `auth-social-buttons.tsx` | `AuthSocialButtons` | `social-login-buttons.tsx` | `providers`, `onSelect`, `disabled?` |
| `auth-field.tsx` | `AuthField`, `AuthBadge` | `ui/input.tsx` + field markup | label, error, tone, adornment, `revealable` |
| `auth-parts.tsx` | `AuthSubmitButton`, `AuthErrorBanner`, `AuthCheckbox`, `AuthSwitchLine` | `ui/button.tsx` + form parts | — |

Field values and client-side checks (email shape, 8+ chars, match, terms) are local UI state inside the forms, as in v2. Everything the server decides (`submitting`, `error`, verification state) comes in through props. The live modal (`packages/auth-ui`) is untouched. GLM swaps it for these when wiring.

## 2. Layout

- **1440:** centred panel `min(560px, 94vw)`, `--radius-modal-auth` (20 px), over a subtle glass backdrop. The form column, divider and providers are 3/4 width (v2).
- **390:** panel `94vw`, scrolls inside `100dvh − 2rem` (v2's panel runs off-screen at 390). The form column is **full width** (v2's 3/4 truncates placeholders at 390, see its screenshot). Hit targets ≥ 44 px below `sm`: fields, buttons, tabs, close, checkbox rows, code boxes.
- Open focus goes to the dialog itself, not to the close button or a field, so phones don't pop the keyboard. Tab reaches the first control.

## 3. Both themes / tokens

Tokens and S00 utilities only. **Token extension (STYLE-KIT §2.5a, tokens.css, in sync):** `--social-google`, `--social-github`, `--social-facebook`, the provider identity colours v2 uses for the GitHub/Facebook icons and the per-provider hover tint. The Google "G" keeps its own artwork.

Mappings:

- v2's `bg-canvas/68 + blur-md` backdrop becomes `.glass-chrome` (glass layer 1 of max 2).
- The panel is `bg-surface/92` with no second blur.
- The brand pill shadow and the primary button's dark glow become `.glow-active` / `.glow-cta`.
- v2's orange/yellow strength steps have no token, so Fair and Good both use `--feedback-warning`, and "Yet to match" uses warning.
- White text on brand: `--text-inverse` in light, `--text-primary` in dark, because `--text-inverse` is near-black in dark.

Evidence: `specs/S01-evidence/` (`auth-*`, `compare-*` = ours | v2), all < 500 KB.

## 4. Motion — "a blink with a reason"

**RM** = `prefers-reduced-motion`. **FLAG** = no clear purpose, or a conflict. Listed for a founder call, never dropped silently.

| # | Interaction | Purpose | RM | Status |
|---|---|---|---|---|
| 1 | Panel pop-in 360 ms / pop-out 320 ms (`auth-modal-content`) | Guides focus to a blocking decision (S00 §7 modal pop) | none | ported (existing utility) |
| 2 | Backdrop fade 320 / 300 ms | Guides: the page is behind | none | ported |
| 3 | Login ↔ Sign up pill slides 300 ms (+ `.glow-active`, dark) | Guides: you are here | instant | ported |
| 4 | Form column scales to 1.02 in sign-up mode | weak (marks the mode change) | instant | ported (sm+ only) · **FLAG** |
| 5 | Field focus: border → brand/50 + 2 px brand ring | Guides: where you're typing | — | ported |
| 6 | Field tone recolour (strength / match / verified) | Confirms input quality as you type | — | ported |
| 7 | Strength / match / verified badges recolour 200 ms | Confirms | — | ported |
| 8 | Password reveal toggle | Confirms what was typed | — | ported |
| 9 | Email ↔ code layers cross-fade + 4 px slide, 300 ms | Guides: the code step replaced the email field | instant | ported |
| 10 | Code boxes: auto-advance, backspace-back, paste fill, auto-submit on 6th digit; focus first box after 150 ms | Guides | — | ported |
| 11 | Filled code box: brand border + ring + soft brand glow | Confirms the digit landed | — | ported (glow → `.glow-active`, dark only) |
| 12 | Wrong code: row shakes 400 ms | Confirms "that didn't work" | off | ported |
| 13 | Submit spinner + "Signing in…" / "Creating account…" | Signals live: request in flight | spinner static | ported |
| 14 | Primary press scale 0.97 | Confirms the tap | — | ported |
| 15 | Provider buttons lift 1 px on hover + per-provider border/text tint | Guides: which provider you're about to use | no lift | ported |
| 16 | Provider hover **coloured glow** (ring + 18 px shadow) and icon **drop-shadow glow** | none beyond #15 | — | **not ported · FLAG** D-007 #1 (glow only CTA / active / focus / celebrate) |
| 17 | Close / switch-link / forgot-link hover colour | Confirms | — | ported |

## 5. GAP list — what v2 shows that MVP 1 data or scope can't support

Rendered from fixtures in `/lab/auth` only.

**NEEDS DATA (wiring, no CR):** nothing new on the backend side. Password sign-in/sign-up and Google / GitHub / Facebook exist in `convex/auth.ts` (`packages/auth-ui/app-auth-provider.tsx` already calls `signIn("password" | provider)`). Server errors arrive as `error` copy that the wiring maps through a label map (COPY-1).

**SCOPE (founder call):**
1. **Email code before sign-up** (v2 inline "Verify" → 6-digit code → "Verified"; v2 fakes it with `123456`). `convex/auth.ts` has an Email provider (magic-link/token), but no "verify ownership before Password sign-up" flow exists. The component supports it via `emailVerification`; absent means no step. Decide: build it (backend CR) or drop it.
2. **"Remember me":** Convex Auth sessions have no remember-me switch. Hidden unless `showRememberMe`.
3. **"Forgot password?":** no reset flow is configured (Password provider without `reset`). v2's fallback copy "Password reset is not enabled yet. Contact support…" breaks COPY-1 and is **not ported**. The link renders only if `onForgotPassword` is passed.
4. **Terms / Privacy:** v2 renders them as plain text. They render as links when `termsHref` / `privacyHref` are passed (`/terms`, `/privacy` exist; legal copy is founder-owned).
5. **Full name** field: maps to `users.displayName`. Confirm at wiring whether sign-up writes it (today `/setup` collects identity).
6. **Provider set:** v2 shows all three. Production should pass only the providers configured on the deployment.
7. **v2 `authEnvironmentNote` banner:** supported as `notice`. Its wording must follow COPY-1 (no infra names), so it is not ported verbatim.
8. **D-009 positioning** ("AI personas visible as the hook"): not in the modal. It belongs to the S01 landing, later.

## 6. Lab

`/lab/auth` (dev-only, 404 in production) shows the modal over the lab feed, as in v2's screenshots. Params: `mode=login|signup`, `theme=dark|light`, `state=error|loading` (prefilled), `verify=0` (no email-code step), `toolbar=0`. The lab's code step accepts `123456` (fixture only). Submits simulate a round-trip and then show the fixture error.

## 7. Not reproduced faithfully

- §4 #16 not ported.
- Full-width form column and in-panel scroll at 390 (§2).
- Title is 24 px below `sm` (v2 28 px; no 28 px token), 30 px from `sm`.
- Close button 44 px hit area below `sm`.
- Focus on open (§2).
- Fair/Good share one tone (§3).
- Fonts: VM screenshots use a fallback face (the proxy blocks web fonts).

## 8. Handoff

Branch `s01-auth-ui` (from `s02-feed-ui`). Founder decides §5 SCOPE items. GLM wires `AuthModalView` into the app's auth provider (replacing `packages/auth-ui/auth-modal.tsx` usage) with a server-error label map. Grok reviews. Opus pushes again only when asked, after pulling.
