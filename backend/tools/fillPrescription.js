// // // // backend/tools/fillPrescription.js
// // // import pkg from '@google/genai';
// // // const { Type } = pkg; // Para a declaração de parâmetros

// // // // --- Declaração da Função (para o Gemini) ---
// // // const fillPrescriptionDeclaration = {
// // //     name: "fill_prescription", // Nome único da ferramenta
// // //     description: "Completa os campos específicos de um receituário médico padrão com os detalhes do produto e as instruções de dosagem. Use esta ferramenta APENAS quando o usuário solicitar explicitamente um receituário médico ou quando forem mencionados medicamentos à base de cannabis/CBD junto com informações de dosagem.",
// // //     parameters: {
// // //         type: Type.OBJECT,
// // //         properties: {
// // //             // Campo baseado em "Identificação do produto" na imagem
// // //             productDetails: {
// // //                 type: Type.STRING,
// // //                 description: "O nome completo, concentração/dosagem e forma farmacêutica do produto a ser prescrito (ex: 'Óleo Full Spectrum Cura Cannabis 50mg/ml CBD', ou 'Flores Cannabis Sativa 10% THC / 5% CBD'). Deve ser detalhado e formatado em múltiplas linhas se necessário."
// // //             },
// // //             // Campo baseado em "Tomar X gotas, X vezes ao dia." na imagem
// // //             dosageInstruction: {
// // //                 type: Type.STRING,
// // //                 description: "As instruções precisas de uso para o paciente (ex: 'Tomar 10 gotas, 2 vezes ao dia, por 60 dias', ou 'Aplicar na área afetada 3 vezes ao dia'). Deve incluir quantidade, frequência e duração se aplicável."
// // //             },
// // //             // Campo para indicar uso contínuo (opcional)
// // //             isContinuousUse: {
// // //                 type: Type.BOOLEAN,
// // //                 description: "Opcional. Indica se o medicamento é para uso contínuo (true) ou não (false). Se não especificado, será mantido o valor atual."
// // //             }
// // //         },
// // //         // Campos obrigatórios
// // //         required: ["productDetails", "dosageInstruction"]
// // //     }
// // // };

// // // // --- Implementação da Função (Lógica do Servidor) ---
// // // /**
// // //  * Processa os dados do receituário fornecidos pela AI.
// // //  * @param {object} args - Argumentos fornecidos pela AI.
// // //  * @param {string} args.productDetails - Detalhes do produto.
// // //  * @param {string} args.dosageInstruction - Instruções de dosagem.
// // //  * @param {boolean} [args.isContinuousUse] - Indica uso contínuo (opcional).
// // //  * @returns {Promise<{result: {success: boolean, filledData?: object, message?: string, error?: string}}>} Result object.
// // //  */
// // // async function fillPrescription({
// // //     productDetails,
// // //     dosageInstruction,
// // //     isContinuousUse = null
// // // }) {
// // //     console.log(`[FillPrescription Execution] Received Data:`);
// // //     console.log(`  Product: ${productDetails}`);
// // //     console.log(`  Dosage: ${dosageInstruction}`);
// // //     console.log(`  Continuous Use: ${isContinuousUse !== null ? isContinuousUse : 'Não fornecido (manter padrão)'}`);

// // //     // Validação básica dos campos obrigatórios
// // //     if (!productDetails || !dosageInstruction) {
// // //         const errorMsg = "Campos obrigatórios 'productDetails' ou 'dosageInstruction' não foram fornecidos.";
// // //         console.error(`[FillPrescription Error] ${errorMsg}`);
// // //         return { result: { success: false, error: errorMsg } };
// // //     }

// // //     // Validação adicional e formatação dos detalhes do produto
// // //     let formattedProductDetails = productDetails;
// // //     // Se não contiver quebra de linha, adiciona formatação automática para produtos de cannabis
// // //     if (!productDetails.includes('\n') && (
// // //         productDetails.toLowerCase().includes('cannabis') ||
// // //         productDetails.toLowerCase().includes('cbd') ||
// // //         productDetails.toLowerCase().includes('thc')
// // //     )) {
// // //         // Extrai informações para formatação
// // //         const parts = productDetails.split(/\s+/);
// // //         const concentration = parts.find(p => p.includes('mg') || p.includes('%')) || '';

