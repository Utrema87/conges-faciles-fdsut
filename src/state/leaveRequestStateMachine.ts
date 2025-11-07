/**
 * Machine à États - Workflow de Validation des Congés
 * 
 * Cette machine à états définit explicitement tous les états possibles,
 * les transitions autorisées et les conditions de garde (guards) pour 
 * le processus complet de validation des demandes de congés.
 */

import { LeaveStatus, UserRole } from '@/types';

// ============================================================================
// DÉFINITION DES ÉTATS
// ============================================================================

export enum LeaveRequestState {
  DRAFT = 'draft',                               // Brouillon (non soumis)
  PENDING_CELL_MANAGER = 'pending_cell_manager', // En attente Chef de Cellule
  PENDING_SERVICE_CHIEF = 'pending_service_chief', // En attente Chef de Service
  PENDING_HR = 'pending_hr',                     // En attente RH
  APPROVED = 'approved',                         // Approuvé (état final)
  REJECTED = 'rejected',                         // Rejeté (état final)
  CANCELLED = 'cancelled',                       // Annulé par l'employé
}

// ============================================================================
// DÉFINITION DES ÉVÉNEMENTS (TRIGGERS)
// ============================================================================

export enum LeaveRequestEvent {
  SUBMIT = 'SUBMIT',                   // Soumettre la demande
  APPROVE_N1 = 'APPROVE_N1',          // Validation Chef de Cellule
  REJECT_N1 = 'REJECT_N1',            // Rejet Chef de Cellule
  APPROVE_N2 = 'APPROVE_N2',          // Validation Chef de Service
  REJECT_N2 = 'REJECT_N2',            // Rejet Chef de Service
  APPROVE_HR = 'APPROVE_HR',          // Validation finale RH
  REJECT_HR = 'REJECT_HR',            // Rejet RH
  CANCEL = 'CANCEL',                  // Annulation par l'employé
  RETURN_TO_EMPLOYEE = 'RETURN_TO_EMPLOYEE', // Retour pour modification
}

// ============================================================================
// ACTIONS DE LA MACHINE À ÉTATS
// ============================================================================

