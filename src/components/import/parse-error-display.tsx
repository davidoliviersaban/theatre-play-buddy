"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ParseErrorDisplayProps {
  error: string;
  code?: string;
  onRetry?: () => void;
}

export function ParseErrorDisplay({
  error,
  code,
  onRetry,
}: ParseErrorDisplayProps) {
  const hints = getErrorHints(code);

  return (
    <Card className="border-destructive">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-destructive">Parse Failed</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            {code && (
              <p className="text-xs text-muted-foreground">
                Error code: {code}
              </p>
            )}
            {hints && (
              <div className="mt-4 rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Suggestions:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {hints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getErrorHints(code?: string): string[] | null {
  switch (code) {
    case "VALIDATION_ERROR":
      return [
        "Check that the uploaded file is a valid play script",
        "Ensure the script has clear character names and dialogue",
        "Try a different file format (PDF, DOCX, or TXT)",
      ];
    case "EXTRACTION_ERROR":
      return [
        "The file may be corrupted or password-protected",
        "Try converting to a different format",
        "Ensure the PDF is text-based, not scanned images",
      ];
    case "LLM_ERROR":
      return [
        "Check your API key configuration in .env.local",
        "Verify you have sufficient API credits",
        "The script may be too large - try splitting into acts",
      ];
    default:
      return null;
  }
}
