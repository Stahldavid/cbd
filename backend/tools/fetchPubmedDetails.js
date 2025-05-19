// // backend/tools/fetchPubmedDetails.js

// import fetch from 'node-fetch';
// import pkg from '@google/genai'; // Importa o pacote
// import xml2js from 'xml2js'; // Lembre-se de instalar

// const { Type } = pkg; // Extrai o Type para usar na declaração

// const EUTILS_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
// const NCBI_API_KEY = process.env.NCBI_API_KEY;

// // --- Function Implementation (Permanece a mesma) ---
// async function fetch_pubmed_details({ pmid }) {
//   if (!pmid || typeof pmid !== 'string' || !/^\d+$/.test(pmid)) {
//      console.error(`[PubMed Details Error] Invalid PMID provided: ${pmid}`);
//      return { result: { success: false, pmid: pmid || 'invalid', error: `Invalid PMID format: ${pmid}` } };
//   }
//   console.log(`[PubMed Details] Fetching details for PMID: ${pmid}`);

//   const efetchParams = new URLSearchParams({
//     db: 'pubmed',
//     id: pmid,
//     retmode: 'xml',
//     rettype: 'abstract',
//   });

//   if (NCBI_API_KEY) {
//     efetchParams.append('api_key', NCBI_API_KEY);
//   }

//   const efetchUrl = `${EUTILS_BASE_URL}efetch.fcgi?${efetchParams.toString()}`;
//   console.log(`[PubMed Details] EFetch URL: ${efetchUrl}`);

//   try {
//     const response = await fetch(efetchUrl);
//     if (!response.ok) {
//       throw new Error(`EFetch failed for PMID ${pmid}: ${response.status} ${response.statusText}`);
//     }
//     const xmlData = await response.text();
//     const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true, emptyTag: null });
//     const parsedData = await parser.parseStringPromise(xmlData);

//     const article = parsedData?.PubmedArticleSet?.PubmedArticle?.MedlineCitation?.Article;
//     const abstractSection = article?.Abstract?.AbstractText;
//     const title = article?.ArticleTitle || 'No Title Available';

//     let abstractText = 'Abstract not found in EFetch XML.';
//     if (typeof abstractSection === 'string') {
//       abstractText = abstractSection;
//     } else if (typeof abstractSection === 'object' && abstractSection._) {
//       abstractText = abstractSection._;
//     } else if (Array.isArray(abstractSection)) {
//        abstractText = abstractSection.map(sec => (typeof sec === 'string' ? sec : sec._)).join('\n');
//     }

//     const resultData = {
//       success: true,
//       pmid: pmid,
//       title: title,
//       abstract: abstractText.trim(),
//       url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
//     };

//     console.log(`[PubMed Details] Successfully fetched details for PMID: ${pmid}`);
//     return { result: resultData };

//   } catch (error) {
//     console.error(`[PubMed Details Error] Fetching/parsing PMID ${pmid}: ${error.message}`);
//     console.error(error.stack);
//     return { result: { success: false, pmid: pmid, error: `Error fetching/parsing details for PMID ${pmid}: ${error.message}` } };
//   }
// }

// // --- Function Declaration (CORRIGIDA para usar sintaxe JS e Type) ---
// const fetchPubmedDetailsDeclaration = {
//   name: "fetch_pubmed_details",
//   description: "Busca detalhes adicionais, principalmente o resumo/abstract completo, para um ÚNICO artigo científico do PubMed, usando seu PMID. Use APENAS após identificar um artigo relevante via 'search_pubmed'.",
//   parameters: {
//     type: Type.OBJECT, // Usa Type.OBJECT
//     properties: {
//       pmid: { // Chave sem aspas
//         type: Type.STRING, // Usa Type.STRING
//         description: "O PubMed ID (PMID) único do artigo para buscar os detalhes."
//       }
//     },
//     // Required permanece como um array de strings literais
//     required: ["pmid"]
//   }
// };

// // --- Exportações ---
// export { fetch_pubmed_details, fetchPubmedDetailsDeclaration };

// backend/tools/fetchPubmedDetails.js

import fetch from 'node-fetch';
import pkg from '@google/genai';
import xml2js from 'xml2js';

const { Type } = pkg;

const EUTILS_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const NCBI_API_KEY = process.env.NCBI_API_KEY;

// Função auxiliar para extrair texto do XML do EFetch (simplificada)
function extractAbstractFromXml(article) {
  const abstractSection = article?.Abstract?.AbstractText;
  let abstractText = 'Abstract not available.';
  if (typeof abstractSection === 'string') {
    abstractText = abstractSection;
  } else if (typeof abstractSection === 'object' && abstractSection._) {
    abstractText = abstractSection._;
  } else if (Array.isArray(abstractSection)) {
    abstractText = abstractSection
      .map((sec) => (typeof sec === 'string' ? sec : sec._ || ''))
      .join('\n');
  }
  return abstractText.trim();
}

