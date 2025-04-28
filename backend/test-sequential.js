// Arquivo de teste para verificar o processamento de chamadas de função sequenciais

console.log("Testando processamento de chamadas de função sequenciais...");

// Exemplo de resposta simulada com múltiplas chamadas de função
const mockResponseWithMultipleFunctions = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: "Vou fazer duas buscas para você."
          },
          {
            functionCall: {
              name: "tavily_search",
              args: {
                query: "benefícios do CBD em 2025"
              }
            }
          },
          {
            functionCall: {
              name: "fetch_and_process_url",
              args: {
                urlString: "https://example.com/cbd-research",
                maxLength: 3000
              }
            }
          }
        ]
      }
    }
  ]
};

// Análise da resposta para extrair chamadas de função
function extractFunctionCalls(response) {
  const functionCalls = [];
  
  if (!response?.candidates?.[0]?.content?.parts) {
    console.log("Formato de resposta inválido");
    return functionCalls;
  }
  
  const parts = response.candidates[0].content.parts;
  
  for (const part of parts) {
    if (part.functionCall) {
      functionCalls.push(part.functionCall);
    }
  }
  
  return functionCalls;
}

// Extrair chamadas de função da resposta mock
const extractedCalls = extractFunctionCalls(mockResponseWithMultipleFunctions);
console.log(`Encontradas ${extractedCalls.length} chamadas de função:`);
extractedCalls.forEach((call, index) => {
  console.log(`${index + 1}. ${call.name} - args:`, call.args);
});

// Simulação do processamento sequencial
console.log("\nSimulando processamento sequencial:");

async function processFunctionCallsSequentially(functionCalls) {
  console.log(`Iniciando processamento de ${functionCalls.length} chamadas de função...`);
  
  for (let i = 0; i < functionCalls.length; i++) {
    const call = functionCalls[i];
    console.log(`\nProcessando função #${i + 1}: ${call.name}`);
    console.log(`Argumentos:`, call.args);
    
    // Simular execução
    console.log(`Executando ${call.name}...`);
    
    // Simular resultado
    console.log(`Resultado da execução #${i + 1} obtido com sucesso`);
    
    // Verificar se existe próxima chamada
    if (i < functionCalls.length - 1) {
      console.log(`Avançando para próxima chamada de função...`);
    } else {
      console.log(`Todas as ${functionCalls.length} chamadas de função processadas com sucesso!`);
    }
  }
}

// Executar simulação
processFunctionCallsSequentially(extractedCalls);

console.log("\nTeste concluído com sucesso!");
