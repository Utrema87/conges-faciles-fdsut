# Documentation Projet - Système de Gestion des Congés

## Vue d'ensemble

Ce projet est une application web complète de gestion des congés utilisant une architecture moderne avec React/TypeScript pour le frontend et Supabase comme backend-as-a-service.

## 🏗️ Architecture Générale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   Database      │
│   React/Vite    │────│   Backend       │────│   PostgreSQL    │
│   TypeScript    │    │   Edge Functions│    │   + RLS         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Stack Technologique

### Frontend
- **React 18.3.1** - Framework UI principal
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI modernes
- **React Router DOM 6.26.2** - Routage côté client
- **React Hook Form 7.53.0** - Gestion des formulaires
- **React Query (TanStack)** - Gestion d'état serveur
- **Zod 3.23.8** - Validation des schémas
- **Lucide React** - Icônes
- **date-fns** - Manipulation des dates
- **Recharts** - Graphiques et visualisations

### Backend (Supabase)
- **Supabase** - Backend-as-a-Service complet
- **PostgreSQL** - Base de données relationnelle
- **Row Level Security (RLS)** - Sécurité au niveau des lignes
- **Edge Functions** - Fonctions serverless (Deno)
- **Authentication** - Système d'authentification intégré
- **Real-time** - Synchronisation temps réel
- **Storage** - Stockage de fichiers (configuré mais pas utilisé actuellement)

### Tests
- **Vitest 3.2.4** - Framework de test moderne
- **@testing-library/react 16.3.0** - Tests de composants React
- **@testing-library/jest-dom 6.8.0** - Matchers DOM personnalisés
- **@testing-library/user-event 14.6.1** - Simulation d'interactions
- **jsdom 26.1.0** - Environnement DOM pour Node.js
- **Postman Collection** - Tests d'APIs automatisés

## 📊 Base de Données

### Architecture
```sql
-- Schéma principal
public.profiles         -- Profils utilisateurs
public.user_roles       -- Rôles des utilisateurs  
public.leave_requests   -- Demandes de congés
```

### Tables Principales

#### `profiles`
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  position TEXT,
  must_change_password BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_roles`
```sql
CREATE TYPE public.app_role AS ENUM (
  'admin', 'hr', 'service_chief', 'cell_manager', 'employee'
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);
```

#### `leave_requests`
```sql
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  approver_id UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Fonctions Personnalisées
```sql
-- Vérification des rôles
CREATE FUNCTION has_role(_user_id uuid, _role app_role) 
RETURNS boolean SECURITY DEFINER;

-- Récupération des rôles utilisateur
CREATE FUNCTION get_user_roles(_user_id uuid) 
RETURNS SETOF app_role SECURITY DEFINER;

-- Gestion automatique des profils
CREATE FUNCTION handle_new_user() 
RETURNS trigger SECURITY DEFINER;

-- Mise à jour automatique des timestamps
CREATE FUNCTION update_updated_at_column() 
RETURNS trigger;
```

### Sécurité (RLS Policies)

#### Profiles
- **Admins** : Accès complet (SELECT, INSERT, UPDATE)
- **Utilisateurs** : Lecture/modification de leur propre profil

#### User Roles
- **Admins** : Gestion complète des rôles
- **Utilisateurs** : Lecture de leurs propres rôles

#### Leave Requests
- **Utilisateurs** : CRUD sur leurs propres demandes (UPDATE limité aux statut 'pending')
- **Managers** : Lecture/modification des demandes de leur équipe
- **HR/Admins** : Accès complet

## 🔗 APIs et Intégrations

