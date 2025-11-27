import { test, expect } from '@playwright/test';

test.describe('Performance et Web Vitals', () => {
  test('temps de chargement initial acceptable', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Le chargement initial devrait prendre moins de 3 secondes
    expect(loadTime).toBeLessThan(3000);
  });

  test('mesure des Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
    
    // Injecter le script web-vitals si nécessaire
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metricsData: Record<string, number> = {};
        
        // Performance observer pour LCP
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            metricsData.lcp = lastEntry.renderTime || lastEntry.loadTime;
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
          
          // CLS
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            metricsData.cls = clsValue;
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        }
        
        setTimeout(() => resolve(metricsData), 2000);
      });
    });
    
    console.log('Web Vitals:', metrics);
    
    // Assertions sur les métriques (valeurs seuils)
    if ((metrics as any).lcp) {
      expect((metrics as any).lcp).toBeLessThan(2500); // LCP < 2.5s
    }
    if ((metrics as any).cls !== undefined) {
      expect((metrics as any).cls).toBeLessThan(0.1); // CLS < 0.1
    }
  });

  test('nombre de requêtes réseau raisonnable', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Nombre de requêtes: ${requests.length}`);
    
    // Ne devrait pas faire plus de 50 requêtes au chargement initial
    expect(requests.length).toBeLessThan(50);
  });

  test('taille des ressources chargées', async ({ page }) => {
    const responses: number[] = [];
    page.on('response', async response => {
      try {
        const buffer = await response.body();
        responses.push(buffer.length);
      } catch (e) {
        // Ignore les erreurs de lecture du body
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const totalSize = responses.reduce((acc, size) => acc + size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    console.log(`Taille totale chargée: ${totalSizeMB.toFixed(2)} MB`);
    
    // Le chargement initial ne devrait pas dépasser 5 MB
    expect(totalSizeMB).toBeLessThan(5);
  });

  test('temps de réponse de l\'API acceptable', async ({ page }) => {
    await page.goto('/');
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    
    // Mesurer le temps de connexion
    const startTime = Date.now();
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    const loginTime = Date.now() - startTime;
    
    console.log(`Temps de connexion: ${loginTime}ms`);
    
    // La connexion devrait prendre moins de 5 secondes
    expect(loginTime).toBeLessThan(5000);
  });

  test('navigation fluide entre les pages', async ({ page }) => {
    await page.goto('/');
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Tester la navigation entre onglets
    const tabs = [
      /mes demandes/i,
      /nouvelle demande/i,
      /notifications?/i,
    ];
    
    for (const tabName of tabs) {
      const startTime = Date.now();
      await page.getByRole('tab', { name: tabName }).click();
      await page.waitForTimeout(100); // Petit délai pour le changement d'onglet
      const switchTime = Date.now() - startTime;
      
      // Le changement d'onglet devrait être instantané (< 500ms)
      expect(switchTime).toBeLessThan(500);
    }
  });
});
