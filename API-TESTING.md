# Documentation des Tests d'APIs

## Vue d'ensemble

Ce projet utilise **Supabase** comme backend avec des APIs REST générées automatiquement. Cette documentation couvre tous les endpoints disponibles, les méthodes de test, et les exemples concrets d'utilisation.

## Configuration de base

### URL de base
```
https://gazgeminiofjtbunnclv.supabase.co/rest/v1
```

### Headers requis
```http
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhemdlbWluaW9manRidW5uY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzAyNjcsImV4cCI6MjA2NzgwNjI2N30.FEChpCsU4wASSVgePFKE7a5ZYT3NZM0ya7MMjc3l9UY
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhemdlbWluaW9manRidW5uY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzAyNjcsImV4cCI6MjA2NzgwNjI2N30.FEChpCsU4wASSVgePFKE7a5ZYT3NZM0ya7MMjc3l9UY
Content-Type: application/json
Prefer: return=representation
```

## Tables et Endpoints disponibles

### 1. Profiles (`/profiles`)

Gestion des profils utilisateurs avec informations personnelles et professionnelles.

#### Schema
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "email": "string",
  "first_name": "string", 
  "last_name": "string",
  "phone": "string?",
  "department": "string?",
  "position": "string?",
  "must_change_password": "boolean",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### GET /profiles - Lister les profils
```http
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/profiles
```

**Exemple de réponse :**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "987fcdeb-51a2-43d1-9f4e-123456789012",
    "email": "jean.dupont@entreprise.com",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "+33123456789",
    "department": "IT",
    "position": "Développeur Senior",
    "must_change_password": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  }
]
```

#### GET /profiles?select=* - Avec filtres
```http
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/profiles?select=*&department=eq.IT&limit=10
```

#### POST /profiles - Créer un profil
```http
POST https://gazgeminiofjtbunnclv.supabase.co/rest/v1/profiles
Content-Type: application/json

{
  "user_id": "987fcdeb-51a2-43d1-9f4e-123456789012",
  "email": "marie.martin@entreprise.com",
  "first_name": "Marie",
  "last_name": "Martin",
  "phone": "+33987654321",
  "department": "RH",
  "position": "Responsable RH"
}
```

**Réponse attendue (201 Created) :**
```json
{
  "id": "456e7890-e12b-34d5-a678-901234567890",
  "user_id": "987fcdeb-51a2-43d1-9f4e-123456789012",
  "email": "marie.martin@entreprise.com",
  "first_name": "Marie",
  "last_name": "Martin",
  "phone": "+33987654321",
  "department": "RH",
  "position": "Responsable RH",
  "must_change_password": true,
  "created_at": "2024-01-21T09:15:00Z",
  "updated_at": "2024-01-21T09:15:00Z"
}
```

#### PATCH /profiles - Modifier un profil
```http
PATCH https://gazgeminiofjtbunnclv.supabase.co/rest/v1/profiles?id=eq.123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "phone": "+33111222333",
  "position": "Lead Developer",
  "must_change_password": false
}
```

### 2. User Roles (`/user_roles`)

Gestion des rôles utilisateurs dans le système.

#### Schema
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "role": "admin | hr | service_chief | cell_manager | employee",
  "created_at": "timestamp"
}
```

#### GET /user_roles - Lister les rôles
```http
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/user_roles?select=*,profiles(first_name,last_name,email)
```

**Exemple de réponse :**
```json
[
  {
    "id": "789e0123-e45f-67g8-h901-234567890123",
    "user_id": "987fcdeb-51a2-43d1-9f4e-123456789012", 
    "role": "admin",
    "created_at": "2024-01-15T10:30:00Z",
    "profiles": {
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@entreprise.com"
    }
  }
]
```

#### POST /user_roles - Assigner un rôle
```http
POST https://gazgeminiofjtbunnclv.supabase.co/rest/v1/user_roles
Content-Type: application/json

{
  "user_id": "987fcdeb-51a2-43d1-9f4e-123456789012",
  "role": "cell_manager"
}
```

#### Filtrer par rôle spécifique
```http
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/user_roles?role=eq.admin
```

