import type { CardKind, Mode, TimeBox } from '@skip-the-scroll/shared';

export interface Candidate {
  id: string;
  kind: CardKind;
  title: string;
  source: string;
  url: string;
  embedId?: string;
  snippet?: string;
  minutes?: number;
}

export interface SearchOptions {
  limit?: number;
  mode?: Mode;
}

export interface Provider {
  readonly name: string;
  search(query: string, options?: SearchOptions): Promise<Candidate[]>;
}

export interface NormalizedQuery {
  queries: string[];
}
