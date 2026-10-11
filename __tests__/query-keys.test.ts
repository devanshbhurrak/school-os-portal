import { describe, it, expect } from "vitest";
import { orgKeys, platformKeys, schoolKeys } from "@/lib/query-keys";

describe("query keys", () => {
  it("scopes school keys by school id", () => {
    expect(schoolKeys.students("sch-1")).toContain("sch-1");
    expect(schoolKeys.students("sch-1")).not.toEqual(schoolKeys.students("sch-2"));
  });

  it("builds distinct notification keys per org and params", () => {
    expect(orgKeys.notifications("org-1")).not.toEqual(orgKeys.notifications("org-2"));
    expect(orgKeys.notifications("org-1", { limit: 10 })).not.toEqual(
      orgKeys.notifications("org-1", { limit: 20 }),
    );
    expect(orgKeys.unreadCount("org-1")).not.toEqual(orgKeys.notifications("org-1"));
  });

  it("builds export-job keys scoped to the school", () => {
    expect(schoolKeys.exportJobs("sch-1")).toContain("sch-1");
    expect(schoolKeys.exportJob("sch-1", "job-1")).not.toEqual(
      schoolKeys.exportJob("sch-1", "job-2"),
    );
  });

  it("builds teacher timetable slot keys with a teacher filter", () => {
    const key = schoolKeys.timetableSlots("sch-1", { teacher_id: "t-1", limit: 100 });
    expect(JSON.stringify(key)).toContain("t-1");
  });

  it("keeps platform keys separate from school keys", () => {
    expect(JSON.stringify(platformKeys.audit({ limit: 10 }))).toContain("platform");
    expect(JSON.stringify(schoolKeys.audit("sch-1", {}))).toContain("sch-1");
  });
});