// // //         // Tenta criar um formato mais legível
// // //         if (parts.length > 3) {
// // //             const mainName = parts.slice(0, 3).join(' ');
// // //             const details = parts.slice(3).join(' ');
// // //             formattedProductDetails = `${mainName}\n${concentration} ${
// // //                 concentration ? parts.find(p =>
// // //                     p.toLowerCase().includes('cbd') ||
// // //                     p.toLowerCase().includes('thc')
// // //                 ) || '' : details
// // //             }\n${parts[0]} ${parts[1] || ''}`;
// // //         }
// // //     }

// // //     // Dados para retorno - apenas o essencial
// // //     const filledData = {
// // //         productDetails: formattedProductDetails,
// // //         dosageInstruction,
// // //         usageType: "USO ORAL", // Valor fixo para uso oral
// // //         ...(isContinuousUse !== null ? { isContinuousUse } : {})
// // //     };

// // //     console.log(`[FillPrescription Success] Processed data for prescription:`, filledData);
// // //     return {
// // //         result: {
// // //             success: true,
// // //             message: "Receituário preenchido com sucesso."
// // //         }
// // //     };
// // // }

// // // // --- Exportações ---
// // // export { fillPrescription, fillPrescriptionDeclaration };

// // // backend/tools/fillPrescription.js
// // import pkg from '@google/genai';
// // const { Type } = pkg; // Para a declaração de parâmetros

// // // --- Declaração da Função (Atualizada com 'justification') ---
// // const fillPrescriptionDeclaration = {
// //     name: "fill_prescription", // Nome único da ferramenta
// //     description: "Completa os campos específicos de um receituário médico padrão com os detalhes do produto, instruções de dosagem e a justificativa científica. Use esta ferramenta APENAS quando o usuário solicitar explicitamente um receituário médico ou quando uma recomendação baseada em evidência for formulada.",
// //     parameters: {
// //         type: Type.OBJECT,
// //         properties: {
// //             productDetails: {
// //                 type: Type.STRING,
// //                 description: "O nome completo, concentração/dosagem e forma farmacêutica do produto a ser prescrito (ex: 'Óleo Full Spectrum Cura Cannabis 50mg/ml CBD', ou 'Flores Cannabis Sativa 10% THC / 5% CBD'). Deve ser detalhado e formatado em múltiplas linhas se necessário."
// //             },
// //             dosageInstruction: {
// //                 type: Type.STRING,
// //                 description: "As instruções precisas de uso para o paciente (ex: 'Tomar 10 gotas, 2 vezes ao dia, por 60 dias', ou 'Aplicar na área afetada 3 vezes ao dia'). Deve incluir quantidade, frequência e duração se aplicável."
// //             },
// //             // NOVO CAMPO: Justificativa
// //             justification: {
// //                 type: Type.STRING,
// //                 description: "Um resumo conciso da evidência científica (estudos, achados principais) que suporta a recomendação de produto e dosagem fornecida. Inclua referências ou PMIDs se possível."
// //             },
// //             isContinuousUse: {
// //                 type: Type.BOOLEAN,
// //                 description: "Opcional. Indica se o medicamento é para uso contínuo (true) ou não (false). Se não especificado, será mantido o valor atual."
// //             }
// //         },
// //         // Campos obrigatórios atualizados
// //         required: ["productDetails", "dosageInstruction", "justification"]
// //     }
// // };

// // // --- Implementação da Função (Atualizada para receber e retornar 'justification') ---
// // /**
// //  * Processa os dados do receituário fornecidos pela AI, incluindo a justificativa.
// //  * @param {object} args - Argumentos fornecidos pela AI.
// //  * @param {string} args.productDetails - Detalhes do produto.
// //  * @param {string} args.dosageInstruction - Instruções de dosagem.
// //  * @param {string} args.justification - Justificativa científica para a recomendação.
// //  * @param {boolean} [args.isContinuousUse] - Indica uso contínuo (opcional).
// //  * @returns {Promise<{result: {success: boolean, filledData?: object, message?: string, error?: string}}>} Result object.
// //  */
// // async function fillPrescription({
// //     productDetails,
// //     dosageInstruction,
// //     justification, // <- Novo parâmetro
// //     isContinuousUse = null
// // }) {
// //     console.log(`[FillPrescription Execution] Received Data:`);
// //     console.log(`  Product: ${productDetails}`);
// //     console.log(`  Dosage: ${dosageInstruction}`);
// //     console.log(`  Justification: ${justification}`); // <- Log do novo parâmetro
// //     console.log(`  Continuous Use: ${isContinuousUse !== null ? isContinuousUse : 'Não fornecido (manter padrão)'}`);

