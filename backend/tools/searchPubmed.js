// // backend/tools/searchPubmed.js

// import fetch from 'node-fetch';
// import pkg from '@google/genai'; // Importa o pacote
// const { Type } = pkg; // Extrai o Type para usar na declaração

// const EUTILS_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
// const NCBI_API_KEY = process.env.NCBI_API_KEY;

// // --- Function Implementation (Permanece a mesma da última versão) ---
// async function search_pubmed({
//   query,
//   max_results = 5,
//   article_type,
//   sort_order = 'relevance',
//   min_publication_date,
//   max_publication_date
// }) {
//   console.log(`[PubMed Search] Query: "${query}", Type: ${article_type || 'any'}, Sort: ${sort_order}, Max: ${max_results}`);
//   const safeMaxResults = Math.max(1, Math.min(15, parseInt(max_results, 10) || 5));

//   try {
//     let searchTerm = query;
//     if (article_type) {
//       searchTerm += ` AND "${article_type}"[ptyp]`;
//       console.log(`[PubMed Search] Applying article type filter: "${article_type}"[ptyp]`);
//     }

//     const esearchParams = new URLSearchParams({
//       db: 'pubmed',
//       term: searchTerm,
//       retmax: safeMaxResults.toString(),
//       retmode: 'json',
//       sort: sort_order === 'publication_date' ? 'pub+date' : 'relevance',
//     });

//     if (min_publication_date) {
//       esearchParams.append('mindate', min_publication_date);
//       esearchParams.append('datetype', 'pdat');
//       console.log(`[PubMed Search] Applying min date filter: ${min_publication_date}`);
//     }
//     if (max_publication_date) {
//       esearchParams.append('maxdate', max_publication_date);
//       esearchParams.append('datetype', 'pdat');
//       console.log(`[PubMed Search] Applying max date filter: ${max_publication_date}`);
//     }
//     if (NCBI_API_KEY) esearchParams.append('api_key', NCBI_API_KEY);

//     const esearchUrl = `${EUTILS_BASE_URL}esearch.fcgi?${esearchParams.toString()}`;
//     console.log(`[PubMed Search] ESearch Term: ${searchTerm}`);
//     console.log(`[PubMed Search] ESearch URL: ${esearchUrl}`);

//     const esearchRes = await fetch(esearchUrl);
//     if (!esearchRes.ok) throw new Error(`ESearch failed: ${esearchRes.status} ${esearchRes.statusText}`);
//     const esearchData = await esearchRes.json();

//     const pmids = esearchData?.esearchresult?.idlist;
//     if (!pmids || pmids.length === 0) {
//       console.log(`[PubMed Search] No PMIDs found for query.`);
//       return { result: { success: true, results: [] } };
//     }
//     console.log(`[PubMed Search] Found ${pmids.length} PMIDs.`);

//     const esummaryParams = new URLSearchParams({
//       db: 'pubmed',
//       id: pmids.join(','),
//       retmode: 'json',
//     });
//     if (NCBI_API_KEY) esummaryParams.append('api_key', NCBI_API_KEY);

//     const esummaryUrl = `${EUTILS_BASE_URL}esummary.fcgi?${esummaryParams.toString()}`;
//     console.log(`[PubMed Search] ESummary URL: ${esummaryUrl}`);

//     const esummaryRes = await fetch(esummaryUrl);
//     if (!esummaryRes.ok) throw new Error(`ESummary failed: ${esummaryRes.status} ${esummaryRes.statusText}`);
//     const esummaryData = await esummaryRes.json();

//     const results = [];
//     const summaryResult = esummaryData?.result;
//      if (!summaryResult) {
//        console.warn(`[PubMed Search] ESummary result structure unexpected or missing.`);
//        return { result: { success: true, results: [] } };
//      }

//     const articleIds = Object.keys(summaryResult).filter(key => key !== 'uids');

//     for (const pmid of articleIds) {
//       const article = summaryResult[pmid];
//        if (!article) continue;
//        const abstractInfo = `Summary only. Use 'fetch_pubmed_details' with PMID ${pmid} for full abstract if needed.`;
//        results.push({
//          pmid: pmid,
//          title: article.title || 'No Title Available',
//          abstract: abstractInfo,
//          authors: article.authors?.map(a => a.name) || [],
//          journal: article.source || 'Unknown Journal',
//          publication_date: article.pubdate || 'Unknown Date',
//          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
//        });
//      }

