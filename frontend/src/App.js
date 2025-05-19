// App.js - Arquivo principal com integração ao sistema de memória do backend

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import { theme, GlobalStyle } from './theme'; //
import { Header } from './components/Header'; //
import { ChatContainer } from './components/ChatContainer'; //
import { InputContainer } from './components/InputContainer'; //
// import { Footer } from './components/Footer'; //
import { ThinkingIndicator } from './components/ThinkingIndicator'; //
import { Message } from './components/Message'; //
// Importa ChatToolbar, ChatContent, ActionButton, ToggleSwitch, ToggleLabel, ModeIndicator de ChatSection
import {
  ChatContent,
  ActionButton,
  ToggleSwitch,
  ModeIndicator,
  Toolbar,
  ToolbarControls,
} from './ChatSection'; //
import { PrescriptionModal } from './PrescriptionModal'; //
import { SettingsModal } from './components/SettingsModal'; // Corrected path
import { PatientContextBar } from './components/PatientContextBar'; // Import new component
import { AddPatientModal } from './components/AddPatientModal'; // Import AddPatientModal
import { SelectPatientModal } from './components/SelectPatientModal'; // Import SelectPatientModal
import { ConsultationNotesPanel } from './components/ConsultationNotesPanel'; // Import ConsultationNotesPanel
import { 
  generateConsultationSpecificSummary, 
  getContextForAI 
} from './patientContextService'; // Import context functions
import { v4 as uuidv4 } from 'uuid'; //
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, AuthProvider } from './AuthContext';
import { supabase } from './supabaseClient'; // Importar supabase aqui para getAuthHeaders

// Seus componentes de página
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';

// Estilos para o layout (pode mover para um arquivo CSS ou App.css)
const AppContainer = styled.div`
  font-family: 'Arial', sans-serif;
`;

const ContentContainer = styled.div`
  padding: 20px;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
`;

