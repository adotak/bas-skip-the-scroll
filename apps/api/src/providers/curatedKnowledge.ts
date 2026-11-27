import type { Card, Language, Mode, TimeBox } from '@skip-the-scroll/shared';
import type { Candidate } from '../types';

interface TopicBlueprint {
  keywords: string[];
  candidates: Candidate[];
  refinements: string[];
}

const TOPIC_BLUEPRINTS: TopicBlueprint[] = [
  {
    keywords: ['react', 'hook', 'useeffect', 'usestate', 'frontend', 'jsx', 'component'],
    refinements: [
      'custom React hooks patterns',
      'fix stale closures in useEffect',
      'React Server Components vs Hooks',
      'useMemo and useCallback performance',
    ],
    candidates: [
      {
        id: 'kb-react-1',
        kind: 'doc',
        title: 'Built-in React Hooks — Official Reference',
        source: 'react.dev',
        url: 'https://react.dev/reference/react/hooks',
        minutes: 6,
        difficulty: 'beginner',
        tags: ['react', 'hooks', 'official-docs'],
        snippet:
          'Hooks let you use different React features from your components. Covers State, Context, Ref, Effect, and Performance hooks with interactive examples.',
      },
      {
        id: 'kb-react-2',
        kind: 'video',
        title: 'React Hooks Explained in 12 Minutes',
        source: 'Fireship',
        url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q',
        embedId: 'TNhaISOUy6Q',
        minutes: 12,
        difficulty: 'beginner',
        tags: ['react', 'video', 'overview'],
        thumbnail: 'https://img.youtube.com/vi/TNhaISOUy6Q/hqdefault.jpg',
        snippet:
          'useState and useEffect cover 90% of use cases. Custom hooks let you extract and reuse stateful logic across components cleanly.',
      },
      {
        id: 'kb-react-3',
        kind: 'article',
        title: 'A Complete Guide to useEffect & Synchronization',
        source: 'overreacted.io',
        url: 'https://overreacted.io/a-complete-guide-to-useeffect/',
        minutes: 8,
        difficulty: 'intermediate',
        tags: ['useEffect', 'mental-model', 'lifecycle'],
        snippet:
          'Every render has its own props, state, and event handlers. The dependency array tells React when to re-synchronize side effects.',
      },
      {
        id: 'kb-react-4',
        kind: 'article',
        title: 'You Might Not Need an Effect',
        source: 'react.dev',
        url: 'https://react.dev/learn/you-might-not-need-an-effect',
        minutes: 5,
        difficulty: 'intermediate',
        tags: ['best-practices', 'anti-patterns', 'clean-code'],
        snippet:
          'Avoid redundant state and unnecessary Effects when transforming data for rendering or handling user events directly.',
      },
    ],
  },
  {
    keywords: ['cors', 'express', 'api', 'node', 'backend', 'fetch', 'header', 'error', 'fix'],
    refinements: [
      'Express preflight OPTIONS & credentials',
      'Reverse proxy CORS in Nginx / Vite',
      'JWT cookie authentication across origins',
      'Debugging network errors in Chrome DevTools',
    ],
    candidates: [
      {
        id: 'kb-cors-1',
        kind: 'doc',
        title: 'Cross-Origin Resource Sharing (CORS) — MDN Guide',
        source: 'developer.mozilla.org',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
        minutes: 5,
        difficulty: 'intermediate',
        tags: ['http', 'security', 'mdn'],
        snippet:
          'CORS is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
      },
      {
        id: 'kb-cors-2',
        kind: 'video',
        title: 'CORS in 100 Seconds',
        source: 'Fireship',
        url: 'https://www.youtube.com/watch?v=4KHiSt0oLJ0',
        embedId: '4KHiSt0oLJ0',
        minutes: 2,
        difficulty: 'beginner',
        tags: ['cors', 'quick-fix', 'browser'],
        thumbnail: 'https://img.youtube.com/vi/4KHiSt0oLJ0/hqdefault.jpg',
        snippet:
          'The browser enforces same-origin policy on HTTP requests. Your server must return Access-Control-Allow-Origin and handle OPTIONS preflight requests.',
      },
      {
        id: 'kb-cors-3',
        kind: 'article',
        title: 'Configuring Express CORS Middleware Safely for Production',
        source: 'expressjs.com',
        url: 'https://expressjs.com/en/resources/middleware/cors.html',
        minutes: 4,
        difficulty: 'beginner',
        tags: ['express', 'nodejs', 'middleware'],
        snippet:
          'Install the cors package, configure an explicit allowlist of origins, and register app.use(cors(options)) before your route handlers.',
      },
    ],
  },
  {
    keywords: ['system', 'design', 'architecture', 'scale', 'interview', 'database', 'cache', 'distributed'],
    refinements: [
      'Rate limiter & token bucket design',
      'CAP theorem & database sharding',
      'Event-driven queues with Kafka / Redis',
      'High-availability load balancing patterns',
    ],
    candidates: [
      {
        id: 'kb-sys-1',
        kind: 'video',
        title: 'System Design Interview — Step-by-Step Framework',
        source: 'ByteByteGo',
        url: 'https://www.youtube.com/watch?v=i7twT3x5yv8',
        embedId: 'i7twT3x5yv8',
        minutes: 10,
        difficulty: 'intermediate',
        tags: ['system-design', 'architecture', 'framework'],
        thumbnail: 'https://img.youtube.com/vi/i7twT3x5yv8/hqdefault.jpg',
        snippet:
          'Structure any design in 4 steps: clarify requirements & scale, sketch high-level API & storage, dive into core components, and resolve bottlenecks.',
      },
      {
        id: 'kb-sys-2',
        kind: 'doc',
        title: 'The System Design Primer — Open Reference',
        source: 'github.com/donnemartin',
        url: 'https://github.com/donnemartin/system-design-primer',
        minutes: 7,
        difficulty: 'intermediate',
        tags: ['scalability', 'caching', 'databases'],
        snippet:
          'Covers horizontal scaling, load balancers, consistent hashing, SQL vs NoSQL trade-offs, and asynchronous message queues.',
      },
      {
        id: 'kb-sys-3',
        kind: 'article',
        title: 'Caching Strategies & Read/Write Through Patterns',
        source: 'aws.amazon.com',
        url: 'https://aws.amazon.com/caching/best-practices/',
        minutes: 5,
        difficulty: 'advanced',
        tags: ['redis', 'caching', 'latency'],
        snippet:
          'Compare lazy loading (cache-aside) with write-through caching, set effective TTLs with jitter to avoid cache stampedes, and monitor hit ratios.',
      },
    ],
  },
  {
    keywords: ['typescript', 'type', 'generics', 'javascript', 'async', 'promise', 'ts'],
    refinements: [
      'TypeScript utility types (Pick, Omit, Infer)',
      'Narrowing & discriminated unions in TS',
      'Async/Await error boundary patterns',
      'Strict tsconfig flags explained',
    ],
    candidates: [
      {
        id: 'kb-ts-1',
        kind: 'doc',
        title: 'TypeScript Handbook — Everyday Types & Generics',
        source: 'typescriptlang.org',
        url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
        minutes: 6,
        difficulty: 'beginner',
        tags: ['typescript', 'types', 'generics'],
        snippet:
          'Master union types, type aliases vs interfaces, type narrowing with guards, and generic constraints for reusable type-safe functions.',
      },
      {
        id: 'kb-ts-2',
        kind: 'video',
        title: 'TypeScript in 100 Seconds',
        source: 'Fireship',
        url: 'https://www.youtube.com/watch?v=zQnBQ4tB3ZA',
        embedId: 'zQnBQ4tB3ZA',
        minutes: 3,
        difficulty: 'beginner',
        tags: ['typescript', 'overview', 'video'],
        thumbnail: 'https://img.youtube.com/vi/zQnBQ4tB3ZA/hqdefault.jpg',
        snippet:
          'Static typing catches bugs at compile time, powers IDE autocomplete, and compiles down cleanly to standard JavaScript targets.',
      },
      {
        id: 'kb-ts-3',
        kind: 'article',
        title: 'Advanced TypeScript Patterns: Discriminated Unions & Infer',
        source: 'totaltypescript.com',
        url: 'https://www.totaltypescript.com/tutorials',
        minutes: 6,
        difficulty: 'advanced',
        tags: ['advanced-ts', 'unions', 'type-safety'],
        snippet:
          'Model state machines with discriminated unions so impossible states are unrepresentable at compile time.',
      },
    ],
  },
];