//     console.log(`[PubMed Search] Processed ${results.length} summaries.`);
//     return { result: { success: true, results: results } };

//   } catch (error) {
//     console.error(`[PubMed Search Error] ${error.message}`);
//     console.error(error.stack);
//     return { result: { success: false, error: `Error during PubMed search: ${error.message}` } };
//   }
// }

// // --- Function Declaration (CORRIGIDA para usar sintaxe JS e Type) ---
// const searchPubmedDeclaration = {
//   name: "search_pubmed",
//   description: "Realiza uma busca inicial na base de dados PubMed por artigos científicos, retornando uma lista de resumos (título, autores, PMID, link). Use 'fetch_pubmed_details' para obter o abstract completo de um artigo específico.",
//   parameters: {
//     type: Type.OBJECT, // Usa Type.OBJECT
//     properties: {
//       query: {
//         type: Type.STRING, // Usa Type.STRING
//         description: "Termos de busca ou pergunta para pesquisar no PubMed. Pode usar operadores booleanos (AND, OR, NOT) (ex: 'epilepsy AND treatment')."
//       },
//       max_results: {
//         type: Type.INTEGER, // Usa Type.INTEGER
//         description: "Número máximo de resumos de artigos a retornar (opcional, padrão interno: 5, máximo: 15)."
//       },
//       article_type: {
//         type: Type.STRING, // Usa Type.STRING
//         description: "Filtra por um tipo específico de publicação (opcional). Se omitido, busca todos os tipos.",
//         // Enum permanece como um array de strings literais
//         enum: [
//           "Clinical Trial",
//           "Review",
//           "Systematic Review",
//           "Meta-Analysis",
//           "Guideline"
//         ]
//       },
//       sort_order: {
//         type: Type.STRING, // Usa Type.STRING
//         description: "Critério para ordenar os resultados (opcional). 'relevance' é o padrão do PubMed.",
//         // Enum permanece como um array de strings literais
//         enum: [
//           "relevance",
//           "publication_date"
//         ]
//       },
//       min_publication_date: {
//         type: Type.STRING, // Usa Type.STRING
//         description: "Data de publicação mais antiga a incluir (opcional). Formato YYYY ou YYYY/MM/DD."
//       },
//       max_publication_date: {
//         type: Type.STRING, // Usa Type.STRING
//         description: "Data de publicação mais recente a incluir (opcional). Formato YYYY ou YYYY/MM/DD."
//       }
//     },
//     // Required permanece como um array de strings literais
//     required: ["query"]
//   }
// };

// // --- Exportações ---
// export { search_pubmed, searchPubmedDeclaration };



// backend/tools/searchPubmed.js

import fetch from 'node-fetch';
import pkg from '@google/genai';
import xml2js from 'xml2js'; // Necessário para EFetch

const { Type } = pkg;

const EUTILS_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const NCBI_API_KEY = process.env.NCBI_API_KEY;

// Filtro a ser aplicado condicionalmente
const PMC_OPEN_ACCESS_FILTER = 'pubmed pmc open access[filter]';

// Função auxiliar para extrair texto do XML do EFetch (simplificada)
function extractAbstractFromXml(article) { //
    const abstractSection = article?.Abstract?.AbstractText; //
    let abstractText = 'Abstract not available.'; //
    if (typeof abstractSection === 'string') { //
        abstractText = abstractSection; //
    } else if (typeof abstractSection === 'object' && abstractSection._) { //
        abstractText = abstractSection._; //
    } else if (Array.isArray(abstractSection)) { //
        abstractText = abstractSection.map(sec => (typeof sec === 'string' ? sec : (sec._ || ''))).join('\n'); //
    }
    return abstractText.trim(); //
}

