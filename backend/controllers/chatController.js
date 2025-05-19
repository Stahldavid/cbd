// controllers/chatController.js - Controladores para processamento de chat

// Constantes configuráveis
const MAX_FUNCTION_CALLS = 5; // Limite máximo de chamadas de função sequenciais por turno

import { conversationMemory } from '../services/memoryService.js';
import {
  generateContent,
  generateContentStream,
  isInitialized,
} from '../services/geminiService.js';

// Model a ser usado nas requisições
const MODEL = 'gemini-2.5-flash-preview-04-17';


// Função para verificar se a resposta contém apenas chamadas de função (sem texto significativo)
const responseContainsOnlyFunctionCalls = (response) => {
  if (!response?.candidates?.[0]?.content?.parts) {
    return false;
  }

  const parts = response.candidates[0].content.parts;
  const hasFunctionCall = parts.some((part) => part.functionCall);
  const hasSignificantText = parts.some((part) => part.text && part.text.trim().length > 10); // Ignora textos muito curtos

  return hasFunctionCall && !hasSignificantText;
};

// Função para extrair texto de resposta do modelo
const extractModelResponseText = (response) => {
  if (!response?.candidates?.[0]?.content?.parts) {
    return null;
  }

  return response.candidates[0].content.parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join('');
};

