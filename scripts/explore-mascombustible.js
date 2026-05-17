const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await ctx.newPage();
  const SS = 'C:/Users/Tibs/clientes-web/gasolineras-nl/scripts/test-screenshots';

  console.log('1. Abriendo mascombustible.cl/app...');
  await page.goto('https://mascombustible.cl/app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Login si hay formulario
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('2. Haciendo login...');
    await emailInput.fill('probandotupagina@gmail.com');
    const passInput = page.locator('input[type="password"]');
    await passInput.fill('i9NqP6W4TNNM885');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }

  // Pasar onboarding - click Omitir
  console.log('3. Buscando botón Omitir en onboarding...');
  const omitir = page.locator('button:has-text("Omitir"), button:has-text("omitir"), [aria-label*="omit"]');
  if (await omitir.isVisible({ timeout: 5000 }).catch(() => false)) {
    await omitir.click();
    console.log('   → Onboarding omitido');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `${SS}/mc2-01-after-onboarding.png`, fullPage: false });
  console.log('   Screenshot: after-onboarding');

  // Ver la app principal
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SS}/mc2-02-app-main.png`, fullPage: false });
  console.log('   Screenshot: app-main');

  // Buscar elementos de descuento/QR
  console.log('4. Buscando features de descuentos...');
  const pageContent = await page.content();
  
  // Buscar textos relacionados con descuento
  const keywords = ['descuento', 'qr', 'tarjeta', 'gotas', 'cashback', 'código', 'beneficio', 'ahorro'];
  for (const kw of keywords) {
    if (pageContent.toLowerCase().includes(kw)) {
      console.log(`   ✅ Texto encontrado: "${kw}"`);
    } else {
      console.log(`   ❌ No encontrado: "${kw}"`);
    }
  }

  // Intentar navegar a secciones de la app
  const navButtons = await page.locator('nav button, [role="tablist"] button, .bottom-nav button, footer button').all();
  console.log(`\n5. Botones de navegación encontrados: ${navButtons.length}`);
  
  for (let i = 0; i < navButtons.length; i++) {
    const txt = await navButtons[i].textContent().catch(() => '');
    const label = await navButtons[i].getAttribute('aria-label').catch(() => '');
    console.log(`   Botón ${i+1}: "${txt.trim()}" / aria: "${label}"`);
  }

  // Click en cada botón de nav y screenshot
  for (let i = 0; i < Math.min(navButtons.length, 5); i++) {
    try {
      await navButtons[i].click();
      await page.waitForTimeout(1500);
      const txt = (await navButtons[i].textContent().catch(() => `tab${i}`)).trim().slice(0,10);
      await page.screenshot({ path: `${SS}/mc2-tab${i+1}-${txt.replace(/\s/g,'_')}.png`, fullPage: false });
      console.log(`   Screenshot: tab${i+1}-${txt}`);
    } catch(e) {}
  }

  // Buscar botón de descuento específico
  console.log('\n6. Buscando botones/links de descuento...');
  const descLinks = await page.locator('a, button').filter({ hasText: /descuento|gotas|tarjeta|qr|benefici/i }).all();
  console.log(`   Links de descuento: ${descLinks.length}`);
  for (const el of descLinks.slice(0, 5)) {
    const t = await el.textContent().catch(() => '');
    console.log(`   → "${t.trim()}"`);
  }

  // Screenshot final
  await page.screenshot({ path: `${SS}/mc2-final.png`, fullPage: true });
  console.log('\n7. Screenshot final guardado');

  await browser.close();
  console.log('\n✅ Exploración completa');
})();
