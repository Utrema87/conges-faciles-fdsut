# Tests API - Automatisation et Options de Déploiement

## 🎯 Options Disponibles

Vous avez plusieurs options pour exécuter les tests API :

### 1. **Postman en Local** ✅ Recommandé
### 2. **GitHub Actions** (CI/CD automatisé)
### 3. **Newman CLI** (ligne de commande)
### 4. **Tests intégrés dans le projet**

---

## 📋 1. Postman en Local

### Installation et Configuration

```bash
# 1. Télécharger Postman Desktop
# https://www.postman.com/downloads/

# 2. Importer la collection existante
# Fichier: postman-collection.json (déjà disponible dans le projet)
```

### Utilisation
1. **Ouvrir Postman**
2. **Importer** → Sélectionner `postman-collection.json`
3. **Configurer les variables d'environnement** :

```json
{
  "SUPABASE_URL": "https://gazgeminiofjtbunnclv.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "BASE_URL": "{{SUPABASE_URL}}/rest/v1"
}
```

4. **Exécuter la collection** avec le Runner Postman

### Avantages Local
- ✅ Interface graphique intuitive
- ✅ Debugging facile des requêtes
- ✅ Gestion des environnements (dev, staging, prod)
- ✅ Rapports détaillés avec captures d'écran
- ✅ Tests en temps réel pendant le développement

---

## 🔄 2. GitHub Actions (Automatisation CI/CD)

### Configuration Automatique

Création d'un workflow GitHub Actions pour tester automatiquement les APIs :

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    # Tests automatiques chaque jour à 6h UTC
    - cron: '0 6 * * *'

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install Newman
      run: npm install -g newman newman-reporter-html
    
    - name: Run Postman Collection
      run: |
        newman run postman-collection.json \
          --env-var "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" \
          --env-var "SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}" \
          --reporters cli,html \
          --reporter-html-export api-test-report.html
    
    - name: Upload Test Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: api-test-report
        path: api-test-report.html
    
    - name: Comment PR with Results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          // Logique pour commenter les résultats sur la PR
```

### Configuration des Secrets GitHub

Dans GitHub → Settings → Secrets and Variables → Actions :

```
SUPABASE_URL = https://gazgeminiofjtbunnclv.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIs...
```

### Avantages GitHub Actions
- ✅ Tests automatiques sur chaque commit/PR
- ✅ Tests planifiés (daily, weekly)
- ✅ Intégration avec les pull requests
- ✅ Rapports automatiques
- ✅ Notifications en cas d'échec
- ✅ Historique des tests

---

## 💻 3. Newman CLI (Command Line)

### Installation

```bash
# Installation globale
npm install -g newman

# Ou installation locale dans le projet
npm install --save-dev newman newman-reporter-html
```

### Scripts Package.json

```json
{
  "scripts": {
    "api:test": "newman run postman-collection.json --env-var SUPABASE_URL=https://gazgeminiofjtbunnclv.supabase.co",
    "api:test:report": "newman run postman-collection.json --reporters cli,html --reporter-html-export api-report.html",
    "api:test:ci": "newman run postman-collection.json --reporters cli,junit --reporter-junit-export api-results.xml"
  }
}
```

### Utilisation

```bash
# Test simple
npm run api:test

# Test avec rapport HTML
npm run api:test:report

# Test pour CI/CD avec format JUnit
npm run api:test:ci

# Test avec variables d'environnement personnalisées
newman run postman-collection.json \
  --env-var "SUPABASE_URL=https://gazgeminiofjtbunnclv.supabase.co" \
  --env-var "SUPABASE_ANON_KEY=your_key_here"
```

---

## 🧪 4. Tests Intégrés au Projet

### Option A: Tests Vitest pour APIs

```typescript
// src/tests/api/api.test.ts
import { describe, it, expect } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

describe('Supabase API Tests', () => {
  it('should fetch profiles', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should handle authentication', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    })
    
    // Test selon votre logique d'auth
    expect(error).toBeDefined() // Car test user n'existe pas
  })
})
```

### Option B: Tests Playwright E2E avec APIs

```typescript
// tests/api/endpoints.spec.ts
import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('profiles endpoint responds correctly', async ({ request }) => {
    const response = await request.get('/rest/v1/profiles', {
      headers: {
        'apikey': 'your_supabase_key',
        'Authorization': 'Bearer your_token'
      }
    })
    
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })
})
```

---

## 📊 Comparaison des Options

| Option | Local Dev | CI/CD | Facilité | Automatisation | Rapports |
|--------|-----------|--------|----------|----------------|----------|
| **Postman Local** | ✅ Excellent | ❌ Manuel | ✅ Très facile | ❌ Manuel | ✅ Excellent |
| **GitHub Actions** | ❌ Non | ✅ Parfait | ⚠️ Config requise | ✅ Parfait | ✅ Bon |
| **Newman CLI** | ✅ Bon | ✅ Excellent | ⚠️ CLI | ✅ Scriptable | ✅ Bon |
| **Tests intégrés** | ✅ Excellent | ✅ Excellent | ⚠️ Dev requis | ✅ Parfait | ⚠️ Basique |

---

## 🚀 Recommandations par Usage

### Pour le **Développement** quotidien :
```bash
1. Postman Desktop (interface graphique)
2. Newman CLI pour tests rapides
```

### Pour **CI/CD** et automatisation :
```bash
1. GitHub Actions (tests sur chaque commit)
2. Newman CLI dans les scripts
```

### Pour **Tests avancés** :
```bash
1. Tests Vitest intégrés au projet
2. Playwright pour tests E2E
```

---

## 🔧 Configuration Recommandée

### Setup Complet

1. **Postman Local** pour développement
2. **GitHub Actions** pour CI/CD
3. **Scripts NPM** pour accès rapide

### Scripts Package.json Complets

```json
{
  "scripts": {
    "test": "vitest",
    "test:api": "newman run postman-collection.json",
    "test:api:dev": "newman run postman-collection.json --env-var SUPABASE_URL=http://localhost:54321",
    "test:api:staging": "newman run postman-collection.json --env-var ENVIRONMENT=staging",
    "test:api:prod": "newman run postman-collection.json --env-var ENVIRONMENT=production",
    "test:api:report": "newman run postman-collection.json --reporters html --reporter-html-export reports/api-test-report.html",
    "test:all": "npm run test && npm run test:api"
  }
}
```

---

## 📋 Checklist de Mise en Place

### Postman Local
- [ ] Installer Postman Desktop
- [ ] Importer `postman-collection.json`
- [ ] Configurer les variables d'environnement
- [ ] Tester quelques endpoints manuellement

### GitHub Actions  
- [ ] Créer `.github/workflows/api-tests.yml`
- [ ] Configurer les secrets GitHub
- [ ] Tester le workflow sur une branche
- [ ] Configurer les notifications

### Newman CLI
- [ ] Installer Newman (`npm install -g newman`)
- [ ] Ajouter les scripts dans `package.json`
- [ ] Tester en local
- [ ] Documenter l'usage pour l'équipe

---

## 🎯 Prochaines Étapes

1. **Choisir votre approche** préférée selon vos besoins
2. **Configurer les tests** selon les instructions ci-dessus
3. **Tester la configuration** avec quelques endpoints
4. **Automatiser** selon votre workflow de développement

La collection Postman existe déjà dans `postman-collection.json` - vous pouvez commencer immédiatement avec n'importe laquelle de ces options !