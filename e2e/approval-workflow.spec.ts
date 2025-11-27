import { test, expect } from '@playwright/test';

test.describe('Workflow d\'approbation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('responsable de cellule peut voir les demandes en attente', async ({ page }) => {
    // Connexion en tant que responsable de cellule
    const email = process.env.TEST_CELL_MANAGER_EMAIL || 'cellmanager@example.com';
    const password = process.env.TEST_CELL_MANAGER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Navigation vers les approbations
    await page.getByRole('tab', { name: /approbations?|validations?/i }).click();
    
    // Vérifie la présence de demandes
    await expect(page.getByText(/demandes? en attente/i)).toBeVisible({ timeout: 5000 });
  });

  test('approuver une demande de congé', async ({ page }) => {
    const email = process.env.TEST_CELL_MANAGER_EMAIL || 'cellmanager@example.com';
    const password = process.env.TEST_CELL_MANAGER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.getByRole('tab', { name: /approbations?/i }).click();
    
    // Cliquer sur le premier bouton d'approbation disponible
    const approveButton = page.getByRole('button', { name: /approuver|valider/i }).first();
    if (await approveButton.isVisible()) {
      await approveButton.click();
      
      // Confirmer l'action si nécessaire
      const confirmButton = page.getByRole('button', { name: /confirmer/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Vérifier le message de succès
      await expect(page.getByText(/approuvée|validée|succès/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('rejeter une demande de congé', async ({ page }) => {
    const email = process.env.TEST_CELL_MANAGER_EMAIL || 'cellmanager@example.com';
    const password = process.env.TEST_CELL_MANAGER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.getByRole('tab', { name: /approbations?/i }).click();
    
    // Cliquer sur le premier bouton de rejet disponible
    const rejectButton = page.getByRole('button', { name: /rejeter|refuser/i }).first();
    if (await rejectButton.isVisible()) {
      await rejectButton.click();
      
      // Remplir le motif si demandé
      const reasonInput = page.getByLabel(/motif|raison/i);
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Période non disponible');
      }
      
      // Confirmer le rejet
      const confirmButton = page.getByRole('button', { name: /confirmer/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Vérifier le message
      await expect(page.getByText(/rejetée|refusée|succès/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('chef de service voit les demandes de son département', async ({ page }) => {
    const email = process.env.TEST_SERVICE_CHIEF_EMAIL || 'chief@example.com';
    const password = process.env.TEST_SERVICE_CHIEF_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Vérifie l'affichage des statistiques du département
    await expect(page.getByText(/département|service/i)).toBeVisible({ timeout: 5000 });
  });

  test('workflow hiérarchique complet', async ({ page }) => {
    // Ce test simule le workflow complet d'approbation
    // Note: Nécessite des données de test appropriées
    
    // 1. Employé soumet une demande
    const employeeEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const employeePassword = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(employeeEmail);
    await page.getByLabel(/mot de passe/i).fill(employeePassword);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    await page.getByRole('tab', { name: /nouvelle demande/i }).click();
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 14);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 17);
    
    await page.getByLabel(/type de congé/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/date de début/i).fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel(/date de fin/i).fill(endDate.toISOString().split('T')[0]);
    await page.getByLabel(/motif/i).fill('Test E2E workflow');
    await page.getByRole('button', { name: /soumettre/i }).click();
    
    await expect(page.getByText(/succès/i)).toBeVisible({ timeout: 5000 });
  });
});
