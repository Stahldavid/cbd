// backend/tools/tavilySearch.js
import pkg from '@google/genai';
const { Type } = pkg; // Import Type for declaring parameter types

// --- Function Implementation ---
// Performs the Tavily search and returns a standardized result object
async function tavilySearch({
    query,
    max_results = 5,
    include_domains = [], // Default to empty array
    exclude_domains = [], // Default to empty array
    time_range = null     // Default to null
}) {
    try {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
            console.error("[ERRO TAVILY CONFIG] Variável de ambiente 'TAVILY_API_KEY' não definida.");
            return { result: { success: false, error: "TAVILY_API_KEY not configured on server." } };
        }

        // Sanitize max_results (ensure it's an integer within a reasonable range)
        const safeMaxResults = Math.max(1, Math.min(10, parseInt(max_results, 10) || 5)); // Example: 1-10 range

        console.log(`[Tavily Search] Querying for: "${query}", Max Results: ${safeMaxResults}`);

        // Construct the body, only including optional fields if they have values
        const requestBody = {
            api_key: apiKey,
            query,
            topic: 'general',
            search_depth: 'basic',
            max_results: safeMaxResults,
            include_answer: false,
            include_raw_content: false,
            include_images: false,
        };
        if (include_domains && include_domains.length > 0) {
            requestBody.include_domains = include_domains;
            console.log(`[Tavily Search] Including domains: ${include_domains.join(', ')}`);
        }
        if (exclude_domains && exclude_domains.length > 0) {
            requestBody.exclude_domains = exclude_domains;
            console.log(`[Tavily Search] Excluding domains: ${exclude_domains.join(', ')}`);
        }
        // Tavily expects specific string formats or null. Validate if necessary.
        if (time_range && typeof time_range === 'string' && time_range.trim() !== '') {
             // Basic validation example (allow '1d', '1w', '1m', '1y', etc.) - adjust as needed
            if (/^\d+[dwmy]$/.test(time_range.trim())) {
                 requestBody.time_range = time_range.trim();
                 console.log(`[Tavily Search] Time range: ${requestBody.time_range}`);
             } else {
                 console.warn(`[Tavily Search] Invalid time_range format received: ${time_range}. Ignoring.`);
             }
        }


        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'x-tavily-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[ERRO TAVILY API] Status: ${response.status}, Body: ${errorBody}`);
            return { result: { success: false, error: `Tavily API Error: ${response.status} ${response.statusText}` } };
        }

        const searchResult = await response.json();
        console.log(`[Tavily Search] Received ${searchResult?.results?.length || 0} results.`);

        const processedResults = searchResult.results?.map(res => ({
            title: res.title,
            url: res.url,
            snippet: res.content,
            score: res.score
        })) || [];

        return { result: { success: true, results: processedResults } };

    } catch (error) {
        console.error(`[ERRO TAVILY EXEC] ${error.message}`);
        return { result: { success: false, error: `Error during Tavily search execution: ${error.message}` } };
    }
}

// --- Function Declaration (Including Optional Params) ---
const tavilySearchDeclaration = {
    name: 'tavily_search',
    description: 'Search the web for current information, news, articles, and research results using the Tavily search engine. Useful for recent events or information not in the training data.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: 'The search query string to find relevant web pages. Be specific and clear.'
            },
            max_results: {
                type: Type.INTEGER,
                description: 'Optional. The maximum number of search results to return (default 5, max 10).'
            },
            include_domains: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Optional. A list of domains to specifically include in the search results (e.g., ["pubmed.gov", "mayoclinic.org"])'
            },
            exclude_domains: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Optional. A list of domains to specifically exclude from the search results (e.g., ["wikipedia.org"])'
            },
            time_range: {
                type: Type.STRING,
                description: 'Optional. The time range to filter results (e.g., "1d", "2w", "3m", "1y" for past day, 2 weeks, 3 months, 1 year).'
            }
        },
        required: ['query'] // Only query is strictly required
    }
};

// Export both the function and its declaration
export { tavilySearch, tavilySearchDeclaration };