import pdfParse from "pdf-parse";
import mammoth from "mammoth";

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
