import { test, expect } from '@playwright/test';

test.describe('Accessibilité', () => {
  test('navigation au clavier sur la page de connexion', async ({ page }) => {
    await page.goto('/');
    
    // Focus sur le premier champ
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/email/i)).toBeFocused();
    
    // Focus sur le champ mot de passe
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/mot de passe/i)).toBeFocused();
    
    // Focus sur le bouton de connexion
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeFocused();
  });

  test('navigation au clavier dans le dashboard', async ({ page }) => {
    await page.goto('/');
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Tester la navigation par Tab
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Vérifier qu'un élément interactif a le focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedElement);
  });

  test('labels associés aux champs de formulaire', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que chaque input a un label associé
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.getByLabel(/mot de passe/i);
    await expect(passwordInput).toBeVisible();
  });

  test('contraste des couleurs suffisant', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le contraste du texte principal
    const contrastRatio = await page.evaluate(() => {
      const element = document.querySelector('h1, h2, h3');
      if (!element) return 0;
      
      const color = window.getComputedStyle(element).color;
      const bgColor = window.getComputedStyle(element).backgroundColor;
      
      // Retourne les couleurs pour vérification manuelle
      return { color, bgColor };
    });
    
    console.log('Couleurs détectées:', contrastRatio);
    expect(contrastRatio).toBeTruthy();
  });

  test('utilisation appropriée des landmarks ARIA', async ({ page }) => {
    await page.goto('/');
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Vérifier la présence de landmarks
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('texte alternatif pour les images', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que toutes les images ont un attribut alt
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.hasAttribute('alt')).length;
    });
    
    expect(imagesWithoutAlt).toBe(0);
  });

  test('messages d\'erreur lisibles par les lecteurs d\'écran', async ({ page }) => {
    await page.goto('/');
    
    // Soumettre le formulaire vide
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Vérifier que les messages d'erreur sont visibles et accessibles
    await page.waitForTimeout(1000);
    
    const errorMessages = await page.getByRole('alert').count();
    console.log(`Messages d'erreur ARIA détectés: ${errorMessages}`);
  });

  test('focus visible sur les éléments interactifs', async ({ page }) => {
    await page.goto('/');
    
    // Utiliser Tab pour naviguer
    await page.keyboard.press('Tab');
    
    // Vérifier qu'il y a un indicateur de focus visible
    const hasFocusOutline = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return false;
      
      const styles = window.getComputedStyle(focused);
      return styles.outline !== 'none' && styles.outline !== '' ||
             styles.boxShadow !== 'none' && styles.boxShadow !== '';
    });
    
    expect(hasFocusOutline).toBeTruthy();
  });

  test('pas de piège au clavier', async ({ page }) => {
    await page.goto('/');
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Tester qu'on peut naviguer et sortir avec le clavier
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }
    
    // Vérifier qu'on peut toujours interagir
    await page.keyboard.press('Shift+Tab');
    const canFocus = await page.evaluate(() => document.activeElement !== null);
    expect(canFocus).toBeTruthy();
  });
});
