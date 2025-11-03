// @ts-ignore - pdf-parse doesn't have types
import pdfParse from 'pdf-parse';
// @ts-ignore - mammoth doesn't have types
import mammoth from 'mammoth';

/**
 * Parse various document formats to plain text
 */
export class DocumentParser {
  /**
   * Parse PDF to text
   */
  async parsePDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error: any) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse DOCX to text
   */
  async parseDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error: any) {
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Parse text from buffer based on mime type
   */
  async parseDocument(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf' || mimeType === 'application/x-pdf') {
      return this.parsePDF(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return this.parseDOCX(buffer);
    } else if (mimeType.startsWith('text/')) {
      return buffer.toString('utf-8');
    } else {
      // Fallback: try to decode as text
      return buffer.toString('utf-8');
    }
  }

  /**
   * Parse base64 encoded document
   */
  async parseBase64(base64: string, mimeType: string): Promise<string> {
    const buffer = Buffer.from(base64, 'base64');
    return this.parseDocument(buffer, mimeType);
  }
}
