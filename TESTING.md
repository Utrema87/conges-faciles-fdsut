# Guide des Tests Unitaires

## Configuration

Le projet utilise **Vitest** comme framework de test avec **@testing-library/react** pour tester les composants React.

### Dépendances installées :

#### Framework de test principal
- **`vitest`** (v3.2.4) - Framework de test moderne et rapide
  - Alternative à Jest, optimisé pour Vite
  - Support natif des modules ES
  - Interface graphique intégrée
  - Watch mode intelligent

#### Outils de test React
- **`@testing-library/react`** (v16.3.0) - Utilitaires pour tester les composants React
  - `render()` - Rendu des composants pour les tests
  - `screen` - Accès aux éléments DOM
  - Intégration avec les hooks React
  
- **`@testing-library/dom`** (v10.4.1) - Utilitaires DOM de bas niveau
  - Sélecteurs sémantiques (`getByRole`, `getByText`, etc.)
  - Queries accessibles et centrées utilisateur
  
- **`@testing-library/user-event`** (v14.6.1) - Simulation d'interactions utilisateur réalistes
  - `userEvent.click()` - Simulation de clics
  - `userEvent.type()` - Simulation de saisie clavier
  - `userEvent.hover()` - Simulation de survol
  - Plus réaliste que `fireEvent`

#### Matchers et assertions
- **`@testing-library/jest-dom`** (v6.8.0) - Matchers DOM personnalisés
  - `toBeInTheDocument()` - Vérifier la présence d'un élément
  - `toHaveValue()` - Vérifier la valeur d'un input
  - `toHaveClass()` - Vérifier les classes CSS
  - `toBeVisible()` - Vérifier la visibilité

#### Environnement de test
- **`jsdom`** (v26.1.0) - Environnement DOM simulé pour Node.js
  - Simulation complète du DOM
  - Support des APIs Web (localStorage, fetch, etc.)
  - Rendu sans navigateur

## Scripts disponibles

```bash
# Lancer les tests en mode watch
npm run test

# Lancer les tests avec interface graphique
npm run test:ui

# Lancer les tests une seule fois
npm run test:run

# Lancer les tests avec couverture de code
npm run test:coverage
```

## Structure des tests

```
src/
├── test/
│   ├── setup.ts          # Configuration globale des tests
│   └── utils.tsx          # Utilitaires et wrappers pour les tests
├── components/
│   └── __tests__/         # Tests des composants
├── hooks/
│   └── __tests__/         # Tests des hooks
└── data/
    └── __tests__/         # Tests des utilitaires et données
```

## Exemples de tests

### Test d'un composant React

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Test d'un hook personnalisé

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '../useMyHook'

describe('useMyHook', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(0)
  })
})
```

### Test avec interactions utilisateur

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import MyForm from '../MyForm'

describe('MyForm', () => {
  it('handles user input', async () => {
    const user = userEvent.setup()
    render(<MyForm />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })
})
```

## Bonnes pratiques

### 1. Utiliser des sélecteurs appropriés
```typescript
// ✅ Bon - utilise le rôle
screen.getByRole('button', { name: /submit/i })

// ✅ Bon - utilise le texte visible
screen.getByText('Submit')

// ❌ Éviter - utilise les classes CSS
screen.getByClassName('submit-button')
```

### 2. Tester le comportement, pas l'implémentation
```typescript
// ✅ Bon - teste ce que voit l'utilisateur
expect(screen.getByText('Welcome')).toBeInTheDocument()

// ❌ Éviter - teste les détails d'implémentation
expect(component.state.isVisible).toBe(true)
```

### 3. Utiliser des mocks appropriés
```typescript
// Mock d'un module
vi.mock('@/services/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'John' })
}))

// Mock d'un hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1 }, isAuthenticated: true })
}))
```

## Tests disponibles

### Composants testés :
- ✅ `LoginPage` - Test du formulaire de connexion
- ✅ `useToast` - Test du hook de notifications
- ✅ `demoData` - Test des utilitaires de données

### Pour ajouter de nouveaux tests :

1. Créer un fichier `*.test.tsx` ou `*.test.ts`
2. Utiliser les utilitaires de `@/test/utils`
3. Suivre les conventions de nommage
4. Ajouter les mocks nécessaires

## Couverture de code

Lancez `npm run test:coverage` pour générer un rapport de couverture qui sera disponible dans le dossier `coverage/`.

### Exemple d'output de couverture :
```
 COVERAGE  v3.2.4
 
 Coverage Report:
 
 File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
---------------------|---------|----------|---------|---------|----------------
All files            |   89.47 |    83.33 |   90.90 |   89.47 |                
 components          |   92.30 |    85.71 |   100.00|   92.30 |                
  LoginPage.tsx      |   92.30 |    85.71 |   100.00|   92.30 | 45-46          
 data                |   95.23 |    90.90 |   100.00|   95.23 |                
  demoData.ts        |   95.23 |    90.90 |   100.00|   95.23 | 127            
 hooks               |   78.94 |    66.66 |   75.00 |   78.94 |                
  use-toast.ts       |   78.94 |    66.66 |   75.00 |   78.94 | 23-24,89-92    
```

