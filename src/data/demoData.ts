import { User, LeaveRequest, LeaveType } from '@/types';

export const demoUsers: User[] = [
  {
    id: '1',
    firstName: 'Amadou',
    lastName: 'Diallo',
    email: 'amadou.diallo@fdsut.com',
    role: 'employee',
    department: 'Informatique',
    cellule: 'Développement',
    service: 'IT',
    leaveBalance: 25,
    position: 'Développeur Senior'
  },
  {
    id: '2',
    firstName: 'Fatou',
    lastName: 'Ndiaye',
    email: 'fatou.ndiaye@fdsut.com',
    role: 'hr',
    department: 'Ressources Humaines',
    service: 'RH',
    leaveBalance: 22,
    position: 'Responsable RH'
  },
  {
    id: '3',
    firstName: 'Ousmane',
    lastName: 'Ba',
    email: 'ousmane.ba@fdsut.com',
    role: 'cell_manager',
    department: 'Informatique',
    cellule: 'Développement',
    service: 'IT',
    leaveBalance: 20,
    position: 'Chef de Cellule Développement'
  },
  {
    id: '4',
    firstName: 'Awa',
    lastName: 'Sarr',
    email: 'awa.sarr@fdsut.com',
    role: 'admin',
    department: 'Administration',
    service: 'Administration',
    leaveBalance: 18,
    position: 'Administrateur Système'
  },
  {
    id: '5',
    firstName: 'Ibrahima',
    lastName: 'Fall',
    email: 'ibrahima.fall@fdsut.com',
    role: 'service_chief',
    department: 'Informatique',
    service: 'IT',
    leaveBalance: 15,
    position: 'Chef de Service IT'
  },
  {
    id: '6',
    firstName: 'Mariama',
    lastName: 'Cissé',
    email: 'mariama.cisse@fdsut.com',
    role: 'employee',
    department: 'Informatique',
    cellule: 'Support',
    service: 'IT',
    leaveBalance: 28,
    position: 'Technicienne Support'
  },
  {
    id: '7',
    firstName: 'Moussa',
    lastName: 'Touré',
    email: 'moussa.toure@fdsut.com',
    role: 'employee',
    department: 'Finances',
    cellule: 'Comptabilité',
    service: 'Finance',
    leaveBalance: 12,
    position: 'Comptable'
  }
];

export const demoLeaveTypes: LeaveType[] = [
  { id: '1', name: 'Congé Annuel', maxDays: 30, description: 'Congés payés annuels' },
  { id: '2', name: 'Congé Maladie', maxDays: 90, description: 'Arrêt maladie avec certificat médical' },
  { id: '3', name: 'Congé Maternité', maxDays: 98, description: 'Congé de maternité' },
  { id: '4', name: 'Congé sans Solde', maxDays: 365, description: 'Congé exceptionnel sans rémunération' },
  { id: '5', name: 'Permission Exceptionnelle', maxDays: 3, description: 'Permission courte durée' }
];

export const demoLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Amadou Diallo',
    leaveType: 'Congé Annuel',
    startDate: '2024-01-15',
    endDate: '2024-01-25',
    days: 8,
    reason: 'Vacances familiales',
    urgency: 'normal',
    status: 'pending_cell_manager',
    submittedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    employeeId: '6',
    employeeName: 'Mariama Cissé',
    leaveType: 'Congé Maladie',
    startDate: '2024-01-12',
    endDate: '2024-01-14',
    days: 3,
    reason: 'Consultation médicale',
    urgency: 'urgent',
    status: 'pending_service_chief',
    submittedAt: '2024-01-11T14:30:00Z',
    cellManagerApproval: {
      date: '2024-01-11T16:00:00Z',
      comment: 'Approuvé - certificat médical fourni',
      approver: 'Ousmane Ba'
    }
  },
  {
    id: '3',
    employeeId: '7',
    employeeName: 'Moussa Touré',
    leaveType: 'Permission Exceptionnelle',
    startDate: '2024-01-20',
    endDate: '2024-01-20',
    days: 1,
    reason: 'Rendez-vous administratif',
    urgency: 'normal',
    status: 'approved',
    submittedAt: '2024-01-08T09:15:00Z',
    cellManagerApproval: {
      date: '2024-01-08T11:00:00Z',
      approver: 'Ousmane Ba'
    },
    serviceChiefApproval: {
      date: '2024-01-08T15:30:00Z',
      approver: 'Ibrahima Fall'
    },
    hrApproval: {
      date: '2024-01-09T09:00:00Z',
      approver: 'Fatou Ndiaye'
    }
  }
];

// Fonctions utilitaires
export const getLeaveRequestsByEmployee = (employeeId: string): LeaveRequest[] => {
  return demoLeaveRequests.filter(request => request.employeeId === employeeId);
};

export const getPendingRequestsForCellManager = (cellule: string): LeaveRequest[] => {
  return demoLeaveRequests.filter(request => {
    const employee = demoUsers.find(u => u.firstName + ' ' + u.lastName === request.employeeName);
    return employee?.cellule === cellule && request.status === 'pending_cell_manager';
  });
};

export const getPendingRequestsForServiceChief = (service: string): LeaveRequest[] => {
  return demoLeaveRequests.filter(request => {
    const employee = demoUsers.find(u => u.firstName + ' ' + u.lastName === request.employeeName);
    return employee?.service === service && request.status === 'pending_service_chief';
  });
};

export const getPendingRequestsForHR = (): LeaveRequest[] => {
  return demoLeaveRequests.filter(request => request.status === 'pending_hr');
};