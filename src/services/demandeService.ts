/**
 * Service de Gestion des Demandes de Congé
 * 
 * Ce service encapsule toutes les interactions avec l'API Supabase
 * pour la gestion des demandes de congé (CRUD, validation, recherche, statistiques)
 */

import { supabase } from '@/integrations/supabase/client';
import { LeaveRequest, LeaveStatus } from '@/types';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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

type DbLeaveRequest = Tables<'leave_requests'>;

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
      const insertData: TablesInsert<'leave_requests'> = {
        user_id: data.user_id,
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason || null,
        status: 'pending',
      };

      const { data: request, error } = await supabase
        .from('leave_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[DemandeService] Create error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        request: request,
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
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

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
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
        .from('leave_requests')
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

      const { data, error } = await query;

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
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true });

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
      const updateData: TablesUpdate<'leave_requests'> = {};
      
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.reason !== undefined) updateData.reason = updates.reason;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.approver_id !== undefined) updateData.approver_id = updates.approver_id;
      if (updates.approved_at !== undefined) updateData.approved_at = updates.approved_at;

      const { data, error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('[DemandeService] Update error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        request: data,
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
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: nextStatus,
          approver_id: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

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
      const updateData: TablesUpdate<'leave_requests'> = {
        status: 'rejected',
        approver_id: approverId,
        approved_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.reason = reason;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', requestId);

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
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

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
        .from('leave_requests')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

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
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .or(`type.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50);

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
        .from('leave_requests')
        .select('id')
        .eq('user_id', userId)
        .neq('status', 'rejected')
        .neq('status', 'cancelled')
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId);
      }

      const { data, error } = await query;

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
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calculer le nombre de jours ouvrés entre deux dates
 */
export function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Exclure samedi (6) et dimanche (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Formater une date pour l'affichage
 */
export function formatLeaveDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Obtenir le libellé d'un statut
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'En attente',
    'pending_cell_manager': 'En attente - Responsable de cellule',
    'pending_service_chief': 'En attente - Chef de service',
    'pending_hr': 'En attente - RH',
    'approved': 'Approuvée',
    'rejected': 'Rejetée',
    'cancelled': 'Annulée',
  };

  return labels[status] || status;
}

/**
 * Obtenir la couleur associée à un statut
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'pending': 'warning',
    'pending_cell_manager': 'info',
    'pending_service_chief': 'info',
    'pending_hr': 'info',
    'approved': 'success',
    'rejected': 'error',
    'cancelled': 'secondary',
  };

  return colors[status] || 'default';
}
