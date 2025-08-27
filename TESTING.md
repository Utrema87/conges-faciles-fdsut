# Guide des Tests Unitaires

## Configuration

Le projet utilise **Vitest** comme framework de test avec **@testing-library/react** pour tester les composants React.

### Dépendances installées :
- `vitest` - Framework de test rapide
- `@testing-library/react` - Utilitaires pour tester React
- `@testing-library/jest-dom` - Matchers personnalisés pour Jest/Vitest
- `@testing-library/user-event` - Simulation d'interactions utilisateur
- `@testing-library/dom` - Utilitaires DOM pour les tests
- `jsdom` - Environnement DOM simulé

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