declare module "katex/contrib/auto-render" {
  export default function renderMathInElement(
    element: HTMLElement,
    options?: {
      delimiters?: Array<{ left: string; right: string; display: boolean }>;
      throwOnError?: boolean;
    }
  ): void;
}
