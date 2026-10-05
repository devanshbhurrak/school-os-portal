"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { linkParentToStudent, listChildren, listStudents, unlinkParent } from "@/services";
import type { ParentRelationship, Student, StudentParentLink } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { showMutationError } from "@/lib/error-messages";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState } from "@/components/patterns/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const RELATIONSHIP_LABELS: Record<ParentRelationship, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
  GRANDPARENT: "Grandparent",
  SIBLING: "Sibling",
  OTHER: "Other",
};

function childDisplayName(link: StudentParentLink): string {
  return [link.first_name, link.last_name].filter(Boolean).join(" ") || "Unknown";
}

interface LinkChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
}

function LinkChildDialog({ open, onOpenChange, parentId }: LinkChildDialogProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [relationship, setRelationship] = useState<ParentRelationship>("GUARDIAN");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [canPickup, setCanPickup] = useState(true);

  const studentsQuery = useQuery({
    queryKey: schoolKeys.students(schoolId, { search: search || undefined }),
    queryFn: () => listStudents({ search: search || undefined }),
    enabled: open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      linkParentToStudent(selectedStudentId, {
        parent_id: parentId,
        relationship,
        is_primary: isPrimary,
        is_emergency_contact: isEmergency,
        can_pickup: canPickup,
      }),
    onSuccess: () => {
      toast.success("Child linked");
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.parentChildren(schoolId, parentId),
      });
      onOpenChange(false);
      setSelectedStudentId("");
      setSearch("");
    },
    onError: (err) => {
      showMutationError(err);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link child</DialogTitle>
          <DialogDescription>
            Search for a student and link them to this parent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="child_search">Search student</Label>
            <Input
              id="child_search"
              placeholder="Type to search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="student_select">Student *</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger id="student_select" className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {(studentsQuery.data?.items ?? []).map((s: Student) => (
                  <SelectItem key={s.id} value={s.id}>
                    {[s.person_first_name, s.person_last_name].filter(Boolean).join(" ")}
                    {s.admission_number ? ` (${s.admission_number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="relationship">Relationship</Label>
            <Select
              value={relationship}
              onValueChange={(v) => setRelationship(v as ParentRelationship)}
            >
              <SelectTrigger id="relationship" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RELATIONSHIP_LABELS) as ParentRelationship[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RELATIONSHIP_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded"
              />
              Primary contact
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="rounded"
              />
              Emergency contact
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={canPickup}
                onChange={(e) => setCanPickup(e.target.checked)}
                className="rounded"
              />
              Can pick up
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={linkMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => linkMutation.mutate()}
            disabled={!selectedStudentId || linkMutation.isPending}
          >
            {linkMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Link child
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ChildCardProps {
  link: StudentParentLink;
  onRemove: (link: StudentParentLink) => void;
}

function ChildCard({ link, onRemove }: ChildCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{childDisplayName(link)}</p>
              <Badge variant="secondary">
                {RELATIONSHIP_LABELS[link.relationship as ParentRelationship] ?? link.relationship}
              </Badge>
              {link.is_primary && (
                <Badge variant="outline" className="text-xs">Primary</Badge>
              )}
              {link.is_emergency_contact && (
                <Badge variant="destructive" className="text-xs">Emergency</Badge>
              )}
              {link.can_pickup && (
                <Badge variant="outline" className="text-xs">Can pick up</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {link.primary_email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {link.primary_email}
                </span>
              )}
              {link.primary_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />
                  {link.primary_phone}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <PermissionGate permission={PERMISSIONS.studentParent.delete}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onRemove(link)}
                aria-label="Unlink child"
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

export function ChildrenTab({ parentId }: { parentId: string }) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [linkOpen, setLinkOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<StudentParentLink | null>(null);

  const { data: children, isLoading, isError, error, refetch } = useQuery({
    queryKey: schoolKeys.parentChildren(schoolId, parentId),
    queryFn: () => listChildren(parentId),
    enabled: !!schoolId && !!parentId,
    staleTime: STALE_TIME.entity,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => unlinkParent(id),
    onSuccess: () => {
      toast.success("Child unlinked");
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.parentChildren(schoolId, parentId),
      });
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
          {(children ?? []).length === 0
            ? "No children linked to this parent."
            : `${(children ?? []).length} child${(children ?? []).length !== 1 ? "ren" : ""}`}
        </p>
        <PermissionGate permission={PERMISSIONS.studentParent.create}>
          <Button size="sm" onClick={() => setLinkOpen(true)}>
            <Plus className="size-4" />
            Link child
          </Button>
        </PermissionGate>
      </div>

      {(children ?? []).length > 0 && (
        <div className="space-y-3">
          {(children ?? []).map((link) => (
            <ChildCard
              key={link.id}
              link={link}
              onRemove={(target) => setRemoveTarget(target)}
            />
          ))}
        </div>
      )}

      <LinkChildDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        parentId={parentId}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}
        title="Unlink child"
        description={
          removeTarget
            ? <>Unlink <span className="font-medium">{childDisplayName(removeTarget)}</span> from this parent? The student record will not be deleted.</>
            : "Unlink this child?"
        }
        confirmLabel="Unlink"
        destructive
        onConfirm={() => {
          if (removeTarget) removeMutation.mutate(removeTarget.id);
        }}
      />
    </div>
  );
}
