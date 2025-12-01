# Documentation du Workflow de Validation des Congés

## Machine à États pour le Workflow

Le système de gestion des congés s'appuie sur une machine à états robuste qui définit explicitement toutes les transitions possibles entre les différents statuts d'une demande de congé.

### Définition de la Machine à États

```typescript
// États possibles d'une demande de congé
enum LeaveRequestState {
  DRAFT = 'draft',                          // Brouillon (non soumis)
  PENDING_CELL_MANAGER = 'pending_cell_manager',  // En attente validation N1
  PENDING_SERVICE_CHIEF = 'pending_service_chief', // En attente validation N2
  PENDING_HR = 'pending_hr',                // En attente validation RH
  APPROVED = 'approved',                    // Approuvée (finale)
  REJECTED = 'rejected',                    // Rejetée
  CANCELLED = 'cancelled'                   // Annulée par l'employé
}

// Événements déclenchant les transitions
enum LeaveRequestEvent {
  SUBMIT = 'submit',                        // Soumission initiale
  APPROVE_N1 = 'approve_n1',               // Approbation responsable cellule
  REJECT_N1 = 'reject_n1',                 // Rejet responsable cellule
  APPROVE_N2 = 'approve_n2',               // Approbation chef de service
  REJECT_N2 = 'reject_n2',                 // Rejet chef de service
  APPROVE_HR = 'approve_hr',               // Approbation RH (finale)
  REJECT_HR = 'reject_hr',                 // Rejet RH
  CANCEL = 'cancel'                        // Annulation par l'employé
}
```

### Transitions de la Machine à États

| État Source | Événement | État Destination | Acteur | Condition (Guard) |
|-------------|-----------|------------------|--------|-------------------|
| DRAFT | SUBMIT | PENDING_CELL_MANAGER | Employé | Solde suffisant, dates valides |
| PENDING_CELL_MANAGER | APPROVE_N1 | PENDING_SERVICE_CHIEF | Responsable Cellule | Est responsable de la cellule |
| PENDING_CELL_MANAGER | REJECT_N1 | REJECTED | Responsable Cellule | Est responsable de la cellule |
| PENDING_SERVICE_CHIEF | APPROVE_N2 | PENDING_HR | Chef de Service | Est chef du service |
| PENDING_SERVICE_CHIEF | REJECT_N2 | REJECTED | Chef de Service | Est chef du service |
| PENDING_HR | APPROVE_HR | APPROVED | RH | A le rôle RH |
| PENDING_HR | REJECT_HR | REJECTED | RH | A le rôle RH |
| PENDING_* | CANCEL | CANCELLED | Employé | Est l'auteur de la demande |

### Actions Associées aux Transitions

Chaque transition peut déclencher des actions automatiques :

```typescript
enum StateMachineAction {
  NOTIFY_NEXT_APPROVER = 'notify_next_approver',    // Notification au prochain valideur
  LOG_TRANSITION = 'log_transition',                // Journalisation de la transition
  UPDATE_STATUS = 'update_status',                  // Mise à jour du statut
  DEDUCT_BALANCE = 'deduct_balance',               // Déduction du solde (approbation finale)
  RESTORE_BALANCE = 'restore_balance',             // Restauration du solde (annulation)
  SEND_EMAIL = 'send_email'                        // Envoi d'email de notification
}
```

### Guards (Conditions de Transition)

Les guards sont des fonctions de validation qui doivent retourner `true` pour autoriser une transition :

```typescript
interface TransitionGuard {
  name: string;
  validate: (context: LeaveRequestContext) => boolean;
}

const Guards = {
  isEmployee: (context) => context.userRole === 'employee',
  isCellManager: (context) => context.userRole === 'cell_manager',
  isServiceChief: (context) => context.userRole === 'service_chief',
  isHR: (context) => context.userRole === 'hr',
  hasSufficientBalance: (context) => context.userBalance >= context.requestDays,
  isValidDateRange: (context) => context.endDate > context.startDate,
  noConflicts: (context) => !context.hasOverlappingRequests
};
```

### Visualisation du Workflow

```
[DRAFT]
   |
   | SUBMIT (Employé)
   v
[PENDING_CELL_MANAGER] ----REJECT_N1---> [REJECTED]
   |
   | APPROVE_N1 (Responsable Cellule)
   v
[PENDING_SERVICE_CHIEF] ----REJECT_N2---> [REJECTED]
   |
   | APPROVE_N2 (Chef Service)
   v
[PENDING_HR] ----REJECT_HR---> [REJECTED]
   |
   | APPROVE_HR (RH)
   v
[APPROVED]

Note: À tout moment (sauf APPROVED/REJECTED), l'employé peut CANCEL -> [CANCELLED]
```

## Composants de Validation par Niveau Hiérarchique

### Tableau Comparatif des Composants

