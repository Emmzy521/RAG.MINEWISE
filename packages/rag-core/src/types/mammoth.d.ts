/// <reference types="node" />

declare module 'mammoth' {
  export interface ExtractRawTextResult {
    value: string;
  }

  export function extractRawText(options: { buffer: Buffer }): Promise<ExtractRawTextResult>;
}
