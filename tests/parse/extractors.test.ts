/**
 * Unit Tests: Text Extractors
 * 
 * Tests for PDF, DOCX, and TXT text extraction utilities.
 * Covers basic extraction, error handling, and formatting analysis.
 */

import {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromTXT,
} from '@/lib/play/extractors';

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn((buffer: Buffer) => {
    const content = buffer.toString('utf8');
    if (content.includes('EMPTY_PDF')) {
      return Promise.resolve({ text: '' });
    }
    if (content.includes('ERROR_PDF')) {
      return Promise.reject(new Error('PDF parsing failed'));
    }
    return Promise.resolve({ text: content.replace('PDF:', '') });
  });
});

// Mock mammoth
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(({ buffer }: { buffer: Buffer }) => {
    const content = buffer.toString('utf8');
    if (content.includes('EMPTY_DOCX')) {
      return Promise.resolve({ value: '' });
    }
    if (content.includes('ERROR_DOCX')) {
      return Promise.reject(new Error('DOCX parsing failed'));
    }
    return Promise.resolve({ value: content.replace('DOCX:', '') });
  }),
}));

describe('extractTextFromPDF', () => {
  it('should extract text from PDF buffer', async () => {
    const buffer = Buffer.from('PDF:Sample PDF content');
    const text = await extractTextFromPDF(buffer);
    expect(text).toBe('Sample PDF content');
  });

  it('should throw error for empty PDF', async () => {
    const buffer = Buffer.from('EMPTY_PDF');
    await expect(extractTextFromPDF(buffer)).rejects.toThrow(
      'PDF parsing succeeded but no text was extracted'
    );
  });

  it('should throw error for failed PDF parsing', async () => {
    const buffer = Buffer.from('ERROR_PDF');
    await expect(extractTextFromPDF(buffer)).rejects.toThrow(
      'PDF extraction failed: PDF parsing failed'
    );
  });
});

describe('extractTextFromDOCX', () => {
  it('should extract text from DOCX buffer', async () => {
    const buffer = Buffer.from('DOCX:Sample DOCX content');
    const text = await extractTextFromDOCX(buffer);
    expect(text).toBe('Sample DOCX content');
  });

  it('should throw error for empty DOCX', async () => {
    const buffer = Buffer.from('EMPTY_DOCX');
    await expect(extractTextFromDOCX(buffer)).rejects.toThrow(
      'DOCX parsing succeeded but no text was extracted'
    );
  });

  it('should throw error for failed DOCX parsing', async () => {
    const buffer = Buffer.from('ERROR_DOCX');
    await expect(extractTextFromDOCX(buffer)).rejects.toThrow(
      'DOCX extraction failed: DOCX parsing failed'
    );
  });
});

describe('extractTextFromTXT', () => {
  it('should extract text from UTF-8 buffer', async () => {
    const buffer = Buffer.from('Plain text content', 'utf8');
    const text = await extractTextFromTXT(buffer);
    expect(text).toBe('Plain text content');
  });

  it('should handle empty text file', async () => {
    const buffer = Buffer.from('', 'utf8');
    const text = await extractTextFromTXT(buffer);
    expect(text).toBe('');
  });

  it('should handle multi-line text', async () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const buffer = Buffer.from(content, 'utf8');
    const text = await extractTextFromTXT(buffer);
    expect(text).toBe(content);
  });

  it('should handle special characters', async () => {
    const content = 'Héllo Wörld! 你好';
    const buffer = Buffer.from(content, 'utf8');
    const text = await extractTextFromTXT(buffer);
    expect(text).toBe(content);
  });
});
// Note: analyzeFormatting tests omitted as function was removed