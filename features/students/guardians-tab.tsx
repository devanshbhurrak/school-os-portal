"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listGuardians, removeGuardian } from "@/services";
import type { Guardian } from "@/types";
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
import { GuardianFormDialog } from "./guardian-form-dialog";

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
  GRANDPARENT: "Grandparent",
  SIBLING: "Sibling",
  OTHER: "Other",
};

function guardianDisplayName(g: Guardian): string {
  return [g.guardian_first_name, g.guardian_last_name].filter(Boolean).join(" ") || "Unknown";
}

interface GuardianCardProps {
  guardian: Guardian;
  onEdit: (g: Guardian) => void;
  onRemove: (g: Guardian) => void;
}

function GuardianCard({ guardian, onEdit, onRemove }: GuardianCardProps) {
  return (
    <Card className={guardian.is_primary ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{guardianDisplayName(guardian)}</p>
              {guardian.is_primary && (
                <Star className="size-4 fill-yellow-400 text-yellow-400 shrink-0" aria-label="Primary guardian" />
              )}
              <Badge variant="secondary">
                {RELATIONSHIP_LABELS[guardian.relationship] ?? guardian.relationship}
              </Badge>
              {guardian.is_emergency_contact && (
                <Badge variant="destructive" className="text-xs">Emergency</Badge>
              )}
              {guardian.can_pickup && (
                <Badge variant="outline" className="text-xs">Can pick up</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {guardian.guardian_email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {guardian.guardian_email}
                </span>
              )}
              {guardian.guardian_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />
                  {guardian.guardian_phone}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <PermissionGate permission={PERMISSIONS.guardian.update}>
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(guardian)} aria-label="Edit guardian">
                <Pencil className="size-4" />
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.guardian.delete}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onRemove(guardian)}
                aria-label="Remove guardian"
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

export function GuardiansTab({ studentId }: { studentId: string }) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editGuardian, setEditGuardian] = useState<Guardian | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Guardian | null>(null);

  const { data: guardians, isLoading, isError, error, refetch } = useQuery({
    queryKey: schoolKeys.guardians(schoolId, studentId),
    queryFn: () => listGuardians(studentId),
    enabled: !!schoolId && !!studentId,
    staleTime: STALE_TIME.entity,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeGuardian(id),
    onSuccess: () => {
      toast.success("Guardian removed");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.guardians(schoolId, studentId) });
      setRemoveTarget(null);
    },
    onError: (err) => {
      showMutationError(err);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
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
          {guardians?.length === 0
            ? "No guardians linked to this student."
            : `${guardians?.length} guardian${(guardians?.length ?? 0) !== 1 ? "s" : ""}`}
        </p>
        <PermissionGate permission={PERMISSIONS.guardian.create}>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add guardian
          </Button>
        </PermissionGate>
      </div>

      {(guardians ?? []).length > 0 && (
        <div className="space-y-3">
          {(guardians ?? []).map((g) => (
            <GuardianCard
              key={g.id}
              guardian={g}
              onEdit={(target) => setEditGuardian(target)}
              onRemove={(target) => setRemoveTarget(target)}
            />
          ))}
        </div>
      )}

      <GuardianFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        studentId={studentId}
      />

      <GuardianFormDialog
        open={!!editGuardian}
        onOpenChange={(v) => { if (!v) setEditGuardian(null); }}
        studentId={studentId}
        guardian={editGuardian}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}
        title="Remove guardian"
        description={
          removeTarget
            ? <>Remove <span className="font-medium">{guardianDisplayName(removeTarget)}</span> as a guardian for this student?</>
            : "Remove this guardian?"
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removeTarget) removeMutation.mutate(removeTarget.id);
        }}
      />
    </div>
  );
}
