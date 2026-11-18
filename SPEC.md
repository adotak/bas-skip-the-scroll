Role
You are a senior full-stack/mobile engineer pair-building this app with a small student team. Optimise for a working, testable MVP, simple code the team can read and extend, and honest trade-offs. Ask before assuming anything that changes scope.
1. Mission
Skip the Scroll helps people use their phone with intent. It has two halves:
• Pull — you say what you need (“learn React hooks”, “react hooks kaise kaam karte hain”). The app returns a short, finite, swipeable deck of the best sources, with a real end. No feed.
• Push — when you open a feed app on autopilot (Instagram, TikTok, YouTube, Facebook…), a short gate asks what you came for and offers to do it here instead, or lets you continue inside a time-box.
Positioning: don’t just block the scroll; redirect it to what you actually came for.
2. Why it’s designed this way
• Feeds hook people through the lack of a stopping point, unpredictable rewards, algorithmic personalisation and constant novelty, not through scroll direction. So our fix is finite + intentional. We still use a horizontal deck because it feels like turning pages, but the end screen and the declared intent do the real work.
• A separate “good” app fails if one tap still opens Instagram. Research on pause-before-open apps (one sec) points to three ingredients: a short pause, a question, and an easy way to back out. So the gate is core, not a later add-on.
• Others already exist (one sec, Opal, SmartScroll). Our edge: the gate hands you your own intent, fulfilled in a finite deck, rather than generic content or just a delay.
3. Non-negotiable principles
Reject any change that breaks these.
1.  Intent first. Every session starts from something the user typed or tapped. No home feed, ever.
2.  Finite. Default 7 cards per session, hard cap 10. Visible counter (3 of 7) and a real end screen. No infinite scroll, autoplay, “related”, “next up” or pull-to-load-more.
3.  One card per screen, swipe left/right.
4.  Honest ending. The end screen asks: did you get what you needed? [Done] [Refine] [Save]. Refine starts a new session with a new intent; it never extends the old one.
5.  No dark patterns. No streak guilt, no “come back” notifications, no engagement-optimised ranking. Success = sessions finished and feed-opens redirected, not time in app.
6.  User stays in control. Every gate has a way through. Friction, not imprisonment.
7.  Privacy by default. Intents and stats stay on-device unless the user opts in. Explain every permission before asking.
8.  Multilingual. Queries may be English, Urdu or Roman Urdu, often mixed in one sentence.
4. How it works
Pull: the deck
Flow: Intent screen → loading skeleton → Deck → End screen.
• Intent screen: one text box (“What do you need?”), mode chips (Learn · Fix · Watch · Read), time-box chips (5 / 10 / 20 min), recent intents (local only).
• Server pipeline: normalise the query (an LLM rewrites it into 1–2 clean search queries, language-aware) → fetch candidates → de-duplicate → LLM re-rank and summarise → return at most N cards.
• Card: kind (video / article / doc), title, source, minutes, three-bullet TL;DR in the user’s language, one-line “why this”, primary action (Play / Open), secondary action (Save).
• Videos play only through the official YouTube embedded player. Articles show our summary plus a link out. Never re-host or republish full text.
• If fewer than 3 good candidates exist, show fewer cards and say so. Never pad.
Push: the gate (Android first)
• The user picks target apps. Defaults: Instagram, TikTok, YouTube, Facebook, Snapchat, X. Messaging apps (WhatsApp, Messenger) are excluded by default.
• When a target app comes to the foreground, show a full-screen gate: a 5 s breathing pause (configurable 3–15 s) asking “What did you open this for?”, then three options:
    ◦ Look something up → deep link into the Intent screen, e.g. skipthescroll://intent?from=instagram.
    ◦ Just a quick break (5 min) → a time-boxed allowance with a small countdown.
    ◦ Never mind → back to the home screen.
