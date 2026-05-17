const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await ctx.newPage();
  const SS = 'C:/Users/Tibs/clientes-web/gasolineras-nl/scripts/test-screenshots';

  console.log('Abriendo app...');
  await page.goto('https://mascombustible.cl/app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Login
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill('probandotupagina@gmail.com');
    await page.locator('input[type="password"]').fill('i9NqP6W4TNNM885');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
    console.log('Login hecho, URL:', page.url());
  }

  // Forzar dismiss del onboarding de múltiples maneras
  console.log('Intentando cerrar onboarding...');

  // Método 1: click en botón X (esquina superior derecha)
  const closeBtn = page.locator('button').filter({ hasText: '' }).nth(0);
  const xBtn = page.locator('[aria-label="close"], [aria-label="cerrar"], button svg').first();
  
  // Método 2: click en posición del botón X (esquina superior derecha del viewport)
  await page.mouse.click(1247, 19);
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: `${SS}/mc2-a-afterX.png` });
  console.log('Screenshot después de click X');

  // Método 3: Escape key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Método 4: click Omitir con force
  const omitir = page.locator('text=Omitir');
  if (await omitir.isVisible({ timeout: 2000 }).catch(() => false)) {
    await omitir.click({ force: true });
    await page.waitForTimeout(1500);
    console.log('Omitir clickeado con force');
  }

  // Método 5: JS para remover el modal
  await page.evaluate(() => {
    // Buscar y remover modales/overlays
    const overlays = document.querySelectorAll('[class*="modal"], [class*="onboard"], [class*="overlay"], [class*="tutorial"]');
    overlays.forEach(el => el.remove());
    // También intentar click programático en el botón
    const btns = Array.from(document.querySelectorAll('button'));
    const omitir = btns.find(b => b.textContent.includes('Omitir') || b.textContent.includes('omitir'));
    if (omitir) omitir.click();
  });
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: `${SS}/mc2-b-nomodal.png` });
  console.log('Screenshot después de remover modales via JS');

  // Verificar si el modal sigue ahí
  const stillOnboarding = await page.locator('text=Precios en tiempo real').isVisible().catch(() => false);
  console.log('¿Sigue el onboarding?', stillOnboarding);

  // Si el modal sigue, navegar directo via URL
  if (stillOnboarding) {
    console.log('Intentando navegar por URL interna...');
    // Intentar rutas comunes de SPA
    for (const route of ['/app/inicio', '/app/home', '/app/estaciones', '/app/map', '/app#inicio', '/app/dashboard']) {
      await page.goto(`https://mascombustible.cl${route}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const url = page.url();
      console.log(`  Intenté ${route} → ${url}`);
      const onboard = await page.locator('text=Precios en tiempo real').isVisible().catch(() => false);
      if (!onboard) {
        console.log('  ✅ Sin onboarding!');
        await page.screenshot({ path: `${SS}/mc2-c-app-real.png` });
        break;
      }
    }
  }

  // Tomar screenshot de lo que sea que tengamos
  await page.screenshot({ path: `${SS}/mc2-d-current.png`, fullPage: false });
  
  // Extraer HTML relevante para analizar estructura
  const bodyText = await page.evaluate(() => {
    const body = document.body;
    // Extraer solo texto visible
    return Array.from(body.querySelectorAll('h1, h2, h3, p, button, a, span[class]'))
      .map(el => el.textContent.trim())
      .filter(t => t.length > 2 && t.length < 200)
      .slice(0, 50)
      .join('\n');
  });
  console.log('\n=== TEXTO EN PANTALLA ===');
  console.log(bodyText);

  await browser.close();
  console.log('\n✅ Done');
})();
