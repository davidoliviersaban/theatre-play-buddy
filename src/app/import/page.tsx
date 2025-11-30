import Link from "next/link";
import { Upload, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardContent } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <IconButton icon={ArrowLeft} variant="ghost" className="mb-8" asChild>
          <Link href="/">Back to Library</Link>
        </IconButton>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Import Play</h1>
          <p className="mt-2 text-muted-foreground">
            Upload your script to start rehearsing. Supported formats: PDF, TXT,
            DOCX.
          </p>
        </div>

        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-secondary p-4">
              <Upload className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Drag and drop your script here
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              or click to browse from your computer
            </p>
            <Button>Select File</Button>
          </CardContent>
        </Card>

        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Recent Imports</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-green-500/10 p-2">
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Romeo_and_Juliet_Full.pdf</p>
                  <p className="text-xs text-muted-foreground">
                    Imported 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center text-green-500">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
