/**
 * Service de Détection des Conflits de Congés
 * 
 * Gère la détection intelligente des conflits avec règles paramétrables :
 * - Vérification de la présence minimale par service
 * - Prise en compte des remplacements temporaires
 * - Règles spécifiques par période et département
 */

import { supabase } from '@/integrations/supabase/client';
import { DbLeaveRequest, DbConflictRule, DbServiceSubstitution, DbProfile } from '@/types/database';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface ConflictDetectionParams {
  userId: string;
  department: string;
  startDate: string;
  endDate: string;
  excludeRequestId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: 'MIN_EMPLOYEES' | 'MAX_CONCURRENT' | 'OVERLAPPING' | 'CUSTOM';
  message?: string;
  details?: {
    currentAbsences?: number;
    minRequired?: number;
    maxAllowed?: number;
    affectedEmployees?: string[];
    substitutionsAvailable?: boolean;
  };
}

export interface ConflictRule {
  id: string;
  department: string;
  periodStart?: string;
  periodEnd?: string;
  minEmployeesRequired: number;
  maxConcurrentLeaves?: number;
  isActive: boolean;
}

export interface ServiceSubstitution {
  id: string;
  originalUserId: string;
  substituteUserId: string;
  department: string;
  startDate: string;
  endDate: string;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class ConflictDetectionService {
  /**
   * Détecte les conflits pour une demande de congé donnée
   */
  static async detectConflicts(params: ConflictDetectionParams): Promise<ConflictResult> {
    try {
      // 1. Récupérer les règles applicables pour ce département et cette période
      const rules = await this.getApplicableRules(params.department, params.startDate, params.endDate);

      // 2. Récupérer les demandes existantes qui se chevauchent
      const overlappingRequests = await this.getOverlappingRequests(
        params.department,
        params.startDate,
        params.endDate,
        params.excludeRequestId
      );

      // 3. Récupérer les remplacements actifs pendant cette période
      const substitutions = await this.getActiveSubstitutions(
        params.department,
        params.startDate,
        params.endDate
      );

      // 4. Calculer le nombre d'employés effectivement absents (en tenant compte des remplacements)
      const effectiveAbsences = this.calculateEffectiveAbsences(
        overlappingRequests,
        substitutions
      );

      // 5. Obtenir le nombre total d'employés du département
      const totalEmployees = await this.getDepartmentEmployeeCount(params.department);

      // 6. Vérifier les règles de conflit
      return this.evaluateConflictRules(
        rules,
        effectiveAbsences,
        totalEmployees,
        overlappingRequests,
        substitutions
      );
    } catch (error) {
      console.error('[ConflictDetectionService] Error detecting conflicts:', error);
      return {
        hasConflict: false,
        message: 'Erreur lors de la vérification des conflits',
      };
    }
  }

  /**
   * Récupère les règles applicables pour un département et une période
   */
  private static async getApplicableRules(
    department: string,
    startDate: string,
    endDate: string
  ): Promise<DbConflictRule[]> {
    try {
      const { data, error } = await (supabase
        .from('conflict_rules' as any)
        .select('*')
        .eq('department', department)
        .eq('is_active', true)
        .or(
          `and(period_start.is.null,period_end.is.null),` +
          `and(period_start.lte.${endDate},period_end.gte.${startDate}),` +
          `and(period_start.lte.${endDate},period_end.is.null),` +
          `and(period_start.is.null,period_end.gte.${startDate})`
        ) as any) as { data: DbConflictRule[] | null; error: any };

      if (error) {
        console.error('[ConflictDetectionService] Error fetching rules:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ConflictDetectionService] Exception fetching rules:', error);
      return [];
    }
  }

  /**
   * Récupère les demandes qui se chevauchent avec la période donnée
   */
  private static async getOverlappingRequests(
    department: string,
    startDate: string,
    endDate: string,
    excludeRequestId?: string
  ): Promise<DbLeaveRequest[]> {
    try {
      // Récupérer les utilisateurs du département
      const { data: profiles, error: profilesError } = await (supabase
        .from('profiles' as any)
        .select('user_id')
        .eq('department', department) as any) as { data: { user_id: string }[] | null; error: any };

      if (profilesError || !profiles) {
        console.error('[ConflictDetectionService] Error fetching profiles:', profilesError);
        return [];
      }

      const userIds = profiles.map(p => p.user_id);

      if (userIds.length === 0) {
        return [];
      }

      // Récupérer les demandes approuvées ou en attente qui se chevauchent
      let query = supabase
        .from('leave_requests' as any)
        .select('*')
        .in('user_id', userIds)
        .in('status', ['approved', 'pending', 'pending_cell_manager', 'pending_service_chief', 'pending_hr'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId);
      }

      const { data, error } = await (query as any) as { data: DbLeaveRequest[] | null; error: any };

      if (error) {
        console.error('[ConflictDetectionService] Error fetching requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ConflictDetectionService] Exception fetching requests:', error);
      return [];
    }
  }

  /**
   * Récupère les remplacements actifs pour une période donnée
   */
  private static async getActiveSubstitutions(
    department: string,
    startDate: string,
    endDate: string
  ): Promise<DbServiceSubstitution[]> {
    try {
      const { data, error } = await (supabase
        .from('service_substitutions' as any)
        .select('*')
        .eq('department', department)
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`) as any) as { data: DbServiceSubstitution[] | null; error: any };

      if (error) {
        console.error('[ConflictDetectionService] Error fetching substitutions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ConflictDetectionService] Exception fetching substitutions:', error);
      return [];
    }
  }

  /**
   * Calcule le nombre d'absences effectives en tenant compte des remplacements
   */
  private static calculateEffectiveAbsences(
    requests: DbLeaveRequest[],
    substitutions: DbServiceSubstitution[]
  ): number {
    // Compter les employés uniques en congé
    const uniqueAbsentees = new Set(requests.map(r => r.user_id));
    
    // Soustraire ceux qui ont un remplaçant
    substitutions.forEach(sub => {
      if (uniqueAbsentees.has(sub.original_user_id)) {
        // Si l'employé absent a un remplaçant, on ne compte pas l'absence
        uniqueAbsentees.delete(sub.original_user_id);
      }
    });

    return uniqueAbsentees.size;
  }

  /**
   * Obtient le nombre total d'employés dans un département
   */
  private static async getDepartmentEmployeeCount(department: string): Promise<number> {
    try {
      const { count, error } = await (supabase
        .from('profiles' as any)
        .select('*', { count: 'exact', head: true })
        .eq('department', department) as any);

      if (error) {
        console.error('[ConflictDetectionService] Error counting employees:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[ConflictDetectionService] Exception counting employees:', error);
      return 0;
    }
  }

  /**
   * Évalue les règles de conflit et retourne le résultat
   */
  private static evaluateConflictRules(
    rules: DbConflictRule[],
    effectiveAbsences: number,
    totalEmployees: number,
    requests: DbLeaveRequest[],
    substitutions: DbServiceSubstitution[]
  ): ConflictResult {
    // Si aucune règle définie, pas de conflit
    if (rules.length === 0) {
      return { hasConflict: false };
    }

    // Prendre la règle la plus restrictive
    const mostRestrictiveRule = rules.reduce((prev, current) => {
      if (current.min_employees_required > (prev.min_employees_required || 0)) {
        return current;
      }
      return prev;
    }, rules[0]);

    const employeesPresent = totalEmployees - effectiveAbsences - 1; // -1 pour la nouvelle demande

    // Vérification de la présence minimale
    if (employeesPresent < mostRestrictiveRule.min_employees_required) {
      return {
        hasConflict: true,
        conflictType: 'MIN_EMPLOYEES',
        message: `Présence minimale non respectée. ${mostRestrictiveRule.min_employees_required} employé(s) requis, mais seulement ${employeesPresent} serai(en)t présent(s).`,
        details: {
          currentAbsences: effectiveAbsences + 1,
          minRequired: mostRestrictiveRule.min_employees_required,
          affectedEmployees: requests.map(r => r.user_id),
          substitutionsAvailable: substitutions.length > 0,
        },
      };
    }

    // Vérification du nombre maximum de congés simultanés
    if (mostRestrictiveRule.max_concurrent_leaves !== null) {
      const totalConcurrentLeaves = effectiveAbsences + 1;
      if (totalConcurrentLeaves > mostRestrictiveRule.max_concurrent_leaves) {
        return {
          hasConflict: true,
          conflictType: 'MAX_CONCURRENT',
          message: `Nombre maximum de congés simultanés dépassé. Maximum autorisé: ${mostRestrictiveRule.max_concurrent_leaves}, demandé: ${totalConcurrentLeaves}.`,
          details: {
            currentAbsences: effectiveAbsences + 1,
            maxAllowed: mostRestrictiveRule.max_concurrent_leaves,
            affectedEmployees: requests.map(r => r.user_id),
            substitutionsAvailable: substitutions.length > 0,
          },
        };
      }
    }

    // Aucun conflit détecté
    return {
      hasConflict: false,
      message: 'Aucun conflit détecté',
      details: {
        currentAbsences: effectiveAbsences + 1,
        minRequired: mostRestrictiveRule.min_employees_required,
        maxAllowed: mostRestrictiveRule.max_concurrent_leaves || undefined,
        substitutionsAvailable: substitutions.length > 0,
      },
    };
  }

  // ============================================================================
  // GESTION DES RÈGLES DE CONFLITS
  // ============================================================================

  /**
   * Créer une nouvelle règle de conflit
   */
  static async createConflictRule(rule: Omit<ConflictRule, 'id'>): Promise<{ 
    success: boolean; 
    rule?: DbConflictRule; 
    error?: string 
  }> {
    try {
      const { data, error } = await (supabase
        .from('conflict_rules' as any)
        .insert({
          department: rule.department,
          period_start: rule.periodStart || null,
          period_end: rule.periodEnd || null,
          min_employees_required: rule.minEmployeesRequired,
          max_concurrent_leaves: rule.maxConcurrentLeaves || null,
          is_active: rule.isActive,
        })
        .select()
        .single() as any) as { data: DbConflictRule | null; error: any };

      if (error) {
        console.error('[ConflictDetectionService] Create rule error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, rule: data || undefined };
    } catch (error: any) {
      console.error('[ConflictDetectionService] Create rule exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour une règle existante
   */
  static async updateConflictRule(
    ruleId: string,
    updates: Partial<ConflictRule>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      
      if (updates.periodStart !== undefined) updateData.period_start = updates.periodStart;
      if (updates.periodEnd !== undefined) updateData.period_end = updates.periodEnd;
      if (updates.minEmployeesRequired !== undefined) updateData.min_employees_required = updates.minEmployeesRequired;
      if (updates.maxConcurrentLeaves !== undefined) updateData.max_concurrent_leaves = updates.maxConcurrentLeaves;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await (supabase
        .from('conflict_rules' as any)
        .update(updateData)
        .eq('id', ruleId) as any);

      if (error) {
        console.error('[ConflictDetectionService] Update rule error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ConflictDetectionService] Update rule exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer toutes les règles d'un département
   */
  static async getConflictRulesByDepartment(department: string): Promise<DbConflictRule[]> {
    try {
      const { data, error } = await (supabase
        .from('conflict_rules' as any)
        .select('*')
        .eq('department', department)
        .order('created_at', { ascending: false }) as any) as { data: DbConflictRule[] | null; error: any };

      if (error) {
        console.error('[ConflictDetectionService] Get rules error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ConflictDetectionService] Get rules exception:', error);
      return [];
    }
  }

  // ============================================================================
  // GESTION DES REMPLACEMENTS
  // ============================================================================

  /**
   * Créer un remplacement temporaire
   */
  static async createSubstitution(substitution: Omit<ServiceSubstitution, 'id'>): Promise<{ 
    success: boolean; 
    substitution?: DbServiceSubstitution; 
    error?: string 
  }> {
    try {
      const { data, error } = await (supabase
        .from('service_substitutions' as any)
        .insert({
          original_user_id: substitution.originalUserId,
          substitute_user_id: substitution.substituteUserId,
          department: substitution.department,
          start_date: substitution.startDate,
          end_date: substitution.endDate,
        })
        .select()
        .single() as any) as { data: DbServiceSubstitution | null; error: any };

      if (error) {
        console.error('[ConflictDetectionService] Create substitution error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, substitution: data || undefined };
    } catch (error: any) {
      console.error('[ConflictDetectionService] Create substitution exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer les remplacements pour un utilisateur
   */
  static async getSubstitutionsForUser(userId: string): Promise<DbServiceSubstitution[]> {
    try {
      const { data, error } = await (supabase
        .from('service_substitutions' as any)
        .select('*')
        .or(`original_user_id.eq.${userId},substitute_user_id.eq.${userId}`)
        .order('start_date', { ascending: false }) as any) as { data: DbServiceSubstitution[] | null; error: any };

      if (error) {
        console.error('[ConflictDetectionService] Get substitutions error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ConflictDetectionService] Get substitutions exception:', error);
      return [];
    }
  }

  /**
   * Supprimer un remplacement
   */
  static async deleteSubstitution(substitutionId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const { error } = await (supabase
        .from('service_substitutions' as any)
        .delete()
        .eq('id', substitutionId) as any);

      if (error) {
        console.error('[ConflictDetectionService] Delete substitution error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ConflictDetectionService] Delete substitution exception:', error);
      return { success: false, error: error.message };
    }
  }
}
