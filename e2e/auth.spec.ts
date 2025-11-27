import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('affiche la page de connexion', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('affiche une erreur avec des identifiants invalides', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    await expect(page.getByText(/erreur/i)).toBeVisible({ timeout: 5000 });
  });

  test('permet la connexion avec des identifiants valides', async ({ page }) => {
    // Note: Utiliser des credentials de test configurés dans l'environnement
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Vérifie la redirection vers le dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('déconnexion réussie', async ({ page }) => {
    // Connexion préalable
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Déconnexion
    await page.getByRole('button', { name: /déconnexion|logout/i }).click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('validation du formulaire de connexion', async ({ page }) => {
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Vérifie que les champs obligatoires sont validés
    await expect(page.getByLabel(/email/i)).toBeFocused();
  });
});