// //     // Validação básica dos campos obrigatórios (incluindo justification)
// //     if (!productDetails || !dosageInstruction || !justification) {
// //         const errorMsg = "Campos obrigatórios 'productDetails', 'dosageInstruction' ou 'justification' não foram fornecidos.";
// //         console.error(`[FillPrescription Error] ${errorMsg}`);
// //         return { result: { success: false, error: errorMsg } };
// //     }

// //     // Validação e formatação (como antes)
// //     let formattedProductDetails = productDetails;
// //     if (!productDetails.includes('\n') && (
// //         productDetails.toLowerCase().includes('cannabis') ||
// //         productDetails.toLowerCase().includes('cbd') ||
// //         productDetails.toLowerCase().includes('thc')
// //     )) {
// //          const parts = productDetails.split(/\s+/);
// //          const concentration = parts.find(p => p.includes('mg') || p.includes('%')) || '';
// //          if (parts.length > 3) {
// //              const mainName = parts.slice(0, 3).join(' ');
// //              const details = parts.slice(3).join(' ');
// //              formattedProductDetails = `${mainName}\n${concentration} ${
// //                  concentration ? parts.find(p =>
// //                      p.toLowerCase().includes('cbd') ||
// //                      p.toLowerCase().includes('thc')
// //                  ) || '' : details
// //              }\n${parts[0]} ${parts[1] || ''}`;
// //          }
// //     }

// //     // Dados para retorno - Inclui a justificativa
// //     // Estes são os dados que o App.js pode usar para atualizar o estado do receituário
// //     const filledData = {
// //         productDetails: formattedProductDetails,
// //         dosageInstruction,
// //         justification, // <- Inclui a justificativa nos dados processados
// //         usageType: "USO ORAL", // Assumindo oral, pode ser parametrizado se necessário
// //         ...(isContinuousUse !== null ? { isContinuousUse } : {})
// //     };

// //     console.log(`[FillPrescription Success] Processed data for prescription:`, filledData);
// //     // Retorna sucesso e os dados processados
// //     return {
// //         result: {
// //             success: true,
// //             message: "Receituário preenchido com sucesso.",
// //             filledData: filledData // <- Retorna os dados processados
// //         }
// //     };
// // }

// // // --- Exportações ---
// // export { fillPrescription, fillPrescriptionDeclaration };

// // backend/tools/fillPrescription.js
// import pkg from '@google/genai';
// const { Type } = pkg; // Para a declaração de parâmetros

