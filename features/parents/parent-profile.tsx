"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Pencil, Phone, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { deleteParent, getParent } from "@/services";
import type { Parent } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { showMutationError } from "@/lib/error-messages";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParentFormDialog } from "./parent-form-dialog";
import { ChildrenTab } from "./children-tab";

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function parentDisplayName(parent: Parent): string {
  return [parent.first_name, parent.last_name].filter(Boolean).join(" ");
}

export function ParentProfile({ parentId }: { parentId: string }) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: parent, isLoading, isError, error, refetch } = useQuery({
    queryKey: schoolKeys.parent(schoolId, parentId),
    queryFn: () => getParent(parentId),
    enabled: !!schoolId && !!parentId,
    staleTime: STALE_TIME.entity,
  });

  async function handleDelete() {
    if (!parent) return;
    try {
      await deleteParent(parent.id, parent.version);
      toast.success("Parent deleted");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.parents(schoolId) });
      router.push("/parents");
    } catch (err) {
      showMutationError(err);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !parent) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/parents")}
            aria-label="Back to parents"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{parentDisplayName(parent)}</h1>
            <p className="text-sm text-muted-foreground">
              {parent.primary_email ?? parent.primary_phone ?? "No contact info"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <PermissionGate permission={PERMISSIONS.parent.update}>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.parent.delete}>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Parent information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Status" value={<StatusBadge status={parent.status} />} />
              <InfoItem label="Occupation" value={parent.occupation} />
              <InfoItem label="Workplace" value={parent.workplace} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Name" value={parentDisplayName(parent)} />
              <InfoItem
                label="Email"
                value={
                  parent.primary_email ? (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3" />
                      {parent.primary_email}
                    </span>
                  ) : null
                }
              />
              <InfoItem
                label="Phone"
                value={
                  parent.primary_phone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {parent.primary_phone}
                    </span>
                  ) : null
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="children" className="pt-4">
          <ChildrenTab parentId={parentId} />
        </TabsContent>
      </Tabs>

      <ParentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        parent={parent}
        onSaved={(updated) => {
          queryClient.setQueryData(schoolKeys.parent(schoolId, updated.id), updated);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete parent"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{parentDisplayName(parent)}</span>.
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete parent"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