export function getSuggestedRefinements(intent: string, mode: Mode): string[] {
  const lower = intent.toLowerCase();
  const matched = TOPIC_BLUEPRINTS.find((b) =>
    b.keywords.some((kw) => lower.includes(kw))
  );
  if (matched) {
    return matched.refinements;
  }

  const cleanTopic = intent
    .replace(/^(learn|fix|watch|read|how to|what is|explain)\s+/i, '')
    .trim();

  return [
    `${cleanTopic} practical examples`,
    `common mistakes in ${cleanTopic}`,
    `${cleanTopic} official documentation`,
    `advanced ${cleanTopic} patterns`,
  ];
}

export function synthesizeCuratedCandidates(
  intent: string,
  mode: Mode
): Candidate[] {
  const lower = intent.toLowerCase();
  const matched = TOPIC_BLUEPRINTS.find((b) =>
    b.keywords.some((kw) => lower.includes(kw))
  );

  if (matched) {
    return matched.candidates;
  }

  const cleanTopic = intent.trim();
  const encoded = encodeURIComponent(cleanTopic);

  return [
    {
      id: `synth-doc-${Date.now()}-1`,
      kind: 'doc',
      title: `${cleanTopic} — Reference & Core Concepts`,
      source: 'en.wikipedia.org',
      url: `https://en.wikipedia.org/w/index.php?search=${encoded}`,
      minutes: 4,
      difficulty: 'beginner',
      tags: [mode, 'reference', 'concepts'],
      snippet: `Foundational principles, definitions, and structured technical overview for ${cleanTopic}.`,
    },
    {
      id: `synth-art-${Date.now()}-2`,
      kind: 'article',
      title: `Practical Guide to ${cleanTopic} (${mode.toUpperCase()} Mode)`,
      source: 'developer.mozilla.org',
      url: `https://developer.mozilla.org/en-US/search?q=${encoded}`,
      minutes: 5,
      difficulty: 'intermediate',
      tags: [mode, 'hands-on', 'guide'],
      snippet: `Step-by-step patterns, real-world implementation trade-offs, and actionable examples for ${cleanTopic}.`,
    },
    {
      id: `synth-vid-${Date.now()}-3`,
      kind: 'video',
      title: `${cleanTopic} — Visual Walkthrough & Mental Model`,
      source: 'Fireship',
      url: `https://www.youtube.com/results?search_query=${encoded}`,
      embedId: 'TNhaISOUy6Q',
      minutes: 6,
      difficulty: 'beginner',
      tags: [mode, 'visual', 'walkthrough'],
      thumbnail: 'https://img.youtube.com/vi/TNhaISOUy6Q/hqdefault.jpg',
      snippet: `High-density visual breakdown of ${cleanTopic} so you grasp the core mental model in minutes.`,
    },
  ];
}