// Controlador para chat normal (não-streaming)
const handleChat = async (req, res, availableFunctions, systemInstructionText, tools) => {
  const message = req.body.message || req.body.chat;
  const sessionId = req.body.sessionId || 'default';
  const patientContextFromReq = req.body.patientContext;
  console.log('[DEBUG Backend chatController] req.body.patientContext recebido (non-streaming):', JSON.stringify(patientContextFromReq, null, 2));
  const fullPatientHistoryText = req.body.patientContext?.fullPatientHistoryText;
  const requestId = Date.now();
  console.log(`[${requestId}] Received chat request: "${message}" for session ${sessionId}`);

  if (!message) return res.status(400).json({ error: 'Message required' });
  if (!isInitialized()) return res.status(503).json({ error: 'AI service not available.' });

  let finalSystemInstructionText = systemInstructionText;
  if (fullPatientHistoryText && fullPatientHistoryText.trim() !== '' && fullPatientHistoryText !== "Nenhum histórico contextual disponível para este paciente." && !fullPatientHistoryText.startsWith("Erro ao buscar histórico")) {
    finalSystemInstructionText = `Contexto sobre o paciente atual:
<patient_history>
${fullPatientHistoryText}
</patient_history>

${systemInstructionText}`;
  } else if (fullPatientHistoryText && (fullPatientHistoryText === "Nenhum histórico contextual disponível para este paciente." || fullPatientHistoryText.startsWith("Erro ao buscar histórico"))) {
    finalSystemInstructionText = `Nota sobre o contexto do paciente: ${fullPatientHistoryText}\n\n${systemInstructionText}`;
  } else {
    finalSystemInstructionText = `Nota: Não foi possível determinar o histórico contextual para este paciente (contexto não fornecido ou vazio).\n\n${systemInstructionText}`;
  }

  try {
    // Adiciona a mensagem do usuário à memória da sessão
    conversationMemory.addUserMessage(sessionId, message);

    // Obtém o histórico atual da conversa
    const sessionHistory = conversationMemory.getHistory(sessionId);
    console.log(
      `[${requestId}] Chat History prepared with ${sessionHistory.length} messages from session`
    );

    console.log(
      `[${requestId}] Sending message to Gemini (Chat) with history length ${sessionHistory.length}...`
    );

    // Chamada à API Gemini com o histórico da sessão
    let result = await generateContent(MODEL, sessionHistory, finalSystemInstructionText, tools);

    let responseFromModel = result?.response;

    if (!responseFromModel) {
      throw new Error('Invalid response structure from AI service (call 1). No response object.');
    }

    // Inicializar variáveis para o loop de chamadas de função
    let functionCalls = null;
    let modelResponseText = null;
    let modelResponseParts = [];
    let functionCallCount = 0;

    // --- Loop de chamadas de função sequenciais ---
    while (functionCallCount < MAX_FUNCTION_CALLS) {
      // Incrementa contador para evitar loops infinitos
      functionCallCount++;
      console.log(
        `[${requestId}] Processing potential function call iteration ${functionCallCount}/${MAX_FUNCTION_CALLS}`
      );

      // Reinicializa as variáveis para esta iteração
      functionCalls = null;
      modelResponseText = null;
      modelResponseParts = [];

      // Extrai partes da resposta atual
      if (responseFromModel.candidates?.[0]?.content?.parts) {
        modelResponseParts = responseFromModel.candidates[0].content.parts;

        // Extrai chamadas de função e texto das partes
        functionCalls = modelResponseParts
          .filter((part) => part.functionCall)
          .map((part) => part.functionCall);

        modelResponseText = modelResponseParts
          .filter((part) => part.text)
          .map((part) => part.text)
          .join('');
      } else {
        console.warn(
          `[${requestId}] No valid parts received from model's response (Chat) in iteration ${functionCallCount}.`
        );
        try {
          modelResponseText = responseFromModel.text();
        } catch (e) {
          modelResponseText = null;
        }
      }

      // Verifica se há chamadas de função
      if (functionCalls && functionCalls.length > 0) {
        const functionCall = functionCalls[0];
        console.log(
          `[${requestId}] **** Detected Function Call (Chat) - Iteration ${functionCallCount}: ****`
        );
        console.dir(functionCall, { depth: null });

        // Adiciona a chamada de função ao histórico da sessão
        conversationMemory.addFunctionCall(sessionId, functionCall.name, functionCall.args);

        let functionResultPayload;

        // Executa a função
        const functionToExecute = availableFunctions[functionCall.name];
        if (functionToExecute) {
          try {
            console.log(
              `[${requestId}] Executing function: ${functionCall.name} with args:`,
              functionCall.args
            );
            const executionResult = await functionToExecute(functionCall.args);
            functionResultPayload = executionResult.result;
            console.log(
              `[${requestId}] Function ${functionCall.name} executed successfully. Result:`,
              functionResultPayload
            );
          } catch (funcError) {
            console.error(
              `[${requestId}] Error executing function ${functionCall.name}:`,
              funcError
            );
            functionResultPayload = {
              success: false,
              error: `Erro ao executar a função '${functionCall.name}': ${funcError.message}`,
            };
          }
        } else {
          console.warn(`[${requestId}] Unknown function call requested: ${functionCall.name}`);
          functionResultPayload = {
            success: false,
            error: `Função '${functionCall.name}' não reconhecida.`,
          };
        }

        // Adiciona o resultado da função ao histórico da sessão
        conversationMemory.addFunctionResult(sessionId, functionCall.name, functionResultPayload);

        // Obtém o histórico atualizado com a chamada de função e o resultado
        const updatedHistory = conversationMemory.getHistory(sessionId);

        console.log(
          `[${requestId}] Sending function response back to Gemini (Chat) with history length ${updatedHistory.length}... (Iteration ${functionCallCount})`
        );

        // Nova chamada à API com o histórico atualizado
        result = await generateContent(MODEL, updatedHistory, finalSystemInstructionText, tools);

        responseFromModel = result?.response;

        if (!responseFromModel) {
          throw new Error(
            `Invalid response structure from AI service after function call (iteration ${functionCallCount}).`
          );
        }

        // Verificar se a resposta contém apenas chamadas de função ou se tem texto final
        const containsOnlyFunctionCalls = responseContainsOnlyFunctionCalls(responseFromModel);

        if (containsOnlyFunctionCalls) {
          // Se contém apenas chamadas de função, continuamos o loop
          console.log(
            `[${requestId}] Response contains only function calls, continuing loop (Iteration ${functionCallCount})`
          );
          continue;
        } else {
          // Se contém texto final, extraímos o texto e quebramos o loop
          console.log(
            `[${requestId}] Response contains final text, breaking loop after ${functionCallCount} function calls`
          );
          modelResponseText = extractModelResponseText(responseFromModel);
          break;
        }
      } else {
        // Nenhuma chamada de função detectada, apenas resposta de texto
        console.log(
          `[${requestId}] Gemini responded directly with text (Chat) in iteration ${functionCallCount}.`
        );
        break;
      }
    }

    // Se atingiu o limite de chamadas de função
    if (functionCallCount >= MAX_FUNCTION_CALLS) {
      console.warn(
        `[${requestId}] Reached maximum function call limit (${MAX_FUNCTION_CALLS}). Finishing sequence.`
      );
    }

    // Extrai texto final e adiciona ao histórico da sessão
    const finalText = modelResponseText ?? '[CuraAI: Não foi possível gerar uma resposta.]';
    conversationMemory.addModelTextResponse(sessionId, finalText);

    res.json({ text: finalText });
  } catch (error) {
    console.error(`[${requestId}] Error processing chat:`, error);
    if (error.response) {
      console.error(`[${requestId}] API Error Response Data:`, error.response.data);
    }

    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: `Error processing request: ${error.message || 'Unknown error'}` });
    } else {
      console.error(`[${requestId}] Headers already sent, could not send error JSON.`);
    }
  }
};