// --- Function Implementation (Modificada com parâmetro pmc_open_access_only) ---
async function search_pubmed({ //
  query, //
  max_results = 5, //
  article_type, //
  sort_order = 'relevance', //
  min_publication_date, //
  max_publication_date, //
  pmc_open_access_only = false // <-- NOVO PARÂMETRO com default false //
}) {
  console.log(`[PubMed Search] Query: "${query}", Type: ${article_type || 'any'}, Sort: ${sort_order}, Max: ${max_results}, PMC OA Only: ${pmc_open_access_only}`); //
  const safeMaxResults = Math.max(1, Math.min(15, parseInt(max_results, 10) || 5)); //

  try { //
    // --- Step 1: Constrói Termo e URL do ESearch ---
    let searchTerm = query; //

    // Aplica filtro de tipo se não estiver na query original
    if (article_type && searchTerm.toLowerCase().indexOf(article_type.toLowerCase()) === -1) { //
        searchTerm += ` AND "${article_type}"[ptyp]`; //
        console.log(`[PubMed Search] Applying article type filter: "${article_type}"[ptyp]`); //
    } else if (article_type) { //
        console.log(`[PubMed Search] Article type "${article_type}" seems present in query, not adding specific [ptyp] filter.`); //
    }

    // **MODIFICAÇÃO:** Aplica o filtro PMC Open Access CONDICIONALMENTE
    if (pmc_open_access_only === true) { //
      searchTerm = `(${searchTerm}) AND ${PMC_OPEN_ACCESS_FILTER}`; //
      console.log(`[PubMed Search] Applying PMC Open Access filter.`); //
    }

    const esearchParams = new URLSearchParams({ //
      db: 'pubmed', //
      term: searchTerm, //
      retmax: safeMaxResults.toString(), //
      retmode: 'json', //
      sort: sort_order === 'publication_date' ? 'pub+date' : 'relevance', //
    });

    if (min_publication_date) esearchParams.append('mindate', min_publication_date); //
    if (max_publication_date) esearchParams.append('maxdate', max_publication_date); //
    if (min_publication_date || max_publication_date) esearchParams.append('datetype', 'pdat'); //
    if (NCBI_API_KEY) esearchParams.append('api_key', NCBI_API_KEY); //

    const esearchUrl = `${EUTILS_BASE_URL}esearch.fcgi?${esearchParams.toString()}`; //
    console.log(`[PubMed Search] Final ESearch Term: ${searchTerm}`); //
    console.log(`[PubMed Search] ESearch URL: ${esearchUrl}`); //

    // --- Step 2: Chama ESearch para obter PMIDs ---
    const esearchRes = await fetch(esearchUrl); //
    if (!esearchRes.ok) throw new Error(`ESearch failed: ${esearchRes.status} ${esearchRes.statusText}`); //
    const esearchData = await esearchRes.json(); //

    const pmids = esearchData?.esearchresult?.idlist; //
    if (!pmids || pmids.length === 0) { //
      console.log(`[PubMed Search] No PMIDs found for query.`); //
      return { result: { success: true, results: [] } }; //
    }
    console.log(`[PubMed Search] Found ${pmids.length} PMIDs. Fetching details...`); //

    // --- Step 3: Constrói URL EFetch ---
    const efetchParams = new URLSearchParams({ //
      db: 'pubmed', //
      id: pmids.join(','), //
      retmode: 'xml', //
      rettype: 'abstract', //
    });
    if (NCBI_API_KEY) efetchParams.append('api_key', NCBI_API_KEY); //

    const efetchUrl = `${EUTILS_BASE_URL}efetch.fcgi?${efetchParams.toString()}`; //
    console.log(`[PubMed Search] EFetch URL: ${efetchUrl}`); //

    // --- Step 4: Chama EFetch ---
    const efetchRes = await fetch(efetchUrl); //
    if (!efetchRes.ok) throw new Error(`EFetch failed: ${efetchRes.status} ${efetchRes.statusText}`); //
    const xmlData = await efetchRes.text(); //

    // --- Step 5: Parseia XML e extrai dados ---
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, emptyTag: null }); //
    const parsedData = await parser.parseStringPromise(xmlData); //

    const results = []; //
    const articles = parsedData?.PubmedArticleSet?.PubmedArticle; //

    if (!articles) { //
      console.warn(`[PubMed Search] EFetch result structure unexpected. PMIDs: ${pmids.join(',')}`); //
      return { result: { success: true, results: [] } }; //
    }

    const articlesArray = Array.isArray(articles) ? articles : [articles]; //

    for (const pubmedArticle of articlesArray) { //
      const article = pubmedArticle?.MedlineCitation?.Article; //
      const pmid = pubmedArticle?.MedlineCitation?.PMID?._ || //
                   pubmedArticle?.MedlineCitation?.PMID || //
                   pubmedArticle?.PubmedData?.ArticleIdList?.ArticleId?.find(id => id?.$?.IdType === 'pubmed')?._ || //
                   'Unknown PMID'; //

      if (!article || pmid === 'Unknown PMID') { //
          console.warn('[PubMed Search] Skipping article due to missing data:', JSON.stringify(pubmedArticle).substring(0, 200)); //
          continue; //
      }

      results.push({ //
        pmid: pmid, //
        title: article.ArticleTitle || 'No Title Available', //
        abstract: extractAbstractFromXml(article), //
        authors: article.AuthorList?.Author?.map(a => `${a.LastName || ''} ${a.Initials || ''}`.trim()).filter(Boolean) || [], //
        journal: article.Journal?.Title || article.Journal?.ISOAbbreviation || 'Unknown Journal', //
        publication_date: article.Journal?.JournalIssue?.PubDate?.Year || //
                          article.Journal?.JournalIssue?.PubDate?.MedlineDate || //
                          'Unknown Date', //
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, //
      });
    }

    console.log(`[PubMed Search] Processed ${results.length} articles.`); //
    return { result: { success: true, results: results } }; //

  } catch (error) { //
    console.error(`[PubMed Search Error] ${error.message}`); //
    console.error(error.stack); //
    return { result: { success: false, error: `Error during PubMed search: ${error.message}` } }; //
  }
}

