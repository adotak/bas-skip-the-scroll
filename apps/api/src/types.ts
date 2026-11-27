import type { CardKind, DifficultyLevel, Language, Mode } from '@skip-the-scroll/shared';

export interface Candidate {
  id: string;
  kind: CardKind;
  title: string;
  source: string;
  url: string;
  embedId?: string;
  snippet?: string;
  minutes?: number;
  thumbnail?: string;
  difficulty?: DifficultyLevel;
  tags?: string[];
}

export interface SearchOptions {
  limit?: number;
  mode?: Mode;
  lang?: Language;
}

export interface Provider {
  readonly name: string;
  search(query: string, options?: SearchOptions): Promise<Candidate[]>;
}

export interface NormalizedQuery {
  queries: string[];
}
