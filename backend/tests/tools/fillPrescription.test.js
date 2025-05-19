import { fillPrescription, fillPrescriptionDeclaration } from '../../tools/fillPrescription.js';

// Mock console to prevent logs during tests, if desired
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});

describe('fillPrescription Tool', () => {
  const baseArgs = {
    productDetails: 'Óleo Full Spectrum Cura Cannabis 50mg/ml CBD',
    dosageInstruction: 'Tomar 10 gotas, 2 vezes ao dia, por 60 dias',
    justification: 'Estudos indicam eficácia para ansiedade (PMID: 12345, PMID: 67890).',
  };

  describe('fillPrescription function', () => {
    it('should return success and filledData for valid inputs', async () => {
      const args = { ...baseArgs, isContinuousUse: true };
      const response = await fillPrescription(args);

      expect(response.result.success).toBe(true);
      expect(response.result.message).toBe('Receituário preenchido com sucesso.');
      expect(response.result.filledData).toBeDefined();
      expect(response.result.filledData.productDetails).toBe(args.productDetails); // Assuming no re-formatting for this input
      expect(response.result.filledData.dosageInstruction).toBe(args.dosageInstruction);
      expect(response.result.filledData.justification).toBe(args.justification);
      expect(response.result.filledData.usageType).toBe('USO ORAL');
      expect(response.result.filledData.isContinuousUse).toBe(true);
    });

    it('should handle isContinuousUse when not provided (defaults to not being in filledData)', async () => {
      const args = { ...baseArgs }; // isContinuousUse is undefined
      const response = await fillPrescription(args);
      expect(response.result.success).toBe(true);
      expect(response.result.filledData.isContinuousUse).toBeUndefined();
    });

    it('should handle isContinuousUse when explicitly false', async () => {
      const args = { ...baseArgs, isContinuousUse: false };
      const response = await fillPrescription(args);
      expect(response.result.success).toBe(true);
      expect(response.result.filledData.isContinuousUse).toBe(false);
    });

    it('should return error if productDetails is missing', async () => {
      const args = { ...baseArgs, productDetails: '' };
      const response = await fillPrescription(args);
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain("obrigatórios 'productDetails'");
    });

    it('should return error if dosageInstruction is missing', async () => {
      const args = { ...baseArgs, dosageInstruction: '' };
      const response = await fillPrescription(args);
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain("obrigatórios 'dosageInstruction'");
    });

    it('should return error if justification is missing', async () => {
      const args = { ...baseArgs, justification: '' };
      const response = await fillPrescription(args);
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain("obrigatórios 'justification'");
    });

    // Test cases for productDetails formatting logic
    describe('productDetails formatting', () => {
      it('should NOT re-format productDetails if it already contains newlines', async () => {
        const productWithNewline = 'Produto A\nConcentração B\nForma C';
        const args = { ...baseArgs, productDetails: productWithNewline };
        const response = await fillPrescription(args);
        expect(response.result.filledData.productDetails).toBe(productWithNewline);
      });

      it('should re-format productDetails for cannabis products without newlines (basic case)', async () => {
        const product = 'Oleo CBD Full Spectrum 50mg/ml Cura Cannabis';
        // Expected based on the logic:
        // mainName = "Oleo CBD Full"
        // concentration = "50mg/ml"
        // detailsPartAfterConcentration = "Cura Cannabis"
        // keyword = "CBD"
        // formatted = "Oleo CBD Full\n50mg/ml CBD\nOleo CBD"
        const expectedFormatted = 'Oleo CBD Full\n50mg/ml CBD\nOleo CBD';
        const args = { ...baseArgs, productDetails: product };
        const response = await fillPrescription(args);
        expect(response.result.filledData.productDetails).toBe(expectedFormatted);
      });

      it('should re-format productDetails with THC keyword', async () => {
        const product = 'Flores THC Sativa 20% Green Life';
        // mainName = "Flores THC Sativa"
        // concentration = "20%"
        // keyword = "THC"
        // formatted = "Flores THC Sativa\n20% THC\nFlores THC"
        const expectedFormatted = 'Flores THC Sativa\n20% THC\nFlores THC';
        const args = { ...baseArgs, productDetails: product };
        const response = await fillPrescription(args);
        expect(response.result.filledData.productDetails).toBe(expectedFormatted);
      });

      it('should re-format productDetails when keyword is part of concentration', async () => {
        const product = 'Extrato Cannabis Indica 100mgCBD Phyto';
        // mainName = "Extrato Cannabis Indica"
        // concentration = "100mgCBD"
        // keyword = "CBD"
        // formatted = "Extrato Cannabis Indica\n100mgCBD CBD\nExtrato Cannabis"
        const expectedFormatted = 'Extrato Cannabis Indica\n100mgCBD CBD\nExtrato Cannabis';
        const args = { ...baseArgs, productDetails: product };
        const response = await fillPrescription(args);
        expect(response.result.filledData.productDetails).toBe(expectedFormatted);
      });

      it('should NOT re-format if product does not seem like cannabis and has no newlines', async () => {
        const nonCannabisProduct = 'Paracetamol 500mg Comprimidos Genérico';
        const args = { ...baseArgs, productDetails: nonCannabisProduct };
        const response = await fillPrescription(args);
        expect(response.result.filledData.productDetails).toBe(nonCannabisProduct);
      });

      it('should handle productDetails with less than 4 parts (no re-formatting)', async () => {
        const shortProduct = 'CBD Oil 10%'; // 3 parts
        const args = { ...baseArgs, productDetails: shortProduct };
        const response = await fillPrescription(args);
        // The specific re-formatting kicks in if parts.length > 3
        expect(response.result.filledData.productDetails).toBe(shortProduct);
      });

      it('should handle productDetails with no clear concentration string', async () => {
        const product = 'Tintura Cannabis Sativa Extra Forte Herbal';
        // mainName = "Tintura Cannabis Sativa"
        // concentration = ""
        // details = "Extra Forte Herbal"
        // keyword = "Cannabis"
        // formatted = "Tintura Cannabis Sativa\n Cannabis\nTintura Cannabis"
        const expectedFormatted = 'Tintura Cannabis Sativa\n Cannabis\nTintura Cannabis';
        const args = { ...baseArgs, productDetails: product };
        const response = await fillPrescription(args);
        expect(response.result.filledData.productDetails).toBe(expectedFormatted);
      });
    });
  });

  describe('fillPrescriptionDeclaration', () => {
    it('should have correct name and description', () => {
      expect(fillPrescriptionDeclaration.name).toBe('fill_prescription');
      expect(fillPrescriptionDeclaration.description).toBeDefined();
    });

    it('should have required parameters: productDetails, dosageInstruction, justification', () => {
      expect(fillPrescriptionDeclaration.parameters.required).toEqual([
        'productDetails',
        'dosageInstruction',
        'justification',
      ]);
    });

    it('should define properties with correct types and descriptions', () => {
      const props = fillPrescriptionDeclaration.parameters.properties;
      expect(props.productDetails.type).toBe('STRING');
      expect(props.productDetails.description).toBeDefined();
      expect(props.productDetails.enum).toBeInstanceOf(Array); // Check for enum existence
      expect(props.productDetails.enum.length).toBeGreaterThan(15); // Check if enum seems populated

      expect(props.dosageInstruction.type).toBe('STRING');
      expect(props.dosageInstruction.description).toBeDefined();

      expect(props.justification.type).toBe('STRING');
      expect(props.justification.description).toBeDefined();

      expect(props.isContinuousUse.type).toBe('BOOLEAN');
      expect(props.isContinuousUse.description).toBeDefined();
    });
  });
});
