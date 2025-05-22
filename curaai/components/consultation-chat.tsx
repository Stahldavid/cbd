"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card" // Card not directly used in new ChatMessage
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LucideClock,
  LucidePlus,
  LucideRefreshCw,
  LucideSend,
  LucideTrash2,
  LucideMic,
  LucidePaperclip,
  // LucideThumbsUp, // Not used in this version
  // LucideThumbsDown, // Not used in this version
  LucideClipboard,
  LucideFileText,
  LucideArrowRight,
  LucideAlertCircle, 
  LucideInfo,        
  LucideBot,         
  LucideUser,        
  LucideCode2,       
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { usePatient } from "@/contexts/PatientContext"
import { supabase } from "@/lib/supabaseClient" 
import { toast } from "sonner"

// Backend URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const CHAT_URL = `${API_BASE_URL}/chat`;
const STREAM_URL = `${API_BASE_URL}/stream`; // For when streaming is implemented
const CLEAR_SESSION_URL = `${API_BASE_URL}/clear-session`; // For clear conversation functionality

// --- Message Types Definition ---
interface FunctionCallInfo {
  name: string;
  arguments: Record<string, any>; 
  toolCallId?: string;
}

interface FunctionResultInfo {
  name: string;
  result: any; 
  toolCallId?: string;
  isError?: boolean; 
}

export interface Message {
  id: string; 
  text_content: string; 
  sender: "user" | "ai" | "system"; 
  timestamp: Date;
  type: 
    | "user"           
    | "ai"             
    | "system"         
    | "error"          
    | "info"           
    | "functionCall"   
    | "functionResult" 
    | "ai_streaming"   // For future streaming
    | "recommendation" // Retained from original new UI for styling
    | "citation";      // Retained from original new UI for styling
  
  isComplete?: boolean; 
  isStreaming?: boolean; 

  functionCallInfo?: FunctionCallInfo;
  functionResultInfo?: FunctionResultInfo;

  metadata?: { // Retained from original new UI
    confidence?: number;
    sources?: string[];
    actionable?: boolean; 
  };
}
// --- End Message Types Definition ---

