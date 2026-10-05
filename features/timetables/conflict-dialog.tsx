"use client";

import type { ConflictItem } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictItem[];
}

export function ConflictDialog({ open, onOpenChange, conflicts }: ConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Timetable Conflicts Found</DialogTitle>
          <DialogDescription>
            The following conflicts were found. Resolve them before publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Day</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Entity</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((c, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Badge
                      className={
                        c.conflict_type === "TEACHER"
                          ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                      }
                    >
                      {c.conflict_type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{c.day_of_week}</td>
                  <td className="px-3 py-2">{c.period}</td>
                  <td className="px-3 py-2 font-medium">{c.entity_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