// // --- Declaração da Função (Atualizada com 'justification') ---
// const fillPrescriptionDeclaration = {
//   name: 'fill_prescription', // Nome único da ferramenta
//   description:
//     'Completa os campos específicos de um receituário médico padrão com os detalhes do produto, instruções de dosagem e a justificativa científica. Use esta ferramenta APENAS quando o usuário solicitar explicitamente um receituário médico ou quando uma recomendação baseada em evidência for formulada.',
//   parameters: {
//     type: Type.OBJECT,
//     properties: {
//       productDetails: {
//         type: Type.STRING,
//         description:
//           "O nome completo, concentração/dosagem e forma farmacêutica do produto a ser prescrito (ex: 'CBD Isolado CURA CANNABIS 50mg/ml'). Selecione um dos valores do enum fornecido. o product detail deve ser exatamente um dos nomes presentes no enum fornecido",
//         // --- ENUM ADICIONADO AQUI ---
//         enum: [
//           'CBD Isolado CURA CANNABIS',
//           'CBG Isolado',
//           'CBN Isolado',
//           'CBD:CBN (1:1)',
//           'CBD:CBN (2:1)',
//           'CBD:CBG (1:1)',
//           'CBD:CBG (2:1)',
//           'CBD:CBG (3:1)',
//           'CBD:CBN:CBG (2:1:1)',
//           'CBD:Delta-8 THC (1:1)',
//           'CBD:Delta-8 THC (2:1)',
//           'CBD:Delta-9 THC (1:1)',
//           'CBD:Delta-9 THC (2:1)',
//           'THCV Isolado',
//           'CBD:THCV (2:1)',
//           'CBD:CBG:THCV (2:1:1)',
//           'CBD:CBG:CBN (2:1:1)',
//           'CBD:CBG:Delta-9 THC (2:1:1)',
//           'CBD:CBN:Delta-9 THC (2:1:1)',
//           'CBD:CBG:CBN:Delta-9 THC (2:1:1:1)',
//           'CBD:CBG:CBN:THCV (2:1:1:1)',
//           'CBD:CBG:CBN:Delta-8 THC (2:1:1:1)',
//           'CBD:CBG:CBN:Delta-9 THC:THCV (2:1:1:1:1)',
//         ],
//         // --- FIM DO ENUM ---
//       },
//       dosageInstruction: {
//         type: Type.STRING,
//         description:
//           "As instruções precisas de uso para o paciente (ex: 'Tomar 10 gotas, 2 vezes ao dia, por 60 dias', ou 'Aplicar na área afetada 3 vezes ao dia'). Deve incluir quantidade, frequência e duração se aplicável.",
//       },
//       // NOVO CAMPO: Justificativa
//       justification: {
//         type: Type.STRING,
//         description:
//           'Um resumo conciso da evidência científica (estudos, achados principais) que suporta a recomendação de produto e dosagem fornecida. Inclua referências ou PMIDs se possível.',
//       },
//       isContinuousUse: {
//         type: Type.BOOLEAN,
//         description:
//           'Opcional. Indica se o medicamento é para uso contínuo (true) ou não (false). Se não especificado, será mantido o valor atual.',
//       },
//     },
//     // Campos obrigatórios atualizados
//     required: ['productDetails', 'dosageInstruction', 'justification'],
//   },
// };

// // --- Implementação da Função (Atualizada para receber e retornar 'justification') ---
// /**
//  * Processa os dados do receituário fornecidos pela AI, incluindo a justificativa.
//  * @param {object} args - Argumentos fornecidos pela AI.
//  * @param {string} args.productDetails - Detalhes do produto.
//  * @param {string} args.dosageInstruction - Instruções de dosagem.
//  * @param {string} args.justification - Justificativa científica para a recomendação.
//  * @param {boolean} [args.isContinuousUse] - Indica uso contínuo (opcional).
//  * @returns {Promise<{result: {success: boolean, filledData?: object, message?: string, error?: string}}>} Result object.
//  */
// async function fillPrescription({
//   productDetails,
//   dosageInstruction,
//   justification, // <- Novo parâmetro
//   isContinuousUse = null,
// }) {
//   console.log(`[FillPrescription Execution] Received Data:`);
//   console.log(`  Product: ${productDetails}`);
//   console.log(`  Dosage: ${dosageInstruction}`);
//   console.log(`  Justification: ${justification}`); // <- Log do novo parâmetro
//   console.log(
//     `  Continuous Use: ${isContinuousUse !== null ? isContinuousUse : 'Não fornecido (manter padrão)'}`
//   );

//   // Validação básica dos campos obrigatórios (incluindo justification)
//   if (!productDetails || !dosageInstruction || !justification) {
//     const errorMsg =
//       "Campos obrigatórios 'productDetails', 'dosageInstruction' ou 'justification' não foram fornecidos.";
//     console.error(`[FillPrescription Error] ${errorMsg}`);
//     return { result: { success: false, error: errorMsg } };
//   }