export interface StateMachineAction {
  type: string;
  timestamp: Date;
  actor: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export const StateMachineActions = {
  // Notifications
  NOTIFY_NEXT_APPROVER: 'notify_next_approver',
  NOTIFY_EMPLOYEE: 'notify_employee',
  NOTIFY_HR: 'notify_hr',
  
  // Audit et logging
  LOG_TRANSITION: 'log_transition',
  LOG_APPROVAL: 'log_approval',
  LOG_REJECTION: 'log_rejection',
  
  // Mises à jour de données
  UPDATE_STATUS: 'update_status',
  UPDATE_APPROVAL_METADATA: 'update_approval_metadata',
  INCREMENT_APPROVAL_LEVEL: 'increment_approval_level',
  
  // Calculs et ajustements
  ADJUST_LEAVE_BALANCE: 'adjust_leave_balance',
  CALCULATE_REMAINING_DAYS: 'calculate_remaining_days',
  CHECK_CONFLICT: 'check_conflict',
};

// ============================================================================
// GUARDS (CONDITIONS DE TRANSITION)
// ============================================================================

export interface TransitionGuard {
  name: string;
  condition: (context: LeaveRequestContext) => boolean;
  errorMessage?: string;
}

export interface LeaveRequestContext {
  requestId: string;
  currentState: LeaveRequestState;
  userId: string;
  userRole: UserRole;
  startDate: Date;
  endDate: Date;
  leaveType: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  daysRequested: number;
  currentUserBalance: number;
  hasConflict?: boolean;
}

export const Guards = {
  // Vérification des rôles et permissions
  isEmployee: (ctx: LeaveRequestContext): boolean => 
    ctx.userRole === 'employee',
  
  isCellManager: (ctx: LeaveRequestContext): boolean => 
    ctx.userRole === 'cell_manager',
  
  isServiceChief: (ctx: LeaveRequestContext): boolean => 
    ctx.userRole === 'service_chief',
  
  isHR: (ctx: LeaveRequestContext): boolean => 
    ctx.userRole === 'hr',
  
  // Vérifications métier
  hasSufficientBalance: (ctx: LeaveRequestContext): boolean => 
    ctx.currentUserBalance >= ctx.daysRequested,
  
  hasNoConflict: (ctx: LeaveRequestContext): boolean => 
    !ctx.hasConflict,
  
  isValidDateRange: (ctx: LeaveRequestContext): boolean => 
    ctx.startDate < ctx.endDate,
  
  isEmergency: (ctx: LeaveRequestContext): boolean => 
    ctx.urgency === 'emergency',
  
  requiresN2Approval: (ctx: LeaveRequestContext): boolean => 
    ctx.daysRequested > 5 || ctx.urgency === 'emergency',
};

// ============================================================================
// DÉFINITION DES TRANSITIONS
// ============================================================================

export interface StateTransition {
  from: LeaveRequestState;
  to: LeaveRequestState;
  event: LeaveRequestEvent;
  guards?: TransitionGuard[];
  actions?: string[];
  description: string;
}

export const leaveRequestTransitions: StateTransition[] = [
  // ======== SOUMISSION INITIALE ========
  {
    from: LeaveRequestState.DRAFT,
    to: LeaveRequestState.PENDING_CELL_MANAGER,
    event: LeaveRequestEvent.SUBMIT,
    guards: [
      { name: 'hasSufficientBalance', condition: Guards.hasSufficientBalance },
      { name: 'isValidDateRange', condition: Guards.isValidDateRange },
      { name: 'hasNoConflict', condition: Guards.hasNoConflict },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.NOTIFY_NEXT_APPROVER,
      StateMachineActions.LOG_TRANSITION,
    ],
    description: 'Employé soumet sa demande → Chef de Cellule',
  },

  // ======== NIVEAU 1 : CHEF DE CELLULE ========
  {
    from: LeaveRequestState.PENDING_CELL_MANAGER,
    to: LeaveRequestState.PENDING_SERVICE_CHIEF,
    event: LeaveRequestEvent.APPROVE_N1,
    guards: [
      { name: 'isCellManager', condition: Guards.isCellManager },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.LOG_APPROVAL,
      StateMachineActions.UPDATE_APPROVAL_METADATA,
      StateMachineActions.NOTIFY_NEXT_APPROVER,
    ],
    description: 'Chef de Cellule approuve → Chef de Service',
  },
  {
    from: LeaveRequestState.PENDING_CELL_MANAGER,
    to: LeaveRequestState.REJECTED,
    event: LeaveRequestEvent.REJECT_N1,
    guards: [
      { name: 'isCellManager', condition: Guards.isCellManager },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.LOG_REJECTION,
      StateMachineActions.NOTIFY_EMPLOYEE,
    ],
    description: 'Chef de Cellule rejette la demande (état final)',
  },

  // ======== NIVEAU 2 : CHEF DE SERVICE ========
  {
    from: LeaveRequestState.PENDING_SERVICE_CHIEF,
    to: LeaveRequestState.PENDING_HR,
    event: LeaveRequestEvent.APPROVE_N2,
    guards: [
      { name: 'isServiceChief', condition: Guards.isServiceChief },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.LOG_APPROVAL,
      StateMachineActions.UPDATE_APPROVAL_METADATA,
      StateMachineActions.NOTIFY_HR,
    ],
    description: 'Chef de Service approuve → RH (validation finale)',
  },
  {
    from: LeaveRequestState.PENDING_SERVICE_CHIEF,
    to: LeaveRequestState.REJECTED,
    event: LeaveRequestEvent.REJECT_N2,
    guards: [
      { name: 'isServiceChief', condition: Guards.isServiceChief },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.LOG_REJECTION,
      StateMachineActions.NOTIFY_EMPLOYEE,
    ],
    description: 'Chef de Service rejette la demande (état final)',
  },

  // ======== NIVEAU 3 : RH (VALIDATION FINALE) ========
  {
    from: LeaveRequestState.PENDING_HR,
    to: LeaveRequestState.APPROVED,
    event: LeaveRequestEvent.APPROVE_HR,
    guards: [
      { name: 'isHR', condition: Guards.isHR },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.LOG_APPROVAL,
      StateMachineActions.ADJUST_LEAVE_BALANCE,
      StateMachineActions.NOTIFY_EMPLOYEE,
      StateMachineActions.CHECK_CONFLICT,
    ],
    description: 'RH approuve définitivement → Congé validé (état final)',
  },
  {
    from: LeaveRequestState.PENDING_HR,
    to: LeaveRequestState.REJECTED,
    event: LeaveRequestEvent.REJECT_HR,
    guards: [
      { name: 'isHR', condition: Guards.isHR },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.LOG_REJECTION,
      StateMachineActions.NOTIFY_EMPLOYEE,
    ],
    description: 'RH rejette la demande (état final)',
  },

  // ======== ANNULATION PAR L'EMPLOYÉ ========
  {
    from: LeaveRequestState.PENDING_CELL_MANAGER,
    to: LeaveRequestState.CANCELLED,
    event: LeaveRequestEvent.CANCEL,
    guards: [
      { name: 'isEmployee', condition: Guards.isEmployee },
    ],
    actions: [
      StateMachineActions.UPDATE_STATUS,
      StateMachineActions.LOG_TRANSITION,
      StateMachineActions.NOTIFY_NEXT_APPROVER,
    ],
    description: 'Employé annule sa demande en attente',
  },
];

// ============================================================================
// MACHINE À ÉTATS - CLASSE PRINCIPALE
// ============================================================================

export class LeaveRequestStateMachine {
  private currentState: LeaveRequestState;
  private context: LeaveRequestContext;
  private history: StateMachineAction[] = [];

