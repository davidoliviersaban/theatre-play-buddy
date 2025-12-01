import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export interface FormattingMetadata {
    indentLevel?: number;  // Relative indentation (0 = no indent, 1+ = indented)
    preserveLineBreaks?: boolean;  // Whether to preserve line breaks within text
}

export interface ExtractedLine {
    text: string;
    formatting?: FormattingMetadata;
}

/**
 * Analyzes a line to detect indentation level based on leading whitespace.
 * Returns 0 for no indent, 1-5 for increasing indent levels.
 */
function detectIndentLevel(line: string): number {
    const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
    // Map spaces to indent levels (4 spaces per level)
    return Math.min(5, Math.floor(leadingSpaces / 4));
}

/**
 * Preserves structural formatting by analyzing line-by-line indentation.
 * Used for formats where whitespace is meaningful (verse, poetry).
 */
export function analyzeFormatting(text: string): ExtractedLine[] {
    const lines = text.split('\n');
    const result: ExtractedLine[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            // Preserve empty lines as line breaks
            if (result.length > 0) {
                result[result.length - 1].formatting = result[result.length - 1].formatting || {};
                result[result.length - 1].formatting!.preserveLineBreaks = true;
            }
            continue;
        }

        const indentLevel = detectIndentLevel(line);
        result.push({
            text: trimmed,
            formatting: indentLevel > 0 ? { indentLevel } : undefined
        });
    }

    return result;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer);
        if (!data.text) {
            throw new Error("PDF parsing succeeded but no text was extracted");
        }
        return data.text;
    } catch (error) {
        throw new Error(`PDF extraction failed: ${(error as Error).message}`);
    }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
        const res = await mammoth.extractRawText({ buffer });
        if (!res.value) {
            throw new Error("DOCX parsing succeeded but no text was extracted");
        }
        return res.value;
    } catch (error) {
        throw new Error(`DOCX extraction failed: ${(error as Error).message}`);
    }
}

export async function extractTextFromTXT(buffer: Buffer): Promise<string> {
    return buffer.toString("utf8");
}
