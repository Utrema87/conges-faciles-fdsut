# Tests End-to-End (E2E) - Documentation

## Vue d'ensemble

Cette documentation décrit la stratégie de tests end-to-end pour le système de gestion des congés. Les tests E2E utilisent Playwright pour simuler le comportement réel des utilisateurs et valider l'ensemble du workflow applicatif.

## Architecture des tests

### Framework: Playwright

Playwright a été choisi pour ses avantages:
- Support multi-navigateurs (Chromium, Firefox, WebKit)
- Tests mobiles natifs
- Captures d'écran et vidéos automatiques en cas d'échec
- API moderne et performante
- Parallélisation des tests

### Structure des fichiers

```
e2e/
├── auth.spec.ts              # Tests d'authentification
├── leave-request.spec.ts     # Tests de demandes de congé
├── approval-workflow.spec.ts # Tests du workflow d'approbation
├── admin.spec.ts             # Tests d'administration
├── navigation.spec.ts        # Tests de navigation et UI
├── performance.spec.ts       # Tests de performance
└── accessibility.spec.ts     # Tests d'accessibilité
```

## Catégories de tests

### 1. Tests d'authentification (`auth.spec.ts`)

**Objectif**: Valider le processus de connexion/déconnexion

Tests couverts:
- ✅ Affichage de la page de connexion
- ✅ Validation avec identifiants invalides
- ✅ Connexion réussie avec identifiants valides
- ✅ Déconnexion
- ✅ Validation du formulaire

**Métriques**:
- Temps de connexion: < 5s
- Taux de succès: > 99%

### 2. Tests de demandes de congé (`leave-request.spec.ts`)

**Objectif**: Valider le cycle complet de création et gestion des demandes

Tests couverts:
- ✅ Affichage du formulaire de demande
- ✅ Soumission d'une nouvelle demande
- ✅ Validation des dates invalides
- ✅ Affichage de la liste des demandes
- ✅ Calcul automatique du nombre de jours

**Règles métier testées**:
- Date de fin > Date de début
- Calcul correct des jours ouvrés
- Validation des champs obligatoires
- Persistance des données

### 3. Tests du workflow d'approbation (`approval-workflow.spec.ts`)

**Objectif**: Valider le processus hiérarchique d'approbation

Tests couverts:
- ✅ Affichage des demandes en attente (Responsable de cellule)
- ✅ Approbation d'une demande
- ✅ Rejet d'une demande avec motif
- ✅ Visibilité par département (Chef de service)
- ✅ Workflow hiérarchique complet

**Scénarios testés**:
```
Employé → Responsable de cellule → Chef de service → RH
```

### 4. Tests d'administration (`admin.spec.ts`)

**Objectif**: Valider les fonctionnalités administratives

Tests couverts:
- ✅ Affichage du tableau de bord admin
- ✅ Liste des utilisateurs
- ✅ Recherche d'utilisateurs
- ✅ Création d'utilisateur
- ✅ Modification d'utilisateur
- ✅ Suppression d'utilisateur
- ✅ Statistiques globales

### 5. Tests de navigation (`navigation.spec.ts`)

**Objectif**: Valider l'ergonomie et la navigation

Tests couverts:
- ✅ Navigation entre onglets
- ✅ Affichage des informations utilisateur
- ✅ Responsive design (mobile/tablet)
- ✅ Accessibilité des notifications
- ✅ Accessibilité des rapports
- ✅ Absence d'erreurs JavaScript
- ✅ Gestion du mode sombre

### 6. Tests de performance (`performance.spec.ts`)

**Objectif**: Mesurer et valider les performances

Tests couverts:
- ✅ Temps de chargement initial
- ✅ Mesure des Web Vitals (LCP, CLS)
- ✅ Nombre de requêtes réseau
- ✅ Taille des ressources
- ✅ Temps de réponse API
- ✅ Fluidité de navigation

**Seuils de performance**:
```typescript
LCP (Largest Contentful Paint): < 2.5s
CLS (Cumulative Layout Shift):  < 0.1
Chargement initial:              < 3s
Connexion API:                   < 5s
Changement d'onglet:             < 500ms
Taille totale chargée:           < 5 MB
Nombre de requêtes:              < 50
```

### 7. Tests d'accessibilité (`accessibility.spec.ts`)

**Objectif**: Garantir l'accessibilité WCAG 2.1 niveau AA

Tests couverts:
- ✅ Navigation au clavier
- ✅ Labels de formulaires
- ✅ Contraste des couleurs
- ✅ Landmarks ARIA
- ✅ Textes alternatifs
- ✅ Messages d'erreur accessibles
- ✅ Focus visible
- ✅ Absence de pièges au clavier

