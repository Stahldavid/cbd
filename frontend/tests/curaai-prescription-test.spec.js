// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('CuraAI Application Tests', () => {
  test('CBD information and prescription generation workflow', async ({ page }) => {
    // 1. Navigate to the application
    await page.goto('http://localhost:3000');

    // Verify main app title is visible
    const title = await page.getByRole('heading', { name: 'CuraAI', level: 1 });
    await expect(title).toBeVisible();

    // 2. Ask about CBD benefits for chronic pain
    await page.getByRole('textbox', { name: 'Mensagem' }).fill('Quais são os benefícios do CBD para dor crônica?');
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();

    // Wait for AI response - using text content instead of selectors
    await page.waitForTimeout(2000); // Give time for AI to start processing
    
    // Wait for CBD to appear in the responses
    await expect(async () => {
      const responseText = await page.textContent('main') || '';
      expect(responseText).toContain('CBD');
      expect(responseText).toContain('dor');
    }).toPass({ timeout: 600000 });

    // 3. Ask about CBD dosage for neuropathic pain
    await page.getByRole('textbox', { name: 'Mensagem' }).fill('Qual a dosagem recomendada de CBD para dor neuropática?');
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();

    // Wait for response about neuropathic pain - using text content
    await page.waitForTimeout(2000);
    
    // Check that the page text eventually contains relevant keywords
    await expect(async () => {
      const responseText = await page.textContent('main') || '';
      expect(responseText).toContain('neuropática');
      // Check at least one of these keywords appears
      const dosageRelatedTerms = ['mg', 'dose', 'dosagem', 'concentração'];
      expect(dosageRelatedTerms.some(term => responseText.includes(term))).toBeTruthy();
    }).toPass({ timeout: 600000 });

    // 4. Open the prescription form
    await page.getByRole('button', { name: 'Abrir Receituário' }).click();

    // Wait for the modal to appear and stabilize
    await page.waitForTimeout(20000);

    // Verify the prescription modal opens - using a more reliable approach
    await expect(async () => {
      const pageText = await page.textContent('body') || '';
      expect(pageText).toContain('Receituário Médico');
    }).toPass({ timeout: 100000 });

    // 5. Fill in patient information
    await page.getByRole('textbox', { name: 'Nome completo:' }).fill('João da Silva');
    await page.getByRole('textbox', { name: 'Endereço completo:' }).fill('Rua das Flores, 123, São Paulo - SP');
    await page.getByRole('textbox', { name: 'Data de nascimento:' }).fill('1980-03-15');
    await page.getByRole('spinbutton', { name: 'Idade:' }).fill('43');

    // 6. Fill in prescription details
    const dosingInstructions = `CBD isolado, óleo 100mg/ml
Iniciar com 10mg (0,1ml) duas vezes ao dia, via oral.
Aumentar a dose gradualmente a cada 7 dias, conforme necessário e tolerância, até máximo de 200mg/dia divididos em 2-3 doses.
Ajustar conforme resposta clínica.`;
    await page.getByRole('textbox', { name: 'Instruções de Dosagem:' }).fill(dosingInstructions);

    // 7. Add justification with literature references
    const justification = `Paciente com dor neuropática refratária a tratamentos convencionais. Evidências de meta-análises recentes (Solmi et al., 2023; Bilbao & Spanagel, 2022) indicam potencial benefício de canabinoides para manejo da dor. Revisão Cochrane (Mücke et al., 2018) sugere que medicamentos à base de cannabis podem aumentar significativamente a proporção de pacientes com alívio da dor de 30% ou mais.`;
    await page.getByRole('textbox', { name: 'Justificativa / Evidência:' }).fill(justification);

    // 8. Check "Uso Contínuo" box
    await page.getByLabel('Uso Contínuo').check();

    // 9. Verify the prescription preview section reflects patient information
    // Use data-prescription-value attribute to find preview elements
    await expect(page.locator('[data-prescription-value]').filter({ hasText: 'João da Silva' })).toBeVisible();
    await expect(page.locator('[data-prescription-value]').filter({ hasText: 'Rua das Flores, 123, São Paulo - SP' })).toBeVisible();
    await expect(page.locator('[data-prescription-value]').filter({ hasText: '1980-03-15' })).toBeVisible();
    await expect(page.locator('[data-prescription-value]').filter({ hasText: '43' })).toBeVisible();

    // Verify the prescription content - use more specific selectors
    await expect(page.locator('[data-prescription-value]').filter({ hasText: 'USO CONTÍNUO' })).toBeVisible();
    await expect(page.locator('[data-prescription-value]').filter({ hasText: 'USO ORAL' })).toBeVisible();

    // 10. Test PDF download functionality (this just tests the button click, not the downloaded file)
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;

    // Verify file name has expected pattern
    expect(download.suggestedFilename()).toContain('receituario_João_da_Silva.pdf');

    // 11. Close the prescription modal
    await page.getByRole('button', { name: 'Fechar' }).click();

    // Verify modal is closed - using content check
    await expect(async () => {
      const pageText = await page.textContent('body') || '';
      expect(pageText).not.toContain('Receituário Médico');
    }).toPass({ timeout: 10000 });
  });
}); 