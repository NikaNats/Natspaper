/**
 * Type definitions for @pagefind/default-ui
 * Community-provided type definitions for the Pagefind UI package
 */

export interface PagefindUIOptions {
  element: string | HTMLElement;
  showSubResults?: boolean;
  showImages?: boolean;
  showEmptyFilters?: boolean;
  processTerm?: (term: string) => string;
  processResult?: (result: PagefindResult) => PagefindResult;
  showIndexWeight?: boolean;
}

export interface PagefindResult {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta: Record<string, unknown>;
    locations: number[];
    title: string;
    weighted_locations: Array<{
      weight: number;
      location: number;
    }>;
    raw_content: string;
    raw_url: string;
  }>;
}

export interface PagefindUI {
  triggerSearch: (query: string) => void;
  triggerFilters: (filters: Record<string, string | string[]>) => void;
  destroy: () => void;
}

declare module "@pagefind/default-ui" {
  export class PagefindUI {
    constructor(options: PagefindUIOptions);
    triggerSearch(query: string): void;
    triggerFilters(filters: Record<string, string | string[]>): void;
    destroy(): void;
  }
}
