// Types et interfaces pour le système de congés
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: string;
  cellule?: string;
  service?: string;
  leaveBalance: number;
  position: string;
}

export type UserRole = 'employee' | 'cell_manager' | 'service_chief' | 'hr' | 'admin';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  status: LeaveStatus;
  submittedAt: string;
  cellManagerApproval?: {
    date: string;
    comment?: string;
    approver: string;
  };
  serviceChiefApproval?: {
    date: string;
    comment?: string;
    approver: string;
  };
  hrApproval?: {
    date: string;
    comment?: string;
    approver: string;
  };
}

export type LeaveStatus = 
  | 'pending_cell_manager'
  | 'pending_service_chief' 
  | 'pending_hr'
  | 'approved'
  | 'rejected';

export interface LeaveType {
  id: string;
  name: string;
  maxDays: number;
  description: string;
}