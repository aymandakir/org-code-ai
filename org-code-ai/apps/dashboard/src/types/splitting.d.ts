declare module 'splitting' {
  interface SplittingOptions {
    target?: string | HTMLElement | NodeListOf<HTMLElement>;
    by?: 'chars' | 'words' | 'lines' | 'items';
    key?: string;
    prefix?: string;
  }

  interface SplittingResult {
    el: HTMLElement;
    chars?: HTMLElement[];
    words?: HTMLElement[];
    lines?: HTMLElement[];
    items?: HTMLElement[];
  }

  function Splitting(options?: SplittingOptions): SplittingResult[];

  export default Splitting;
}