### 3. Leave Requests (`/leave_requests`)

Gestion des demandes de congé avec workflow d'approbation.

#### Schema
```json
{
  "id": "uuid",
  "user_id": "uuid", 
  "type": "string",
  "start_date": "date",
  "end_date": "date",
  "reason": "string?",
  "status": "pending | approved | rejected",
  "approver_id": "uuid?",
  "approved_at": "timestamp?",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### GET /leave_requests - Lister les demandes
```http
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/leave_requests?select=*,profiles!user_id(first_name,last_name,email)
```

**Exemple de réponse :**
```json
[
  {
    "id": "321e6547-e98b-21d3-a654-426714174000",
    "user_id": "987fcdeb-51a2-43d1-9f4e-123456789012",
    "type": "Congé annuel",
    "start_date": "2024-02-15",
    "end_date": "2024-02-20", 
    "reason": "Vacances d'hiver",
    "status": "pending",
    "approver_id": null,
    "approved_at": null,
    "created_at": "2024-01-25T14:30:00Z",
    "updated_at": "2024-01-25T14:30:00Z",
    "profiles": {
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@entreprise.com"
    }
  }
]
```

#### POST /leave_requests - Créer une demande
```http
POST https://gazgeminiofjtbunnclv.supabase.co/rest/v1/leave_requests
Content-Type: application/json

{
  "user_id": "987fcdeb-51a2-43d1-9f4e-123456789012",
  "type": "Congé maladie",
  "start_date": "2024-02-01",
  "end_date": "2024-02-03",
  "reason": "Grippe saisonnière"
}
```

#### PATCH /leave_requests - Approuve/Rejeter une demande
```http
PATCH https://gazgeminiofjtbunnclv.supabase.co/rest/v1/leave_requests?id=eq.321e6547-e98b-21d3-a654-426714174000
Content-Type: application/json

{
  "status": "approved",
  "approver_id": "789e0123-e45f-67g8-h901-234567890123",
  "approved_at": "2024-01-26T10:15:00Z"
}
```

#### Filtres avancés pour les demandes
```http
# Demandes en attente
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/leave_requests?status=eq.pending

# Demandes d'un utilisateur spécifique
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/leave_requests?user_id=eq.987fcdeb-51a2-43d1-9f4e-123456789012

# Demandes par période
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/leave_requests?start_date=gte.2024-02-01&end_date=lte.2024-02-29

# Demandes avec tri par date
GET https://gazgeminiofjtbunnclv.supabase.co/rest/v1/leave_requests?order=created_at.desc
```

## Fonctions RPC (Remote Procedure Calls)

### has_role - Vérifier les rôles utilisateur
```http
POST https://gazgeminiofjtbunnclv.supabase.co/rest/v1/rpc/has_role
Content-Type: application/json

{
  "_user_id": "987fcdeb-51a2-43d1-9f4e-123456789012",
  "_role": "admin"
}
```

**Réponse :**
```json
true
```

### get_user_roles - Obtenir tous les rôles d'un utilisateur
```http
POST https://gazgeminiofjtbunnclv.supabase.co/rest/v1/rpc/get_user_roles
Content-Type: application/json

{
  "_user_id": "987fcdeb-51a2-43d1-9f4e-123456789012"
}
```

**Réponse :**
```json
["admin", "cell_manager"]
```

## Tests automatisés avec Postman

### Configuration des variables d'environnement

Créez un environnement Postman avec ces variables :

```json
{
  "baseUrl": "https://gazgeminiofjtbunnclv.supabase.co/rest/v1",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhemdlbWluaW9manRidW5uY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzAyNjcsImV4cCI6MjA2NzgwNjI2N30.FEChpCsU4wASSVgePFKE7a5ZYT3NZM0ya7MMjc3l9UY",
  "userId": "987fcdeb-51a2-43d1-9f4e-123456789012",
  "profileId": "",
  "leaveRequestId": ""
}
```

### Scripts de test automatisés

#### Test création de profil
```javascript
// Dans l'onglet "Tests" de Postman
pm.test("Profile creation successful", function () {
    pm.response.to.have.status(201);
    
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData.email).to.include('@');
    
    // Sauvegarder l'ID pour les tests suivants
    pm.environment.set("profileId", jsonData.id);
});

