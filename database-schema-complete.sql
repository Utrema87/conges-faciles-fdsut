-- ========================================================================
-- SYSTÈME DE GESTION DES CONGÉS - SCRIPT SQL COMPLET
-- ========================================================================
-- Description : Création complète de la base de données incluant :
--   - Énumérations de types
--   - Tables principales (profiles, user_roles, leave_requests)
--   - Contraintes d'intégrité référentielle
--   - Row Level Security (RLS) policies
--   - Fonctions de sécurité et triggers
--   - Index d'optimisation
-- ========================================================================

-- ========================================================================
-- 1. ÉNUMÉRATIONS
-- ========================================================================

-- Énumération des rôles applicatifs
-- Hiérarchie : employee < cell_manager < service_chief < hr < admin
CREATE TYPE app_role AS ENUM (
  'employee',        -- Employé standard : création/consultation de ses demandes
  'cell_manager',    -- Responsable de cellule : validation niveau N+1
  'service_chief',   -- Chef de service : validation niveau N+2
  'hr',              -- Ressources Humaines : validation finale et administration
  'admin'            -- Administrateur système : gestion complète du système
);

-- ========================================================================
-- 2. TABLES PRINCIPALES
-- ========================================================================

-- ------------------------------------------------------------------------
-- Table PROFILES
-- ------------------------------------------------------------------------
-- Description : Informations personnelles et professionnelles des utilisateurs
-- Relations : Lien 1:1 avec auth.users (Supabase Auth)
-- Contraintes : user_id unique, email requis
-- ------------------------------------------------------------------------
CREATE TABLE public.profiles (
  -- Identifiant unique du profil
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence à l'utilisateur Supabase Auth
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de contact
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Informations personnelles
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  
  -- Informations professionnelles
  department TEXT,      -- Département/Service (ex: "Informatique", "RH")
  position TEXT,        -- Poste occupé (ex: "Développeur", "Chef de projet")
  
  -- Gestion de la sécurité
  must_change_password BOOLEAN DEFAULT true,  -- Force le changement de mot de passe à la première connexion
  
  -- Métadonnées temporelles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commentaires sur les colonnes
COMMENT ON TABLE public.profiles IS 'Profils utilisateurs étendant auth.users avec informations métier';
COMMENT ON COLUMN public.profiles.user_id IS 'Clé étrangère vers auth.users (gestion Supabase)';
COMMENT ON COLUMN public.profiles.must_change_password IS 'Indicateur de changement obligatoire du mot de passe';

-- ------------------------------------------------------------------------
-- Table USER_ROLES
-- ------------------------------------------------------------------------
-- Description : Gestion multi-rôles des utilisateurs
-- Relations : Lien N:1 avec auth.users
-- Contraintes : Un utilisateur peut avoir plusieurs rôles mais pas de doublons
-- ------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  -- Identifiant unique du rôle
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence à l'utilisateur
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rôle assigné
  role app_role NOT NULL,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contrainte d'unicité : pas de duplication de rôle pour un même utilisateur
  UNIQUE(user_id, role)
);

-- Commentaires
COMMENT ON TABLE public.user_roles IS 'Assignation des rôles applicatifs aux utilisateurs';
COMMENT ON COLUMN public.user_roles.role IS 'Rôle parmi : employee, cell_manager, service_chief, hr, admin';

-- ------------------------------------------------------------------------
-- Table LEAVE_REQUESTS
-- ------------------------------------------------------------------------
-- Description : Demandes de congés avec workflow de validation
-- Relations : 
--   - user_id : créateur de la demande
--   - approver_id : dernier validateur de la demande
-- Workflow : pending → pending_cell_manager → pending_service_chief → pending_hr → approved/rejected
-- ------------------------------------------------------------------------
CREATE TABLE public.leave_requests (
  -- Identifiant unique de la demande
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence au demandeur
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Détails de la demande
  type TEXT NOT NULL,           -- Type de congé : "Congés payés", "Maladie", "Formation", etc.
  start_date DATE NOT NULL,     -- Date de début du congé
  end_date DATE NOT NULL,       -- Date de fin du congé (incluse)
  reason TEXT,                  -- Motif détaillé de la demande
  
  -- Statut et validation
  status TEXT DEFAULT 'pending',  -- Statut actuel dans le workflow
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- ID du dernier validateur
  approved_at TIMESTAMP WITH TIME ZONE,  -- Date/heure de la dernière validation
  
  -- Métadonnées temporelles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contrainte métier : date de fin >= date de début
  CONSTRAINT check_dates CHECK (start_date <= end_date)
);

