export const PERMISSIONS = {
  organization: {
    list: "iam.organization.list",
    read: "iam.organization.read",
    create: "iam.organization.create",
    update: "iam.organization.update",
    delete: "iam.organization.delete",
  },
  school: {
    list: "iam.school.list",
    read: "iam.school.read",
    create: "iam.school.create",
    update: "iam.school.update",
    delete: "iam.school.delete",
  },
  user: {
    list: "iam.user.list",
    read: "iam.user.read",
    create: "iam.user.create",
    update: "iam.user.update",
    delete: "iam.user.delete",
    invite: "iam.user.invite",
  },
  membership: {
    list: "iam.membership.list",
    read: "iam.membership.read",
    create: "iam.membership.create",
    update: "iam.membership.update",
    delete: "iam.membership.delete",
    grantRole: "iam.membership.grant_role",
    revokeRole: "iam.membership.revoke_role",
  },
  role: {
    list: "iam.role.list",
    read: "iam.role.read",
    create: "iam.role.create",
    update: "iam.role.update",
    delete: "iam.role.delete",
  },
  person: {
    list: "people.person.list",
    read: "people.person.read",
    create: "people.person.create",
    update: "people.person.update",
    delete: "people.person.delete",
    merge: "people.person.merge",
  },
  contact: {
    list: "people.contact.list",
    read: "people.contact.read",
    create: "people.contact.create",
    update: "people.contact.update",
    delete: "people.contact.delete",
  },
  address: {
    list: "people.address.list",
    read: "people.address.read",
    create: "people.address.create",
    update: "people.address.update",
    delete: "people.address.delete",
  },
  academicYear: {
    list: "academic.academic_year.list",
    read: "academic.academic_year.read",
    create: "academic.academic_year.create",
    update: "academic.academic_year.update",
    delete: "academic.academic_year.delete",
  },
  academicTerm: {
    list: "academic.academic_term.list",
    read: "academic.academic_term.read",
    create: "academic.academic_term.create",
    update: "academic.academic_term.update",
    delete: "academic.academic_term.delete",
  },
  academicClass: {
    list: "academic.academic_class.list",
    read: "academic.academic_class.read",
    create: "academic.academic_class.create",
    update: "academic.academic_class.update",
    delete: "academic.academic_class.delete",
  },
  subject: {
    list: "academic.subject.list",
    read: "academic.subject.read",
    create: "academic.subject.create",
    update: "academic.subject.update",
    delete: "academic.subject.delete",
  },
  classSubject: {
    list: "academic.class_subject.list",
    read: "academic.class_subject.read",
    create: "academic.class_subject.create",
    delete: "academic.class_subject.delete",
  },
  cohort: {
    list: "academic.cohort.list",
    read: "academic.cohort.read",
    create: "academic.cohort.create",
    update: "academic.cohort.update",
    delete: "academic.cohort.delete",
  },
  student: {
    list: "students.student.list",
    read: "students.student.read",
    create: "students.student.create",
    update: "students.student.update",
    delete: "students.student.delete",
  },
  guardian: {
    list: "students.guardian.list",
    read: "students.guardian.read",
    create: "students.guardian.create",
    update: "students.guardian.update",
    delete: "students.guardian.delete",
  },
  parent: {
    list: "parents.parent.list",
    read: "parents.parent.read",
    create: "parents.parent.create",
    update: "parents.parent.update",
    delete: "parents.parent.delete",
  },
  studentParent: {
    create: "parents.student_parent.create",
    delete: "parents.student_parent.delete",
  },
  enrollment: {
    list: "students.enrollment.list",
    read: "students.enrollment.read",
    create: "students.enrollment.create",
    update: "students.enrollment.update",
    delete: "students.enrollment.delete",
    transfer: "students.enrollment.transfer",
  },
  announcement: {
    list: "announcements.announcement.list",
    read: "announcements.announcement.read",
    create: "announcements.announcement.create",
    update: "announcements.announcement.update",
    delete: "announcements.announcement.delete",
    publish: "announcements.announcement.publish",
    archive: "announcements.announcement.archive",
  },
  teacher: {
    list: "teachers.teacher.list",
    read: "teachers.teacher.read",
    create: "teachers.teacher.create",
    update: "teachers.teacher.update",
    delete: "teachers.teacher.delete",
  },
  teacherAssignment: {
    list: "teachers.assignment.list",
    read: "teachers.assignment.read",
    create: "teachers.assignment.create",
    update: "teachers.assignment.update",
    delete: "teachers.assignment.delete",
  },
  bulkImport: {
    import: {
      list: "bulk_import.import.list",
      read: "bulk_import.import.read",
      create: "bulk_import.import.create",
    },
    export: {
      create: "bulk_import.export.create",
    },
  },
  report: {
    create: "reports.export.create",
    list: "reports.export.list",
    read: "reports.export.read",
  },
  document: {
    list: "documents.document.list",
    create: "documents.document.create",
    read: "documents.document.read",
    delete: "documents.document.delete",
  },
  timetables: {
    timetable: {
      list: "timetables.timetable.list",
      read: "timetables.timetable.read",
      create: "timetables.timetable.create",
      update: "timetables.timetable.update",
      delete: "timetables.timetable.delete",
    },
    period: {
      list: "timetables.period.list",
      read: "timetables.period.read",
      create: "timetables.period.create",
      update: "timetables.period.update",
      delete: "timetables.period.delete",
    },
    slot: {
      list: "timetables.slot.list",
      read: "timetables.slot.read",
      create: "timetables.slot.create",
      update: "timetables.slot.update",
      delete: "timetables.slot.delete",
    },
  },
  notification: {
    list: "notifications.notification.list",
    update: "notifications.notification.update",
  },
  attendance: {
    session: {
      list: "attendance.session.list",
      read: "attendance.session.read",
      create: "attendance.session.create",
      update: "attendance.session.update",
      delete: "attendance.session.delete",
      submit: "attendance.session.submit",
      amend: "attendance.session.amend",
    },
    record: {
      list: "attendance.record.list",
      update: "attendance.record.update",
    },
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/** Human-readable permission catalogue grouped for the role editor and permission matrix. */
export const PERMISSION_CATALOGUE: {
  module: string;
  moduleLabel: string;
  resources: {
    resource: string;
    resourceLabel: string;
    actions: { code: string; label: string }[];
  }[];
}[] = [
  {
    module: "students",
    moduleLabel: "Students",
    resources: [
      {
        resource: "student",
        resourceLabel: "Students",
        actions: [
          { code: PERMISSIONS.student.list, label: "View list" },
          { code: PERMISSIONS.student.read, label: "View details" },
          { code: PERMISSIONS.student.create, label: "Add" },
          { code: PERMISSIONS.student.update, label: "Edit" },
          { code: PERMISSIONS.student.delete, label: "Delete" },
        ],
      },
      {
        resource: "guardian",
        resourceLabel: "Guardians",
        actions: [
          { code: PERMISSIONS.guardian.list, label: "View list" },
          { code: PERMISSIONS.guardian.read, label: "View details" },
          { code: PERMISSIONS.guardian.create, label: "Add" },
          { code: PERMISSIONS.guardian.update, label: "Edit" },
          { code: PERMISSIONS.guardian.delete, label: "Remove" },
        ],
      },
      {
        resource: "enrollment",
        resourceLabel: "Enrollments",
        actions: [
          { code: PERMISSIONS.enrollment.list, label: "View list" },
          { code: PERMISSIONS.enrollment.read, label: "View details" },
          { code: PERMISSIONS.enrollment.create, label: "Enroll" },
          { code: PERMISSIONS.enrollment.update, label: "Edit" },
          { code: PERMISSIONS.enrollment.delete, label: "Delete" },
          { code: PERMISSIONS.enrollment.transfer, label: "Transfer" },
        ],
      },
    ],
  },
  {
    module: "parents",
    moduleLabel: "Parents",
    resources: [
      {
        resource: "parent",
        resourceLabel: "Parents",
        actions: [
          { code: PERMISSIONS.parent.list, label: "View list" },
          { code: PERMISSIONS.parent.read, label: "View details" },
          { code: PERMISSIONS.parent.create, label: "Add" },
          { code: PERMISSIONS.parent.update, label: "Edit" },
          { code: PERMISSIONS.parent.delete, label: "Delete" },
        ],
      },
      {
        resource: "student_parent",
        resourceLabel: "Student-parent links",
        actions: [
          { code: PERMISSIONS.studentParent.create, label: "Link" },
          { code: PERMISSIONS.studentParent.delete, label: "Unlink" },
        ],
      },
    ],
  },
  {
    module: "people",
    moduleLabel: "People",
    resources: [
      {
        resource: "person",
        resourceLabel: "People",
        actions: [
          { code: PERMISSIONS.person.list, label: "View list" },
          { code: PERMISSIONS.person.read, label: "View details" },
          { code: PERMISSIONS.person.create, label: "Add" },
          { code: PERMISSIONS.person.update, label: "Edit" },
          { code: PERMISSIONS.person.delete, label: "Delete" },
          { code: PERMISSIONS.person.merge, label: "Merge records" },
        ],
      },
      {
        resource: "contact",
        resourceLabel: "Contact information",
        actions: [
          { code: PERMISSIONS.contact.list, label: "View list" },
          { code: PERMISSIONS.contact.read, label: "View details" },
          { code: PERMISSIONS.contact.create, label: "Add" },
          { code: PERMISSIONS.contact.update, label: "Edit" },
          { code: PERMISSIONS.contact.delete, label: "Delete" },
        ],
      },
      {
        resource: "address",
        resourceLabel: "Addresses",
        actions: [
          { code: PERMISSIONS.address.list, label: "View list" },
          { code: PERMISSIONS.address.read, label: "View details" },
          { code: PERMISSIONS.address.create, label: "Add" },
          { code: PERMISSIONS.address.update, label: "Edit" },
          { code: PERMISSIONS.address.delete, label: "Delete" },
        ],
      },
    ],
  },
  {
    module: "academic",
    moduleLabel: "Academics",
    resources: [
      {
        resource: "academic_year",
        resourceLabel: "Academic years",
        actions: [
          { code: PERMISSIONS.academicYear.list, label: "View list" },
          { code: PERMISSIONS.academicYear.read, label: "View details" },
          { code: PERMISSIONS.academicYear.create, label: "Add" },
          { code: PERMISSIONS.academicYear.update, label: "Edit" },
          { code: PERMISSIONS.academicYear.delete, label: "Delete" },
        ],
      },
      {
        resource: "academic_term",
        resourceLabel: "Terms",
        actions: [
          { code: PERMISSIONS.academicTerm.list, label: "View list" },
          { code: PERMISSIONS.academicTerm.read, label: "View details" },
          { code: PERMISSIONS.academicTerm.create, label: "Add" },
          { code: PERMISSIONS.academicTerm.update, label: "Edit" },
          { code: PERMISSIONS.academicTerm.delete, label: "Delete" },
        ],
      },
      {
        resource: "academic_class",
        resourceLabel: "Classes",
        actions: [
          { code: PERMISSIONS.academicClass.list, label: "View list" },
          { code: PERMISSIONS.academicClass.read, label: "View details" },
          { code: PERMISSIONS.academicClass.create, label: "Add" },
          { code: PERMISSIONS.academicClass.update, label: "Edit" },
          { code: PERMISSIONS.academicClass.delete, label: "Delete" },
        ],
      },
      {
        resource: "subject",
        resourceLabel: "Subjects",
        actions: [
          { code: PERMISSIONS.subject.list, label: "View list" },
          { code: PERMISSIONS.subject.read, label: "View details" },
          { code: PERMISSIONS.subject.create, label: "Add" },
          { code: PERMISSIONS.subject.update, label: "Edit" },
          { code: PERMISSIONS.subject.delete, label: "Delete" },
        ],
      },
      {
        resource: "class_subject",
        resourceLabel: "Subject assignments",
        actions: [
          { code: PERMISSIONS.classSubject.list, label: "View list" },
          { code: PERMISSIONS.classSubject.read, label: "View details" },
          { code: PERMISSIONS.classSubject.create, label: "Assign" },
          { code: PERMISSIONS.classSubject.delete, label: "Remove" },
        ],
      },
      {
        resource: "cohort",
        resourceLabel: "Sections",
        actions: [
          { code: PERMISSIONS.cohort.list, label: "View list" },
          { code: PERMISSIONS.cohort.read, label: "View details" },
          { code: PERMISSIONS.cohort.create, label: "Add" },
          { code: PERMISSIONS.cohort.update, label: "Edit" },
          { code: PERMISSIONS.cohort.delete, label: "Delete" },
        ],
      },
    ],
  },
  {
    module: "teachers",
    moduleLabel: "Teachers",
    resources: [
      {
        resource: "teacher",
        resourceLabel: "Teachers",
        actions: [
          { code: PERMISSIONS.teacher.list, label: "View list" },
          { code: PERMISSIONS.teacher.read, label: "View details" },
          { code: PERMISSIONS.teacher.create, label: "Add" },
          { code: PERMISSIONS.teacher.update, label: "Edit" },
          { code: PERMISSIONS.teacher.delete, label: "Delete" },
        ],
      },
      {
        resource: "assignment",
        resourceLabel: "Teacher assignments",
        actions: [
          { code: PERMISSIONS.teacherAssignment.list, label: "View list" },
          { code: PERMISSIONS.teacherAssignment.read, label: "View details" },
          { code: PERMISSIONS.teacherAssignment.create, label: "Assign" },
          { code: PERMISSIONS.teacherAssignment.update, label: "Edit" },
          { code: PERMISSIONS.teacherAssignment.delete, label: "End assignment" },
        ],
      },
    ],
  },
  {
    module: "timetables",
    moduleLabel: "Timetables",
    resources: [
      {
        resource: "timetable",
        resourceLabel: "Timetables",
        actions: [
          { code: PERMISSIONS.timetables.timetable.list, label: "View list" },
          { code: PERMISSIONS.timetables.timetable.read, label: "View details" },
          { code: PERMISSIONS.timetables.timetable.create, label: "Create" },
          { code: PERMISSIONS.timetables.timetable.update, label: "Edit / Publish / Archive" },
          { code: PERMISSIONS.timetables.timetable.delete, label: "Delete" },
        ],
      },
      {
        resource: "period",
        resourceLabel: "Period definitions",
        actions: [
          { code: PERMISSIONS.timetables.period.list, label: "View list" },
          { code: PERMISSIONS.timetables.period.read, label: "View details" },
          { code: PERMISSIONS.timetables.period.create, label: "Add" },
          { code: PERMISSIONS.timetables.period.update, label: "Edit" },
          { code: PERMISSIONS.timetables.period.delete, label: "Delete" },
        ],
      },
      {
        resource: "slot",
        resourceLabel: "Timetable slots",
        actions: [
          { code: PERMISSIONS.timetables.slot.list, label: "View list" },
          { code: PERMISSIONS.timetables.slot.read, label: "View details" },
          { code: PERMISSIONS.timetables.slot.create, label: "Add" },
          { code: PERMISSIONS.timetables.slot.update, label: "Edit" },
          { code: PERMISSIONS.timetables.slot.delete, label: "Cancel" },
        ],
      },
    ],
  },
  {
    module: "attendance",
    moduleLabel: "Attendance",
    resources: [
      {
        resource: "session",
        resourceLabel: "Attendance sessions",
        actions: [
          { code: PERMISSIONS.attendance.session.list, label: "View list" },
          { code: PERMISSIONS.attendance.session.read, label: "View details" },
          { code: PERMISSIONS.attendance.session.create, label: "Create" },
          { code: PERMISSIONS.attendance.session.update, label: "Edit" },
          { code: PERMISSIONS.attendance.session.delete, label: "Delete" },
          { code: PERMISSIONS.attendance.session.submit, label: "Submit" },
          { code: PERMISSIONS.attendance.session.amend, label: "Amend" },
        ],
      },
      {
        resource: "record",
        resourceLabel: "Attendance records",
        actions: [
          { code: PERMISSIONS.attendance.record.list, label: "View list" },
          { code: PERMISSIONS.attendance.record.update, label: "Update" },
        ],
      },
    ],
  },
  {
    module: "iam",
    moduleLabel: "Settings & Access",
    resources: [
      {
        resource: "organization",
        resourceLabel: "Organizations",
        actions: [
          { code: PERMISSIONS.organization.list, label: "View list" },
          { code: PERMISSIONS.organization.read, label: "View details" },
          { code: PERMISSIONS.organization.create, label: "Add" },
          { code: PERMISSIONS.organization.update, label: "Edit" },
          { code: PERMISSIONS.organization.delete, label: "Delete" },
        ],
      },
      {
        resource: "school",
        resourceLabel: "Schools",
        actions: [
          { code: PERMISSIONS.school.list, label: "View list" },
          { code: PERMISSIONS.school.read, label: "View details" },
          { code: PERMISSIONS.school.create, label: "Add" },
          { code: PERMISSIONS.school.update, label: "Edit" },
          { code: PERMISSIONS.school.delete, label: "Delete" },
        ],
      },
      {
        resource: "user",
        resourceLabel: "User accounts",
        actions: [
          { code: PERMISSIONS.user.list, label: "View list" },
          { code: PERMISSIONS.user.read, label: "View details" },
          { code: PERMISSIONS.user.create, label: "Add" },
          { code: PERMISSIONS.user.update, label: "Edit" },
          { code: PERMISSIONS.user.delete, label: "Delete" },
          { code: PERMISSIONS.user.invite, label: "Invite" },
        ],
      },
      {
        resource: "membership",
        resourceLabel: "School access",
        actions: [
          { code: PERMISSIONS.membership.list, label: "View list" },
          { code: PERMISSIONS.membership.read, label: "View details" },
          { code: PERMISSIONS.membership.create, label: "Grant" },
          { code: PERMISSIONS.membership.update, label: "Edit" },
          { code: PERMISSIONS.membership.delete, label: "End" },
          { code: PERMISSIONS.membership.grantRole, label: "Grant roles" },
          { code: PERMISSIONS.membership.revokeRole, label: "Revoke roles" },
        ],
      },
      {
        resource: "role",
        resourceLabel: "Roles",
        actions: [
          { code: PERMISSIONS.role.list, label: "View list" },
          { code: PERMISSIONS.role.read, label: "View details" },
          { code: PERMISSIONS.role.create, label: "Add" },
          { code: PERMISSIONS.role.update, label: "Edit" },
          { code: PERMISSIONS.role.delete, label: "Delete" },
        ],
      },
    ],
  },
  {
    module: "notifications",
    moduleLabel: "Notifications",
    resources: [
      {
        resource: "notification",
        resourceLabel: "Notifications",
        actions: [
          { code: PERMISSIONS.notification.list, label: "View notifications" },
          { code: PERMISSIONS.notification.update, label: "Mark as read" },
        ],
      },
    ],
  },
  {
    module: "announcements",
    moduleLabel: "Communication",
    resources: [
      {
        resource: "announcement",
        resourceLabel: "Announcements",
        actions: [
          { code: PERMISSIONS.announcement.list, label: "View list" },
          { code: PERMISSIONS.announcement.read, label: "View details" },
          { code: PERMISSIONS.announcement.create, label: "Create" },
          { code: PERMISSIONS.announcement.update, label: "Edit" },
          { code: PERMISSIONS.announcement.delete, label: "Delete" },
          { code: PERMISSIONS.announcement.publish, label: "Publish" },
          { code: PERMISSIONS.announcement.archive, label: "Archive" },
        ],
      },
    ],
  },
  {
    module: "bulk_import",
    moduleLabel: "Data Management",
    resources: [
      {
        resource: "import",
        resourceLabel: "Bulk import",
        actions: [
          { code: PERMISSIONS.bulkImport.import.list, label: "View import jobs" },
          { code: PERMISSIONS.bulkImport.import.read, label: "View import details" },
          { code: PERMISSIONS.bulkImport.import.create, label: "Upload CSV" },
        ],
      },
      {
        resource: "export",
        resourceLabel: "Data export",
        actions: [
          { code: PERMISSIONS.bulkImport.export.create, label: "Export to CSV" },
        ],
      },
    ],
  },
  {
    module: "reports",
    moduleLabel: "Reports",
    resources: [
      {
        resource: "export",
        resourceLabel: "CSV Export",
        actions: [
          { code: PERMISSIONS.report.list, label: "View export jobs" },
          { code: PERMISSIONS.report.read, label: "View export details" },
          { code: PERMISSIONS.report.create, label: "Create export" },
        ],
      },
    ],
  },
  {
    module: "documents",
    moduleLabel: "Documents",
    resources: [
      {
        resource: "document",
        resourceLabel: "Documents",
        actions: [
          { code: PERMISSIONS.document.list, label: "View list" },
          { code: PERMISSIONS.document.read, label: "View / Download" },
          { code: PERMISSIONS.document.create, label: "Upload" },
          { code: PERMISSIONS.document.delete, label: "Delete" },
        ],
      },
    ],
  },
];