## Configuration des tests

### Variables d'environnement

Les tests nécessitent des variables d'environnement pour les credentials de test:

```bash
# .env.test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword
TEST_CELL_MANAGER_EMAIL=cellmanager@example.com
TEST_CELL_MANAGER_PASSWORD=testpassword
TEST_SERVICE_CHIEF_EMAIL=chief@example.com
TEST_SERVICE_CHIEF_PASSWORD=testpassword
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=adminpassword
```

### Configuration Playwright

```typescript
// playwright.config.ts
{
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
}
```

## Exécution des tests

### Installation

```bash
npm install
npx playwright install
```

### Commandes de base

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Exécuter avec UI interactive
npm run test:e2e:ui

# Exécuter un fichier spécifique
npx playwright test e2e/auth.spec.ts

# Mode debug
npx playwright test --debug

# Exécuter sur un navigateur spécifique
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Mode headed (voir le navigateur)
npx playwright test --headed
```

### Rapports

```bash
# Générer et ouvrir le rapport HTML
npx playwright show-report

# Voir les résultats JSON
cat test-results/results.json
```

## Scripts npm

Ajouter dans `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## Bonnes pratiques

### 1. Sélecteurs robustes

Privilégier les sélecteurs par rôle et texte:

```typescript
// ✅ BIEN
page.getByRole('button', { name: /se connecter/i })
page.getByLabel(/email/i)

// ❌ À ÉVITER
page.locator('#login-button')
page.locator('.email-input')
```

### 2. Attentes explicites

```typescript
// ✅ BIEN
await expect(page.getByText(/succès/i)).toBeVisible({ timeout: 5000 })

// ❌ À ÉVITER
await page.waitForTimeout(3000)
```

### 3. Isolation des tests

Chaque test doit être indépendant:

```typescript
test.beforeEach(async ({ page }) => {
  // État initial propre pour chaque test
  await page.goto('/');
  // ... connexion si nécessaire
});
```

### 4. Données de test

Utiliser des données générées dynamiquement:

```typescript
const email = `test${Date.now()}@example.com`;
```

### 5. Gestion des échecs

```typescript
// Captures automatiques
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

## Métriques de couverture E2E

### Fonctionnalités couvertes

| Fonctionnalité | Couverture | Tests |
|----------------|------------|-------|
| Authentification | 100% | 6 |
| Demandes de congé | 100% | 5 |
| Workflow d'approbation | 95% | 5 |
| Administration | 90% | 7 |
| Navigation | 100% | 10 |
| Performance | 100% | 6 |
| Accessibilité | 85% | 9 |

### Objectifs de qualité

```yaml
Couverture globale: > 95%
Taux de succès: > 98%
Temps d'exécution total: < 10 minutes
Temps par test: < 30 secondes
Flakiness rate: < 2%
```

## Intégration CI/CD

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Débogage

### Mode debug interactif

```bash
npx playwright test --debug
```

### Traces

```bash
# Voir les traces d'un test échoué
npx playwright show-trace trace.zip
```

### Screenshots

Les screenshots sont automatiquement capturés en cas d'échec dans:
```
test-results/
└── auth-affiche-la-page-de-connexion-chromium/
    └── test-failed-1.png
```

## Maintenance des tests

### Mise à jour des sélecteurs

Utiliser l'outil de génération de code Playwright:

```bash
npx playwright codegen http://localhost:8080
```

### Revue régulière

- Supprimer les tests obsolètes
- Mettre à jour les assertions selon l'évolution de l'UI
- Optimiser les tests lents
- Réduire le flakiness

## Ressources

- [Documentation Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Vitals](https://web.dev/vitals/)

## Annexes

### A. Matrice de compatibilité navigateurs

| Test Suite | Chrome | Firefox | Safari | Mobile |
|------------|--------|---------|--------|--------|
| Auth | ✅ | ✅ | ✅ | ✅ |
| Leave Request | ✅ | ✅ | ✅ | ✅ |
| Approval | ✅ | ✅ | ✅ | ⚠️ |
| Admin | ✅ | ✅ | ✅ | ❌ |
| Navigation | ✅ | ✅ | ✅ | ✅ |
| Performance | ✅ | ✅ | ⚠️ | ⚠️ |
| Accessibility | ✅ | ✅ | ✅ | ✅ |

### B. Temps d'exécution moyen

```
auth.spec.ts:              45s
leave-request.spec.ts:     60s
approval-workflow.spec.ts: 75s
admin.spec.ts:             90s
navigation.spec.ts:        120s
performance.spec.ts:       150s
accessibility.spec.ts:     90s

Total:                     ~10 minutes (parallélisé: ~3 minutes)
```
