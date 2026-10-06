"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/services/documents";
import type { DocumentEntityType, DocumentType } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys } from "@/lib/query-keys";
import { showMutationError } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "PHOTO", label: "Photo" },
  { value: "ID_PROOF", label: "ID Proof" },
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "TRANSCRIPT", label: "Transcript" },
  { value: "REPORT_CARD", label: "Report Card" },
  { value: "OTHER", label: "Other" },
];

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt";

interface UploadWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: DocumentEntityType;
  entityId: string;
}

export function UploadWidget({ open, onOpenChange, entityType, entityId }: UploadWidgetProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("OTHER");

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      return uploadDocument(
        {
          entity_type: entityType,
          entity_id: entityId,
          document_type: documentType,
          original_filename: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
        },
        file,
      );
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.documents(schoolId, { entity_type: entityType, entity_id: entityId }),
      });
      resetAndClose();
    },
    onError: (err) => {
      showMutationError(err);
    },
  });

  function resetAndClose() {
    setFile(null);
    setDocumentType("OTHER");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="doc-type">Document type</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
              <SelectTrigger id="doc-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-input">File</Label>
            <input
              ref={fileInputRef}
              id="file-input"
              type="file"
              accept={ACCEPTED_TYPES}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                if (selected && selected.size > MAX_FILE_SIZE) {
                  toast.error(`File "${selected.name}" exceeds the 10 MB size limit.`);
                  e.target.value = "";
                  setFile(null);
                  return;
                }
                setFile(selected);
              }}
            />
            {file && !uploadMutation.isPending && (
              <p className="text-xs text-muted-foreground">
                {file.name} &mdash; {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>

          {uploadMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>
                Uploading{file ? ` "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : ""}…
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
          >
            <Upload className="size-4" />
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