export function localizeBullets(
  c: Candidate,
  intent: string,
  lang: Language,
  mode: Mode
): { tldr: [string, string, string]; why: string; actionPrompt: string } {
  if (lang === 'roman-ur') {
    return {
      tldr: [
        `${c.title} ka bunyadi concept aur mental model asaan alfaaz mein samjhein.`,
        `"${intent}" ke liye practical steps aur real-world examples dekhein.`,
        `${c.source} ke mutabiq common mistakes se bachein aur best practices apply karein.`,
      ],
      why: `"${intent}" (${mode} mode) ke liye ${c.source} ka behtareen aur mukhtasir zariya.`,
      actionPrompt: `Is card ke 3 points parhne ke baad 1 line mein apna khulasa likhein.`,
    };
  }

  if (lang === 'ur') {
    return {
      tldr: [
        `${c.title} کے بنیادی تصورات اور اہم نکات کا جامع خلاصہ۔`,
        `"${intent}" کے عملی نفاذ اور بہترین طریقوں کی واضح مثالیں۔`,
        `${c.source} کے مستند حوالے سے عام غلطیوں سے بچنے کے رہنما اصول۔`,
      ],
      why: `"${intent}" کے مقصد کو کم وقت میں پورا کرنے کے لیے ${c.source} کا بہترین انتخاب۔`,
      actionPrompt: `اس کارڈ کے اہم نکات کو اپنے الفاظ میں نوٹ کریں۔`,
    };
  }

  const snippet = c.snippet || c.title;
  const sentences = snippet
    .split(/[.?!]\s+/)
    .map((s) => s.trim().replace(/[.]+$/, ''))
    .filter(Boolean);

  const b1 = sentences[0]
    ? `${sentences[0]}.`
    : `Core mental model and high-signal breakdown of ${c.title}.`;
  const b2 = sentences[1]
    ? `${sentences[1]}.`
    : `Actionable patterns and implementation steps tailored for ${intent}.`;
  const b3 =
    sentences[2]
      ? `${sentences[2]}.`
      : `Canonical guidance from ${c.source} to avoid common pitfalls in ${mode} mode.`;

  return {
    tldr: [b1, b2, b3],
    why: `High-signal ${c.kind} from ${c.source} directly addressing "${intent}".`,
    actionPrompt:
      mode === 'fix'
        ? `Verify this fix against your local error output and note the root cause.`
        : `Write down one concrete way you will apply ${c.title} today.`,
  };
}

export function buildFallbackCards(
  intent: string,
  mode: Mode,
  timeboxMin: TimeBox,
  candidates: Candidate[],
  lang: Language = 'en'
): Card[] {
  const selected = candidates.slice(0, 7);

  return selected.map((c, index): Card => {
    const localized = localizeBullets(c, intent, lang, mode);
    const estMinutes = Math.max(1, Math.min(c.minutes || (c.kind === 'video' ? 8 : 5), timeboxMin));

    return {
      id: c.id || `card-${index + 1}`,
      kind: c.kind,
      title: c.title,
      source: c.source,
      url: c.url,
      embedId: c.embedId,
      minutes: estMinutes,
      tldr: localized.tldr,
      why: localized.why,
      thumbnail: c.thumbnail,
      difficulty: c.difficulty ?? (index === 0 ? 'beginner' : index < 3 ? 'intermediate' : 'advanced'),
      tags: c.tags ?? [mode, c.kind],
      actionPrompt: localized.actionPrompt,
      qualityScore: Math.max(82, 98 - index * 3),
    };
  });
}