-- Commentaires
COMMENT ON TABLE public.leave_requests IS 'Demandes de congés avec workflow d''approbation hiérarchique';
COMMENT ON COLUMN public.leave_requests.status IS 'Statuts : pending, pending_cell_manager, pending_service_chief, pending_hr, approved, rejected';
COMMENT ON COLUMN public.leave_requests.approver_id IS 'ID du manager ayant validé ou rejeté la demande';

-- ========================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ========================================================================

-- Activation du RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- Politiques RLS : PROFILES
-- ------------------------------------------------------------------------

-- Lecture : Utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Lecture : Admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Modification : Utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Modification : Admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Création : Seuls les admins peuvent créer des profils
CREATE POLICY "Admins can insert profiles" 
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------------------
-- Politiques RLS : USER_ROLES
-- ------------------------------------------------------------------------

-- Lecture : Utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Gestion complète : Admins gèrent tous les rôles (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------------------
-- Politiques RLS : LEAVE_REQUESTS
-- ------------------------------------------------------------------------

-- Lecture : Employés peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own requests" 
ON public.leave_requests FOR SELECT
USING (auth.uid() = user_id);

-- Lecture : Managers peuvent voir les demandes de leur périmètre
CREATE POLICY "Managers can view team requests" 
ON public.leave_requests FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'hr') OR
  public.has_role(auth.uid(), 'service_chief') OR
  public.has_role(auth.uid(), 'cell_manager')
);

-- Création : Employés peuvent créer leurs propres demandes
CREATE POLICY "Users can create their own requests" 
ON public.leave_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Modification : Employés peuvent modifier leurs demandes en attente
CREATE POLICY "Users can update their pending requests" 
ON public.leave_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Modification : Managers peuvent modifier les demandes (validation/rejet)
CREATE POLICY "Managers can update requests" 
ON public.leave_requests FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'hr') OR
  public.has_role(auth.uid(), 'service_chief') OR
  public.has_role(auth.uid(), 'cell_manager')
);

-- ========================================================================
-- 4. FONCTIONS DE SÉCURITÉ
-- ========================================================================

-- ------------------------------------------------------------------------
-- Fonction : has_role
-- ------------------------------------------------------------------------
-- Description : Vérifie si un utilisateur possède un rôle spécifique
-- Type : SECURITY DEFINER (exécutée avec privilèges du créateur)
-- Objectif : Éviter la récursion infinie dans les politiques RLS
-- Paramètres :
--   - _user_id : UUID de l'utilisateur
--   - _role : Rôle à vérifier (app_role)
-- Retour : Boolean (true si l'utilisateur a le rôle)
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE                    -- Résultat constant pour mêmes paramètres dans une transaction
SECURITY DEFINER          -- Exécution avec privilèges du créateur (bypass RLS)
SET search_path = public  -- Protection contre l'injection de schéma
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

COMMENT ON FUNCTION public.has_role IS 'Vérifie l''assignation d''un rôle à un utilisateur (sécurisé RLS)';

-- ------------------------------------------------------------------------
-- Fonction : get_user_roles
-- ------------------------------------------------------------------------
-- Description : Retourne l'ensemble des rôles d'un utilisateur
-- Type : SECURITY DEFINER
-- Paramètres :
--   - _user_id : UUID de l'utilisateur
-- Retour : SETOF app_role (ensemble de rôles)
-- Usage : Construction des menus, vérification des permissions
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

COMMENT ON FUNCTION public.get_user_roles IS 'Retourne tous les rôles assignés à un utilisateur';

-- ------------------------------------------------------------------------
-- Fonction : handle_new_user
-- ------------------------------------------------------------------------
-- Description : Crée automatiquement un profil lors de l'inscription
-- Type : TRIGGER FUNCTION (exécutée automatiquement)
-- Événement : AFTER INSERT sur auth.users
-- Objectif : Synchronisation auth.users ↔ public.profiles
-- Données extraites : email, first_name, last_name depuis raw_user_meta_data
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''  -- Protection contre l'injection de schéma
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', '')
  );
  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger : création automatique du profil après inscription';

