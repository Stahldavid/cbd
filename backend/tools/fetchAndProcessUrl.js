// backend/tools/fetchAndProcessUrl.js

// 1. Importações necessárias
import fetch from 'node-fetch'; // Ou use global fetch se preferir
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import robotsParser from 'robots-parser';
import { URL } from 'url';
import pkg from '@google/genai'; // Para o Type
const { Type } = pkg;

const DEFAULT_USER_AGENT = "CuraAI Bot/1.0 (+http://yourappdomain.com/botinfo)";

// 2. Implementação da Função (Adaptada para retornar { result: ... })
/**
 * Busca o conteúdo de uma URL, opcionalmente extrai/converte para Markdown,
 * aplica limites de tamanho/índice e verifica robots.txt.
 * @param {object} args - Arguments object.
 * @param {string} args.urlString - A URL da página a ser processada (obrigatório).
 * @param {number} [args.maxLength=5000] - Número máximo de caracteres a retornar.
 * @param {number} [args.startIndex=0] - Índice de caractere inicial para o conteúdo retornado.
 * @param {boolean} [args.raw=false] - Se true, retorna o conteúdo bruto (HTML ou outro) sem conversão para Markdown.
 * @returns {Promise<{result: {success: boolean, content?: string, error?: string}}>} Result object.
 */
async function fetchAndProcessUrl({
    urlString, // Renomeado de 'url' na função original para 'urlString' para corresponder à declaração
    maxLength = 5000,
    startIndex = 0,
    raw = false
}) {
    console.log(`[FetchAndProcess] Attempting: ${urlString}, raw=${raw}, start=${startIndex}, max=${maxLength}`);
    let targetUrl;
    try {
        targetUrl = new URL(urlString);
    } catch (e) {
        console.error(`[FetchAndProcess Error] Invalid URL: ${urlString}`);
        return { result: { success: false, error: `URL inválida fornecida: ${urlString}` } };
    }
    // Add checks for maxLength and startIndex types/values if needed

    // --- 1. Verificação do robots.txt ---
    const robotsUrl = new URL('/robots.txt', targetUrl.origin).href;
    let robotsTxtContent = '';
    let robots;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const robotsResponse = await fetch(robotsUrl, { headers: { 'User-Agent': DEFAULT_USER_AGENT }, redirect: 'follow', signal: controller.signal });
        clearTimeout(timeoutId);
        if (robotsResponse.status >= 200 && robotsResponse.status < 300) {
            robotsTxtContent = await robotsResponse.text();
            robots = robotsParser(robotsUrl, robotsTxtContent);
        } else if (robotsResponse.status !== 404) {
            // Don't throw, return error result
            return { result: { success: false, error: `Não foi possível verificar ${robotsUrl} (Status: ${robotsResponse.status}). Acesso negado por precaução.` } };
        }
        if (robots && !robots.isAllowed(targetUrl.href, DEFAULT_USER_AGENT)) {
             return { result: { success: false, error: `Acesso a ${targetUrl.href} negado por ${robotsUrl}.` } };
        }
    } catch (error) {
        if (error.name === 'AbortError') { return { result: { success: false, error: `Timeout ao verificar ${robotsUrl}.` } }; }
        return { result: { success: false, error: `Erro ao verificar permissões (${robotsUrl}): ${error.message}` } };
    }

    // --- 2. Buscar o conteúdo da URL principal ---
    let pageRawContent = '';
    let contentType = '';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const pageResponse = await fetch(targetUrl.href, { headers: { 'User-Agent': DEFAULT_USER_AGENT, 'Accept': 'text/html,*/*' }, redirect: 'follow', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!pageResponse.ok) { throw new Error(`Status: ${pageResponse.status}`); }
        contentType = pageResponse.headers.get('content-type') || '';
        pageRawContent = await pageResponse.text();
    } catch (error) {
        if (error.name === 'AbortError') { return { result: { success: false, error: `Timeout ao buscar conteúdo de ${targetUrl.href}.` } }; }
        return { result: { success: false, error: `Erro ao buscar URL (${targetUrl.href}): ${error.message}` } };
    }

    // --- 3. Processar o conteúdo (Markdown ou Raw) ---
    let finalContent = '';
    const isHtml = contentType.includes('text/html');

    if (raw) {
        finalContent = pageRawContent;
    } else {
        if (!isHtml) {
             return { result: { success: false, error: `Não é possível extrair Markdown. O conteúdo de ${targetUrl.href} não é HTML (Content-Type: ${contentType}). Use raw:true para conteúdo bruto.` } };
        }
        try {
            const doc = new JSDOM(pageRawContent, { url: targetUrl.href }).window.document;
            const reader = new Readability(doc);
            const article = reader.parse();
            if (!article || !article.content) { throw new Error("Readability falhou na extração."); }
            const turndownService = new TurndownService({ headingStyle: 'atx' });
            finalContent = turndownService.turndown(article.content);
            if (!finalContent.trim()) { console.warn("Markdown extraído está vazio."); }
        } catch (error) {
            return { result: { success: false, error: `Erro ao processar HTML para Markdown: ${error.message}` } };
        }
    }

    // --- 4. Aplicar startIndex e maxLength ---
    const originalLength = finalContent.length;
    let slicedContent = '';
    if (startIndex >= originalLength) {
        slicedContent = ''; // Start index is beyond content length
    } else {
        slicedContent = finalContent.substring(startIndex, startIndex + maxLength);
    }

    console.log(`[FetchAndProcess] Success. Returning content slice (start: ${startIndex}, max: ${maxLength}, actual: ${slicedContent.length}).`);
    // Retorne sucesso com o conteúdo processado/fatiado
    return { result: { success: true, content: slicedContent } };
}


// 3. Declaração da Função (para Gemini)
const fetchAndProcessUrlDeclaration = {
    name: "fetch_and_process_url", // Nome único
    description: "Busca o conteúdo de uma URL da web, opcionalmente converte o artigo principal para Markdown (padrão) ou retorna o conteúdo bruto (HTML, texto, etc.). Pode retornar apenas uma parte do conteúdo especificando início e tamanho máximo. Verifica permissões em robots.txt.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            urlString: { // Corresponde ao parâmetro da função JS
                type: Type.STRING,
                description: "A URL completa (com http/https) da página a ser buscada."
            },
            maxLength: {
                type: Type.INTEGER,
                description: "Opcional. Número máximo de caracteres a retornar (padrão: 5000)."
            },
            startIndex: {
                type: Type.INTEGER,
                description: "Opcional. Índice baseado em zero do caractere inicial a retornar (padrão: 0)."
            },
            raw: {
                type: Type.BOOLEAN,
                description: "Opcional. Se true, retorna o conteúdo bruto da URL sem tentar extrair/converter para Markdown (padrão: false)."
            }
        },
        required: ["urlString"] // Apenas a URL é obrigatória
    }
};

// 4. Exportações
export { fetchAndProcessUrl, fetchAndProcessUrlDeclaration };