export function ConsultationChat() {
  const { user, doctorId } = useAuth();
  const { 
    activePatient, 
    currentConsultationId, 
    startNewConsultation, 
    endCurrentConsultation, // Assuming this will be added to PatientContext
    clearActivePatientAndConsultation,
    currentPatientFullHistory // Added to destructure from usePatient
  } = usePatient(); 

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [currentLocalSessionId, setCurrentLocalSessionId] = useState<string | null>(null);
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null); // For tracking streaming message

 useEffect(() => {
    if (user?.id) {
      setCurrentLocalSessionId(user.id); 
    }
  }, [user]);

  // Function to fetch past messages for the current consultation
  const fetchPastMessages = useCallback(async (consultationId: string) => {
    if (!consultationId) return;
    console.log("Fetching past messages for consultation:", consultationId);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*') // Adjust columns as needed, ensure they match the Message interface
        .eq('consultation_id', consultationId)
        .order('timestamp', { ascending: true });

      if (error) {
        toast.error(`Failed to fetch past messages: ${error.message}`);
        throw error;
      }

      if (data) {
        const fetchedMessages: Message[] = data.map((dbMessage: any) => ({
          id: dbMessage.id || `db-${dbMessage.consultation_id}-${Math.random()}`, // Ensure unique ID
          text_content: dbMessage.text_content,
          sender: dbMessage.sender as "user" | "ai" | "system",
          timestamp: new Date(dbMessage.timestamp),
          type: dbMessage.message_type as Message['type'], // Ensure type matches
          functionCallInfo: dbMessage.function_call_info,
          functionResultInfo: dbMessage.function_result_info,
          // metadata: dbMessage.metadata, // If you have metadata
        }));
        console.log("Fetched messages:", fetchedMessages);
        // Prepend system messages and then add fetched, avoiding duplicates if any system msgs were stored
        setMessages(prevMessages => {
          const existingIds = new Set(prevMessages.map(m => m.id));
          const newFetchedMessages = fetchedMessages.filter(fm => !existingIds.has(fm.id));
          return [...prevMessages, ...newFetchedMessages];
        });
      }
    } catch (error) {
      console.error("Error fetching past messages:", error);
    }
  }, []);

  useEffect(() => {
    if (activePatient && currentConsultationId) {
      const initialSystemMessages: Message[] = [
        {
          id: "system-init",
          text_content: `Consulta iniciada para ${activePatient.name}. ID: ${currentConsultationId.substring(0,8)}...`,
          sender: "system",
          timestamp: new Date(),
          type: "system",
        },
        {
          id: "ai-greeting",
          text_content: `Olá Dr. ${user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doutor(a)'}. Carreguei o perfil de ${activePatient.name}. Como posso ajudar?`,
          sender: "ai",
          timestamp: new Date(),
          type: "ai",
        },
      ];
      setMessages(initialSystemMessages);
      fetchPastMessages(currentConsultationId); // Fetch past messages
    } else if (activePatient && !currentConsultationId && user && doctorId && startNewConsultation) {
        const initializeConsultation = async () => {
            if (activePatient?.id && doctorId) {
                toast.info("Tentando iniciar nova consulta...");
                const newConsultationId = await startNewConsultation(activePatient.id, doctorId);
                if (newConsultationId) {
                    // PatientContext will update currentConsultationId, which will re-trigger this effect
                    toast.success("Nova consulta iniciada."); 
                } else {
                    toast.error("Falha ao iniciar nova consulta automaticamente.");
                    setMessages([{
                        id: "error-consult-start",
                        text_content: "Não foi possível iniciar uma nova consulta. Tente selecionar o paciente novamente ou verifique o console.",
                        sender: "system",
                        timestamp: new Date(),
                        type: "error",
                    }]);
                }
            }
        };
        initializeConsultation();
    } else if (!activePatient) {
      setMessages([
        {
          id: "no-patient",
          text_content: "Nenhum paciente selecionado. Por favor, selecione um paciente na lista ao lado para iniciar uma consulta.",
          sender: "system",
          timestamp: new Date(),
          type: "info",
        },
      ]);
    }
  }, [activePatient, currentConsultationId, user?.id, doctorId, startNewConsultation]);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Sessão de autenticação não encontrada. Por favor, faça login novamente.");
      throw new Error("Nenhuma sessão ativa do Supabase.");
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    };
  };

  const saveChatMessage = async (messageToSave: Message) => {
    if (!currentConsultationId) {
      console.warn("Não é possível salvar a mensagem: ID de consulta ativo ausente.", messageToSave);
      return;
    }
    try {
      const messageData: any = {
        consultation_id: currentConsultationId,
        sender: messageToSave.sender === 'user' ? 'user' : messageToSave.sender, // Ensure 'user' for doctor
        message_type: messageToSave.type || (messageToSave.sender === 'user' ? 'user' : messageToSave.sender),
        timestamp: messageToSave.timestamp.toISOString(),
        text_content: messageToSave.text_content,
      };

      if (messageToSave.type === "functionCall" && messageToSave.functionCallInfo) {
        messageData.function_call_info = messageToSave.functionCallInfo;
      } else if (messageToSave.type === "functionResult" && messageToSave.functionResultInfo) {
        messageData.function_result_info = messageToSave.functionResultInfo;
      }
      
      const { error } = await supabase.from("chat_messages").insert(messageData);
      if (error) throw error;
    } catch (error: any) {
      console.error("Erro ao salvar mensagem no DB:", error);
      toast.error(`Falha ao salvar mensagem: ${error.message}`);
    }
  };
  
  const getContextForAI = async (patientId: string) => {
    if (!activePatient) {
      return { 
        details: "Paciente ativo não encontrado.", 
        fullPatientHistoryText: "Nenhum paciente ativo para buscar histórico."
      };
    }
    if (patientId && activePatient.id !== patientId) {
        return { 
        details: "ID do paciente fornecido não corresponde ao paciente ativo.",
        fullPatientHistoryText: "Erro de desalinhamento de ID do paciente."
      };
    }

    return {
      patient_id: activePatient.id,
      name: activePatient.name,
      date_of_birth: activePatient.date_of_birth,
      details: `Informações básicas: Paciente ${activePatient.name}, Data de Nascimento: ${activePatient.date_of_birth}.`,
      fullPatientHistoryText: currentPatientFullHistory || "Nenhum histórico contextual disponível para este paciente."
    };
  };

  const handleSend = async () => {
    if (!input.trim() || !user || !currentLocalSessionId) return;
    if (!activePatient || !currentConsultationId) {
      toast.info("Por favor, selecione um paciente e certifique-se de que uma consulta está ativa.");
        return;
    }

    const currentInput = input;
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newUserMessage: Message = {
      id: userMessageId,
      text_content: currentInput,
      sender: "user", 
      timestamp: new Date(),
      type: "user", 
    };

    setMessages((prev) => [...prev, newUserMessage]);
    await saveChatMessage(newUserMessage);
    setInput("");
    setIsAiTyping(true);
    // setCurrentAiMessageId(null); // Reset AI message tracker - Movido para dentro do try/catch e gerenciado por currentStreamResponseAiMessageId

    let currentStreamResponseAiMessageId: string | null = null; // Variável local para esta instância de handleSend

    try {
      const authHeaders = await getAuthHeaders();
      const patientContextForAI = await getContextForAI(activePatient.id);

      const payload = {
        chat: currentInput, // Mantendo 'chat' para compatibilidade com backend se necessário
        message: currentInput,
        sessionId: currentConsultationId, // Usar ID da consulta como sessionId
        patientContext: patientContextForAI,
        // stream: true, // O endpoint /stream já implica streaming
      };

      // Use STREAM_URL
      const response = await fetch(STREAM_URL, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao buscar resposta da IA." }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true }); // stream: true is fine here as we process per newline
        }

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 1);

          if (line.trim() === "") continue;
          console.log("[STREAM DEBUG] Raw line:", line);
          try {
            const chunk = JSON.parse(line);
            console.log("[STREAM DEBUG] Parsed chunk:", chunk);
            
            // Usar currentStreamResponseAiMessageId para decisões e atualizações dentro deste stream
            if (!currentStreamResponseAiMessageId && (chunk.type === 'text' || chunk.type === 'functionCall')) {
                const newId = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                currentStreamResponseAiMessageId = newId; // Define o ID para este stream response
                setCurrentAiMessageId(newId);           // Atualiza o estado React também
                
                const newAiMessagePlaceholder: Message = {
                    id: newId,
                    text_content: chunk.type === 'text' ? "" : `Preparando para chamar: ${chunk.data?.name || 'função desconhecida'}`,
                    sender: "ai",
                    timestamp: new Date(), 
                    type: chunk.type === 'text' ? "ai" as Message['type'] : "functionCall" as Message['type'],
                    isStreaming: true,
                    isComplete: false,
                    functionCallInfo: chunk.type === 'functionCall' ? chunk.data : undefined,
                };
                console.log("[STREAM DEBUG] Creating placeholder AI message with ID:", newId, "Type:", newAiMessagePlaceholder.type);
                setMessages(prev => [...prev, newAiMessagePlaceholder]);
                
                if (chunk.type === 'text') { 
                     setMessages(prev => prev.map(m => 
                        m.id === currentStreamResponseAiMessageId ? { ...m, text_content: m.text_content + chunk.data } : m
                    ));
                }
            } else if (chunk.type === "text" && currentStreamResponseAiMessageId) {
              console.log("[STREAM DEBUG] Text chunk. currentStreamResponseAiMessageId:", currentStreamResponseAiMessageId, "Chunk data:", chunk.data);
              setMessages(prev => prev.map(m => 
                  m.id === currentStreamResponseAiMessageId ? { ...m, text_content: m.text_content + chunk.data, isStreaming: true } : m
              ));
            } else if (chunk.type === "functionCall" && currentStreamResponseAiMessageId) {
              console.log("[STREAM DEBUG] Subsequent FunctionCall chunk. currentStreamResponseAiMessageId:", currentStreamResponseAiMessageId, "Chunk data:", chunk.data);
              setMessages(prev => prev.map(m => 
                m.id === currentStreamResponseAiMessageId ? { ...m, isStreaming: false, isComplete: true, type: "functionCall" as Message['type'], functionCallInfo: chunk.data, text_content: m.text_content + `\nChamando função: ${chunk.data.name}` } : m
              ));
              currentStreamResponseAiMessageId = null; // Pronto para nova mensagem AI após resultado
              setCurrentAiMessageId(null); 
            } else if (chunk.type === "functionResult" && chunk.data.name) {
                console.log("[STREAM DEBUG] FunctionResult chunk. Data:", chunk.data);
                const functionResultMessage: Message = {
                    id: `func-result-${chunk.data.name}-${Date.now()}`,
                    text_content: `Resultado da função ${chunk.data.name}: ${typeof chunk.data.result === 'string' ? chunk.data.result : JSON.stringify(chunk.data.result)}`,
                    sender: "system",
                    timestamp: new Date(),
                    type: "functionResult" as Message['type'],
                    functionResultInfo: chunk.data,
                };
                setMessages(prev => [...prev, functionResultMessage]);
                currentStreamResponseAiMessageId = null; // Esperando novo stream de texto da IA
                setCurrentAiMessageId(null); 
                setIsAiTyping(true); 
            } else if (chunk.type === "error") {
              console.error("[STREAM DEBUG] Error chunk received:", chunk.data);
              setIsAiTyping(false);
              const errorMessage: Message = {
                id: `error-stream-${Date.now()}`,
                text_content: `Erro no stream da IA: ${chunk.data}`,
                sender: "system",
                timestamp: new Date(),
                type: "error" as Message['type'],
              };
              setMessages(prev => [...prev, errorMessage]);
              if (currentStreamResponseAiMessageId) {
                 setMessages(prev => prev.map(m => m.id === currentStreamResponseAiMessageId ? { ...m, isStreaming: false, isComplete: true } : m));
              }
              currentStreamResponseAiMessageId = null;
              setCurrentAiMessageId(null);
            } else if (chunk.type === "info") { 
                 console.log("[STREAM DEBUG] Info chunk received:", chunk.data);
                 const infoMessage: Message = {
                    id: `info-stream-${Date.now()}`,
                    text_content: chunk.data,
                    sender: "system",
                    timestamp: new Date(),
                    type: "info" as Message['type'],
                };
                setMessages(prev => [...prev, infoMessage]);
            }

          } catch (e) {
            console.error("[STREAM DEBUG] Error parsing JSON line:", line, e);
          }
        }

        if (done) {
          console.log("[STREAM DEBUG] Stream finished by reader.");
          setIsAiTyping(false);
          if (currentStreamResponseAiMessageId) { 
            console.log("[STREAM DEBUG] Marking final AI message as complete:", currentStreamResponseAiMessageId);
            setMessages(prev => prev.map(m => m.id === currentStreamResponseAiMessageId ? { ...m, isStreaming: false, isComplete: true } : m));
          }
          currentStreamResponseAiMessageId = null;
          setCurrentAiMessageId(null);
          
          if (buffer.trim()) {
            console.warn("[STREAM DEBUG] Processing remaining buffer after stream 'done':", buffer);
            // Try to parse and handle, similar to loop logic but less robustly as it's unexpected
            try {
                const chunk = JSON.parse(buffer);
                // Simplified handling for remaining buffer
                 if (currentStreamResponseAiMessageId && chunk.type === "text") {
                     setMessages(prev => prev.map(m => m.id === currentStreamResponseAiMessageId ? { ...m, text_content: m.text_content + chunk.data } : m));
                 } else {
                    console.log("[STREAM DEBUG] Unhandled remaining chunk:", chunk);
                 }
            } catch(e) {
                console.error("[STREAM DEBUG] Error parsing remaining buffer:", e);
            }
            buffer = ""; // Clear buffer
          }
          break;
        }
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem ou processar stream:", error);
      setIsAiTyping(false);
      const errMessage: Message = {
        id: `error-send-${Date.now()}`,
        text_content: error.message || "Falha ao comunicar com a IA.",
        sender: "system",
        timestamp: new Date(),
        type: "error",
      };
      setMessages((prev) => [...prev, errMessage]);
       if (currentStreamResponseAiMessageId) {
            setMessages(prev => prev.map(m => m.id === currentStreamResponseAiMessageId ? { ...m, isStreaming: false, isComplete: true } : m));
            setCurrentAiMessageId(null);
        }
    }
  };
  
  const handleClearChatLocally = async () => {
    if (!confirm("Deseja realmente limpar esta conversa? Qualquer resumo de consulta não salvo para uso futuro poderá ser perdido.")) {
      return;
    }

    const wasConsultationActive = currentConsultationId;
    const activeConsultationIdToClear = currentConsultationId;

    setMessages([]);
    toast.success("Chat limpo (localmente).");

    if (activePatient && wasConsultationActive) {
        setMessages([
            {
              id: "system-init-reclear",
              text_content: `Chat limpo. Consulta com ${activePatient.name} (ID: ${wasConsultationActive.substring(0,8)}) ainda ativa.`,
              sender: "system",
              timestamp: new Date(),
              type: "system",
            },
            {
              id: "ai-greeting-reclear",
              text_content: `Como posso ajudar com o tratamento de ${activePatient.name}?`,
              sender: "ai",
              timestamp: new Date(),
              type: "ai" as Message['type'],
            },
          ]);
    } else if (activePatient) {
         setMessages([{
            id: "no-consult-reclear",
            text_content: `Chat limpo. Nenhuma consulta formalmente iniciada para ${activePatient.name}.`,
            sender: "system",
            timestamp: new Date(),
            type: "info" as Message['type'],
        }]);
    } else {
         setMessages([{
            id: "no-patient-reclear",
            text_content: "Chat limpo. Selecione um paciente.",
            sender: "system",
            timestamp: new Date(),
            type: "info" as Message['type'],
        }]);
    }
    
    // Implementar backend call to CLEAR_SESSION_URL
    if (activeConsultationIdToClear) {
      try {
        console.log(`[ChatActions] Limpando sessão no backend: ${activeConsultationIdToClear}`);
        const authHeaders = await getAuthHeaders(); 
        const response = await fetch(CLEAR_SESSION_URL, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ sessionId: activeConsultationIdToClear }),
        });
        if (response.ok) {
          toast.info("Histórico da sessão no servidor também foi limpo.");
        } else {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `Falha ao limpar histórico no servidor (status ${response.status}).`;
          toast.error(errorMessage);
          console.error("Erro ao limpar sessão no backend:", errorMessage);
        }
      } catch (error: any) {
        console.error("Erro ao limpar sessão no backend:", error);
        toast.error(`Falha ao conectar com servidor para limpar histórico: ${error.message}`);
      }
    }
  };

  const handleFinishConsultationClick = async () => {
    if (!currentConsultationId || !endCurrentConsultation) {
      toast.info("Nenhuma consulta ativa para finalizar.");
      return;
    }
    
    const patientNameAtFinish = activePatient?.name || 'paciente'; // Salvar nome antes que activePatient seja limpo

    await endCurrentConsultation(); // Isso deve limpar currentConsultationId no contexto
    toast.success("Consulta finalizada com sucesso."); // Mensagem mais afirmativa

    // Limpar paciente ativo do contexto após finalizar a consulta
    if (clearActivePatientAndConsultation && typeof clearActivePatientAndConsultation === 'function') {
      console.log("[ChatActions] Limpando paciente ativo e consulta do contexto.");
      clearActivePatientAndConsultation(); 
    } else {
      console.warn("[ChatActions] clearActivePatientAndConsultation não está disponível no PatientContext.");
      // Fallback: Se a função específica não existir, pelo menos limpar as mensagens para o estado inicial
      // No entanto, o ideal é que endCurrentConsultation e clearActivePatientAndConsultation coordenadamente
      // redefinam o estado para "nenhum paciente selecionado".
      // A ausência de currentConsultationId (após endCurrentConsultation) já deve mudar a UI.
    }

    // Atualiza mensagens locais para refletir o fim da consulta e ausência de paciente
    // Esta mensagem será a única se clearActivePatientAndConsultation funcionar e limpar tudo
    // Se não, ela se juntará à mensagem de "nenhuma consulta ativa" que o useEffect principal pode setar.
    setMessages((prevMessages) => [{
            id: "consult-ended-and-cleared",
            text_content: `Consulta com ${patientNameAtFinish} finalizada. Selecione um novo paciente ou inicie uma nova consulta.`,
            sender: "system",
            timestamp: new Date(),
            type: "info" as Message['type']
    }]);
    // Não é mais necessário filtrar prevMessages aqui se clearActivePatientAndConsultation limpa o contexto
    // e o useEffect principal irá redefinir as mensagens para "Nenhum paciente selecionado".
  };


  // --- JSX ---
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] border-r border-border bg-gray-50">
      {/* Chat header */}
      <div className="p-4 border-b border-border bg-white flex items-center justify-between sticky top-[60px] z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-gray-200">
            <AvatarImage src={activePatient?.avatar_url || undefined} alt={activePatient?.name || "P"} />
            <AvatarFallback className="bg-gray-200 text-gray-600 font-medium">
              {activePatient?.name ? activePatient.name.substring(0,2).toUpperCase() : "SN"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">{activePatient ? activePatient.name : "Nenhum Paciente Selecionado"}</h2>
            </div>
            <p className="text-xs text-gray-500">
              {activePatient ? 
                `${activePatient.age || 'Idade N/D'} anos • ${activePatient.primary_condition || 'Condição não especificada'} ${currentConsultationId ? `• Consulta: ${currentConsultationId.substring(0,8)}...` : ''}` 
                : "Selecione um paciente na lista para começar"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
            <LucideClock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            <ClientTime timestamp={new Date()} /> 
          </div>
          <div className="flex gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8" onClick={handleFinishConsultationClick} disabled={!currentConsultationId || !endCurrentConsultation}>
                    <LucideRefreshCw className="h-4 w-4 mr-1" />
                    Finalizar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Finalizar consulta atual</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8" onClick={handleClearChatLocally} disabled={messages.length === 0}>
                    <LucideTrash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Limpar histórico do chat (localmente)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4 bg-gray-50"> {/* Changed background */}
        <div className="space-y-4 max-w-3xl mx-auto pb-4"> {/* Added pb-4 */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} userEmail={user?.email} />
          ))}

          {isAiTyping && (
            <div className="flex justify-start pl-12"> {/* Indent AI typing to align with AI messages */}
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-300"></div>
                  <span className="text-sm text-gray-500">CuraAI está digitando...</span>
                </div>
              </div>
            </div>
          )}
           {(!activePatient || !currentConsultationId) && messages.length > 0 && messages[0].type === 'info' && messages[0].id === 'no-patient' && (
             <div className="flex justify-center my-6">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
                    <LucideInfo className="h-5 w-5" />
                    <span>{messages[0].text_content}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            placeholder={activePatient && currentConsultationId ? `Mensagem para ${activePatient.name || 'paciente selecionado'}...` : "Selecione um paciente para iniciar"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey && !isAiTyping) { e.preventDefault(); handleSend();}}}
            className="flex-1 rounded-lg focus-visible:ring-blue-500"
            disabled={!activePatient || !currentConsultationId || isAiTyping}
          />
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50" disabled={!activePatient || !currentConsultationId || isAiTyping}>
                  <LucideMic className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Entrada de voz (Não implementado)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50" disabled={!activePatient || !currentConsultationId || isAiTyping}>
                  <LucidePaperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Anexar arquivo (Não implementado)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSend}
            disabled={!input.trim() || !activePatient || !currentConsultationId || isAiTyping}
          >
            <LucideSend className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ message, userEmail }: { message: Message, userEmail?: string | null }) {
  
  const renderContent = () => {
    // Prioritize specific type rendering if text_content is also present as a fallback
    if (message.type === "functionCall" && message.functionCallInfo) {
    return (
        <div className="text-gray-700">
          <div className="flex items-center gap-1.5 mb-1 font-medium text-sm">
            <LucideCode2 className="h-4 w-4 text-purple-600" />
            <span>Ação Solicitada: {message.functionCallInfo.name}</span>
          </div>
          {message.text_content && <p className="text-xs italic text-gray-500 mb-1.5">{message.text_content}</p>}
          <pre className="text-xs bg-gray-800 text-gray-200 p-2.5 rounded-md overflow-x-auto mt-1 font-mono">
            {JSON.stringify(message.functionCallInfo.arguments, null, 2)}
          </pre>
      </div>
      );
  }
    if (message.type === "functionResult" && message.functionResultInfo) {
    return (
        <div className="text-gray-700">
          <div className="flex items-center gap-1.5 mb-1 font-medium text-sm">
            <LucideCode2 className="h-4 w-4 text-purple-600" />
            <span>Resultado da Ação: {message.functionResultInfo.name}</span>
          </div>
           {message.text_content && <p className="text-xs italic text-gray-500 mb-1.5">{message.text_content}</p>}
          {message.functionResultInfo.isError ? (
             <pre className="text-xs bg-red-800 text-red-100 p-2.5 rounded-md overflow-x-auto mt-1 font-mono">
                Erro: {typeof message.functionResultInfo.result === 'string' ? message.functionResultInfo.result : JSON.stringify(message.functionResultInfo.result, null, 2)}
            </pre>
          ) : (
            <pre className="text-xs bg-gray-800 text-gray-200 p-2.5 rounded-md overflow-x-auto mt-1 font-mono">
                {typeof message.functionResultInfo.result === 'string' ? message.functionResultInfo.result : JSON.stringify(message.functionResultInfo.result, null, 2)}
            </pre>
          )}
        </div>
      );
  }
  if (message.type === "recommendation") {
    return (
        <>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="bg-green-600 h-5 w-5 rounded-full flex items-center justify-center shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-700">Recomendação de Tratamento</p>
            {message.metadata?.confidence && (
              <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded-md text-green-800 font-medium">
                {Math.round(message.metadata.confidence * 100)}% Confiança
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.text_content}</p>
          <div className="flex justify-start items-center mt-3 gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white border-gray-300 hover:bg-gray-50 text-gray-700" onClick={() => {navigator.clipboard.writeText(message.text_content); toast.success("Recomendação copiada!");}}>
                <LucideClipboard className="h-3.5 w-3.5 mr-1" /> Copiar
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white border-gray-300 hover:bg-gray-50 text-gray-700" onClick={() => toast.info("Salvar nas notas ainda não implementado.")}>
                <LucideFileText className="h-3.5 w-3.5 mr-1" /> Salvar nas Notas
              </Button>
              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => toast.info("Usar recomendação ainda não implementado.")}>
                <LucideArrowRight className="h-3.5 w-3.5 mr-1" /> Aplicar
              </Button>
          </div>
        </>
      );
  }
  if (message.type === "citation") {
    return (
          <>
            <div className="flex items-start gap-2.5">
              <div className="min-w-5 pt-0.5 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-600">
                  <path d="M7 16.8V9.2C7 8.54 7.54 8 8.2 8H13.8C14.46 8 15 8.54 15 9.2V14.8C15 15.46 14.46 16 13.8 16H8.2C7.54 16 7 15.46 7 14.8V16.8Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 8V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 8V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M9 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 14H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1">
                <p className="text-sm italic text-gray-700 whitespace-pre-wrap">{message.text_content}</p>
                {message.metadata?.sources && message.metadata.sources.length > 0 && (
                  <div className="mt-1.5 text-xs text-cyan-700 font-medium">Fonte(s): {message.metadata.sources.join(", ")}</div>
                )}
              </div>
            </div>
          </>
        );
    }
    // Default: render text_content, ensuring line breaks are respected
    return <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.text_content}</p>;
  };
  
  const bubbleStyles = () => {
    let base = "rounded-xl px-3.5 py-2.5 max-w-[85%] shadow-sm "; 
    if (message.sender === "user") {
      return base + "bg-blue-600 text-white rounded-tr-none";
    } else if (message.sender === "ai") {
      if (message.type === "error") return base + "bg-red-50 border text-red-700 border-red-300 rounded-tl-none";
      if (message.type === "functionCall") return base + "bg-purple-50 border border-purple-200 text-gray-800 rounded-tl-none";
      if (message.type === "functionResult") return base + "bg-purple-50 border border-purple-200 text-gray-800 rounded-tl-none";
      if (message.type === "recommendation") return "px-3.5 py-2.5 max-w-[85%] border-l-4 border-green-500 bg-green-50 shadow-md rounded-xl text-gray-800";
      if (message.type === "citation") return "bg-cyan-50 border border-cyan-200 rounded-xl rounded-tl-none px-3.5 py-2.5 max-w-[85%] text-gray-800";
      return base + "bg-white border border-gray-200 text-gray-800 rounded-tl-none";
    } else { // system messages
      const systemBase = "text-xs px-3.5 py-1.5 rounded-full text-center mx-auto my-3 flex items-center gap-2 shadow-sm ";
      if (message.type === "error") return systemBase + "bg-red-100 text-red-700 border border-red-200";
      return systemBase + "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  if (message.sender === "system") {
    return (
      <div className="flex justify-center">
        <div className={bubbleStyles()}>
          {message.type === "error" ? <LucideAlertCircle className="h-4 w-4 shrink-0" /> : <LucideInfo className="h-4 w-4 shrink-0" />}
          <span className="text-xs">{message.text_content}</span>
        </div>
      </div>
    );
  }

  const isUser = message.sender === "user";
  const alignment = isUser ? "justify-end" : "justify-start";

  return (
    <div className={`flex ${alignment} items-end gap-2`}> {/* Removed mb-3, handled by space-y on parent */}
      {!isUser && ( // AI Avatar
        <Avatar className="h-7 w-7 border bg-blue-600 text-white self-start shrink-0">
          <AvatarFallback className="font-medium text-xs">AI</AvatarFallback>
        </Avatar>
      )}
      <div className={bubbleStyles()}>
        {renderContent()}
        <div className={`text-right mt-1.5 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          <span className="text-[10px] leading-none">
            <ClientTime timestamp={message.timestamp} />
          </span>
        </div>
      </div>
      {isUser && ( // User Avatar
        <Avatar className="h-7 w-7 border bg-gray-300 text-gray-700 self-start shrink-0">
          <AvatarFallback className="font-medium text-xs">
            {userEmail ? userEmail.substring(0,2).toUpperCase() : "ME"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "--:--"; 
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface ClientTimeProps {
  timestamp: Date;
}

function ClientTime({ timestamp }: ClientTimeProps) {
  const [timeString, setTimeString] = useState<string>("--:--");

  useEffect(() => {
    setTimeString(formatTime(timestamp)); 
  }, [timestamp]);

  return <>{timeString}</>;
}

