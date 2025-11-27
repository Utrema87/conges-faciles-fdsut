import { test, expect } from '@playwright/test';

test.describe('Navigation et interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('navigation entre les onglets fonctionne', async ({ page }) => {
    // Mes Demandes
    await page.getByRole('tab', { name: /mes demandes/i }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    
    // Nouvelle Demande
    await page.getByRole('tab', { name: /nouvelle demande/i }).click();
    await expect(page.getByLabel(/type de congé/i)).toBeVisible();
    
    // Notifications
    await page.getByRole('tab', { name: /notifications?/i }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('affiche correctement les informations utilisateur', async ({ page }) => {
    // Vérifie que le nom de l'utilisateur est affiché
    await expect(page.getByText(/bienvenue|bonjour/i)).toBeVisible({ timeout: 5000 });
  });

  test('responsive design - mobile', async ({ page }) => {
    // Redimensionner en mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Vérifie que le contenu est visible
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('responsive design - tablet', async ({ page }) => {
    // Redimensionner en tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Vérifie que le layout s'adapte
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('notifications sont accessibles', async ({ page }) => {
    await page.getByRole('tab', { name: /notifications?/i }).click();
    
    // Vérifie que le centre de notifications est chargé
    await expect(page.getByRole('tabpanel')).toBeVisible({ timeout: 5000 });
  });

  test('rapports sont accessibles', async ({ page }) => {
    const reportsTab = page.getByRole('tab', { name: /rapports?|statistiques?/i });
    if (await reportsTab.isVisible()) {
      await reportsTab.click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }
  });

  test('chargement sans erreurs JavaScript', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Vérifie qu'il n'y a pas d'erreurs critiques
    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
  });

  test('gestion du mode sombre', async ({ page }) => {
    // Activer le mode sombre si disponible
    const themeToggle = page.getByRole('button', { name: /thème|theme|dark/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Vérifie que le mode sombre est appliqué
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    }
  });
});
