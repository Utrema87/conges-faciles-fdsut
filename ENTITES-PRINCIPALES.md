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

**Contraintes métier :**
- `start_date` doit être antérieure ou égale à `end_date`
- Mise à jour automatique du timestamp via trigger `update_updated_at_column()`
- RLS activé : utilisateurs voient leurs demandes, managers voient les demandes de leur périmètre

## Relations entre entités

### Diagramme de relations

```
AUTH_USERS (1) ←→ (1) PROFILES
    ↓ (1)
    |
    ↓ (n)
USER_ROLES
    
AUTH_USERS (1) ←→ (n) LEAVE_REQUESTS
```

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

## Avantages de cette architecture

### Simplicité et maintenabilité
L'architecture actuelle privilégie la simplicité avec quatre entités essentielles, facilitant la compréhension et la maintenance du système.

### Sécurité renforcée
- Séparation stricte des rôles dans une table dédiée
- Utilisation de fonctions `SECURITY DEFINER` pour éviter les récursions RLS
- Politiques RLS granulaires par entité

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