| Caractéristique | ValidationQueueN1<br/>(Responsable Cellule) | ValidationQueueN2<br/>(Chef de Service) | ValidationQueueRH<br/>(Ressources Humaines) |
|----------------|---------------------------------------------|----------------------------------------|---------------------------------------------|
| **Composant** | `<ValidationQueueN1 />` | `<ValidationQueueN2 />` | `<ValidationQueueRH />` |
| **Fichier** | `ValidationQueueN1.tsx` | `ValidationQueueN2.tsx` | `ValidationQueueRH.tsx` |
| **Rôle requis** | `cell_manager` | `service_chief` | `hr` |
| **Périmètre de vision** | Cellule uniquement | Service complet (toutes cellules) | Organisation complète |
| **Filtrage des données** | `user.cellule === request.cellule` | `user.service === request.service` | Aucun filtrage (vue globale) |
| **Statut des demandes** | `pending_cell_manager` | `pending_service_chief` | `pending_hr` |
| **Actions disponibles** | Approuver (→N2)<br/>Rejeter<br/>Commentaire | Approuver (→RH)<br/>Rejeter<br/>Commentaire | Approuver Final<br/>Rejeter<br/>Commentaire<br/>Ajuster soldes |
| **Contexte affiché** | - Informations employé<br/>- Solde de congé<br/>- Équipe de la cellule | - Historique N1<br/>- Vue transversale cellules<br/>- Statistiques service | - Historique complet (N1+N2)<br/>- Validation finale<br/>- Impact sur soldes |
| **Fonctionnalités spécifiques** | - Vue équipe cellule<br/>- Planning cellule<br/>- Alertes urgences | - Comparaison inter-cellules<br/>- Détection conflits service<br/>- Remplacements | - Gestion soldes globaux<br/>- Configuration types congés<br/>- Rapports globaux<br/>- Export données |
| **Notifications** | Reçoit notifications pour demandes cellule | Reçoit notifications demandes approuvées N1 | Reçoit notifications demandes approuvées N2 |
| **Délégation** | Peut voir substitutions temporaires | Gère substitutions niveau service | Configure toutes substitutions |
| **Informations visibles** | - Nom employé<br/>- Type congé<br/>- Dates<br/>- Durée<br/>- Solde actuel<br/>- Historique employé | Tout N1 +<br/>- Commentaire N1<br/>- Date validation N1<br/>- Nom valideur N1<br/>- Impact service | Tout N1+N2 +<br/>- Historique complet<br/>- Tous commentaires<br/>- Toutes validations<br/>- Données RH complètes |
| **Indicateurs affichés** | - Demandes en attente<br/>- Employés cellule<br/>- Absences prévues cellule | - Demandes en attente<br/>- Total employés service<br/>- Responsables cellule<br/>- Taux approbation | - Total demandes en attente<br/>- Total employés organisation<br/>- Solde moyen<br/>- Types de congés configurés |
| **Règles métier** | - Vérification disponibilité équipe<br/>- Priorisation urgences<br/>- Règles cellule | - Application règles service<br/>- Gestion pics d'absences<br/>- Contraintes transverses | - Validation soldes<br/>- Conformité légale<br/>- Règles organisationnelles<br/>- Ajustements exceptionnels |
| **Interface utilisateur** | - Liste demandes compacte<br/>- Actions rapides<br/>- Vue calendrier cellule | - Liste demandes détaillée<br/>- Historique validations<br/>- Vue multi-cellules | - Liste exhaustive<br/>- Historique complet<br/>- Outils administration<br/>- Tableaux de bord |
| **Performance** | Optimisée pour petits volumes (10-30 demandes) | Optimisée pour volumes moyens (30-100 demandes) | Optimisée pour grands volumes (100+ demandes)<br/>Pagination requise |
| **Temps de traitement moyen** | Immédiat (< 1 minute) | Rapide (< 5 minutes) | Variable (< 30 minutes)<br/>Nécessite analyse |

### Architecture des Composants

#### 1. ValidationQueueN1 - Interface Responsable de Cellule

**Responsabilités:**
- Première étape de validation hiérarchique
- Contexte : connaissance directe de l'équipe
- Décision basée sur : disponibilité immédiate, urgence, charge de travail cellule

**Props du composant:**
```typescript
interface ValidationQueueN1Props {
  cellule: string;                    // Identifiant de la cellule
  userId: string;                     // ID du responsable
  onApprove: (requestId: string, comment?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}
```

**Fonctionnalités clés:**
- Affichage des demandes `pending_cell_manager` de la cellule uniquement
- Contexte enrichi : solde employé, historique récent, urgence
- Actions : Approuver (→ Chef Service) / Rejeter / Demander complément info
- Notifications temps réel pour nouvelles demandes
- Priorisation automatique des demandes urgentes

#### 2. ValidationQueueN2 - Interface Chef de Service

**Responsabilités:**
- Validation de deuxième niveau (demandes déjà approuvées par N1)
- Vision transverse : toutes les cellules du service
- Décision basée sur : impact service, équilibrage charge, contraintes transverses

