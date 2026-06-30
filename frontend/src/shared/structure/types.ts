export interface Rule {
  id: string;
  name: string;
  source: (root: string) => string;
  forbidden: RegExp | null;
  message: string;
  fix: string;
  ignore?: (file: string) => boolean;
  isLineCount?: boolean;
  limit?: (file: string) => number;
}

export interface Violation {
  file: string;
  rule: string;
  message: string;
  fix: string;
}