// Controlador para chat em streaming
const handleStreamChat = async (req, res, availableFunctions, systemInstructionText, tools) => {
  console.log('[handleStreamChat] Function entered.');
  const message = req.body.message || req.body.chat;
  const sessionId = req.body.sessionId || 'default';
  const patientContextFromReq = req.body.patientContext;
  console.log('[DEBUG Backend chatController] req.body.patientContext recebido (streaming):', JSON.stringify(patientContextFromReq, null, 2));
  const fullPatientHistoryText = req.body.patientContext?.fullPatientHistoryText;
  const requestId = Date.now();
  console.log(`[${requestId}] Received stream request: "${message}" for session ${sessionId}`);

  if (!message) return res.status(400).json({ error: 'Message required' });
  if (!isInitialized()) return res.status(503).json({ error: 'AI service not available.' });

  let finalSystemInstructionText = systemInstructionText;
  if (fullPatientHistoryText && fullPatientHistoryText.trim() !== '' && fullPatientHistoryText !== "Nenhum histórico contextual disponível para este paciente." && !fullPatientHistoryText.startsWith("Erro ao buscar histórico")) {
    finalSystemInstructionText = `Contexto sobre o paciente atual:
<patient_history>
${fullPatientHistoryText}
</patient_history>

${systemInstructionText}`;
  } else if (fullPatientHistoryText && (fullPatientHistoryText === "Nenhum histórico contextual disponível para este paciente." || fullPatientHistoryText.startsWith("Erro ao buscar histórico"))) {
    finalSystemInstructionText = `Nota sobre o contexto do paciente: ${fullPatientHistoryText}\n\n${systemInstructionText}`;
  } else {
    finalSystemInstructionText = `Nota: Não foi possível determinar o histórico contextual para este paciente (contexto não fornecido ou vazio).\n\n${systemInstructionText}`;
  }

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Adiciona a mensagem do usuário à memória da sessão
    conversationMemory.addUserMessage(sessionId, message);

    // Obtém o histórico atual da conversa
    const sessionHistory = conversationMemory.getHistory(sessionId);
    console.log(
      `[${requestId}] Stream History prepared with ${sessionHistory.length} messages from session`
    );

    console.log(
      `[${requestId}] Starting stream request to Gemini with history length: ${sessionHistory.length}`
    );

    // Função para processar várias chamadas de função recebidas no mesmo turno
    const processRemainingFunctions = async (history, functionCalls, currentIteration = 1) => {
      if (currentIteration >= MAX_FUNCTION_CALLS || functionCalls.length === 0) {
        return; // Limite atingido ou sem mais chamadas
      }

      // Pegar a próxima chamada para processar
      const nextFunctionCall = functionCalls[0];
      const remainingCalls = functionCalls.slice(1);

      console.log(
        `[${requestId}] Processing function call #${currentIteration + 1}: ${nextFunctionCall.name}`
      );

      // Enviar atualização para o cliente
      res.write(
        JSON.stringify({
          type: 'functionCall',
          data: {
            name: nextFunctionCall.name,
            args: nextFunctionCall.args || {},
            iteration: currentIteration + 1,
          },
        }) + '\n'
      );

      // Adicionar ao histórico
      conversationMemory.addFunctionCall(
        sessionId,
        nextFunctionCall.name,
        nextFunctionCall.args || {}
      );

      // Verificar argumentos
      if (!nextFunctionCall.args) {
        console.error(
          `[${requestId}] Function call detected but args are missing in pre-collected call!`,
          nextFunctionCall
        );
        res.write(
          JSON.stringify({
            type: 'error',
            data: 'Erro interno: Argumentos faltando para a função.',
          }) + '\n'
        );
        return;
      }

      // Executar a função
      let functionExecutionResult;
      let functionResultPayload;

      const functionToExecute = availableFunctions[nextFunctionCall.name];
      if (functionToExecute) {
        try {
          console.log(`[${requestId}] Executing function: ${nextFunctionCall.name}`);
          functionExecutionResult = await functionToExecute(nextFunctionCall.args);
          functionResultPayload = functionExecutionResult.result;
          console.log(
            `[${requestId}] Function executed successfully. Result:`,
            functionResultPayload
          );
        } catch (funcError) {
          console.error(`[${requestId}] Error executing function:`, funcError);
          const errorPayload = {
            success: false,
            error: `Erro ao executar a função '${nextFunctionCall.name}': ${funcError.message}`,
          };
          functionExecutionResult = { result: errorPayload };
          functionResultPayload = errorPayload;
        }
      } else {
        console.warn(`[${requestId}] Unknown function call requested: ${nextFunctionCall.name}`);
        const errorPayload = {
          success: false,
          error: `Função '${nextFunctionCall.name}' não reconhecida.`,
        };
        functionExecutionResult = { result: errorPayload };
        functionResultPayload = errorPayload;
      }

      // Envia o resultado para o cliente
      console.log(
        `[${requestId}] **** Sending Function Result to Client (sequence #${currentIteration + 1}): ****`
      );
      console.dir(functionExecutionResult.result, { depth: null });

      res.write(
        JSON.stringify({
          type: 'functionResult',
          data: {
            name: nextFunctionCall.name,
            result: functionExecutionResult.result,
            iteration: currentIteration + 1,
          },
        }) + '\n'
      );

      // Adiciona o resultado ao histórico
      conversationMemory.addFunctionResult(sessionId, nextFunctionCall.name, functionResultPayload);

      // Continuar com a próxima chamada (se houver)
      if (remainingCalls.length > 0) {
        const updatedHistory = conversationMemory.getHistory(sessionId);
        await processRemainingFunctions(updatedHistory, remainingCalls, currentIteration + 1);
      } else if (currentIteration + 1 < MAX_FUNCTION_CALLS) {
        // Se terminou as chamadas coletadas mas não atingiu o limite, continua com o fluxo normal
        const updatedHistory = conversationMemory.getHistory(sessionId);
        await processStreamFunctionCalls(updatedHistory, currentIteration + 1);
      }
    };

    // Função recursiva para processar chamadas de função sequenciais em streaming
    const processStreamFunctionCalls = async (history, functionCallCount = 0) => {
      // Verificar limite de chamadas de função para evitar loops infinitos
      if (functionCallCount >= MAX_FUNCTION_CALLS) {
        console.warn(
          `[${requestId}] Reached maximum function call limit (${MAX_FUNCTION_CALLS}) in streaming mode.`
        );
        res.write(
          JSON.stringify({
            type: 'info',
            data: `Limite de ${MAX_FUNCTION_CALLS} chamadas de função sequenciais atingido.`,
          }) + '\n'
        );
        return;
      }

      // Incrementar contador
      functionCallCount++;
      console.log(
        `[${requestId}] Processing streaming function call iteration ${functionCallCount}/${MAX_FUNCTION_CALLS}`
      );

      // Chamar a API Gemini com o histórico atual
      const iterationStreamResult = await generateContentStream(
        MODEL,
        history,
        finalSystemInstructionText,
        tools
      );

      console.log(
        `[${requestId}] Established stream connection for function iteration ${functionCallCount}.`
      );

      let iterationFunctionCall = null;
      let iterationTextResponse = '';
      let iterationHasSignificantText = false;
      let iterationModelParts = [];

      // Processar o stream
      for await (const chunk of iterationStreamResult) {
        if (!chunk) {
          console.warn(
            `[${requestId}] Received null/undefined chunk in iteration ${functionCallCount}.`
          );
          continue;
        }

        const candidate = chunk?.candidates?.[0];
        if (!candidate) {
          console.warn(
            `[${requestId}] Chunk received without candidates in iteration ${functionCallCount}:`,
            chunk
          );
          continue;
        }

        const currentContentParts = candidate?.content?.parts;

        if (currentContentParts) {
          for (const part of currentContentParts) {
            // Stream texto para o cliente
            if (part.text) {
              console.log(
                `[${requestId}] Streaming text chunk (iteration ${functionCallCount}): "${part.text.substring(0, 50)}..."`
              );
              res.write(JSON.stringify({ type: 'text', data: part.text }) + '\n');
              iterationTextResponse += part.text;

              // Verificar se texto é significativo (não apenas espaços ou caracteres de formatação)
              if (part.text.trim().length > 10) {
                iterationHasSignificantText = true;
              }
            }

            // Detecta chamada de função
            if (part.functionCall && !iterationFunctionCall) {
              console.log(
                `[${requestId}] **** Detected Function Call (Stream Part) in iteration ${functionCallCount}: ****`
              );
              console.dir(part.functionCall, { depth: null });

              iterationFunctionCall = part.functionCall;
              res.write(
                JSON.stringify({
                  type: 'functionCall',
                  data: {
                    name: iterationFunctionCall.name,
                    args: iterationFunctionCall.args || {},
                    iteration: functionCallCount,
                  },
                }) + '\n'
              );
            }

            // Acumula partes para o histórico
            iterationModelParts.push(part);
          }
        } else {
          console.log(
            `[${requestId}] Chunk received without content parts in iteration ${functionCallCount}:`,
            chunk
          );
        }
      }

      console.log(`[${requestId}] Finished processing stream iteration ${functionCallCount}.`);

      // Se tiver texto acumulado significativo sem chamada de função, adiciona ao histórico e finaliza
      if (iterationTextResponse && iterationHasSignificantText && !iterationFunctionCall) {
        conversationMemory.addModelTextResponse(sessionId, iterationTextResponse);
        console.log(
          `[${requestId}] Added model text response to session history (iteration ${functionCallCount}, no function call).`
        );
        return; // Finaliza o processamento recursivo
      }
      // Se tiver uma chamada de função, processa ela
      else if (iterationFunctionCall) {
        // Adiciona a chamada de função ao histórico da sessão
        conversationMemory.addFunctionCall(
          sessionId,
          iterationFunctionCall.name,
          iterationFunctionCall.args || {}
        );

        if (!iterationFunctionCall.args) {
          console.error(
            `[${requestId}] Function call detected but args are missing in iteration ${functionCallCount}!`,
            iterationFunctionCall
          );
          res.write(
            JSON.stringify({
              type: 'error',
              data: 'Erro interno: Argumentos faltando para a função.',
            }) + '\n'
          );
          return; // Encerra o processamento em caso de erro
        }

        console.log(
          `[${requestId}] Handling function call in iteration ${functionCallCount}: ${iterationFunctionCall.name} with args:`,
          iterationFunctionCall.args
        );
        let functionExecutionResult;
        let functionResultPayload;

        // Executa a função
        const functionToExecute = availableFunctions[iterationFunctionCall.name];
        if (functionToExecute) {
          try {
            console.log(
              `[${requestId}] Executing function in iteration ${functionCallCount}: ${iterationFunctionCall.name}`
            );
            functionExecutionResult = await functionToExecute(iterationFunctionCall.args);
            functionResultPayload = functionExecutionResult.result;
            console.log(
              `[${requestId}] Function executed in iteration ${functionCallCount}. Result payload:`,
              functionResultPayload
            );
          } catch (funcError) {
            console.error(
              `[${requestId}] Error executing function in iteration ${functionCallCount}:`,
              funcError
            );
            const errorPayload = {
              success: false,
              error: `Erro ao executar a função '${iterationFunctionCall.name}': ${funcError.message}`,
            };
            functionExecutionResult = { result: errorPayload };
            functionResultPayload = errorPayload;
          }
        } else {
          console.warn(
            `[${requestId}] Unknown function call requested in iteration ${functionCallCount}: ${iterationFunctionCall.name}`
          );
          const errorPayload = {
            success: false,
            error: `Função '${iterationFunctionCall.name}' não reconhecida.`,
          };
          functionExecutionResult = { result: errorPayload };
          functionResultPayload = errorPayload;
        }

        // Envia o resultado para o cliente
        console.log(
          `[${requestId}] **** Sending Function Result to Client (iteration ${functionCallCount}): ****`
        );
        console.dir(functionExecutionResult.result, { depth: null });

        res.write(
          JSON.stringify({
            type: 'functionResult',
            data: {
              name: iterationFunctionCall.name,
              result: functionExecutionResult.result,
              iteration: functionCallCount,
            },
          }) + '\n'
        );

        // Adiciona o resultado ao histórico da sessão
        conversationMemory.addFunctionResult(
          sessionId,
          iterationFunctionCall.name,
          functionResultPayload
        );

        // Obtém o histórico atualizado com a chamada de função e o resultado
        const updatedHistory = conversationMemory.getHistory(sessionId);

        // Se tiver texto significativo, adicionar ao histórico e retornar
        if (iterationHasSignificantText) {
          if (iterationTextResponse) {
            conversationMemory.addModelTextResponse(sessionId, iterationTextResponse);
            console.log(
              `[${requestId}] Added mixed text/function response to session history (iteration ${functionCallCount}).`
            );
          }
          return; // Finaliza o processamento recursivo
        }

        // Continuar o processamento recursivo com o histórico atualizado
        console.log(
          `[${requestId}] Continuing function call sequence with iteration ${functionCallCount + 1}. History length: ${updatedHistory.length}`
        );

        // Chamada recursiva para o próximo ciclo
        await processStreamFunctionCalls(updatedHistory, functionCallCount);
      } else {
        // Sem texto significativo nem função, finalizar
        console.log(
          `[${requestId}] No significant content or function calls detected in iteration ${functionCallCount}. Ending sequence.`
        );
        return;
      }
    };

    // --- Process Initial Stream ---
    const initialStreamResult = await generateContentStream(
      MODEL,
      sessionHistory,
      finalSystemInstructionText,
      tools
    );

    console.log(`[${requestId}] Initial stream connection established with Gemini.`);

    let initialFunctionCall = null;
    let initialTextResponse = '';
    let initialHasSignificantText = false;
    let initialModelParts = [];

    // Processar o stream inicial
    for await (const chunk of initialStreamResult) {
      if (!chunk) {
        console.warn(`[${requestId}] Received null/undefined chunk.`);
        continue;
      }

      const candidate = chunk?.candidates?.[0];
      if (!candidate) {
        console.warn(`[${requestId}] Chunk received without candidates:`, chunk);
        continue;
      }

      const currentContentParts = candidate?.content?.parts;

      if (currentContentParts) {
        for (const part of currentContentParts) {
          // Stream texto para o cliente
          if (part.text) {
            console.log(
              `[${requestId}] Streaming initial text chunk: "${part.text.substring(0, 50)}..."`
            );
            res.write(JSON.stringify({ type: 'text', data: part.text }) + '\n');
            initialTextResponse += part.text;

            // Verificar se texto é significativo
            if (part.text.trim().length > 10) {
              initialHasSignificantText = true;
            }
          }

          // Detecta chamada de função
          if (part.functionCall) {
            console.log(`[${requestId}] **** Detected Function Call (Stream Part): ****`);
            console.dir(part.functionCall, { depth: null });

            // Armazena a primeira chamada de função para processamento imediato
            if (!initialFunctionCall) {
              initialFunctionCall = part.functionCall;
              res.write(
                JSON.stringify({
                  type: 'functionCall',
                  data: {
                    name: initialFunctionCall.name,
                    args: initialFunctionCall.args || {},
                    iteration: 1,
                  },
                }) + '\n'
              );
            } else {
              // Armazenamos para processamento posterior, mas não ignoramos
              console.log(
                `[${requestId}] Detected additional function call in same turn: ${part.functionCall.name}`
              );
            }
          }

          // Acumula partes para o histórico
          initialModelParts.push(part);
        }
      } else {
        console.log(`[${requestId}] Chunk received without content parts:`, chunk);
      }
    }

    console.log(`[${requestId}] Finished processing initial stream.`);

    // Coletar todas as chamadas de função no mesmo turno
    let pendingFunctionCalls = [];

    for (const part of initialModelParts) {
      if (part.functionCall) {
        pendingFunctionCalls.push(part.functionCall);
      }
    }

    console.log(
      `[${requestId}] Found ${pendingFunctionCalls.length} function calls in initial turn.`
    );

    // Se tiver texto acumulado significativo e nenhuma chamada de função, adiciona ao histórico
    if (initialTextResponse && initialHasSignificantText && pendingFunctionCalls.length === 0) {
      conversationMemory.addModelTextResponse(sessionId, initialTextResponse);
      console.log(
        `[${requestId}] Added model text response to session history (no function call).`
      );
    }
    // Se tiver chamadas de função, processa todas elas em sequência
    else if (pendingFunctionCalls.length > 0) {
      // Vamos processar a primeira chamada de função diretamente
      initialFunctionCall = pendingFunctionCalls[0];

      // Adiciona a chamada de função ao histórico da sessão
      conversationMemory.addFunctionCall(
        sessionId,
        initialFunctionCall.name,
        initialFunctionCall.args || {}
      );

      if (!initialFunctionCall.args) {
        console.error(
          `[${requestId}] Function call detected but args are missing!`,
          initialFunctionCall
        );
        res.write(
          JSON.stringify({
            type: 'error',
            data: 'Erro interno: Argumentos faltando para a função.',
          }) + '\n'
        );
      } else {
        console.log(
          `[${requestId}] Handling initial function call: ${initialFunctionCall.name} with args:`,
          initialFunctionCall.args
        );
        let functionExecutionResult;
        let functionResultPayload;

        // Executa a função
        const functionToExecute = availableFunctions[initialFunctionCall.name];
        if (functionToExecute) {
          try {
            console.log(`[${requestId}] Executing function: ${initialFunctionCall.name}`);
            functionExecutionResult = await functionToExecute(initialFunctionCall.args);
            functionResultPayload = functionExecutionResult.result;
            console.log(`[${requestId}] Function executed. Result payload:`, functionResultPayload);
          } catch (funcError) {
            console.error(`[${requestId}] Error executing function:`, funcError);
            const errorPayload = {
              success: false,
              error: `Erro ao executar a função '${initialFunctionCall.name}': ${funcError.message}`,
            };
            functionExecutionResult = { result: errorPayload };
            functionResultPayload = errorPayload;
          }
        } else {
          console.warn(
            `[${requestId}] Unknown function call requested: ${initialFunctionCall.name}`
          );
          const errorPayload = {
            success: false,
            error: `Função '${initialFunctionCall.name}' não reconhecida.`,
          };
          functionExecutionResult = { result: errorPayload };
          functionResultPayload = errorPayload;
        }

        // Envia o resultado para o cliente
        console.log(`[${requestId}] **** Sending Function Result to Client: ****`);
        console.dir(functionExecutionResult.result, { depth: null });

        res.write(
          JSON.stringify({
            type: 'functionResult',
            data: {
              name: initialFunctionCall.name,
              result: functionExecutionResult.result,
              iteration: 1,
            },
          }) + '\n'
        );

        // Adiciona o resultado ao histórico da sessão
        conversationMemory.addFunctionResult(
          sessionId,
          initialFunctionCall.name,
          functionResultPayload
        );

        // Obtém o histórico atualizado com a chamada de função e o resultado
        const updatedHistory = conversationMemory.getHistory(sessionId);

        // Se houver mais funções para processar ou se não tiver texto significativo, continuamos com sequência
        const shouldContinueSequence =
          pendingFunctionCalls.length > 1 || !initialHasSignificantText;

        if (shouldContinueSequence) {
          console.log(
            `[${requestId}] Continuing with function call sequence. Remaining calls: ${pendingFunctionCalls.length - 1}`
          );

          // Criar uma variável para armazenar as chamadas restantes para passar para o processamento
          const remainingCalls = pendingFunctionCalls.slice(1); // Remove a primeira que já foi processada

          // Iniciamos o processamento sequencial com o histórico atualizado e a lista de chamadas pendentes
          if (remainingCalls.length > 0) {
            console.log(
              `[${requestId}] Processing ${remainingCalls.length} additional function calls...`
            );
            await processRemainingFunctions(updatedHistory, remainingCalls);
          } else {
            // Se não tiver mais chamadas pendentes mas ainda não houver texto significativo,
            // iniciar processamento recursivo normal para ver se o modelo gera mais chamadas
            console.log(`[${requestId}] Starting sequential function call processing...`);
            await processStreamFunctionCalls(updatedHistory, 1); // Já estamos na iteração 1
          }
        } else {
          // Se tiver texto significativo e não houver mais chamadas, tratamos como um caso regular
          if (initialTextResponse) {
            conversationMemory.addModelTextResponse(sessionId, initialTextResponse);
            console.log(`[${requestId}] Added mixed text/function response to session history.`);
          }

          // Stream resposta final após a função
          console.log(
            `[${requestId}] Sending function response back to Gemini for final response... History length: ${updatedHistory.length}`
          );

          // Obtém o histórico final
          const finalHistory = conversationMemory.getHistory(sessionId);

          const finalStreamResult = await generateContentStream(
            MODEL,
            finalHistory,
            finalSystemInstructionText,
            tools
          );

          let finalTextResponse = '';

          // Stream o texto final
          for await (const finalChunk of finalStreamResult) {
            if (!finalChunk) continue;
            const candidate = finalChunk?.candidates?.[0];
            const finalContentParts = candidate?.content?.parts;

            if (finalContentParts) {
              for (const part of finalContentParts) {
                if (part.text) {
                  console.log(`[${requestId}] Streaming final text chunk...`);
                  res.write(JSON.stringify({ type: 'text', data: part.text }) + '\n');
                  finalTextResponse += part.text;
                }
              }
            }
          }

          // Adiciona a resposta final ao histórico
          if (finalTextResponse) {
            conversationMemory.addModelTextResponse(sessionId, finalTextResponse);
            console.log(`[${requestId}] Added final model response to session history.`);
          }
        }
      }
    }

    // Encerra o stream HTTP
    res.end();
    console.log(`[${requestId}] Response stream ended normally.`);
  } catch (error) {
    console.error(`[${requestId}] Error processing stream request:`, error);

    if (res && !res.headersSent) {
      console.error(`[${requestId}] Sending 500 error response (JSON).`);
      try {
        res.status(500).json({
          type: 'error',
          data: `Stream processing error: ${error.message || 'Unknown error'}`,
        });
      } catch (jsonError) {
        console.error('Failed to send JSON error response:', jsonError);
        if (!res.writableEnded) res.end();
      }
    } else if (res && res.writable && !res.writableEnded) {
      try {
        console.error(`[${requestId}] Writing error to open stream and ending it.`);
        const errorMsg =
          JSON.stringify({
            type: 'error',
            data: `Stream Error: ${error.message || 'Unknown error'}`,
          }) + '\n';
        res.write(errorMsg);
        res.end();
      } catch (writeError) {
        console.error(`[${requestId}] Failed to write error to stream:`, writeError);
        if (!res.writableEnded) {
          res.end();
        }
      }
    } else {
      console.error(
        `[${requestId}] Cannot send error - headers sent or stream ended/not writable.`
      );
    }
  }
};

// Limpa a sessão de chat
const clearSession = (req, res) => {
  const sessionId = req.body.sessionId || 'default';
  conversationMemory.initSession(sessionId);
  console.log(`Session ${sessionId} cleared by user request`);
  res.json({ success: true, message: `Session ${sessionId} cleared` });
};

// Controlador para depuração (apenas em desenvolvimento)
const getSessionHistory = (req, res) => {
  const sessionId = req.params.sessionId;
  const session = conversationMemory.getSession(sessionId);
  res.json({ sessionId, history: session.history });
};

// Exporta os controladores
export { handleChat, handleStreamChat, clearSession, getSessionHistory };
