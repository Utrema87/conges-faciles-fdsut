# Identification des entités principales

L'analyse du domaine métier révèle quatre entités principales structurant le système de gestion des congés :

## Entité AUTH_USERS (Authentification Supabase)

L'entité AUTH_USERS est gérée nativement par Supabase dans le schéma `auth`. Elle centralise l'authentification et la gestion sécurisée des identités.

**Attributs principaux :**
- `id` (UUID, clé primaire)
- `email` (unique, identifiant de connexion)
- `encrypted_password` (mot de passe chiffré)
- `raw_user_meta_data` (JSONB, métadonnées utilisateur)
- `created_at` (horodatage création)

**Remarque importante :** Cette table appartient au schéma `auth` de Supabase et ne doit pas être modifiée directement. Les données métier sont stockées dans les tables du schéma `public`.

## Entité PROFILES (Profil utilisateur)

L'entité PROFILES étend les données d'authentification avec les informations personnelles et professionnelles spécifiques au FDSUT. Cette séparation respecte le principe de responsabilité unique en isolant les données d'authentification des données métier.

**Attributs principaux :**
- `id` (UUID, clé primaire)
- `user_id` (UUID, clé étrangère vers `auth.users`, unique)
- `email` (TEXT, duplication pour faciliter les requêtes)
- `first_name` (TEXT, prénom)
- `last_name` (TEXT, nom de famille)
- `phone` (TEXT, optionnel, téléphone)
- `department` (TEXT, optionnel, service/direction)
- `position` (TEXT, optionnel, poste occupé)
- `must_change_password` (BOOLEAN, défaut true, sécurité)
- `created_at` (TIMESTAMP, horodatage création)
- `updated_at` (TIMESTAMP, mise à jour automatique via trigger)

**Contraintes :**
- Relation 1:1 avec `auth.users` via `user_id`
- Création automatique via trigger lors de l'inscription
- RLS activé : utilisateurs voient leur profil, admins voient tous les profils

**Trigger associé :**
Le trigger `handle_new_user()` crée automatiquement un profil lors de l'inscription d'un utilisateur, en extrayant les métadonnées du champ `raw_user_meta_data`.

## Entité USER_ROLES (Gestion des rôles)

L'entité USER_ROLES implémente un système de gestion des rôles multi-niveaux. Cette approche sépare complètement les rôles des profils utilisateurs, évitant les vulnérabilités d'escalade de privilèges et permettant l'attribution de rôles multiples.

**Attributs principaux :**
- `id` (UUID, clé primaire)
- `user_id` (UUID, clé étrangère vers `auth.users`)
- `role` (ENUM `app_role`)
- `created_at` (TIMESTAMP, horodatage création)

**Énumération app_role :**
Le système définit cinq rôles hiérarchiques :
1. `employee` - Agent du FDSUT (niveau de base)
2. `cell_manager` - Responsable de cellule (validation N+1)
3. `service_chief` - Chef de service (validation N+2)
4. `hr` - Ressources Humaines (validation finale et gestion administrative)
5. `admin` - Administrateur système (gestion complète)

**Contrainte unique :**
La contrainte `UNIQUE (user_id, role)` empêche l'attribution multiple du même rôle à un utilisateur, tout en permettant l'attribution de plusieurs rôles différents.

**Fonctions de sécurité associées :**

```sql
-- Fonction de vérification de rôle (SECURITY DEFINER)
has_role(user_id UUID, role app_role) RETURNS BOOLEAN

-- Fonction de récupération des rôles
get_user_roles(user_id UUID) RETURNS SETOF app_role
```

Ces fonctions `SECURITY DEFINER` contournent les politiques RLS pour éviter la récursion infinie lors des vérifications de permissions.

## Entité LEAVE_REQUESTS (Demandes de congés)

L'entité LEAVE_REQUESTS constitue le cœur fonctionnel du système en modélisant le cycle de vie complet des demandes de congés. Cette entité agrège toutes les informations nécessaires au traitement et au workflow d'approbation.