• “Continue anyway” exists but needs a deliberate extra tap, and is counted.
• Escalation: repeated opens within an hour lengthen the pause (5 → 10 → 15 s). When a time-box ends, the gate reappears. No silent extensions.
5. Milestones
Stop after each one: summarise what changed, give exact run/test commands, list manual checks and known gaps, then wait for “go”.
• M0 – Plan (no feature code). Write PLAN.md (architecture, repo layout, risks, open questions) and an empty DECISIONS.md.
• M1 – Deck with fixtures. Expo app: Intent → Deck → End screen using local JSON fixtures; horizontal paging with counter; local session log. Accept: works offline; nothing in the app can scroll infinitely; unit tests cover the card cap and end-screen logic.
• M2 – Real content. Backend, providers, LLM ranking and summaries, caching, quota guard. Accept: a real query returns 3–7 valid cards in under 6 s on a cache miss and under 0.5 s on a hit; a Roman Urdu query works; provider, quota or LLM failures degrade gracefully.
• M3 – Android gate. Kotlin native module plus settings UI. Accept: opening a target app shows the gate within about a second on a mid-range phone; all three options work; it survives a reboot; permission onboarding is in plain language; battery impact is measured and noted.
• M4 – Library and insights. Saved cards; a weekly view of sessions finished, gate redirects, continue-anyway taps, and estimated minutes saved (labelled as an estimate).
• Later, don’t build yet: iOS gate, friend accountability, offline packs, browser extension.
6. Tech stack (defaults; justify any change in DECISIONS.md)
Chosen to match what the builders already know (React, Node/Express, MongoDB, Python).
• Mobile: React Native + Expo (TypeScript), development build (not Expo Go), Expo Router. The deck is a horizontal pager (e.g. react-native-pager-view).
• Android native (M3): a Kotlin module exposed through the Expo Modules API: ForegroundAppDetector, GateOverlay, AllowanceStore.
• Backend: Node + Express (TypeScript) on a free-tier host; MongoDB Atlas with a TTL index for the cache; config via env vars; the LLM sits behind an LLMClient interface so the provider is swappable.
• Repo: monorepo with apps/mobile, apps/api, packages/shared (types).
Android gate implementation notes
• Default detection: a foreground service polling UsageStatsManager (user grants Usage Access) and showing the gate as an overlay (user grants Display over other apps). Declare a valid foreground-service type for the target SDK.
• AccessibilityService is optional and off by default: Google Play allows it for non-accessibility apps only with prominent disclosure and a permission declaration, and tells developers to prefer narrower APIs.
• MVP distribution = sideloaded APK or EAS internal build for friends. Revisit Play policy before any public release.
• Many Android vendors kill background services aggressively. Add an onboarding step for the battery-optimisation exemption and test on at least one such phone.
• iOS (later): the Screen Time API (Family Controls) needs an entitlement approved by Apple. A Shortcuts “When app opens” automation that opens the deep link is the lighter fallback, with a noticeable delay.
7. Content sourcing rules
• Provider interface: search(query, { limit, lang }) → Candidate[]. Start with the YouTube Data API (videos), a web-search API (articles and docs) and Wikipedia (definitions). Each must be swappable and mockable.
• YouTube quota is small: the default allows roughly 100 searches per day per project. So: cache by normalised query (24 h TTL), at most one search call per session, batch the cheap lookup calls, log quota use, and fall back to articles-only when exhausted.
• Terms: official embeds and links only. Don’t download, strip ads, re-host or separate audio. Always show the source. Don’t scrape paywalled content. Re-check the current YouTube API Services terms before launch.
• Ranking: the LLM ranks and summarises, but the guardrails live in plain code outside it: card cap, at least one non-video when available, duration fits the time-box, language match, and no clickbait or sub-60 s clips unless the mode is Watch.
• LLM calls: structured JSON output validated against a schema; timeouts; retries; token and cost logging; prompts kept in versioned files under apps/api/src/prompts/.
8. Data contracts
type Card = {
  id: string;
  kind: 'video' | 'article' | 'doc';
  title: string;
  source: string;        // channel or site
  url: string;
  embedId?: string;      // YouTube video id when embeddable
  minutes: number;       // watch/read estimate
  tldr: string[];        // exactly 3 short bullets, in the user's language
  why: string;           // one line: why this matches the intent
  thumbnail?: string;
};

type Session = {
  id: string;
  intent: string;
  lang: 'en' | 'ur' | 'roman-ur';
  timeboxMin: 5 | 10 | 20;
  cards: Card[];         // max 10
  createdAt: string;
};
API (MVP): POST /v1/sessions { intent, timeboxMin, lang? } returns a Session, plus GET /v1/health. No accounts; use a random device ID.
9. Screens and look
Intent · Gate (native) · Deck · End · Library · Insights · Settings (target apps, pause length, allowance, language, permission status). Calm, high-contrast, large type, one accent colour, dark mode. No red badges, no gamified time counters. Every screen has loading, empty, error and offline states.
10. Privacy and ethics
• Store intents and stats locally. The server keeps only a cache keyed by normalised query, not tied to a device unless the user opts in.
• Never read the content of other apps. Accessibility stays off by default.
• Permission screens say what, why and how to revoke. The gate has a “Why am I seeing this?” link.
11. Non-goals (for now)
Accounts or social features; any kind of feed; ads; recommendations beyond the query; scraping; an iOS gate; a browser extension; monetisation.
12. Working agreements
• Start with M0 only. Don’t write feature code until the plan is approved.
• Smallest solution that meets the acceptance criteria. No new dependency without a one-line reason in DECISIONS.md.
• Readable over clever. Add short comments on non-obvious parts and note key design decisions in DECISIONS.md, so the team can understand and modify the code.
• Secrets only via env vars; ship a .env.example; never commit keys.
• Tests for: card cap and end-screen logic, provider fallbacks, LLM JSON validation, quota guard.
• If this brief conflicts with reality (an API changed, a policy blocks something), stop, explain, and propose two options. Don’t silently work around it.
• Verify platform rules against current official docs before relying on them: Google Play policy, YouTube API terms and quota, Apple entitlements.
13. How we’ll know it works
Dogfood with about 10 friends for 7 days, with a local stats export: sessions started and finished, “done” rate, gate shown / redirected / continued, and a one-tap “did you get what you needed?”. If people don’t use the Pull side voluntarily, fix Pull before polishing the Gate.
14. Your first reply
Send: (1) the mission in five lines, in your own words; (2) PLAN.md; (3) at most five blocking questions. No feature code yet.