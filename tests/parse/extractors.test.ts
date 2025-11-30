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
  analyzeFormatting,
} from '@/lib/parse/extractors';

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

describe('analyzeFormatting', () => {
  it('should detect no indentation for flush-left text', () => {
    const text = 'First line\nSecond line\nThird line';
    const result = analyzeFormatting(text);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ text: 'First line', formatting: undefined });
    expect(result[1]).toEqual({ text: 'Second line', formatting: undefined });
    expect(result[2]).toEqual({ text: 'Third line', formatting: undefined });
  });

  it('should detect indentation levels (4 spaces per level)', () => {
    const text = [
      'No indent',
      '    Level 1',  // 4 spaces
      '        Level 2',  // 8 spaces
      '            Level 3',  // 12 spaces
    ].join('\n');
    
    const result = analyzeFormatting(text);
    
    expect(result).toHaveLength(4);
    expect(result[0].formatting).toBeUndefined();
    expect(result[1].formatting).toEqual({ indentLevel: 1 });
    expect(result[2].formatting).toEqual({ indentLevel: 2 });
    expect(result[3].formatting).toEqual({ indentLevel: 3 });
  });

  it('should cap indentation at level 5', () => {
    const text = '                        Deep indent';  // 24 spaces (would be level 6)
    const result = analyzeFormatting(text);
    
    expect(result[0].formatting).toEqual({ indentLevel: 5 });
  });

  it('should preserve line breaks (empty lines)', () => {
    const text = 'First line\n\nSecond line';
    const result = analyzeFormatting(text);
    
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('First line');
    expect(result[0].formatting?.preserveLineBreaks).toBe(true);
    expect(result[1].text).toBe('Second line');
  });

  it('should handle multiple consecutive empty lines', () => {
    const text = 'First\n\n\nSecond';
    const result = analyzeFormatting(text);
    
    expect(result).toHaveLength(2);
    expect(result[0].formatting?.preserveLineBreaks).toBe(true);
  });

  it('should handle verse with mixed indentation', () => {
    const text = [
      'To be, or not to be, that is the question:',
      '    Whether \'tis nobler in the mind to suffer',
      '    The slings and arrows of outrageous fortune,',
      'Or to take arms against a sea of troubles',
    ].join('\n');
    
    const result = analyzeFormatting(text);
    
    expect(result).toHaveLength(4);
    expect(result[0].formatting).toBeUndefined();
    expect(result[1].formatting).toEqual({ indentLevel: 1 });
    expect(result[2].formatting).toEqual({ indentLevel: 1 });
    expect(result[3].formatting).toBeUndefined();
  });

  it('should trim whitespace from text content', () => {
    const text = '   Indented text   \n\t\tTabbed text\t\t';
    const result = analyzeFormatting(text);
    
    expect(result[0].text).toBe('Indented text');
    expect(result[1].text).toBe('Tabbed text');
  });

  it('should handle empty input', () => {
    const result = analyzeFormatting('');
    expect(result).toEqual([]);
  });

  it('should handle input with only whitespace', () => {
    const result = analyzeFormatting('   \n\n\t\t\n   ');
    expect(result).toEqual([]);
  });

  it('should preserve paragraph structure', () => {
    const text = [
      'First paragraph line 1',
      'First paragraph line 2',
      '',
      'Second paragraph line 1',
      'Second paragraph line 2',
    ].join('\n');
    
    const result = analyzeFormatting(text);
    
    expect(result).toHaveLength(4);
    expect(result[1].formatting?.preserveLineBreaks).toBe(true);
  });
});
