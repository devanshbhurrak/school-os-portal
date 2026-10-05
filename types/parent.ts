export type ParentStatus = "ACTIVE" | "INACTIVE";
export type ParentRelationship = "FATHER" | "MOTHER" | "GUARDIAN" | "GRANDPARENT" | "SIBLING" | "OTHER";

export interface Parent {
  id: string;
  person_id: string;
  school_id: string;
  first_name: string;
  last_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  occupation: string | null;
  workplace: string | null;
  status: ParentStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ParentCreate {
  person_id: string;
  occupation?: string | null;
  workplace?: string | null;
}

export interface ParentUpdate {
  occupation?: string | null;
  workplace?: string | null;
  status?: ParentStatus;
  version: number;
}

export interface StudentParentLink {
  id: string;
  student_id: string;
  parent_id: string;
  relationship: ParentRelationship;
  is_primary: boolean;
  is_emergency_contact: boolean;
  can_pickup: boolean;
  first_name: string;
  last_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  occupation: string | null;
  workplace: string | null;
  created_at: string;
}

export interface StudentParentCreate {
  parent_id: string;
  relationship: ParentRelationship;
  is_primary?: boolean;
  is_emergency_contact?: boolean;
  can_pickup?: boolean;
}

export interface ParentListParams {
  search?: string;
  status_filter?: ParentStatus;
  cursor?: string;
  limit?: number;
}
