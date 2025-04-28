// // backend/tools/index.js

// // 1. Import tools from their respective files
// import { tavilySearch, tavilySearchDeclaration } from './tavilySearch.js';
// // import { anotherTool, anotherToolDeclaration } from './anotherTool.js'; // Add future tools here
// import { fetchAndProcessUrl, fetchAndProcessUrlDeclaration } from './fetchAndProcessUrl.js'; // <-- IMPORTAR A NOVA
// import { fillPrescription, fillPrescriptionDeclaration } from './fillPrescription.js'; // <-- IMPORTAR A NOVA FUNÇÃO

// // 2. Create the map of function implementations
// const availableFunctions = {
//     [tavilySearchDeclaration.name]: tavilySearch,
//     // [anotherToolDeclaration.name]: anotherTool,
//     [fetchAndProcessUrlDeclaration.name]: fetchAndProcessUrl,
//     [fillPrescriptionDeclaration.name]: fillPrescription, // <-- ADICIONAR A NOVA FUNÇÃO AQUI
// };

// // 3. Create the array of all function declarations
// const allDeclarations = [
//     tavilySearchDeclaration,
//     // anotherToolDeclaration,
//     fetchAndProcessUrlDeclaration,
//     fillPrescriptionDeclaration, // <-- ADICIONAR A NOVA FUNÇÃO AQUI
// ];

// // 4. Export the map and the array
// export { availableFunctions, allDeclarations };


// backend/tools/index.js

// 1. Import tools from their respective files
import { tavilySearch, tavilySearchDeclaration } from './tavilySearch.js';
import { fetchAndProcessUrl, fetchAndProcessUrlDeclaration } from './fetchAndProcessUrl.js';
import { fillPrescription, fillPrescriptionDeclaration } from './fillPrescription.js';
import { search_pubmed, searchPubmedDeclaration } from './searchPubmed.js';
import { fetch_pubmed_details, fetchPubmedDetailsDeclaration } from './fetchPubmedDetails.js'; // <-- ADICIONE ESTA LINHA

// 2. Create the map of function implementations
const availableFunctions = {
    [tavilySearchDeclaration.name]: tavilySearch,
    [fetchAndProcessUrlDeclaration.name]: fetchAndProcessUrl,
    [fillPrescriptionDeclaration.name]: fillPrescription,
    [searchPubmedDeclaration.name]: search_pubmed,
    [fetchPubmedDetailsDeclaration.name]: fetch_pubmed_details, // <-- ADICIONE ESTA LINHA
};

// 3. Create the array of all function declarations
const allDeclarations = [
    tavilySearchDeclaration,
    fetchAndProcessUrlDeclaration,
    fillPrescriptionDeclaration,
    searchPubmedDeclaration,
    fetchPubmedDetailsDeclaration, // <-- ADICIONE ESTA LINHA
];

// 4. Export the map and the array
export { availableFunctions, allDeclarations };