// --- Function Declaration (Schema ATUALIZADO com novo parâmetro booleano) ---
const searchPubmedDeclaration = { //
  name: "search_pubmed", //
  description: "Realiza uma busca na base de dados PubMed por artigos científicos, retornando uma lista de artigos com título, abstract, autores, PMID e link. Pode opcionalmente filtrar por tipo, data, ordem e restringir a artigos Open Access no PMC.", // Descrição ATUALIZADA //
  parameters: { //
    type: Type.OBJECT, //
    properties: { //
      query: { //
        type: Type.STRING, //
        description: "Termos de busca ou pergunta para pesquisar no PubMed (ex: 'CBD AND epilepsy')." //
      },
      max_results: { //
        type: Type.INTEGER, //
        description: "Número máximo de artigos a retornar (opcional, padrão interno: 5, máximo: 15)." //
      },
      article_type: { //
        type: Type.STRING, //
        description: "Filtra por um tipo específico de publicação (opcional). A função evita aplicar o filtro se o termo já estiver na query.", //
        enum: [ //
          "Clinical Trial", "Randomized Controlled Trial", "Review", //
          "Systematic Review", "Meta-Analysis", "Guideline", //
          "Observational Study", "Case Reports" //
        ]
      },
      sort_order: { //
        type: Type.STRING, //
        description: "Critério para ordenar os resultados (opcional). 'relevance' é o padrão.", //
        enum: [ "relevance", "publication_date" ] //
      },
      min_publication_date: { //
        type: Type.STRING, //
        description: "Data de publicação mais antiga (opcional). Formato Abschluss oder Abschluss/MM/DD." //
      },
      max_publication_date: { //
        type: Type.STRING, //
        description: "Data de publicação mais recente (opcional). Formato Abschluss oder Abschluss/MM/DD." //
      },
      // *** NOVO PARÂMETRO BOOLEANO ***
      pmc_open_access_only: { //
        type: Type.BOOLEAN, //
        description: "Opcional. Se definido como true, busca apenas artigos de acesso livre (Open Access) disponíveis no PubMed Central (PMC). Padrão: false." //
      }
    },
    required: ["query"] //
  }
};

// --- Exportações ---
export { search_pubmed, searchPubmedDeclaration }; //