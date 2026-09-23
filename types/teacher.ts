import type { ID, ISODate, ISODateTime } from "./api";

export type TeacherStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED" | "INACTIVE";
export type AssignmentRole = "SUBJECT_TEACHER" | "CLASS_TEACHER" | "SUBSTITUTE" | "COORDINATOR";
export type AssignmentStatus = "ACTIVE" | "ENDED";

export interface Teacher {
  id: ID;
  school_id: ID;
  organization_id: ID;
  person_id: ID;
  employee_number: string | null;
  designation: string | null;
  joining_date: ISODate | null;
  leaving_date: ISODate | null;
  status: TeacherStatus;
  person_first_name: string;
  person_last_name: string | null;
  person_primary_email: string | null;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface TeacherCreate {
  person_id: ID;
  employee_number?: string | null;
  designation?: string | null;
  joining_date?: ISODate | null;
  status?: TeacherStatus;
}

export interface TeacherUpdate {
  employee_number?: string | null;
  designation?: string | null;
  joining_date?: ISODate | null;
  leaving_date?: ISODate | null;
  status?: TeacherStatus;
  version: number;
}

export interface TeacherAssignment {
  id: ID;
  school_id: ID;
  organization_id: ID;
  teacher_id: ID;
  cohort_id: ID;
  subject_id: ID | null;
  academic_year_id: ID;
  role: AssignmentRole;
  start_date: ISODate;
  end_date: ISODate | null;
  status: AssignmentStatus;
  teacher_person_first_name: string;
  teacher_person_last_name: string | null;
  cohort_name: string;
  subject_name: string | null;
  academic_year_code: string;
  version: number;
  created_at: ISODateTime;
}

export interface TeacherAssignmentCreate {
  teacher_id: ID;
  cohort_id: ID;
  subject_id?: ID | null;
  academic_year_id: ID;
  role: AssignmentRole;
  start_date: ISODate;
}

export interface TeacherAssignmentUpdate {
  end_date?: ISODate | null;
  status?: AssignmentStatus;
  version: number;
}
