/**
 * Types de base de données locaux
 * Ces types correspondent au schéma Supabase défini
 */

export interface DbProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  must_change_password: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DbUserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'hr' | 'service_chief' | 'cell_manager' | 'employee';
  created_at: string | null;
}

export interface DbLeaveRequest {
  id: string;
  user_id: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string | null;
  approver_id: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DbConflictRule {
  id: string;
  department: string;
  period_start: string | null;
  period_end: string | null;
  min_employees_required: number;
  max_concurrent_leaves: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface DbServiceSubstitution {
  id: string;
  original_user_id: string;
  substitute_user_id: string;
  department: string;
  start_date: string;
  end_date: string;
  created_at: string | null;
}
