import type { ID, ISODate, ISODateTime } from "./api";

export type EnrollmentStatus = "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "COMPLETED"
export type EnrollmentType = "REGULAR" | "TRANSFER_IN" | "REPEAT" | "PROMOTION" | "TEMPORARY"

export interface Enrollment {
  id: string
  school_id: string
  student_id: string
  academic_year_id: string
  academic_class_id: string
  cohort_id: string
  roll_number: string | null
  start_date: string
  end_date: string | null
  enrollment_type: EnrollmentType
  status: EnrollmentStatus
  version: number
  created_at: string
  updated_at: string
  student_name?: string
  cohort_name?: string
  academic_year_name?: string
}

export interface EnrollmentCreate {
  student_id: string
  academic_year_id: string
  academic_class_id: string
  cohort_id: string
  roll_number?: string
  start_date: string
  enrollment_type?: EnrollmentType
}

export interface EnrollmentUpdate {
  roll_number?: string | null
  end_date?: string | null
  status?: EnrollmentStatus
  version: number
}

export interface EnrollmentTransfer {
  new_cohort_id: string
  new_academic_class_id: string
  effective_date: string
  reason?: string
  version: number
}

export type StudentStatus = "ACTIVE" | "WITHDRAWN" | "GRADUATED" | "TRANSFERRED" | "INACTIVE" | "DECEASED";

export interface Student {
  id: ID;
  school_id: ID;
  organization_id: ID;
  person_id: ID;
  admission_number: string;
  admission_date: ISODate;
  status: StudentStatus;
  withdrawal_date: ISODate | null;
  withdrawal_reason: string | null;
  person_first_name: string;
  person_last_name: string | null;
  person_primary_email: string | null;
  person_primary_phone: string | null;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface StudentCreate {
  person_id: ID;
  admission_number: string;
  admission_date: ISODate;
  status?: StudentStatus;
}

export interface StudentUpdate {
  admission_number?: string;
  admission_date?: ISODate;
  status?: StudentStatus;
  withdrawal_date?: ISODate | null;
  withdrawal_reason?: string | null;
  version: number;
}

export interface StudentListParams {
  search?: string;
  status?: StudentStatus;
  limit?: number;
  cursor?: string;
}

export type GuardianRelationship = "FATHER" | "MOTHER" | "GUARDIAN" | "GRANDPARENT" | "SIBLING" | "OTHER";

export interface Guardian {
  id: string;
  school_id: string;
  student_id: string;
  guardian_person_id: string;
  relationship: GuardianRelationship;
  is_primary: boolean;
  is_emergency_contact: boolean;
  can_pickup: boolean;
  created_at: string;
  updated_at: string;
  guardian_first_name?: string;
  guardian_last_name?: string | null;
  guardian_email?: string | null;
  guardian_phone?: string | null;
  version: number;
}

export interface GuardianCreate {
  student_id: string;
  guardian_person_id: string;
  relationship: GuardianRelationship;
  is_primary?: boolean;
  is_emergency_contact?: boolean;
  can_pickup?: boolean;
}

export interface GuardianUpdate {
  relationship?: GuardianRelationship;
  is_primary?: boolean;
  is_emergency_contact?: boolean;
  can_pickup?: boolean;
  version: number;
}
