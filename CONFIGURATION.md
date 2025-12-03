# Configuration du Projet - Documentation Technique

## Vue d'ensemble

Ce document détaille l'ensemble des fichiers de configuration du système de gestion des congés, organisés par domaine fonctionnel.

---

## 1. Configuration de Build et Développement

### 1.1 Vite Configuration (`vite.config.ts`)

Vite est utilisé comme bundler et serveur de développement pour ses performances optimales.

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",      // Écoute sur toutes les interfaces
    port: 8080,      // Port de développement
  },
  plugins: [
    react(),         // Plugin React avec SWC (compilation rapide)
    mode === 'development' && componentTagger(),  // Tagging dev uniquement
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // Alias pour imports absolus
    },
  },
}));
```

**Caractéristiques clés :**
| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Bundler | Vite 5.x | Build ultra-rapide avec ESBuild |
| Compilateur React | SWC | 20x plus rapide que Babel |
| Hot Module Replacement | Activé | Rechargement instantané |
| Port | 8080 | Serveur de développement |
| Alias Path | `@/` → `src/` | Imports simplifiés |

---

### 1.2 TypeScript Configuration (`tsconfig.json`)

Configuration TypeScript stricte pour la sécurité du typage.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Options de sécurité activées :**
- `strict: true` - Mode strict complet
- `noUnusedLocals` - Détection variables inutilisées
- `noUnusedParameters` - Détection paramètres inutilisés
- `noFallthroughCasesInSwitch` - Prévention fallthrough switch

---

## 2. Configuration des Styles

### 2.1 Tailwind CSS (`tailwind.config.ts`)

Système de design basé sur des tokens sémantiques.

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],  // Support mode sombre via classe
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' }
    },
    extend: {
      colors: {
        // Tokens sémantiques HSL
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

**Système de Design Tokens :**

| Token | Usage | Exemple |
|-------|-------|---------|
| `background` | Arrière-plan principal | `bg-background` |
| `foreground` | Texte principal | `text-foreground` |
| `primary` | Actions principales | `bg-primary` |
| `secondary` | Actions secondaires | `bg-secondary` |
| `muted` | Éléments désactivés | `text-muted-foreground` |
| `accent` | Mise en évidence | `bg-accent` |
| `destructive` | Actions dangereuses | `bg-destructive` |
| `card` | Conteneurs carte | `bg-card` |
| `popover` | Menus flottants | `bg-popover` |

---

## 3. Configuration des Tests

### 3.1 Tests Unitaires - Vitest (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,           // Variables globales (describe, it, expect)
    environment: 'jsdom',    // Simulation DOM navigateur
    setupFiles: ['./src/test/setup.ts'],  // Configuration initiale
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Fonctionnalités de test :**
- **Environment** : jsdom pour simulation navigateur
- **Globals** : API Jest-like (describe, it, expect)
- **Coverage** : Rapports de couverture intégrés
- **Watch Mode** : Rechargement automatique des tests

---

### 3.2 Tests E2E - Playwright (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
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

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**Matrice de navigateurs testés :**

| Navigateur | Device | Résolution |
|------------|--------|------------|
| Chromium | Desktop Chrome | 1280x720 |
| Firefox | Desktop Firefox | 1280x720 |
| WebKit | Desktop Safari | 1280x720 |
| Mobile Chrome | Pixel 5 | 393x851 |
| Mobile Safari | iPhone 12 | 390x844 |

---

## 4. Configuration Backend - Supabase

### 4.1 Configuration Projet (`supabase/config.toml`)

```toml
project_id = "gazgeminiofjtbunnclv"

[functions.init-admin]
verify_jwt = false    # Fonction publique pour initialisation
```

### 4.2 Variables d'environnement (`.env`)

```bash
# Identifiant projet Supabase
VITE_SUPABASE_PROJECT_ID="gazgeminiofjtbunnclv"

# Clé publique (côté client)
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."

# URL de l'API Supabase
VITE_SUPABASE_URL="https://gazgeminiofjtbunnclv.supabase.co"
```

**Secrets Supabase configurés :**

| Secret | Usage | Exposition |
|--------|-------|------------|
| `SUPABASE_URL` | URL API | Client |
| `SUPABASE_ANON_KEY` | Clé anonyme | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin | Serveur uniquement |
| `SUPABASE_DB_URL` | Connexion DB | Serveur uniquement |

---

## 5. Configuration ESLint (`eslint.config.js`)

```javascript
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
```

**Règles de qualité de code :**
- Règles React Hooks (dépendances useEffect)
- React Refresh (HMR compatible)
- TypeScript strict
- ES2020 features

---

## 6. Résumé des Technologies

### Stack Technique Complet

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                           │
├─────────────────────────────────────────────────────────────┤
│  Framework    │ React 18.3.1 + TypeScript                   │
│  Bundler      │ Vite 5.x + SWC                              │
│  Styling      │ Tailwind CSS + shadcn/ui                    │
│  State        │ TanStack Query + React Context              │
│  Forms        │ React Hook Form + Zod                       │
│  Routing      │ React Router DOM 6.x                        │
├─────────────────────────────────────────────────────────────┤
│                    BACKEND STACK                            │
├─────────────────────────────────────────────────────────────┤
│  BaaS         │ Supabase                                    │
│  Database     │ PostgreSQL 15                               │
│  Auth         │ Supabase Auth (JWT)                         │
│  API          │ REST + Realtime                             │
│  Functions    │ Edge Functions (Deno)                       │
│  Security     │ Row Level Security (RLS)                    │
├─────────────────────────────────────────────────────────────┤
│                    TESTING STACK                            │
├─────────────────────────────────────────────────────────────┤
│  Unit Tests   │ Vitest + Testing Library                    │
│  E2E Tests    │ Playwright (5 navigateurs)                  │
│  API Tests    │ Postman Collections                         │
│  Coverage     │ Istanbul/NYC                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Scripts NPM Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (port 8080) |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualisation build |
| `npm run test` | Tests unitaires Vitest |
| `npm run test:e2e` | Tests E2E Playwright |
| `npm run lint` | Vérification ESLint |

---

## 8. Architecture des Fichiers de Configuration

```
projet/
├── .env                      # Variables d'environnement
├── vite.config.ts            # Configuration Vite
├── tailwind.config.ts        # Design system Tailwind
├── tsconfig.json             # TypeScript principal
├── tsconfig.app.json         # TypeScript application
├── tsconfig.node.json        # TypeScript Node
├── vitest.config.ts          # Tests unitaires
├── playwright.config.ts      # Tests E2E
├── eslint.config.js          # Linting
├── postcss.config.js         # PostCSS
├── components.json           # shadcn/ui
└── supabase/
    └── config.toml           # Configuration Supabase
```

---

*Document généré pour le mémoire de fin d'études - Système de Gestion des Congés*
