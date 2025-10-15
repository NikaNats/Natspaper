/**
 * Type declaration for @pagefind/default-ui
 * Provides basic type information for the Pagefind UI package
 */

declare module "@pagefind/default-ui" {
  export class PagefindUI {
    constructor(options: {
      element: string | HTMLElement;
      showSubResults?: boolean;
      showImages?: boolean;
      showEmptyFilters?: boolean;
      processTerm?: (term: string) => string;
      processResult?: (result: unknown) => unknown;
      showIndexWeight?: boolean;
    });
    triggerSearch(query: string): void;
    triggerFilters(filters: Record<string, string | string[]>): void;
    destroy(): void;
  }
}
