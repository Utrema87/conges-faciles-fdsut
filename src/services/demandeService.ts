/**
 * Service de Gestion des Demandes de Congé
 * 
 * Ce service encapsule toutes les interactions avec l'API Supabase
 * pour la gestion des demandes de congé (CRUD, validation, recherche, statistiques)
 */

import { supabase } from '@/integrations/supabase/client';
import { LeaveStatus } from '@/types';
import { DbLeaveRequest } from '@/types/database';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface CreateLeaveRequestData {
  user_id: string;
  type: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface UpdateLeaveRequestData {
  type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: string;
  approver_id?: string;
  approved_at?: string;
}

export interface LeaveRequestFilters {
  userId?: string;
  status?: LeaveStatus;
  type?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

export interface LeaveRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class DemandeService {
  /**
   * Créer une nouvelle demande de congé
   */
  static async createLeaveRequest(data: CreateLeaveRequestData): Promise<{ 
    success: boolean; 
    request?: DbLeaveRequest; 
    error?: string 
  }> {
    try {
      const insertData = {
        user_id: data.user_id,
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason || null,
        status: 'pending',
      };

      const { data: request, error } = await (supabase
        .from('leave_requests' as any)
        .insert(insertData)
        .select()
        .single() as any) as { data: DbLeaveRequest | null; error: any };

      if (error) {
        console.error('[DemandeService] Create error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        request: request || undefined,
      };
    } catch (error: any) {
      console.error('[DemandeService] Create exception:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    }
  }

  /**
   * Récupérer une demande par ID
   */
  static async getLeaveRequestById(requestId: string): Promise<DbLeaveRequest | null> {
    try {
      const { data, error } = await (supabase
        .from('leave_requests' as any)
        .select('*')
        .eq('id', requestId)
        .maybeSingle() as any) as { data: DbLeaveRequest | null; error: any };

      if (error) {
        console.error('[DemandeService] Get by ID error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[DemandeService] Get by ID exception:', error);
      return null;
    }
  }

  /**
   * Récupérer toutes les demandes d'un utilisateur
   */
  static async getLeaveRequestsByUser(userId: string): Promise<DbLeaveRequest[]> {
    try {
      const { data, error } = await (supabase
        .from('leave_requests' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as any) as { data: DbLeaveRequest[] | null; error: any };

      if (error) {
        console.error('[DemandeService] Get by user error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[DemandeService] Get by user exception:', error);
      return [];
    }
  }

  /**
   * Récupérer les demandes avec filtres
   */
  static async getLeaveRequestsWithFilters(filters: LeaveRequestFilters): Promise<DbLeaveRequest[]> {
    try {
      let query = supabase
        .from('leave_requests' as any)
        .select('*');

      // Appliquer les filtres
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.startDateFrom) {
        query = query.gte('start_date', filters.startDateFrom);
      }

      if (filters.startDateTo) {
        query = query.lte('start_date', filters.startDateTo);
      }

      if (filters.endDateFrom) {
        query = query.gte('end_date', filters.endDateFrom);
      }

      if (filters.endDateTo) {
        query = query.lte('end_date', filters.endDateTo);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await (query as any) as { data: DbLeaveRequest[] | null; error: any };

      if (error) {
        console.error('[DemandeService] Get with filters error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[DemandeService] Get with filters exception:', error);
      return [];
    }
  }

  /**
   * Récupérer les demandes en attente pour un approbateur
   */
  static async getPendingRequestsForApprover(status: LeaveStatus): Promise<DbLeaveRequest[]> {
    try {
      const { data, error } = await (supabase
        .from('leave_requests' as any)
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true }) as any) as { data: DbLeaveRequest[] | null; error: any };

      if (error) {
        console.error('[DemandeService] Get pending error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[DemandeService] Get pending exception:', error);
      return [];
    }
  }

  /**
   * Mettre à jour une demande de congé
   */
  static async updateLeaveRequest(
    requestId: string, 
    updates: UpdateLeaveRequestData
  ): Promise<{ success: boolean; request?: DbLeaveRequest; error?: string }> {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.reason !== undefined) updateData.reason = updates.reason;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.approver_id !== undefined) updateData.approver_id = updates.approver_id;
      if (updates.approved_at !== undefined) updateData.approved_at = updates.approved_at;

      const { data, error } = await (supabase
        .from('leave_requests' as any)
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single() as any) as { data: DbLeaveRequest | null; error: any };

      if (error) {
        console.error('[DemandeService] Update error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        request: data || undefined,
      };
    } catch (error: any) {
      console.error('[DemandeService] Update exception:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    }
  }

  /**
   * Approuver une demande de congé
   */
  static async approveLeaveRequest(
    requestId: string, 
    approverId: string, 
    nextStatus: LeaveStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase
        .from('leave_requests' as any)
        .update({
          status: nextStatus,
          approver_id: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId) as any);

      if (error) {
        console.error('[DemandeService] Approve error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[DemandeService] Approve exception:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    }
  }

  /**
   * Rejeter une demande de congé
   */
  static async rejectLeaveRequest(
    requestId: string, 
    approverId: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: Record<string, any> = {
        status: 'rejected',
        approver_id: approverId,
        approved_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.reason = reason;
      }

      const { error } = await (supabase
        .from('leave_requests' as any)
        .update(updateData)
        .eq('id', requestId) as any);

      if (error) {
        console.error('[DemandeService] Reject error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[DemandeService] Reject exception:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    }
  }

  /**
   * Supprimer une demande de congé (soft delete via status)
   */
  static async cancelLeaveRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase
        .from('leave_requests' as any)
        .update({ status: 'cancelled' })
        .eq('id', requestId) as any);

      if (error) {
        console.error('[DemandeService] Cancel error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[DemandeService] Cancel exception:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    }
  }

  /**
   * Récupérer les statistiques des demandes
   */
  static async getLeaveRequestStats(userId?: string): Promise<LeaveRequestStats> {
    try {
      let query = supabase
        .from('leave_requests' as any)
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await (query as any) as { data: DbLeaveRequest[] | null; error: any };

      if (error) {
        console.error('[DemandeService] Get stats error:', error);
        return this.getEmptyStats();
      }

      const requests = data || [];

      // Calculer les statistiques
      const stats: LeaveRequestStats = {
        total: requests.length,
        pending: requests.filter(r => r.status?.startsWith('pending')).length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        byType: {},
        byMonth: {},
      };

      // Grouper par type
      requests.forEach(request => {
        const type = request.type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      // Grouper par mois
      requests.forEach(request => {
        if (request.created_at) {
          const month = new Date(request.created_at).toISOString().slice(0, 7);
          stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('[DemandeService] Get stats exception:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Rechercher des demandes (par nom d'employé, type, etc.)
   */
  static async searchLeaveRequests(searchTerm: string): Promise<DbLeaveRequest[]> {
    try {
      // Note: Pour une recherche avancée par nom d'employé, 
      // il faudrait joindre avec la table profiles
      const { data, error } = await (supabase
        .from('leave_requests' as any)
        .select('*')
        .or(`type.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50) as any) as { data: DbLeaveRequest[] | null; error: any };

      if (error) {
        console.error('[DemandeService] Search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[DemandeService] Search exception:', error);
      return [];
    }
  }

  /**
   * Vérifier si un utilisateur a des demandes qui se chevauchent
   */
  static async checkOverlappingRequests(
    userId: string, 
    startDate: string, 
    endDate: string,
    excludeRequestId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('leave_requests' as any)
        .select('id')
        .eq('user_id', userId)
        .neq('status', 'rejected')
        .neq('status', 'cancelled')
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId);
      }

      const { data, error } = await (query as any) as { data: { id: string }[] | null; error: any };

      if (error) {
        console.error('[DemandeService] Check overlap error:', error);
        return false;
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('[DemandeService] Check overlap exception:', error);
      return false;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES - HELPERS
  // ============================================================================

  private static getEmptyStats(): LeaveRequestStats {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byType: {},
      byMonth: {},
    };
  }

  /**
   * Convertir une demande DB en format LeaveRequest frontend
   */
  static convertToLeaveRequest(dbRequest: DbLeaveRequest): {
    id: string;
    userId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
    approverId?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: dbRequest.id,
      userId: dbRequest.user_id,
      type: dbRequest.type,
      startDate: dbRequest.start_date,
      endDate: dbRequest.end_date,
      reason: dbRequest.reason || '',
      status: (dbRequest.status || 'pending') as LeaveStatus,
      approverId: dbRequest.approver_id || undefined,
      approvedAt: dbRequest.approved_at || undefined,
      createdAt: dbRequest.created_at || new Date().toISOString(),
      updatedAt: dbRequest.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Calculer le nombre de jours ouvrés entre deux dates
   */
  static calculateBusinessDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Valider les données d'une demande de congé
   */
  static validateLeaveRequest(data: CreateLeaveRequestData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.user_id) {
      errors.push('L\'identifiant utilisateur est requis');
    }

    if (!data.type) {
      errors.push('Le type de congé est requis');
    }

    if (!data.start_date) {
      errors.push('La date de début est requise');
    }

    if (!data.end_date) {
      errors.push('La date de fin est requise');
    }

    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      
      if (start > end) {
        errors.push('La date de début doit être antérieure à la date de fin');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        errors.push('La date de début ne peut pas être dans le passé');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