// Função auxiliar para encontrar ID do PMC
function findPmcId(pubmedArticle) {
  const articleIds = pubmedArticle?.PubmedData?.ArticleIdList?.ArticleId;
  if (!articleIds) return null;

  const idsArray = Array.isArray(articleIds) ? articleIds : [articleIds];
  const pmcEntry = idsArray.find((id) => id?.$?.IdType === 'pmc');

  // O ID do PMC geralmente começa com 'PMC'
  return pmcEntry?._?.startsWith('PMC') ? pmcEntry._ : null;
}

// --- Function Implementation (Modificada para buscar PMC link) ---
/**
 * Fetches detailed metadata and abstract for a single PubMed article via EFetch.
 * Attempts to provide a link to PubMed Central (PMC) if full text is available there.
 * Does NOT return the full text content itself.
 * @param {object} args - Arguments object.
 * @param {string} args.pmid - The PubMed ID of the article.
 * @returns {Promise<{result: {success: boolean, pmid: string, title?: string, abstract?: string, url?: string, pmc_url?: string, full_text_status?: string, error?: string}}>} Result object.
 */
async function fetch_pubmed_details({ pmid }) {
  if (!pmid || typeof pmid !== 'string' || !/^\d+$/.test(pmid)) {
    console.error(`[PubMed Details Error] Invalid PMID provided: ${pmid}`);
    return {
      result: { success: false, pmid: pmid || 'invalid', error: `Invalid PMID format: ${pmid}` },
    };
  }
  console.log(`[PubMed Details] Fetching details for PMID: ${pmid}`);

  const efetchParams = new URLSearchParams({
    db: 'pubmed',
    id: pmid,
    retmode: 'xml', // XML é mais completo para metadados e IDs alternativos
    // rettype: 'abstract' // Pode buscar 'full' mas geralmente não retorna o texto completo aqui
  });

  if (NCBI_API_KEY) {
    efetchParams.append('api_key', NCBI_API_KEY);
  }

  const efetchUrl = `${EUTILS_BASE_URL}efetch.fcgi?${efetchParams.toString()}`;
  console.log(`[PubMed Details] EFetch URL: ${efetchUrl}`);

  try {
    const response = await fetch(efetchUrl);
    if (!response.ok) {
      throw new Error(`EFetch failed for PMID ${pmid}: ${response.status} ${response.statusText}`);
    }

    const xmlData = await response.text();

    // --- Parse XML ---
    // explicitArray: false -> facilita acesso a elementos únicos
    // ignoreAttrs: false -> necessário para pegar IdType='pmc'
    // emptyTag: null -> para não criar objetos vazios desnecessários
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, emptyTag: null });
    const parsedData = await parser.parseStringPromise(xmlData);

    // --- Extract Data ---
    const pubmedArticle = parsedData?.PubmedArticleSet?.PubmedArticle;
    const article = pubmedArticle?.MedlineCitation?.Article;

    if (!article) {
      throw new Error(`Could not find article data in EFetch response for PMID ${pmid}`);
    }

    const title = article.ArticleTitle || 'No Title Available';
    const abstractText = extractAbstractFromXml(article);
    const pmcId = findPmcId(pubmedArticle);
    const pmcUrl = pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/` : null;

    let fullTextStatus = 'Abstract provided.';
    if (pmcUrl) {
      fullTextStatus += ' Full text likely available via PMC link.';
    } else {
      fullTextStatus += ' Full text might be available via publisher link (check main URL).';
    }

    const resultData = {
      success: true,
      pmid: pmid,
      title: title,
      abstract: abstractText,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      pmc_url: pmcUrl, // Link para o PMC, se encontrado
      full_text_status: fullTextStatus, // Status sobre o texto completo
      authors:
        article.AuthorList?.Author?.map((a) =>
          `${a.LastName || ''} ${a.Initials || ''}`.trim()
        ).filter(Boolean) || [],
      journal: article.Journal?.Title || article.Journal?.ISOAbbreviation || 'Unknown Journal',
      publication_date: article.Journal?.JournalIssue?.PubDate?.Year || 'Unknown Date',
    };

    console.log(
      `[PubMed Details] Successfully fetched details for PMID: ${pmid}. PMC available: ${!!pmcUrl}`
    );
    return { result: resultData };
  } catch (error) {
    console.error(`[PubMed Details Error] Fetching/parsing PMID ${pmid}: ${error.message}`);
    console.error(error.stack);
    return {
      result: {
        success: false,
        pmid: pmid,
        error: `Error fetching/parsing details for PMID ${pmid}: ${error.message}`,
      },
    };
  }
}

// --- Function Declaration (Schema Atualizado) ---
const fetchPubmedDetailsDeclaration = {
  name: 'fetch_pubmed_details',
  description:
    'Busca metadados detalhados e o abstract completo para um ÚNICO artigo do PubMed, usando seu PMID. Também tenta fornecer um link para o texto completo no PubMed Central (PMC), se disponível, mas NÃO retorna o conteúdo do texto completo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      pmid: {
        type: Type.STRING,
        description: 'O PubMed ID (PMID) único do artigo para buscar os detalhes.',
      },
    },
    required: ['pmid'],
  },
};

// --- Exportações ---
export { fetch_pubmed_details, fetchPubmedDetailsDeclaration };
