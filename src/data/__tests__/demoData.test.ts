import { describe, it, expect, beforeEach } from 'vitest'
import { 
  demoUsers, 
  demoLeaveRequests, 
  getLeaveRequestsByEmployee,
  getPendingRequestsForCellManager,
  getPendingRequestsForServiceChief,
  getPendingRequestsForHR,
  addNewLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '@/data/demoData'
import { LeaveRequest } from '@/types'

describe('demoData utility functions', () => {
  beforeEach(() => {
    // Reset demo data before each test
    demoLeaveRequests.length = 0
    demoLeaveRequests.push(
      {
        id: '1',
        employeeId: 'emp1',
        employeeName: 'John Doe',
        leaveType: 'Congé annuel',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        days: 5,
        reason: 'Vacations',
        status: 'pending_cell_manager',
        urgency: 'normal',
        submittedAt: '2024-01-01T00:00:00Z',
      }
    )
  })

  describe('getLeaveRequestsByEmployee', () => {
    it('should return leave requests for specific employee', () => {
      const requests = getLeaveRequestsByEmployee('emp1')
      expect(requests).toHaveLength(1)
      expect(requests[0].employeeId).toBe('emp1')
    })

    it('should return empty array for non-existent employee', () => {
      const requests = getLeaveRequestsByEmployee('non-existent')
      expect(requests).toHaveLength(0)
    })
  })

  describe('getPendingRequestsForCellManager', () => {
    it('should return pending requests for specific cell', () => {
      const requests = getPendingRequestsForCellManager('IT')
      expect(requests).toHaveLength(1)
      expect(requests[0].status).toBe('pending_cell_manager')
    })
  })

  describe('addNewLeaveRequest', () => {
    it('should add new leave request to demo data', () => {
      const newRequest: LeaveRequest = {
        id: '2',
        employeeId: 'emp2',
        employeeName: 'Jane Smith',
        leaveType: 'Congé annuel',
        startDate: '2024-02-15',
        endDate: '2024-02-20',
        days: 5,
        reason: 'Personal',
        status: 'pending_cell_manager',
        urgency: 'normal',
        submittedAt: '2024-01-02T00:00:00Z',
      }

      const initialLength = demoLeaveRequests.length
      addNewLeaveRequest(newRequest)
      
      expect(demoLeaveRequests).toHaveLength(initialLength + 1)
      expect(demoLeaveRequests[demoLeaveRequests.length - 1]).toEqual(newRequest)
    })
  })

  describe('approveLeaveRequest', () => {
    it('should approve leave request with cell manager approval', () => {
      approveLeaveRequest('1', 'Manager Name', 'cell_manager', 'Approved by cell manager')
      
      const request = demoLeaveRequests.find(r => r.id === '1')
      expect(request?.status).toBe('pending_service_chief')
      expect(request?.cellManagerApproval?.approver).toBe('Manager Name')
      expect(request?.cellManagerApproval?.comment).toBe('Approved by cell manager')
    })

    it('should approve leave request with HR approval', () => {
      // First approve by cell manager
      approveLeaveRequest('1', 'Manager Name', 'cell_manager')
      // Then approve by service chief
      approveLeaveRequest('1', 'Service Chief', 'service_chief')
      // Finally approve by HR
      approveLeaveRequest('1', 'HR Name', 'hr', 'Final approval')
      
      const request = demoLeaveRequests.find(r => r.id === '1')
      expect(request?.status).toBe('approved')
      expect(request?.hrApproval?.approver).toBe('HR Name')
    })
  })

  describe('rejectLeaveRequest', () => {
    it('should reject leave request', () => {
      rejectLeaveRequest('1', 'Manager Name', 'cell_manager', 'Insufficient leave balance')
      
      const request = demoLeaveRequests.find(r => r.id === '1')
      expect(request?.status).toBe('rejected')
      expect(request?.cellManagerApproval?.approver).toBe('Manager Name')
      expect(request?.cellManagerApproval?.comment).toBe('Insufficient leave balance')
    })
  })
})