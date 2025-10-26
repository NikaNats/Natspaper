declare module "remark-collapse" {
  import type { Plugin } from "unified";
  const plugin: Plugin;
  export default plugin;
}

declare module "@pagefind/default-ui" {
  export class PagefindUI {
    constructor(options: Record<string, unknown>);
    triggerSearch(query: string): void;
  }
}