**Attributs principaux :**
- `id` (UUID, clé primaire)
- `user_id` (UUID, clé étrangère vers `auth.users`, demandeur)
- `type` (TEXT, type de congé : annuel, maladie, maternité, etc.)
- `start_date` (DATE, début de la période)
- `end_date` (DATE, fin de la période)
- `reason` (TEXT, optionnel, motif/justification)
- `status` (TEXT, défaut 'pending', état du workflow)
- `approver_id` (UUID, optionnel, dernier valideur)
- `approved_at` (TIMESTAMP, optionnel, date d'approbation finale)
- `created_at` (TIMESTAMP, horodatage création)
- `updated_at` (TIMESTAMP, mise à jour automatique via trigger)

**États du workflow (status) :**
Le système implémente un workflow d'approbation en cascade :
1. `pending` - En attente de traitement initial
2. `pending_cell_manager` - En attente validation responsable cellule
3. `pending_service_chief` - En attente validation chef de service
4. `pending_hr` - En attente validation RH
5. `approved` - Approuvé (fin du workflow)
6. `rejected` - Refusé (fin du workflow)

**Workflow d'approbation :**
Le statut évolue selon la hiérarchie de validation :
- **Employé** → soumet une demande (`pending`)
- **Responsable cellule** → valide/refuse (`pending_service_chief` ou `rejected`)
- **Chef de service** → valide/refuse (`pending_hr` ou `rejected`)
- **RH** → valide/refuse définitivement (`approved` ou `rejected`)

### Diagramme de workflow des demandes

<lov-mermaid>
stateDiagram-v2
    [*] --> pending: Employé soumet demande
    
    pending --> pending_cell_manager: Traitement initial
    
    pending_cell_manager --> pending_service_chief: Responsable cellule APPROUVE
    pending_cell_manager --> rejected: Responsable cellule REFUSE
    
    pending_service_chief --> pending_hr: Chef service APPROUVE
    pending_service_chief --> rejected: Chef service REFUSE
    
    pending_hr --> approved: RH APPROUVE
    pending_hr --> rejected: RH REFUSE
    
    approved --> [*]: Congé validé
    rejected --> [*]: Congé refusé
    
    note right of pending
        État initial
        Créé par l'employé
    end note
    
    note right of pending_cell_manager
        Niveau 1: Validation N+1
        Responsable de cellule
    end note
    
    note right of pending_service_chief
        Niveau 2: Validation N+2
        Chef de service
    end note
    
    note right of pending_hr
        Niveau 3: Validation finale
        Ressources Humaines
    end note
    
    note right of approved
        État final positif
        Congé accordé
    end note
    
    note right of rejected
        État final négatif
        Refus à tout niveau
    end note
</lov-mermaid>

**Contraintes métier :**
- `start_date` doit être antérieure ou égale à `end_date`
- Mise à jour automatique du timestamp via trigger `update_updated_at_column()`
- RLS activé : utilisateurs voient leurs demandes, managers voient les demandes de leur périmètre

## Relations entre entités

### Diagramme Entité-Association (Modèle Conceptuel)

<lov-mermaid>
erDiagram
    AUTH_USERS ||--|| PROFILES : "possède"
    AUTH_USERS ||--o{ USER_ROLES : "a"
    AUTH_USERS ||--o{ LEAVE_REQUESTS : "crée"
    
    AUTH_USERS {
        uuid id PK
        varchar email UK
        varchar encrypted_password
        jsonb raw_user_meta_data
        timestamp created_at
    }
    
    PROFILES {
        uuid id PK
        uuid user_id FK "UNIQUE"
        text email
        text first_name
        text last_name
        text phone "nullable"
        text department "nullable"
        text position "nullable"
        boolean must_change_password
        timestamp created_at
        timestamp updated_at
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        app_role role
        timestamp created_at
    }
    
    LEAVE_REQUESTS {
        uuid id PK
        uuid user_id FK
        text type
        date start_date
        date end_date
        text reason "nullable"
        text status
        uuid approver_id "nullable"
        timestamp approved_at "nullable"
        timestamp created_at
        timestamp updated_at
    }
</lov-mermaid>

### Hiérarchie des rôles

<lov-mermaid>
graph TD
    A[admin] --> B[hr]
    A --> C[service_chief]
    A --> D[cell_manager]
    A --> E[employee]
    
    B --> C
    C --> D
    D --> E
    
    style A fill:#e74c3c,stroke:#c0392b,color:#fff
    style B fill:#3498db,stroke:#2980b9,color:#fff
    style C fill:#2ecc71,stroke:#27ae60,color:#fff
    style D fill:#f39c12,stroke:#e67e22,color:#fff
    style E fill:#95a5a6,stroke:#7f8c8d,color:#fff
    
    classDef roleDesc fill:#ecf0f1,stroke:#bdc3c7
    
    A1[Gestion complète du système]:::roleDesc
    B1[Validation finale + Admin RH]:::roleDesc
    C1[Validation N+2]:::roleDesc
    D1[Validation N+1]:::roleDesc
    E1[Soumission demandes]:::roleDesc
    
    A -.-> A1
    B -.-> B1
    C -.-> C1
    D -.-> D1
    E -.-> E1
</lov-mermaid>

### Cardinalités principales

1. **AUTH_USERS ↔ PROFILES** : Relation 1:1
   - Un utilisateur possède exactement un profil
   - Un profil appartient à un seul utilisateur

2. **AUTH_USERS ↔ USER_ROLES** : Relation 1:n
   - Un utilisateur peut avoir plusieurs rôles
   - Un rôle est attribué à un seul utilisateur (par entrée)

3. **AUTH_USERS ↔ LEAVE_REQUESTS** : Relation 1:n
   - Un utilisateur peut créer plusieurs demandes de congés
   - Une demande appartient à un seul utilisateur

### Diagramme de séquence: Création et approbation d'une demande

<lov-mermaid>
sequenceDiagram
    participant E as Employé
    participant UI as Interface React
    participant SB as Supabase Client
    participant DB as Base de données
    participant CM as Responsable Cellule
    participant SC as Chef Service
    participant HR as RH
    
    Note over E,HR: 1. Création de la demande
    E->>UI: Soumet formulaire congé
    UI->>SB: supabase.from('leave_requests').insert()
    SB->>DB: INSERT avec user_id = auth.uid()
    DB->>DB: Vérifie RLS: auth.uid() = user_id ✓
    DB->>DB: Créé demande avec status='pending'
    DB-->>SB: Demande créée
    SB-->>UI: Confirmation
    UI-->>E: Toast: "Demande soumise"
    
    Note over E,HR: 2. Validation Niveau 1 (Responsable Cellule)
    CM->>UI: Consulte demandes en attente
    UI->>SB: supabase.from('leave_requests').select()
    SB->>DB: SELECT WHERE status='pending_cell_manager'
    DB->>DB: Vérifie RLS: has_role(auth.uid(), 'cell_manager') ✓
    DB-->>CM: Liste des demandes
    
    CM->>UI: Approuve demande
    UI->>SB: .update({status: 'pending_service_chief'})
    SB->>DB: UPDATE leave_requests
    DB->>DB: Vérifie RLS: has_role(auth.uid(), 'cell_manager') ✓
    DB-->>UI: Demande mise à jour
    
    Note over E,HR: 3. Validation Niveau 2 (Chef Service)
    SC->>UI: Consulte demandes
    UI->>SB: .select() WHERE status='pending_service_chief'
    DB-->>SC: Demandes niveau 2
    SC->>UI: Approuve
    UI->>DB: UPDATE status='pending_hr'
    
    Note over E,HR: 4. Validation Finale (RH)
    HR->>UI: Consulte demandes finales
    UI->>SB: .select() WHERE status='pending_hr'
    DB-->>HR: Demandes à valider
    HR->>UI: Approuve définitivement
    UI->>DB: UPDATE status='approved', approved_at=now()
    DB-->>E: Notification: Congé approuvé ✓
</lov-mermaid>

## Avantages de cette architecture

### Matrice des permissions par rôle

<lov-mermaid>
graph LR
    subgraph "Opérations PROFILES"
        P_R[Lire]
        P_W[Modifier]
        P_C[Créer]
    end
    
    subgraph "Opérations USER_ROLES"
        R_R[Lire]
        R_W[Modifier]
        R_C[Créer]
        R_D[Supprimer]
    end
    
    subgraph "Opérations LEAVE_REQUESTS"
        L_R[Lire]
        L_W[Modifier]
        L_C[Créer]
        L_A[Approuver]
    end
    
    EMPLOYEE[employee] -->|Son profil| P_R
    EMPLOYEE -->|Son profil| P_W
    EMPLOYEE -->|Ses rôles| R_R
    EMPLOYEE -->|Ses demandes| L_R
    EMPLOYEE -->|Ses demandes| L_C
    EMPLOYEE -->|Pending| L_W
    
    CELL_MGR[cell_manager] -->|+ Équipe| L_R
    CELL_MGR -->|Niveau 1| L_A
    
    SERVICE_CHIEF[service_chief] -->|+ Service| L_R
    SERVICE_CHIEF -->|Niveau 2| L_A
    
    HR[hr] -->|+ Tous| L_R
    HR -->|Niveau 3| L_A
    
    ADMIN[admin] -->|Tous| P_R
    ADMIN -->|Tous| P_W
    ADMIN -->|Créer| P_C
    ADMIN -->|Tous| R_R
    ADMIN -->|Tous| R_W
    ADMIN -->|Créer| R_C
    ADMIN -->|Tous| R_D
    ADMIN -->|Tous| L_R
    ADMIN -->|Tous| L_W
    
    style EMPLOYEE fill:#95a5a6,stroke:#7f8c8d,color:#fff
    style CELL_MGR fill:#f39c12,stroke:#e67e22,color:#fff
    style SERVICE_CHIEF fill:#2ecc71,stroke:#27ae60,color:#fff
    style HR fill:#3498db,stroke:#2980b9,color:#fff
    style ADMIN fill:#e74c3c,stroke:#c0392b,color:#fff
</lov-mermaid>

### Architecture technique du système

<lov-mermaid>
graph TB
    subgraph "Couche Présentation - React/TypeScript"
        UI[Interface Utilisateur]
        COMP[Composants React]
        DASH[Dashboards par rôle]
        FORM[Formulaires]
    end
    
    subgraph "Couche Logique - Supabase Client"
        AUTH[Authentification]
        QUERY[React Query]
        RLS[Politiques RLS]
    end
    
    subgraph "Couche Données - PostgreSQL Supabase"
        AUTH_T[(auth.users)]
        PROF_T[(profiles)]
        ROLES_T[(user_roles)]
        LEAVE_T[(leave_requests)]
    end
    
    subgraph "Edge Functions - Serverless"
        EF1[create-user]
        EF2[delete-user]
        EF3[init-admin]
    end
    
    subgraph "Fonctions de Sécurité"
        SEC1[has_role]
        SEC2[get_user_roles]
        SEC3[handle_new_user]
    end
    
    UI --> COMP
    COMP --> DASH
    COMP --> FORM
    
    DASH --> QUERY
    FORM --> QUERY
    QUERY --> AUTH
    
    AUTH --> RLS
    RLS --> AUTH_T
    RLS --> PROF_T
    RLS --> ROLES_T
    RLS --> LEAVE_T
    
    EF1 -.->|Admin only| PROF_T
    EF1 -.->|Admin only| ROLES_T
    EF2 -.->|Admin only| AUTH_T
    EF3 -.->|Bootstrap| ROLES_T
    
    AUTH_T -->|trigger| SEC3
    SEC3 --> PROF_T
    
    RLS -->|vérifie| SEC1
    RLS -->|récupère| SEC2
    
    style UI fill:#e3f2fd,stroke:#1976d2
    style AUTH fill:#fff3e0,stroke:#f57c00
    style AUTH_T fill:#ffebee,stroke:#c62828
    style EF1 fill:#e8f5e9,stroke:#388e3c
    style EF2 fill:#e8f5e9,stroke:#388e3c
    style EF3 fill:#e8f5e9,stroke:#388e3c
    style SEC1 fill:#f3e5f5,stroke:#7b1fa2
    style SEC2 fill:#f3e5f5,stroke:#7b1fa2
    style SEC3 fill:#f3e5f5,stroke:#7b1fa2
</lov-mermaid>

### Simplicité et maintenabilité
L'architecture actuelle privilégie la simplicité avec quatre entités essentielles, facilitant la compréhension et la maintenance du système.

### Sécurité renforcée
- Séparation stricte des rôles dans une table dédiée
- Utilisation de fonctions `SECURITY DEFINER` pour éviter les récursions RLS
- Politiques RLS granulaires par entité

### Diagramme des politiques RLS (Row Level Security)

<lov-mermaid>
graph TB
    subgraph "Table: PROFILES"
        P1[Utilisateurs: lecture leur profil]
        P2[Utilisateurs: modification leur profil]
        P3[Admins: lecture tous profils]
        P4[Admins: modification tous profils]
        P5[Admins: création profils]
    end
    
    subgraph "Table: USER_ROLES"
        R1[Utilisateurs: lecture leurs rôles]
        R2[Admins: toutes opérations]
    end
    
    subgraph "Table: LEAVE_REQUESTS"
        L1[Utilisateurs: lecture leurs demandes]
        L2[Utilisateurs: création leurs demandes]
        L3[Utilisateurs: modification demandes pending]
        L4[Managers: lecture demandes équipe]
        L5[Managers: modification demandes]
    end
    
    subgraph "Fonctions de sécurité"
        F1[has_role user_id, role]
        F2[get_user_roles user_id]
    end
    
    P3 -.->|utilise| F1
    P4 -.->|utilise| F1
    P5 -.->|utilise| F1
    R2 -.->|utilise| F1
    L4 -.->|utilise| F1
    L5 -.->|utilise| F1
    
    style P1 fill:#e8f5e9,stroke:#4caf50
    style P2 fill:#e8f5e9,stroke:#4caf50
    style P3 fill:#ffebee,stroke:#f44336
    style P4 fill:#ffebee,stroke:#f44336
    style P5 fill:#ffebee,stroke:#f44336
    
    style R1 fill:#e8f5e9,stroke:#4caf50
    style R2 fill:#ffebee,stroke:#f44336
    
    style L1 fill:#e8f5e9,stroke:#4caf50
    style L2 fill:#e8f5e9,stroke:#4caf50
    style L3 fill:#fff3e0,stroke:#ff9800
    style L4 fill:#e3f2fd,stroke:#2196f3
    style L5 fill:#e3f2fd,stroke:#2196f3
    
    style F1 fill:#f3e5f5,stroke:#9c27b0
    style F2 fill:#f3e5f5,stroke:#9c27b0
</lov-mermaid>

**Légende:**
- 🟢 Vert: Politiques utilisateur standard
- 🔴 Rouge: Politiques admin uniquement
- 🟠 Orange: Politiques conditionnelles (statut)
- 🔵 Bleu: Politiques managers (validation)
- 🟣 Violet: Fonctions SECURITY DEFINER

### Extensibilité
L'architecture permet des évolutions futures :
- Ajout de nouveaux rôles dans l'enum `app_role`
- Extension des attributs de profil (département, service, cellule)
- Ajout de tables complémentaires (types de congés, historique, validation détaillée)
- Intégration de documents justificatifs via storage

### Performance
- Index automatiques sur les clés primaires et étrangères
- Queries optimisées grâce aux fonctions de sécurité
- Mise à jour automatique des timestamps via triggers

## Évolutions envisageables

Pour une version future du système, les entités suivantes pourraient être ajoutées :

1. **Services/Départements** : Structure organisationnelle hiérarchique
2. **TypesConges** : Paramétrage des types de congés et règles métier
3. **Validations** : Traçabilité détaillée du workflow avec commentaires par niveau
4. **HistoriqueConges** : Archive des congés pris pour rapports et statistiques
5. **Documents** : Gestion des pièces justificatives via Supabase Storage

Ces évolutions permettraient d'enrichir le système tout en conservant la solidité de l'architecture actuelle.