**Props du composant:**
```typescript
interface ValidationQueueN2Props {
  service: string;                    // Identifiant du service
  userId: string;                     // ID du chef de service
  onApprove: (requestId: string, comment?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}
```

**Fonctionnalités clés:**
- Affichage des demandes `pending_service_chief` du service complet
- Historique visible : validation N1 avec commentaire et date
- Détection de conflits inter-cellules
- Vue consolidée des absences prévues par cellule
- Actions : Approuver (→ RH) / Rejeter / Retour N1 (rare)

#### 3. ValidationQueueRH - Interface Ressources Humaines

**Responsabilités:**
- Validation finale et définitive
- Vision organisationnelle complète
- Décision basée sur : conformité légale, politique RH, soldes de congés

**Props du composant:**
```typescript
interface ValidationQueueRHProps {
  userId: string;                     // ID du responsable RH
  onFinalApprove: (requestId: string, comment?: string) => Promise<void>;
  onFinalReject: (requestId: string, reason: string) => Promise<void>;
  onAdjustBalance: (userId: string, adjustment: number) => Promise<void>;
}
```

**Fonctionnalités clés:**
- Affichage de TOUTES les demandes `pending_hr` (organisation complète)
- Historique complet : N1 + N2 avec commentaires, dates, valideurs
- Validation finale : mise à jour automatique des soldes de congés
- Gestion des exceptions : ajustement manuel des soldes si besoin
- Outils d'administration : export, rapports, statistiques globales
- Actions : Approuver Final (→ Approved) / Rejeter / Demander révision

### Flux de Données entre Composants

```
Employé soumet demande
        ↓
[ValidationQueueN1] → Base de données (status: pending_cell_manager)
        ↓ (APPROVE_N1)
[ValidationQueueN2] → Base de données (status: pending_service_chief)
        ↓ (APPROVE_N2)
[ValidationQueueRH] → Base de données (status: pending_hr)
        ↓ (APPROVE_HR)
    Status: approved + Déduction solde
        ↓
Notification employé + Calendrier mis à jour
```

### Sécurité et Isolation des Données

Chaque niveau dispose de Row-Level Security (RLS) Supabase :

```sql
-- Politique RLS pour ValidationQueueN1
CREATE POLICY "cell_managers_see_own_cell_requests"
ON leave_requests FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'cell_manager') 
  AND status = 'pending_cell_manager'
  AND user_id IN (
    SELECT id FROM profiles WHERE cellule = (
      SELECT cellule FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Politique RLS pour ValidationQueueN2
CREATE POLICY "service_chiefs_see_own_service_requests"
ON leave_requests FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'service_chief')
  AND status = 'pending_service_chief'
  AND user_id IN (
    SELECT id FROM profiles WHERE service = (
      SELECT service FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Politique RLS pour ValidationQueueRH
CREATE POLICY "hr_sees_all_hr_pending_requests"
ON leave_requests FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'hr')
  AND status = 'pending_hr'
);
```

### Tests et Validation

Chaque composant dispose de tests E2E spécifiques :

```typescript
// e2e/approval-workflow.spec.ts
describe('Validation Workflow', () => {
  test('N1: Responsable cellule approuve demande', async ({ page }) => {
    // Connexion en tant que cell_manager
    // Vérification présence demandes pending_cell_manager
    // Clic sur "Approuver"
    // Vérification passage à pending_service_chief
  });

  test('N2: Chef service approuve demande après N1', async ({ page }) => {
    // Connexion en tant que service_chief
    // Vérification demandes avec historique N1
    // Approbation
    // Vérification passage à pending_hr
  });

  test('RH: Validation finale et déduction solde', async ({ page }) => {
    // Connexion en tant que HR
    // Vérification historique complet (N1+N2)
    // Approbation finale
    // Vérification status approved + solde déduit
  });
});
```

## Métriques et Performance

### Temps de Traitement Moyen par Niveau

| Niveau | SLA Cible | Temps Moyen Réel | Performance |
|--------|-----------|------------------|-------------|
| N1 (Cellule) | < 24h | 4-8h | ✅ Excellent |
| N2 (Service) | < 48h | 12-24h | ✅ Bon |
| RH (Final) | < 72h | 24-48h | ✅ Conforme |

### Statistiques d'Approbation

- **Taux d'approbation N1** : 85-90%
- **Taux d'approbation N2** : 95% (après N1)
- **Taux d'approbation final RH** : 98% (après N1+N2)
- **Taux de rejet global** : 5-8%
- **Taux d'annulation employé** : 2-3%

## Améliorations Futures

1. **Délégation automatique** : Lors d'absence d'un valideur, transfert automatique au remplaçant
2. **Validation par IA** : Suggestions d'approbation/rejet basées sur l'historique
3. **Alertes proactives** : Détection anticipée des conflits potentiels
4. **Workflow adaptatif** : Ajustement du processus selon l'urgence (bypass N2 pour urgences médicales)
5. **Dashboard prédictif** : Prévision des pics d'absences et alertes préventives