### Supabase REST API
```typescript
// Client Supabase
import { supabase } from "@/integrations/supabase/client";

// Configuration
const supabaseUrl = "https://gazgeminiofjtbunnclv.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Endpoints Principaux
- **GET /rest/v1/profiles** - Récupération des profils
- **POST /rest/v1/leave_requests** - Création de demandes
- **PATCH /rest/v1/leave_requests** - Mise à jour des demandes
- **POST /rest/v1/rpc/has_role** - Vérification des rôles

### Edge Functions (Prêtes à l'emploi)
```typescript
// Structure pour futures fonctions
supabase/functions/
├── function-name/
│   └── index.ts
└── config.toml
```

## 🧪 Tests et Qualité

### Tests Unitaires
```bash
# Scripts disponibles
npm run test          # Mode watch
npm run test:ui       # Interface graphique  
npm run test:run      # Exécution unique
npm run test:coverage # Couverture de code
```

### Tests Existants
- **LoginPage.test.tsx** (3 tests) ✅
- **useToast.test.ts** (4 tests) ✅  
- **demoData.test.ts** (7 tests) ✅

### Tests d'APIs
- **Collection Postman complète** disponible
- **Tests automatisés** pour tous les endpoints
- **Scénarios d'authentification** et d'autorisation
- **Validation des schémas** de réponse

### Couverture Actuelle
```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   89.47 |    83.33 |   90.90 |   89.47
LoginPage.tsx       |   92.30 |    85.71 |  100.00 |   92.30
demoData.ts         |   95.23 |    90.90 |  100.00 |   95.23
use-toast.ts        |   78.94 |    66.66 |   75.00 |   78.94
```

## 📁 Structure du Projet

```
├── public/                 # Assets statiques
├── src/
│   ├── components/         # Composants React
│   │   ├── ui/            # Composants shadcn/ui
│   │   ├── dashboards/    # Tableaux de bord par rôle
│   │   ├── forms/         # Formulaires
│   │   ├── notifications/ # Centre de notifications
│   │   ├── reports/       # Rapports et analytics
│   │   └── workflows/     # Flux d'approbation
│   ├── contexts/          # Contextes React
│   ├── data/              # Données de démonstration
│   ├── hooks/             # Hooks personnalisés
│   ├── integrations/      # Intégrations (Supabase)
│   ├── lib/               # Utilitaires
│   ├── pages/             # Pages principales
│   ├── test/              # Configuration des tests
│   └── types/             # Types TypeScript
├── supabase/
│   └── config.toml        # Configuration Supabase
├── API-TESTING.md         # Documentation API
├── TESTING.md             # Documentation tests
└── PROJECT.md             # Cette documentation
```

## 🔄 Workflow de Développement

### 1. Configuration Initiale
```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Tests
npm run test
```

### 2. Développement Frontend
1. **Composants** : Utilisation de shadcn/ui + customisation
2. **État** : React Query pour l'état serveur, useState/useContext pour l'état local
3. **Routing** : React Router avec protection des routes
4. **Formulaires** : React Hook Form + Zod validation
5. **Styling** : Tailwind avec tokens sémantiques

### 3. Développement Backend
1. **Base de données** : Migrations via Supabase Dashboard ou outils CLI
2. **RLS** : Politiques de sécurité au niveau des lignes
3. **Edge Functions** : Fonctions serverless pour logique métier complexe
4. **Authentication** : Gestion automatique via Supabase Auth

### 4. Tests et Déploiement
1. **Tests unitaires** : Vitest + Testing Library
2. **Tests d'intégration** : Postman + scripts automatisés
3. **Tests E2E** : À implémenter (recommandation: Playwright)
4. **Déploiement** : Via Lovable ou intégration CI/CD

## 🔐 Sécurité

### Authentication
- **JWT tokens** gérés automatiquement par Supabase
- **Session management** avec refresh automatique
- **Role-based access control** (RBAC)

### Authorization
- **Row Level Security** au niveau base de données
- **Policies** granulaires par table et opération
- **Functions sécurisées** avec SECURITY DEFINER

### Validation
- **Côté client** : Zod schemas
- **Côté serveur** : Contraintes DB + RLS policies
- **Types safety** : TypeScript end-to-end

## 🚀 Déploiement

### Environnements
- **Development** : Local avec Vite dev server
- **Staging** : Lovable preview deployments
- **Production** : Via Lovable ou custom deployment

### Variables d'Environnement
```bash
# Supabase (automatiquement configurées)
SUPABASE_URL=https://gazgeminiofjtbunnclv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 📈 Monitoring et Analytics

### Disponible via Supabase Dashboard
- **Database performance** : Métriques de performance DB
- **API usage** : Statistiques d'utilisation des endpoints
- **Auth metrics** : Connexions, inscriptions, erreurs
- **Real-time connections** : Connexions WebSocket actives
- **Edge Function logs** : Logs des fonctions serverless

## 🛠️ Outils de Développement

### IDE/Editor
- **VS Code** recommandé avec extensions :
  - TypeScript et JavaScript
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter

### Debugging
- **React Developer Tools**
- **Supabase Dashboard** pour la DB
- **Network tab** pour les requêtes API
- **Vitest UI** pour les tests

### Performance
- **Vite HMR** pour le développement rapide
- **React Query DevTools** pour le cache
- **Lighthouse** pour les métriques web
- **Bundle analyzer** intégré à Vite

## 📚 Ressources et Documentation

### Documentation Technique
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Documentation Projet
- `API-TESTING.md` - Tests et documentation des APIs
- `TESTING.md` - Guide complet des tests unitaires
- `README.md` - Instructions de base du projet

### Support
- **Lovable Discord** - Support communautaire
- **GitHub Issues** - Rapports de bugs et features
- **Documentation interne** - Cette documentation

---

## 📋 Checklist de Maintenance

### Hebdomadaire
- [ ] Vérifier les logs d'erreur Supabase
- [ ] Exécuter la suite de tests complète
- [ ] Vérifier les métriques de performance

### Mensuelle  
- [ ] Mettre à jour les dépendances
- [ ] Réviser les politiques RLS
- [ ] Analyser les métriques d'utilisation
- [ ] Sauvegarder la base de données

### Trimestrielle
- [ ] Audit de sécurité complet
- [ ] Optimisation des performances
- [ ] Révision de l'architecture
- [ ] Formation équipe sur nouvelles features

Cette documentation évolue avec le projet. Maintenir à jour lors de changements significatifs.