//   // Validação e formatação (como antes)
//   let formattedProductDetails = productDetails;
//   if (
//     !productDetails.includes('\n') &&
//     (productDetails.toLowerCase().includes('cannabis') ||
//       productDetails.toLowerCase().includes('cbd') ||
//       productDetails.toLowerCase().includes('thc'))
//   ) {
//     const parts = productDetails.split(/\s+/);
//     const concentration = parts.find((p) => p.includes('mg') || p.includes('%')) || '';
//     if (parts.length > 3) {
//       const mainName = parts.slice(0, 3).join(' ');
//       const details = parts.slice(3).join(' ');
//       formattedProductDetails = `${mainName}\n${concentration} ${
//         concentration
//           ? parts.find((p) => p.toLowerCase().includes('cbd') || p.toLowerCase().includes('thc')) ||
//             ''
//           : details
//       }\n${parts[0]} ${parts[1] || ''}`;
//     }
//   }

//   // Dados para retorno - Inclui a justificativa
//   // Estes são os dados que o App.js pode usar para atualizar o estado do receituário
//   const filledData = {
//     productDetails: formattedProductDetails,
//     dosageInstruction,
//     justification, // <- Inclui a justificativa nos dados processados
//     usageType: 'USO ORAL', // Assumindo oral, pode ser parametrizado se necessário
//     ...(isContinuousUse !== null ? { isContinuousUse } : {}),
//   };

//   console.log(`[FillPrescription Success] Processed data for prescription:`, filledData);
//   // Retorna sucesso e os dados processados
//   return {
//     result: {
//       success: true,
//       message: 'Receituário preenchido com sucesso.',
//       filledData: filledData, // <- Retorna os dados processados
//     },
//   };
// }

// // --- Exportações ---
// export { fillPrescription, fillPrescriptionDeclaration };




// backend/tools/fillPrescription.js
import pkg from '@google/genai';
const { Type } = pkg; // Para a declaração de parâmetros

// --- Declaração da Função (Atualizada com 'justification') ---
const fillPrescriptionDeclaration = {
  name: 'fill_prescription', // Nome único da ferramenta
  description:
    'Completa os campos específicos de um receituário médico padrão com os detalhes do produto, instruções de dosagem e a justificativa científica. Use esta ferramenta APENAS quando o usuário solicitar explicitamente um receituário médico ou quando uma recomendação baseada em evidência for formulada.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productDetails: {
        type: Type.STRING,
        description:
          "O nome completo, concentração/dosagem e forma farmacêutica do produto a ser prescrito (ex: 'CBD Isolado CURA CANNABIS 50mg/ml'). Selecione um dos valores do enum fornecido. o product detail deve ser exatamente um dos nomes presentes no enum fornecido",
        // --- ENUM ADICIONADO AQUI ---
        enum: [
          'CBD Isolado CURA CANNABIS',
          'CBG Isolado',
          'CBN Isolado',
          'CBD:CBN (1:1)',
          'CBD:CBN (2:1)',
          'CBD:CBG (1:1)',
          'CBD:CBG (2:1)',
          'CBD:CBG (3:1)',
          'CBD:CBN:CBG (2:1:1)',
          'CBD:Delta-8 THC (1:1)',
          'CBD:Delta-8 THC (2:1)',
          'CBD:Delta-9 THC (1:1)',
          'CBD:Delta-9 THC (2:1)',
          'THCV Isolado',
          'CBD:THCV (2:1)',
          'CBD:CBG:THCV (2:1:1)',
          'CBD:CBG:CBN (2:1:1)',
          'CBD:CBG:Delta-9 THC (2:1:1)',
          'CBD:CBN:Delta-9 THC (2:1:1)',
          'CBD:CBG:CBN:Delta-9 THC (2:1:1:1)',
          'CBD:CBG:CBN:THCV (2:1:1:1)',
          'CBD:CBG:CBN:Delta-8 THC (2:1:1:1)',
          'CBD:CBG:CBN:Delta-9 THC:THCV (2:1:1:1:1)',
        ],
        // --- FIM DO ENUM ---
      },
      dosageInstruction: {
        type: Type.STRING,
        description:
          "As instruções precisas de uso para o paciente (ex: 'Tomar 10 gotas, 2 vezes ao dia, por 60 dias', ou 'Aplicar na área afetada 3 vezes ao dia'). Deve incluir quantidade, frequência e duração se aplicável.",
      },
      // NOVO CAMPO: Justificativa
      justification: {
        type: Type.STRING,
        description:
          'Um resumo conciso da evidência científica (estudos, achados principais) que suporta a recomendação de produto e dosagem fornecida. Inclua referências ou PMIDs se possível.',
      },
      isContinuousUse: {
        type: Type.BOOLEAN,
        description:
          'Opcional. Indica se o medicamento é para uso contínuo (true) ou não (false). Se não especificado, será mantido o valor atual.',
      },
    },
    // Campos obrigatórios atualizados
    required: ['productDetails', 'dosageInstruction', 'justification'],
  },
};

