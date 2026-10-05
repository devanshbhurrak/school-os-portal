"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listDocuments, deleteDocument, getDownloadUrl } from "@/services/documents";
import type { Document, DocumentEntityType } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { showMutationError } from "@/lib/error-messages";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState } from "@/components/patterns/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Card, CardContent } from "@/components/ui/card";
import { UploadWidget } from "./upload-widget";

const DOC_TYPE_LABELS: Record<string, string> = {
  PHOTO: "Photo",
  ID_PROOF: "ID Proof",
  BIRTH_CERTIFICATE: "Birth Certificate",
  CERTIFICATE: "Certificate",
  TRANSCRIPT: "Transcript",
  REPORT_CARD: "Report Card",
  OTHER: "Other",
};

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentCardProps {
  doc: Document;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

function DocumentCard({ doc, onDownload, onDelete }: DocumentCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <p className="font-medium truncate">{doc.original_filename}</p>
              <Badge variant="secondary">
                {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {doc.file_size != null && <span>{formatFileSize(doc.file_size)}</span>}
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <PermissionGate permission={PERMISSIONS.document.read}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDownload(doc)}
                aria-label="Download document"
              >
                <Download className="size-4" />
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.document.delete}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(doc)}
                aria-label="Delete document"
              >
                <Trash2 className="size-4" />
              </Button>
            </PermissionGate>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentsTabProps {
  entityType: DocumentEntityType;
  entityId: string;
}

export function DocumentsTab({ entityType, entityId }: DocumentsTabProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const queryKey = schoolKeys.documents(schoolId, { entity_type: entityType, entity_id: entityId });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => listDocuments({ entity_type: entityType, entity_id: entityId }),
    enabled: !!schoolId && !!entityId,
    staleTime: STALE_TIME.entity,
  });

  const documents = data?.items ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      toast.success("Document deleted");
      void queryClient.invalidateQueries({ queryKey });
      setDeleteTarget(null);
    },
    onError: (err) => {
      showMutationError(err);
    },
  });

  async function handleDownload(doc: Document) {
    try {
      const { download_url } = await getDownloadUrl(doc.id);
      window.open(download_url, "_blank");
    } catch (err) {
      showMutationError(err);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {documents.length === 0
            ? "No documents uploaded yet."
            : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
        </p>
        <PermissionGate permission={PERMISSIONS.document.create}>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="size-4" />
            Upload
          </Button>
        </PermissionGate>
      </div>

      {documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDownload={handleDownload}
              onDelete={(target) => setDeleteTarget(target)}
            />
          ))}
        </div>
      )}

      <UploadWidget
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        entityType={entityType}
        entityId={entityId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Delete document"
        description={
          deleteTarget
            ? <>Delete <span className="font-medium">{deleteTarget.original_filename}</span>? This cannot be undone.</>
            : "Delete this document?"
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
