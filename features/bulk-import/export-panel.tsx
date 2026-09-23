"use client";

import { useState } from "react";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { downloadExport } from "@/services/import-jobs";
import { PermissionGate } from "@/components/ui/permission-gate";
import { PERMISSIONS } from "@/lib/permissions";
import type { ImportResourceType } from "@/types";
import { Button } from "@/components/ui/button";

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? null;
  const [loading, setLoading] = useState<ImportResourceType | null>(null);

  async function handleExport(resourceType: ImportResourceType) {
    if (!schoolId) return;
    setLoading(resourceType);
    try {
      const blob = await downloadExport(schoolId, resourceType);
      triggerBlobDownload(blob, `${resourceType}-export.csv`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <PermissionGate permission={PERMISSIONS.bulkImport.export.create}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download all records for this school as a CSV file.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            disabled={loading === "students"}
            onClick={() => handleExport("students")}
          >
            {loading === "students" ? "Exporting..." : "Export Students (CSV)"}
          </Button>
          <Button
            variant="outline"
            disabled={loading === "teachers"}
            onClick={() => handleExport("teachers")}
          >
            {loading === "teachers" ? "Exporting..." : "Export Teachers (CSV)"}
          </Button>
        </div>
      </div>
    </PermissionGate>
  );
}