// --- Implementação da Função (Atualizada para receber e retornar 'justification') ---
/**
 * Processa os dados do receituário fornecidos pela AI, incluindo a justificativa.
 * @param {object} args - Argumentos fornecidos pela AI.
 * @param {string} args.productDetails - Detalhes do produto.
 * @param {string} args.dosageInstruction - Instruções de dosagem.
 * @param {string} args.justification - Justificativa científica para a recomendação.
 * @param {boolean} [args.isContinuousUse] - Indica uso contínuo (opcional).
 * @returns {Promise<{result: {success: boolean, filledData?: object, message?: string, error?: string}}>} Result object.
 */
async function fillPrescription({
  productDetails,
  dosageInstruction,
  justification, // <- Novo parâmetro
  isContinuousUse = null,
}) {
  console.log(`[FillPrescription Execution] Received Data:`);
  console.log(`  Product: ${productDetails}`);
  console.log(`  Dosage: ${dosageInstruction}`);
  console.log(`  Justification: ${justification}`); // <- Log do novo parâmetro
  console.log(
    `  Continuous Use: ${isContinuousUse !== null ? isContinuousUse : 'Não fornecido (manter padrão)'}`
  );

  // Validação básica dos campos obrigatórios (incluindo justification)
  if (!productDetails || !dosageInstruction || !justification) {
    const errorMsg =
      "Campos obrigatórios 'productDetails', 'dosageInstruction' ou 'justification' não foram fornecidos.";
    console.error(`[FillPrescription Error] ${errorMsg}`);
    return { result: { success: false, error: errorMsg } };
  }

  // --- SEÇÃO DE FORMATAÇÃO REMOVIDA ---
  // let formattedProductDetails = productDetails;
  // if (
  //   !productDetails.includes('\n') &&
  //   (productDetails.toLowerCase().includes('cannabis') ||
  //     productDetails.toLowerCase().includes('cbd') ||
  //     productDetails.toLowerCase().includes('thc'))
  // ) {
  //   const parts = productDetails.split(/\s+/);
  //   const concentration = parts.find((p) => p.includes('mg') || p.includes('%')) || '';
  //   if (parts.length > 3) {
  //     const mainName = parts.slice(0, 3).join(' ');
  //     const details = parts.slice(3).join(' ');
  //     formattedProductDetails = `${mainName}\n${concentration} ${
  //       concentration
  //         ? parts.find((p) => p.toLowerCase().includes('cbd') || p.toLowerCase().includes('thc')) ||
  //           ''
  //         : details
  //     }\n${parts[0]} ${parts[1] || ''}`;
  //   }
  // }
  // --- FIM DA SEÇÃO DE FORMATAÇÃO REMOVIDA ---

  // Use o productDetails original diretamente, sem formatação
  const formattedProductDetails = productDetails;


  // Dados para retorno - Inclui a justificativa
  // Estes são os dados que o App.js pode usar para atualizar o estado do receituário
  const filledData = {
    productDetails: formattedProductDetails, // <-- Usando o original productDetails
    dosageInstruction,
    justification, // <- Inclui a justificativa nos dados processados
    usageType: 'USO ORAL', // Assumindo oral, pode ser parametrizado se necessário
    ...(isContinuousUse !== null ? { isContinuousUse } : {}),
  };

  console.log(`[FillPrescription Success] Processed data for prescription:`, filledData);
  // Retorna sucesso e os dados processados
  return {
    result: {
      success: true,
      message: 'Receituário preenchido com sucesso.',
      filledData: filledData, // <- Retorna os dados processados
    },
  };
}

// --- Exportações ---
export { fillPrescription, fillPrescriptionDeclaration };