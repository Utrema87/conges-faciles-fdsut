/**
 * Service d'Audit
 * 
 * Ce service gère l'enregistrement de toutes les actions importantes
 * effectuées dans le système pour assurer la traçabilité et la conformité.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export enum AuditActionType {
  // Actions utilisateur
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  
  // Actions sur les demandes de congés
  LEAVE_REQUEST_CREATED = 'leave_request_created',
  LEAVE_REQUEST_UPDATED = 'leave_request_updated',
  LEAVE_REQUEST_CANCELLED = 'leave_request_cancelled',
  LEAVE_REQUEST_APPROVED = 'leave_request_approved',
  LEAVE_REQUEST_REJECTED = 'leave_request_rejected',
  
  // Actions de validation
  APPROVAL_N1 = 'approval_n1',
  APPROVAL_N2 = 'approval_n2',
  APPROVAL_HR = 'approval_hr',
  REJECTION_N1 = 'rejection_n1',
  REJECTION_N2 = 'rejection_n2',
  REJECTION_HR = 'rejection_hr',
  
  // Actions administratives
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  SETTINGS_UPDATED = 'settings_updated',
  
  // Sécurité
  FAILED_LOGIN_ATTEMPT = 'failed_login_attempt',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
}

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  actionType: AuditActionType;
  userId: string;
  userEmail?: string;
  userRole?: string;
  targetType: 'user' | 'leave_request' | 'system' | 'auth';
  targetId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AuditQueryOptions {
  userId?: string;
  actionType?: AuditActionType;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: string[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// SERVICE D'AUDIT
// ============================================================================

export class AuditService {
  /**
   * Enregistrer une action dans les logs d'audit
   */
  static async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const logEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      // En production, cela devrait être sauvegardé dans une table Supabase
      // Pour l'instant, on log dans la console en mode développement
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', {
          time: logEntry.timestamp.toISOString(),
          action: logEntry.actionType,
          user: logEntry.userEmail || logEntry.userId,
          description: logEntry.description,
          severity: logEntry.severity,
          metadata: logEntry.metadata,
        });
      }

      // TODO: Implémenter l'insertion dans une table audit_logs
      /*
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action_type: logEntry.actionType,
          user_id: logEntry.userId,
          user_email: logEntry.userEmail,
          user_role: logEntry.userRole,
          target_type: logEntry.targetType,
          target_id: logEntry.targetId,
          description: logEntry.description,
          metadata: logEntry.metadata,
          ip_address: logEntry.ipAddress,
          user_agent: logEntry.userAgent,
          severity: logEntry.severity,
          created_at: logEntry.timestamp.toISOString(),
        });

      if (error) {
        console.error('[AuditService] Failed to log audit entry:', error);
        return false;
      }
      */

      return true;
    } catch (error) {
      console.error('[AuditService] Error logging audit entry:', error);
      return false;
    }
  }

  /**
   * Enregistrer une connexion utilisateur
   */
  static async logLogin(userId: string, userEmail: string, success: boolean): Promise<void> {
    await this.log({
      actionType: success ? AuditActionType.USER_LOGIN : AuditActionType.FAILED_LOGIN_ATTEMPT,
      userId,
      userEmail,
      targetType: 'auth',
      description: success 
        ? `Connexion réussie pour ${userEmail}`
        : `Échec de connexion pour ${userEmail}`,
      severity: success ? 'info' : 'warning',
      metadata: {
        success,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Enregistrer une déconnexion
   */
  static async logLogout(userId: string, userEmail: string): Promise<void> {
    await this.log({
      actionType: AuditActionType.USER_LOGOUT,
      userId,
      userEmail,
      targetType: 'auth',
      description: `Déconnexion de ${userEmail}`,
      severity: 'info',
    });
  }

  /**
   * Enregistrer la création d'une demande de congé
   */
  static async logLeaveRequestCreated(
    userId: string,
    requestId: string,
    details: { leaveType: string; startDate: string; endDate: string; days: number }
  ): Promise<void> {
    await this.log({
      actionType: AuditActionType.LEAVE_REQUEST_CREATED,
      userId,
      targetType: 'leave_request',
      targetId: requestId,
      description: `Demande de congé créée : ${details.leaveType} (${details.days} jours)`,
      severity: 'info',
      metadata: details,
    });
  }

  /**
   * Enregistrer une validation de demande
   */
  static async logApproval(
    approverId: string,
    approverEmail: string,
    approverRole: string,
    requestId: string,
    level: 'N1' | 'N2' | 'HR',
    comment?: string
  ): Promise<void> {
    const actionTypes: Record<typeof level, AuditActionType> = {
      N1: AuditActionType.APPROVAL_N1,
      N2: AuditActionType.APPROVAL_N2,
      HR: AuditActionType.APPROVAL_HR,
    };

    const levelLabels = {
      N1: 'Chef de Cellule',
      N2: 'Chef de Service',
      HR: 'RH',
    };

    await this.log({
      actionType: actionTypes[level],
      userId: approverId,
      userEmail: approverEmail,
      userRole: approverRole,
      targetType: 'leave_request',
      targetId: requestId,
      description: `Validation ${levelLabels[level]} approuvée pour la demande ${requestId}`,
      severity: 'info',
      metadata: {
        level,
        comment,
        approvalTimestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Enregistrer un rejet de demande
   */
  static async logRejection(
    rejectorId: string,
    rejectorEmail: string,
    rejectorRole: string,
    requestId: string,
    level: 'N1' | 'N2' | 'HR',
    reason: string
  ): Promise<void> {
    const actionTypes: Record<typeof level, AuditActionType> = {
      N1: AuditActionType.REJECTION_N1,
      N2: AuditActionType.REJECTION_N2,
      HR: AuditActionType.REJECTION_HR,
    };

    const levelLabels = {
      N1: 'Chef de Cellule',
      N2: 'Chef de Service',
      HR: 'RH',
    };

    await this.log({
      actionType: actionTypes[level],
      userId: rejectorId,
      userEmail: rejectorEmail,
      userRole: rejectorRole,
      targetType: 'leave_request',
      targetId: requestId,
      description: `Demande ${requestId} rejetée par ${levelLabels[level]}`,
      severity: 'warning',
      metadata: {
        level,
        reason,
        rejectionTimestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Enregistrer une tentative d'accès non autorisé
   */
  static async logUnauthorizedAccess(
    userId: string,
    resource: string,
    action: string
  ): Promise<void> {
    await this.log({
      actionType: AuditActionType.UNAUTHORIZED_ACCESS_ATTEMPT,
      userId,
      targetType: 'system',
      description: `Tentative d'accès non autorisé : ${action} sur ${resource}`,
      severity: 'critical',
      metadata: {
        resource,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Récupérer les logs d'audit avec filtres
   */
  static async queryLogs(options: AuditQueryOptions): Promise<AuditLogEntry[]> {
    try {
      // TODO: Implémenter la requête vers la table audit_logs
      /*
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.actionType) {
        query = query.eq('action_type', options.actionType);
      }

      if (options.targetType) {
        query = query.eq('target_type', options.targetType);
      }

      if (options.targetId) {
        query = query.eq('target_id', options.targetId);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options.severity && options.severity.length > 0) {
        query = query.in('severity', options.severity);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AuditService] Query error:', error);
        return [];
      }

      return data || [];
      */

      // Placeholder : retourner un tableau vide pour l'instant
      console.log('[AuditService] Query logs with options:', options);
      return [];
    } catch (error) {
      console.error('[AuditService] Error querying logs:', error);
      return [];
    }
  }

  /**
   * Obtenir un résumé des activités récentes
   */
  static async getActivitySummary(userId: string, days: number = 7): Promise<{
    totalActions: number;
    byActionType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.queryLogs({
      userId,
      startDate,
      limit: 1000,
    });

    const byActionType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    logs.forEach(log => {
      byActionType[log.actionType] = (byActionType[log.actionType] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      byActionType,
      bySeverity,
    };
  }
}