pm.test("Profile has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('first_name');
    pm.expect(jsonData).to.have.property('last_name');
    pm.expect(jsonData).to.have.property('email');
    pm.expect(jsonData.must_change_password).to.be.a('boolean');
});
```

#### Test validation des données
```javascript
pm.test("Response time is less than 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

pm.test("Email format is valid", function () {
    const jsonData = pm.response.json();
    if (Array.isArray(jsonData)) {
        jsonData.forEach(item => {
            pm.expect(item.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });
    } else {
        pm.expect(jsonData.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
});
```

#### Test de workflow de congé
```javascript
// Test création demande de congé
pm.test("Leave request created successfully", function () {
    pm.response.to.have.status(201);
    
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.equal("pending");
    pm.expect(jsonData.start_date).to.be.a('string');
    pm.expect(jsonData.end_date).to.be.a('string');
    
    pm.environment.set("leaveRequestId", jsonData.id);
});

// Test approbation
pm.test("Leave request approval works", function () {
    pm.response.to.have.status(200);
    
    const jsonData = pm.response.json();
    pm.expect(jsonData[0].status).to.equal("approved");
    pm.expect(jsonData[0].approved_at).to.not.be.null;
});
```

## Scénarios de test complets

### Scénario 1 : Cycle de vie d'un employé

1. **Créer un profil employé**
2. **Assigner le rôle "employee"**
3. **Vérifier les permissions**
4. **Créer une demande de congé**
5. **Changer le rôle en "cell_manager"**
6. **Approuver la demande**

### Scénario 2 : Tests de sécurité RLS

1. **Tenter d'accéder aux données sans authentification** (doit échouer)
2. **Tester l'isolation des données par utilisateur**
3. **Vérifier les permissions par rôle**

### Scénario 3 : Tests de performance

1. **Création en lot de 100 profils**
2. **Requêtes avec pagination**
3. **Requêtes complexes avec jointures**

## Codes de réponse HTTP

| Code | Statut | Description |
|------|--------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 204 | No Content | Modification réussie sans contenu retourné |
| 400 | Bad Request | Erreur dans la requête |
| 401 | Unauthorized | Authentification requise |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Conflit de données (ex: email déjà utilisé) |
| 422 | Unprocessable Entity | Validation échouée |
| 500 | Internal Server Error | Erreur serveur |

## Exemples d'erreurs courantes

### Erreur d'authentification
```json
{
  "code": "401",
  "message": "Invalid API key"
}
```

### Erreur de validation
```json
{
  "code": "23505", 
  "details": "Key (email)=(test@example.com) already exists.",
  "hint": null,
  "message": "duplicate key value violates unique constraint \"profiles_email_key\""
}
```

### Erreur RLS
```json
{
  "code": "42501",
  "message": "new row violates row-level security policy for table \"profiles\""
}
```

## Collection Postman

Importez le fichier `postman-collection.json` présent dans le projet pour avoir accès à tous les tests pré-configurés.

### Commandes pour lancer les tests

```bash
# Lancer toute la collection
newman run postman-collection.json -e environment.json

# Lancer un dossier spécifique
newman run postman-collection.json -e environment.json --folder "Profiles API"

# Génerer un rapport HTML
newman run postman-collection.json -e environment.json --reporters cli,html --reporter-html-export report.html
```

## Monitoring et logging

### Supabase Analytics
- Consultez les logs d'API dans le dashboard Supabase
- Surveillez les performances des requêtes
- Analysez les erreurs et timeouts

### Métriques importantes
- Temps de réponse moyen < 200ms
- Taux d'erreur < 1%
- Throughput : nombre de requêtes/minute
- Disponibilité > 99.9%

## Bonnes pratiques

1. **Toujours utiliser les headers d'authentification**
2. **Tester les cas d'erreur autant que les cas de succès**
3. **Utiliser des données de test dédiées**
4. **Nettoyer les données après les tests**
5. **Documenter les cas de test spécifiques**
6. **Versionner les collections Postman**
7. **Automatiser les tests dans la CI/CD**