// Componente para Rotas Protegidas
const ProtectedRoute = () => {
    const { user, loadingAuthState } = useAuth();

    if (loadingAuthState) {
        return <LoadingMessage>Carregando autenticação...</LoadingMessage>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Layout com navegação
const AppLayout = () => {
    const { user, loadingAuthState, logout } = useAuth();

    if (loadingAuthState) {
        return <LoadingMessage>Carregando...</LoadingMessage>;
    }

    return (
        <AppContainer>
            <ContentContainer>
                <Outlet />
            </ContentContainer>
        </AppContainer>
    );
};

// --- Styled Components ---
const MainContainer = styled.main`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden; // Prevent full page scroll when notes panel is open
`; //

// Estilo para o layout principal que pode incluir o histórico e o chat lado a lado ou empilhados
// Renamed MainChatArea to MainContentLayout and adjusted flex properties
const MainContentLayout = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  overflow: hidden; 
  height: calc(100vh - 50px - 70px); // Adjust 50px for Header, 70px for PatientContextBar+AppToolbar approx
`;

const ChatAreaColumn = styled.div`
  flex: ${(props) => (props.$isNotesPanelOpen ? 2 : 3)}; // Takes more space if notes are closed
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  transition: flex 0.3s ease-in-out;
`;

const NotesPanelColumn = styled.div`
  flex: 1.2; // Adjust flex ratio as needed for notes panel width
  min-width: 350px; // Minimum width for the notes panel
  max-width: 45%;   // Maximum width for the notes panel
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid ${(props) => props.theme.colors.border};
  background-color: ${(props) => props.theme.colors.backgroundSlightlyDarker || props.theme.colors.background};
  transition: min-width 0.3s ease-in-out, max-width 0.3s ease-in-out, flex 0.3s ease-in-out;
`;

// ClearButton continua usando ActionButton como base
const ClearButton = styled(ActionButton)`
  background-color: ${(props) => props.theme.colors.secondary || '#60a5fa'};
  margin-left: 10px;

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.colors.secondaryDark || '#3b82f6'};
    transform: none;
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// --- ChatPageContent Component (Antigo App) ---
function ChatPageContent() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: 'Olá! Eu sou o CuraAI, seu assistente de saúde. Como posso ajudar você hoje?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'info',
      isComplete: true,
    }, 
  ]);
  const [inputValue, setInputValue] = useState(''); 
  const [isThinking, setIsThinking] = useState(false); 
  const [isStreamingMode, setIsStreamingMode] = useState(true); 
  const [sessionId, setSessionId] = useState(() => {
    const savedSessionId = localStorage.getItem('curaAISessionId'); 
    if (savedSessionId) return savedSessionId; 
    const newSessionId = uuidv4(); 
    localStorage.setItem('curaAISessionId', newSessionId); 
    return newSessionId; 
  });

  const [prescriptionData, setPrescriptionData] = useState({
    patientName: '',
    patientAddress: '',
    patientDOB: '',
    patientAge: '', 
    patientRG: '',
    productInfo: '', 
    usageType: 'USO ORAL', 
    isContinuousUse: false, 
    dosageInstruction: '', 
    justification: '', 
    emissionDate: new Date().toLocaleDateString('pt-BR'), 
  });
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false); 

  const { user } = useAuth(); // Obter usuário autenticado
  // O doctorSettings agora virá do DoctorProfilePage ou de um estado global/contexto de perfil
  // Por enquanto, vamos deixar como estava, mas isso precisará ser integrado com os dados do Supabase
  const [doctorSettings, setDoctorSettings] = useState(() => {
    const savedSettings = localStorage.getItem('curaAIDoctorSettings'); 
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          doctorName: '',
          crm: '',
          phone: '',
          address: '',
          logo: '', 
        };
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 

  // New state for Patient-First Workflow
  const [activePatient, setActivePatient] = useState(null);
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

  // New state for consultation tracking and notes panel
  const [currentConsultationId, setCurrentConsultationId] = useState(null);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);

  const messagesEndRef = useRef(null); 
  const inputRef = useRef(null); 

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'; 
  const CHAT_URL = `${API_BASE_URL}/chat`; 
  const STREAM_URL = `${API_BASE_URL}/stream`; 
  const CLEAR_SESSION_URL = `${API_BASE_URL}/clear-session`;

  // Para enviar o token JWT com as requisições para o backend
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.warn("Nenhuma sessão ativa do Supabase para requisição ao backend.");
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
  };


  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); 
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }); 
        }, 300); 
      }
    }, 100); 
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  }; 
  const validationCheck = useCallback((str) => str === null || str.match(/^\\s*$/) !== null, []); 
  const toggleStreamingMode = useCallback(() => {
    setIsStreamingMode((prev) => !prev);
  }, []); 

  const handlePrescriptionChange = useCallback((event) => {
    const { name, value, type, checked } = event.target; 
    setPrescriptionData((prevData) => ({
      ...prevData, 
      [name]: type === 'checkbox' ? checked : value, 
    }));
  }, []);

  const openPrescriptionModal = useCallback(() => {
    setIsPrescriptionModalOpen(true);
  }, []); 
  const closePrescriptionModal = useCallback(() => {
    setIsPrescriptionModalOpen(false);
  }, []); 
  const openSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
  }, []); 
  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  // Callbacks for new patient modals
  const openSelectPatientModal = useCallback(() => setIsSelectPatientModalOpen(true), []);
  const closeSelectPatientModal = useCallback(() => setIsSelectPatientModalOpen(false), []);
  const openAddPatientModal = useCallback(() => setIsAddPatientModalOpen(true), []);
  const closeAddPatientModal = useCallback(() => setIsAddPatientModalOpen(false), []);

  const toggleNotesPanel = useCallback(() => {
    setIsNotesPanelOpen(prev => !prev);
  }, []);

  // Function to save a chat message to the database
  const saveChatMessage = async (consultationId, sender, type, content) => {
    if (!consultationId) {
      console.warn("Cannot save chat message: No active consultation ID.");
      return;
    }
    try {
      let messageData = {
        consultation_id: consultationId,
        sender: sender,
        message_type: type,
      };
      if (type === 'text' || type === 'error' || type === 'info') {
        messageData.text_content = content.text;
      } else if (type === 'functionCall') {
        messageData.function_call_info = content.functionCallInfo;
        messageData.text_content = content.text; // Also save the textual representation
      } else if (type === 'functionResult') {
        messageData.function_result_info = content.functionResultInfo;
        messageData.text_content = content.text; // Also save the textual representation
      }

      const { error } = await supabase.from('chat_messages').insert(messageData);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving chat message to DB:', error);
      // Optionally, notify user or retry
    }
  };

  // Function to start a new consultation
  const startNewConsultation = useCallback(async (patientId, doctorId) => {
    if (!patientId || !doctorId) {
      console.error("Patient ID or Doctor ID is missing, cannot start consultation.");
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert({ patient_id: patientId, doctor_id: doctorId })
        .select('id')
        .single();
      if (error) throw error;
      if (data && data.id) {
        setCurrentConsultationId(data.id);
        console.log("New consultation started with ID:", data.id);
        return data.id;
      } else {
        throw new Error("Failed to retrieve new consultation ID.");
      }
    } catch (error) {
      console.error('Error starting new consultation:', error);
      // TODO: Notify user (e.g., using a toast message)
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, text: `Erro ao iniciar nova consulta: ${error.message}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }]);
      return null;
    }
  }, []);

  const handlePatientSelected = useCallback(async (patient) => {
    setActivePatient(patient);
    closeSelectPatientModal();
    closeAddPatientModal(); 
    setIsNotesPanelOpen(true); // Open notes panel by default when a patient is selected

    if (user?.id && patient?.id) {
      const newConsultationId = await startNewConsultation(patient.id, user.id);
      if (newConsultationId) {
        setMessages([
          {
            id: 'welcome-patient',
            text_content: `Consulta iniciada para o paciente: ${patient.name}. Como posso ajudar?`,
            sender: 'ai', 
            timestamp: new Date(),
            type: 'info',
            isComplete: true,
          },
        ]);
      } else {
         setMessages([
          {
            id: 'error-consultation-start',
            text_content: `Não foi possível iniciar a consulta para ${patient.name}. Por favor, tente novamente.`,
            sender: 'ai', 
            timestamp: new Date(),
            type: 'error',
            isComplete: true,
          },
        ]);
      }
    } else {
      console.warn("User or Patient ID missing, cannot start consultation automatically.");
       setMessages([
          {
            id: 'error-user-patient-id',
            text_content: `Informações do usuário ou paciente ausentes. Não é possível iniciar a consulta.`,
            sender: 'ai', 
            timestamp: new Date(),
            type: 'error',
            isComplete: true,
          },
        ]);
    }
    console.log("Active patient set:", patient);
  }, [user?.id, startNewConsultation, closeSelectPatientModal, closeAddPatientModal]);
  
  // Handles the formal end of a consultation, triggering summaries
  const handleEndConsultation = useCallback(async () => {
    if (!currentConsultationId || !activePatient) {
      console.warn("No active consultation or patient to end.");
      return;
    }
    const patientName = activePatient.name; // Store name before patient is cleared

    setIsThinking(true);
    try {
      // 1. Generate and save consultation-specific summary
      console.log('[App.js handleEndConsultation] Attempting to generate consultation-specific summary...');
      const specificSummary = await generateConsultationSpecificSummary(currentConsultationId, messages.filter(m => m.id !== 'welcome' && m.id !== 'welcome-patient' && m.id !== 'welcome-after-consult'));
      if (specificSummary) {
        console.log('[App.js handleEndConsultation] Consultation-specific summary generated successfully.');
      } else {
        console.warn('[App.js handleEndConsultation] Consultation-specific summary generation returned null or failed.');
      }

      // The overall patient context update (patients.ai_context_summary) is no longer needed with the new approach.
      // The getContextForAI function now compiles all necessary history on demand.

      console.log(`Consultation ${currentConsultationId} with ${patientName} ended. Specific summary (if any) saved.`);
      
      // Clear chat and reset patient state
      setActivePatient(null);
      setCurrentConsultationId(null);
      setIsNotesPanelOpen(false); 

      setMessages([
        {
          id: 'welcome-after-consult',
          text_content: `Atendimento com ${patientName} finalizado. Selecione ou adicione um novo paciente.`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'info',
          isComplete: true,
        }
      ]);

    } catch (error) {
      console.error('Error during end consultation process:', error);
      setMessages(prev => [...prev, {
        id: `error-end-consult-${Date.now()}`,
        text_content: `Erro ao finalizar consulta com ${patientName}: ${error.message}`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'error',
        isComplete: true,
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [currentConsultationId, activePatient, messages, sessionId, user]); // Added sessionId and user back if they are used by getAuthHeaders indirectly or other logic

  const handleDeselectPatient = useCallback(async () => {
    const patientName = activePatient ? activePatient.name : 'paciente atual';
    
    // If a consultation is active, consider formally ending it
    // For a simple deselect, we might not want full summary generation.
    // Let's just ensure the end_time is set if a consultationId exists.
    if (currentConsultationId) {
      try {
        setIsThinking(true);
        // Attempt to end the current consultation, but don't trigger AI summaries for a simple deselect
        await generateConsultationSpecificSummary(currentConsultationId, messages.filter(m => m.id !== 'welcome' && m.id !== 'welcome-patient'));
        
        const { error } = await supabase
          .from('consultations')
          .update({ end_time: new Date().toISOString() })
          .eq('id', currentConsultationId);
        if (error) console.error("Error marking consultation end_time on deselect:", error);
        console.log(`Consultation ${currentConsultationId} ended due to patient deselect.`);
      } catch(e) {
        console.error("Error during deselect finalization:", e);
      } finally {
        setIsThinking(false);
      }
    }

    setActivePatient(null);
    setCurrentConsultationId(null);
    setIsNotesPanelOpen(false); // Close notes panel
    setMessages([
      {
        id: 'welcome',
        text_content: `Atendimento com ${patientName} encerrado. Selecione ou adicione um novo paciente.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'info',
        isComplete: true,
      },
    ]);
    console.log("Active patient deselected.");
  }, [activePatient, currentConsultationId, messages]); 

  const clearConversation = useCallback(async () => {
    setIsThinking(true); 
    try {
      const currentSessionId = user ? user.id : sessionId; // Usa user.id se disponível (associado ao médico)
      const headers = await getAuthHeaders();
      const response = await fetch(CLEAR_SESSION_URL, {
        method: 'POST', 
        headers: headers, 
        body: JSON.stringify({ sessionId: currentSessionId }), 
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); 
      setMessages([]);
      console.log(`Sessão ${currentSessionId} limpa.`); 
    } catch (error) {
      console.error('Erro ao limpar conversa:', error); 
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text_content: `Erro ao limpar conversa no servidor: ${error.message}`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'error',
          isComplete: true,
        },
      ]); 
    } finally {
      setIsThinking(false); 
    }
  }, [user, sessionId, CLEAR_SESSION_URL]); 

  useEffect(() => {
    if (messages.length === 0) return; 
    const lastMessage = messages[messages.length - 1]; 
    if (
      lastMessage?.type === 'functionResult' && 
      lastMessage.functionResultInfo?.name === 'fill_prescription' && 
      lastMessage.functionResultInfo?.result?.success === true && 
      lastMessage.functionResultInfo?.result?.filledData 
    ) {
      const resultData = lastMessage.functionResultInfo.result.filledData; 
      // Ensure prescription data corresponds to the active patient if one is set
      if (activePatient) {
        setPrescriptionData((prevData) => ({
          ...prevData,
          patientName: activePatient.name || prevData.patientName,
          patientAddress: activePatient.address || prevData.patientAddress,
          patientDOB: activePatient.date_of_birth || prevData.patientDOB,
          patientRG: activePatient.rg || prevData.patientRG,
          // patientAge can be recalculated or fetched if DOB changes
          productInfo: resultData.productDetails || prevData.productInfo, 
          dosageInstruction: resultData.dosageInstruction || prevData.dosageInstruction, 
          justification: resultData.justification || '', 
          usageType: resultData.usageType || 'USO ORAL', 
          emissionDate: new Date().toLocaleDateString('pt-BR'), 
          ...('isContinuousUse' in resultData
            ? { isContinuousUse: resultData.isContinuousUse }
            : {}),
        }));
      } else {
         setPrescriptionData((prevData) => ({
          ...prevData, 
          productInfo: resultData.productDetails || prevData.productInfo, 
          dosageInstruction: resultData.dosageInstruction || prevData.dosageInstruction, 
          justification: resultData.justification || '', 
          usageType: resultData.usageType || 'USO ORAL', 
          emissionDate: new Date().toLocaleDateString('pt-BR'), 
          ...('isContinuousUse' in resultData
            ? { isContinuousUse: resultData.isContinuousUse }
            : {}),
        }));
      }
      setIsPrescriptionModalOpen(true); 
    }
  }, [messages, activePatient]); // Added activePatient dependency

  const handleNonStreamingChat = useCallback(async () => {
    const messageToSend = inputValue; 
    const userMessage = {
      id: `user-${Date.now()}`,
      text_content: messageToSend, // field name changed
      sender: 'user',
      timestamp: new Date(),
      type: 'user',
      isComplete: true,
    }; 
    flushSync(() => {
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsThinking(true);
    }); 
    // Save user message to DB
    if (currentConsultationId) {
      await saveChatMessage(currentConsultationId, 'user', 'user', { text: messageToSend });
    }
    try {
      const headers = await getAuthHeaders();
      const currentSessionId = user ? user.id : sessionId; // Keep this for backend session if needed
      let patientAiContext = null;
      if (activePatient?.id) {
        patientAiContext = await getContextForAI(activePatient.id);
        console.log('[DEBUG Frontend App.js] Contexto para IA recuperado (non-streaming):', JSON.stringify(patientAiContext, null, 2));
      }
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          chat: messageToSend, 
          sessionId: currentSessionId, // Keep for now, backend might still use it
          consultationId: currentConsultationId,
          patientContext: patientAiContext 
        }),
      }); 
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      } 
      const result = await response.json(); // Assuming backend returns { text: "..." } for non-streaming
      const aiMessage = {
        id: `ai-${Date.now()}`,
        text_content: result.text, // field name changed
        sender: 'ai',
        timestamp: new Date(),
        type: 'ai',
        isComplete: true,
      }; 
      flushSync(() => {
        setMessages((prev) => [...prev, aiMessage]);
        setIsThinking(false);
      }); 
      // Save AI message to DB
      if (currentConsultationId) {
        await saveChatMessage(currentConsultationId, 'ai', 'ai', { text: result.text });
      }
    } catch (error) {
      console.error('Error in non-streaming chat:', error); 
      const errorMessage = {
        id: `error-${Date.now()}`,
        text_content: `Erro: ${error.message || 'Ocorreu um erro'}`, // field name changed
        sender: 'ai',
        timestamp: new Date(),
        type: 'error',
        isComplete: true,
      }; 
      flushSync(() => {
        setMessages((prev) => [...prev, errorMessage]);
        setIsThinking(false);
      }); 
      if (currentConsultationId) {
        await saveChatMessage(currentConsultationId, 'ai', 'error', { text: errorMessage.text_content });
      }
    }
  }, [inputValue, user, sessionId, CHAT_URL, currentConsultationId, activePatient?.id]); 

  const handleStreamingChat = useCallback(async () => {
    const messageToSend = inputValue; 
    const userMessage = {
      id: `user-${Date.now()}`,
      text_content: messageToSend, // field name changed
      sender: 'user',
      timestamp: new Date(),
      type: 'user',
      isComplete: true,
    };
    flushSync(() => {
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsThinking(true);
    });
    // Save user message to DB
    if (currentConsultationId) {
      await saveChatMessage(currentConsultationId, 'user', 'user', { text: messageToSend });
    }
    
    let currentStreamingId = null; 
    let errorData = null; 
    let accumulatedAiText = ''; // To save the full AI response at the end

    try {
      const headers = await getAuthHeaders();
      const currentSessionId = user ? user.id : sessionId; // Keep this for backend session if needed
      let patientAiContext = null;
      if (activePatient?.id) {
        patientAiContext = await getContextForAI(activePatient.id);
        console.log('[DEBUG Frontend App.js] Contexto para IA recuperado (streaming):', JSON.stringify(patientAiContext, null, 2));
      }
      const response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          chat: messageToSend, 
          sessionId: currentSessionId, // Keep for now
          consultationId: currentConsultationId,
          patientContext: patientAiContext
        }),
      }); 
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      } 
      if (!response.body) {
        throw new Error('Response body is missing!');
      } 
      const reader = response.body.getReader(); 
      const decoder = new TextDecoder(); 
      let buffer = ''; 
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read(); 
        if (done) {
          console.log('Stream finished.');
          break;
        } 
        buffer += decoder.decode(value, { stream: true }); 
        const lines = buffer.split('\n'); 
        buffer = lines.pop() || ''; 
        for (const line of lines) {
          if (line.trim() === '') continue; 
          try {
            const parsed = JSON.parse(line); 
            console.log('Received:', parsed); 
            // eslint-disable-next-line no-loop-func
            flushSync(() => {
              setIsThinking(false); 
              if (parsed.type === 'text') {
                accumulatedAiText += parsed.data; // Accumulate text
                setMessages((prevMessages) => {
                  const lastMessage = prevMessages[prevMessages.length - 1]; 
                  if (
                    lastMessage &&
                    lastMessage.id === currentStreamingId &&
                    lastMessage.type === 'ai_streaming'
                  ) {
                    return prevMessages.map((msg) =>
                      msg.id === currentStreamingId
                        ? { ...msg, text_content: msg.text_content + parsed.data, timestamp: new Date() } // field name changed
                        : msg
                    ); 
                  } else {
                    const updatedMessages = prevMessages.map(
                      (msg) =>
                        msg.id === currentStreamingId && msg.type === 'ai_streaming'
                          ? { ...msg, isStreaming: false, isComplete: true }
                          : msg 
                    );
                    const newStreamingMsg = {
                      id: `ai-stream-${Date.now()}`,
                      text_content: parsed.data, // field name changed
                      sender: 'ai',
                      timestamp: new Date(),
                      type: 'ai_streaming',
                      isStreaming: true,
                      isComplete: false,
                    }; 
                    currentStreamingId = newStreamingMsg.id; 
                    return [...updatedMessages, newStreamingMsg]; 
                  }
                });
              } else if (parsed.type === 'functionCall') {
                accumulatedAiText = ''; // Reset accumulator for new message segment
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === currentStreamingId && msg.type === 'ai_streaming'
                      ? { ...msg, isStreaming: false, isComplete: true }
                      : msg
                  )
                ); 
                currentStreamingId = null; 
                const iteration = parsed.data.iteration || 1; 
                const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : ''; 
                const functionCallMessage = {
                  id: `fc-${Date.now()}-${iteration}`,
                  type: 'functionCall',
                  sender: 'ai',
                  timestamp: new Date(),
                  functionCallInfo: parsed.data,
                  iteration: iteration,
                  text_content: `🛠️ ${iterationPrefix}Chamando Função: ${parsed.data.name}\n${JSON.stringify(parsed.data.args, null, 2)}`, // field name changed
                }; 
                setMessages((prev) => [...prev, functionCallMessage]); 
                if (currentConsultationId) { // Save function call message to DB
                  saveChatMessage(currentConsultationId, 'ai', 'functionCall', functionCallMessage);
                }
              } else if (parsed.type === 'functionResult') {
                accumulatedAiText = ''; // Reset accumulator
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === currentStreamingId && msg.type === 'ai_streaming'
                      ? { ...msg, isStreaming: false, isComplete: true }
                      : msg
                  )
                ); 
                currentStreamingId = null; 
                const iteration = parsed.data.iteration || 1; 
                const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : ''; 
                const functionResultMessage = {
                  id: `fr-${Date.now()}-${iteration}`,
                  type: 'functionResult',
                  sender: 'ai',
                  timestamp: new Date(),
                  functionResultInfo: parsed.data,
                  iteration: iteration,
                  text_content: `✅ ${iterationPrefix}Resultado (${parsed.data.name}):\n${JSON.stringify(parsed.data.result, null, 2)}`, // field name changed
                }; 
                setMessages((prev) => [...prev, functionResultMessage]); 
                if (currentConsultationId) { // Save function result message to DB
                  saveChatMessage(currentConsultationId, 'ai', 'functionResult', functionResultMessage);
                }
              } else if (parsed.type === 'info') {
                accumulatedAiText = ''; // Reset accumulator
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === currentStreamingId && msg.type === 'ai_streaming'
                      ? { ...msg, isStreaming: false, isComplete: true }
                      : msg
                  )
                ); 
                currentStreamingId = null; 
                const infoMessage = {
                  id: `info-${Date.now()}`,
                  text_content: `ℹ️ ${parsed.data}`, // field name changed
                  sender: 'ai',
                  timestamp: new Date(),
                  type: 'info',
                  isComplete: true,
                }; 
                setMessages((prev) => [...prev, infoMessage]); 
                if (currentConsultationId) { // Save info message to DB
                  saveChatMessage(currentConsultationId, 'ai', 'info', { text: infoMessage.text_content });
                }
              } else if (parsed.type === 'error') {
                console.error('Stream error from backend:', parsed.data); 
                errorData = parsed.data; 
                accumulatedAiText = ''; // Reset accumulator
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === currentStreamingId && msg.type === 'ai_streaming'
                      ? { ...msg, isStreaming: false, isComplete: true }
                      : msg
                  )
                ); 
                currentStreamingId = null; 
                const errorMsg = {
                  id: `error-${Date.now()}`,
                  text_content: `Erro: ${errorData}`, // field name changed
                  sender: 'ai',
                  timestamp: new Date(),
                  type: 'error',
                  isComplete: true,
                }; 
                setMessages((prev) => [...prev, errorMsg]); 
                if (currentConsultationId) { // Save error message to DB
                  saveChatMessage(currentConsultationId, 'ai', 'error', { text: errorMsg.text_content });
                }
              }
            }); 
          } catch (e) {
            console.error('Failed to parse JSON line:', line, e); 
            errorData = 'Erro ao processar dados recebidos.'; 
            // eslint-disable-next-line no-loop-func
            flushSync(() => {
              setIsThinking(false);
              const errorMsg = {
                id: `error-${Date.now()}`,
                text_content: `Erro: ${errorData}`, // field name changed
                sender: 'ai',
                timestamp: new Date(),
                type: 'error',
                isComplete: true,
              };
              setMessages((prev) => [...prev, errorMsg]);
            }); 
          }
        } 
      } 
      flushSync(() => {
        if (!errorData) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1]; 
            if (
              lastMessage &&
              lastMessage.id === currentStreamingId &&
              lastMessage.type === 'ai_streaming'
            ) {
              return prevMessages.map((msg) =>
                msg.id === currentStreamingId
                  ? { ...msg, type: 'ai', isStreaming: false, isComplete: true }
                  : msg
              ); 
            }
            return prevMessages; 
          });
        }
        setIsThinking(false); 
      });
      // Save the complete AI message (text parts) after streaming is done and flushSync is complete
      if (currentConsultationId && accumulatedAiText.trim() !== '' && !errorData) {
        await saveChatMessage(currentConsultationId, 'ai', 'ai', { text: accumulatedAiText });
      }

    } catch (error) {
      console.error('Error in streaming chat fetch:', error); 
      const errorMsg = {
        id: `error-${Date.now()}`,
        text_content: `Erro: ${error.message || 'Ocorreu um erro na comunicação'}`, // field name changed
        sender: 'ai',
        timestamp: new Date(),
        type: 'error',
        isComplete: true,
      }; 
      flushSync(() => {
        setMessages((prev) => [...prev, errorMsg]);
        setIsThinking(false);
      }); 
      if (currentConsultationId) {
        await saveChatMessage(currentConsultationId, 'ai', 'error', { text: errorMsg.text_content });
      }
    }
  }, [inputValue, user, sessionId, STREAM_URL, currentConsultationId, activePatient?.id]); 

  const handleClick = useCallback(() => {
    if (validationCheck(inputValue)) return; 
    if (isStreamingMode) {
      handleStreamingChat(); 
    } else {
      handleNonStreamingChat(); 
    }
  }, [inputValue, isStreamingMode, validationCheck, handleNonStreamingChat, handleStreamingChat]); 

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        handleClick(); 
      }
    },
    [handleClick]
  ); 

  useEffect(() => {
    scrollToBottom(); 
  }, [messages, scrollToBottom]); 

  // --- Toolbar Component ---
  const AppToolbar = () => (
    <Toolbar>
      <ToolbarControls>
        <ActionButton 
          onClick={openPrescriptionModal} 
          disabled={isThinking || !activePatient} // Disable if no active patient
          title={!activePatient ? "Selecione um paciente primeiro" : "Abrir Receituário"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5" />
          </svg>
          Abrir Receituário
        </ActionButton>
        <ActionButton
          onClick={openSettingsModal}
          style={{ backgroundColor: theme.colors.buttonNeutralBg }}
          disabled={isThinking}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Configurações
        </ActionButton>
        <ClearButton onClick={clearConversation} disabled={isThinking || messages.length <= 1}>
          Limpar Conversa
        </ClearButton>
      </ToolbarControls>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ModeIndicator $active={!isStreamingMode}>Normal</ModeIndicator>
        <ToggleSwitch>
          <input type="checkbox" checked={isStreamingMode} onChange={toggleStreamingMode} /> 
          <span /> 
        </ToggleSwitch> 
        <ModeIndicator $active={isStreamingMode}>Streaming</ModeIndicator> 
      </div> 
    </Toolbar> 
  );

  return (
    <> 
      <GlobalStyle /> 
      <MainContainer>
        <Header /> 
        <PatientContextBar 
          activePatient={activePatient}
          onSelectPatient={openSelectPatientModal}
          onAddPatient={openAddPatientModal}
          onChangePatient={openSelectPatientModal} 
          onDeselectPatient={handleDeselectPatient} // Pass the new callback
          onEndConsultation={handleEndConsultation} // New prop
          onToggleNotes={toggleNotesPanel}      // New prop
          isNotesPanelOpen={isNotesPanelOpen}   // New prop
        />
        <AppToolbar /> 
        <MainContentLayout>
          <ChatAreaColumn $isNotesPanelOpen={isNotesPanelOpen}>
            <ChatContainer>
              <ChatContent 
                messages={messages} 
                isThinking={isThinking} 
                messagesEndRef={messagesEndRef} 
                Message={Message} // Make sure Message component can handle text_content
                ThinkingIndicator={ThinkingIndicator} 
              />
            </ChatContainer> 
            <InputContainer 
              value={inputValue} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown} 
              onSend={handleClick} 
              disabled={isThinking || !activePatient} 
              ref={inputRef} 
              placeholder={!activePatient ? "Selecione ou adicione um paciente para iniciar..." : "Digite sua mensagem..."}
            />
          </ChatAreaColumn>
          {isNotesPanelOpen && activePatient && (
            <NotesPanelColumn>
              <ConsultationNotesPanel 
                activePatient={activePatient} 
                doctorId={user?.id} // Pass doctorId from authenticated user
              />
            </NotesPanelColumn>
          )}
        </MainContentLayout>
        {activePatient && ( 
          <PrescriptionModal 
            isOpen={isPrescriptionModalOpen} 
            onClose={closePrescriptionModal} 
            prescriptionData={prescriptionData} 
            handlePrescriptionChange={handlePrescriptionChange} 
            doctorSettings={doctorSettings}
            activePatient={activePatient} // Pass activePatient
          />
        )}
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={closeSettingsModal} 
          doctorSettings={doctorSettings} 
          setDoctorSettings={setDoctorSettings} 
        />
        <AddPatientModal 
          isOpen={isAddPatientModalOpen}
          onClose={closeAddPatientModal}
          onPatientAdded={handlePatientSelected} // Use the same handler
        />
        <SelectPatientModal 
          isOpen={isSelectPatientModalOpen}
          onClose={closeSelectPatientModal}
          onPatientSelected={handlePatientSelected}
        />
      </MainContainer> 
    </>
  );
}

// Componente principal que gerencia o roteamento
function AppWrapper() {
  const { loadingAuthState } = useAuth();

  if (loadingAuthState) {
    return <LoadingMessage>Inicializando aplicação...</LoadingMessage>;
  }

  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<ChatPageContent />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}
