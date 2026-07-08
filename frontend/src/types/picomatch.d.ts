declare module "picomatch" {
  type Matcher = (input: string) => boolean;
  type MatcherOptions = {
    dot?: boolean;
    nocase?: boolean;
    [key: string]: unknown;
  };
  function picomatch(pattern: string, options?: MatcherOptions): Matcher;
  export default picomatch;
}