  constructor(initialState: LeaveRequestState, context: LeaveRequestContext) {
    this.currentState = initialState;
    this.context = context;
  }

  /**
   * Obtenir l'état actuel
   */
  getState(): LeaveRequestState {
    return this.currentState;
  }

  /**
   * Obtenir les transitions possibles depuis l'état actuel
   */
  getAvailableTransitions(): StateTransition[] {
    return leaveRequestTransitions.filter(t => t.from === this.currentState);
  }

  /**
   * Vérifier si un événement peut être déclenché
   */
  canTransition(event: LeaveRequestEvent): boolean {
    const transition = leaveRequestTransitions.find(
      t => t.from === this.currentState && t.event === event
    );

    if (!transition) return false;

    // Vérifier toutes les guards
    if (transition.guards) {
      return transition.guards.every(guard => guard.condition(this.context));
    }

    return true;
  }

  /**
   * Exécuter une transition
   */
  transition(event: LeaveRequestEvent, actor: string, comment?: string): boolean {
    const transition = leaveRequestTransitions.find(
      t => t.from === this.currentState && t.event === event
    );

    if (!transition) {
      throw new Error(`Invalid transition: ${event} from state ${this.currentState}`);
    }

    // Vérifier les guards
    if (transition.guards) {
      const failedGuard = transition.guards.find(g => !g.condition(this.context));
      if (failedGuard) {
        throw new Error(`Guard failed: ${failedGuard.name}`);
      }
    }

    // Enregistrer l'action dans l'historique
    this.history.push({
      type: event,
      timestamp: new Date(),
      actor,
      comment,
      metadata: {
        from: this.currentState,
        to: transition.to,
      },
    });

    // Changer l'état
    this.currentState = transition.to;
    this.context.currentState = transition.to;

    // Exécuter les actions associées
    if (transition.actions) {
      this.executeActions(transition.actions, actor);
    }

    return true;
  }

  /**
   * Exécuter les actions associées à une transition
   */
  private executeActions(actions: string[], actor: string): void {
    actions.forEach(action => {
      console.log(`[State Machine] Executing action: ${action} by ${actor}`);
      // Ici, vous pourriez appeler des services réels pour chaque action
      // Par exemple: notificationService.notify(), auditService.log(), etc.
    });
  }

  /**
   * Obtenir l'historique des transitions
   */
  getHistory(): StateMachineAction[] {
    return this.history;
  }

  /**
   * Visualiser la machine à états (pour debug/documentation)
   */
  static visualize(): string {
    let graph = 'digraph LeaveRequestWorkflow {\n';
    graph += '  rankdir=LR;\n';
    graph += '  node [shape=box];\n\n';

    leaveRequestTransitions.forEach(t => {
      graph += `  ${t.from} -> ${t.to} [label="${t.event}"];\n`;
    });

    graph += '}\n';
    return graph;
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Obtenir le prochain approbateur requis selon l'état
 */
export function getNextApprover(state: LeaveRequestState): UserRole | null {
  const approverMap: Record<LeaveRequestState, UserRole | null> = {
    [LeaveRequestState.DRAFT]: null,
    [LeaveRequestState.PENDING_CELL_MANAGER]: 'cell_manager',
    [LeaveRequestState.PENDING_SERVICE_CHIEF]: 'service_chief',
    [LeaveRequestState.PENDING_HR]: 'hr',
    [LeaveRequestState.APPROVED]: null,
    [LeaveRequestState.REJECTED]: null,
    [LeaveRequestState.CANCELLED]: null,
  };

  return approverMap[state];
}

/**
 * Obtenir le label français de l'état
 */
export function getStateLabel(state: LeaveRequestState): string {
  const labels: Record<LeaveRequestState, string> = {
    [LeaveRequestState.DRAFT]: 'Brouillon',
    [LeaveRequestState.PENDING_CELL_MANAGER]: 'En attente - Chef de Cellule',
    [LeaveRequestState.PENDING_SERVICE_CHIEF]: 'En attente - Chef de Service',
    [LeaveRequestState.PENDING_HR]: 'En attente - RH',
    [LeaveRequestState.APPROVED]: 'Approuvé',
    [LeaveRequestState.REJECTED]: 'Rejeté',
    [LeaveRequestState.CANCELLED]: 'Annulé',
  };

  return labels[state];
}
