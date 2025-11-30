"use client";

import React from "react";
import Link from "next/link";
import { Upload, ArrowLeft } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "../../components/import/file-upload";
import { ParseProgress } from "../../components/import/parse-progress";

export default function ImportPage() {
  const [uploadInfo, setUploadInfo] = React.useState<{
    uploadId: string;
    filename: string;
    size: number;
  } | null>(null);
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
            {/* Real upload component */}
            <div className="mt-4">
              <FileUpload onUploaded={setUploadInfo} />
            </div>
          </CardContent>
        </Card>

        {uploadInfo && (
          <div className="mt-12 space-y-4">
            <h2 className="text-lg font-semibold">Parsing Progress</h2>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Uploaded: {uploadInfo.filename} ({uploadInfo.size} bytes)
              </p>
              <ParseProgress uploadId={uploadInfo.uploadId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
