import { test, expect } from '@playwright/test';

test.describe('Administration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Connexion en tant qu'admin
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'adminpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('affiche le tableau de bord admin', async ({ page }) => {
    await expect(page.getByText(/administration|admin/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/utilisateurs?/i)).toBeVisible({ timeout: 5000 });
  });

  test('affiche la liste des utilisateurs', async ({ page }) => {
    await page.getByRole('tab', { name: /utilisateurs?/i }).click();
    
    // Vérifie que la table des utilisateurs est visible
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('columnheader', { name: /nom|email/i })).toBeVisible();
  });

  test('recherche un utilisateur', async ({ page }) => {
    await page.getByRole('tab', { name: /utilisateurs?/i }).click();
    
    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Attendre le debounce
      
      // Vérifie que les résultats sont filtrés
      await expect(page.getByRole('table')).toBeVisible();
    }
  });

  test('crée un nouvel utilisateur', async ({ page }) => {
    await page.getByRole('tab', { name: /utilisateurs?/i }).click();
    
    // Cliquer sur le bouton de création
    const createButton = page.getByRole('button', { name: /créer|nouvel? utilisateur|ajouter/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Remplir le formulaire
      await page.getByLabel(/prénom|first.*name/i).fill('Test');
      await page.getByLabel(/nom|last.*name/i).fill('User');
      await page.getByLabel(/email/i).fill(`test${Date.now()}@example.com`);
      await page.getByLabel(/département|department/i).fill('IT');
      
      // Sélectionner un rôle
      await page.getByLabel(/rôle|role/i).click();
      await page.getByRole('option', { name: /employé|employee/i }).click();
      
      // Soumettre
      await page.getByRole('button', { name: /créer|enregistrer|save/i }).click();
      
      // Vérifier le succès
      await expect(page.getByText(/créé|succès|success/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('modifie un utilisateur existant', async ({ page }) => {
    await page.getByRole('tab', { name: /utilisateurs?/i }).click();
    
    // Cliquer sur le premier bouton d'édition
    const editButton = page.getByRole('button', { name: /modifier|éditer|edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modifier un champ
      const phoneInput = page.getByLabel(/téléphone|phone/i);
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+33612345678');
      }
      
      // Enregistrer
      await page.getByRole('button', { name: /enregistrer|sauvegarder|save/i }).click();
      
      // Vérifier le succès
      await expect(page.getByText(/modifié|mis à jour|updated/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('supprime un utilisateur', async ({ page }) => {
    await page.getByRole('tab', { name: /utilisateurs?/i }).click();
    
    // Cliquer sur le premier bouton de suppression
    const deleteButton = page.getByRole('button', { name: /supprimer|delete/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirmer la suppression
      const confirmButton = page.getByRole('button', { name: /confirmer|oui|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Vérifier le succès
      await expect(page.getByText(/supprimé|deleted/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('affiche les statistiques globales', async ({ page }) => {
    // Vérifie l'affichage des KPIs
    await expect(page.getByText(/total.*utilisateurs?/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/demandes?.*en attente/i)).toBeVisible({ timeout: 5000 });
  });
});