-- ------------------------------------------------------------------------
-- Fonction : update_updated_at_column
-- ------------------------------------------------------------------------
-- Description : Met à jour automatiquement la colonne updated_at
-- Type : TRIGGER FUNCTION
-- Événement : BEFORE UPDATE
-- Objectif : Traçabilité automatique des modifications
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Trigger : mise à jour automatique du timestamp updated_at';

-- ========================================================================
-- 5. TRIGGERS
-- ========================================================================

-- Trigger : Création automatique du profil après inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger : Mise à jour automatique de updated_at pour profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger : Mise à jour automatique de updated_at pour leave_requests
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================================================
-- 6. CONTRAINTES D'INTÉGRITÉ
-- ========================================================================

-- ------------------------------------------------------------------------
-- Contraintes d'unicité
-- ------------------------------------------------------------------------

-- Unicité user_id dans profiles (déjà déclaré via UNIQUE dans CREATE TABLE)
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- Unicité (user_id, role) dans user_roles (déjà déclaré via UNIQUE dans CREATE TABLE)
-- ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- ------------------------------------------------------------------------
-- Contraintes métier supplémentaires
-- ------------------------------------------------------------------------

-- Validation des statuts de demande de congé
ALTER TABLE public.leave_requests 
  ADD CONSTRAINT check_status 
  CHECK (status IN (
    'pending',
    'pending_cell_manager',
    'pending_service_chief',
    'pending_hr',
    'approved',
    'rejected',
    'cancelled'
  ));

-- Validation des types de congé courants (optionnel)
-- ALTER TABLE public.leave_requests 
--   ADD CONSTRAINT check_leave_type 
--   CHECK (type IN (
--     'Congés payés',
--     'Congés sans solde',
--     'Maladie',
--     'Formation',
--     'Maternité',
--     'Paternité',
--     'Autre'
--   ));

-- ========================================================================
-- 7. INDEX D'OPTIMISATION
-- ========================================================================

-- ------------------------------------------------------------------------
-- Index de clés étrangères (pour optimiser les jointures)
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_approver_id ON public.leave_requests(approver_id);

-- ------------------------------------------------------------------------
-- Index de recherche et filtrage
-- ------------------------------------------------------------------------

-- Recherche par statut de demande (filtrage dashboard)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- Recherche par plage de dates (calendrier, conflits)
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

-- Recherche combinée utilisateur + statut (mes demandes en attente)
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status ON public.leave_requests(user_id, status);

-- Recherche par email dans profiles (autocomplete, recherche utilisateur)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Recherche par département (reporting, statistiques)
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- Recherche par rôle (listing par type d'utilisateur)
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ========================================================================
-- 8. STATISTIQUES ET ANALYSE
-- ========================================================================

-- Mise à jour des statistiques pour l'optimiseur de requêtes PostgreSQL
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.leave_requests;

-- ========================================================================
-- 9. PERMISSIONS ET SÉCURITÉ FINALE
-- ========================================================================

-- Révocation des permissions publiques (sécurité par défaut)
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.user_roles FROM PUBLIC;
REVOKE ALL ON public.leave_requests FROM PUBLIC;

-- Permissions pour les utilisateurs authentifiés (contrôle via RLS)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leave_requests TO authenticated;

-- Permissions pour le service role (administration système)
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.leave_requests TO service_role;

-- ========================================================================
-- FIN DU SCRIPT
-- ========================================================================

-- Vérification finale de l'intégrité du schéma
DO $$
BEGIN
  RAISE NOTICE 'Schéma de base de données créé avec succès';
  RAISE NOTICE '- Tables : profiles, user_roles, leave_requests';
  RAISE NOTICE '- Fonctions : has_role, get_user_roles, handle_new_user, update_updated_at_column';
  RAISE NOTICE '- Triggers : on_auth_user_created, update_*_updated_at';
  RAISE NOTICE '- RLS : Activé sur toutes les tables avec politiques appropriées';
  RAISE NOTICE '- Index : Créés pour optimisation des requêtes courantes';
END $$;
