"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { uploadImport, downloadTemplate } from "@/services/import-jobs";
import { PermissionGate } from "@/components/ui/permission-gate";
import { PERMISSIONS } from "@/lib/permissions";
import type { ImportJob, ImportResourceType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RESOURCE_OPTIONS: { value: ImportResourceType; label: string }[] = [
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
];

const COLUMN_PREVIEW: Record<ImportResourceType, string[]> = {
  students: ["first_name", "last_name", "primary_email", "primary_phone", "admission_number", "admission_date", "status"],
  teachers: ["first_name", "last_name", "primary_email", "primary_phone", "employee_number", "designation", "joining_date", "status"],
};

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportWizard() {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resourceType, setResourceType] = useState<ImportResourceType>("students");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportJob | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !selectedFile) throw new Error("Missing required data");
      return uploadImport(schoolId, resourceType, selectedFile);
    },
    onSuccess: (job) => {
      setResult(job);
      setStep(3);
    },
  });

  async function handleDownloadTemplate() {
    if (!schoolId) return;
    const blob = await downloadTemplate(schoolId, resourceType);
    triggerBlobDownload(blob, `${resourceType}-template.csv`);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
  }

  function handleReset() {
    setStep(1);
    setSelectedFile(null);
    setResult(null);
    uploadMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <PermissionGate permission={PERMISSIONS.bulkImport.import.create}>
      <div className="space-y-6">
        {/* Step indicators */}
        <div className="flex gap-4 text-sm">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1 ${step === s ? "font-semibold text-primary" : "text-muted-foreground"}`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {s}
              </span>
              {s === 1 && "Choose type"}
              {s === 2 && "Upload file"}
              {s === 3 && "Result"}
            </div>
          ))}
        </div>

        {/* Step 1: Choose resource type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select the type of records to import.</p>
            <div className="flex gap-4">
              {RESOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResourceType(opt.value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${resourceType === opt.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Import {opt.label.toLowerCase()} via CSV
                  </div>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        )}

        {/* Step 2: Download template + upload file */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <p className="text-sm font-medium">Step 1: Download the template</p>
              <p className="text-xs text-muted-foreground">
                Use the CSV template to ensure your data matches the required format.
              </p>
              <div className="flex flex-wrap gap-1">
                {COLUMN_PREVIEW[resourceType].map((col) => (
                  <Badge key={col} variant="secondary">{col}</Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                Download {resourceType} template
              </Button>
            </div>

            <div className="rounded-md border p-4 space-y-2">
              <p className="text-sm font-medium">Step 2: Upload your CSV file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block text-sm"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                disabled={!selectedFile || uploadMutation.isPending}
                onClick={() => uploadMutation.mutate()}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload & Import"}
              </Button>
            </div>

            {uploadMutation.isError && (
              <p className="text-sm text-destructive">
                Upload failed. Please try again.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div className="space-y-4">
            {result.status === "COMPLETED" && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Import complete — {result.success_rows} record{result.success_rows !== 1 ? "s" : ""} imported successfully.
                </p>
              </div>
            )}

            {result.status === "PARTIAL" && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-sm font-semibold text-yellow-800">
                  Partial import — {result.success_rows} succeeded, {result.failed_rows} failed.
                </p>
              </div>
            )}

            {result.status === "FAILED" && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Import failed — no records were imported.
                </p>
              </div>
            )}

            {result.error_summary && result.error_summary.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Errors</p>
                <div className="rounded-md border overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.error_summary.map((err, i) => (
                        <TableRow key={i}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.field}</TableCell>
                          <TableCell>{err.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button variant="outline" onClick={handleReset}>Import more</Button>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