## Outputs des tests existants

### 1. Test LoginPage
```bash
✓ src/components/__tests__/LoginPage.test.tsx (3)
  ✓ LoginPage (3)
    ✓ renders login form correctly
    ✓ allows user to type in email field  
    ✓ displays demonstration buttons for different user roles

Test Files  1 passed (1)
Tests       3 passed (3)
Start at    10:30:15
Duration    1.2s
```

### 2. Test useToast Hook
```bash
✓ src/hooks/__tests__/use-toast.test.ts (4)
  ✓ useToast (4)
    ✓ should add a toast
    ✓ should dismiss a toast
    ✓ should update a toast
    ✓ should auto-remove toast after timeout

Test Files  1 passed (1)
Tests       4 passed (4)
Start at    10:30:16
Duration    0.8s (with fake timers)
```

### 3. Test demoData Utilities
```bash
✓ src/data/__tests__/demoData.test.ts (6)
  ✓ demoData utility functions (6)
    ✓ getLeaveRequestsByEmployee > should return leave requests for specific employee
    ✓ getLeaveRequestsByEmployee > should return empty array for non-existent employee
    ✓ getPendingRequestsForCellManager > should return pending requests for specific cell
    ✓ addNewLeaveRequest > should add new leave request to demo data
    ✓ approveLeaveRequest > should approve leave request with cell manager approval
    ✓ approveLeaveRequest > should approve leave request with HR approval
    ✓ rejectLeaveRequest > should reject leave request

Test Files  1 passed (1)
Tests       7 passed (7)
Start at    10:30:17
Duration    0.5s
```

### Summary Output complet
```bash
 RUN  v3.2.4

 ✓ src/components/__tests__/LoginPage.test.tsx (3)
 ✓ src/hooks/__tests__/use-toast.test.ts (4) 
 ✓ src/data/__tests__/demoData.test.ts (7)

 Test Files  3 passed (3)
 Tests       14 passed (14)
 Start at    10:30:15
 Duration    2.5s (in 3 workers)
```

## Interface graphique des tests

L'interface `npm run test:ui` offre :
- **Arbre des fichiers de test** - Navigation visuelle
- **Résultats en temps réel** - Mise à jour automatique
- **Code coverage visuel** - Lignes couvertes/non couvertes colorées
- **Détails des erreurs** - Stack traces formatées
- **Watch mode** - Re-exécution automatique des tests modifiés

## Débuggage des tests

Pour débugger un test qui échoue :

```typescript
import { screen } from '@/test/utils'

// Afficher l'HTML du composant
screen.debug()

// Afficher un élément spécifique
screen.debug(screen.getByText('Submit'))
```

## Configuration avancée

Le fichier `vitest.config.ts` contient la configuration complète. Vous pouvez :
- Modifier l'environnement de test
- Ajouter des transformations personnalisées
- Configurer les chemins d'alias
- Définir les variables d'environnement de test

## Outils de reporting et analyse

### 1. Reporters disponibles
```bash
# Reporter par défaut (console)
npm run test

# Reporter avec output JSON
npm run test -- --reporter=json

# Reporter avec output JUnit (pour CI/CD)
npm run test -- --reporter=junit

# Reporter HTML pour visualisation
npm run test -- --reporter=html
```

### 2. Analyse des performances
```bash
# Profiling des tests
npm run test -- --reporter=verbose

# Temps d'exécution détaillé
npm run test -- --reporter=verbose --run
```

### 3. Options de filtrage
```bash
# Exécuter tests spécifiques
npm run test -- LoginPage
npm run test -- --grep "should add a toast"

# Exécuter par pattern de fichier
npm run test -- **/*.test.ts

# Ignorer certains tests
npm run test -- --exclude="**/slow.test.ts"
```

### 4. Mode debugging avancé
```bash
# Mode debugging avec breakpoints
npm run test -- --inspect-brk

# Logs détaillés
npm run test -- --reporter=verbose --run

# Tests en mode séquentiel (plus facile pour debug)
npm run test -- --threads=false
```

## Métriques et KPIs des tests

### Couverture recommandée :
- **Statements** : > 80%
- **Branches** : > 75%
- **Functions** : > 90%
- **Lines** : > 80%

### Performance benchmark :
- **Tests unitaires** : < 100ms par test
- **Tests d'intégration** : < 500ms par test
- **Setup global** : < 1s

### Qualité du code de test :
- Utilisation de `describe` pour grouper
- Tests atomiques et indépendants
- Noms descriptifs et explicites
- Mocks appropriés et réutilisables