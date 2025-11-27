import { test, expect } from '@playwright/test';

test.describe('Demandes de congé', () => {
  test.beforeEach(async ({ page }) => {
    // Connexion préalable
    await page.goto('/');
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('affiche le formulaire de demande de congé', async ({ page }) => {
    // Navigation vers l'onglet de nouvelle demande
    await page.getByRole('tab', { name: /nouvelle demande/i }).click();
    
    await expect(page.getByLabel(/type de congé/i)).toBeVisible();
    await expect(page.getByLabel(/date de début/i)).toBeVisible();
    await expect(page.getByLabel(/date de fin/i)).toBeVisible();
    await expect(page.getByLabel(/motif/i)).toBeVisible();
  });

  test('soumet une nouvelle demande de congé', async ({ page }) => {
    await page.getByRole('tab', { name: /nouvelle demande/i }).click();
    
    // Remplir le formulaire
    await page.getByLabel(/type de congé/i).click();
    await page.getByRole('option', { name: /annuel/i }).click();
    
    // Dates futures
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 10);
    
    await page.getByLabel(/date de début/i).fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel(/date de fin/i).fill(endDate.toISOString().split('T')[0]);
    await page.getByLabel(/motif/i).fill('Congés annuels programmés');
    
    // Soumettre
    await page.getByRole('button', { name: /soumettre/i }).click();
    
    // Vérifier le message de succès
    await expect(page.getByText(/demande.*créée|succès/i)).toBeVisible({ timeout: 5000 });
  });

  test('validation des dates invalides', async ({ page }) => {
    await page.getByRole('tab', { name: /nouvelle demande/i }).click();
    
    // Date de fin avant date de début
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 10);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    await page.getByLabel(/type de congé/i).click();
    await page.getByRole('option', { name: /annuel/i }).click();
    await page.getByLabel(/date de début/i).fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel(/date de fin/i).fill(endDate.toISOString().split('T')[0]);
    
    await page.getByRole('button', { name: /soumettre/i }).click();
    
    // Vérifier le message d'erreur
    await expect(page.getByText(/date.*invalide|erreur/i)).toBeVisible({ timeout: 3000 });
  });

  test('affiche la liste des demandes existantes', async ({ page }) => {
    await page.getByRole('tab', { name: /mes demandes/i }).click();
    
    // Vérifie que la table ou la liste est visible
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
  });

  test('calcule automatiquement le nombre de jours', async ({ page }) => {
    await page.getByRole('tab', { name: /nouvelle demande/i }).click();
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 11); // 5 jours
    
    await page.getByLabel(/date de début/i).fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel(/date de fin/i).fill(endDate.toISOString().split('T')[0]);
    
    // Vérifie que le nombre de jours est affiché
    await expect(page.getByText(/5.*jours?/i)).toBeVisible({ timeout: 3000 });
  });
});
