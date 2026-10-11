import { describe, it, expect } from "vitest";
import { notificationHref } from "@/features/notifications/notification-links";

describe("notificationHref", () => {
  it("deep-links announcements to the announcement detail page", () => {
    expect(
      notificationHref({ type: "ANNOUNCEMENT", related_entity_type: "announcement", related_entity_id: "abc123" }),
    ).toBe("/announcements/abc123");
  });

  it("deep-links attendance sessions with a session query param", () => {
    expect(
      notificationHref({
        type: "ATTENDANCE",
        related_entity_type: "attendance_session",
        related_entity_id: "sess-1",
      }),
    ).toBe("/attendance?session=sess-1");
  });

  it("deep-links students and enrollments to the student page", () => {
    expect(
      notificationHref({ type: "ENROLLMENT", related_entity_type: "student", related_entity_id: "stu-1" }),
    ).toBe("/students/stu-1");
    expect(
      notificationHref({ type: "ENROLLMENT", related_entity_type: "enrollment", related_entity_id: "enr-1" }),
    ).toBe("/students/enr-1");
  });

  it("deep-links teachers to the teacher profile", () => {
    expect(
      notificationHref({ type: "SYSTEM", related_entity_type: "teacher", related_entity_id: "t-1" }),
    ).toBe("/teachers/t-1");
  });

  it("falls back to the notifications page when there is no related entity", () => {
    expect(
      notificationHref({ type: "SYSTEM", related_entity_type: null, related_entity_id: null }),
    ).toBe("/notifications");
  });

  it("falls back for unknown entity types", () => {
    expect(
      notificationHref({ type: "SYSTEM", related_entity_type: "mystery", related_entity_id: "x" }),
    ).toBe("/notifications");
  });
});
