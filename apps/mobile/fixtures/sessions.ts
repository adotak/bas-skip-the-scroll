import type { Session } from '@skip-the-scroll/shared';

/**
 * Three realistic fixture sessions for M1.
 * Covers all three card kinds (video, article, doc) and
 * different modes / time-boxes.
 */
export const FIXTURE_SESSIONS: Session[] = [
  // ── Session 1: Learn · 10 min ──────────────────────────────────────────
  {
    id: 'fix-learn-react-hooks',
    intent: 'learn React hooks',
    mode: 'learn',
    timeboxMin: 10,
    createdAt: '2026-11-01T10:00:00Z',
    cards: [
      {
        id: 'c1-1',
        kind: 'video',
        title: 'React Hooks Explained in 12 Minutes',
        source: 'Fireship',
        url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q',
        embedId: 'TNhaISOUy6Q',
        minutes: 12,
        tldr: [
          'useState and useEffect cover 90% of use cases.',
          'Custom hooks let you extract and reuse stateful logic.',
          'useRef holds a mutable value that doesn\'t trigger re-renders.',
        ],
        why: 'Fast, visual overview of every hook you\'ll actually use.',
        thumbnail: 'https://img.youtube.com/vi/TNhaISOUy6Q/hqdefault.jpg',
      },
      {
        id: 'c1-2',
        kind: 'article',
        title: 'A Complete Guide to useEffect',
        source: 'overreacted.io',
        url: 'https://overreacted.io/a-complete-guide-to-useeffect/',
        minutes: 15,
        tldr: [
          'Each render has its own props, state, and effects.',
          'The dependency array tells React when to re-run the effect.',
          'Cleanup functions run before the next effect, not on unmount.',
        ],
        why: 'The deepest mental model for useEffect, by a React core team member.',
      },
      {
        id: 'c1-3',
        kind: 'doc',
        title: 'Built-in React Hooks — Official Docs',
        source: 'react.dev',
        url: 'https://react.dev/reference/react/hooks',
        minutes: 8,
        tldr: [
          'Hooks are functions that let you use state and lifecycle in function components.',
          'Rules: only call at the top level, only call in React functions.',
          'The docs group hooks by purpose: state, context, ref, effect, performance.',
        ],
        why: 'Canonical reference — the single source of truth for every hook.',
      },
      {
        id: 'c1-4',
        kind: 'video',
        title: 'useCallback and useMemo Explained',
        source: 'Jack Herrington',
        url: 'https://www.youtube.com/watch?v=MFj_S0Nof90',
        embedId: 'MFj_S0Nof90',
        minutes: 10,
        tldr: [
          'useMemo caches a computed value; useCallback caches a function reference.',
          'Both take a dependency array — stale deps = stale cache.',
          'Don\'t use them everywhere; profile first.',
        ],
        why: 'Clear examples of when memoisation helps and when it\'s noise.',
        thumbnail: 'https://img.youtube.com/vi/MFj_S0Nof90/hqdefault.jpg',
      },
      {
        id: 'c1-5',
        kind: 'article',
        title: 'Thinking in React Hooks',
        source: 'amelia.dev',
        url: 'https://wattenberger.com/blog/react-hooks',
        minutes: 7,
        tldr: [
          'Think of hooks as subscribing to external values.',
          'useState is a subscription to a local value you control.',
          'useEffect is a subscription to a side effect you need to synchronize.',
        ],
        why: 'Visual, interactive explanations that build intuition.',
      },
    ],
  },

  // ── Session 2: Fix · 5 min ─────────────────────────────────────────────
  {
    id: 'fix-cors-express',
    intent: 'fix CORS error in Express',
    mode: 'fix',
    timeboxMin: 5,
    createdAt: '2026-11-02T14:30:00Z',
    cards: [
      {
        id: 'c2-1',
        kind: 'article',
        title: 'How to fix CORS errors in Express',
        source: 'Stack Overflow',
        url: 'https://stackoverflow.com/questions/46024363',
        minutes: 3,
        tldr: [
          'Install the cors package: npm install cors.',
          'Use app.use(cors()) for open access, or pass an options object to restrict origins.',
          'For credentials, set { origin: "http://your-frontend", credentials: true }.',
        ],
        why: 'Direct fix with the most common Express CORS patterns.',
      },
      {
        id: 'c2-2',
        kind: 'doc',
        title: 'cors — Express middleware',
        source: 'npmjs.com',
        url: 'https://www.npmjs.com/package/cors',
        minutes: 4,
        tldr: [
          'cors() with no args allows all origins — fine for dev, not for prod.',
          'origin can be a string, regex, array, or function for dynamic checks.',
          'Preflight (OPTIONS) requests need cors() applied before your routes.',
        ],
        why: 'The official README for the package you\'re about to install.',
      },
      {
        id: 'c2-3',
        kind: 'video',
        title: 'CORS in 100 Seconds',
        source: 'Fireship',
        url: 'https://www.youtube.com/watch?v=4KHiSt0oLJ0',
        embedId: '4KHiSt0oLJ0',
        minutes: 2,
        tldr: [
          'CORS is the browser enforcing same-origin policy on HTTP requests.',
          'The server must send Access-Control-Allow-Origin in the response.',
          'Preflight requests (OPTIONS) check permissions before the real request.',
        ],
        why: 'Quick mental model of why CORS exists, so the fix makes sense.',
        thumbnail: 'https://img.youtube.com/vi/4KHiSt0oLJ0/hqdefault.jpg',
      },
      {
        id: 'c2-4',
        kind: 'article',
        title: 'Cross-Origin Resource Sharing (CORS) — MDN',
        source: 'developer.mozilla.org',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
        minutes: 8,
        tldr: [
          'Simple requests (GET, POST with form content types) skip preflight.',
          'Complex requests (PUT, DELETE, custom headers) trigger an OPTIONS preflight.',
          'Credentials (cookies, auth headers) require explicit opt-in on both sides.',
        ],
        why: 'The spec-level reference when the quick fix isn\'t enough.',
      },
    ],
  },

  // ── Session 3: Watch · 20 min ──────────────────────────────────────────
  {
    id: 'fix-system-design',
    intent: 'system design interview prep',
    mode: 'watch',
    timeboxMin: 20,
    createdAt: '2026-11-03T09:00:00Z',
    cards: [
      {
        id: 'c3-1',
        kind: 'video',
        title: 'System Design Interview — Step-by-Step Guide',
        source: 'ByteByteGo',
        url: 'https://www.youtube.com/watch?v=i7twT3x5yv8',
        embedId: 'i7twT3x5yv8',
        minutes: 15,
        tldr: [
          'Follow a framework: requirements → estimation → API → data model → design → bottlenecks.',
          'Always ask clarifying questions before jumping into the design.',
          'Draw the high-level architecture first, then zoom into components.',
        ],
        why: 'The go-to framework video — covers the template interviewers expect.',
        thumbnail: 'https://img.youtube.com/vi/i7twT3x5yv8/hqdefault.jpg',
      },
      {
        id: 'c3-2',
        kind: 'video',
        title: 'Design a URL Shortener — System Design Interview',
        source: 'NeetCode',
        url: 'https://www.youtube.com/watch?v=fMZMm_0ZhK4',
        embedId: 'fMZMm_0ZhK4',
        minutes: 18,
        tldr: [
          'URL shortener is a classic warm-up: simple CRUD with a hash function.',
          'Key decisions: hash vs counter, SQL vs NoSQL, caching reads.',
          'Discuss trade-offs: collision handling, analytics, expiration.',
        ],
        why: 'Walkthrough of the most commonly asked starter question.',
        thumbnail: 'https://img.youtube.com/vi/fMZMm_0ZhK4/hqdefault.jpg',
      },
      {
        id: 'c3-3',
        kind: 'article',
        title: 'System Design Primer',
        source: 'github.com/donnemartin',
        url: 'https://github.com/donnemartin/system-design-primer',
        minutes: 10,
        tldr: [
          'Covers scalability, availability, consistency, and partition tolerance.',
          'Includes flashcards, practice problems, and real-world architectures.',
          'Start with the overview, then drill into the topic your interview targets.',
        ],
        why: 'The single most-starred system design resource on GitHub.',
      },
      {
        id: 'c3-4',
        kind: 'video',
        title: 'CAP Theorem Simplified',
        source: 'Hussein Nasser',
        url: 'https://www.youtube.com/watch?v=BHqjEjzAicY',
        embedId: 'BHqjEjzAicY',
        minutes: 12,
        tldr: [
          'CAP: in a network partition you choose Consistency or Availability.',
          'CP systems (e.g. HBase) reject writes during a partition to stay consistent.',
          'AP systems (e.g. Cassandra) accept writes but may serve stale reads.',
        ],
        why: 'CAP comes up in almost every system design — this is the clearest explanation.',
        thumbnail: 'https://img.youtube.com/vi/BHqjEjzAicY/hqdefault.jpg',
      },
      {
        id: 'c3-5',
        kind: 'video',
        title: 'How to Design a Rate Limiter',
        source: 'ByteByteGo',
        url: 'https://www.youtube.com/watch?v=FU4WlwfS3G0',
        embedId: 'FU4WlwfS3G0',
        minutes: 10,
        tldr: [
          'Token bucket and sliding window are the two main algorithms.',
          'Place the limiter at the API gateway or as middleware.',
          'Store counters in Redis for distributed rate limiting.',
        ],
        why: 'Rate limiting is a frequent follow-up question in design interviews.',
        thumbnail: 'https://img.youtube.com/vi/FU4WlwfS3G0/hqdefault.jpg',
      },
      {
        id: 'c3-6',
        kind: 'doc',
        title: 'Designing Data-Intensive Applications — Summary',
        source: 'neetcode.io',
        url: 'https://neetcode.io/courses/system-design-for-beginners/0',
        minutes: 5,
        tldr: [
          'Understand storage: B-trees (read-optimised) vs LSM-trees (write-optimised).',
          'Replication: leader-follower for reads, multi-leader for geo-distributed writes.',
          'Partitioning: hash for even distribution, range for locality.',
        ],
        why: 'Condensed version of the concepts from the must-read DDIA book.',
      },
      {
        id: 'c3-7',
        kind: 'article',
        title: 'Common System Design Mistakes in Interviews',
        source: 'interviewing.io',
        url: 'https://interviewing.io/guides/system-design-interview',
        minutes: 6,
        tldr: [
          'Don\'t jump to the solution — spend 5 minutes on requirements.',
          'Don\'t over-engineer: start simple, then scale when asked.',
          'Don\'t forget to discuss trade-offs for every decision.',
        ],
        why: 'Anti-patterns to avoid — learn from other candidates\' failures.',
      },
    ],
  },
];

/**
 * Look up a fixture session by a keyword in the intent.
 * Returns the first match, or the first session as a fallback.
 */
export function findFixtureSession(intent: string): Session {
  const lower = intent.toLowerCase();
  const match = FIXTURE_SESSIONS.find((s) =>
    s.intent.toLowerCase().includes(lower) ||
    lower.includes(s.intent.toLowerCase().split(' ')[0])
  );
  return match ?? FIXTURE_SESSIONS[0];
}
