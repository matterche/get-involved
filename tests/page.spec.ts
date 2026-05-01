import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders heading and descriptive title', async ({ page }) => {
  await expect(page).toHaveTitle(/Bundesfinanzminister/i);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /E-Mail an den Finanzminister/i,
  );
});

test('mail button has a well-formed mailto: URL with the prepared content', async ({
  page,
}) => {
  const mailButton = page.locator('#mailButton');
  const href = await mailButton.getAttribute('href');
  expect(href).toBeTruthy();
  expect(href!.startsWith('mailto:poststelle@bmf.bund.de?')).toBe(true);

  const url = new URL(href!);
  const subject = decodeURIComponent(url.searchParams.get('subject') ?? '');
  const body = decodeURIComponent(url.searchParams.get('body') ?? '');

  expect(subject).toContain('organisierte Steuerhinterziehung');
  expect(body).toContain('Sehr geehrter Herr Bundesminister Klingbeil');
  expect(body).toContain('Anne Brorhilker');
  expect(body).toContain('100 Mrd');
  expect(body).toContain('Cum-Ex');
  expect(body).toContain('Cum-Cum');
  expect(body).toContain('Mit freundlichen Grüßen');
  expect(body, 'sources stay on the page, not in the email').not.toContain('Quellen:');
});

test('mail button opens in new tab with safe rel attributes', async ({ page }) => {
  const mailButton = page.locator('#mailButton');
  await expect(mailButton).toHaveAttribute('target', '_blank');
  const rel = (await mailButton.getAttribute('rel')) ?? '';
  expect(rel).toContain('noopener');
  expect(rel).toContain('noreferrer');
});

test('every external link uses target=_blank with safe rel', async ({ page }) => {
  const externalLinks = page.locator('a[href^="http"]');
  const count = await externalLinks.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const link = externalLinks.nth(i);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = (await link.getAttribute('rel')) ?? '';
    expect(rel, `link ${i} rel`).toContain('noopener');
    expect(rel, `link ${i} rel`).toContain('noreferrer');
  }
});

test.describe('copy buttons', () => {
  test.use({
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  async function readClipboard(page: Page): Promise<string> {
    return await page.evaluate(() => navigator.clipboard.readText());
  }

  test('copy recipient writes the email address and announces status', async ({
    page,
  }) => {
    await page.locator('button[data-copy-target="recipient"]').click();
    await expect(page.locator('#status')).toHaveText('Empfänger kopiert.');
    expect(await readClipboard(page)).toBe('poststelle@bmf.bund.de');
  });

  test('copy subject writes the subject text', async ({ page }) => {
    await page.locator('button[data-copy-target="subject"]').click();
    await expect(page.locator('#status')).toHaveText('Betreff kopiert.');
    expect(await readClipboard(page)).toContain('organisierte Steuerhinterziehung');
  });

  test('copy body writes the prepared email text', async ({ page }) => {
    await page.locator('button[data-copy-target="body"]').click();
    await expect(page.locator('#status')).toHaveText('E-Mail-Text kopiert.');
    const clip = await readClipboard(page);
    expect(clip).toContain('Bundesminister Klingbeil');
    expect(clip).toContain('Mit freundlichen Grüßen');
  });
});

test('Impressum and Datenschutzerklärung disclosures expand on click', async ({
  page,
}) => {
  const impressum = page.locator('details', { hasText: 'Impressum' });
  await impressum.locator('summary').click();
  await expect(impressum).toHaveAttribute('open', '');
  await expect(impressum).toContainText('Angaben gemäß § 5 DDG');

  const datenschutz = page.locator('details', { hasText: 'Datenschutzerklärung' });
  await datenschutz.locator('summary').click();
  await expect(datenschutz).toHaveAttribute('open', '');
  await expect(datenschutz).toContainText('Netlify');
  await expect(datenschutz).toContainText('EU-U.S. Data Privacy Framework');
});

test('axe-core finds no serious or critical accessibility violations', async ({
  page,
}) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
